# Deployment Guide for Author CMS

## File Structure on Server

```
aenrique.com/
├── index.html (from dist/)
├── assets/ (from dist/)
├── images/ (from dist/ + your lofi_bg.png)
└── api/ (entire api folder)
    ├── config.php
    ├── bootstrap.php
    ├── schema.sql
    ├── test-connection.php
    ├── socials/get.php
    ├── author/get.php
    └── (all other API files)
```

## Deployment Steps

### 1. Upload React Frontend
- Copy ALL contents of `dist/` folder to web root
- This includes: index.html, assets/, images/

### 2. Upload PHP API
- Copy entire `api/` folder to web root
- Maintain folder structure exactly as shown

### 3. Create Database
- Create database: `aenriqu_author_cms`
- Run SQL from `api/schema.sql`

### 4. Test Deployment
- Homepage: https://aenrique.com/
- API Test: https://aenrique.com/api/test-connection.php
- Admin: https://aenrique.com/admin

## Important Notes
- API folder is separate from React build
- Both need to be uploaded to same web root
- Database must be created manually
