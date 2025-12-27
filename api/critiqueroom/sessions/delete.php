<?php
/**
 * CritiqueRoom Session Delete API
 *
 * DELETE /api/critiqueroom/sessions/delete.php
 *
 * Request Body (JSON):
 * - id: string (required, session UUID)
 *
 * Note: Only the session author can delete
 */

require_once __DIR__ . '/../../bootstrap.php';

header('Content-Type: application/json');

// Only allow DELETE requests
require_method(['DELETE']);

// Rate limit: 10 requests per minute
requireRateLimit('critiqueroom:session:delete', 10, 60);

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
        json_error('You can only delete your own sessions', 403);
    }

    // Delete session (CASCADE will delete comments, replies, and feedback)
    $stmt = $pdo->prepare("DELETE FROM critiqueroom_sessions WHERE id = ?");
    $stmt->execute([$sessionId]);

    json_response([
        'success' => true,
        'message' => 'Session deleted successfully'
    ]);

} catch (PDOException $e) {
    error_log('Failed to delete critique session: ' . $e->getMessage());
    json_error('Failed to delete session', 500);
}
