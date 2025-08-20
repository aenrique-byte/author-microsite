<?php
// Database configuration
// This file only handles database connection, no headers

require_once __DIR__ . '/env.php';

$host = env('DB_HOST', 'localhost');
$dbname = env('DB_NAME', 'my_stories_comments');
$username = env('DB_USERNAME', 'root');
$password = env('DB_PASSWORD', '');

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    http_response_code(500);
    die('Database connection failed: ' . $e->getMessage());
}

// Helper function to get client IP
function getClientIP() {
    $ipKeys = ['HTTP_CF_CONNECTING_IP', 'HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
    foreach ($ipKeys as $key) {
        if (array_key_exists($key, $_SERVER) === true) {
            foreach (explode(',', $_SERVER[$key]) as $ip) {
                $ip = trim($ip);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                    return $ip;
                }
            }
        }
    }
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

// Simple rate limiting function
function checkRateLimit($ip, $action = 'comment', $limit = 5, $window = 300) {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count 
        FROM chapter_comments 
        WHERE ip_address = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND)
    ");
    $stmt->execute([$ip, $window]);
    $result = $stmt->fetch();
    
    return $result['count'] < $limit;
}
?>
