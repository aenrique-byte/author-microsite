# Astro Migration Plan for Author CMS

> ## ⚠️ PROJECT STATUS: UNFINISHED / ON HOLD
> 
> **Date:** December 19, 2025  
> **Decision:** Keep current React/PHP setup instead
> 
> ### Reasons for Pause:
> 1. **Too much hassle** - Requires webhook setup, manual rebuilds, and complex hosting
> 2. **Too many credits to implement** - Full migration requires significant dev time
> 3. **Missing features** - Comments don't work (need React), backgrounds require additional config
> 4. **Admin integration** - No easy way to trigger rebuilds from website admin
> 
> ### What Was Completed:
> - ✅ Basic Astro project setup (`astro/` folder)
> - ✅ Homepage, storytime pages, galleries pages, blog pages created
> - ✅ Deployed to Vercel as proof-of-concept
> 
> ### What Would Still Be Needed:
> - ❌ Comments (React client components)
> - ❌ Dynamic backgrounds (need proper asset hosting)
> - ❌ Admin rebuild button with deploy webhook
> - ❌ Social icons integration fixes
> - ❌ Full testing and QA
> 
> ### Current Solution:
> Keep using the React SPA + PHP API at `ocwanderer.com`. The PHP prerender system provides basic SEO for search bots.
> 
> ---

## Overview (Historical Reference)

This document outlines the plan to migrate the public-facing pages of Author CMS from React SPA to Astro for improved SEO and performance, while keeping the admin panel as a React SPA.

## Why Migrate to Astro?

### Current State (PHP Prerender)
- ✅ Bots receive pre-rendered HTML
- ✅ Works with existing infrastructure
- ⚠️ Requires manual regeneration after content updates
- ⚠️ Users still load full React bundle for all pages
- ⚠️ Bots see simplified HTML (not the full styled page)

### After Astro Migration
- ✅ Perfect SEO (full styled HTML at build time)
- ✅ Blazing fast page loads (minimal JavaScript)
- ✅ Auto-rebuilds on content publish (with Vercel/Netlify webhooks)
- ✅ Free hosting available (Vercel, Netlify, Cloudflare Pages)
- ✅ Bots and users see the same beautiful page
- ✅ Better Core Web Vitals scores

---

## Architecture: Before vs After

### Current Architecture
```
yoursite.com/
├── /* (All routes)     → React SPA (client-rendered)
└── /api/*              → PHP Backend
```

### Target Architecture
```
yoursite.com/
├── / (homepage)        → Astro (pre-built HTML)
├── /storytime/*        → Astro (pre-built HTML)
├── /galleries/*        → Astro (pre-built HTML)
├── /blog/*             → Astro (pre-built HTML)
├── /admin/*            → React SPA (stays as-is)
└── /api/*              → PHP Backend (unchanged)
```

---

## Migration Phases

### Phase 1: Project Setup (2-3 hours)

1. **Create Astro project alongside existing code**
   ```bash
   cd c:\Users\Andres\Desktop
   npm create astro@latest author-cms-astro
   # Choose: Empty project, TypeScript, Strict
   ```

2. **Install integrations**
   ```bash
   cd author-cms-astro
   npm install @astrojs/react @astrojs/tailwind
   npm install lucide-react marked dompurify
   ```

3. **Configure Astro**
   
   `astro.config.mjs`:
   ```javascript
   import { defineConfig } from 'astro/config';
   import react from '@astrojs/react';
   import tailwind from '@astrojs/tailwind';

   export default defineConfig({
     integrations: [react(), tailwind()],
     output: 'static',
     site: 'https://aenrique.com', // Your domain
   });
   ```

4. **Copy Tailwind config**
   ```bash
   cp ../Website/tailwind.config.js ./
   cp ../Website/src/index.css ./src/styles/global.css
   ```

### Phase 2: Create Base Layout (1-2 hours)

`src/layouts/Base.astro`:
```astro
---
import '../styles/global.css';

interface Props {
  title: string;
  description?: string;
  image?: string;
  type?: string;
}

const { title, description, image, type = 'website' } = Astro.props;
const canonicalURL = new URL(Astro.url.pathname, Astro.site);

// Fetch author info at build time
const API_URL = import.meta.env.API_URL || 'https://aenrique.com';
const authorRes = await fetch(`${API_URL}/api/author/get.php`);
const { profile: author } = await authorRes.json();
---

<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  
  {description && <meta name="description" content={description} />}
  <link rel="canonical" href={canonicalURL} />
  
  <!-- Open Graph -->
  <meta property="og:type" content={type} />
  <meta property="og:title" content={title} />
  {description && <meta property="og:description" content={description} />}
  {image && <meta property="og:image" content={image} />}
  <meta property="og:url" content={canonicalURL} />
  <meta property="og:site_name" content={author.name} />
  
  <!-- Twitter -->
  <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
  <meta name="twitter:title" content={title} />
  {description && <meta name="twitter:description" content={description} />}
  {image && <meta name="twitter:image" content={image} />}
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/icon/favicon.svg" />
  <link rel="apple-touch-icon" href="/icon/apple-touch-icon.png" />
</head>
<body class="bg-gray-900 text-white min-h-screen">
  <slot />
</body>
</html>
```

### Phase 3: Migrate Pages (4-6 hours)

#### Homepage (`src/pages/index.astro`)
```astro
---
import Layout from '../layouts/Base.astro';

const API_URL = import.meta.env.API_URL || 'https://aenrique.com';

// Fetch all data at build time
const [authorRes, storiesRes, galleriesRes] = await Promise.all([
  fetch(`${API_URL}/api/author/get.php`),
  fetch(`${API_URL}/api/stories/list.php`),
  fetch(`${API_URL}/api/galleries/list.php`)
]);

const { profile: author } = await authorRes.json();
const { data: stories } = await storiesRes.json();
const { data: galleries } = await galleriesRes.json();

const publishedStories = stories.filter((s: any) => s.status === 'published');
---

<Layout 
  title={`${author.name} | ${author.tagline}`}
  description={author.bio}
  image={author.profile_image}
>
  <main class="max-w-6xl mx-auto px-4 py-12">
    <header class="text-center mb-16">
      {author.profile_image && (
        <img 
          src={author.profile_image} 
          alt={author.name}
          class="w-32 h-32 rounded-full mx-auto mb-6 object-cover"
        />
      )}
      <h1 class="text-4xl font-bold mb-2">{author.name}</h1>
      <p class="text-xl text-gray-400">{author.tagline}</p>
    </header>
    
    <section class="mb-16">
      <h2 class="text-2xl font-semibold mb-6">Stories</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {publishedStories.map((story: any) => (
          <a 
            href={`/storytime/story/${story.slug}`}
            class="block bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
          >
            {story.cover_image && (
              <img src={story.cover_image} alt={story.title} class="w-full h-48 object-cover" />
            )}
            <div class="p-4">
              <h3 class="font-semibold text-lg">{story.title}</h3>
              <p class="text-gray-400 text-sm mt-2 line-clamp-2">{story.description}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
    
    <section>
      <h2 class="text-2xl font-semibold mb-6">Galleries</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        {galleries.slice(0, 8).map((gallery: any) => (
          <a 
            href={`/galleries/${gallery.slug}`}
            class="block bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
          >
            <h3 class="font-medium">{gallery.title}</h3>
          </a>
        ))}
      </div>
    </section>
  </main>
</Layout>
```

#### Story Listing (`src/pages/storytime/index.astro`)
```astro
---
import Layout from '../../layouts/Base.astro';

const API_URL = import.meta.env.API_URL || 'https://aenrique.com';

const [authorRes, storiesRes] = await Promise.all([
  fetch(`${API_URL}/api/author/get.php`),
  fetch(`${API_URL}/api/stories/list.php`)
]);

const { profile: author } = await authorRes.json();
const { data: stories } = await storiesRes.json();
const publishedStories = stories.filter((s: any) => s.status === 'published');
---

<Layout 
  title={`Stories | ${author.name}`}
  description={`Read stories by ${author.name}. Science fiction, fantasy, and LitRPG adventures.`}
>
  <main class="max-w-4xl mx-auto px-4 py-12">
    <h1 class="text-3xl font-bold mb-8">Stories</h1>
    
    <div class="space-y-6">
      {publishedStories.map((story: any) => (
        <a 
          href={`/storytime/story/${story.slug}`}
          class="flex gap-6 bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
        >
          {story.cover_image && (
            <img src={story.cover_image} alt={story.title} class="w-24 h-32 object-cover rounded" />
          )}
          <div>
            <h2 class="text-xl font-semibold">{story.title}</h2>
            <p class="text-gray-400 mt-2">{story.description}</p>
          </div>
        </a>
      ))}
    </div>
  </main>
</Layout>
```

#### Dynamic Story Page (`src/pages/storytime/story/[slug].astro`)
```astro
---
import Layout from '../../../layouts/Base.astro';

const API_URL = import.meta.env.API_URL || 'https://aenrique.com';

export async function getStaticPaths() {
  const API_URL = import.meta.env.API_URL || 'https://aenrique.com';
  const response = await fetch(`${API_URL}/api/stories/list.php`);
  const { data: stories } = await response.json();
  
  return stories
    .filter((s: any) => s.status === 'published')
    .map((story: any) => ({
      params: { slug: story.slug },
      props: { story }
    }));
}

const { story } = Astro.props;
const { slug } = Astro.params;

// Fetch chapters
const chaptersRes = await fetch(`${API_URL}/api/chapters/list.php?story_id=${story.id}`);
const { data: chapters } = await chaptersRes.json();
const publishedChapters = chapters.filter((c: any) => c.status === 'published');

// Fetch author
const authorRes = await fetch(`${API_URL}/api/author/get.php`);
const { profile: author } = await authorRes.json();
---

<Layout 
  title={`${story.title} | ${author.name}`}
  description={story.description}
  image={story.cover_image}
  type="book"
>
  <main class="max-w-4xl mx-auto px-4 py-12">
    <article>
      <header class="mb-8">
        {story.cover_image && (
          <img 
            src={story.cover_image} 
            alt={story.title}
            class="w-full max-w-md mx-auto rounded-lg shadow-lg mb-6"
          />
        )}
        <h1 class="text-3xl font-bold mb-4">{story.title}</h1>
        <p class="text-gray-400 text-lg">{story.description}</p>
      </header>
      
      <section>
        <h2 class="text-2xl font-semibold mb-4">Chapters</h2>
        <ol class="space-y-2">
          {publishedChapters.map((chapter: any) => (
            <li>
              <a 
                href={`/storytime/story/${slug}/${chapter.slug}`}
                class="block p-3 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
              >
                <span class="text-gray-500">Chapter {chapter.chapter_number}:</span>
                <span class="ml-2">{chapter.title}</span>
              </a>
            </li>
          ))}
        </ol>
      </section>
    </article>
  </main>
</Layout>
```

#### Dynamic Chapter Page (`src/pages/storytime/story/[storySlug]/[chapterSlug].astro`)
```astro
---
import Layout from '../../../../layouts/Base.astro';
import { marked } from 'marked';

const API_URL = import.meta.env.API_URL || 'https://aenrique.com';

export async function getStaticPaths() {
  const API_URL = import.meta.env.API_URL || 'https://aenrique.com';
  const storiesRes = await fetch(`${API_URL}/api/stories/list.php`);
  const { data: stories } = await storiesRes.json();
  
  const paths = [];
  
  for (const story of stories.filter((s: any) => s.status === 'published')) {
    const chaptersRes = await fetch(`${API_URL}/api/chapters/list.php?story_id=${story.id}`);
    const { data: chapters } = await chaptersRes.json();
    
    for (const chapter of chapters.filter((c: any) => c.status === 'published')) {
      paths.push({
        params: { storySlug: story.slug, chapterSlug: chapter.slug },
        props: { story, chapter }
      });
    }
  }
  
  return paths;
}

const { story, chapter } = Astro.props;

// Fetch author
const authorRes = await fetch(`${API_URL}/api/author/get.php`);
const { profile: author } = await authorRes.json();

// Render markdown content
const htmlContent = marked(chapter.content || '');
---

<Layout 
  title={`Chapter ${chapter.chapter_number}: ${chapter.title} - ${story.title} | ${author.name}`}
  description={chapter.content?.substring(0, 160)}
  image={story.cover_image}
  type="article"
>
  <main class="max-w-3xl mx-auto px-4 py-12">
    <article>
      <header class="mb-8 text-center">
        <p class="text-gray-500 mb-2">
          <a href={`/storytime/story/${story.slug}`} class="hover:text-white">
            {story.title}
          </a>
        </p>
        <h1 class="text-3xl font-bold">
          Chapter {chapter.chapter_number}: {chapter.title}
        </h1>
      </header>
      
      <div class="prose prose-invert prose-lg max-w-none" set:html={htmlContent} />
      
      <nav class="mt-12 flex justify-between">
        <!-- Add prev/next chapter navigation -->
      </nav>
    </article>
  </main>
</Layout>
```

### Phase 4: Deploy Strategy (1-2 hours)

#### Option A: Vercel (Recommended)

1. **Push Astro project to GitHub**
   ```bash
   cd author-cms-astro
   git init
   git add .
   git commit -m "Initial Astro setup"
   git remote add origin https://github.com/yourusername/author-cms-astro.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure build settings:
     - Framework: Astro
     - Build command: `npm run build`
     - Output directory: `dist`
   - Add environment variable:
     - `API_URL`: `https://aenrique.com`

3. **Setup Deploy Webhook**
   - In Vercel dashboard, go to Settings → Git → Deploy Hooks
   - Create a hook named "Content Update"
   - Copy the webhook URL (e.g., `https://api.vercel.com/v1/integrations/deploy/xxx`)

4. **Add webhook to your PHP endpoints**
   
   Update `api/stories/create.php`, `api/chapters/create.php`, etc:
   ```php
   // At the end of successful publish
   triggerAstroBuild();
   
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

#### Option B: Same Server

1. **Build locally or via CI**
   ```bash
   npm run build
   ```

2. **Upload `dist/` to server**
   - Upload to `/var/www/astro/` or similar
   - Configure nginx/Apache to serve Astro for public routes

3. **Nginx configuration example**
   ```nginx
   server {
       listen 80;
       server_name aenrique.com;
       
       # API - proxy to PHP
       location /api {
           proxy_pass http://localhost:8000;
       }
       
       # Admin - serve React SPA
       location /admin {
           alias /var/www/react/admin;
           try_files $uri $uri/ /admin/index.html;
       }
       
       # Everything else - serve Astro
       location / {
           root /var/www/astro;
           try_files $uri $uri.html $uri/ =404;
       }
   }
   ```

### Phase 5: Admin Panel Integration (30 mins)

Keep your existing React admin panel as-is, but add a build trigger:

```tsx
// In your admin dashboard
const triggerAstroBuild = async () => {
  await fetch('/api/admin/trigger-astro-build.php', {
    method: 'POST',
    credentials: 'include'
  });
  alert('Astro build triggered! Site will update in ~2 minutes.');
};
```

---

## Migration Checklist

### Pre-Migration
- [ ] Set up Astro project
- [ ] Install dependencies (@astrojs/react, @astrojs/tailwind)
- [ ] Configure astro.config.mjs
- [ ] Copy Tailwind configuration
- [ ] Create base layout

### Page Migration
- [ ] Homepage (/) 
- [ ] Stories listing (/storytime)
- [ ] Individual story pages (/storytime/story/[slug])
- [ ] Chapter pages (/storytime/story/[slug]/[chapter])
- [ ] Galleries listing (/galleries)
- [ ] Individual gallery pages (/galleries/[slug])
- [ ] Blog listing (/blog) - if applicable
- [ ] Individual blog posts (/blog/[slug])

### Deployment
- [ ] Connect to Vercel/Netlify
- [ ] Configure environment variables
- [ ] Set up deploy webhooks
- [ ] Test build and deploy
- [ ] Configure custom domain

### Integration
- [ ] Add deploy webhook to PHP publish endpoints
- [ ] Add "Rebuild Site" button to admin panel
- [ ] Test full workflow (publish → auto-build)

### Post-Migration
- [ ] Verify all pages render correctly
- [ ] Test social media sharing previews
- [ ] Validate with Google Search Console
- [ ] Run Lighthouse audit
- [ ] Remove PHP prerender system (optional - can keep as backup)

---

## Timeline Estimate

| Phase | Time | Notes |
|-------|------|-------|
| Phase 1: Setup | 2-3 hours | One-time setup |
| Phase 2: Base Layout | 1-2 hours | Reusable template |
| Phase 3: Page Migration | 4-6 hours | Most pages are similar |
| Phase 4: Deploy | 1-2 hours | Depends on hosting choice |
| Phase 5: Integration | 30 mins | Connect to admin |
| **Total** | **8-14 hours** | Spread over 1-2 weeks |

---

## Questions to Answer Before Starting

1. **Hosting preference?**
   - Vercel (recommended - free, auto-deploy)
   - Netlify (free alternative)
   - Same server (more complex)

2. **Interactive features needed?**
   - Comments → Can use React island with `client:load`
   - Likes → Can use React island or vanilla JS
   - Analytics → Keep existing PHP endpoint

3. **Keep PHP prerender as backup?**
   - Recommended: Yes, until Astro is proven stable
   - Can disable after 1-2 months of smooth operation

---

## Resources

- [Astro Documentation](https://docs.astro.build)
- [Astro + React Integration](https://docs.astro.build/en/guides/integrations-guide/react/)
- [Astro + Tailwind](https://docs.astro.build/en/guides/integrations-guide/tailwind/)
- [Vercel Deployment](https://docs.astro.build/en/guides/deploy/vercel/)
- [Content Collections](https://docs.astro.build/en/guides/content-collections/) - For future blog/story management

---

## Next Steps

When you're ready to start:
1. Toggle to Act mode
2. Tell me "Start Astro migration Phase 1"
3. I'll create the Astro project and initial configuration
