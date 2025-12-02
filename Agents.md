# Project Documentation for AI Agents

## Project Overview

**Author CMS** is a full-stack author website with content management system, built as a transferable, ready-to-deploy package. The project enables authors to publish stories, manage image galleries, track analytics, and engage with readers through comments and social media.

### Technology Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + Custom CSS
- **Backend:** PHP 8+ REST API
- **Database:** MySQL/MariaDB
- **Build System:** Vite with TypeScript compilation
- **Routing:** React Router DOM v6
- **State Management:** React Context API
- **Icons:** Lucide React
- **Charts:** Recharts
- **Markdown:** Marked.js with DOMPurify sanitization

### Project Structure

```
Website/
├── src/                        # Main React application source
│   ├── App.tsx                 # Root application component
│   ├── main.tsx                # Application entry point
│   ├── index.css               # Global styles
│   ├── app/                    # App-level modules
│   ├── components/             # Reusable UI components
│   ├── contexts/               # React Context providers
│   ├── features/               # Feature-specific modules
│   ├── lib/                    # Utility libraries
│   ├── styles/                 # Style modules
│   ├── types/                  # TypeScript type definitions
│   └── utils/                  # Utility functions
│
├── api/                        # PHP Backend API
│   ├── config.example.php      # Database config template
│   ├── bootstrap.php           # API initialization
│   ├── admin/                  # Admin-only endpoints
│   ├── auth/                   # Authentication system
│   ├── author/                 # Author profile management
│   ├── chapters/               # Story chapter CRUD
│   ├── collections/            # Story collections
│   ├── galleries/              # Image gallery management
│   ├── images/                 # Image upload & processing
│   ├── litrpg/                 # LitRPG game system
│   ├── schedules/              # Publishing schedules
│   ├── socials/                # Social media links
│   ├── stories/                # Story management
│   ├── analytics/              # Visitor tracking
│   ├── cron/                   # Scheduled tasks
│   ├── migrations/             # Database migrations
│   └── uploads/                # User-uploaded files
│
├── litrpg/                     # Standalone LitRPG game system
│   ├── App.tsx                 # LitRPG app root
│   ├── components/             # Game UI components
│   ├── types.ts                # Game type definitions
│   ├── *-constants.ts          # Game data constants
│   └── vite.config.ts          # Separate Vite config
│
├── public/                     # Static assets
│   ├── .htaccess               # Apache rewrite rules
│   ├── icon/                   # Favicons and app icons
│   └── images/                 # Static images
│
├── shared/                     # Shared components/utilities
│   ├── components/             # Shared React components
│   └── icons/                  # Shared icon components
│
├── scripts/                    # Build and utility scripts
│   └── postbuild-copy.mjs      # Post-build file copy
│
├── migrations/                 # Legacy migration files
├── learnings/                  # Documentation and notes
│
├── index.html                  # React app HTML template
├── vite.config.ts              # Main Vite configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Node dependencies
└── unified-schema.sql          # Complete database schema
```

## Core Systems

### 1. Authentication System (`api/auth/`)

**Purpose:** JWT-based authentication for admin access

**Files:**
- `login.php` - Admin login endpoint
- `logout.php` - Session termination
- `me.php` - Current user info
- `change-password.php` - Password updates

**Flow:**
1. User submits credentials to `/api/auth/login.php`
2. Server validates against `users` table
3. JWT token generated with `JWT_SECRET`
4. Token stored in localStorage
5. Protected routes verify token on each request

**Default Credentials:**
- Username: `admin`
- Password: `admin123` (must be changed immediately)

### 2. Story Management System

**Database Tables:**
- `stories` - Story metadata (title, description, cover, genres)
- `chapters` - Chapter content (markdown, word count, publish status)
- `story_external_links` - External platform links (Amazon, RoyalRoad, etc.)

**API Endpoints:**
- `api/stories/create.php` - Create new story
- `api/stories/update.php` - Update story details
- `api/stories/delete.php` - Remove story and chapters
- `api/stories/list.php` - List all stories
- `api/chapters/create.php` - Add chapter
- `api/chapters/update.php` - Edit chapter
- `api/chapters/delete.php` - Remove chapter
- `api/chapters/list.php` - List story chapters
- `api/chapters/bulk-publish.php` - Publish all chapters at once
- `api/chapters/bulk-upload.php` - Upload multiple chapters

**Features:**
- Markdown content support
- Word count tracking (persisted in database)
- Chapter ordering and numbering
- Draft/published status
- External platform links (Amazon, RoyalRoad, ScribbleHub, etc.)
- SEO-friendly URLs

### 3. Gallery System (`api/galleries/`, `api/images/`)

**Purpose:** Image upload, organization, and display with metadata

**Database Tables:**
- `galleries` - Gallery metadata
- `images` - Image files with metadata
- `image_comments` - User comments on images
- `image_likes` - Like tracking

**Key Features:**
- Multi-file upload support
- Automatic thumbnail generation
- PNG metadata extraction (chunk-text)
- Rating system (PG/X content)
- Gallery and per-image comments
- Like/reaction system
- Image reordering

**API Endpoints:**
- `api/galleries/create.php`
- `api/images/gallery-upload.php`
- `api/images/extract-metadata.php`
- `api/images/gallery-comment-create.php`
- `api/images/gallery-like.php`

### 4. Analytics System (`api/analytics/`)

**Purpose:** Privacy-focused visitor tracking without personal data

**Database Tables:**
- `analytics_events` - Page views and interactions
- `rate_limit` - Request throttling

**Implementation:**
- Fingerprint-based tracking (hashed with `ANALYTICS_SALT`)
- No cookies or personal data storage
- Tracks: page views, story reads, gallery views, chapter progression
- Aggregated statistics in admin dashboard

**Endpoints:**
- `api/analytics/ingest.php` - Record events

### 5. Admin Panel System

**Frontend Routes:**
- `/admin` - Admin dashboard
- `/admin/stories` - Story manager
- `/admin/galleries` - Gallery manager
- `/admin/author` - Author profile editor
- `/admin/socials` - Social media links
- `/admin/uploads` - File upload interface
- `/admin/analytics` - Analytics dashboard
- `/admin/moderation` - Comment moderation
- `/admin/password` - Change password

**Protected Routes:**
- All `/admin/*` routes require valid JWT token
- Token verified via `api/auth/me.php`
- Redirects to login if unauthorized

### 6. LitRPG Game System (`litrpg/`)

**Purpose:** Standalone React app for tabletop RPG character/monster management

**Features:**
- Character sheet builder
- Monster manual
- Ability library
- Loot catalog
- Battle simulator
- Quest system
- Attribute encyclopedia

**Data Structure:**
- Stored in PHP backend (`api/litrpg/` endpoints)
- Exported to TypeScript constants via `export-to-constants.php`
- Separate React app with own build process
- Uses Google Gemini AI integration

**Database Tables:**
- `litrpg_classes` - Character classes
- `litrpg_abilities` - Skills and spells
- `litrpg_monsters` - Creature stats
- `litrpg_items` - Equipment and loot
- `litrpg_characters` - Saved characters
- `litrpg_professions` - Crafting professions
- `litrpg_contracts` - Quest system

### 7. Scheduled Publishing System

**Purpose:** Automate chapter releases on a schedule

**Database Tables:**
- `publish_schedules` - Schedule configurations
- `scheduled_chapters` - Calculated publish times

**Workflow:**
1. Admin creates schedule (frequency, time, days)
2. Cron job (`api/cron/calculate-publish-schedule.php`) calculates next publish times
3. Another cron job (`api/cron/publish-scheduled-chapters.php`) publishes chapters
4. Cleanup cron (`api/cron/cleanup-rate-limits.php`) maintains database

**API Endpoints:**
- `api/schedules/create.php`
- `api/schedules/update.php`
- `api/schedules/delete.php`
- `api/schedules/list.php`

### 8. Comment Moderation System

**Purpose:** User comments with admin approval workflow

**Database Tables:**
- `comments` - Chapter comments
- `image_comments` - Gallery comments
- `banned_ips` - IP blacklist

**Features:**
- All comments default to pending status
- Admin can approve/reject/delete
- IP banning capability
- Rate limiting per IP
- Spam prevention

**Admin Endpoints:**
- `api/admin/comments/` - Moderation actions
- `api/admin/ban-ip.php` - Ban management
- `api/admin/unban-ip.php` - Remove bans

## Build and Deployment

### Development Workflow

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Build Process

1. **TypeScript Compilation:** `tsc -b` compiles all `.ts` and `.tsx` files
2. **Vite Bundling:** Creates optimized bundles in `dist/`
3. **Post-build Script:** `scripts/postbuild-copy.mjs` copies API files
4. **Output Structure:**
   ```
   dist/
   ├── index.html         # React app entry
   ├── assets/            # JS/CSS bundles
   ├── api/               # PHP backend (copied)
   ├── icon/              # Favicons (copied)
   ├── images/            # Static images (copied)
   └── .htaccess          # URL rewriting
   ```

### Deployment

**Requirements:**
- PHP 8.0+ with extensions: `pdo_mysql`, `json`, `gd`/`imagick`, `curl`, `mbstring`
- MySQL 5.7+ or MariaDB 10.2+
- Apache with `mod_rewrite` or Nginx with URL rewriting

**Steps:**
1. Create MySQL database
2. Import `unified-schema.sql`
3. Copy `api/config.example.php` → `api/config.php`
4. Configure database credentials and secrets
5. Upload `dist/` contents to web root
6. Set permissions: `api/uploads/` to 755/777
7. Login to `/admin` with default credentials
8. Change password immediately

## Database Schema Overview

### Core Tables

- **users** - Admin accounts (JWT authentication)
- **author_profile** - Single-row author info (name, bio, images)
- **socials** - Social media links (Twitter, Instagram, etc.)
- **site_config** - Global site settings

### Content Tables

- **stories** - Story metadata and SEO
- **chapters** - Chapter content (markdown)
- **story_external_links** - Platform links (Amazon, RR, etc.)
- **galleries** - Image collection metadata
- **images** - Uploaded images with metadata
- **collections** - Story groupings

### Engagement Tables

- **comments** - Chapter comments (moderated)
- **image_comments** - Gallery comments
- **likes** - Chapter likes
- **image_likes** - Image likes
- **analytics_events** - Visitor tracking

### LitRPG Tables

- **litrpg_classes** - Character classes with stats
- **litrpg_abilities** - Skills, spells, and talents
- **litrpg_monsters** - Creature database
- **litrpg_items** - Equipment and loot
- **litrpg_characters** - Player characters
- **litrpg_professions** - Crafting systems
- **litrpg_contracts** - Quest system

### System Tables

- **rate_limit** - Request throttling
- **banned_ips** - IP blacklist
- **publish_schedules** - Publishing automation
- **scheduled_chapters** - Calculated publish times

## Configuration Files

### `api/config.php`

**Critical Settings:**
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'database_name');
define('DB_USER', 'db_username');
define('DB_PASS', 'db_password');
define('CORS_ORIGINS', 'yourdomain.com'); // Must match exactly!
define('JWT_SECRET', 'long-random-string'); // Change from default
define('ANALYTICS_SALT', 'another-random-string'); // Change from default
```

### `vite.config.ts`

**Build Configuration:**
- Entry point: `index.html`
- Output: `dist/`
- React plugin with fast refresh
- Asset optimization

### `tailwind.config.js`

**Theme Customization:**
- Custom color palette
- Typography plugin
- Responsive breakpoints
- Dark mode support (class-based)

## Security Considerations

### Authentication
- JWT tokens with configurable expiration
- Password hashing (PHP `password_hash()`)
- Secure HTTP-only cookies option
- CORS origin validation

### File Uploads
- Whitelist extensions: jpg, jpeg, png, webp, gif
- File size limits enforced
- Unique filename generation
- Upload directory outside webroot option

### Rate Limiting
- IP-based request throttling
- Configurable time windows
- Automatic cleanup via cron

### SQL Injection Prevention
- Prepared statements throughout
- PDO parameter binding
- Input validation and sanitization

### XSS Protection
- DOMPurify for markdown rendering
- React's built-in escaping
- CSP headers recommended

### CSRF Protection
- JWT token validation
- Origin checking
- State-changing endpoints require auth

## Frontend Architecture

### Routing Structure

```
/ - Homepage (author profile)
/storytime - Stories list
/storytime/:slug - Individual story
/storytime/:storySlug/:chapterSlug - Chapter reader
/galleries - Gallery grid
/galleries/:slug - Individual gallery
/admin - Admin dashboard (protected)
/admin/* - Admin sub-pages (protected)
/litrpg - LitRPG game system
```

### State Management

**Contexts:**
- `AuthContext` - User authentication state
- `ThemeContext` - Dark/light mode toggle
- Other feature-specific contexts in `src/contexts/`

**Data Fetching:**
- Direct fetch API calls to PHP endpoints
- No external state management library
- Local state for component data

### Component Organization

**Pattern:**
```
src/
├── components/        # Shared UI components
│   ├── Button.tsx
│   ├── Modal.tsx
│   └── Layout.tsx
│
├── features/          # Feature-specific modules
│   ├── stories/
│   │   ├── StoryCard.tsx
│   │   ├── ChapterReader.tsx
│   │   └── useStories.tsx
│   └── galleries/
│       ├── GalleryGrid.tsx
│       └── ImageViewer.tsx
│
└── app/              # App-level configs
    └── router.tsx
```

## API Endpoint Patterns

### Standard Response Format

```json
{
  "success": true,
  "data": { /* payload */ },
  "message": "Optional message"
}
```

### Error Response Format

```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE"
}
```

### Authentication Flow

**Headers Required:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Protected Endpoints:**
- All `/api/admin/*`
- All `/api/author/*` (except GET)
- All `/api/stories/*` (except list/view)
- All `/api/chapters/*` (except list/view)

## Development Guidelines for AI Agents

### When Working with This Project

1. **Database Changes:**
   - Add migration SQL files to `api/migrations/`
   - Document schema changes
   - Update `unified-schema.sql` if needed

2. **API Endpoints:**
   - Follow RESTful conventions
   - Include error handling
   - Use prepared statements
   - Return consistent JSON format
   - Add CORS headers via bootstrap.php

3. **React Components:**
   - Use TypeScript for type safety
   - Follow existing component patterns
   - Utilize Tailwind for styling
   - Keep components focused and reusable

4. **File Uploads:**
   - Validate file types and sizes
   - Generate unique filenames
   - Store in `api/uploads/`
   - Return accessible URLs

5. **Security First:**
   - Never commit `api/config.php`
   - Validate all inputs
   - Sanitize outputs
   - Use parameterized queries
   - Require auth for sensitive operations

6. **Testing Changes:**
   - Test in development mode (`npm run dev`)
   - Build and test production bundle
   - Verify API endpoints with tools like Postman
   - Check browser console for errors
   - Test mobile responsiveness

### Common Tasks

**Adding a New API Endpoint:**
```php
<?php
require_once '../bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Your logic here
$data = json_decode(file_get_contents('php://input'), true);

// Return response
echo json_encode([
    'success' => true,
    'data' => $result
]);
```

**Adding a New React Page:**
```tsx
// src/features/myfeature/MyPage.tsx
import { useState, useEffect } from 'react';

export default function MyPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/my-endpoint.php')
      .then(res => res.json())
      .then(setData);
  }, []);

  return (
    <div className="container mx-auto p-4">
      {/* Your content */}
    </div>
  );
}
```

**Adding a Database Table:**
```sql
-- api/migrations/YYYY-MM-DD-description.sql
CREATE TABLE IF NOT EXISTS my_table (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Troubleshooting for AI Agents

### Common Issues

**1. CORS Errors:**
- Verify `CORS_ORIGINS` in `api/config.php` matches domain exactly
- Check for typos (www vs non-www, underscores, etc.)
- Ensure bootstrap.php is included in all API files

**2. Database Connection Failures:**
- Verify credentials in `api/config.php`
- Check MySQL service is running
- Ensure database exists and user has permissions

**3. 404 on Routes:**
- Verify `.htaccess` is present in web root
- Check `mod_rewrite` is enabled (Apache)
- Ensure Nginx rewrite rules are configured

**4. Build Errors:**
- Clear `node_modules/` and reinstall
- Check TypeScript errors: `npm run build`
- Verify all imports are correct

**5. File Upload Issues:**
- Check `api/uploads/` permissions (755 or 777)
- Verify PHP upload settings (upload_max_filesize, post_max_size)
- Ensure sufficient disk space

## Project Conventions

### Naming Conventions
- **PHP Files:** `kebab-case.php` (e.g., `bulk-publish.php`)
- **React Components:** `PascalCase.tsx` (e.g., `StoryCard.tsx`)
- **TypeScript Files:** `camelCase.ts` (e.g., `useAuth.ts`)
- **CSS Classes:** Tailwind utilities + `kebab-case` custom classes
- **Database Tables:** `snake_case` (e.g., `story_external_links`)

### Code Style
- **Indentation:** 2 spaces
- **Quotes:** Single quotes in TypeScript, double in PHP
- **Semicolons:** Required in TypeScript
- **Comments:** Explain "why", not "what"

### Git Workflow
- Commit messages: Imperative mood ("Add feature" not "Added feature")
- Branch naming: `feature/description` or `fix/description`
- Keep commits focused and atomic

## Documentation Files

- **README.md** - User-facing setup and deployment guide
- **SETUP.md** - Detailed technical setup instructions
- **DROP_CAP_FEATURE.md** - Drop cap typography feature docs
- **SCHEDULED_PUBLISHING.md** - Publishing automation system
- **SCHEDULE_SYSTEM.md** - Schedule implementation details
- **LITRPG_PHASE2_PLAN.md** - LitRPG feature roadmap
- **seo_plan.md** - SEO optimization strategy
- **api/migrations/README.md** - Database migration guide
- **litrpg/README.md** - LitRPG standalone app guide

## External Dependencies

### NPM Packages
- `react` / `react-dom` - UI framework
- `react-router-dom` - Client-side routing
- `lucide-react` - Icon library
- `marked` - Markdown parsing
- `dompurify` - XSS sanitization
- `recharts` - Analytics charts
- `@google/genai` - AI integration (LitRPG)

### PHP Extensions
- `pdo_mysql` - Database connectivity
- `json` - JSON encoding/decoding
- `gd` or `imagick` - Image processing
- `curl` - HTTP requests
- `mbstring` - Multi-byte strings
- `openssl` - Encryption

## Performance Considerations

### Frontend Optimization
- Vite's code splitting and tree shaking
- Lazy loading for routes
- Image optimization (WebP format)
- Tailwind CSS purging

### Backend Optimization
- Database indexes on frequently queried columns
- Prepared statement caching
- Response compression (gzip)
- Static file caching via .htaccess

### Database Optimization
- Indexes on foreign keys
- Composite indexes for common queries
- Regular cleanup of analytics data
- InnoDB engine for transaction support

## Conclusion

This project is a complete, production-ready author website platform with robust content management, analytics, and engagement features. The architecture separates concerns between a React frontend and PHP backend, with clear API boundaries and a well-structured database schema.

For AI agents working with this codebase, the key is to:
1. Understand the separation of concerns (React UI, PHP API, MySQL data)
2. Follow existing patterns and conventions
3. Prioritize security and data validation
4. Test changes thoroughly before deployment
5. Document significant changes

The project is designed to be transferable and deployable on any standard LAMP/LEMP stack, making it accessible to users with varying technical expertise.
