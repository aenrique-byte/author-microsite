<?php
require_once 'config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// GET /api/shoutouts.endpoint.php - Get shoutouts (optionally filtered by storyId)
if ($method === 'GET') {
    $storyId = $_GET['storyId'] ?? null;
    
    if ($storyId) {
        // Get shoutouts for specific story (including global ones)
        $stmt = $pdo->prepare("
            SELECT * FROM shoutout_admin_shoutouts 
            WHERE story_id IS NULL OR story_id = ? 
            ORDER BY created_at ASC
        ");
        $stmt->execute([$storyId]);
    } else {
        // Get all shoutouts
        $stmt = $pdo->query("SELECT * FROM shoutout_admin_shoutouts ORDER BY created_at ASC");
    }
    
    $shoutouts = $stmt->fetchAll();
    
    // Convert story_id to storyId for frontend compatibility
    $result = array_map(function($shoutout) {
        return [
            'id' => $shoutout['id'],
            'label' => $shoutout['label'],
            'code' => $shoutout['code'],
            'storyId' => $shoutout['story_id']
        ];
    }, $shoutouts);
    
    sendResponse($result);
}

// POST /api/shoutouts.endpoint.php - Create or update shoutout
if ($method === 'POST') {
    $input = getJsonInput();
    
    if (!isset($input['id']) || !isset($input['label']) || !isset($input['code'])) {
        sendResponse(['error' => 'Missing required fields'], 400);
    }
    
    $id = $input['id'];
    $label = $input['label'];
    $code = $input['code'];
    $storyId = $input['storyId'] ?? null;
    
    // Check if shoutout exists
    $stmt = $pdo->prepare("SELECT id FROM shoutout_admin_shoutouts WHERE id = ?");
    $stmt->execute([$id]);
    $exists = $stmt->fetch();
    
    if ($exists) {
        // Update existing shoutout
        $stmt = $pdo->prepare("
            UPDATE shoutout_admin_shoutouts 
            SET label = ?, code = ?, story_id = ? 
            WHERE id = ?
        ");
        $stmt->execute([$label, $code, $storyId, $id]);
    } else {
        // Insert new shoutout
        $stmt = $pdo->prepare("
            INSERT INTO shoutout_admin_shoutouts (id, label, code, story_id) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$id, $label, $code, $storyId]);
    }
    
    sendResponse(['success' => true, 'id' => $id]);
}

// DELETE /api/shoutouts.endpoint.php?id=xxx - Delete shoutout
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        sendResponse(['error' => 'Shoutout ID required'], 400);
    }
    
    $stmt = $pdo->prepare("DELETE FROM shoutout_admin_shoutouts WHERE id = ?");
    $stmt->execute([$id]);
    
    sendResponse(['success' => true]);
}

sendResponse(['error' => 'Method not allowed'], 405);
