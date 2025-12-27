<?php
/**
 * CritiqueRoom Session Extend API
 *
 * POST /api/critiqueroom/sessions/extend.php
 *
 * Extends a session's expiration by 7 days (max 3 extensions per session)
 *
 * Request Body (JSON):
 * - sessionId: string (required)
 *
 * Note: Only session author can extend (Discord auth required or local author token)
 */

require_once __DIR__ . '/../../bootstrap.php';

header('Content-Type: application/json');

// Only allow POST requests
require_method(['POST']);

try {
    $pdo = db();
    $input = body_json();

    if (!isset($input['sessionId'])) {
        json_error('Missing session ID', 400);
    }

    $sessionId = $input['sessionId'];

    // Fetch session
    $stmt = $pdo->prepare("SELECT * FROM critiqueroom_sessions WHERE id = ?");
    $stmt->execute([$sessionId]);
    $session = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$session) {
        json_error('Session not found', 404);
    }

    // Verify ownership - either Discord user or check local author token
    $isAuthor = false;
    
    // Check Discord auth
    if (isset($_SESSION['discord_user']) && $session['author_discord_id'] === $_SESSION['discord_user']['id']) {
        $isAuthor = true;
    }
    
    // Check local author token from header (for anonymous authors)
    $authHeader = $_SERVER['HTTP_X_LOCAL_AUTHOR'] ?? null;
    if ($authHeader === $sessionId) {
        $isAuthor = true;
    }

    if (!$isAuthor) {
        json_error('Only the session author can extend expiration', 403);
    }

    // Check if session has "No Expiration"
    if ($session['expires_at'] === null) {
        json_error('Permanent sessions cannot be extended', 400);
    }

    // Check extension limit (max 3)
    $extensionCount = (int)($session['extension_count'] ?? 0);
    if ($extensionCount >= 3) {
        json_error('Maximum extensions reached (3/3)', 400);
    }

    // Add 7 days (in milliseconds)
    $now = round(microtime(true) * 1000);
    $sevenDays = 7 * 24 * 60 * 60 * 1000;
    
    // Extend from current expiration or from now if already expired
    $currentExpires = (int)$session['expires_at'];
    $newExpiresAt = max($now, $currentExpires) + $sevenDays;
    $newExtensionCount = $extensionCount + 1;

    // Update session
    $stmt = $pdo->prepare("
        UPDATE critiqueroom_sessions
        SET expires_at = ?, extension_count = ?
        WHERE id = ?
    ");
    $stmt->execute([$newExpiresAt, $newExtensionCount, $sessionId]);

    json_response([
        'success' => true,
        'newExpiresAt' => $newExpiresAt,
        'extensionCount' => $newExtensionCount,
        'extensionsRemaining' => 3 - $newExtensionCount
    ]);

} catch (PDOException $e) {
    error_log('Failed to extend session: ' . $e->getMessage());
    json_error('Failed to extend session', 500);
}
