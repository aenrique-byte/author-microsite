<?php
/**
 * Export session feedback via email
 * POST /api/critiqueroom/sessions/export-email.php
 * 
 * Sends a formatted HTML email with the session feedback to the specified email address.
 * Email is not stored - used only for this single send.
 * 
 * Uses direct SMTP connection (fsockopen) with config from database email_config table.
 */

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../email/helpers.php';

header('Content-Type: application/json');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$sessionId = $data['sessionId'] ?? '';
$email = $data['email'] ?? '';
$htmlContent = $data['htmlContent'] ?? '';

// Validate inputs
if (empty($sessionId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Session ID is required']);
    exit;
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'A valid email address is required']);
    exit;
}

if (empty($htmlContent)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email content is required']);
    exit;
}

/**
 * Send email via direct SMTP connection (fsockopen approach)
 * Uses config from database email_config table
 */
function sendDirectSmtpEmail($to, $subject, $htmlBody) {
    $config = get_email_config();
    
    $host = $config['smtp_host'] ?? '';
    $port = intval($config['smtp_port'] ?? 465);
    $username = $config['smtp_user'] ?? $config['smtp_username'] ?? '';
    $password = $config['smtp_pass'] ?? $config['smtp_password'] ?? '';
    $fromEmail = $config['from_email'] ?? $config['sender_email'] ?? '';
    $fromName = $config['from_name'] ?? $config['sender_name'] ?? 'Critique Room';
    $encryption = strtolower($config['smtp_encryption'] ?? $config['encryption'] ?? 'ssl');
    
    // Debug log the config (sanitized)
    error_log("SMTP Config: host={$host}, port={$port}, user=" . (empty($username) ? 'EMPTY' : 'SET') . ", pass=" . (empty($password) ? 'EMPTY' : 'SET') . ", from={$fromEmail}");
    
    if (empty($host) || empty($username) || empty($password) || empty($fromEmail)) {
        error_log("SMTP config incomplete: host=" . (empty($host) ? 'MISSING' : 'OK') . 
                  ", user=" . (empty($username) ? 'MISSING' : 'OK') . 
                  ", pass=" . (empty($password) ? 'MISSING' : 'OK') . 
                  ", from=" . (empty($fromEmail) ? 'MISSING' : 'OK'));
        return ['success' => false, 'error' => 'SMTP not fully configured'];
    }
    
    $remote = $encryption === 'ssl' ? "ssl://{$host}" : $host;
    
    $errno = 0;
    $errstr = '';
    $fp = @fsockopen($remote, $port, $errno, $errstr, 15);
    if (!$fp) {
        error_log("SMTP Connection failed: {$errno} - {$errstr}");
        return ['success' => false, 'error' => "Connection failed: {$errstr}"];
    }
    
    stream_set_timeout($fp, 15);
    
    $read = function() use ($fp) {
        $data = '';
        while ($str = fgets($fp, 515)) {
            $data .= $str;
            if (isset($str[3]) && $str[3] === ' ') break;
        }
        return $data;
    };
    
    $write = function($cmd) use ($fp) {
        fwrite($fp, $cmd . "\r\n");
    };
    
    // Read greeting
    $resp = $read();
    if (strpos($resp, '220') !== 0) {
        fclose($fp);
        error_log("SMTP greeting failed: {$resp}");
        return ['success' => false, 'error' => 'Unexpected greeting'];
    }
    
    // EHLO
    $write("EHLO localhost");
    $resp = $read();
    if (strpos($resp, '250') !== 0) {
        fclose($fp);
        error_log("SMTP EHLO failed: {$resp}");
        return ['success' => false, 'error' => 'EHLO failed'];
    }
    
    // STARTTLS if needed
    if ($encryption === 'tls') {
        $write('STARTTLS');
        $resp = $read();
        if (strpos($resp, '220') !== 0) {
            fclose($fp);
            return ['success' => false, 'error' => 'STARTTLS failed'];
        }
        if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            fclose($fp);
            return ['success' => false, 'error' => 'TLS enable failed'];
        }
        $write("EHLO localhost");
        $resp = $read();
    }
    
    // AUTH LOGIN
    $write('AUTH LOGIN');
    $resp = $read();
    if (strpos($resp, '334') !== 0) {
        fclose($fp);
        error_log("SMTP AUTH not accepted: {$resp}");
        return ['success' => false, 'error' => 'AUTH not accepted'];
    }
    
    $write(base64_encode($username));
    $resp = $read();
    if (strpos($resp, '334') !== 0) {
        fclose($fp);
        error_log("SMTP Username not accepted: {$resp}");
        return ['success' => false, 'error' => 'Username not accepted'];
    }
    
    $write(base64_encode($password));
    $resp = $read();
    if (strpos($resp, '235') !== 0) {
        fclose($fp);
        error_log("SMTP Password not accepted: {$resp}");
        return ['success' => false, 'error' => 'Password not accepted'];
    }
    
    // MAIL FROM - use the authenticated user
    $write('MAIL FROM: <' . $username . '>');
    $resp = $read();
    if (strpos($resp, '250') !== 0) {
        fclose($fp);
        error_log("SMTP MAIL FROM failed: {$resp}");
        return ['success' => false, 'error' => 'MAIL FROM failed'];
    }
    
    // RCPT TO
    $write('RCPT TO: <' . $to . '>');
    $resp = $read();
    if (strpos($resp, '250') !== 0 && strpos($resp, '251') !== 0) {
        fclose($fp);
        error_log("SMTP RCPT TO failed: {$resp}");
        return ['success' => false, 'error' => 'RCPT TO failed'];
    }
    
    // DATA
    $write('DATA');
    $resp = $read();
    if (strpos($resp, '354') !== 0) {
        fclose($fp);
        error_log("SMTP DATA not accepted: {$resp}");
        return ['success' => false, 'error' => 'DATA not accepted'];
    }
    
    // Build message
    $headers = [];
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-Type: text/html; charset=UTF-8';
    $headers[] = "From: {$fromName} <{$fromEmail}>";
    $headers[] = "Reply-To: {$fromEmail}";
    $headers[] = 'X-Mailer: PHP/' . phpversion();
    
    $message = "Subject: {$subject}\r\n";
    $message .= "To: {$to}\r\n";
    $message .= implode("\r\n", $headers) . "\r\n\r\n";
    $message .= $htmlBody . "\r\n.\r\n";
    
    fwrite($fp, $message);
    $resp = $read();
    if (strpos($resp, '250') !== 0) {
        fclose($fp);
        error_log("SMTP Message send failed: {$resp}");
        return ['success' => false, 'error' => 'Message send failed'];
    }
    
    $write('QUIT');
    $read();
    fclose($fp);
    
    error_log("SMTP Email sent successfully to: {$to}");
    return ['success' => true];
}

try {
    $pdo = db();
    
    // Verify session exists and get session info
    $stmt = $pdo->prepare("SELECT id, title, author_name, author_discord_id FROM critiqueroom_sessions WHERE id = ?");
    $stmt->execute([$sessionId]);
    $session = $stmt->fetch();
    
    if (!$session) {
        http_response_code(404);
        echo json_encode(['error' => 'Session not found']);
        exit;
    }
    
    // Check if email is configured
    if (!is_email_configured()) {
        http_response_code(500);
        echo json_encode(['error' => 'Email service is not configured. Please contact the site administrator.']);
        exit;
    }
    
    // Prepare email
    $subject = "Critique Room Feedback: {$session['title']}";

    // The htmlContent already contains a full HTML email with proper styling from the frontend
    // Just use it directly - no wrapper needed since it's already complete
    $emailBody = $htmlContent;

    // Send the email using direct SMTP
    $result = sendDirectSmtpEmail($email, $subject, $emailBody);
    
    if ($result['success']) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        $errorMsg = $result['error'] ?? 'Failed to send email';
        error_log("Critique Room email export error: " . $errorMsg);
        echo json_encode(['error' => 'Failed to send email: ' . $errorMsg]);
    }
    
} catch (Throwable $e) {
    error_log("Export email exception: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send email: ' . $e->getMessage()]);
}
