<?php
/**
 * Email Test Script
 * Upload this to your server and visit it to test email functionality
 */

// Set content type to HTML
header('Content-Type: text/html; charset=UTF-8');

// Don't include config.php CORS headers for this page
$skipCorsHeaders = true;

// Get config values directly
define('DB_HOST', 'localhost');
define('DB_NAME', 'u473142779_authorsite2');
define('DB_USER', 'u473142779_author_user2');
define('DB_PASS', '68uV9*qLrF#v');

// Read config file to get email settings
$configFile = file_get_contents(__DIR__ . '/config.php');

// Extract email settings using regex
preg_match("/define\('ADMIN_EMAIL',\s*'([^']+)'\)/", $configFile, $adminMatch);
preg_match("/define\('FROM_EMAIL',\s*'([^']+)'\)/", $configFile, $fromMatch);
preg_match("/define\('FROM_NAME',\s*'([^']+)'\)/", $configFile, $nameMatch);

if (!defined('ADMIN_EMAIL') && isset($adminMatch[1])) define('ADMIN_EMAIL', $adminMatch[1]);
if (!defined('FROM_EMAIL') && isset($fromMatch[1])) define('FROM_EMAIL', $fromMatch[1]);
if (!defined('FROM_NAME') && isset($nameMatch[1])) define('FROM_NAME', $nameMatch[1]);

// Fallbacks
if (!defined('ADMIN_EMAIL')) define('ADMIN_EMAIL', 'ocwanderer@ocwanderer.com');
if (!defined('FROM_EMAIL')) define('FROM_EMAIL', 'noreply@ocwanderer.com');
if (!defined('FROM_NAME')) define('FROM_NAME', 'Shoutout Manager');

// Test email settings
$testEmail = ADMIN_EMAIL; // Default: send to your admin email

// Allow overriding the recipient via URL, e.g. ?to=you@gmail.com
if (isset($_GET['to']) && filter_var($_GET['to'], FILTER_VALIDATE_EMAIL)) {
    $testEmail = $_GET['to'];
}

$fromEmail = FROM_EMAIL;
$fromName = FROM_NAME;

echo "<h1>📧 Email Test</h1>";
echo "<style>body { font-family: system-ui; max-width: 800px; margin: 40px auto; padding: 20px; } .success { color: green; } .error { color: red; } .info { color: blue; } pre { background: #f5f5f5; padding: 15px; border-radius: 8px; overflow-x: auto; }</style>";

// Check configuration
echo "<h2>1. Configuration Check</h2>";
echo "<p><strong>ADMIN_EMAIL:</strong> " . (defined('ADMIN_EMAIL') ? ADMIN_EMAIL : '<span class="error">NOT SET</span>') . "</p>";
echo "<p><strong>FROM_EMAIL:</strong> " . (defined('FROM_EMAIL') ? FROM_EMAIL : '<span class="error">NOT SET</span>') . "</p>";
echo "<p><strong>FROM_NAME:</strong> " . (defined('FROM_NAME') ? FROM_NAME : '<span class="error">NOT SET</span>') . "</p>";

// Check if mail function exists
echo "<h2>2. PHP Mail Function</h2>";
if (function_exists('mail')) {
    echo "<p class='success'>✓ PHP mail() function is available</p>";
} else {
    echo "<p class='error'>✗ PHP mail() function is NOT available</p>";
    echo "<p>Your hosting may have disabled the mail function. Contact your hosting provider.</p>";
    exit;
}

// Check sendmail path
echo "<h2>3. Sendmail Configuration</h2>";
$sendmailPath = ini_get('sendmail_path');
echo "<p><strong>sendmail_path:</strong> " . ($sendmailPath ?: '<span class="info">Not set (using default)</span>') . "</p>";

// Try to send a test email
echo "<h2>4. Send Test Email</h2>";

if (isset($_GET['send'])) {
    // Enable error reporting for debugging
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    
    $subject = "Test Email from Shoutout Manager - " . date('Y-m-d H:i:s');
    
    $htmlBody = '
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: system-ui; padding: 20px;">
    <div style="max-width: 500px; margin: 0 auto; background: #f8fafc; padding: 30px; border-radius: 12px;">
        <h1 style="color: #f59e0b;">🎉 Email Test Successful!</h1>
        <p>If you\'re reading this, your email is working correctly.</p>
        <p><strong>Sent at:</strong> ' . date('F j, Y g:i:s A') . '</p>
        <p><strong>From:</strong> ' . htmlspecialchars($fromName) . ' &lt;' . htmlspecialchars($fromEmail) . '&gt;</p>
        <p><strong>To:</strong> ' . htmlspecialchars($testEmail) . '</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #64748b; font-size: 12px;">This is a test email from your Shoutout Manager installation.</p>
    </div>
</body>
</html>';

    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'From: ' . $fromName . ' <' . $fromEmail . '>',
        'Reply-To: ' . $fromEmail,
        'X-Mailer: PHP/' . phpversion()
    ];
    
    echo "<p>Attempting to send email to: <strong>" . htmlspecialchars($testEmail) . "</strong></p>";
    echo "<p>From: <strong>" . htmlspecialchars($fromName) . " &lt;" . htmlspecialchars($fromEmail) . "&gt;</strong></p>";
    
    // Try sending with error capture
    ob_start();
    $result = mail($testEmail, $subject, $htmlBody, implode("\r\n", $headers));
    $mailOutput = ob_get_clean();
    
    if ($result) {
        echo "<p class='success'>✓ mail() returned TRUE - Email was accepted for delivery</p>";
        echo "<p class='info'>📬 Check your inbox (and spam folder) at: <strong>" . htmlspecialchars($testEmail) . "</strong></p>";
        echo "<p><em>Note: It may take a few minutes to arrive. Also check your spam/junk folder!</em></p>";
        
        if ($mailOutput) {
            echo "<p>Mail output: " . htmlspecialchars($mailOutput) . "</p>";
        }
        
        // Try alternative: using -f flag for envelope sender
        echo "<h3>Alternative Test (with envelope sender)</h3>";
        $headers2 = implode("\r\n", $headers);
        $additionalParams = '-f' . $fromEmail;
        $result2 = @mail($testEmail, $subject . " (v2)", $htmlBody, $headers2, $additionalParams);
        if ($result2) {
            echo "<p class='success'>✓ Alternative method also succeeded</p>";
        } else {
            echo "<p class='info'>Alternative method returned false (this is okay if first method worked)</p>";
        }
        
    } else {
        echo "<p class='error'>✗ mail() returned FALSE - Email was NOT sent</p>";
        
        // Get last error
        $error = error_get_last();
        if ($error) {
            echo "<p class='error'>Error: " . htmlspecialchars($error['message']) . "</p>";
        }
        
        echo "<h3>Possible Solutions:</h3>";
        echo "<ul>";
        echo "<li><strong>Check FROM_EMAIL:</strong> On shared hosting, the FROM email often must be a valid email address on your domain (e.g., noreply@yourdomain.com)</li>";
        echo "<li><strong>Contact Hosting:</strong> Ask your hosting provider if PHP mail() is enabled and what restrictions apply</li>";
        echo "<li><strong>Use SMTP:</strong> Consider using an SMTP service like SendGrid, Mailgun, or your hosting's SMTP server</li>";
        echo "</ul>";
    }
} else {
    echo "<p>Click the button below to send a test email to: <strong>" . htmlspecialchars($testEmail) . "</strong></p>";
    echo "<a href='?send=1' style='display: inline-block; background: #f59e0b; color: #1e293b; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;'>📧 Send Test Email</a>";
}

// Additional debugging info
echo "<h2>5. Server Information</h2>";
echo "<pre>";
echo "PHP Version: " . phpversion() . "\n";
echo "Server: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Unknown') . "\n";
echo "Hostname: " . gethostname() . "\n";
echo "SMTP: " . ini_get('SMTP') . "\n";
echo "smtp_port: " . ini_get('smtp_port') . "\n";
echo "</pre>";

// Common issues
echo "<h2>6. Common Issues on Shared Hosting</h2>";
echo "<ul>";
echo "<li><strong>FROM email must match domain:</strong> Many hosts require the FROM email to be from your domain (e.g., noreply@ocwanderer.com instead of a Gmail address)</li>";
echo "<li><strong>SPF/DKIM records:</strong> For better deliverability, set up SPF and DKIM records in your domain's DNS</li>";
echo "<li><strong>Spam filters:</strong> Test emails often go to spam - check your spam folder</li>";
echo "<li><strong>Rate limits:</strong> Shared hosting often limits how many emails you can send per hour</li>";
echo "</ul>";

echo "<h2>7. Recommended: Update FROM_EMAIL</h2>";
echo "<p>In your <code>api/config.php</code>, make sure FROM_EMAIL uses your domain:</p>";
echo "<pre>";
echo "define('FROM_EMAIL', 'noreply@ocwanderer.com'); // Use YOUR domain\n";
echo "define('FROM_NAME', 'Shoutout Manager');";
echo "</pre>";
?>
