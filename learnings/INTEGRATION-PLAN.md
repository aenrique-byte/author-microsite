# React Sites Integration Plan

## Overview
This document outlines the complete integration plan for unifying the three React+Vite sites:
1. **Author CMS** (main unified admin) - ✅ COMPLETE
2. **ImageManager** - 🔄 NEEDS INTEGRATION
3. **Storytime** - 🔄 NEEDS INTEGRATION

## Current Status

### ✅ Completed
- **Unified Admin Console**: Complete with authentication, breadcrumbs, password management
- **Unified Database Schema**: `aenriqu_author_cms` database with all tables
- **API Infrastructure**: Complete backend with all CRUD operations
- **Author Homepage**: Main landing page with social icons and navigation

### 🔄 Remaining Integration Tasks

## Phase 1: Database Migration

### 1.1 ImageManager Database Migration
**Status**: ⚠️ SCHEMA ALREADY UNIFIED - Need to migrate existing data
- ImageManager appears to already use the unified schema
- Need to verify existing data and ensure it's in the new database
- Migrate any existing galleries, images, comments, and likes

### 1.2 Storytime Database Migration  
**Status**: 🔴 SEPARATE DATABASE - Full migration needed
- **Source**: `my_stories_comments` database
- **Target**: `aenriqu_author_cms` database
- **Tables to migrate**:
  - `chapter_comments` → `chapter_comments` (with schema updates)
  - `chapter_likes` → `chapter_likes` (with schema updates)  
  - `admin_users` → `users` (merge with existing users)
  - `banned_ips` → `banned_ips` (merge with existing)

## Phase 2: Frontend Integration

### 2.1 ImageManager Frontend Integration
**Tasks**:
- [ ] Update API endpoints to use unified backend
- [ ] Integrate with unified authentication system
- [ ] Update social icons to use global database settings
- [ ] Ensure consistent styling with main site
- [ ] Add navigation links to other microsites
- [ ] Test gallery and image management functionality

### 2.2 Storytime Frontend Integration  
**Tasks**:
- [ ] Update API endpoints to use unified backend
- [ ] Integrate with unified authentication system
- [ ] Update social icons to use global database settings
- [ ] Ensure consistent styling with main site
- [ ] Add navigation links to other microsites
- [ ] Test story reading and commenting functionality

## Phase 3: Deployment & Configuration

### 3.1 Unified Deployment Structure
```
aenrique.com/
├── index.html (Author Homepage)
├── admin/ (Unified Admin Console)
├── galleries/ (ImageManager)
├── stories/ (Storytime)
└── api/ (Unified Backend)
```

### 3.2 Configuration Updates
- [ ] Update all sites to use same database connection
- [ ] Configure proper routing for all microsites
- [ ] Set up unified .htaccess for SPA routing
- [ ] Update social media links to be globally managed

## Phase 4: Testing & Validation

### 4.1 Functionality Testing
- [ ] Test admin console manages all sites
- [ ] Verify social media links propagate across all sites
- [ ] Test authentication works across all microsites
- [ ] Validate data integrity after migration
- [ ] Test comment moderation across all sites

### 4.2 User Experience Testing
- [ ] Verify consistent navigation between sites
- [ ] Test responsive design on all microsites
- [ ] Validate consistent branding and styling
- [ ] Test performance and loading times

## Technical Requirements

### Database Requirements
- MySQL database: `aenriqu_author_cms`
- User: `aenriqu_authorsite`
- Password: `R3N8#k@PdC$&`

### File Structure Requirements
- All sites must share the same `/api` folder
- Each microsite gets its own subdirectory
- Unified admin console accessible from `/admin`

### API Integration Requirements
- All sites use same authentication system
- Social media links fetched from global database
- Comments and moderation unified across all sites
- User management centralized in admin console

## Migration Script
See `migration-script.sql` for complete database migration commands.

## Deployment Guide
See `DEPLOYMENT-INTEGRATION.md` for step-by-step deployment instructions.

## Timeline Estimate
- **Phase 1 (Migration)**: 2-3 hours
- **Phase 2 (Frontend)**: 4-6 hours  
- **Phase 3 (Deployment)**: 1-2 hours
- **Phase 4 (Testing)**: 2-3 hours
- **Total**: 9-14 hours

## Risk Mitigation
- Backup all existing databases before migration
- Test migration on staging environment first
- Keep original sites as backup during transition
- Implement rollback plan if issues arise
