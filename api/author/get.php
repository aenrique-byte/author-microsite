<?php
require_once '../bootstrap.php';

header('Content-Type: application/json');

try {
    $stmt = $pdo->prepare("SELECT name, bio, tagline, profile_image, background_image_light, background_image_dark, site_domain, gallery_rating_filter, updated_at FROM author_profile LIMIT 1");
    $stmt->execute();
    $profile = $stmt->fetch();

    if (!$profile) {
        // Return default profile if none exists
        $profile = [
            'name' => 'O.C. Wanderer',
            'bio' => 'Sci-Fi & Fantasy Author',
            'tagline' => 'Worlds of adventure, danger, and love',
            'profile_image' => null,
            'background_image_light' => null,
            'background_image_dark' => null,
            'site_domain' => 'authorsite.com',
            'gallery_rating_filter' => 'auto',
            'updated_at' => date('Y-m-d H:i:s')
        ];
    }

    jsonResponse([
        'success' => true,
        'profile' => $profile
    ]);

} catch (Exception $e) {
    error_log("Author profile get error: " . $e->getMessage());
    jsonResponse([
        'success' => false,
        'error' => 'Failed to fetch author profile'
    ], 500);
}
?>
