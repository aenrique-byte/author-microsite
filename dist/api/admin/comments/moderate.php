<?php
require_once '../../bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Check authentication - session already started in bootstrap.php
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['id']) || !isset($input['action'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Comment ID and action are required']);
    exit;
}

$allowedActions = ['approve', 'reject', 'delete'];
if (!in_array($input['action'], $allowedActions)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid action. Must be approve, reject, or delete']);
    exit;
}

try {
    // First, find which table the comment is in
    $commentId = $input['id'];
    $commentTable = null;
    $commentExists = false;

    // Check image_comments table
    $stmt = $pdo->prepare("SELECT id FROM image_comments WHERE id = ?");
    $stmt->execute([$commentId]);
    if ($stmt->fetch()) {
        $commentTable = 'image_comments';
        $commentExists = true;
    } else {
        // Check chapter_comments table
        $stmt = $pdo->prepare("SELECT id FROM chapter_comments WHERE id = ?");
        $stmt->execute([$commentId]);
        if ($stmt->fetch()) {
            $commentTable = 'chapter_comments';
            $commentExists = true;
        }
    }

    if (!$commentExists) {
        http_response_code(404);
        echo json_encode(['error' => 'Comment not found']);
        exit;
    }

    if ($input['action'] === 'delete') {
        // Delete the comment
        $stmt = $pdo->prepare("DELETE FROM {$commentTable} WHERE id = ?");
        $stmt->execute([$commentId]);
    } else {
        // Update comment status (approve/reject)
        $isApproved = $input['action'] === 'approve' ? 1 : 0;
        $stmt = $pdo->prepare("UPDATE {$commentTable} SET is_approved = ? WHERE id = ?");
        $stmt->execute([$isApproved, $commentId]);
    }

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    error_log("Comment moderation error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to moderate comment']);
}
?>
