<?php
/**
 * CritiqueRoom Cleanup Cron Job
 *
 * Deletes expired critique sessions and their associated data
 * Run hourly via cron job
 *
 * Example crontab entry:
 * 0 * * * * /usr/bin/php /path/to/api/cron/cleanup-critiqueroom.php
 *
 * Or via HTTP (if using web-based cron):
 * 0 * * * * curl -s https://yourdomain.com/api/cron/cleanup-critiqueroom.php > /dev/null 2>&1
 */

require_once __DIR__ . '/../bootstrap.php';

header('Content-Type: application/json');

// Security: Only allow execution from CLI or localhost
$isCLI = php_sapi_name() === 'cli';
$isLocalhost = isset($_SERVER['REMOTE_ADDR']) && in_array($_SERVER['REMOTE_ADDR'], ['127.0.0.1', '::1']);

if (!$isCLI && !$isLocalhost) {
    http_response_code(403);
    echo json_encode(['error' => 'Access denied. This script can only be run from CLI or localhost.']);
    exit;
}

try {
    $now = round(microtime(true) * 1000); // Current timestamp in milliseconds

    // Start transaction
    $pdo->beginTransaction();

    // Find expired sessions
    $stmt = $pdo->prepare("
        SELECT id, title, created_at, expires_at
        FROM critiqueroom_sessions
        WHERE expires_at IS NOT NULL
        AND expires_at < ?
    ");
    $stmt->execute([$now]);
    $expiredSessions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $deletedCount = 0;
    $deletedSessionIds = [];

    if (count($expiredSessions) > 0) {
        // Delete expired sessions (CASCADE will handle comments, replies, and feedback)
        $stmt = $pdo->prepare("
            DELETE FROM critiqueroom_sessions
            WHERE expires_at IS NOT NULL
            AND expires_at < ?
        ");
        $stmt->execute([$now]);
        $deletedCount = $stmt->rowCount();

        // Collect deleted session IDs for logging
        foreach ($expiredSessions as $session) {
            $deletedSessionIds[] = $session['id'];
        }
    }

    // Commit transaction
    $pdo->commit();

    // Log the cleanup operation
    $logMessage = sprintf(
        "[CritiqueRoom Cleanup] Deleted %d expired session(s) at %s (timestamp: %d)",
        $deletedCount,
        date('Y-m-d H:i:s'),
        $now
    );

    if ($deletedCount > 0) {
        $logMessage .= "\nDeleted sessions: " . implode(', ', $deletedSessionIds);
    }

    error_log($logMessage);

    // Return success response
    echo json_encode([
        'success' => true,
        'deleted_count' => $deletedCount,
        'deleted_sessions' => $deletedSessionIds,
        'timestamp' => $now,
        'datetime' => date('Y-m-d H:i:s'),
        'message' => $deletedCount > 0
            ? "Successfully deleted $deletedCount expired session(s)"
            : "No expired sessions to delete"
    ], JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    // Rollback on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    $errorMessage = sprintf(
        "[CritiqueRoom Cleanup ERROR] Failed at %s: %s",
        date('Y-m-d H:i:s'),
        $e->getMessage()
    );

    error_log($errorMessage);

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Cleanup failed',
        'message' => $isCLI ? $e->getMessage() : 'Internal server error',
        'timestamp' => round(microtime(true) * 1000)
    ], JSON_PRETTY_PRINT);
}
