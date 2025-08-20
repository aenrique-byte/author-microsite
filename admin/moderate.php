<?php
// Enable full error reporting to find the root cause
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comment Moderation - My Stories</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background-color: #0a0a0a; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .tab-button.active { background-color: #1f2937; border-bottom: 2px solid #3b82f6; }
    </style>
</head>
<body class="bg-neutral-950 text-neutral-100 min-h-screen">
    <?php
    require_once '../api/db-config.php';
    
    // Simple authentication (improve this for production)
    session_start();
    if (!isset($_SESSION['admin_logged_in'])) {
        $adminUsername = env('ADMIN_USERNAME', 'admin');
        $adminPassword = env('ADMIN_PASSWORD', 'change_this_password');
        
        if ($_POST['username'] ?? '' === $adminUsername && ($_POST['password'] ?? '') === $adminPassword) {
            $_SESSION['admin_logged_in'] = true;
        } else {
            // Show login form
            ?>
            <div class="min-h-screen flex items-center justify-center">
                <div class="bg-neutral-900 p-8 rounded-lg w-96">
                    <h1 class="text-2xl font-bold mb-6 text-center">Admin Login</h1>
                    <form method="POST" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-1">Username</label>
                            <input type="text" name="username" required 
                                   class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-neutral-200">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Password</label>
                            <input type="password" name="password" required 
                                   class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-neutral-200">
                        </div>
                        <button type="submit" 
                                class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors">
                            Login
                        </button>
                    </form>
                    <p class="text-sm text-neutral-500 mt-4 text-center">
                        Username: admin
                    </p>
                </div>
            </div>
            <?php
            exit;
        }
    }
    
    // Create banned_ips table if it doesn't exist
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS banned_ips (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ip_address VARCHAR(45) NOT NULL UNIQUE,
            reason TEXT,
            banned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            banned_by VARCHAR(50) DEFAULT 'admin',
            INDEX idx_ip (ip_address)
        )");
    } catch (PDOException $e) {
        // Table might already exist, continue
    }
    
    // Handle actions
    $message = '';
    if ($_POST['action'] ?? '' === 'approve') {
        $stmt = $pdo->prepare("UPDATE chapter_comments SET is_approved = 1 WHERE id = ?");
        $stmt->execute([$_POST['comment_id']]);
        $message = "Comment approved!";
    } elseif ($_POST['action'] ?? '' === 'delete') {
        $stmt = $pdo->prepare("DELETE FROM chapter_comments WHERE id = ?");
        $stmt->execute([$_POST['comment_id']]);
        $message = "Comment deleted!";
    } elseif ($_POST['action'] ?? '' === 'ban_ip') {
        $comment_id = $_POST['comment_id'];
        $reason = $_POST['reason'] ?? 'Banned from comment moderation';
        
        // Get the IP address from the comment
        $stmt = $pdo->prepare("SELECT ip_address FROM chapter_comments WHERE id = ?");
        $stmt->execute([$comment_id]);
        $comment = $stmt->fetch();
        
        if ($comment) {
            // Add IP to banned list
            $stmt = $pdo->prepare("INSERT IGNORE INTO banned_ips (ip_address, reason) VALUES (?, ?)");
            $stmt->execute([$comment['ip_address'], $reason]);
            
            // Delete the comment
            $stmt = $pdo->prepare("DELETE FROM chapter_comments WHERE id = ?");
            $stmt->execute([$comment_id]);
            
            $message = "IP {$comment['ip_address']} has been banned and comment deleted!";
        }
    } elseif ($_POST['action'] ?? '' === 'unban_ip') {
        $ip_address = $_POST['ip_address'];
        $stmt = $pdo->prepare("DELETE FROM banned_ips WHERE ip_address = ?");
        $stmt->execute([$ip_address]);
        $message = "IP {$ip_address} has been unbanned!";
    } elseif ($_POST['action'] ?? '' === 'logout') {
        session_destroy();
        header('Location: moderate.php');
        exit;
    }
    
    // Get pending comments
    $stmt = $pdo->prepare("
        SELECT id, story_id, chapter_id, comment_text, author_name, created_at, ip_address 
        FROM chapter_comments 
        WHERE is_approved = 0 
        ORDER BY created_at DESC
    ");
    $stmt->execute();
    $pendingComments = $stmt->fetchAll();
    
    // Get approved comments
    $stmt = $pdo->prepare("
        SELECT id, story_id, chapter_id, comment_text, author_name, created_at, ip_address 
        FROM chapter_comments 
        WHERE is_approved = 1 
        ORDER BY created_at DESC
        LIMIT 50
    ");
    $stmt->execute();
    $approvedComments = $stmt->fetchAll();
    
    // Get banned IPs
    $stmt = $pdo->prepare("
        SELECT ip_address, reason, banned_at, banned_by 
        FROM banned_ips 
        ORDER BY banned_at DESC
    ");
    $stmt->execute();
    $bannedIPs = $stmt->fetchAll();
    
    // Get approved comments count
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM chapter_comments WHERE is_approved = 1");
    $stmt->execute();
    $approvedCount = $stmt->fetch()['count'];
    
    // Get total likes count
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM chapter_likes");
    $stmt->execute();
    $likesCount = $stmt->fetch()['count'];
    
    // Get banned IPs count
    $bannedCount = count($bannedIPs);
    ?>
    
    <div class="container mx-auto px-4 py-8 max-w-6xl">
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-bold">Comment Moderation</h1>
            <form method="POST" class="inline">
                <input type="hidden" name="action" value="logout">
                <button type="submit" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors">
                    Logout
                </button>
            </form>
        </div>
        
        <?php if ($message): ?>
            <div class="bg-green-900 text-green-200 p-4 rounded mb-6">
                <?= htmlspecialchars($message) ?>
            </div>
        <?php endif; ?>
        
        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-neutral-900 p-6 rounded-lg">
                <h3 class="text-lg font-semibold mb-2">Pending Comments</h3>
                <p class="text-3xl font-bold text-yellow-400"><?= count($pendingComments) ?></p>
            </div>
            <div class="bg-neutral-900 p-6 rounded-lg">
                <h3 class="text-lg font-semibold mb-2">Approved Comments</h3>
                <p class="text-3xl font-bold text-green-400"><?= $approvedCount ?></p>
            </div>
            <div class="bg-neutral-900 p-6 rounded-lg">
                <h3 class="text-lg font-semibold mb-2">Total Likes</h3>
                <p class="text-3xl font-bold text-red-400"><?= $likesCount ?></p>
            </div>
            <div class="bg-neutral-900 p-6 rounded-lg">
                <h3 class="text-lg font-semibold mb-2">Banned IPs</h3>
                <p class="text-3xl font-bold text-orange-400"><?= $bannedCount ?></p>
            </div>
        </div>
        
        <!-- Tab Navigation -->
        <div class="bg-neutral-900 rounded-lg mb-6">
            <div class="flex border-b border-neutral-700">
                <button onclick="showTab('pending')" class="tab-button active px-6 py-3 text-sm font-medium text-neutral-300 hover:text-white transition-colors">
                    Pending Comments (<?= count($pendingComments) ?>)
                </button>
                <button onclick="showTab('approved')" class="tab-button px-6 py-3 text-sm font-medium text-neutral-300 hover:text-white transition-colors">
                    Approved Comments (<?= $approvedCount ?>)
                </button>
                <button onclick="showTab('banned')" class="tab-button px-6 py-3 text-sm font-medium text-neutral-300 hover:text-white transition-colors">
                    Banned IPs (<?= $bannedCount ?>)
                </button>
            </div>
            
            <!-- Pending Comments Tab -->
            <div id="pending" class="tab-content active p-6">
                <h2 class="text-xl font-bold mb-6">Pending Comments</h2>
                
                <?php if (empty($pendingComments)): ?>
                    <p class="text-neutral-400 italic">No pending comments to review.</p>
                <?php else: ?>
                    <div class="space-y-6">
                        <?php foreach ($pendingComments as $comment): ?>
                            <div class="border border-neutral-700 rounded-lg p-4">
                                <div class="flex justify-between items-start mb-3">
                                    <div>
                                        <span class="font-medium text-neutral-300"><?= htmlspecialchars($comment['author_name']) ?></span>
                                        <span class="text-neutral-500 ml-2">on</span>
                                        <span class="text-blue-400 ml-1"><?= htmlspecialchars($comment['story_id']) ?></span>
                                        <span class="text-neutral-500 ml-1">Chapter <?= $comment['chapter_id'] ?></span>
                                    </div>
                                    <div class="text-sm text-neutral-500">
                                        <?= date('M j, Y g:i A', strtotime($comment['created_at'])) ?>
                                        <br>
                                        <span class="text-xs">IP: <?= htmlspecialchars($comment['ip_address']) ?></span>
                                    </div>
                                </div>
                                
                                <div class="bg-neutral-800 p-3 rounded mb-4">
                                    <p class="text-neutral-200 whitespace-pre-wrap"><?= htmlspecialchars($comment['comment_text']) ?></p>
                                </div>
                                
                                <div class="flex gap-3">
                                    <form method="POST" class="inline">
                                        <input type="hidden" name="action" value="approve">
                                        <input type="hidden" name="comment_id" value="<?= $comment['id'] ?>">
                                        <button type="submit" 
                                                class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors">
                                            Approve
                                        </button>
                                    </form>
                                    
                                    <form method="POST" class="inline" 
                                          onsubmit="return confirm('Are you sure you want to delete this comment?')">
                                        <input type="hidden" name="action" value="delete">
                                        <input type="hidden" name="comment_id" value="<?= $comment['id'] ?>">
                                        <button type="submit" 
                                                class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors">
                                            Delete
                                        </button>
                                    </form>
                                    
                                    <form method="POST" class="inline" 
                                          onsubmit="return confirm('Are you sure you want to ban this IP and delete the comment?')">
                                        <input type="hidden" name="action" value="ban_ip">
                                        <input type="hidden" name="comment_id" value="<?= $comment['id'] ?>">
                                        <input type="hidden" name="reason" value="Spam/inappropriate content">
                                        <button type="submit" 
                                                class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded transition-colors">
                                            Ban IP
                                        </button>
                                    </form>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>
            
            <!-- Approved Comments Tab -->
            <div id="approved" class="tab-content p-6">
                <h2 class="text-xl font-bold mb-6">Approved Comments (Last 50)</h2>
                
                <?php if (empty($approvedComments)): ?>
                    <p class="text-neutral-400 italic">No approved comments found.</p>
                <?php else: ?>
                    <div class="space-y-6">
                        <?php foreach ($approvedComments as $comment): ?>
                            <div class="border border-neutral-700 rounded-lg p-4">
                                <div class="flex justify-between items-start mb-3">
                                    <div>
                                        <span class="font-medium text-neutral-300"><?= htmlspecialchars($comment['author_name']) ?></span>
                                        <span class="text-neutral-500 ml-2">on</span>
                                        <span class="text-blue-400 ml-1"><?= htmlspecialchars($comment['story_id']) ?></span>
                                        <span class="text-neutral-500 ml-1">Chapter <?= $comment['chapter_id'] ?></span>
                                        <span class="bg-green-800 text-green-200 px-2 py-1 rounded text-xs ml-2">APPROVED</span>
                                    </div>
                                    <div class="text-sm text-neutral-500">
                                        <?= date('M j, Y g:i A', strtotime($comment['created_at'])) ?>
                                        <br>
                                        <span class="text-xs">IP: <?= htmlspecialchars($comment['ip_address']) ?></span>
                                    </div>
                                </div>
                                
                                <div class="bg-neutral-800 p-3 rounded mb-4">
                                    <p class="text-neutral-200 whitespace-pre-wrap"><?= htmlspecialchars($comment['comment_text']) ?></p>
                                </div>
                                
                                <div class="flex gap-3">
                                    <form method="POST" class="inline" 
                                          onsubmit="return confirm('Are you sure you want to delete this approved comment?')">
                                        <input type="hidden" name="action" value="delete">
                                        <input type="hidden" name="comment_id" value="<?= $comment['id'] ?>">
                                        <button type="submit" 
                                                class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors">
                                            Delete
                                        </button>
                                    </form>
                                    
                                    <form method="POST" class="inline" 
                                          onsubmit="return confirm('Are you sure you want to ban this IP and delete the comment?')">
                                        <input type="hidden" name="action" value="ban_ip">
                                        <input type="hidden" name="comment_id" value="<?= $comment['id'] ?>">
                                        <input type="hidden" name="reason" value="Retroactive ban">
                                        <button type="submit" 
                                                class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded transition-colors">
                                            Ban IP
                                        </button>
                                    </form>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>
            
            <!-- Banned IPs Tab -->
            <div id="banned" class="tab-content p-6">
                <h2 class="text-xl font-bold mb-6">Banned IP Addresses</h2>
                
                <?php if (empty($bannedIPs)): ?>
                    <p class="text-neutral-400 italic">No banned IP addresses.</p>
                <?php else: ?>
                    <div class="space-y-4">
                        <?php foreach ($bannedIPs as $banned): ?>
                            <div class="border border-neutral-700 rounded-lg p-4">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <div class="font-medium text-neutral-300 mb-2">
                                            IP: <span class="text-red-400"><?= htmlspecialchars($banned['ip_address']) ?></span>
                                        </div>
                                        <div class="text-sm text-neutral-500 mb-2">
                                            Banned: <?= date('M j, Y g:i A', strtotime($banned['banned_at'])) ?>
                                            by <?= htmlspecialchars($banned['banned_by']) ?>
                                        </div>
                                        <?php if ($banned['reason']): ?>
                                            <div class="text-sm text-neutral-400">
                                                Reason: <?= htmlspecialchars($banned['reason']) ?>
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                    <form method="POST" class="inline" 
                                          onsubmit="return confirm('Are you sure you want to unban this IP address?')">
                                        <input type="hidden" name="action" value="unban_ip">
                                        <input type="hidden" name="ip_address" value="<?= htmlspecialchars($banned['ip_address']) ?>">
                                        <button type="submit" 
                                                class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors">
                                            Unban
                                        </button>
                                    </form>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
    
    <script>
        function showTab(tabName) {
            // Hide all tab contents
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Remove active class from all tab buttons
            const tabButtons = document.querySelectorAll('.tab-button');
            tabButtons.forEach(button => button.classList.remove('active'));
            
            // Show selected tab content
            document.getElementById(tabName).classList.add('active');
            
            // Add active class to clicked button
            event.target.classList.add('active');
        }
    </script>
</body>
</html>
