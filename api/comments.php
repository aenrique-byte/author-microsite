<?php
require_once 'config.php';

// GET comments for a specific chapter
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $storyId = $_GET['story_id'] ?? '';
    $chapterId = $_GET['chapter_id'] ?? '';
    
    if (empty($storyId) || empty($chapterId)) {
        http_response_code(400);
        echo json_encode(['error' => 'story_id and chapter_id are required']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("
            SELECT id, comment_text, author_name, created_at 
            FROM chapter_comments 
            WHERE story_id = ? AND chapter_id = ? AND is_approved = 1 
            ORDER BY created_at ASC
        ");
        $stmt->execute([$storyId, $chapterId]);
        $comments = $stmt->fetchAll();
        
        // Format dates for display
        foreach ($comments as &$comment) {
            $comment['created_at'] = date('M j, Y \a\t g:i A', strtotime($comment['created_at']));
        }
        
        echo json_encode(['comments' => $comments]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch comments']);
    }
}
?>
