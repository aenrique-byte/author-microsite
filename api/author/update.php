<?php
require_once '../bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Check authentication (session already started in bootstrap.php)
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

// Validate gallery_rating_filter if provided
if (isset($input['gallery_rating_filter']) && !in_array($input['gallery_rating_filter'], ['always', 'auto', 'never'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid gallery_rating_filter value. Must be: always, auto, or never']);
    exit;
}

try {
    // Get current profile or create if doesn't exist
    $stmt = $pdo->prepare("SELECT id FROM author_profile LIMIT 1");
    $stmt->execute();
    $profile = $stmt->fetch();

    if ($profile) {
        // Update existing profile
        $stmt = $pdo->prepare("
            UPDATE author_profile 
            SET name = ?, bio = ?, tagline = ?, profile_image = ?, background_image_light = ?, background_image_dark = ?, site_domain = ?, gallery_rating_filter = ?, updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([
            $input['name'] ?? null,
            $input['bio'] ?? null,
            $input['tagline'] ?? null,
            $input['profile_image'] ?? null,
            $input['background_image_light'] ?? null,
            $input['background_image_dark'] ?? null,
            $input['site_domain'] ?? null,
            $input['gallery_rating_filter'] ?? 'auto',
            $profile['id']
        ]);
    } else {
        // Create new profile
        $stmt = $pdo->prepare("
            INSERT INTO author_profile (name, bio, tagline, profile_image, background_image_light, background_image_dark, site_domain, gallery_rating_filter, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([
            $input['name'] ?? null,
            $input['bio'] ?? null,
            $input['tagline'] ?? null,
            $input['profile_image'] ?? null,
            $input['background_image_light'] ?? null,
            $input['background_image_dark'] ?? null,
            $input['site_domain'] ?? null,
            $input['gallery_rating_filter'] ?? 'auto'
        ]);
    }

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    error_log("Author update error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update author profile']);
}
?>
