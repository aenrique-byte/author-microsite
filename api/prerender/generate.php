<?php
/**
 * Pre-render Generator for SEO
 * 
 * Generates static HTML files from MySQL content for bot consumption.
 * Run this script after publishing new content:
 *   php api/prerender/generate.php
 * 
 * Or trigger via admin panel API endpoint.
 */

// Ensure we're running from CLI or authenticated admin
if (php_sapi_name() !== 'cli') {
    require_once __DIR__ . '/../bootstrap.php';
    requireAuth();
    header('Content-Type: application/json');
    // Use the $pdo from bootstrap.php
    global $pdo;
} else {
    // CLI mode setup
    require_once __DIR__ . '/../config.php';

    // Database connection for CLI
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    } catch (PDOException $e) {
        die("Database connection failed: " . $e->getMessage() . "\n");
    }
}

// ============ Configuration ============

$outputDir = __DIR__ . '/../../public/prerender';
$stats = [
    'total' => 0,
    'homepage' => 0,
    'stories' => 0,
    'chapters' => 0,
    'galleries' => 0,
    'blog' => 0,
    'errors' => []
];

// ============ Fetch Author Profile ============

function getAuthorProfile($pdo) {
    $stmt = $pdo->query("SELECT name, bio, tagline, profile_image, site_domain FROM author_profile LIMIT 1");
    $profile = $stmt->fetch();
    
    if (!$profile) {
        return [
            'name' => 'O.C. Wanderer',
            'bio' => 'Sci-Fi & Fantasy Author',
            'tagline' => 'Worlds of adventure, danger, and love',
            'profile_image' => null,
            'site_domain' => 'authorsite.com'
        ];
    }
    return $profile;
}

$author = getAuthorProfile($pdo);
$baseUrl = 'https://' . ($author['site_domain'] ?? 'yoursite.com');

// ============ Output Functions ============

function output($message) {
    if (php_sapi_name() === 'cli') {
        echo $message . "\n";
    }
}

function escapeHtml($text) {
    return htmlspecialchars($text ?? '', ENT_QUOTES, 'UTF-8');
}

function truncate($text, $length = 160) {
    $text = strip_tags($text ?? '');
    if (strlen($text) <= $length) {
        return $text;
    }
    return substr($text, 0, $length - 3) . '...';
}

// ============ HTML Templates ============

function generateHtmlPage($data) {
    $title = escapeHtml($data['title']);
    $description = escapeHtml(truncate($data['description'], 160));
    $canonicalUrl = escapeHtml($data['url']);
    $image = escapeHtml($data['image'] ?? '');
    $type = $data['type'] ?? 'website';
    $authorName = escapeHtml($data['author']);
    $bodyContent = $data['body'] ?? '';
    
    $imageMetaTags = '';
    if (!empty($image)) {
        $imageMetaTags = <<<HTML
    <meta property="og:image" content="{$image}">
    <meta name="twitter:image" content="{$image}">
HTML;
    }
    
    return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$title}</title>
    <meta name="description" content="{$description}">
    <link rel="canonical" href="{$canonicalUrl}">
    
    <!-- Open Graph -->
    <meta property="og:type" content="{$type}">
    <meta property="og:title" content="{$title}">
    <meta property="og:description" content="{$description}">
    <meta property="og:url" content="{$canonicalUrl}">
    <meta property="og:site_name" content="{$authorName}">
{$imageMetaTags}
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{$title}">
    <meta name="twitter:description" content="{$description}">
    
    <!-- Schema.org JSON-LD -->
    <script type="application/ld+json">
    {$data['schema']}
    </script>
    
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #1a1a1a; }
        p { color: #4a4a4a; line-height: 1.6; }
        .meta { color: #666; font-size: 0.9em; }
        noscript { display: block; background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <main>
        {$bodyContent}
        <noscript>
            <p>This page works best with JavaScript enabled. Please enable JavaScript for the full experience.</p>
        </noscript>
    </main>
</body>
</html>
HTML;
}

// ============ Page Generators ============

function generateHomepage($author, $baseUrl, $outputDir, &$stats) {
    output("Generating homepage...");
    
    $schema = json_encode([
        "@context" => "https://schema.org",
        "@type" => "Person",
        "name" => $author['name'],
        "description" => $author['bio'],
        "url" => $baseUrl,
        "image" => $author['profile_image'] ?? ''
    ], JSON_UNESCAPED_SLASHES);
    
    $html = generateHtmlPage([
        'title' => $author['name'] . ' | ' . ($author['tagline'] ?? 'Author'),
        'description' => $author['bio'],
        'url' => $baseUrl . '/',
        'image' => $author['profile_image'],
        'type' => 'website',
        'author' => $author['name'],
        'schema' => $schema,
        'body' => '<h1>' . escapeHtml($author['name']) . '</h1><p>' . escapeHtml($author['tagline'] ?? $author['bio']) . '</p>'
    ]);
    
    if (file_put_contents($outputDir . '/index.html', $html)) {
        $stats['homepage']++;
        $stats['total']++;
    }
}

function generateStorytimeListing($pdo, $author, $baseUrl, $outputDir, &$stats) {
    output("Generating storytime listing...");
    
    $stmt = $pdo->query("SELECT slug, title, description, cover_image FROM stories WHERE status = 'published' ORDER BY sort_order, created_at DESC");
    $stories = $stmt->fetchAll();
    
    $storyList = '';
    foreach ($stories as $story) {
        $storyList .= '<li><a href="' . $baseUrl . '/storytime/story/' . escapeHtml($story['slug']) . '">' . escapeHtml($story['title']) . '</a></li>';
    }
    
    $schema = json_encode([
        "@context" => "https://schema.org",
        "@type" => "CollectionPage",
        "name" => "Stories by " . $author['name'],
        "description" => "Read stories by " . $author['name'],
        "url" => $baseUrl . '/storytime'
    ], JSON_UNESCAPED_SLASHES);
    
    $html = generateHtmlPage([
        'title' => 'Stories | ' . $author['name'],
        'description' => 'Read stories by ' . $author['name'] . '. Science fiction, fantasy, and LitRPG adventures.',
        'url' => $baseUrl . '/storytime',
        'type' => 'website',
        'author' => $author['name'],
        'schema' => $schema,
        'body' => '<h1>Stories</h1><p>by ' . escapeHtml($author['name']) . '</p><ul>' . $storyList . '</ul>'
    ]);
    
    file_put_contents($outputDir . '/storytime.html', $html);
    $stats['total']++;
}

function generateStoryPages($pdo, $author, $baseUrl, $outputDir, &$stats) {
    output("Generating story pages...");
    
    $stmt = $pdo->query("SELECT id, slug, title, description, cover_image FROM stories WHERE status = 'published'");
    $stories = $stmt->fetchAll();
    
    foreach ($stories as $story) {
        output("  - Story: {$story['slug']}");
        
        // Get chapters for this story
        $chapterStmt = $pdo->prepare("SELECT slug, title, chapter_number FROM chapters WHERE story_id = ? AND status = 'published' ORDER BY chapter_number");
        $chapterStmt->execute([$story['id']]);
        $chapters = $chapterStmt->fetchAll();
        
        $chapterList = '';
        foreach ($chapters as $ch) {
            $chapterList .= '<li><a href="' . $baseUrl . '/storytime/story/' . escapeHtml($story['slug']) . '/' . escapeHtml($ch['slug']) . '">Chapter ' . $ch['chapter_number'] . ': ' . escapeHtml($ch['title']) . '</a></li>';
        }
        
        $schema = json_encode([
            "@context" => "https://schema.org",
            "@type" => "Book",
            "name" => $story['title'],
            "description" => $story['description'],
            "author" => [
                "@type" => "Person",
                "name" => $author['name']
            ],
            "url" => $baseUrl . '/storytime/story/' . $story['slug'],
            "image" => $story['cover_image'] ?? ''
        ], JSON_UNESCAPED_SLASHES);
        
        $html = generateHtmlPage([
            'title' => $story['title'] . ' | ' . $author['name'],
            'description' => $story['description'],
            'url' => $baseUrl . '/storytime/story/' . $story['slug'],
            'image' => $story['cover_image'],
            'type' => 'book',
            'author' => $author['name'],
            'schema' => $schema,
            'body' => '<h1>' . escapeHtml($story['title']) . '</h1><p>' . escapeHtml($story['description']) . '</p><h2>Chapters</h2><ol>' . $chapterList . '</ol>'
        ]);
        
        $filename = 'storytime-story-' . $story['slug'] . '.html';
        if (file_put_contents($outputDir . '/' . $filename, $html)) {
            $stats['stories']++;
            $stats['total']++;
        }
        
        // Generate chapter pages
        generateChapterPages($pdo, $author, $baseUrl, $outputDir, $story, $stats);
    }
}

function generateChapterPages($pdo, $author, $baseUrl, $outputDir, $story, &$stats) {
    $stmt = $pdo->prepare("SELECT slug, title, chapter_number, content FROM chapters WHERE story_id = ? AND status = 'published' ORDER BY chapter_number");
    $stmt->execute([$story['id']]);
    
    while ($chapter = $stmt->fetch()) {
        output("    - Chapter: {$chapter['slug']}");
        
        $excerpt = truncate(strip_tags($chapter['content'] ?? ''), 160);
        
        $schema = json_encode([
            "@context" => "https://schema.org",
            "@type" => "Chapter",
            "name" => $chapter['title'],
            "description" => $excerpt,
            "isPartOf" => [
                "@type" => "Book",
                "name" => $story['title']
            ],
            "author" => [
                "@type" => "Person",
                "name" => $author['name']
            ],
            "url" => $baseUrl . '/storytime/story/' . $story['slug'] . '/' . $chapter['slug'],
            "position" => $chapter['chapter_number']
        ], JSON_UNESCAPED_SLASHES);
        
        // Include first ~500 chars of content for bots
        $contentPreview = truncate(strip_tags($chapter['content'] ?? ''), 500);
        
        $html = generateHtmlPage([
            'title' => 'Chapter ' . $chapter['chapter_number'] . ': ' . $chapter['title'] . ' - ' . $story['title'] . ' | ' . $author['name'],
            'description' => $excerpt,
            'url' => $baseUrl . '/storytime/story/' . $story['slug'] . '/' . $chapter['slug'],
            'image' => $story['cover_image'],
            'type' => 'article',
            'author' => $author['name'],
            'schema' => $schema,
            'body' => '<h1>Chapter ' . $chapter['chapter_number'] . ': ' . escapeHtml($chapter['title']) . '</h1><p class="meta">From <em>' . escapeHtml($story['title']) . '</em></p><p>' . escapeHtml($contentPreview) . '</p>'
        ]);
        
        $filename = 'storytime-story-' . $story['slug'] . '-' . $chapter['slug'] . '.html';
        if (file_put_contents($outputDir . '/' . $filename, $html)) {
            $stats['chapters']++;
            $stats['total']++;
        }
    }
}

function generateGalleryPages($pdo, $author, $baseUrl, $outputDir, &$stats) {
    output("Generating gallery pages...");
    
    // Gallery listing
    $stmt = $pdo->query("SELECT slug, title, description FROM galleries WHERE status = 'published' OR status IS NULL");
    $galleries = $stmt->fetchAll();
    
    $galleryList = '';
    foreach ($galleries as $gallery) {
        $galleryList .= '<li><a href="' . $baseUrl . '/galleries/' . escapeHtml($gallery['slug']) . '">' . escapeHtml($gallery['title']) . '</a></li>';
    }
    
    $listingSchema = json_encode([
        "@context" => "https://schema.org",
        "@type" => "CollectionPage",
        "name" => "Image Galleries | " . $author['name'],
        "description" => "View image galleries and artwork by " . $author['name'],
        "url" => $baseUrl . '/galleries'
    ], JSON_UNESCAPED_SLASHES);
    
    $listingHtml = generateHtmlPage([
        'title' => 'Image Galleries | ' . $author['name'],
        'description' => 'View image galleries and artwork by ' . $author['name'],
        'url' => $baseUrl . '/galleries',
        'type' => 'website',
        'author' => $author['name'],
        'schema' => $listingSchema,
        'body' => '<h1>Image Galleries</h1><ul>' . $galleryList . '</ul>'
    ]);
    
    file_put_contents($outputDir . '/galleries.html', $listingHtml);
    $stats['total']++;
    
    // Individual gallery pages
    foreach ($galleries as $gallery) {
        output("  - Gallery: {$gallery['slug']}");
        
        // Get images for this gallery
        $imgStmt = $pdo->prepare("SELECT title, filename FROM images WHERE gallery_id = (SELECT id FROM galleries WHERE slug = ?) LIMIT 10");
        $imgStmt->execute([$gallery['slug']]);
        $images = $imgStmt->fetchAll();
        
        $firstImage = !empty($images) ? '/api/uploads/' . $images[0]['filename'] : null;
        
        $imageList = '';
        foreach ($images as $img) {
            $imageList .= '<li>' . escapeHtml($img['title'] ?? $img['filename']) . '</li>';
        }
        
        $schema = json_encode([
            "@context" => "https://schema.org",
            "@type" => "ImageGallery",
            "name" => $gallery['title'],
            "description" => $gallery['description'],
            "author" => [
                "@type" => "Person",
                "name" => $author['name']
            ],
            "url" => $baseUrl . '/galleries/' . $gallery['slug']
        ], JSON_UNESCAPED_SLASHES);
        
        $html = generateHtmlPage([
            'title' => $gallery['title'] . ' | Image Gallery | ' . $author['name'],
            'description' => $gallery['description'],
            'url' => $baseUrl . '/galleries/' . $gallery['slug'],
            'image' => $firstImage ? $baseUrl . $firstImage : null,
            'type' => 'website',
            'author' => $author['name'],
            'schema' => $schema,
            'body' => '<h1>' . escapeHtml($gallery['title']) . '</h1><p>' . escapeHtml($gallery['description']) . '</p><h2>Images</h2><ul>' . $imageList . '</ul>'
        ]);
        
        $filename = 'galleries-' . $gallery['slug'] . '.html';
        if (file_put_contents($outputDir . '/' . $filename, $html)) {
            $stats['galleries']++;
            $stats['total']++;
        }
    }
}

function generateBlogPages($pdo, $author, $baseUrl, $outputDir, &$stats) {
    output("Generating blog pages...");
    
    // Check if blog table exists
    try {
        $stmt = $pdo->query("SELECT id, slug, title, excerpt, content, featured_image FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC");
        $posts = $stmt->fetchAll();
    } catch (PDOException $e) {
        output("  - Blog table not found, skipping...");
        return;
    }
    
    if (empty($posts)) {
        output("  - No published blog posts found");
        return;
    }
    
    // Blog listing
    $postList = '';
    foreach ($posts as $post) {
        $postList .= '<li><a href="' . $baseUrl . '/blog/' . escapeHtml($post['slug']) . '">' . escapeHtml($post['title']) . '</a></li>';
    }
    
    $listingSchema = json_encode([
        "@context" => "https://schema.org",
        "@type" => "Blog",
        "name" => "Blog | " . $author['name'],
        "description" => "Blog posts by " . $author['name'],
        "url" => $baseUrl . '/blog'
    ], JSON_UNESCAPED_SLASHES);
    
    $listingHtml = generateHtmlPage([
        'title' => 'Blog | ' . $author['name'],
        'description' => 'Blog posts and updates from ' . $author['name'],
        'url' => $baseUrl . '/blog',
        'type' => 'website',
        'author' => $author['name'],
        'schema' => $listingSchema,
        'body' => '<h1>Blog</h1><ul>' . $postList . '</ul>'
    ]);
    
    file_put_contents($outputDir . '/blog.html', $listingHtml);
    $stats['total']++;
    
    // Individual blog posts
    foreach ($posts as $post) {
        output("  - Blog: {$post['slug']}");
        
        $excerpt = truncate($post['excerpt'] ?? strip_tags($post['content'] ?? ''), 160);
        
        $schema = json_encode([
            "@context" => "https://schema.org",
            "@type" => "BlogPosting",
            "headline" => $post['title'],
            "description" => $excerpt,
            "author" => [
                "@type" => "Person",
                "name" => $author['name']
            ],
            "url" => $baseUrl . '/blog/' . $post['slug'],
            "image" => $post['featured_image'] ?? ''
        ], JSON_UNESCAPED_SLASHES);
        
        $contentPreview = truncate(strip_tags($post['content'] ?? ''), 500);
        
        $html = generateHtmlPage([
            'title' => $post['title'] . ' | ' . $author['name'],
            'description' => $excerpt,
            'url' => $baseUrl . '/blog/' . $post['slug'],
            'image' => $post['featured_image'],
            'type' => 'article',
            'author' => $author['name'],
            'schema' => $schema,
            'body' => '<h1>' . escapeHtml($post['title']) . '</h1><p>' . escapeHtml($contentPreview) . '</p>'
        ]);
        
        $filename = 'blog-' . $post['slug'] . '.html';
        if (file_put_contents($outputDir . '/' . $filename, $html)) {
            $stats['blog']++;
            $stats['total']++;
        }
    }
}

// ============ Main Execution ============

// Create output directory
if (!is_dir($outputDir)) {
    if (!mkdir($outputDir, 0755, true)) {
        $error = "Failed to create output directory: $outputDir";
        if (php_sapi_name() === 'cli') {
            die($error . "\n");
        } else {
            jsonResponse(['success' => false, 'error' => $error], 500);
        }
    }
}

output("===========================================");
output("Pre-render Generation Started");
output("Output directory: $outputDir");
output("Base URL: $baseUrl");
output("===========================================");

// Generate all pages
try {
    generateHomepage($author, $baseUrl, $outputDir, $stats);
    generateStorytimeListing($pdo, $author, $baseUrl, $outputDir, $stats);
    generateStoryPages($pdo, $author, $baseUrl, $outputDir, $stats);
    generateGalleryPages($pdo, $author, $baseUrl, $outputDir, $stats);
    generateBlogPages($pdo, $author, $baseUrl, $outputDir, $stats);
} catch (Exception $e) {
    $stats['errors'][] = $e->getMessage();
    output("ERROR: " . $e->getMessage());
}

output("===========================================");
output("Pre-render Generation Complete!");
output("Total pages: {$stats['total']}");
output("  - Homepage: {$stats['homepage']}");
output("  - Stories: {$stats['stories']}");
output("  - Chapters: {$stats['chapters']}");
output("  - Galleries: {$stats['galleries']}");
output("  - Blog: {$stats['blog']}");
if (!empty($stats['errors'])) {
    output("Errors: " . count($stats['errors']));
}
output("===========================================");

// Return JSON if called via HTTP
if (php_sapi_name() !== 'cli') {
    jsonResponse([
        'success' => empty($stats['errors']),
        'stats' => $stats,
        'message' => "Generated {$stats['total']} pre-rendered pages"
    ]);
}
