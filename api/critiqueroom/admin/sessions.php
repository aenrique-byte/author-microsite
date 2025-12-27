<?php
/**
 * CritiqueRoom Admin - List All Sessions
 *
 * GET /api/critiqueroom/admin/sessions.php
 *
 * Returns all critique sessions with metadata
 * Requires main admin authentication
 */

require_once __DIR__ . '/../../bootstrap.php';

header('Content-Type: application/json');

// Require main admin auth (not Discord auth)
requireAuth();

try {
    $pdo = db();
    $now = round(microtime(true) * 1000);

    // Get all sessions with author info
    $stmt = $pdo->query("
        SELECT
            s.id,
            s.title,
            s.author_name,
            s.author_discord_id,
            s.created_at,
            s.expires_at,
            CASE WHEN s.password_hash IS NOT NULL THEN 1 ELSE 0 END as is_password_protected,
            COALESCE(s.extension_count, 0) as extension_count,
            (SELECT COUNT(*) FROM critiqueroom_comments WHERE session_id = s.id) as comment_count,
            CASE
                WHEN s.expires_at IS NULL THEN 'permanent'
                WHEN s.expires_at < {$now} THEN 'expired'
                ELSE 'active'
            END as status
        FROM critiqueroom_sessions s
        ORDER BY s.created_at DESC
    ");

    $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Convert numeric strings to integers
    foreach ($sessions as &$session) {
        $session['created_at'] = (int)$session['created_at'];
        $session['expires_at'] = $session['expires_at'] ? (int)$session['expires_at'] : null;
        $session['is_password_protected'] = (bool)$session['is_password_protected'];
        $session['extension_count'] = (int)$session['extension_count'];
        $session['comment_count'] = (int)$session['comment_count'];
    }

    json_response([
        'sessions' => $sessions
    ]);

} catch (PDOException $e) {
    error_log('CritiqueRoom admin sessions error: ' . $e->getMessage());
    json_error('Failed to fetch sessions', 500);
}
