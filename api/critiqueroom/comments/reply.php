<?php
/**
 * CritiqueRoom Comment Reply API
 *
 * POST /api/critiqueroom/comments/reply.php
 *
 * Request Body (JSON):
 * - commentId: string (required, parent comment UUID)
 * - content: string (required, reply text)
 * - authorName: string (required, flower name or Discord username)
 */

require_once __DIR__ . '/../../bootstrap.php';

header('Content-Type: application/json');

// Only allow POST requests
require_method(['POST']);

// Rate limit: 15 replies per minute
requireRateLimit('critiqueroom:comment:reply', 15, 60);

try {
    $pdo = db();
    $input = body_json();

    // Validate required fields
    if (!isset($input['commentId'])) {
        json_error('Missing comment ID', 400);
    }
    if (!isset($input['content']) || trim($input['content']) === '') {
        json_error('Reply content is required', 400);
    }
    if (!isset($input['authorName']) || trim($input['authorName']) === '') {
        json_error('Author name is required', 400);
    }

    // Verify comment exists
    $stmt = $pdo->prepare("SELECT id FROM critiqueroom_comments WHERE id = ?");
    $stmt->execute([$input['commentId']]);
    if (!$stmt->fetch()) {
        json_error('Comment not found', 404);
    }

    // Generate UUID for reply
    $replyId = sprintf(
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

    // Insert reply
    $stmt = $pdo->prepare("
        INSERT INTO critiqueroom_replies
        (id, comment_id, author_name, author_discord_id, content, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $replyId,
        $input['commentId'],
        trim(strip_tags($input['authorName'])),
        $discordId,
        trim(strip_tags($input['content'])),  // Strip HTML but don't htmlspecialchars - React handles XSS
        $timestamp
    ]);

    json_response([
        'id' => $replyId,
        'timestamp' => $timestamp
    ], 201);

} catch (PDOException $e) {
    error_log('Failed to create reply: ' . $e->getMessage());
    json_error('Failed to create reply', 500);
}
