<?php
require_once '../bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Check authentication - session is already started in bootstrap.php
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Story ID is required']);
    exit;
}

try {
    // Check if story exists
    $stmt = $pdo->prepare("SELECT id FROM stories WHERE id = ?");
    $stmt->execute([$input['id']]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['error' => 'Story not found']);
        exit;
    }

    // Check if slug is being changed and if it conflicts
    if (isset($input['slug'])) {
        $stmt = $pdo->prepare("SELECT id FROM stories WHERE slug = ? AND id != ?");
        $stmt->execute([$input['slug'], $input['id']]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['error' => 'Slug already exists']);
            exit;
        }
    }

    // Prepare genres as JSON if provided
    $genres_json = null;
    if (isset($input['genres']) && is_array($input['genres'])) {
        $genres_json = json_encode($input['genres']);
    }

    $stmt = $pdo->prepare("
        UPDATE stories 
        SET title = ?, slug = ?, description = ?, genres = ?, primary_keywords = ?, longtail_keywords = ?, target_audience = ?, cover_image = ?, break_image = ?, status = ?, updated_at = NOW()
        WHERE id = ?
    ");
    
    $stmt->execute([
        $input['title'],
        $input['slug'],
        $input['description'] ?? null,
        $genres_json,
        $input['primary_keywords'] ?? null,
        $input['longtail_keywords'] ?? null,
        $input['target_audience'] ?? null,
        $input['cover_image'] ?? null,
        $input['break_image'] ?? null,
        $input['status'] ?? 'draft',
        $input['id']
    ]);

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    error_log("Story update error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update story']);
}
?>
