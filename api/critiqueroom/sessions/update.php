<?php
/**
 * CritiqueRoom Session Update API
 *
 * PUT /api/critiqueroom/sessions/update.php
 *
 * Request Body (JSON):
 * - id: string (required, session UUID)
 * - title: string (optional)
 * - content: string (optional)
 * - modes: array (optional)
 * - questions: array (optional)
 * - sections: array (optional)
 * - expiration: string (optional)
 * - fontCombo: string (optional)
 *
 * Note: Only the session author can update
 */

require_once __DIR__ . '/../../bootstrap.php';

header('Content-Type: application/json');

// Only allow PUT requests
require_method(['PUT']);

// Rate limit: 10 requests per minute
requireRateLimit('critiqueroom:session:update', 10, 60);

try {
    $pdo = db();
    $input = body_json();

    if (!isset($input['id'])) {
        json_error('Missing session ID', 400);
    }

    $sessionId = $input['id'];

    // Fetch session to verify ownership (using author_discord_id)
    $stmt = $pdo->prepare("SELECT author_discord_id FROM critiqueroom_sessions WHERE id = ?");
    $stmt->execute([$sessionId]);
    $session = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$session) {
        json_error('Session not found', 404);
    }

    // Verify user is logged in via Discord and is the author
    if (!isset($_SESSION['discord_user'])) {
        json_error('Authentication required', 401);
    }

    if ($session['author_discord_id'] !== $_SESSION['discord_user']['id']) {
        json_error('You can only update your own sessions', 403);
    }

    // Build update query dynamically based on provided fields
    $updates = [];
    $params = [];

    if (isset($input['title'])) {
        $updates[] = 'title = ?';
        $params[] = sanitizeInput($input['title']);
    }

    if (isset($input['content'])) {
        if (strlen($input['content']) > CRITIQUEROOM_MAX_SESSION_SIZE) {
            json_error('Content too large (max 500KB)', 413);
        }
        $updates[] = 'content = ?';
        $params[] = $input['content'];
    }

    if (isset($input['modes']) && is_array($input['modes'])) {
        $updates[] = 'modes = ?';
        $params[] = json_encode($input['modes']);
    }

    if (isset($input['questions']) && is_array($input['questions'])) {
        $updates[] = 'questions = ?';
        $params[] = json_encode($input['questions']);
    }

    if (isset($input['sections']) && is_array($input['sections'])) {
        $updates[] = 'sections = ?';
        $params[] = json_encode($input['sections']);
    }

    if (isset($input['expiration'])) {
        $validExpirations = ['24 Hours', '72 Hours', '7 Days', 'No Expiration'];
        if (!in_array($input['expiration'], $validExpirations, true)) {
            json_error('Invalid expiration value', 400);
        }
        $updates[] = 'expiration = ?';
        $params[] = $input['expiration'];

        // Recalculate expires_at
        $createdAt = round(microtime(true) * 1000);
        $expiresAt = null;
        switch ($input['expiration']) {
            case '24 Hours':
                $expiresAt = $createdAt + (24 * 60 * 60 * 1000);
                break;
            case '72 Hours':
                $expiresAt = $createdAt + (72 * 60 * 60 * 1000);
                break;
            case '7 Days':
                $expiresAt = $createdAt + (7 * 24 * 60 * 60 * 1000);
                break;
        }
        $updates[] = 'expires_at = ?';
        $params[] = $expiresAt;
    }

    if (isset($input['fontCombo'])) {
        $validFonts = ['LITERARY', 'MODERN', 'PAPERBACK'];
        if (!in_array($input['fontCombo'], $validFonts, true)) {
            json_error('Invalid font combo', 400);
        }
        $updates[] = 'font_combo = ?';
        $params[] = $input['fontCombo'];
    }

    if (empty($updates)) {
        json_error('No fields to update', 400);
    }

    // Add session ID to params
    $params[] = $sessionId;

    // Execute update
    $sql = "UPDATE critiqueroom_sessions SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    json_response([
        'success' => true,
        'message' => 'Session updated successfully'
    ]);

} catch (PDOException $e) {
    error_log('Failed to update critique session: ' . $e->getMessage());
    json_error('Failed to update session', 500);
}
