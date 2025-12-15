<?php
require_once 'config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// POST /api/login.endpoint.php - Authenticate user
if ($method === 'POST') {
    $input = getJsonInput();
    
    if (!isset($input['username']) || !isset($input['password'])) {
        sendResponse(['error' => 'Username and password required'], 400);
    }
    
    $username = $input['username'];
    $password = $input['password'];
    
    // Get user from database
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? AND role = 'admin'");
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    
    if (!$user) {
        sendResponse(['error' => 'Invalid credentials'], 401);
    }
    
    // Verify password
    if (password_verify($password, $user['password_hash'])) {
        // Update last login
        $updateStmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
        $updateStmt->execute([$user['id']]);
        
        // Return success with user info
        sendResponse([
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'role' => $user['role']
            ]
        ]);
    } else {
        sendResponse(['error' => 'Invalid credentials'], 401);
    }
}

sendResponse(['error' => 'Method not allowed'], 405);
