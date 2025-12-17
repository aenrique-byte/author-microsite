# Mock Data Implementation Plan

> **IMPORTANT:** Keep this file updated as you create assets and complete implementation phases. Check off items as you complete them.

---

## Overview
Build fallback content that displays when the SQL database is offline, allowing `npm run dev` to show a fully populated website. All mock data will be centralized in a single JSON file for easy maintenance and removal.

---

## Complete Asset Checklist

All assets go in: `public/images/mock/`

### Phase 1 - Homepage (4-6 images)
- [ ] `mock-story-cover-1.webp` - 600x900px - Featured adventure story
- [ ] `mock-story-cover-2.webp` - 600x900px - Mystery story
- [ ] `mock-story-cover-3.webp` - 600x900px - Sci-fi story
- [ ] `mock-story-cover-4.webp` - 600x900px - Fantasy story
- [ ] `mock-author-profile.webp` - 400x400px - Author headshot (optional)

### Phase 2 - Blog (6-8 images)
- [ ] `mock-blog-cover-1.webp` - 1200x630px - Blog post hero
- [ ] `mock-blog-cover-2.webp` - 1200x630px - Blog post hero
- [ ] `mock-blog-cover-3.webp` - 1200x630px - Blog post hero
- [ ] `mock-blog-cover-4.webp` - 1200x630px - Blog post hero
- [ ] `mock-blog-cover-5.webp` - 1200x630px - Blog post hero
- [ ] `mock-blog-cover-6.webp` - 1200x630px - Blog post hero

### Phase 3 - Storytime (0-2 images, can reuse Phase 1)
- [ ] Reuse `mock-story-cover-1.webp` OR create `mock-story-adventure.webp`
- [ ] Reuse `mock-story-cover-2.webp` OR create `mock-story-mystery.webp`

### Phase 4 - Gallery (6 images total)
- [x] `mock-collection-landscapes.webp` - 800x600px
- [x] `mock-collection-characters.webp` - 800x600px
- [x] `mock-image-landscape-1.webp` - 1024x768px
- [x] `mock-image-landscape-1-thumb.webp` - 400x300px
- [x] `mock-image-character-1.webp` - 768x1024px
- [x] `mock-image-character-1-thumb.webp` - 300x400px

**Total Unique Images: 18-20 images** (depending on reuse)

---

## Implementation Progress

### Phase 1: UniversePortalHomepage
**Status:** ✅ Complete

**Files to Create/Modify:**
- [x] Create `src/data/mock-data.json` with homepage section
- [x] Create `public/images/mock/` directory
- [x] Modify `src/components/UniversePortalHomepage.tsx` (add fallback logic)

**Mock Data Structure:**
```json
{
  "homepage": {
    "profile": { name, bio, tagline, profile_image },
    "settings": { hero_title, hero_tagline, brand_color, etc. },
    "featured_story": { id, title, tagline, cover_image, genres, etc. },
    "stories": [array of 4-6 stories],
    "activity": [array of recent activities],
    "tools": [array of 3-4 tools],
    "socials": { twitter, patreon, etc. }
  }
}
```

---

### Phase 2: Blog
**Status:** ✅ Complete

**Files to Create/Modify:**
- [x] Update `src/data/mock-data.json` (add blog section)
- [x] Modify `src/utils/api-blog.ts` (add fallback to all fetch functions)

**Mock Data Structure:**
```json
{
  "blog": {
    "posts": [array of 6-8 blog posts with full content],
    "categories": [array of categories],
    "tags": [array of tags]
  }
}
```

**Functions to Add Fallback Logic:**
- `listBlogPosts()` - return mock posts when API fails
- `getBlogPostBySlug()` - return mock post when API fails
- `listBlogCategories()` - return mock categories
- `listBlogTags()` - return mock tags
- Other functions (likes, comments) - return empty/default states

---

### Phase 3: Storytime
**Status:** ✅ Complete

**Files to Create/Modify:**
- [x] Update `src/data/mock-data.json` (add storytime section)
- [x] Modify `src/features/storytime/utils/api-story.ts` (add fallback logic)

**Mock Data Structure:**
```json
{
  "storytime": {
    "stories": [
      {
        "id": "mock-adventure",
        "title": "The Crystal Compass",
        "blurb": "A short adventure through unknown lands",
        "cover": "/images/mock/mock-story-adventure.webp",
        "genres": ["Adventure", "Fantasy"],
        "chapter_count": 3
      },
      {
        "id": "mock-mystery",
        "title": "The Locked Room",
        "blurb": "A detective's quick case",
        "cover": "/images/mock/mock-story-mystery.webp",
        "genres": ["Mystery", "Thriller"],
        "chapter_count": 3
      }
    ],
    "chapters": {
      "mock-adventure": [
        { "num": 1, "title": "The Discovery", "content": "..." },
        { "num": 2, "title": "The Journey", "content": "..." },
        { "num": 3, "title": "The Return", "content": "..." }
      ],
      "mock-mystery": [
        { "num": 1, "title": "The Call", "content": "..." },
        { "num": 2, "title": "The Clues", "content": "..." },
        { "num": 3, "title": "The Solution", "content": "..." }
      ]
    }
  }
}
```

**Functions to Add Fallback Logic:**
- `loadStoryList()` - return mock stories on API failure
- `loadStory()` - return mock story by slug
- `loadChapterList()` - return mock chapters
- `loadChapterContent()` - return mock chapter content
- Author profile - return default mock profile

---

### Phase 4: Gallery
**Status:** ✅ Complete

**Files to Create/Modify:**
- [x] Update `src/data/mock-data.json` (add galleries section)
- [x] Modify `src/features/galleries/GalleriesRoute.tsx` (add fallback logic)

**Mock Data Structure:**
```json
{
  "galleries": {
    "collections": [
      {
        "id": 1,
        "slug": "mock-landscapes",
        "title": "Landscape Collection",
        "description": "Beautiful scenery",
        "cover_hero": "/images/mock/mock-collection-landscapes.webp",
        "gallery_count": 1
      },
      {
        "id": 2,
        "slug": "mock-characters",
        "title": "Character Collection",
        "description": "Character portraits",
        "cover_hero": "/images/mock/mock-collection-characters.webp",
        "gallery_count": 1
      }
    ],
    "galleries": [...],
    "images": {...}
  }
}
```

**Fetch Logic to Add Fallback:**
- Collection list fetch - return mock collections
- Gallery list fetch - return mock galleries
- Image list fetch - return mock images
- Stats/likes/comments - return empty defaults

---

## Fallback Pattern (Applied Everywhere)

```typescript
async function fetchData(endpoint: string, mockData: any) {
  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error('API unavailable');
    return await response.json();
  } catch (error) {
    console.log('Database offline, using mock data');
    return { success: true, ...mockData };
  }
}
```

---

## Cleanup Strategy (When Database Goes Live)

1. Delete `src/data/mock-data.json`
2. Delete `public/images/mock/` directory
3. Remove fallback logic from modified files (search for "mock data" or "MOCK DATA" comments)
4. All components already work with real data - no changes needed

---

## Notes

- Mock data structure matches exact API response format
- All image paths use `/images/mock/` prefix for easy identification
- Fallback logic only activates when database is truly offline
- No performance impact when database is online (try/catch overhead negligible)
- Mock content should be realistic enough to test layouts but clearly labeled as placeholder
- **Background images already exist:** `/images/lofi_bg.webp` and `/images/lofi_light_bg.webp`

---

## Benefits of This Approach

1. **Single Source of Truth:** All mock content in one JSON file
2. **No Component Changes:** Components work identically with mock or real data
3. **Easy Cleanup:** Delete one file and one directory when done
4. **Development Ready:** Run `npm run dev` immediately with full content
5. **Visual Testing:** See actual layouts with realistic content
6. **Progressive:** Implement phase by phase, test incrementally
