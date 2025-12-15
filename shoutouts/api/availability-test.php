<?php
require_once 'config.php';

$pdo = getDbConnection();

// Get all availability records
$stmt = $pdo->query("SELECT * FROM shoutout_availability ORDER BY date_str ASC");
$availability = $stmt->fetchAll();

echo json_encode([
    'total_records' => count($availability),
    'records' => $availability
], JSON_PRETTY_PRINT);
