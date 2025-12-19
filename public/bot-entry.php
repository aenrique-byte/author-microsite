<?php
/**
 * Bot-Aware Entry Point for SEO
 * 
 * This file detects search engine bots and social media crawlers,
 * serving them pre-rendered HTML while regular users get the React SPA.
 * 
 * Usage: Route all non-API, non-static requests through this file via .htaccess
 */

// Bot User-Agent patterns
$botPatterns = [
    // Search Engines
    'Googlebot',
    'Googlebot-Image',
    'Googlebot-News',
    'Googlebot-Video',
    'Bingbot',
    'Slurp',           // Yahoo
    'DuckDuckBot',
    'Baiduspider',
    'YandexBot',
    'Sogou',
    'Exabot',
    'ia_archiver',     // Alexa
    
    // Social Media Crawlers
    'facebookexternalhit',
    'Facebot',
    'Twitterbot',
    'LinkedInBot',
    'Pinterest',
    'WhatsApp',
    'TelegramBot',
    'Discordbot',
    'Slackbot',
    'Redditbot',
    
    // Other Important Crawlers
    'Applebot',
    'SemrushBot',
    'AhrefsBot',
    'MJ12bot',
    'DotBot',
    'PetalBot',
    'Bytespider',
    
    // SEO Tools
    'Screaming Frog',
    'rogerbot',
    'embedly',
    'quora link preview',
    'outbrain',
    
    // Validators
    'W3C_Validator',
    'validator.nu',
];

/**
 * Check if the request is from a bot
 */
function isBot($userAgent, $botPatterns) {
    if (empty($userAgent)) {
        return false;
    }
    
    $userAgentLower = strtolower($userAgent);
    
    foreach ($botPatterns as $pattern) {
        if (stripos($userAgentLower, strtolower($pattern)) !== false) {
            return true;
        }
    }
    
    return false;
}

/**
 * Get the pre-render file path for a given URI
 */
function getPrerenderPath($uri) {
    // Remove query string
    $path = parse_url($uri, PHP_URL_PATH);
    $path = trim($path, '/');
    
    // Base prerender directory
    $prerenderDir = __DIR__ . '/prerender';
    
    // Special case: homepage
    if (empty($path) || $path === 'index.html') {
        return $prerenderDir . '/index.html';
    }
    
    // Convert path to filename (replace slashes with dashes)
    // e.g., storytime/story/my-story -> storytime-story-my-story.html
    $filename = str_replace('/', '-', $path);
    
    // Remove .html extension if present (we'll add it)
    $filename = preg_replace('/\.html$/', '', $filename);
    
    return $prerenderDir . '/' . $filename . '.html';
}

/**
 * Log bot visit for analytics (optional)
 */
function logBotVisit($userAgent, $uri) {
    $logFile = __DIR__ . '/../api/logs/bot-visits.log';
    $logDir = dirname($logFile);
    
    // Create log directory if it doesn't exist
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }
    
    $logEntry = date('Y-m-d H:i:s') . ' | ' . 
                ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . ' | ' .
                substr($userAgent, 0, 100) . ' | ' .
                $uri . "\n";
    
    @file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

// ============ Main Logic ============

$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';

// Check if request is from a bot
if (isBot($userAgent, $botPatterns)) {
    // Log the bot visit
    logBotVisit($userAgent, $requestUri);
    
    // Get the pre-rendered file path
    $prerenderFile = getPrerenderPath($requestUri);
    
    // If pre-rendered file exists, serve it
    if (file_exists($prerenderFile)) {
        header('Content-Type: text/html; charset=utf-8');
        header('X-Prerender: true'); // Debug header
        readfile($prerenderFile);
        exit;
    }
    
    // Fall through to React SPA if no pre-rendered file exists
    // This ensures bots at least get the base HTML
}

// For regular users (or bots without pre-rendered pages), serve React SPA
$indexHtml = __DIR__ . '/index.html';
if (file_exists($indexHtml)) {
    readfile($indexHtml);
} else {
    // Fallback error
    http_response_code(500);
    echo "<!DOCTYPE html><html><head><title>Error</title></head><body><h1>Site configuration error</h1></body></html>";
}
