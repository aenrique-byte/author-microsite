# Astro & Prerendering Guide for Author CMS

## The Problem: Client-Side Rendering and SEO

### Current Architecture
Your site uses **Vite + React** which produces a **Single Page Application (SPA)**. Here's what happens when Google visits:

```
1. Googlebot requests: https://yoursite.com/storytime/story/destiny-among-stars
2. Server returns: index.html with empty <div id="root"></div>
3. Browser would normally: Download JS → Execute React → Render content
4. Googlebot: Sometimes waits, sometimes doesn't, indexing is inconsistent
```

### Why This Hurts SEO

| Crawler | JavaScript Execution | Your Content Visibility |
|---------|---------------------|------------------------|
| Googlebot | Yes, but delayed "second wave" | Partial, inconsistent |
| Bingbot | Limited | Poor |
| Facebook/Twitter | No | None (share previews broken) |
| LinkedIn | No | None |
| Other crawlers | Rarely | None |

Your `react-helmet-async` sets meta tags **after** React hydrates, but many bots don't wait for that.

---

## Understanding Pre-rendering vs SSR vs SSG

### Terminology

| Term | Full Name | When HTML is Generated | Best For |
|------|-----------|----------------------|----------|
| **CSR** | Client-Side Rendering | In browser (current setup) | Complex apps, admin panels |
| **SSR** | Server-Side Rendering | On each request | Highly dynamic content |
| **SSG** | Static Site Generation | At build time | Content sites, blogs |
| **ISR** | Incremental Static Regeneration | Build time + periodic refresh | Mix of static + fresh |

### What You Need

Your content (stories, chapters, galleries) is **mostly static** — it changes when you publish, not per-visitor. This is perfect for **SSG** with periodic rebuilds.

---

## Option 1: PHP Bot Detection (Quick Fix)

Since you already have PHP, you can serve different content to bots vs browsers.

### How It Works

```
User Request → PHP checks User-Agent
                    ↓
            Is it a bot?
           /           \
         Yes            No
          ↓              ↓
    Serve static     Serve React SPA
    HTML snapshot    (normal behavior)
```

### Implementation

**File: `public/index.php`** (new entry point)

```php
<?php
/**
 * Bot-aware entry point
 * Serves pre-rendered HTML to search bots, React SPA to browsers
 */

$user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
$request_uri = $_SERVER['REQUEST_URI'] ?? '/';

// Known bot patterns
$bot_patterns = [
    'Googlebot',
    'Bingbot', 
    'Slurp',           // Yahoo
    'DuckDuckBot',
    'Baiduspider',
    'YandexBot',
    'facebookexternalhit',
    'Facebot',
    'Twitterbot',
    'LinkedInBot',
    'WhatsApp',
    'TelegramBot',
    'Pinterest',
    'Discordbot'
];

$is_bot = false;
foreach ($bot_patterns as $pattern) {
    if (stripos($user_agent, $pattern) !== false) {
        $is_bot = true;
        break;
    }
}

if ($is_bot) {
    // Parse the URL to determine which pre-rendered file to serve
    $prerender_file = get_prerender_path($request_uri);
    
    if (file_exists($prerender_file)) {
        header('Content-Type: text/html; charset=utf-8');
        readfile($prerender_file);
        exit;
    }
    // Fall through to React SPA if no pre-rendered file exists
}

// Serve the React SPA
include(__DIR__ . '/index.html');

function get_prerender_path($uri) {
    // Remove query string
    $path = parse_url($uri, PHP_URL_PATH);
    $path = trim($path, '/');
    
    // Map URL to pre-rendered file
    if (empty($path)) {
        return __DIR__ . '/prerender/index.html';
    }
    
    // Convert path to filename
    $filename = str_replace('/', '-', $path);
    return __DIR__ . '/prerender/' . $filename . '.html';
}
```

### Pre-render Generation Script

**File: `api/generate-prerenders.php`**

```php
<?php
/**
 * Generate static HTML snapshots for SEO
 * Run after publishing new content: php api/generate-prerenders.php
 */

require_once __DIR__ . '/bootstrap.php';

$base_url = 'https://yoursite.com';
$output_dir = __DIR__ . '/../dist/prerender';

// Create output directory
if (!is_dir($output_dir)) {
    mkdir($output_dir, 0755, true);
}

// Generate homepage
echo "Generating homepage...\n";
generate_page('/', 'index.html', $base_url, $output_dir);

// Generate story pages
$stories = $pdo->query("
    SELECT s.slug, s.title, s.description, s.cover_image 
    FROM stories s 
    WHERE s.status = 'published'
")->fetchAll(PDO::FETCH_ASSOC);

foreach ($stories as $story) {
    echo "Generating: /storytime/story/{$story['slug']}\n";
    generate_story_page($story, $base_url, $output_dir);
    
    // Generate chapter pages
    $chapters = $pdo->prepare("
        SELECT c.slug, c.title, c.chapter_number, c.content
        FROM chapters c 
        WHERE c.story_id = (SELECT id FROM stories WHERE slug = ?) 
        AND c.status = 'published'
        ORDER BY c.chapter_number
    ");
    $chapters->execute([$story['slug']]);
    
    while ($chapter = $chapters->fetch(PDO::FETCH_ASSOC)) {
        echo "  - Chapter: {$chapter['slug']}\n";
        generate_chapter_page($story, $chapter, $base_url, $output_dir);
    }
}

// Generate gallery pages
$galleries = $pdo->query("
    SELECT slug, title, description 
    FROM galleries 
    WHERE status = 'published' OR status IS NULL
")->fetchAll(PDO::FETCH_ASSOC);

foreach ($galleries as $gallery) {
    echo "Generating: /galleries/{$gallery['slug']}\n";
    generate_gallery_page($gallery, $base_url, $output_dir);
}

echo "\nPre-render generation complete!\n";

// ============ Helper Functions ============

function generate_story_page($story, $base_url, $output_dir) {
    $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$story['title']} | Author Name</title>
    <meta name="description" content="{$story['description']}">
    <link rel="canonical" href="{$base_url}/storytime/story/{$story['slug']}">
    
    <!-- Open Graph -->
    <meta property="og:type" content="book">
    <meta property="og:title" content="{$story['title']}">
    <meta property="og:description" content="{$story['description']}">
    <meta property="og:image" content="{$story['cover_image']}">
    <meta property="og:url" content="{$base_url}/storytime/story/{$story['slug']}">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{$story['title']}">
    <meta name="twitter:description" content="{$story['description']}">
    <meta name="twitter:image" content="{$story['cover_image']}">
    
    <!-- Redirect to React app for full experience -->
    <script>
        // Only redirect if JavaScript is enabled (real users, not bots)
        window.location.replace(window.location.href);
    </script>
</head>
<body>
    <main>
        <h1>{$story['title']}</h1>
        <p>{$story['description']}</p>
        <noscript>
            <p>Please enable JavaScript to read this story.</p>
        </noscript>
    </main>
</body>
</html>
HTML;

    $filename = 'storytime-story-' . $story['slug'] . '.html';
    file_put_contents($output_dir . '/' . $filename, $html);
}

function generate_chapter_page($story, $chapter, $base_url, $output_dir) {
    // Strip HTML/markdown for description
    $excerpt = substr(strip_tags($chapter['content']), 0, 160) . '...';
    
    $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chapter {$chapter['chapter_number']}: {$chapter['title']} - {$story['title']}</title>
    <meta name="description" content="{$excerpt}">
    <link rel="canonical" href="{$base_url}/storytime/story/{$story['slug']}/{$chapter['slug']}">
    
    <!-- Open Graph -->
    <meta property="og:type" content="article">
    <meta property="og:title" content="Chapter {$chapter['chapter_number']}: {$chapter['title']}">
    <meta property="og:description" content="{$excerpt}">
    <meta property="og:image" content="{$story['cover_image']}">
    <meta property="og:url" content="{$base_url}/storytime/story/{$story['slug']}/{$chapter['slug']}">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="Chapter {$chapter['chapter_number']}: {$chapter['title']}">
    <meta name="twitter:description" content="{$excerpt}">
</head>
<body>
    <main>
        <h1>Chapter {$chapter['chapter_number']}: {$chapter['title']}</h1>
        <p>From: {$story['title']}</p>
        <noscript>
            <p>Please enable JavaScript to read this chapter.</p>
        </noscript>
    </main>
</body>
</html>
HTML;

    $filename = 'storytime-story-' . $story['slug'] . '-' . $chapter['slug'] . '.html';
    file_put_contents($output_dir . '/' . $filename, $html);
}

function generate_gallery_page($gallery, $base_url, $output_dir) {
    $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$gallery['title']} | Image Gallery</title>
    <meta name="description" content="{$gallery['description']}">
    <link rel="canonical" href="{$base_url}/galleries/{$gallery['slug']}">
    
    <meta property="og:type" content="website">
    <meta property="og:title" content="{$gallery['title']} | Image Gallery">
    <meta property="og:description" content="{$gallery['description']}">
    <meta property="og:url" content="{$base_url}/galleries/{$gallery['slug']}">
    
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{$gallery['title']}">
    <meta name="twitter:description" content="{$gallery['description']}">
</head>
<body>
    <main>
        <h1>{$gallery['title']}</h1>
        <p>{$gallery['description']}</p>
    </main>
</body>
</html>
HTML;

    $filename = 'galleries-' . $gallery['slug'] . '.html';
    file_put_contents($output_dir . '/' . $filename, $html);
}

function generate_page($path, $filename, $base_url, $output_dir) {
    // Generic page generator for homepage, etc.
    $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Author Name - Science Fiction Author</title>
    <meta name="description" content="Science fiction and fantasy stories by Author Name. Read free web serials, view artwork galleries, and more.">
    <link rel="canonical" href="{$base_url}/">
</head>
<body>
    <main>
        <h1>Author Name</h1>
        <p>Science fiction and fantasy author</p>
    </main>
</body>
</html>
HTML;

    file_put_contents($output_dir . '/' . $filename, $html);
}
```

### Pros & Cons

| Pros | Cons |
|------|------|
| ✅ No framework migration | ❌ Manual pre-render generation |
| ✅ Uses existing PHP | ❌ Content out of sync if you forget to regenerate |
| ✅ Works today | ❌ Doesn't scale well with thousands of pages |
| ✅ Zero hosting changes | |

---

## Option 2: Prerender.io Service

A SaaS solution that caches fully-rendered pages and serves them to bots.

### How It Works

```
Bot Request → Your Server → Prerender.io Service
                                    ↓
                           Renders your React app
                                    ↓
                           Caches the HTML
                                    ↓
                           Returns to bot
```

### Setup

1. Sign up at [prerender.io](https://prerender.io)
2. Add middleware to your server

**For Apache (.htaccess):**

```apache
# Prerender.io integration
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Don't prerender if it's a file request
    RewriteCond %{REQUEST_URI} !\.(js|css|xml|less|png|jpg|jpeg|gif|pdf|doc|txt|ico|rss|zip|mp3|rar|exe|wmv|doc|avi|ppt|mpg|mpeg|tif|wav|mov|psd|ai|xls|mp4|m4a|swf|dat|dmg|iso|flv|m4v|torrent|ttf|woff|svg|eot)$ [NC]
    
    # Only prerender for bots
    RewriteCond %{HTTP_USER_AGENT} googlebot|bingbot|yandex|baiduspider|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora\ link\ preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator|whatsapp [NC,OR]
    RewriteCond %{QUERY_STRING} _escaped_fragment_
    
    # Proxy to prerender service
    RewriteRule ^(.*)$ https://service.prerender.io/https://yoursite.com/$1 [P,L]
</IfModule>
```

### Pricing (as of 2024)

| Plan | Pages/Month | Cost |
|------|-------------|------|
| Starter | 250 | Free |
| Basic | 10,000 | $15/mo |
| Plus | 50,000 | $49/mo |
| Pro | 200,000 | $149/mo |

### Pros & Cons

| Pros | Cons |
|------|------|
| ✅ Works in 30 minutes | ❌ Monthly cost |
| ✅ No code changes | ❌ External dependency |
| ✅ Auto-updates when content changes | ❌ Slight latency on first crawl |
| ✅ Handles all edge cases | |

---

## Option 3: Migrate to Astro (Recommended Long-Term)

### What is Astro?

Astro is a modern static site generator that:
- Pre-renders HTML at build time
- Ships **zero JavaScript** by default
- Lets you use React components where needed
- Has first-class TypeScript support

### Why Astro Fits Author CMS

| Your Content | Rendering Need | Astro Solution |
|--------------|---------------|----------------|
| Stories list | Static, rarely changes | SSG at build time |
| Story pages | Static with dynamic fetch | SSG with PHP API call |
| Chapters | Static content | SSG, full text in HTML |
| Galleries | Static grid | SSG with lazy-loaded images |
| Admin panel | Highly interactive | Keep as React SPA |

### Architecture After Migration

```
yoursite.com/
├── / (Astro SSG)
├── /storytime/* (Astro SSG)
├── /galleries/* (Astro SSG)
├── /litrpg/* (Astro SSG or React island)
└── /admin/* (Keep current React SPA)
```

### Sample Astro Files

**`astro.config.mjs`**

```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [
    react(),     // Use React components
    tailwind(), // Keep your Tailwind styles
  ],
  output: 'static', // Full SSG
  site: 'https://yoursite.com',
});
```

**`src/pages/storytime/story/[slug].astro`**

```astro
---
// This runs at BUILD TIME, not in browser
import Layout from '../../../layouts/Base.astro';
import ChapterList from '../../../components/ChapterList.jsx';

// Fetch from your existing PHP API
const API_BASE = import.meta.env.API_URL || 'http://localhost:8000';

// Get all story slugs for static generation
export async function getStaticPaths() {
  const response = await fetch(`${API_BASE}/api/stories/list.php`);
  const { data: stories } = await response.json();
  
  return stories
    .filter(s => s.status === 'published')
    .map(story => ({
      params: { slug: story.slug },
      props: { story }
    }));
}

const { story } = Astro.props;

// Fetch chapters for this story
const chaptersRes = await fetch(`${API_BASE}/api/chapters/list.php?story_id=${story.id}`);
const { data: chapters } = await chaptersRes.json();
---

<Layout 
  title={`${story.title} | Author Name`}
  description={story.description}
  image={story.cover_image}
>
  <article class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-4xl font-bold mb-4">{story.title}</h1>
    
    {story.cover_image && (
      <img 
        src={story.cover_image} 
        alt={story.title}
        class="w-full max-w-md mx-auto rounded-lg shadow-lg mb-6"
      />
    )}
    
    <div class="prose prose-lg max-w-none mb-8">
      <p>{story.description}</p>
    </div>
    
    <h2 class="text-2xl font-semibold mb-4">Chapters</h2>
    
    <!-- React component for interactive chapter list -->
    <ChapterList 
      chapters={chapters} 
      storySlug={story.slug}
      client:load
    />
  </article>
</Layout>
```

**`src/layouts/Base.astro`**

```astro
---
interface Props {
  title: string;
  description?: string;
  image?: string;
}

const { title, description, image } = Astro.props;
const canonicalURL = new URL(Astro.url.pathname, Astro.site);
---

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  
  {description && <meta name="description" content={description} />}
  <link rel="canonical" href={canonicalURL} />
  
  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content={title} />
  {description && <meta property="og:description" content={description} />}
  {image && <meta property="og:image" content={image} />}
  <meta property="og:url" content={canonicalURL} />
  
  <!-- Twitter -->
  <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
  <meta name="twitter:title" content={title} />
  {description && <meta name="twitter:description" content={description} />}
  {image && <meta name="twitter:image" content={image} />}

  <!-- Your existing styles -->
  <link rel="stylesheet" href="/styles/global.css" />
</head>
<body class="bg-gray-900 text-white min-h-screen">
  <slot />
</body>
</html>
```

### Migration Steps

```
Phase 1: Setup (1-2 hours)
├── Create new Astro project
├── Install integrations (React, Tailwind)
├── Copy shared components
└── Set up API connection

Phase 2: Core Pages (4-6 hours)
├── Homepage
├── Story listing (/storytime)
├── Story detail pages
├── Chapter pages
└── Gallery pages

Phase 3: Polish (2-4 hours)
├── Navigation component
├── Footer component
├── 404 page
└── Sitemap generation

Phase 4: Deploy (1-2 hours)
├── Configure build process
├── Set up hosting (Vercel/Netlify/your server)
├── Point domain
└── Keep /admin on original server
```

### Build Process

```bash
# Install Astro
npm create astro@latest author-cms-static

# Install dependencies
cd author-cms-static
npm install @astrojs/react @astrojs/tailwind

# Development
npm run dev

# Build static site
npm run build

# Output is in dist/ - pure HTML, CSS, minimal JS
```

### Deployment Options

**Option A: Same Server**
```bash
# Build Astro
npm run build

# Copy to server alongside existing setup
scp -r dist/* yourserver:/var/www/html/

# Keep /admin pointing to React build
# Configure nginx/Apache to serve Astro for public, React for /admin
```

**Option B: Vercel/Netlify (Free)**
- Push Astro project to GitHub
- Connect to Vercel/Netlify
- Auto-deploys on push
- Point main domain to Vercel
- Keep /admin on original server (subdomain or path proxy)

### Pros & Cons

| Pros | Cons |
|------|------|
| ✅ Perfect SEO (pure HTML) | ❌ Requires migration effort |
| ✅ Blazing fast (no JS by default) | ❌ Need to rebuild when content changes |
| ✅ Use existing React components | ❌ Learning curve for Astro syntax |
| ✅ Free hosting options | ❌ Two builds to maintain |
| ✅ Future-proof | |

---

## Option 4: Build-Time Data Fetching (Hybrid Approach)

Instead of full migration, add build-time data to your current React setup.

### How It Works

1. At build time, fetch all content from MySQL
2. Generate a JSON file with all stories/chapters
3. React app loads this static JSON instead of API calls
4. Bots can still read the JSON even if React doesn't fully render

### Implementation

**`scripts/generate-static-data.mjs`**

```javascript
/**
 * Run before build: node scripts/generate-static-data.mjs
 * Fetches all published content and saves as static JSON
 */

import fs from 'fs';
import path from 'path';

const API_BASE = process.env.API_URL || 'http://localhost:8000';

async function generateStaticData() {
  console.log('Fetching stories...');
  const storiesRes = await fetch(`${API_BASE}/api/stories/list.php`);
  const { data: stories } = await storiesRes.json();
  
  const publishedStories = stories.filter(s => s.status === 'published');
  
  // Fetch chapters for each story
  for (const story of publishedStories) {
    console.log(`  Fetching chapters for: ${story.title}`);
    const chaptersRes = await fetch(`${API_BASE}/api/chapters/list.php?story_id=${story.id}`);
    const { data: chapters } = await chaptersRes.json();
    story.chapters = chapters.filter(c => c.status === 'published');
  }
  
  console.log('Fetching galleries...');
  const galleriesRes = await fetch(`${API_BASE}/api/galleries/list.php`);
  const { data: galleries } = await galleriesRes.json();
  
  // Write static data
  const outputDir = path.join(process.cwd(), 'public', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(outputDir, 'content.json'),
    JSON.stringify({ stories: publishedStories, galleries }, null, 2)
  );
  
  console.log('Static data generated!');
}

generateStaticData().catch(console.error);
```

**Update `package.json`:**

```json
{
  "scripts": {
    "prebuild": "node scripts/generate-static-data.mjs",
    "build": "tsc -b && vite build",
    "postbuild": "node scripts/postbuild-copy.mjs"
  }
}
```

---

## Recommendation Summary

### If you need results TODAY:
→ **Use Prerender.io** ($15/mo, 30 minutes setup)

### If you want a free, quick solution:
→ **PHP Bot Detection** (2-4 hours, some maintenance)

### If you're planning for the future:
→ **Migrate to Astro** over 1-2 weeks
- Best SEO possible
- Fastest performance
- Free hosting options
- Keep admin as React SPA

### Suggested Timeline

```
Week 1: Immediate Fix
├── Set up Prerender.io OR PHP bot detection
└── Verify Google Search Console indexing improves

Week 2-3: Astro Migration
├── Set up Astro project
├── Migrate public pages
└── Test and deploy

Week 4: Cleanup
├── Remove temporary solution (Prerender.io)
├── Set up automatic rebuilds (webhook on publish)
└── Monitor Search Console for improvements
```

---

## Automated Rebuilds (Astro)

When you publish new content, trigger an Astro rebuild:

**`api/stories/create.php`** (add at end):

```php
// After successful story creation
trigger_site_rebuild();

function trigger_site_rebuild() {
    // Option A: Vercel Deploy Hook
    $webhook_url = getenv('VERCEL_DEPLOY_HOOK');
    if ($webhook_url) {
        $ch = curl_init($webhook_url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_exec($ch);
        curl_close($ch);
    }
    
    // Option B: Local rebuild script
    // exec('cd /path/to/astro && npm run build 2>&1 &');
}
```

---

## Resources

- [Astro Documentation](https://docs.astro.build)
- [Astro + React Guide](https://docs.astro.build/en/guides/integrations-guide/react/)
- [Prerender.io Documentation](https://prerender.io/documentation)
- [Google Search Console](https://search.google.com/search-console)
- [Rich Results Test](https://search.google.com/test/rich-results) - Test your structured data
- [PageSpeed Insights](https://pagespeed.web.dev/) - Test performance

---

## Questions?

If you decide to proceed with Astro migration, I can help with:
1. Setting up the Astro project structure
2. Creating the API data fetching logic
3. Migrating your React components
4. Configuring the build process
5. Setting up automatic deploys
