<?php
/**
 * CritiqueRoom Logout
 *
 * POST /api/critiqueroom/auth/logout.php
 *
 * Logs out the Discord user by removing them from the session
 */

require_once __DIR__ . '/../../bootstrap.php';

header('Content-Type: application/json');

// Allow POST or GET for logout (flexibility)
require_method(['POST', 'GET']);

unset($_SESSION['discord_user']);

json_response([
    'success' => true,
    'message' => 'Logged out successfully'
]);
