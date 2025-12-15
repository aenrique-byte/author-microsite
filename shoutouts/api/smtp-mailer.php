<?php
// Simple SMTP mailer using fsockopen for Hostinger SMTP
// NOTE: This is intentionally minimal and tailored to this app’s needs.

require_once __DIR__ . '/config.php';

if (!defined('SMTP_HOST')) {
    define('SMTP_HOST', 'smtp.hostinger.com');
}
if (!defined('SMTP_PORT')) {
    define('SMTP_PORT', 465); // SSL
}
if (!defined('SMTP_USER')) {
    define('SMTP_USER', ADMIN_EMAIL);
}
if (!defined('SMTP_PASS')) {
    define('SMTP_PASS', '');
}
if (!defined('SMTP_ENCRYPTION')) {
    define('SMTP_ENCRYPTION', 'ssl'); // ssl or tls
}

/**
 * Send an HTML email via SMTP.
 *
 * @param string $to
 * @param string $subject
 * @param string $htmlBody
 * @param string $fromEmail
 * @param string $fromName
 * @param string|null $replyTo
 * @return array [success => bool, log => string]
 */
function smtpSendHtml($to, $subject, $htmlBody, $fromEmail, $fromName, $replyTo = null) {
    $log = [];

    $host = SMTP_HOST;
    $port = SMTP_PORT;
    $username = SMTP_USER;
    $password = SMTP_PASS;
    $encryption = strtolower(SMTP_ENCRYPTION);

    if (!$host || !$port || !$username || !$password) {
        return [
            'success' => false,
            'log' => 'SMTP not fully configured',
        ];
    }

    $remote = $encryption === 'ssl' ? "ssl://{$host}" : $host;

    $errno = 0;
    $errstr = '';
    $fp = @fsockopen($remote, $port, $errno, $errstr, 15);
    if (!$fp) {
        return [
            'success' => false,
            'log' => "fsockopen failed: {$errno} {$errstr}",
        ];
    }

    stream_set_timeout($fp, 15);

    $read = function() use ($fp, &$log) {
        $data = '';
        while ($str = fgets($fp, 515)) {
            $data .= $str;
            if (isset($str[3]) && $str[3] === ' ') break; // end of multi-line
        }
        $log[] = 'S: ' . trim($data);
        return $data;
    };

    $write = function($cmd) use ($fp, &$log) {
        $log[] = 'C: ' . trim($cmd);
        fwrite($fp, $cmd . "\r\n");
    };

    $resp = $read();
    if (strpos($resp, '220') !== 0) {
        fclose($fp);
        return [
            'success' => false,
            'log' => implode("\n", array_merge($log, ["Unexpected greeting: {$resp}"])),
        ];
    }

    $ehloDomain = 'ocwanderer.com';
    $write("EHLO {$ehloDomain}");
    $resp = $read();
    if (strpos($resp, '250') !== 0) {
        fclose($fp);
        return [
            'success' => false,
            'log' => implode("\n", array_merge($log, ["EHLO failed: {$resp}"])),
        ];
    }

    if ($encryption === 'tls') {
        $write('STARTTLS');
        $resp = $read();
        if (strpos($resp, '220') !== 0) {
            fclose($fp);
            return [
                'success' => false,
                'log' => implode("\n", array_merge($log, ["STARTTLS failed: {$resp}"])),
            ];
        }
        if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            fclose($fp);
            return [
                'success' => false,
                'log' => implode("\n", array_merge($log, ["TLS enable failed"])),
            ];
        }
        // Re-EHLO after STARTTLS
        $write("EHLO {$ehloDomain}");
        $resp = $read();
        if (strpos($resp, '250') !== 0) {
            fclose($fp);
            return [
                'success' => false,
                'log' => implode("\n", array_merge($log, ["EHLO after STARTTLS failed: {$resp}"])),
            ];
        }
    }

    // AUTH LOGIN
    $write('AUTH LOGIN');
    $resp = $read();
    if (strpos($resp, '334') !== 0) {
        fclose($fp);
        return [
            'success' => false,
            'log' => implode("\n", array_merge($log, ["AUTH LOGIN not accepted: {$resp}"])),
        ];
    }

    $write(base64_encode($username));
    $resp = $read();
    if (strpos($resp, '334') !== 0) {
        fclose($fp);
        return [
            'success' => false,
            'log' => implode("\n", array_merge($log, ["Username not accepted: {$resp}"])),
        ];
    }

    $write(base64_encode($password));
    $resp = $read();
    if (strpos($resp, '235') !== 0) {
        fclose($fp);
        return [
            'success' => false,
            'log' => implode("\n", array_merge($log, ["Password not accepted: {$resp}"])),
        ];
    }

    // MAIL FROM and RCPT TO
    // Hostinger requires the authenticated user address as the envelope sender
    $mailFrom = $username;
    $write('MAIL FROM: <' . $mailFrom . '>');
    $resp = $read();
    if (strpos($resp, '250') !== 0) {
        fclose($fp);
        return [
            'success' => false,
            'log' => implode("\n", array_merge($log, ["MAIL FROM failed: {$resp}"])),
        ];
    }

    $write('RCPT TO: <' . $to . '>');
    $resp = $read();
    if (strpos($resp, '250') !== 0 && strpos($resp, '251') !== 0) {
        fclose($fp);
        return [
            'success' => false,
            'log' => implode("\n", array_merge($log, ["RCPT TO failed: {$resp}"])),
        ];
    }

    $write('DATA');
    $resp = $read();
    if (strpos($resp, '354') !== 0) {
        fclose($fp);
        return [
            'success' => false,
            'log' => implode("\n", array_merge($log, ["DATA not accepted: {$resp}"])),
        ];
    }

    // Build headers and message
    $headers = [];
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-Type: text/html; charset=UTF-8';
    $headers[] = 'From: ' . $fromName . ' <' . $fromEmail . '>';
    $headers[] = 'Reply-To: ' . ($replyTo ?: $fromEmail);
    $headers[] = 'X-Mailer: PHP/' . phpversion();

    $data = '';
    $data .= 'Subject: ' . $subject . "\r\n";
    $data .= 'To: ' . $to . "\r\n";
    $data .= implode("\r\n", $headers) . "\r\n\r\n";
    $data .= $htmlBody . "\r\n.\r\n";

    fwrite($fp, $data);
    $log[] = 'C: [message data]';
    $resp = $read();
    if (strpos($resp, '250') !== 0) {
        fclose($fp);
        return [
            'success' => false,
            'log' => implode("\n", array_merge($log, ["DATA send failed: {$resp}"])),
        ];
    }

    $write('QUIT');
    $read();
    fclose($fp);

    return [
        'success' => true,
        'log' => implode("\n", $log),
    ];
}
