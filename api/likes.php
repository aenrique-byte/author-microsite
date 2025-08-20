<?php
require_once 'config.php';

// Handle both GET (get likes count) and POST (add like)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // GET likes count for a chapter
    $storyId = $_GET['story_id'] ?? '';
    $chapterId = $_GET['chapter_id'] ?? '';
    
    if (empty($storyId) || empty($chapterId)) {
        http_response_code(400);
        echo json_encode(['error' => 'story_id and chapter_id are required']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as like_count 
            FROM chapter_likes 
            WHERE story_id = ? AND chapter_id = ?
        ");
        $stmt->execute([$storyId, $chapterId]);
        $result = $stmt->fetch();
        
        // Check if current user has liked this chapter
        $clientIP = getClientIP();
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as user_liked 
            FROM chapter_likes 
            WHERE story_id = ? AND chapter_id = ? AND ip_address = ?
        ");
        $stmt->execute([$storyId, $chapterId, $clientIP]);
        $userLiked = $stmt->fetch();
        
        echo json_encode([
            'like_count' => (int)$result['like_count'],
            'user_liked' => (bool)$userLiked['user_liked']
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch likes']);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // POST new like or remove existing like
    $input = json_decode(file_get_contents('php://input'), true);
    
    $storyId = $input['story_id'] ?? '';
    $chapterId = $input['chapter_id'] ?? '';
    
    if (empty($storyId) || empty($chapterId)) {
        http_response_code(400);
        echo json_encode(['error' => 'story_id and chapter_id are required']);
        exit;
    }
    
    $clientIP = getClientIP();
    
    try {
        // Check if user already liked this chapter
        $stmt = $pdo->prepare("
            SELECT id FROM chapter_likes 
            WHERE story_id = ? AND chapter_id = ? AND ip_address = ?
        ");
        $stmt->execute([$storyId, $chapterId, $clientIP]);
        $existingLike = $stmt->fetch();
        
        if ($existingLike) {
            // Remove like (unlike)
            $stmt = $pdo->prepare("
                DELETE FROM chapter_likes 
                WHERE story_id = ? AND chapter_id = ? AND ip_address = ?
            ");
            $stmt->execute([$storyId, $chapterId, $clientIP]);
            $action = 'unliked';
        } else {
            // Add like
            $stmt = $pdo->prepare("
                INSERT INTO chapter_likes (story_id, chapter_id, ip_address) 
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$storyId, $chapterId, $clientIP]);
            $action = 'liked';
        }
        
        // Get updated count
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as like_count 
            FROM chapter_likes 
            WHERE story_id = ? AND chapter_id = ?
        ");
        $stmt->execute([$storyId, $chapterId]);
        $result = $stmt->fetch();
        
        echo json_encode([
            'success' => true,
            'action' => $action,
            'like_count' => (int)$result['like_count'],
            'user_liked' => $action === 'liked'
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to process like']);
    }
}
?>
