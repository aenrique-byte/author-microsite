# New Author Homepage Implementation Plan

## Overview
Transform the author homepage from a simple centered card to a rich, multi-section universe portal while preserving existing features like dynamic backgrounds, theme toggle, and API-driven content.

## Design Goals
1. Keep dynamic background chooser with comma-separated random selection
2. Preserve light/dark theme toggle functionality
3. Maintain API-driven architecture (no hardcoded content)
4. Add glass-morphism design with backdrop blur effects
5. Create multi-section layout: Hero, Universes/Stories Grid, Activity Feed, Tools, Footer
6. Add new admin controls for homepage customization

---

## Phase 1: Database Schema Updates

### New Tables

#### `homepage_settings` (New)
Stores global homepage configuration
```sql
CREATE TABLE homepage_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hero_title VARCHAR(255) DEFAULT 'Step into the worlds of',
  hero_subtitle TEXT,
  hero_description TEXT,
  show_featured_story BOOLEAN DEFAULT TRUE,
  show_activity_feed BOOLEAN DEFAULT TRUE,
  show_tools_section BOOLEAN DEFAULT TRUE,
  newsletter_cta_text VARCHAR(255) DEFAULT 'Join the Newsletter',
  newsletter_url VARCHAR(500),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### `homepage_tools` (New)
Configurable tools/features to display in sidebar
```sql
CREATE TABLE homepage_tools (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  link VARCHAR(500),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `activity_feed` (New)
Recent activity/updates to display (blog posts, chapters, announcements)
```sql
CREATE TABLE activity_feed (
  id INT PRIMARY KEY AUTO_INCREMENT,
  source VARCHAR(50) NOT NULL, -- 'RoyalRoad', 'Patreon', 'Blog', 'Site', etc.
  label VARCHAR(100), -- 'New Chapter', 'Blog Post', 'Announcement', etc.
  title VARCHAR(255) NOT NULL,
  series_title VARCHAR(255), -- Associated story/series name
  url VARCHAR(500),
  published_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table Updates

#### `author_profiles` (Extend existing)
Add new homepage-specific fields
```sql
ALTER TABLE author_profiles ADD COLUMN hero_tagline VARCHAR(255) AFTER tagline;
ALTER TABLE author_profiles ADD COLUMN hero_description TEXT AFTER hero_tagline;
ALTER TABLE author_profiles ADD COLUMN brand_color VARCHAR(7) DEFAULT '#10b981'; -- emerald-500
ALTER TABLE author_profiles ADD COLUMN show_newsletter_signup BOOLEAN DEFAULT TRUE;
```

#### `stories` (Use existing)
Ensure these fields exist for the stories grid:
- `title` ✓
- `tagline` or `genre_tags` (JSON or comma-separated)
- `description` ✓
- `cover_image` ✓
- `is_featured` (for hero section)
- `external_url` (RoyalRoad/Patreon links)
- `latest_chapter_number`
- `latest_chapter_title`

---

## Phase 2: New API Endpoints

### `/api/homepage/get.php` (New)
Retrieves all homepage data in one call
```json
{
  "success": true,
  "profile": {
    "name": "O.C. Wanderer",
    "bio": "Author & Writer",
    "tagline": "Sci-Fi & Fantasy Universes",
    "hero_tagline": "Shared Multiverse Portal",
    "hero_description": "Starships, sky-pirates, cursed knights...",
    "profile_image": "/images/author.jpg",
    "background_image_light": "bg1.webp,bg2.webp",
    "background_image_dark": "bg3.webp,bg4.webp",
    "brand_color": "#10b981",
    "show_newsletter_signup": true
  },
  "settings": {
    "hero_title": "Step into the worlds of",
    "show_featured_story": true,
    "show_activity_feed": true,
    "show_tools_section": true,
    "newsletter_cta_text": "Join the Newsletter",
    "newsletter_url": "https://..."
  },
  "featured_story": {
    "id": 1,
    "title": "Destiny Among the Stars",
    "tagline": "Sci-Fi • LitRPG • Space Opera",
    "description": "...",
    "cover_image": "/images/...",
    "tags": ["Portal Delving", "System-LitRPG", "Found Family"],
    "latest_chapter": 142,
    "latest_chapter_title": "Signal in the Midnight Veil",
    "external_urls": {
      "royalroad": "https://...",
      "patreon": "https://..."
    }
  },
  "stories": [
    {
      "id": 2,
      "title": "Sinbad, Captain of the Sky",
      "tagline": "Sky Pirates • Adventure • Magic",
      "description": "...",
      "cover_image": "/images/...",
      "cta_text": "Board the Skyship"
    }
  ],
  "activity": [
    {
      "id": 1,
      "source": "RoyalRoad",
      "label": "New Chapter",
      "title": "Chapter 142 – Signal...",
      "series": "Destiny Among the Stars",
      "url": "https://...",
      "time": "3 hours ago"
    }
  ],
  "tools": [
    {
      "title": "LitRPG Tools",
      "description": "Create, track, and balance characters...",
      "icon": "📊",
      "link": "/litrpg"
    }
  ],
  "socials": {
    "royalroad": "https://...",
    "patreon": "https://...",
    ...
  }
}
```

### `/api/homepage/update-settings.php` (New)
Admin endpoint to update homepage settings

### `/api/homepage/tools.php` (New)
CRUD operations for homepage tools

### `/api/homepage/activity.php` (New)
CRUD operations for activity feed items

---

## Phase 3: Admin Dashboard Updates

### New Admin Section: "Homepage Manager"

Create `/src/components/admin/HomepageManager.tsx`

#### Features:
1. **Hero Section Editor**
   - Edit hero title, tagline, description
   - Select featured story (dropdown from published stories)
   - Toggle sections on/off (featured story, activity feed, tools)
   - Brand color picker for accent color

2. **Activity Feed Manager**
   - Add/edit/delete activity items
   - Drag-to-reorder (display order)
   - Quick import from blog posts
   - Set source, label, title, series, URL

3. **Tools Section Manager**
   - Add/edit/delete tools
   - Icon selector or emoji picker
   - Link to internal/external URLs
   - Reorder tools

4. **Background Images** (extend existing)
   - Already have this in AuthorProfileManager ✓
   - Ensure light/dark modes both support comma-separated lists

5. **Preview Mode**
   - Live preview of homepage as you edit
   - Toggle between light/dark theme

### Integration with UnifiedAdminDashboard
Add new tab/section for "Homepage" alongside existing Author Profile, Stories, etc.

---

## Phase 4: Frontend Component Development

### New Component: `UniversePortalHomepage.tsx`

Convert `universe_portal_homepage.jsx` to TypeScript and integrate with APIs.

#### Component Structure:
```
UniversePortalHomepage (ThemeProvider wrapper)
├── ThemeToggle
├── Navbar
│   ├── Brand (author name + tagline)
│   ├── Navigation Links
│   └── Newsletter CTA Button
├── HeroSection
│   ├── Hero Copy (left)
│   │   ├── Tagline badge
│   │   ├── Title + author name
│   │   ├── Description
│   │   ├── CTA Buttons
│   │   └── Platform badges (RR, Patreon)
│   └── FeaturedStoryCard (right)
│       ├── Cover image
│       ├── Title, tags, description
│       └── Quick links (RR chapter, Patreon)
├── StoriesGrid
│   ├── Section header
│   └── StoryCard[] (map from API data)
│       ├── Cover image
│       ├── Title, tagline, description
│       └── CTA button
├── ActivityAndTools (2-column)
│   ├── ActivityFeed (left)
│   │   └── ActivityItem[] (source, label, title, time)
│   └── ToolsSidebar (right)
│       ├── Tools intro text
│       ├── ToolCard[] (title, description, link)
│       └── "Open tools hub" button
└── Footer
    ├── Copyright
    └── Social links
```

#### Key Implementation Details:

1. **Dynamic Background System** (preserve existing)
   ```tsx
   const backgroundImage = theme === 'light'
     ? getRandomBackground(
         profile.background_image_light || profile.background_image,
         '/images/lofi_light_bg.webp'
       )
     : getRandomBackground(
         profile.background_image_dark || profile.background_image,
         '/images/lofi_bg.webp'
       )
   ```

2. **Brand Color Integration**
   Use CSS custom properties to apply admin-configured brand color:
   ```tsx
   <style>{`
     :root {
       --brand-color: ${profile.brand_color || '#10b981'};
     }
   `}</style>
   ```
   Replace hardcoded `emerald-500` with `[color:var(--brand-color)]`

3. **Theme Support**
   - Light mode: `bg-white/70`, `text-gray-900`, lighter overlays
   - Dark mode: `bg-black/70`, `text-white`, darker overlays
   - All sections need theme-aware classes

4. **Responsive Design**
   - Mobile-first approach
   - Stack sections vertically on mobile
   - 2-column layouts on desktop
   - Test at breakpoints: sm, md, lg, xl

5. **Loading States**
   - Skeleton screens for each section
   - Progressive enhancement (show what's loaded)

6. **Error Handling**
   - Graceful fallbacks if API fails
   - Hide sections with no data (e.g., no activity feed items)

---

## Phase 5: Data Migration & Seeding

### Seed Default Data

#### `homepage_settings`
```sql
INSERT INTO homepage_settings (
  hero_title,
  hero_subtitle,
  hero_description,
  newsletter_cta_text
) VALUES (
  'Step into the worlds of',
  'Shared Multiverse Portal',
  'Starships, sky-pirates, cursed knights, and reluctant warlocks. One site to explore every series.',
  'Join the Newsletter'
);
```

#### `homepage_tools`
```sql
INSERT INTO homepage_tools (title, description, icon, link, display_order) VALUES
('LitRPG Tools', 'Create, track, and balance characters using the same system behind the books.', '📊', '/litrpg', 1),
('Image Galleries', 'Concept art, character portraits, ship designs, and location mood boards.', '🖼️', '/galleries', 2),
('Shoutout Manager', 'Automated shoutout calendar for RoyalRoad swaps and cross-promo.', '📢', '/shoutouts', 3);
```

### Migration Script
Create `/api/migrations/2025-12-11-homepage-system.sql`

---

## Phase 6: Routing & Integration

### Update Router
In `src/app/router.tsx`:
```tsx
import UniversePortalHomepage from '../components/UniversePortalHomepage'

// Replace AuthorHomepage route
<Route path="/" element={<UniversePortalHomepage />} />
```

### Backwards Compatibility
- Keep old `AuthorHomepage.tsx` as `LegacyAuthorHomepage.tsx` for rollback
- Admin toggle to switch between "Simple" and "Portal" homepage styles?

---

## Phase 7: Testing Checklist

### Visual Testing
- [ ] Light theme renders correctly
- [ ] Dark theme renders correctly
- [ ] Theme toggle works smoothly
- [ ] Responsive on mobile (320px, 375px, 414px)
- [ ] Responsive on tablet (768px, 1024px)
- [ ] Responsive on desktop (1280px, 1920px)
- [ ] Glass-morphism effects visible
- [ ] Brand color applied correctly
- [ ] Background images load and randomize

### Functional Testing
- [ ] All API endpoints return correct data
- [ ] Featured story displays when set
- [ ] Stories grid populates from database
- [ ] Activity feed shows recent items
- [ ] Tools section links work
- [ ] Social icons display and link correctly
- [ ] Newsletter CTA links to correct URL
- [ ] Navigation buttons route correctly
- [ ] Admin can edit all homepage settings
- [ ] Admin can add/edit/delete activity items
- [ ] Admin can add/edit/delete tools
- [ ] Changes in admin immediately reflect on homepage

### Performance Testing
- [ ] Page load time < 2s
- [ ] Images lazy load
- [ ] No layout shift (CLS)
- [ ] Smooth animations (60fps)

### SEO Testing
- [ ] Meta tags populate correctly
- [ ] OpenGraph tags work (test with sharing)
- [ ] Twitter cards render
- [ ] Canonical URL set
- [ ] Structured data if applicable

---

## Dependencies & Components Inventory

### Existing Components (Reuse)
- ✓ `ThemeProvider` & `ThemeToggle` (from AuthorHomepage.tsx)
- ✓ `SocialIcons` component
- ✓ `getRandomBackground()` utility
- ✓ Background image upload in AuthorProfileManager

### New Components Needed
- `UniversePortalHomepage.tsx` (main component)
- `Navbar.tsx` (or inline)
- `HeroSection.tsx` (or inline)
- `FeaturedStoryCard.tsx`
- `StoriesGrid.tsx` + `StoryCard.tsx`
- `ActivityFeed.tsx` + `ActivityItem.tsx`
- `ToolsSidebar.tsx` + `ToolCard.tsx`
- `Footer.tsx` (or inline)
- `HomepageManager.tsx` (admin)

### New APIs Needed
- `/api/homepage/get.php`
- `/api/homepage/update-settings.php`
- `/api/homepage/tools.php` (CRUD)
- `/api/homepage/activity.php` (CRUD)

### Database Migrations
- `2025-12-11-homepage-system.sql` (tables creation)
- `2025-12-11-seed-homepage-defaults.sql` (default data)

---

## Implementation Order

### Step 1: Database (1-2 hours)
1. Create migration SQL files
2. Run migrations to create tables
3. Seed default data
4. Test all new tables exist

### Step 2: API Endpoints (2-3 hours)
1. Create `/api/homepage/get.php` (read-only, combined data)
2. Create `/api/homepage/update-settings.php` (admin write)
3. Create `/api/homepage/tools.php` (admin CRUD)
4. Create `/api/homepage/activity.php` (admin CRUD)
5. Test all endpoints with Postman/curl

### Step 3: Admin Interface (3-4 hours)
1. Create `HomepageManager.tsx`
2. Build settings editor UI
3. Build activity feed manager
4. Build tools manager
5. Add to UnifiedAdminDashboard
6. Test admin functionality

### Step 4: Frontend Component (4-6 hours)
1. Convert JSX to TypeScript (`UniversePortalHomepage.tsx`)
2. Integrate API data fetching
3. Add theme support (light/dark)
4. Implement dynamic background system
5. Apply brand color system
6. Add loading states
7. Make fully responsive

### Step 5: Integration & Testing (2-3 hours)
1. Update router to use new homepage
2. Test all user flows
3. Test admin flows
4. Cross-browser testing
5. Mobile device testing
6. Performance audit

### Step 6: Polish & Deploy (1-2 hours)
1. Fix any bugs found in testing
2. Optimize images
3. Add transitions/animations
4. Final QA pass
5. Deploy to production

**Total Estimated Time: 13-20 hours**

---

## Rollback Plan

If issues arise:
1. Keep `AuthorHomepage.tsx` as fallback
2. Router can quickly switch back
3. New database tables don't affect existing functionality
4. Admin can hide new sections via toggles

---

## Future Enhancements (Post-MVP)

- [ ] RSS feed integration for automatic activity updates
- [ ] RoyalRoad API integration for live chapter counts
- [ ] Patreon API integration for subscriber count
- [ ] Blog post auto-import to activity feed
- [ ] A/B testing between homepage styles
- [ ] Analytics dashboard (views, clicks, conversions)
- [ ] Customizable color schemes (beyond single brand color)
- [ ] Multiple featured stories carousel
- [ ] Reader testimonials section

---

## Questions to Answer Before Starting

1. **Brand Color**: Do you want emerald (#10b981) as default, or a different color?
2. **Newsletter**: Do you have a newsletter service URL to link to?
3. **Activity Feed**: Should this auto-populate from blog posts, or manual entry only?
4. **Tools**: Which tools should be enabled by default? (LitRPG Tools, Galleries, Shoutouts confirmed)
5. **External Links**: Do you have RoyalRoad/Patreon URLs ready for stories?
6. **Featured Story**: Which story should be featured initially?

---

## Success Metrics

- Homepage provides clear value proposition within 3 seconds
- Users can navigate to any major section in 1 click
- Admin can update homepage content without touching code
- Page loads in < 2s on 3G connection
- Mobile experience is smooth and readable
- Design reflects professional author brand
