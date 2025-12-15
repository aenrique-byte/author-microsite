<?php
require_once 'config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// GET /api/config.endpoint.php - Get configuration
if ($method === 'GET') {
    $stmt = $pdo->query("SELECT config_key, config_value FROM shoutout_config");
    $rows = $stmt->fetchAll();
    
    $config = [];
    foreach ($rows as $row) {
        $config[$row['config_key']] = $row['config_value'];
    }
    
    // Convert to expected format
    $result = [
        'monthsToShow' => isset($config['monthsToShow']) ? (int)$config['monthsToShow'] : 3
    ];
    
    sendResponse($result);
}

// PUT /api/config.endpoint.php - Update configuration
if ($method === 'PUT') {
    $input = getJsonInput();
    
    if (isset($input['monthsToShow'])) {
        $stmt = $pdo->prepare("
            INSERT INTO shoutout_config (config_key, config_value) 
            VALUES ('monthsToShow', ?) 
            ON DUPLICATE KEY UPDATE config_value = ?
        ");
        $value = (string)$input['monthsToShow'];
        $stmt->execute([$value, $value]);
    }
    
    sendResponse(['success' => true]);
}

sendResponse(['error' => 'Method not allowed'], 405);
