<?php
// Simple environment variable loader
function loadEnv($path = __DIR__ . '/.env') {
    if (!file_exists($path)) {
        // Try the parent directory as fallback for local development
        $path = __DIR__ . '/../../.env';
        if (!file_exists($path)) {
            return;
        }
    }
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue; // Skip comments
        }
        
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        
        if (!array_key_exists($name, $_ENV)) {
            $_ENV[$name] = $value;
        }
    }
}

// Load environment variables
loadEnv();

// Helper function to get environment variable with fallback
function env($key, $default = null) {
    return $_ENV[$key] ?? getenv($key) ?: $default;
}
?>
