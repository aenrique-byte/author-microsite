<?php
require_once 'config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// GET /api/availability.endpoint.php?storyId=xxx - Get availability for a story
if ($method === 'GET') {
    $storyId = $_GET['storyId'] ?? null;
    
    if (!$storyId) {
        sendResponse(['error' => 'Story ID required'], 400);
    }
    
    $stmt = $pdo->prepare("SELECT date_str FROM shoutout_availability WHERE story_id = ? ORDER BY date_str ASC");
    $stmt->execute([$storyId]);
    $rows = $stmt->fetchAll();
    
    // Return array of date strings in YYYY-MM-DD format
    $dates = array_map(function($row) {
        // Ensure date is in YYYY-MM-DD format
        $date = $row['date_str'];
        if ($date instanceof DateTime) {
            return $date->format('Y-m-d');
        }
        // If it's already a string, ensure proper format
        return date('Y-m-d', strtotime($date));
    }, $rows);
    
    sendResponse($dates);
}

// POST /api/availability.endpoint.php - Set availability for a date
if ($method === 'POST') {
    $input = getJsonInput();
    
    if (!isset($input['storyId']) || !isset($input['dateStr']) || !isset($input['isAvailable'])) {
        sendResponse(['error' => 'Missing required fields'], 400);
    }
    
    $storyId = $input['storyId'];
    $dateStr = $input['dateStr'];
    $isAvailable = $input['isAvailable'];
    
    if ($isAvailable) {
        // Add availability
        $stmt = $pdo->prepare("
            INSERT IGNORE INTO shoutout_availability (date_str, story_id) 
            VALUES (?, ?)
        ");
        $stmt->execute([$dateStr, $storyId]);
    } else {
        // Remove availability
        $stmt = $pdo->prepare("
            DELETE FROM shoutout_availability 
            WHERE date_str = ? AND story_id = ?
        ");
        $stmt->execute([$dateStr, $storyId]);
    }
    
    sendResponse(['success' => true]);
}

sendResponse(['error' => 'Method not allowed'], 405);
