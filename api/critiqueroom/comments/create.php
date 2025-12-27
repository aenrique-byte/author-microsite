<?php
/**
 * CritiqueRoom Comment Create API
 *
 * POST /api/critiqueroom/comments/create.php
 *
 * Request Body (JSON):
 * - sessionId: string (required)
 * - paragraphIndex: int (required)
 * - startOffset: int (optional, for inline comments)
 * - endOffset: int (optional, for inline comments)
 * - textSelection: string (optional, highlighted text)
 * - content: string (required, comment text)
 * - authorName: string (required, flower name or Discord username)
 */

require_once __DIR__ . '/../../bootstrap.php';

header('Content-Type: application/json');

// Only allow POST requests
require_method(['POST']);

// Rate limit: 10 comments per minute
requireRateLimit('critiqueroom:comment:create', CRITIQUEROOM_RATE_LIMIT_COMMENTS, 60);

try {
    $pdo = db();
    $input = body_json();

    // Validate required fields
    if (!isset($input['sessionId'])) {
        json_error('Missing session ID', 400);
    }
    if (!isset($input['paragraphIndex'])) {
        json_error('Missing paragraph index', 400);
    }
    if (!isset($input['content']) || trim($input['content']) === '') {
        json_error('Comment content is required', 400);
    }
    if (!isset($input['authorName']) || trim($input['authorName']) === '') {
        json_error('Author name is required', 400);
    }

    // Verify session exists
    $stmt = $pdo->prepare("SELECT id FROM critiqueroom_sessions WHERE id = ?");
    $stmt->execute([$input['sessionId']]);
    if (!$stmt->fetch()) {
        json_error('Session not found', 404);
    }

    // Generate UUID for comment
    $commentId = sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );

    $timestamp = round(microtime(true) * 1000);

    // Get Discord user ID if logged in
    $discordId = $_SESSION['discord_user']['id'] ?? null;

    // Insert comment
    $stmt = $pdo->prepare("
        INSERT INTO critiqueroom_comments
        (id, session_id, paragraph_index, start_offset, end_offset, text_selection,
         content, author_name, author_discord_id, timestamp, status, rating)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', NULL)
    ");

    $stmt->execute([
        $commentId,
        $input['sessionId'],
        (int)$input['paragraphIndex'],
        $input['startOffset'] ?? null,
        $input['endOffset'] ?? null,
        isset($input['textSelection']) ? trim($input['textSelection']) : null,
        trim(strip_tags($input['content'])),  // Strip HTML but don't htmlspecialchars - React handles XSS
        trim(strip_tags($input['authorName'])),
        $discordId,
        $timestamp
    ]);

    json_response([
        'id' => $commentId,
        'timestamp' => $timestamp
    ], 201);

} catch (PDOException $e) {
    error_log('Failed to create comment: ' . $e->getMessage());
    json_error('Failed to create comment', 500);
}
