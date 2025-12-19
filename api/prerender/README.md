# Pre-render System for SEO

This system generates static HTML pages for search engine bots and social media crawlers, improving SEO while keeping your React SPA for regular users.

## How It Works

1. **Bot Detection** (`public/bot-entry.php`): When a request comes in, this script checks the User-Agent to determine if it's a bot
2. **Pre-rendered HTML** (`public/prerender/`): If it's a bot, serve the pre-rendered HTML with proper meta tags
3. **React SPA**: If it's a regular user, serve the normal React application

## Files

| File | Purpose |
|------|---------|
| `public/bot-entry.php` | Entry point that detects bots and routes accordingly |
| `api/prerender/generate.php` | Script that generates static HTML from MySQL |
| `api/admin/regenerate-prerender.php` | Admin endpoint to trigger regeneration |
| `public/prerender/` | Output directory for generated HTML files |

## Usage

### Generate Pre-rendered Pages

**From CLI (on server):**
```bash
cd /path/to/your/site
php api/prerender/generate.php
```

**From Admin Panel (requires authentication):**
```bash
curl -X POST https://yoursite.com/api/admin/regenerate-prerender.php \
  -H "Cookie: authorcms=YOUR_SESSION_COOKIE"
```

**From your React admin panel:**
```typescript
const regeneratePrerender = async () => {
  const response = await fetch('/api/admin/regenerate-prerender.php', {
    method: 'POST',
    credentials: 'include'
  });
  const data = await response.json();
  console.log(data); // { success: true, stats: { total: 50, ... }, message: "..." }
};
```

## When to Regenerate

Run the prerender generation:
- After publishing a new story
- After publishing new chapters
- After creating/updating galleries
- After publishing blog posts
- After updating your author profile

**Tip:** You can hook the regeneration into your publish workflows by calling the endpoint after content changes.

## Output File Naming

URLs are converted to filenames by replacing `/` with `-`:

| URL | Generated File |
|-----|---------------|
| `/` | `index.html` |
| `/storytime` | `storytime.html` |
| `/storytime/story/my-story` | `storytime-story-my-story.html` |
| `/storytime/story/my-story/chapter-1` | `storytime-story-my-story-chapter-1.html` |
| `/galleries` | `galleries.html` |
| `/galleries/my-gallery` | `galleries-my-gallery.html` |
| `/blog` | `blog.html` |
| `/blog/my-post` | `blog-my-post.html` |

## What Gets Included

Each pre-rendered page includes:
- Proper `<title>` tag
- `<meta name="description">` 
- Open Graph tags (`og:title`, `og:description`, `og:image`, etc.)
- Twitter Card tags
- Schema.org JSON-LD structured data
- Canonical URL
- Basic HTML content (titles, descriptions, lists of items)

## Testing

**Test bot detection locally:**
```bash
# Simulate Googlebot
curl -A "Googlebot" http://localhost:3000/storytime/story/your-story

# Simulate Twitter bot (for share previews)
curl -A "Twitterbot" http://localhost:3000/storytime/story/your-story
```

**Check if pre-render is being served:**
Look for the `X-Prerender: true` response header when making requests as a bot.

## Bot Logging

Bot visits are logged to `api/logs/bot-visits.log` with:
- Timestamp
- IP address
- User-Agent (truncated)
- Requested URL

This helps you understand which bots are crawling your site.

## Troubleshooting

**Pre-rendered pages not being served:**
1. Ensure `.htaccess` routes to `bot-entry.php`
2. Check that pre-rendered files exist in `public/prerender/`
3. Verify your User-Agent is in the bot patterns list

**Generation fails:**
1. Check database connection in `api/config.php`
2. Ensure `public/prerender/` directory is writable
3. Check PHP error logs for details

**Social media previews not working:**
1. Regenerate pre-rendered pages
2. Use the platform's debug tools:
   - [Facebook Debugger](https://developers.facebook.com/tools/debug/)
   - [Twitter Card Validator](https://cards-dev.twitter.com/validator)
   - [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
