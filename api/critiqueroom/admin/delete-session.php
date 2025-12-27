<?php
/**
 * CritiqueRoom Admin - Delete Session
 *
 * DELETE /api/critiqueroom/admin/delete-session.php
 * Body: { "session_id": "ABC123" }
 *
 * Deletes a critique session and all associated data (comments, replies, feedback)
 * Requires main admin authentication
 */

require_once __DIR__ . '/../../bootstrap.php';

header('Content-Type: application/json');

// Only allow DELETE requests
require_method(['DELETE']);

// Require main admin auth (not Discord auth)
requireAuth();

// Get request body
$data = body_json();

if (empty($data['session_id'])) {
    json_error('Missing session_id', 400);
}

$sessionId = $data['session_id'];

try {
    $pdo = db();

    // Start transaction
    $pdo->beginTransaction();

    // Check if session exists
    $stmt = $pdo->prepare("SELECT id, title FROM critiqueroom_sessions WHERE id = ?");
    $stmt->execute([$sessionId]);
    $session = $stmt->fetch();

    if (!$session) {
        $pdo->rollBack();
        json_error('Session not found', 404);
    }

    // Delete session (CASCADE will handle comments, replies, and feedback)
    $stmt = $pdo->prepare("DELETE FROM critiqueroom_sessions WHERE id = ?");
    $stmt->execute([$sessionId]);

    // Commit transaction
    $pdo->commit();

    // Log the deletion
    error_log(sprintf(
        "[CritiqueRoom Admin] Session deleted by admin (user_id: %s): %s - %s",
        $_SESSION['user_id'],
        $sessionId,
        $session['title']
    ));

    json_response([
        'success' => true,
        'message' => 'Session deleted successfully',
        'deleted_session' => [
            'id' => $sessionId,
            'title' => $session['title']
        ]
    ]);

} catch (PDOException $e) {
    // Rollback on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('CritiqueRoom admin delete session error: ' . $e->getMessage());
    json_error('Failed to delete session', 500);
}
