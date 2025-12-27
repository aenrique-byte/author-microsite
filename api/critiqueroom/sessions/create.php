<?php
/**
 * CritiqueRoom Session Create API
 *
 * POST /api/critiqueroom/sessions/create.php
 *
 * Request Body (JSON):
 * - title: string (required)
 * - content: string (required, max 500KB)
 * - authorName: string (required)
 * - modes: array (required)
 * - questions: array (required)
 * - sections: array (required)
 * - expiration: string (required: "24 Hours"|"72 Hours"|"7 Days"|"No Expiration")
 * - fontCombo: string (required: "LITERARY"|"MODERN"|"PAPERBACK")
 * - password: string (optional)
 */

require_once __DIR__ . '/../../bootstrap.php';

header('Content-Type: application/json');

// Only allow POST requests
require_method(['POST']);

// Rate limit: 5 sessions per hour per IP
requireRateLimit('critiqueroom:session:create', CRITIQUEROOM_RATE_LIMIT_SESSIONS, 3600, null, true);

try {
    $pdo = db();
    $input = body_json();

    // Validate required fields
    $required = ['title', 'content', 'authorName', 'modes', 'questions', 'sections', 'expiration', 'fontCombo'];
    foreach ($required as $field) {
        if (!isset($input[$field])) {
            json_error("Missing required field: $field", 400);
        }
    }

    // Validate content size (500KB max)
    if (strlen($input['content']) > CRITIQUEROOM_MAX_SESSION_SIZE) {
        json_error('Content too large (max 500KB)', 413);
    }

    // Validate expiration value
    $validExpirations = ['24 Hours', '72 Hours', '7 Days', 'No Expiration'];
    if (!in_array($input['expiration'], $validExpirations, true)) {
        json_error('Invalid expiration value', 400);
    }

    // Validate font combo
    $validFonts = ['LITERARY', 'MODERN', 'PAPERBACK'];
    if (!in_array($input['fontCombo'], $validFonts, true)) {
        json_error('Invalid font combo', 400);
    }

    // Validate arrays
    if (!is_array($input['modes']) || !is_array($input['questions']) || !is_array($input['sections'])) {
        json_error('modes, questions, and sections must be arrays', 400);
    }

    // Generate short 6-character session ID (AB12XY format)
    // Using uppercase letters (excluding confusing O, I) and numbers (excluding 0, 1)
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $maxAttempts = 10;
    $sessionId = null;
    
    for ($attempt = 0; $attempt < $maxAttempts; $attempt++) {
        $id = '';
        for ($i = 0; $i < 6; $i++) {
            $id .= $chars[mt_rand(0, strlen($chars) - 1)];
        }
        
        // Check if ID already exists
        $checkStmt = $pdo->prepare("SELECT id FROM critiqueroom_sessions WHERE id = ?");
        $checkStmt->execute([$id]);
        
        if (!$checkStmt->fetch()) {
            $sessionId = $id;
            break;
        }
    }
    
    if ($sessionId === null) {
        json_error('Failed to generate unique session ID', 500);
    }

    $createdAt = round(microtime(true) * 1000);

    // Calculate expiration timestamp
    $expiresAt = null;
    switch ($input['expiration']) {
        case '24 Hours':
            $expiresAt = $createdAt + (24 * 60 * 60 * 1000);
            break;
        case '72 Hours':
            $expiresAt = $createdAt + (72 * 60 * 60 * 1000);
            break;
        case '7 Days':
            $expiresAt = $createdAt + (7 * 24 * 60 * 60 * 1000);
            break;
        case 'No Expiration':
            $expiresAt = null;
            break;
    }

    // Get author Discord ID if logged in (stored in author_discord_id VARCHAR column)
    $authorDiscordId = $_SESSION['discord_user']['id'] ?? null;

    // Hash password if provided
    $passwordHash = null;
    if (isset($input['password']) && !empty($input['password'])) {
        $passwordHash = generateHash($input['password']);
    }

    // Insert session
    // Note: author_id is INT FK to users table (not used for Discord auth)
    // author_discord_id is VARCHAR for Discord user IDs
    $stmt = $pdo->prepare("
        INSERT INTO critiqueroom_sessions
        (id, title, content, author_discord_id, author_name, modes, questions, sections,
         expiration, font_combo, password_hash, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $sessionId,
        sanitizeInput($input['title']),
        $input['content'], // Don't sanitize content - preserve original text
        $authorDiscordId,
        sanitizeInput($input['authorName']),
        json_encode($input['modes']),
        json_encode($input['questions']),
        json_encode($input['sections']),
        $input['expiration'],
        $input['fontCombo'],
        $passwordHash,
        $createdAt,
        $expiresAt
    ]);

    json_response([
        'id' => $sessionId,
        'createdAt' => $createdAt,
        'expiresAt' => $expiresAt
    ], 201);

} catch (PDOException $e) {
    error_log('Failed to create critique session: ' . $e->getMessage());
    json_error('Failed to create session', 500);
}
