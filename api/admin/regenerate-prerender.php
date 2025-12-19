<?php
/**
 * Admin Endpoint: Regenerate Pre-rendered Pages
 * 
 * Call this endpoint from the admin panel to regenerate all
 * pre-rendered HTML pages for SEO.
 * 
 * POST /api/admin/regenerate-prerender.php
 * 
 * Requires authentication.
 */

require_once __DIR__ . '/../bootstrap.php';

// Require authentication
requireAuth();

// Only allow POST requests
require_method(['POST']);

// Include and run the generator
try {
    // Set a longer execution time for large sites
    set_time_limit(300); // 5 minutes
    
    // Capture output
    ob_start();
    
    // The generate.php script will detect it's not CLI and return JSON
    include __DIR__ . '/../prerender/generate.php';
    
    // The generate.php already calls jsonResponse(), so we don't reach here
    // But just in case:
    $output = ob_get_clean();
    
    if (empty($output)) {
        jsonResponse([
            'success' => true,
            'message' => 'Pre-render generation triggered'
        ]);
    }
    
} catch (Exception $e) {
    error_log("Pre-render generation error: " . $e->getMessage());
    json_error('Pre-render generation failed: ' . $e->getMessage(), 500);
}
