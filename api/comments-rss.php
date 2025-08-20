<?php
require_once 'config.php';

// Set content type to RSS/XML
header('Content-Type: application/rss+xml; charset=utf-8');

try {
    // Get pending comments
    $stmt = $pdo->prepare("
        SELECT id, story_id, chapter_id, comment_text, author_name, created_at, ip_address 
        FROM chapter_comments 
        WHERE is_approved = 0 
        ORDER BY created_at DESC 
        LIMIT 50
    ");
    $stmt->execute();
    $pendingComments = $stmt->fetchAll();
    
    // Get count for title
    $commentCount = count($pendingComments);
    
    // Generate RSS XML
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>Story Comments - Pending Moderation (<?= $commentCount ?>)</title>
        <link>https://aenrique.com/storytime/admin/moderate.php</link>
        <description>Pending comments awaiting moderation on your story website</description>
        <language>en-us</language>
        <lastBuildDate><?= date('r') ?></lastBuildDate>
        <atom:link href="https://aenrique.com/storytime/api/comments-rss.php" rel="self" type="application/rss+xml" />
        
        <?php if (empty($pendingComments)): ?>
        <item>
            <title>No Pending Comments</title>
            <link>https://aenrique.com/storytime/admin/moderate.php</link>
            <description>All comments have been moderated. No pending comments at this time.</description>
            <pubDate><?= date('r') ?></pubDate>
            <guid>no-pending-<?= date('Y-m-d-H') ?></guid>
        </item>
        <?php else: ?>
            <?php foreach ($pendingComments as $comment): ?>
        <item>
            <title>New Comment on <?= htmlspecialchars($comment['story_id']) ?> - Chapter <?= $comment['chapter_id'] ?></title>
            <link>https://aenrique.com/storytime/admin/moderate.php</link>
            <description><![CDATA[
                <strong>Author:</strong> <?= htmlspecialchars($comment['author_name']) ?><br>
                <strong>Story:</strong> <?= htmlspecialchars($comment['story_id']) ?><br>
                <strong>Chapter:</strong> <?= $comment['chapter_id'] ?><br>
                <strong>IP:</strong> <?= htmlspecialchars($comment['ip_address']) ?><br>
                <strong>Submitted:</strong> <?= date('M j, Y g:i A', strtotime($comment['created_at'])) ?><br><br>
                <strong>Comment:</strong><br>
                <?= nl2br(htmlspecialchars($comment['comment_text'])) ?><br><br>
                <a href="https://aenrique.com/storytime/admin/moderate.php">Moderate Comments</a>
            ]]></description>
            <pubDate><?= date('r', strtotime($comment['created_at'])) ?></pubDate>
            <guid>comment-<?= $comment['id'] ?></guid>
        </item>
            <?php endforeach; ?>
        <?php endif; ?>
    </channel>
</rss>
<?php
} catch (PDOException $e) {
    // If database error, return a basic RSS with error message
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    ?>
<rss version="2.0">
    <channel>
        <title>Story Comments RSS - Error</title>
        <link>https://aenrique.com/storytime/admin/moderate.php</link>
        <description>Error loading comments RSS feed</description>
        <item>
            <title>RSS Feed Error</title>
            <description>Unable to load pending comments. Please check the admin panel directly.</description>
            <pubDate><?= date('r') ?></pubDate>
        </item>
    </channel>
</rss>
<?php
}
?>
