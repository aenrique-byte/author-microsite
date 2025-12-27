<?php
/**
 * CritiqueRoom Admin - Get Statistics
 *
 * GET /api/critiqueroom/admin/stats.php
 *
 * Returns overall statistics for CritiqueRoom
 * Requires main admin authentication
 */

require_once __DIR__ . '/../../bootstrap.php';

header('Content-Type: application/json');

// Require main admin auth (not Discord auth)
requireAuth();

try {
    $pdo = db();

    // Get total sessions count
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM critiqueroom_sessions");
    $totalSessions = $stmt->fetch()['count'];

    // Get active sessions (not expired)
    $now = round(microtime(true) * 1000);
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count
        FROM critiqueroom_sessions
        WHERE expires_at IS NULL OR expires_at > ?
    ");
    $stmt->execute([$now]);
    $activeSessions = $stmt->fetch()['count'];

    // Get expired sessions
    $expiredSessions = $totalSessions - $activeSessions;

    // Get total comments
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM critiqueroom_comments");
    $totalComments = $stmt->fetch()['count'];

    // Get total Discord users
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM critiqueroom_discord_users");
    $totalUsers = $stmt->fetch()['count'];

    // Get sessions created in last 24 hours
    $oneDayAgo = round((microtime(true) - 86400) * 1000);
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count
        FROM critiqueroom_sessions
        WHERE created_at > ?
    ");
    $stmt->execute([$oneDayAgo]);
    $sessionsLast24h = $stmt->fetch()['count'];

    // Get comments in last 24 hours
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count
        FROM critiqueroom_comments
        WHERE timestamp > ?
    ");
    $stmt->execute([$oneDayAgo]);
    $commentsLast24h = $stmt->fetch()['count'];

    json_response([
        'stats' => [
            'total_sessions' => (int)$totalSessions,
            'active_sessions' => (int)$activeSessions,
            'expired_sessions' => (int)$expiredSessions,
            'total_comments' => (int)$totalComments,
            'total_users' => (int)$totalUsers,
            'sessions_24h' => (int)$sessionsLast24h,
            'comments_24h' => (int)$commentsLast24h,
        ]
    ]);

} catch (PDOException $e) {
    error_log('CritiqueRoom admin stats error: ' . $e->getMessage());
    json_error('Failed to fetch statistics', 500);
}
