<?php
/**
 * CritiqueRoom Comment Update API
 *
 * PUT /api/critiqueroom/comments/update.php
 *
 * Request Body (JSON):
 * - commentId: string (required)
 * - status: string (optional: "open"|"resolved"|"implemented")
 * - rating: string (optional: "useful"|"irrelevant"|"unclear")
 *
 * Note: Only the session author can update comment status/rating
 */

require_once __DIR__ . '/../../bootstrap.php';

header('Content-Type: application/json');

// Only allow PUT requests
require_method(['PUT']);

// Rate limit: 20 requests per minute
requireRateLimit('critiqueroom:comment:update', 20, 60);

try {
    $pdo = db();
    $input = body_json();

    if (!isset($input['commentId'])) {
        json_error('Missing comment ID', 400);
    }

    $commentId = $input['commentId'];

    // Fetch comment and verify session ownership
    $stmt = $pdo->prepare("
        SELECT c.id, s.author_id
        FROM critiqueroom_comments c
        JOIN critiqueroom_sessions s ON c.session_id = s.id
        WHERE c.id = ?
    ");
    $stmt->execute([$commentId]);
    $comment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$comment) {
        json_error('Comment not found', 404);
    }

    // Verify authorship - either via Discord or local author token
    $isAuthor = false;
    
    // Check Discord auth first
    if (isset($_SESSION['discord_user']) && $comment['author_id'] === $_SESSION['discord_user']['id']) {
        $isAuthor = true;
    }
    
    // Check local author token (works for all sessions - client proves ownership by having sessionId in localStorage)
    // This is a fallback for when Discord session isn't available or for anonymous sessions
    $localAuthorHeader = $_SERVER['HTTP_X_LOCAL_AUTHOR'] ?? null;
    if (!$isAuthor && $localAuthorHeader) {
        // Verify the provided session ID matches the comment's session
        $stmt = $pdo->prepare("SELECT session_id FROM critiqueroom_comments WHERE id = ?");
        $stmt->execute([$commentId]);
        $commentData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($commentData && $commentData['session_id'] === $localAuthorHeader) {
            // Session ID matches - the user created this session (they have it stored in localStorage)
            $isAuthor = true;
        }
    }
    
    if (!$isAuthor) {
        json_error('You can only update comments on your own sessions', 403);
    }

    // Build update query
    $updates = [];
    $params = [];

    if (isset($input['status'])) {
        $validStatuses = ['open', 'resolved', 'implemented'];
        if (!in_array($input['status'], $validStatuses, true)) {
            json_error('Invalid status value', 400);
        }
        $updates[] = 'status = ?';
        $params[] = $input['status'];
    }

    if (isset($input['rating'])) {
        $validRatings = ['useful', 'irrelevant', 'unclear', null];
        if (!in_array($input['rating'], $validRatings, true)) {
            json_error('Invalid rating value', 400);
        }
        $updates[] = 'rating = ?';
        $params[] = $input['rating'];
    }

    if (empty($updates)) {
        json_error('No fields to update', 400);
    }

    // Add comment ID to params
    $params[] = $commentId;

    // Execute update
    $sql = "UPDATE critiqueroom_comments SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    json_response([
        'success' => true,
        'message' => 'Comment updated successfully'
    ]);

} catch (PDOException $e) {
    error_log('Failed to update comment: ' . $e->getMessage());
    json_error('Failed to update comment', 500);
}
