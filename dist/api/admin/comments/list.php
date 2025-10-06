<?php
require_once '../../bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Check authentication - session already started in bootstrap.php
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

try {
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : 20;
    $offset = ($page - 1) * $limit;

    // Build WHERE clause based on filters
    $whereConditions = [];
    $params = [];

    if (isset($_GET['status']) && $_GET['status'] !== 'all') {
        if ($_GET['status'] === 'approved') {
            $whereConditions[] = "is_approved = 1";
        } elseif ($_GET['status'] === 'pending') {
            $whereConditions[] = "is_approved = 0";
        }
    }

    $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';

    // Get comments from both tables with proper content context and links
    $sql = "
        SELECT 
            ic.id,
            ic.author_name,
            ic.content,
            ic.is_approved,
            ic.ip_address,
            ic.created_at,
            'image' as comment_type,
            COALESCE(i.title, 'Untitled Image') as content_title,
            CONCAT('Image in Gallery: ', COALESCE(g.title, 'Unknown Gallery')) as content_context,
            CONCAT('/imagemanager/#/gallery/', g.slug, '/image/', i.id) as content_link,
            ic.image_id as content_id
        FROM image_comments ic
        LEFT JOIN images i ON ic.image_id = i.id
        LEFT JOIN galleries g ON i.gallery_id = g.id
        " . str_replace('is_approved', 'ic.is_approved', $whereClause) . "
        UNION ALL
        SELECT 
            c.id,
            c.author_name,
            c.content,
            c.is_approved,
            c.ip_address,
            c.created_at,
            'chapter' as comment_type,
            CASE 
                WHEN ch.title IS NOT NULL AND ch.chapter_number IS NOT NULL THEN 
                    CONCAT('Chapter ', ch.chapter_number, ': ', ch.title)
                WHEN ch.chapter_number IS NOT NULL THEN 
                    CONCAT('Chapter ', ch.chapter_number)
                ELSE 
                    CONCAT('Chapter ID: ', c.chapter_id)
            END as content_title,
            CASE 
                WHEN s.title IS NOT NULL THEN 
                    CONCAT('Story: ', s.title)
                ELSE 
                    CONCAT('Story ID: ', ch.story_id)
            END as content_context,
            CASE 
                WHEN s.slug IS NOT NULL AND ch.chapter_number IS NOT NULL THEN 
                    CONCAT('/storytime/story/', s.slug, '/chapter/', ch.chapter_number)
                ELSE 
                    CONCAT('/admin/stories?chapter_id=', c.chapter_id)
            END as content_link,
            c.chapter_id as content_id
        FROM chapter_comments c
        LEFT JOIN chapters ch ON c.chapter_id = ch.id
        LEFT JOIN stories s ON ch.story_id = s.id
        " . str_replace('is_approved', 'c.is_approved', $whereClause) . "
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    ";

    // Get total count
    $countSql = "
        SELECT COUNT(*) FROM (
            SELECT id FROM image_comments $whereClause
            UNION ALL
            SELECT id FROM chapter_comments " . str_replace('is_approved', 'is_approved', $whereClause) . "
        ) total_comments
    ";
    
    $stmt = $pdo->prepare($countSql);
    $stmt->execute($params);
    $total = $stmt->fetchColumn();
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute(array_merge($params, $params, [$limit, $offset]));
    $comments = $stmt->fetchAll();

    echo json_encode([
        'comments' => $comments,
        'total' => $total,
        'page' => $page,
        'limit' => $limit,
        'pages' => ceil($total / $limit)
    ]);

} catch (Exception $e) {
    error_log("Comments list error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load comments']);
}
?>
