<?php
/**
 * CritiqueRoom Session Get API
 *
 * GET /api/critiqueroom/sessions/get.php?id={sessionId}&password={password}
 *
 * Query Parameters:
 * - id: string (required, session UUID)
 * - password: string (optional, required if session is password-protected)
 *
 * Returns:
 * - Session data with comments, replies, and global feedback
 * - isAuthor: boolean (whether current user is the session author)
 * - passwordProtected: boolean
 */

require_once __DIR__ . '/../../bootstrap.php';

header('Content-Type: application/json');

// Only allow GET requests
require_method(['GET']);

// Rate limit: 30 requests per minute
requireRateLimit('critiqueroom:session:get', 30, 60);

try {
    $pdo = db();

    $sessionId = $_GET['id'] ?? null;
    if (!$sessionId) {
        json_error('Missing session ID', 400);
    }

    // Fetch session
    $stmt = $pdo->prepare("SELECT * FROM critiqueroom_sessions WHERE id = ?");
    $stmt->execute([$sessionId]);
    $session = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$session) {
        json_error('Session not found', 404);
    }

    // Check expiration
    if ($session['expires_at'] && $session['expires_at'] < round(microtime(true) * 1000)) {
        json_error('Session expired', 410);
    }

    // Determine if current user is the author (using author_discord_id)
    $isAuthor = false;
    if (isset($_SESSION['discord_user']) && $session['author_discord_id']) {
        $isAuthor = $_SESSION['discord_user']['id'] === $session['author_discord_id'];
    }

    // Check password protection
    $passwordProtected = !empty($session['password_hash']);
    if ($passwordProtected && !$isAuthor) {
        $password = $_GET['password'] ?? null;
        if (!$password || !verifyHash($password, $session['password_hash'])) {
            json_error('Password required', 401, [
                'passwordProtected' => true
            ]);
        }
    }

    // Fetch comments with replies
    $stmt = $pdo->prepare("
        SELECT id, paragraph_index, start_offset, end_offset, text_selection,
               content, author_name, author_discord_id, timestamp, status, rating
        FROM critiqueroom_comments
        WHERE session_id = ?
        ORDER BY paragraph_index, timestamp
    ");
    $stmt->execute([$sessionId]);
    $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch replies for each comment and format with camelCase
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

    // Fetch global feedback
    $stmt = $pdo->prepare("
        SELECT id, category, text, author_name, author_discord_id, timestamp
        FROM critiqueroom_global_feedback
        WHERE session_id = ?
        ORDER BY timestamp
    ");
    $stmt->execute([$sessionId]);
    $feedbacks = $stmt->fetchAll(PDO::FETCH_ASSOC);

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

    // Format response with camelCase keys matching frontend Session type
    json_response([
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
        'isAuthor' => $isAuthor,
        'passwordProtected' => $passwordProtected
    ]);

} catch (PDOException $e) {
    error_log('Failed to fetch critique session: ' . $e->getMessage());
    json_error('Failed to fetch session', 500);
}
