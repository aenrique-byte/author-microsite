<?php
/**
 * CritiqueRoom Global Feedback Create API
 *
 * POST /api/critiqueroom/feedback/create.php
 *
 * Request Body (JSON):
 * - sessionId: string (required)
 * - category: string (required: "overall"|"worked"|"didnt-work"|"confusing")
 * - text: string (required)
 * - authorName: string (required, flower name or Discord username)
 */

require_once __DIR__ . '/../../bootstrap.php';

header('Content-Type: application/json');

// Only allow POST requests
require_method(['POST']);

// Rate limit: 10 feedback items per minute
requireRateLimit('critiqueroom:feedback:create', 10, 60);

try {
    $pdo = db();
    $input = body_json();

    // Validate required fields
    if (!isset($input['sessionId'])) {
        json_error('Missing session ID', 400);
    }
    if (!isset($input['category'])) {
        json_error('Missing category', 400);
    }
    if (!isset($input['text']) || trim($input['text']) === '') {
        json_error('Feedback text is required', 400);
    }
    if (!isset($input['authorName']) || trim($input['authorName']) === '') {
        json_error('Author name is required', 400);
    }

    // Validate category
    $validCategories = ['overall', 'worked', 'didnt-work', 'confusing'];
    if (!in_array($input['category'], $validCategories, true)) {
        json_error('Invalid category value', 400);
    }

    // Verify session exists
    $stmt = $pdo->prepare("SELECT id FROM critiqueroom_sessions WHERE id = ?");
    $stmt->execute([$input['sessionId']]);
    if (!$stmt->fetch()) {
        json_error('Session not found', 404);
    }

    $timestamp = round(microtime(true) * 1000);

    // Get Discord user ID if logged in
    $discordId = $_SESSION['discord_user']['id'] ?? null;

    // Insert feedback
    $stmt = $pdo->prepare("
        INSERT INTO critiqueroom_global_feedback
        (session_id, category, text, author_name, author_discord_id, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $input['sessionId'],
        $input['category'],
        sanitizeInput($input['text']),
        sanitizeInput($input['authorName']),
        $discordId,
        $timestamp
    ]);

    json_response([
        'id' => $pdo->lastInsertId(),
        'timestamp' => $timestamp
    ], 201);

} catch (PDOException $e) {
    error_log('Failed to create feedback: ' . $e->getMessage());
    json_error('Failed to create feedback', 500);
}
