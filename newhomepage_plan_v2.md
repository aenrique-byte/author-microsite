# New Author Homepage Implementation Plan v2
**Streamlined Edition - Less Plumbing, More Writing**

## Overview
Transform the author homepage from a simple centered card to a rich, multi-section universe portal while preserving existing features and keeping it simple for a one-author site.

## Design Goals (Unchanged)
1. ✅ Keep dynamic background chooser with comma-separated random selection
2. ✅ Preserve light/dark theme toggle functionality
3. ✅ Maintain API-driven architecture (no hardcoded content)
4. ✅ Add glass-morphism design with backdrop blur effects
5. ✅ Create multi-section layout: Hero, Stories Grid, Activity Feed, Tools, Footer
6. ✅ Full admin control without touching code

---

## Phase 1: Database Schema Updates

### New Tables

#### `homepage_settings` (New)
**Single source of truth for ALL homepage configuration**
```sql
CREATE TABLE homepage_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,

  -- Hero section
  hero_title VARCHAR(255) DEFAULT 'Step into the worlds of',
  hero_tagline VARCHAR(255) DEFAULT 'Shared Multiverse Portal',
  hero_description TEXT,

  -- Featured story
  featured_story_id INT DEFAULT NULL,
  show_featured_story BOOLEAN DEFAULT TRUE,

  -- Section toggles
  show_activity_feed BOOLEAN DEFAULT TRUE,
  show_tools_section BOOLEAN DEFAULT TRUE,

  -- Newsletter
  newsletter_cta_text VARCHAR(255) DEFAULT 'Join the Newsletter',
  newsletter_url VARCHAR(500),

  -- Branding
  brand_color VARCHAR(7) DEFAULT '#10b981',

  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (featured_story_id) REFERENCES stories(id) ON DELETE SET NULL
);
```

#### `homepage_tools` (New)
**Configurable tools/features sidebar**
```sql
CREATE TABLE homepage_tools (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT '🔧', -- emoji or icon class
  link VARCHAR(500),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_display_order (display_order)
);
```

#### `activity_feed` (New)
**Generic activity/updates feed**
```sql
CREATE TABLE activity_feed (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('blog', 'chapter', 'announcement', 'misc') DEFAULT 'misc',
  source VARCHAR(50) NOT NULL, -- 'RoyalRoad', 'Patreon', 'Blog', 'Site'
  label VARCHAR(100), -- 'New Chapter', 'Blog Post', 'Dev Log'
  title VARCHAR(255) NOT NULL,
  series_title VARCHAR(255), -- Associated story name
  url VARCHAR(500),
  published_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_published (published_at DESC, is_active)
);
```

### Table Updates

#### `stories` (Extend existing)
Add fields for external platform links, ordering, and featured story
```sql
ALTER TABLE stories ADD COLUMN continue_url_royalroad VARCHAR(500) AFTER external_url;
ALTER TABLE stories ADD COLUMN continue_url_patreon VARCHAR(500) AFTER continue_url_royalroad;
ALTER TABLE stories ADD COLUMN latest_chapter_number INT DEFAULT NULL;
ALTER TABLE stories ADD COLUMN latest_chapter_title VARCHAR(255) DEFAULT NULL;
ALTER TABLE stories ADD COLUMN teaser_chapter_count INT DEFAULT 20;
ALTER TABLE stories ADD COLUMN genre_tags VARCHAR(500); -- comma-separated for now
ALTER TABLE stories ADD COLUMN cta_text VARCHAR(100) DEFAULT 'Start Reading';
ALTER TABLE stories ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE stories ADD COLUMN display_order INT DEFAULT 0;
ALTER TABLE stories ADD INDEX idx_display_order (display_order);
```

#### `author_profiles` (Keep minimal, no duplication)
**NO CHANGES** - Keep profile identity clean. All homepage hero copy goes in `homepage_settings`.

---

## Phase 2: Single API Endpoint (Simplified)

### `GET /api/homepage` (New - ONE endpoint to rule them all)
Returns complete homepage data in a single payload.

**Response:**
```json
{
  "success": true,
  "profile": {
    "name": "O.C. Wanderer",
    "bio": "Author & Writer",
    "tagline": "Sci-Fi & Fantasy Universes",
    "profile_image": "/images/author.jpg",
    "background_image_light": "bg1.webp,bg2.webp",
    "background_image_dark": "bg3.webp,bg4.webp",
    "site_domain": "example.com"
  },
  "settings": {
    "hero_title": "Step into the worlds of",
    "hero_tagline": "Shared Multiverse Portal",
    "hero_description": "Starships, sky-pirates, cursed knights...",
    "show_featured_story": true,
    "show_activity_feed": true,
    "show_tools_section": true,
    "newsletter_cta_text": "Join the Newsletter",
    "newsletter_url": "https://...",
    "brand_color": "#10b981"
  },
  "featured_story": {
    "id": 1,
    "title": "Destiny Among the Stars",
    "tagline": "Sci-Fi • LitRPG • Space Opera",
    "description": "A young crew pushes humanity beyond the Solar System...",
    "cover_image": "/images/covers/destiny.jpg",
    "genre_tags": ["Portal Delving", "System-LitRPG", "Found Family"],
    "latest_chapter_number": 142,
    "latest_chapter_title": "Signal in the Midnight Veil",
    "continue_url_royalroad": "https://...",
    "continue_url_patreon": "https://..."
  },
  "stories": [
    {
      "id": 2,
      "title": "Sinbad, Captain of the Sky",
      "tagline": "Sky Pirates • Adventure • Magic",
      "description": "A cursed captain, drifting sky-ships...",
      "cover_image": "/images/covers/sinbad.jpg",
      "cta_text": "Board the Skyship",
      "genre_tags": ["Sky Pirates", "Adventure", "Magic"],
      "display_order": 2
    }
  ],
  "activity": [
    {
      "id": 1,
      "type": "chapter",
      "source": "RoyalRoad",
      "label": "New Chapter",
      "title": "Chapter 142 – Signal in the Midnight Veil",
      "series_title": "Destiny Among the Stars",
      "url": "https://...",
      "published_at": "2025-12-11T10:30:00Z",
      "time_ago": "3 hours ago"
    }
  ],
  "tools": [
    {
      "id": 1,
      "title": "LitRPG Tools",
      "description": "Create, track, and balance characters...",
      "icon": "📊",
      "link": "/litrpg"
    }
  ],
  "socials": {
    "royalroad": "https://...",
    "patreon": "https://..."
  }
}
```

**Implementation Notes:**
- ✅ Always return `brand_color` (fallback to `#10b981` if NULL)
- ✅ If `homepage_settings` is empty, return sane defaults (see code example below)
- ✅ Add simple 60s cache (file or memory) to reduce DB load
- ✅ `time_ago` calculated server-side for activity items
- ✅ `genre_tags` parsed from comma-separated string to array
- ✅ Filter `is_active = true` for activity & tools
- ✅ Order activity by `published_at DESC`, tools by `display_order`, stories by `display_order`
- ✅ Featured story auto-selected from `stories.is_featured = true` if `featured_story_id` is NULL

**Fallback Defaults Pattern (PHP):**
```php
// Ensure all settings have fallback values
$settings = [
    'brand_color' => $row['brand_color'] ?? '#10b981',
    'hero_title' => $row['hero_title'] ?? 'Step into the worlds of',
    'hero_tagline' => $row['hero_tagline'] ?? 'Shared Multiverse Portal',
    'hero_description' => $row['hero_description'] ?? '',
    'show_featured_story' => $row['show_featured_story'] ?? true,
    'show_activity_feed' => $row['show_activity_feed'] ?? true,
    'show_tools_section' => $row['show_tools_section'] ?? true,
    'newsletter_cta_text' => $row['newsletter_cta_text'] ?? 'Join the Newsletter',
    'newsletter_url' => $row['newsletter_url'] ?? '',
];

// Auto-select featured story if not explicitly set
if (empty($settings['featured_story_id'])) {
    // Fallback: find first story with is_featured = true
    $featured_query = "SELECT id FROM stories WHERE is_featured = true LIMIT 1";
    // ... use that ID
}
```

### Admin CRUD Endpoints (Simple REST)

```
POST   /api/homepage/settings        Update homepage settings
GET    /api/homepage/tools           List all tools
POST   /api/homepage/tools           Create tool
PUT    /api/homepage/tools/{id}      Update tool
DELETE /api/homepage/tools/{id}      Delete tool
GET    /api/homepage/activity        List all activity items
POST   /api/homepage/activity        Create activity item
PUT    /api/homepage/activity/{id}   Update activity item
DELETE /api/homepage/activity/{id}   Delete activity item
```

**Auth:** All admin endpoints check session/auth (already implemented in your system).

---

## Phase 3: Admin Dashboard - Homepage Manager

### New Component: `/src/components/admin/HomepageManager.tsx`

**Tab Structure:**
```
HomepageManager
├── Hero Settings Tab
│   ├── Text inputs (hero_title, hero_tagline, hero_description)
│   ├── Featured Story dropdown (ALL published stories, auto-select first if none set)
│   ├── Brand Color picker (with hex validation)
│   ├── Section toggles (featured story, activity feed, tools)
│   └── Newsletter URL input
├── Activity Feed Tab
│   ├── List of activity items (table: source, title, date, actions)
│   ├── Add New button → modal
│   ├── Edit/Delete buttons
│   └── Future: "Import from blog post" button
└── Tools Tab
    ├── List of tools (drag-to-reorder by display_order using react-beautiful-dnd)
    ├── Add New button → modal
    ├── Edit/Delete buttons
    └── Icon picker (emoji selector or text input)

Note: Preview Tab skipped in v1, will be added in v2 if needed
```

**Note on Story Ordering:**
- Stories in the grid are sorted by `display_order` ASC
- Admin can set `display_order` in the existing Story Manager (extend it)
- Allows manual control: "Destiny first, Sinbad second, etc."

**Key Features:**
- Auto-save or explicit Save button (your choice)
- Validation (e.g., brand color must be valid hex)
- Drag-and-drop reordering for tools (react-beautiful-dnd or similar)
- Inline editing where possible

### Integration with UnifiedAdminDashboard
Add new nav item:
```tsx
<NavLink to="/admin/homepage">Homepage</NavLink>
```

---

## Phase 4: Frontend Component

### New Component: `UniversePortalHomepage.tsx`

**Structure:**
```tsx
UniversePortalHomepage (with ThemeProvider)
├── ThemeToggle (reuse existing)
├── Fixed Background Layer (with theme-aware overlay)
├── Navbar
│   ├── Brand (profile.name + settings.hero_tagline)
│   ├── Nav Links (Universes, Blog, Tools, About)
│   └── Newsletter CTA Button
├── HeroSection
│   ├── Left: Hero Copy
│   │   ├── Badge (settings.hero_tagline)
│   │   ├── Title (settings.hero_title + profile.name)
│   │   ├── Description (settings.hero_description)
│   │   ├── CTA Buttons ("Start Reading", "Browse All")
│   │   └── Platform Badges (RR, Patreon)
│   └── Right: FeaturedStoryCard
│       ├── Cover Image
│       ├── Title, Tags, Description
│       └── Latest Chapter + Continue Reading links
├── StoriesGrid (if stories.length > 0)
│   ├── Section Header
│   └── StoryCard[] (map stories)
├── ActivityAndTools (2-column layout)
│   ├── ActivityFeed (if show_activity_feed)
│   └── ToolsSidebar (if show_tools_section)
└── Footer
    ├── Copyright (auto year)
    └── Social Links (from socials)
```

**Key Implementation Details:**

#### 1. Single Data Fetch
```tsx
useEffect(() => {
  fetch('/api/homepage')
    .then(res => res.json())
    .then(data => {
      setHomepageData(data)
      setLoading(false)
    })
    .catch(err => {
      console.error(err)
      setError(true)
    })
}, [])
```

#### 2. Dynamic Background (Preserved)
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

#### 3. Brand Color CSS Variable
```tsx
<style>{`
  :root {
    --brand-color: ${settings.brand_color || '#10b981'};
    --brand-color-hover: ${lighten(settings.brand_color, 10)};
  }
`}</style>
```

Then use in Tailwind:
```tsx
className="bg-[var(--brand-color)] hover:bg-[var(--brand-color-hover)]"
```

#### 4. Theme-Aware Classes
```tsx
const cardClass = theme === 'light'
  ? 'bg-white/70 text-gray-900 border-gray-200/50'
  : 'bg-neutral-900/80 text-white border-white/10'

const overlayClass = theme === 'light'
  ? 'bg-white/60'
  : 'bg-black/60'
```

#### 5. Conditional Sections
```tsx
{settings.show_featured_story && featured_story && (
  <FeaturedStoryCard story={featured_story} />
)}

{settings.show_activity_feed && activity.length > 0 && (
  <ActivityFeed items={activity} />
)}

{settings.show_tools_section && tools.length > 0 && (
  <ToolsSidebar tools={tools} />
)}
```

#### 6. Loading & Error States
```tsx
if (loading) return <LoadingSkeleton />
if (error) return <ErrorFallback />
if (!homepageData) return null
```

---

## Phase 5: Data Migration & Seeding

### Migration: `/api/migrations/2025-12-11-homepage-system.sql`

```sql
-- Create tables
CREATE TABLE homepage_settings (...);
CREATE TABLE homepage_tools (...);
CREATE TABLE activity_feed (...);

-- Extend stories table
ALTER TABLE stories ADD COLUMN continue_url_royalroad VARCHAR(500);
ALTER TABLE stories ADD COLUMN continue_url_patreon VARCHAR(500);
ALTER TABLE stories ADD COLUMN latest_chapter_number INT DEFAULT NULL;
ALTER TABLE stories ADD COLUMN latest_chapter_title VARCHAR(255) DEFAULT NULL;
ALTER TABLE stories ADD COLUMN teaser_chapter_count INT DEFAULT 20;
ALTER TABLE stories ADD COLUMN genre_tags VARCHAR(500);
ALTER TABLE stories ADD COLUMN cta_text VARCHAR(100) DEFAULT 'Start Reading';
ALTER TABLE stories ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE stories ADD COLUMN display_order INT DEFAULT 0;
ALTER TABLE stories ADD INDEX idx_display_order (display_order);

-- Insert default homepage settings
INSERT INTO homepage_settings (
  hero_title,
  hero_tagline,
  hero_description,
  brand_color,
  newsletter_cta_text,
  show_featured_story,
  show_activity_feed,
  show_tools_section
) VALUES (
  'Step into the worlds of',
  'Shared Multiverse Portal',
  'Starships, sky-pirates, cursed knights, and reluctant warlocks. One site to explore every series, follow new chapters, and get early access to the stories before they go live.',
  '#10b981',
  'Join the Newsletter',
  true,
  true,
  true
);

-- Seed default tools
INSERT INTO homepage_tools (title, description, icon, link, display_order, is_active) VALUES
('LitRPG Tools', 'Create, track, and balance characters using the same system behind the books.', '📊', '/litrpg', 1, true),
('Image Galleries', 'Concept art, character portraits, ship designs, and location mood boards.', '🖼️', '/galleries', 2, true),
('Shoutout Manager', 'Automated shoutout calendar for RoyalRoad swaps and cross-promo.', '📢', '/shoutouts', 3, true);
```

---

## Phase 6: Routing & Integration (Staged Deployment)

### Parallel Deployment Strategy

**Goal:** Build and test the new homepage at a separate route while keeping the current homepage live and stable.

### Route Structure
```tsx
// src/app/router.tsx
import AuthorHomepage from '../components/AuthorHomepage'           // Current production homepage
import UniversePortalHomepage from '../components/UniversePortalHomepage'  // New homepage (staging)

// PRODUCTION - Keep current homepage at root
<Route path="/" element={<AuthorHomepage />} />

// STAGING - New homepage at /homepage-v2
<Route path="/homepage-v2" element={<UniversePortalHomepage />} />
```

### Development & Testing Workflow

**Phase 6a: Build & Test (Week 1-2)**
1. ✅ New homepage lives at `/homepage-v2`
2. ✅ Current homepage stays at `/` untouched
3. ✅ Share `/homepage-v2` for feedback, testing, refinement
4. ✅ Iterate on design, content, features without affecting production

**Phase 6b: Admin Toggle (Optional)**
If you want a soft launch or A/B testing:
```sql
ALTER TABLE homepage_settings ADD COLUMN is_live BOOLEAN DEFAULT FALSE;
```

Then in router:
```tsx
const [useNewHomepage, setUseNewHomepage] = useState(false)

useEffect(() => {
  fetch('/api/homepage/settings')
    .then(res => res.json())
    .then(data => setUseNewHomepage(data.settings.is_live))
}, [])

<Route path="/" element={useNewHomepage ? <UniversePortalHomepage /> : <AuthorHomepage />} />
```

This lets you flip a switch in admin to enable the new homepage for all visitors.

**Phase 6c: Full Cutover (When Ready)**
When you're 100% confident:
```tsx
// Option 1: Simple swap (recommended)
<Route path="/" element={<UniversePortalHomepage />} />
<Route path="/homepage-classic" element={<AuthorHomepage />} />  // Archive old one

// Option 2: Delete old homepage entirely
<Route path="/" element={<UniversePortalHomepage />} />
// Remove AuthorHomepage.tsx from codebase
```

### Benefits of Staged Deployment
✅ **Zero downtime** - Production homepage never breaks
✅ **Safe iteration** - Test and refine without user impact
✅ **Easy rollback** - Just keep `/homepage-v2` route, never promote it
✅ **Stakeholder review** - Share `/homepage-v2` link for feedback
✅ **Progressive enhancement** - Can soft-launch with admin toggle

### Migration Checklist
- [ ] New homepage built and working at `/homepage-v2`
- [ ] All admin controls functional
- [ ] Mobile testing complete
- [ ] SEO metadata verified
- [ ] Performance benchmarks met (< 2s load)
- [ ] Cross-browser testing done
- [ ] User feedback collected
- [ ] Decision made: cutover or keep both
- [ ] If cutover: Update route and archive old homepage
- [ ] Monitor analytics post-launch

---

## Phase 7: Testing Checklist

### Visual
- [ ] Light theme renders correctly
- [ ] Dark theme renders correctly, smooth toggle
- [ ] Background images load and randomize
- [ ] Brand color applied to buttons, badges, links
- [ ] Glass-morphism effects visible (backdrop-blur)
- [ ] Responsive: 375px, 768px, 1024px, 1920px
- [ ] No layout shift (images have width/height)

### Functional
- [ ] `/api/homepage` returns complete data
- [ ] Featured story displays when set
- [ ] Stories grid populates from DB
- [ ] Activity feed shows recent items (sorted)
- [ ] Tools section links work
- [ ] Social icons link correctly
- [ ] Newsletter CTA opens correct URL
- [ ] Admin can edit all settings and see changes immediately
- [ ] Admin can add/edit/delete activity items
- [ ] Admin can add/edit/delete tools
- [ ] Admin can reorder tools (drag-drop)

### Performance
- [ ] Page load < 2s (3G)
- [ ] API cached (60s)
- [ ] Images lazy load
- [ ] Smooth 60fps animations

### SEO
- [ ] Meta tags populated
- [ ] OpenGraph works (test with sharing debugger)
- [ ] Twitter cards render
- [ ] Canonical URL set

---

## Implementation Order (Realistic Timeline)

### Day 1: Database & API (3-4 hours)
1. ✅ Create migration SQL file
2. ✅ Run migration, verify tables exist (won't affect current homepage)
3. ✅ Seed default data
4. ✅ Build `/api/homepage` GET endpoint
5. ✅ Test with Postman (verify JSON structure)
6. ✅ Build admin CRUD endpoints (settings, tools, activity)
7. ✅ Test all admin endpoints
8. ✅ Verify current homepage at `/` still works perfectly

### Day 2: Admin Interface (4-5 hours)
1. ✅ Create `HomepageManager.tsx` shell
2. ✅ Build Hero Settings tab (form inputs, dropdowns, toggles)
3. ✅ Build Activity Feed tab (table, add/edit/delete modals)
4. ✅ Build Tools tab (table, drag-reorder, add/edit/delete)
5. ✅ Add to UnifiedAdminDashboard navigation
6. ✅ Test all admin flows end-to-end

### Day 3: Frontend Component (5-6 hours)
1. ✅ Create `UniversePortalHomepage.tsx` from JSX template
2. ✅ Convert to TypeScript, add proper types
3. ✅ Integrate `/api/homepage` data fetching
4. ✅ Add theme support (light/dark mode)
5. ✅ Integrate dynamic background system
6. ✅ Apply brand color CSS variables
7. ✅ Build all sub-components (Navbar, Hero, Cards, etc.)
8. ✅ Add loading states, error handling
9. ✅ Make responsive (mobile-first)
10. ✅ Add route: `/homepage-v2` → `UniversePortalHomepage`
11. ✅ Verify `/` still points to old homepage

### Day 4: Polish & Testing (3-4 hours)
1. ✅ Test `/homepage-v2` in all browsers (Chrome, Firefox, Safari)
2. ✅ Mobile device testing (real devices)
3. ✅ Fix layout bugs, responsive issues
4. ✅ Performance audit (Lighthouse on `/homepage-v2`)
5. ✅ SEO check (meta tags, sharing preview)
6. ✅ Final QA with all features
7. ✅ Share `/homepage-v2` link for stakeholder review
8. ✅ Verify `/` (production) is still untouched and working

### Day 5: Deploy to Staging Route (1-2 hours)
1. ✅ Backup database
2. ✅ Run migration on production (new tables won't affect existing site)
3. ✅ Deploy code with new route: `/homepage-v2`
4. ✅ Verify `/` still shows old homepage (untouched)
5. ✅ Smoke test `/homepage-v2` functionality
6. ✅ Share `/homepage-v2` link for review

### Week 2+: Iterate & Refine (as needed)
1. ✅ Collect feedback on `/homepage-v2`
2. ✅ Make design/content adjustments
3. ✅ Fix any bugs found
4. ✅ Performance optimization
5. ✅ Final QA pass

### Cutover (When 100% Ready)
1. ✅ Decision: promote new homepage
2. ✅ Update router: `/` → UniversePortalHomepage
3. ✅ Archive old homepage: `/homepage-classic`
4. ✅ Monitor analytics and user feedback

**Total Development: 16-21 hours (solid weekend + 2-3 evenings)**
**Total Testing/Refinement: 1-2 weeks (as needed)**
**Cutover: 30 minutes (when ready)**

---

## Rollback Plan

### During Staging Phase (`/homepage-v2`)
- ✅ Production homepage at `/` is completely untouched
- ✅ If new homepage has bugs, just don't promote it
- ✅ Zero risk to production site

### After Cutover (if needed)
- ✅ Old homepage archived at `/homepage-classic`
- ✅ Emergency rollback: change 1 line in router (30 seconds)
- ✅ New DB tables don't affect old homepage (safe)
- ✅ Admin can disable sections via toggles (graceful degradation)

---

## Future Enhancements (Post-MVP)

### Analytics Tracking
Add simple click tracking for conversions:
```sql
CREATE TABLE homepage_clicks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  click_type ENUM('story', 'royalroad', 'patreon', 'newsletter', 'tool'),
  target_id INT,
  target_url VARCHAR(500),
  clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_type_date (click_type, clicked_at)
);
```

Track when users click:
- "Continue Reading on RoyalRoad"
- "Support on Patreon"
- "Join Newsletter"
- Story cards

This gives you real data on what's converting.

### Auto-Import Activity from Blog
Add admin button: "Create Activity from Blog Post #123"
- Auto-fills title, URL, published_at
- Type = 'blog'
- One click instead of manual entry

### RoyalRoad Integration (Long-term)
- Fetch latest chapter number via API
- Auto-update `latest_chapter_number` and `latest_chapter_title`
- Auto-create activity feed items for new chapters

---

## Pre-Implementation Questions

1. **Brand Color**: Stick with emerald (#10b981) or do you have a specific color in mind?
2. **Newsletter URL**: Do you have a newsletter service (Mailchimp, Substack, etc.) to link to?
3. **Featured Story**: Which story should be featured by default? (Or we can use `is_featured = true` flag)
4. **Story Order**: What order should stories appear in the grid? (We'll add display_order field)
5. **Activity Feed**: Manual entries only for now, or do you want auto-import from blog posts in v1?
6. **External Links**: Do you have RoyalRoad/Patreon URLs ready for your stories?

---

## Success Criteria

✅ Homepage loads in < 2s
✅ Clear value proposition visible in 3 seconds
✅ Users can navigate to any section in 1 click
✅ Admin can update all content without touching code
✅ Mobile experience is smooth and readable
✅ Design reflects professional author brand
✅ Light and dark themes both look polished

---

## Key Improvements from v1

❌ **Removed:** Overlap between `author_profiles` and `homepage_settings` hero fields
✅ **Fixed:** All hero copy lives in `homepage_settings` only

❌ **Removed:** Separate CRUD endpoint files
✅ **Fixed:** Simple REST endpoints, consistent naming

❌ **Removed:** Over-optimistic time estimates
✅ **Fixed:** Realistic 16-21 hour timeline

✅ **Added:** `type` enum to `activity_feed` for future auto-imports
✅ **Added:** `continue_url_*` fields to `stories` for external platform links
✅ **Added:** Simple caching and analytics tracking plan
✅ **Added:** Explicit fallback defaults in API for all settings fields
✅ **Added:** `display_order` to both `stories` and `homepage_tools` with indexes
✅ **Added:** `is_featured` flag to stories for easy featured story selection
✅ **Added:** Auto-select featured story from `is_featured = true` if not manually set

## Final Polish (v2.1 improvements)

1. **Index on `homepage_tools.display_order`** - Fast sorting when you have 10-20 tools
2. **Fallback defaults for all API fields** - Frontend never sees undefined values
3. **`is_featured` flag on stories** - Easy featured story selection in admin dropdown
4. **`display_order` on stories** - Manual control over story grid order (not alphabetical)
5. **Indexes on all `display_order` columns** - Performance optimization

This plan keeps the clean architecture but cuts the complexity. You get a professional portal without drowning in enterprise patterns.
