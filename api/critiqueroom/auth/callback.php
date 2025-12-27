<?php
/**
 * CritiqueRoom Discord OAuth Callback
 *
 * GET /api/critiqueroom/auth/callback.php?code={code}&state={state}
 *
 * Handles the OAuth callback from Discord, exchanges code for token,
 * fetches user info, and stores in session
 */

require_once __DIR__ . '/../../bootstrap.php';

// Verify state parameter (CSRF protection)
if (!isset($_GET['state']) || !isset($_SESSION['discord_oauth_state']) || $_GET['state'] !== $_SESSION['discord_oauth_state']) {
    http_response_code(403);
    die('Invalid state parameter. Possible CSRF attack.');
}

// Check for error from Discord
if (isset($_GET['error'])) {
    http_response_code(400);
    die('Discord OAuth error: ' . htmlspecialchars($_GET['error']));
}

// Verify code parameter
if (!isset($_GET['code'])) {
    http_response_code(400);
    die('Missing authorization code');
}

$code = $_GET['code'];

// Exchange code for access token
$tokenData = [
    'client_id' => DISCORD_CLIENT_ID,
    'client_secret' => DISCORD_CLIENT_SECRET,
    'grant_type' => 'authorization_code',
    'code' => $code,
    'redirect_uri' => DISCORD_REDIRECT_URI
];

$ch = curl_init('https://discord.com/api/v10/oauth2/token');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query($tokenData),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded']
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    error_log('Discord token exchange failed: ' . $response);
    http_response_code(500);
    die('Failed to exchange code for token');
}

$tokenResponse = json_decode($response, true);
$accessToken = $tokenResponse['access_token'];

// Fetch user info
$ch = curl_init('https://discord.com/api/v10/users/@me');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $accessToken]
]);

$userResponse = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    error_log('Discord user fetch failed: ' . $userResponse);
    http_response_code(500);
    die('Failed to fetch user info');
}

$discordUser = json_decode($userResponse, true);

// Cache user in database (optional)
try {
    $pdo = db();
    $stmt = $pdo->prepare("
        INSERT INTO critiqueroom_discord_users (discord_id, username, discriminator, global_name, avatar_hash)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            username = VALUES(username),
            discriminator = VALUES(discriminator),
            global_name = VALUES(global_name),
            avatar_hash = VALUES(avatar_hash),
            cached_at = CURRENT_TIMESTAMP
    ");

    $stmt->execute([
        $discordUser['id'],
        $discordUser['username'],
        $discordUser['discriminator'] ?? '0',
        $discordUser['global_name'] ?? null,
        $discordUser['avatar'] ?? null
    ]);
} catch (PDOException $e) {
    error_log('Failed to cache Discord user: ' . $e->getMessage());
    // Continue even if caching fails
}

// Store in session
$_SESSION['discord_user'] = [
    'id' => $discordUser['id'],
    'username' => $discordUser['username'],
    'discriminator' => $discordUser['discriminator'] ?? '0',
    'global_name' => $discordUser['global_name'] ?? null,
    'avatar' => $discordUser['avatar'] ?? null,
    'display_name' => $discordUser['global_name'] ?? $discordUser['username']
];

// Redirect back to CritiqueRoom
$returnUrl = $_SESSION['discord_oauth_return'] ?? '/critiqueroom/';
unset($_SESSION['discord_oauth_state']);
unset($_SESSION['discord_oauth_return']);

header('Location: ' . $returnUrl);
exit;
