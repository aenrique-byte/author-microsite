# Author CMS - Astro Version

This is the Astro-based frontend for Author CMS, providing static site generation for perfect SEO while maintaining your existing PHP/MySQL backend.

## Quick Start

```bash
# Navigate to the astro directory
cd astro

# Install dependencies
npm install

# Start development server
npm run dev
```

The dev server will start at `http://localhost:4321`

## Build for Production

```bash
# Build static site
npm run build

# Preview production build
npm run preview
```

The built files will be in the `dist/` directory.

## Configuration

### Environment Variables

Create a `.env` file in the `astro/` directory:

```env
API_URL=https://aenrique.com
```

For local development with your PHP server running:
```env
API_URL=http://localhost:8000
```

### Site Configuration

Edit `astro.config.mjs` to update your site URL:

```javascript
export default defineConfig({
  site: 'https://yourdomain.com',
  // ...
});
```

## Project Structure

```
astro/
├── src/
│   ├── layouts/           # Reusable page layouts
│   │   ├── BaseLayout.astro      # Shared HTML head, meta tags
│   │   └── StoryLayout.astro     # Reading-focused layout
│   │
│   └── pages/             # Routes (file-based routing)
│       ├── index.astro           # Homepage (/)
│       └── storytime/
│           ├── index.astro       # Stories list (/storytime)
│           └── story/
│               ├── [slug].astro              # Story page (/storytime/story/my-story)
│               └── [storySlug]/
│                   └── [chapterSlug].astro   # Chapter (/storytime/story/my-story/chapter-1)
│
├── astro.config.mjs       # Astro configuration
├── tailwind.config.mjs    # Tailwind CSS configuration
└── package.json           # Dependencies
```

## How It Works

### Data Flow

1. **Build Time**: Astro fetches data from your PHP/MySQL API
2. **Static Generation**: HTML pages are pre-rendered with all content
3. **Deploy**: Upload `dist/` folder to any static host (Vercel, Netlify, etc.)

### API Integration

All pages fetch data from your existing PHP endpoints:

- `/api/homepage/get.php` - Homepage data
- `/api/stories/list.php` - Stories list
- `/api/chapters/list.php` - Chapters for a story
- `/api/author/get.php` - Author profile

### Dynamic Routes

Astro generates pages for each:
- **Story**: `/storytime/story/[slug]`
- **Chapter**: `/storytime/story/[storySlug]/[chapterSlug]`

At build time, `getStaticPaths()` fetches all published stories/chapters and creates a page for each.

## Deployment Options

### Option 1: Vercel (Recommended)

1. Push this `astro/` folder to GitHub
2. Import to Vercel
3. Set environment variable: `API_URL=https://yourdomain.com`
4. Deploy!

### Option 2: Netlify

Same process as Vercel.

### Option 3: Same Server

1. Build: `npm run build`
2. Upload `dist/` contents to your server
3. Configure nginx/Apache to serve the static files

## Auto-Rebuild on Content Updates

To automatically rebuild when you publish new content:

### Vercel/Netlify Deploy Hook

1. Create a deploy hook in Vercel/Netlify dashboard
2. Add the webhook URL to your PHP config
3. Call the webhook from your publish endpoints

Example PHP code to trigger rebuild:
```php
function triggerAstroBuild() {
    $webhookUrl = getenv('ASTRO_DEPLOY_WEBHOOK');
    if (!$webhookUrl) return;
    
    $ch = curl_init($webhookUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_exec($ch);
    curl_close($ch);
}
```

## Adding New Pages

### Static Page

Create `src/pages/about.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="About">
  <h1>About Me</h1>
</BaseLayout>
```

### Dynamic Page

Create `src/pages/galleries/[slug].astro`:
```astro
---
export async function getStaticPaths() {
  const res = await fetch(`${API_URL}/api/galleries/list.php`);
  const { data } = await res.json();
  return data.map(g => ({ params: { slug: g.slug }, props: { gallery: g }}));
}
const { gallery } = Astro.props;
---
```

## Differences from React SPA

| Feature | React SPA | Astro |
|---------|-----------|-------|
| Initial Load | JS downloads, renders | HTML already rendered |
| SEO | Requires prerender | Perfect out of the box |
| Page Speed | ~2-3s | <1s |
| JavaScript | Full React bundle | Minimal (only for interactions) |
| Data Updates | Real-time | Rebuild required |

## Next Steps

1. ✅ Homepage created
2. ✅ Stories & chapters pages
3. Add galleries pages
4. Add blog pages
5. Deploy to Vercel
6. Set up auto-rebuild webhook
