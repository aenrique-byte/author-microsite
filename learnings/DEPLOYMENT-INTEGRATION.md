# Unified CMS Deployment & Integration Guide

## Overview
This guide provides step-by-step instructions for integrating and deploying the three React+Vite sites into a unified CMS system.

## Prerequisites
- Access to your hosting control panel
- MySQL database access
- FTP/File Manager access
- Backup of existing sites and databases

## Phase 1: Database Migration

### Step 1: Backup Existing Databases
```sql
-- Create backups before migration
mysqldump -u username -p imagemanager_db > imagemanager_backup.sql
mysqldump -u username -p my_stories_comments > storytime_backup.sql
mysqldump -u username -p aenriqu_author_cms > unified_backup.sql
```

### Step 2: Run Migration Script
1. Access your MySQL database through phpMyAdmin or command line
2. Execute the `migration-script.sql` file
3. Verify migration success using the verification queries in the script

### Step 3: Verify Data Integrity
- Check that all tables have expected data counts
- Verify no orphaned records exist
- Test a few sample queries to ensure relationships are intact

## Phase 2: Frontend Integration

### Step 1: Update ImageManager Configuration

#### 1.1 Update API Configuration
Create/update `imagemanager/src/config.js`:
```javascript
export const API_BASE_URL = '/api'
export const SITE_CONFIG = {
  siteName: 'Image Galleries',
  parentSite: 'https://aenrique.com',
  adminUrl: '/admin'
}
```

#### 1.2 Update Social Icons Component
Replace hardcoded social links with API calls:
```javascript
// In imagemanager/src/components/SocialIcons.jsx
import { useState, useEffect } from 'react'

export default function SocialIcons() {
  const [socials, setSocials] = useState({})
  
  useEffect(() => {
    fetch('/api/socials/get.php')
      .then(res => res.json())
      .then(data => setSocials(data.socials || {}))
      .catch(err => console.error('Failed to load social links:', err))
  }, [])
  
  // Rest of component using dynamic socials data
}
```

#### 1.3 Add Navigation Links
Add links to other microsites in the header/navigation:
```javascript
// Add to imagemanager navigation
<nav>
  <a href="/">Home</a>
  <a href="/stories">Stories</a>
  <a href="/admin">Admin</a>
</nav>
```

### Step 2: Update Storytime Configuration

#### 2.1 Update API Configuration
Create/update `storytime/src/config.js`:
```javascript
export const API_BASE_URL = '/api'
export const SITE_CONFIG = {
  siteName: 'Stories',
  parentSite: 'https://aenrique.com',
  adminUrl: '/admin'
}
```

#### 2.2 Update API Endpoints
Update all API calls to use unified endpoints:
```javascript
// Old: /api/comments.php
// New: /api/chapters/list.php, /api/admin/comments/list.php

// Update comment fetching
const fetchComments = async (storyId, chapterId) => {
  const response = await fetch(`/api/chapters/list.php?story_id=${storyId}`)
  const data = await response.json()
  return data.chapters.find(c => c.chapter_number === chapterId)?.comments || []
}
```

#### 2.3 Update Social Icons
Same as ImageManager - replace hardcoded links with API calls.

#### 2.4 Add Navigation Links
Add links to other microsites in the header/navigation.

## Phase 3: Unified Deployment Structure

### Step 1: Prepare Deployment Directory
Create the following structure on your server:
```
public_html/
├── index.html (Author Homepage)
├── admin/ (Unified Admin Console)
├── galleries/ (ImageManager)
├── stories/ (Storytime)
├── api/ (Unified Backend)
└── .htaccess (Root routing)
```

### Step 2: Build All Sites
```bash
# Build Author CMS (main site)
cd author-cms
npm run build
cp -r dist/* /path/to/public_html/

# Build ImageManager
cd imagemanager
npm run build
cp -r dist/* /path/to/public_html/galleries/

# Build Storytime
cd storytime
npm run build
cp -r dist/* /path/to/public_html/stories/
```

### Step 3: Configure Root .htaccess
Create `/public_html/.htaccess`:
```apache
RewriteEngine On

# API routes - preserve as-is
RewriteRule ^api/ - [L]

# Admin routes - serve from main site
RewriteRule ^admin/(.*)$ /index.html [L]

# Gallery routes - serve from galleries subdirectory
RewriteRule ^galleries/(.*)$ /galleries/index.html [L]

# Story routes - serve from stories subdirectory  
RewriteRule ^stories/(.*)$ /stories/index.html [L]

# Default - serve main site
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]
```

### Step 4: Update Database Configuration
Ensure all sites use the same database configuration:
```php
// In api/config.php (shared by all sites)
$db_host = 'localhost';
$db_name = 'aenriqu_author_cms';
$db_user = 'aenriqu_authorsite';
$db_pass = 'R3N8#k@PdC$&';
```

## Phase 4: Testing & Validation

### Step 1: Functionality Testing
- [ ] Test main author homepage loads correctly
- [ ] Test admin console accessible at `/admin`
- [ ] Test image galleries accessible at `/galleries`
- [ ] Test stories accessible at `/stories`
- [ ] Test navigation between all sites works
- [ ] Test social media links are consistent across all sites
- [ ] Test admin console can manage all sites

### Step 2: Authentication Testing
- [ ] Test login works from admin console
- [ ] Test session persists across all microsites
- [ ] Test logout works properly
- [ ] Test password change functionality

### Step 3: Data Integrity Testing
- [ ] Test comments display correctly on stories
- [ ] Test likes work on both images and chapters
- [ ] Test moderation works from admin console
- [ ] Test banned IPs are enforced across all sites

### Step 4: Performance Testing
- [ ] Test page load times are acceptable
- [ ] Test API response times are reasonable
- [ ] Test database queries are optimized
- [ ] Test caching works properly

## Phase 5: Go-Live Checklist

### Pre-Launch
- [ ] All databases backed up
- [ ] All sites built and deployed
- [ ] All configurations updated
- [ ] All tests passed
- [ ] DNS/routing configured

### Launch
- [ ] Deploy all files to production
- [ ] Run migration script on production database
- [ ] Test all functionality on live site
- [ ] Monitor for any errors

### Post-Launch
- [ ] Monitor site performance
- [ ] Check error logs
- [ ] Verify analytics tracking
- [ ] Test user feedback/comments
- [ ] Document any issues and resolutions

## Rollback Plan

If issues arise during deployment:

1. **Database Rollback**: Restore from backup databases
2. **File Rollback**: Restore original site files
3. **DNS Rollback**: Revert any DNS changes
4. **Monitoring**: Monitor for stability after rollback

## Troubleshooting

### Common Issues

#### Database Connection Errors
- Verify database credentials in `api/config.php`
- Check database server is accessible
- Ensure database user has proper permissions

#### Routing Issues
- Check `.htaccess` files are properly configured
- Verify mod_rewrite is enabled on server
- Test individual routes manually

#### API Errors
- Check PHP error logs
- Verify API endpoints are accessible
- Test database queries manually

#### Authentication Issues
- Clear browser cookies/session data
- Check session configuration in PHP
- Verify user exists in database

### Support Contacts
- Hosting Support: [Your hosting provider]
- Database Issues: [Database administrator]
- Development Issues: [Development team]

## Maintenance

### Regular Tasks
- Monitor database performance
- Check error logs weekly
- Update social media links as needed
- Backup databases monthly
- Update admin passwords quarterly

### Updates
- Keep PHP and MySQL updated
- Monitor for security patches
- Update frontend dependencies as needed
- Test functionality after any updates

## Success Metrics

### Technical Metrics
- Page load time < 3 seconds
- API response time < 500ms
- Database query time < 100ms
- 99.9% uptime

### User Experience Metrics
- Consistent navigation across all sites
- Working social media links
- Functional comment system
- Effective admin management

### Business Metrics
- Increased user engagement
- Reduced maintenance overhead
- Improved content management efficiency
- Better SEO performance
