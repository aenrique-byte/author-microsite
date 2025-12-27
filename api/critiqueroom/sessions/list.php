<?php
/**
 * CritiqueRoom Session List API
 *
 * GET /api/critiqueroom/sessions/list.php
 *
 * Returns all sessions created by the currently logged-in Discord user
 *
 * Note: Requires Discord authentication
 */

require_once __DIR__ . '/../../bootstrap.php';

header('Content-Type: application/json');

// Only allow GET requests
require_method(['GET']);

// Rate limit: 20 requests per minute
requireRateLimit('critiqueroom:session:list', 20, 60);

try {
    $pdo = db();

    // Verify user is logged in via Discord
    if (!isset($_SESSION['discord_user'])) {
        json_error('Authentication required', 401);
    }

    $authorDiscordId = $_SESSION['discord_user']['id'];

    // Fetch all sessions by this author (using author_discord_id VARCHAR column)
    $stmt = $pdo->prepare("
        SELECT
            id, title, content, author_name, modes, questions, sections,
            expiration, font_combo, password_hash,
            created_at, expires_at
        FROM critiqueroom_sessions
        WHERE author_discord_id = ?
        ORDER BY created_at DESC
    ");
    $stmt->execute([$authorDiscordId]);
    $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $now = round(microtime(true) * 1000);
    $result = [];

    foreach ($sessions as $session) {
        // Fetch comments for this session
        $commentStmt = $pdo->prepare("
            SELECT id, paragraph_index, start_offset, end_offset, text_selection,
                   content, author_name, author_discord_id, timestamp, status, rating
            FROM critiqueroom_comments
            WHERE session_id = ?
            ORDER BY paragraph_index, timestamp
        ");
        $commentStmt->execute([$session['id']]);
        $comments = $commentStmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch replies for each comment
        $formattedComments = [];
        foreach ($comments as $comment) {
            $replyStmt = $pdo->prepare("
                SELECT id, author_name, author_discord_id, content, timestamp
                FROM critiqueroom_replies
                WHERE comment_id = ?
                ORDER BY timestamp
            ");
            $replyStmt->execute([$comment['id']]);
            $replies = $replyStmt->fetchAll(PDO::FETCH_ASSOC);

            $formattedReplies = [];
            foreach ($replies as $reply) {
                $formattedReplies[] = [
                    'id' => $reply['id'],
                    'author' => $reply['author_name'],
                    'authorDiscordId' => $reply['author_discord_id'],
                    'content' => $reply['content'],
                    'timestamp' => (int)$reply['timestamp']
                ];
            }

            $formattedComments[] = [
                'id' => $comment['id'],
                'paragraphIndex' => (int)$comment['paragraph_index'],
                'startOffset' => $comment['start_offset'] !== null ? (int)$comment['start_offset'] : null,
                'endOffset' => $comment['end_offset'] !== null ? (int)$comment['end_offset'] : null,
                'textSelection' => $comment['text_selection'],
                'content' => $comment['content'],
                'author' => $comment['author_name'],
                'authorDiscordId' => $comment['author_discord_id'],
                'timestamp' => (int)$comment['timestamp'],
                'status' => $comment['status'] ?? 'open',
                'rating' => $comment['rating'],
                'replies' => $formattedReplies
            ];
        }

        // Fetch global feedback for this session
        $feedbackStmt = $pdo->prepare("
            SELECT id, category, text, author_name, author_discord_id, timestamp
            FROM critiqueroom_global_feedback
            WHERE session_id = ?
            ORDER BY timestamp
        ");
        $feedbackStmt->execute([$session['id']]);
        $feedbacks = $feedbackStmt->fetchAll(PDO::FETCH_ASSOC);

        $formattedFeedbacks = [];
        foreach ($feedbacks as $feedback) {
            $formattedFeedbacks[] = [
                'id' => (int)$feedback['id'],
                'category' => $feedback['category'],
                'text' => $feedback['text'],
                'author' => $feedback['author_name'],
                'authorDiscordId' => $feedback['author_discord_id'],
                'timestamp' => (int)$feedback['timestamp']
            ];
        }

        // Format session with camelCase keys matching frontend Session type
        $result[] = [
            'id' => $session['id'],
            'title' => $session['title'],
            'content' => $session['content'],
            'authorName' => $session['author_name'],
            'modes' => json_decode($session['modes'], true) ?? [],
            'questions' => json_decode($session['questions'], true) ?? [],
            'sections' => json_decode($session['sections'], true) ?? [],
            'expiration' => $session['expiration'],
            'fontCombo' => $session['font_combo'],
            'createdAt' => (int)$session['created_at'],
            'expiresAt' => $session['expires_at'] ? (int)$session['expires_at'] : null,
            'comments' => $formattedComments,
            'globalFeedback' => $formattedFeedbacks,
            'passwordProtected' => !empty($session['password_hash'])
        ];
    }

    // Return array directly (not wrapped in object) to match frontend expectation
    json_response($result);

} catch (PDOException $e) {
    error_log('Failed to list critique sessions: ' . $e->getMessage());
    json_error('Failed to list sessions', 500);
}
