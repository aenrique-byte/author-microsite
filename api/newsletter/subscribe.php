<?php
require_once "../bootstrap.php";
require_method(["POST"]);

$newsletterEnabled = defined("NEWSLETTER_ENABLED") ? filter_var(NEWSLETTER_ENABLED, FILTER_VALIDATE_BOOLEAN) : true;
if (!$newsletterEnabled) {
    jsonResponse([
        "success" => false,
        "message" => "Newsletter signups are temporarily unavailable."
    ]);
}

$data = body_json();
$email = strtolower(trim($data['email'] ?? ""));
$notifyChapters = isset($data['notify_chapters']) ? (bool) $data['notify_chapters'] : true;
$notifyBlog = isset($data['notify_blog']) ? (bool) $data['notify_blog'] : true;
$notifyGallery = isset($data['notify_gallery']) ? (bool) $data['notify_gallery'] : true;
$source = substr(trim($data['source'] ?? ""), 0, 50);

if (!validateEmail($email)) {
    json_error("Please enter a valid email address.", 400);
}

$pdo = db();
$ip = getClientIP();
$userAgent = getUserAgent();
$rateLimitSeconds = defined("NEWSLETTER_RATE_LIMIT_SECONDS") ? (int) NEWSLETTER_RATE_LIMIT_SECONDS : 60;

try {
    $stmt = $pdo->prepare("SELECT created_at FROM email_subscription_log WHERE ip_address = ? ORDER BY created_at DESC LIMIT 1");
    $stmt->execute([$ip]);
    $lastAttempt = $stmt->fetchColumn();
    if ($lastAttempt) {
        $diff = time() - strtotime($lastAttempt);
        if ($diff < $rateLimitSeconds) {
            error_log("Newsletter rate limit exceeded for IP " . $ip);
            jsonResponse([
                "success" => true,
                "message" => "Thanks! We'll send confirmation soon."
            ]);
        }
    }
} catch (Throwable $e) {
    error_log("Newsletter rate limit check failed: " . $e->getMessage());
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("SELECT id, is_confirmed, unsubscribed_at, source FROM email_subscribers WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $existing = $stmt->fetch();

    $confirmationToken = bin2hex(random_bytes(32));
    $unsubscribeToken = bin2hex(random_bytes(32));

    if ($existing) {
        $subscriberId = (int) $existing['id'];
        $updatedSource = $source ?: ($existing['source'] ?? null);

        $update = $pdo->prepare("UPDATE email_subscribers SET confirmation_token = ?, unsubscribe_token = ?, is_confirmed = 0, confirmed_at = NULL, unsubscribed_at = NULL, source = ? WHERE id = ?");
        $update->execute([$confirmationToken, $unsubscribeToken, $updatedSource, $subscriberId]);

        $prefs = $pdo->prepare("INSERT INTO email_preferences (subscriber_id, notify_chapters, notify_blog, notify_gallery) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE notify_chapters = VALUES(notify_chapters), notify_blog = VALUES(notify_blog), notify_gallery = VALUES(notify_gallery)");
        $prefs->execute([
            $subscriberId,
            $notifyChapters ? 1 : 0,
            $notifyBlog ? 1 : 0,
            $notifyGallery ? 1 : 0,
        ]);

        $logDetails = json_encode([
            "source" => $updatedSource,
            "reason" => "duplicate_or_resubscribe",
            "notify_chapters" => $notifyChapters,
            "notify_blog" => $notifyBlog,
            "notify_gallery" => $notifyGallery,
        ], JSON_UNESCAPED_SLASHES);

        $log = $pdo->prepare("INSERT INTO email_subscription_log (subscriber_id, action, details, ip_address, user_agent) VALUES (?, 'subscribed', ?, ?, ?)");
        $log->execute([$subscriberId, $logDetails, $ip, $userAgent]);

        $pdo->commit();

        jsonResponse([
            "success" => true,
            "message" => "You're already subscribed! Check your email.",
            "subscriber_id" => $subscriberId,
        ]);
    }

    $insert = $pdo->prepare("INSERT INTO email_subscribers (email, is_confirmed, confirmation_token, source, unsubscribe_token, created_at) VALUES (?, 0, ?, ?, ?, NOW())");
    $insert->execute([$email, $confirmationToken, $source, $unsubscribeToken]);
    $subscriberId = (int) $pdo->lastInsertId();

    $prefs = $pdo->prepare("INSERT INTO email_preferences (subscriber_id, notify_chapters, notify_blog, notify_gallery) VALUES (?, ?, ?, ?)");
    $prefs->execute([
        $subscriberId,
        $notifyChapters ? 1 : 0,
        $notifyBlog ? 1 : 0,
        $notifyGallery ? 1 : 0,
    ]);

    $logDetails = json_encode([
        "source" => $source,
        "notify_chapters" => $notifyChapters,
        "notify_blog" => $notifyBlog,
        "notify_gallery" => $notifyGallery,
    ], JSON_UNESCAPED_SLASHES);

    $log = $pdo->prepare("INSERT INTO email_subscription_log (subscriber_id, action, details, ip_address, user_agent) VALUES (?, 'subscribed', ?, ?, ?)");
    $log->execute([$subscriberId, $logDetails, $ip, $userAgent]);

    $pdo->commit();

    jsonResponse([
        "success" => true,
        "message" => "Please check your email to confirm.",
        "subscriber_id" => $subscriberId,
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Newsletter subscribe failed: " . $e->getMessage());
    jsonResponse([
        "success" => true,
        "message" => "Thanks! We'll send confirmation soon."
    ]);
}
