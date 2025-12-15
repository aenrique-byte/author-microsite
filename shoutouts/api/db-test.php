<?php
// Database connection test
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

define('DB_HOST', 'localhost');
define('DB_NAME', 'u473142779_authorsite2');
define('DB_USER', 'u473142779_author_user2');
define('DB_PASS', '68uV9*qLrF#v');
define('DB_CHARSET', 'utf8mb4');

$result = [
    'status' => 'testing',
    'steps' => []
];

// Step 1: Try to connect
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
    $result['steps'][] = '✓ Database connection successful';
    
    // Step 2: Check if tables exist
    $tables = ['shoutout_config', 'shoutout_stories', 'shoutout_admin_shoutouts', 'shoutout_availability', 'shoutout_bookings'];
    $existingTables = [];
    
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            $existingTables[] = $table;
        }
    }
    
    if (count($existingTables) === count($tables)) {
        $result['steps'][] = '✓ All required tables exist';
        $result['tables'] = $existingTables;
    } else {
        $result['steps'][] = '✗ Missing tables';
        $result['existing_tables'] = $existingTables;
        $result['missing_tables'] = array_diff($tables, $existingTables);
        $result['error'] = 'Please run mysql_schema.sql in phpMyAdmin';
    }
    
    // Step 3: Try to read config
    if (in_array('shoutout_config', $existingTables)) {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM shoutout_config");
        $count = $stmt->fetch()['count'];
        $result['steps'][] = "✓ Config table has $count rows";
        
        if ($count === 0) {
            $result['steps'][] = '⚠ Config table is empty - will use defaults';
        }
    }
    
    $result['status'] = 'success';
    
} catch (PDOException $e) {
    $result['status'] = 'error';
    $result['error'] = $e->getMessage();
    $result['steps'][] = '✗ Database connection failed: ' . $e->getMessage();
}

echo json_encode($result, JSON_PRETTY_PRINT);
