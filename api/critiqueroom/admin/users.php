<?php
/**
 * CritiqueRoom Admin - List Discord Users
 *
 * GET /api/critiqueroom/admin/users.php
 *
 * Returns all cached Discord users
 * Requires main admin authentication
 */

require_once __DIR__ . '/../../bootstrap.php';

header('Content-Type: application/json');

// Require main admin auth (not Discord auth)
requireAuth();

try {
    $pdo = db();

    // Get all Discord users with session count
    $stmt = $pdo->query("
        SELECT
            u.discord_id,
            u.username,
            u.discriminator,
            u.global_name,
            u.avatar_hash,
            u.cached_at,
            (SELECT COUNT(*) FROM critiqueroom_sessions WHERE author_discord_id = u.discord_id) as session_count
        FROM critiqueroom_discord_users u
        ORDER BY u.cached_at DESC
    ");

    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format user data
    foreach ($users as &$user) {
        $user['session_count'] = (int)$user['session_count'];
        $user['display_name'] = $user['global_name'] ?: $user['username'];

        // Build avatar URL if avatar hash exists
        if ($user['avatar_hash']) {
            $user['avatar_url'] = "https://cdn.discordapp.com/avatars/{$user['discord_id']}/{$user['avatar_hash']}.png?size=128";
        } else {
            $user['avatar_url'] = null;
        }
    }

    json_response([
        'users' => $users
    ]);

} catch (PDOException $e) {
    error_log('CritiqueRoom admin users error: ' . $e->getMessage());
    json_error('Failed to fetch users', 500);
}
