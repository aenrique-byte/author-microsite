<?php
/**
 * CritiqueRoom Discord OAuth Initiation
 *
 * GET /api/critiqueroom/auth/discord.php?return_to={url}
 *
 * Initiates Discord OAuth flow by redirecting to Discord authorization page
 *
 * Query Parameters:
 * - return_to: string (optional, URL to redirect to after login)
 */

require_once __DIR__ . '/../../bootstrap.php';

// Generate CSRF state token
$state = bin2hex(random_bytes(32));
$_SESSION['discord_oauth_state'] = $state;

// Store return URL if provided
if (isset($_GET['return_to'])) {
    $_SESSION['discord_oauth_return'] = $_GET['return_to'];
}

// Build Discord authorization URL
$params = [
    'client_id' => DISCORD_CLIENT_ID,
    'redirect_uri' => DISCORD_REDIRECT_URI,
    'response_type' => 'code',
    'scope' => 'identify',
    'state' => $state
];

$authUrl = 'https://discord.com/api/oauth2/authorize?' . http_build_query($params);

header('Location: ' . $authUrl);
exit;
