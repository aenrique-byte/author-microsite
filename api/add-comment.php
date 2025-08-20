<?php
require_once 'config.php';

// POST new comment
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $storyId = $input['story_id'] ?? '';
    $chapterId = $input['chapter_id'] ?? '';
    $commentText = trim($input['comment_text'] ?? '');
    $authorName = trim($input['author_name'] ?? 'Anonymous');
    
    // Validation
    if (empty($storyId) || empty($chapterId) || empty($commentText)) {
        http_response_code(400);
        echo json_encode(['error' => 'story_id, chapter_id, and comment_text are required']);
        exit;
    }
    
    if (strlen($commentText) > 1000) {
        http_response_code(400);
        echo json_encode(['error' => 'Comment too long (max 1000 characters)']);
        exit;
    }
    
    if (strlen($authorName) > 100) {
        $authorName = substr($authorName, 0, 100);
    }
    
    $clientIP = getClientIP();
    
    // Check if IP is banned
    try {
        $stmt = $pdo->prepare("SELECT ip_address FROM banned_ips WHERE ip_address = ?");
        $stmt->execute([$clientIP]);
        if ($stmt->fetch()) {
            http_response_code(403);
            echo json_encode(['error' => 'Your IP address has been banned from commenting.']);
            exit;
        }
    } catch (PDOException $e) {
        // Table might not exist yet, continue
    }
    
    // Rate limiting - max 5 comments per 5 minutes
    if (!checkRateLimit($clientIP, 'comment', 5, 300)) {
        http_response_code(429);
        echo json_encode(['error' => 'Too many comments. Please wait before commenting again.']);
        exit;
    }
    
    // Enhanced spam detection
    $spamWords = ['viagra', 'casino', 'lottery', 'winner', 'click here', 'free money', 'buy now', 'limited time', 'act now', 'make money', 'work from home'];
    $lowerComment = strtolower($commentText);
    foreach ($spamWords as $spam) {
        if (strpos($lowerComment, $spam) !== false) {
            http_response_code(400);
            echo json_encode(['error' => 'Comment contains prohibited content']);
            exit;
        }
    }
    
    // Check for excessive links (common spam indicator)
    if (substr_count($lowerComment, 'http') > 2) {
        http_response_code(400);
        echo json_encode(['error' => 'Too many links in comment']);
        exit;
    }
    
    // Check for excessive repetition (spam pattern)
    if (strlen($commentText) > 50) {
        $words = explode(' ', $commentText);
        $wordCount = array_count_values($words);
        foreach ($wordCount as $count) {
            if ($count > 5) { // Same word repeated more than 5 times
                http_response_code(400);
                echo json_encode(['error' => 'Comment appears to be spam']);
                exit;
            }
        }
    }
    
    // Simple honeypot check (add hidden field to form)
    if (!empty($input['website'])) { // Bots often fill hidden fields
        http_response_code(400);
        echo json_encode(['error' => 'Spam detected']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO chapter_comments (story_id, chapter_id, comment_text, author_name, ip_address, is_approved) 
            VALUES (?, ?, ?, ?, ?, 1)
        ");
        $stmt->execute([$storyId, $chapterId, $commentText, $authorName, $clientIP]);
        
        echo json_encode([
            'success' => true, 
            'message' => 'Comment posted successfully!'
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save comment']);
    }
}
?>
