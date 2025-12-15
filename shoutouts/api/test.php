<?php
// Simple test to verify PHP is working
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

echo json_encode([
    'status' => 'success',
    'message' => 'PHP is working!',
    'server_info' => [
        'php_version' => phpversion(),
        'document_root' => $_SERVER['DOCUMENT_ROOT'],
        'script_filename' => $_SERVER['SCRIPT_FILENAME'],
        'request_uri' => $_SERVER['REQUEST_URI']
    ]
]);
