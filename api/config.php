<?php
// Database configuration for Author CMS
define('DB_HOST', 'localhost');
define('DB_NAME', 'u473142779_authorsite');
define('DB_USER', 'u473142779_author_user');
define('DB_PASS', '68uV9*qLrF#v');
define('DB_CHARSET', 'utf8mb4');

// API settings
define('API_BASE_URL', '/api');
// Use absolute path to the uploads folder inside the api directory
define('UPLOAD_DIR', __DIR__ . '/uploads');
// Optional: public web base for uploads (kept for clarity if needed elsewhere)
if (!defined('UPLOAD_WEB_BASE')) {
  define('UPLOAD_WEB_BASE', '/api/uploads');
}
define('MAX_UPLOAD_SIZE', 10 * 1024 * 1024); // 10MB

// Security settings
define('JWT_SECRET', 'larkdevon-cms-secret-2024-change-in-production');
define('SESSION_TIMEOUT', 3600); // 1 hour

// Analytics settings
define('ANALYTICS_SALT', 'analytics-salt-2024-change-in-production-' . hash('sha256', 'larkdevon-cms-analytics'));

// CORS settings
define('CORS_ORIGINS', 'larkdevon.com'); // Change to specific domains in production
?>
