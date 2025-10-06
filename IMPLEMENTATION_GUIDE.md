# Simple Website Transfer Guide

## 🎯 Overview
This guide shows you exactly how to transfer this website to any domain in 5 simple steps.

## 🚀 Transfer Steps

### **Step 1: Create Database**
1. **Log into your hosting control panel** (cPanel, Plesk, etc.)
2. **Create a new MySQL database**
3. **Note down:**
   - Database name
   - Database username  
   - Database password
   - Database host (usually `localhost`)

### **Step 2: Import Database Schema**
1. **Open phpMyAdmin** from your hosting control panel
2. **Select your new database**
3. **Click "Import" tab**
4. **Choose file:** Upload `unified-schema.sql` (found in the `dist/` folder)
5. **Click "Go"** to import

✅ **Result:** Database now has all tables with generic defaults

### **Step 3: Configure Database Connection**
1. **Copy** `api/config.example.php` to `api/config.php`
2. **Edit** `api/config.php` with your database details:
   ```php
   define('DB_HOST', 'localhost');           // Your DB host
   define('DB_NAME', 'your_database_name');  // Your DB name
   define('DB_USER', 'your_db_username');    // Your DB username
   define('DB_PASS', 'your_db_password');    // Your DB password
   ```

### **Step 4: Upload Website Files**
1. **Build the website** (if not already built):
   ```bash
   npm run build
   ```
2. **Upload entire `dist/` folder contents** to your domain's web root via FTP:
   - Upload to: `public_html/` or `www/` or your domain's root folder
   - Include all files and folders from `dist/`
3. **Set permissions** on `api/uploads/` folder to `755` or `777`

### **Step 5: Admin Setup**
1. **Visit:** `https://yourdomain.com/admin`
2. **Login with default credentials:**
   - **Username:** `admin`
   - **Password:** `admin123`
3. **IMMEDIATELY change password** for security
4. **Configure your website:**
   - Author name, bio, tagline
   - Site domain (for SEO)
   - Social media links
   - Upload your stories and galleries

## ✅ **Verification**

### **Test These URLs:**
- `https://yourdomain.com/` - Should show homepage with "Author Name"
- `https://yourdomain.com/admin` - Should show admin login
- `https://yourdomain.com/galleries` - Should show empty galleries page
- `https://yourdomain.com/storytime` - Should show empty stories page

### **Success Indicators:**
- ✅ Website loads without errors
- ✅ Admin panel is accessible
- ✅ You can customize author information
- ✅ You can upload content through admin panel
- ✅ All pages show your configured content

## 🔧 **Troubleshooting**

### **Problem: Database Connection Error**
- **Check:** Database credentials in `api/config.php`
- **Verify:** Database exists and user has permissions

### **Problem: 404 Errors on Pages**
- **Check:** `.htaccess` file was uploaded
- **Verify:** Web server supports URL rewriting

### **Problem: Can't Access Admin**
- **Check:** `api/` folder was uploaded correctly
- **Verify:** PHP is working on your server

### **Problem: File Upload Errors**
- **Check:** `api/uploads/` folder permissions (755 or 777)
- **Verify:** PHP upload limits are sufficient

## 📋 **File Checklist**

### **Required Files in Web Root:**
```
yourdomain.com/
├── index.html (React app entry)
├── assets/ (JS and CSS bundles)
├── api/ (PHP backend)
├── .htaccess (URL routing)
├── icon/ (favicons)
└── images/ (static images)
```

### **Required Database Tables:**
- `users` (admin login)
- `author_profile` (your info)
- `socials` (social media links)
- `stories` & `chapters` (your content)
- `galleries` & `images` (your artwork)
- `site_config` (website settings)

## 🎉 **You're Done!**

The website is now fully transferred and ready to customize. Everything can be configured through the admin panel without touching any code.

**Default admin credentials:** `admin` / `admin123` (change immediately!)

---

*This website is now completely transferable to any domain and author.*
