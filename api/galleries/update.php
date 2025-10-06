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
    echo json_encode(['error' => 'Gallery ID is required']);
    exit;
}

try {
    // Check if gallery exists
    $stmt = $pdo->prepare("SELECT id, slug FROM galleries WHERE id = ?");
    $stmt->execute([$input['id']]);
    $gallery = $stmt->fetch();
    if (!$gallery) {
        http_response_code(404);
        echo json_encode(['error' => 'Gallery not found']);
        exit;
    }

    // Check if slug is being changed and if it conflicts
    if (isset($input['slug']) && $input['slug'] !== $gallery['slug']) {
        $stmt = $pdo->prepare("SELECT id FROM galleries WHERE slug = ? AND id != ?");
        $stmt->execute([$input['slug'], $input['id']]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['error' => 'Slug already exists']);
            exit;
        }
    }

    // Validate rating if provided
    $rating = null;
    if (isset($input['rating'])) {
        $rating = strtoupper(trim($input['rating']));
        if (!in_array($rating, ['PG', 'X'])) {
            $rating = 'PG'; // Default to PG if invalid
        }
    }

    // Validate status if provided
    $status = null;
    if (isset($input['status'])) {
        $status = strtolower(trim($input['status']));
        if (!in_array($status, ['draft','published','archived'], true)) {
            $status = null;
        }
    }

    $stmt = $pdo->prepare("
        UPDATE galleries 
        SET title = ?, slug = ?, description = ?, 
            rating = COALESCE(?, rating),
            status = COALESCE(?, status),
            updated_at = NOW()
        WHERE id = ?
    ");
    
    $stmt->execute([
        $input['title'] ?? null,
        $input['slug'] ?? $gallery['slug'],
        $input['description'] ?? null,
        $rating,
        $status,
        $input['id']
    ]);

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    error_log("Gallery update error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update gallery']);
}
?>
