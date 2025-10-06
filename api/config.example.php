<?php
// Database configuration for Author CMS
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_database_name');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
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
// IMPORTANT: Change these values for security!
define('JWT_SECRET', 'your-unique-secret-key-change-this-to-something-long-and-random');
define('SESSION_TIMEOUT', 3600); // 1 hour (in seconds)

// Analytics settings
// Used to anonymize visitor IP addresses for privacy
define('ANALYTICS_SALT', 'your-analytics-salt-change-this-' . hash('sha256', 'your-domain-analytics'));

// CORS settings
// For production, change '*' to your specific domain for better security
define('CORS_ORIGINS', '*'); // Example: 'yourdomain.com'
?>
