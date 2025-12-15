<?php
require_once 'config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// GET /api/stories.endpoint.php - Get all stories or single story
if ($method === 'GET') {
    $id = $_GET['id'] ?? null;
    
    if ($id) {
        // Get single story
        $stmt = $pdo->prepare("SELECT * FROM shoutout_stories WHERE id = ?");
        $stmt->execute([$id]);
        $story = $stmt->fetch();
        
        if (!$story) {
            sendResponse(['error' => 'Story not found'], 404);
        }
        
        // Convert snake_case to camelCase for frontend
        $result = [
            'id' => $story['id'],
            'title' => $story['title'],
            'link' => $story['link'],
            'coverImage' => $story['cover_image'],
            'color' => $story['color'],
            'created_at' => $story['created_at'],
            'updated_at' => $story['updated_at']
        ];
        
        sendResponse($result);
    } else {
        // Get all stories
        $stmt = $pdo->query("SELECT * FROM shoutout_stories ORDER BY created_at ASC");
        $stories = $stmt->fetchAll();
        
        // Convert snake_case to camelCase for frontend
        $result = array_map(function($story) {
            return [
                'id' => $story['id'],
                'title' => $story['title'],
                'link' => $story['link'],
                'coverImage' => $story['cover_image'],
                'color' => $story['color'],
                'created_at' => $story['created_at'],
                'updated_at' => $story['updated_at']
            ];
        }, $stories);
        
        sendResponse($result);
    }
}

// POST /api/stories.endpoint.php - Create or update story
if ($method === 'POST') {
    $input = getJsonInput();
    
    if (!isset($input['id']) || !isset($input['title']) || !isset($input['link'])) {
        sendResponse(['error' => 'Missing required fields'], 400);
    }
    
    $id = $input['id'];
    $title = $input['title'];
    $link = $input['link'];
    $coverImage = $input['coverImage'] ?? 'https://picsum.photos/400/600';
    $color = $input['color'] ?? 'amber';
    
    // Check if story exists
    $stmt = $pdo->prepare("SELECT id FROM shoutout_stories WHERE id = ?");
    $stmt->execute([$id]);
    $exists = $stmt->fetch();
    
    if ($exists) {
        // Update existing story
        $stmt = $pdo->prepare("
            UPDATE shoutout_stories 
            SET title = ?, link = ?, cover_image = ?, color = ? 
            WHERE id = ?
        ");
        $stmt->execute([$title, $link, $coverImage, $color, $id]);
    } else {
        // Insert new story
        $stmt = $pdo->prepare("
            INSERT INTO shoutout_stories (id, title, link, cover_image, color) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$id, $title, $link, $coverImage, $color]);
    }
    
    sendResponse(['success' => true, 'id' => $id]);
}

// DELETE /api/stories.endpoint.php?id=xxx - Delete story
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        sendResponse(['error' => 'Story ID required'], 400);
    }
    
    // Check if this is the last story
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM shoutout_stories");
    $count = $stmt->fetch()['count'];
    
    if ($count <= 1) {
        sendResponse(['error' => 'Cannot delete the last story'], 400);
    }
    
    // Delete story (CASCADE will handle related records)
    $stmt = $pdo->prepare("DELETE FROM shoutout_stories WHERE id = ?");
    $stmt->execute([$id]);
    
    sendResponse(['success' => true]);
}

sendResponse(['error' => 'Method not allowed'], 405);
