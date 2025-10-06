# Live Deployment Guide for Author CMS

## 🚀 Quick Setup Steps

### Step 1: Upload Files to Your Server
1. Upload the entire `dist/` folder contents to your website root directory
2. The files should be accessible at `https://aenrique.com/`

### Step 2: Set Up the Database
1. **Access your cPanel or database management tool**
2. **Create the database tables** by running the SQL in `dist/api/schema.sql`
3. **Create the admin user** by accessing: `https://aenrique.com/api/create-admin.php`

### Step 3: Test the Login
1. Go to: `https://aenrique.com/admin`
2. Login with:
   - **Username:** `admin`
   - **Password:** `admin123`

---

## 📋 Detailed Instructions

### Database Setup (Option 1: cPanel)
1. **Login to your cPanel**
2. **Go to phpMyAdmin**
3. **Select database:** `aenriqu_author_cms`
4. **Import the schema:**
   - Click "Import" tab
   - Upload the file: `dist/api/schema.sql`
   - Click "Go"

### Database Setup (Option 2: Manual SQL)
If you prefer to run SQL manually, execute this in your database:

```sql
-- Copy the entire contents of dist/api/schema.sql and run it
-- This will create all the necessary tables
```

### Create Admin User
After setting up the database, visit this URL **once**:
```
https://aenrique.com/api/create-admin.php
```

This will create the admin user with:
- Username: `admin`
- Password: `admin123`

### File Structure on Your Server
```
aenrique.com/
├── index.html                 (Main homepage)
├── assets/                    (CSS and JS files)
├── api/                       (All PHP backend files)
│   ├── auth/                  (Login/logout)
│   ├── stories/               (Story management)
│   ├── chapters/              (Chapter management)
│   ├── admin/                 (Moderation tools)
│   ├── socials/               (Social media settings)
│   ├── author/                (Author profile)
│   ├── galleries/             (Gallery management)
│   ├── images/                (Image management)
│   ├── config.php             (Database settings)
│   ├── bootstrap.php          (Core functions)
│   ├── schema.sql             (Database structure)
│   └── create-admin.php       (Admin user creation)
└── .htaccess                  (URL routing)
```

---

## 🔧 Troubleshooting

### If Login Doesn't Work:
1. **Check database connection:**
   - Visit: `https://aenrique.com/api/test-connection.php`
   - Should show "Database connection successful"

2. **Verify admin user exists:**
   - Check your database for a `users` table
   - Should contain one user with username `admin`

3. **Check file permissions:**
   - Ensure PHP files are executable (755 or 644)
   - Ensure API directory is accessible

### If You Get 404 Errors:
1. **Check .htaccess file** is uploaded to root directory
2. **Verify mod_rewrite** is enabled on your server
3. **Check file paths** - all files should be in the root directory

### If Database Errors Occur:
1. **Verify database credentials** in `api/config.php`
2. **Check database exists:** `aenriqu_author_cms`
3. **Verify user permissions:** `aenriqu_authorsite` should have full access

---

## 🎯 What You'll Have After Setup

### Admin Features:
- **Author Profile Management** - Update bio, tagline, profile images
- **Social Media Manager** - Global social links across all sites
- **Story Manager** - Create stories with markdown file upload
- **Chapter Manager** - Upload .md files or write directly
- **Gallery Manager** - Image galleries with metadata
- **Moderation Tools** - Comment approval and IP banning

### URLs:
- **Homepage:** `https://aenrique.com/`
- **Admin Panel:** `https://aenrique.com/admin`
- **Stories:** `https://aenrique.com/stories`
- **Gallery:** `https://aenrique.com/gallery`

---

## 🔐 Security Notes

1. **Change the admin password** after first login
2. **Update JWT_SECRET** in `api/config.php` for production
3. **Set specific CORS_ORIGINS** instead of '*' in `api/config.php`
4. **Delete `api/create-admin.php`** after creating the admin user

---

## 📞 Need Help?

If you encounter any issues:
1. Check the browser console for JavaScript errors
2. Check your server's PHP error logs
3. Verify all files uploaded correctly
4. Ensure database credentials are correct

The system is fully built and ready - you just need to upload the files and set up the database!
