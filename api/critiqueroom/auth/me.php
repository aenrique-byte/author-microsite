<?php
/**
 * CritiqueRoom Get Current User
 *
 * GET /api/critiqueroom/auth/me.php
 *
 * Returns the currently logged-in Discord user, or 401 if not authenticated
 */

require_once __DIR__ . '/../../bootstrap.php';

header('Content-Type: application/json');

// Only allow GET requests
require_method(['GET']);

if (!isset($_SESSION['discord_user'])) {
    json_error('Not authenticated', 401);
}

// Convert snake_case session keys to camelCase for frontend
$user = $_SESSION['discord_user'];
json_response([
    'user' => [
        'id' => $user['id'],
        'username' => $user['username'],
        'discriminator' => $user['discriminator'] ?? '0',
        'globalName' => $user['global_name'] ?? null,
        'avatar' => $user['avatar'] ?? null,
        'displayName' => $user['display_name'] ?? $user['global_name'] ?? $user['username']
    ]
]);
