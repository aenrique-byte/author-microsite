# Author CMS - Transferable Website

A complete author website with content management system, built with React and PHP. Features story publishing, image galleries, analytics, and a full admin panel.

## 🚀 Quick Deploy

This is a **ready-to-deploy** website package. Follow these 5 simple steps to get it running on any domain:

### **Step 1: Create Database**
1. Log into your hosting control panel (cPanel, Plesk, etc.)
2. Create a new MySQL database
3. Note down your database credentials:
   - Database name
   - Database username
   - Database password
   - Database host (usually `localhost`)

### **Step 2: Import Database Schema**
1. Open phpMyAdmin from your hosting control panel
2. Select your new database
3. Click "Import" tab
4. Upload `unified-schema.sql` (included in this package)
5. Click "Go" to import

### **Step 3: Configure Database Connection**
1. Copy `api/config.example.php` to `api/config.php`
2. Edit `api/config.php` with your database details:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'your_database_name');
   define('DB_USER', 'your_db_username');
   define('DB_PASS', 'your_db_password');
   
   // IMPORTANT: Set CORS to your actual domain!
   define('CORS_ORIGINS', 'yourdomain.com'); // Example: 'larkdevon.com'
   
   // Security settings - change these!
   define('JWT_SECRET', 'your-unique-secret-key-change-this');
   define('ANALYTICS_SALT', 'your-analytics-salt-change-this');
   ```

### **Step 4: Upload Files**
1. Upload **all files and folders** from this package to your domain's web root
2. Upload to: `public_html/` or `www/` or your domain's root folder
3. Set permissions on `api/uploads/` folder to `755` or `777`

### **Step 5: Admin Setup**
1. Visit: `https://yourdomain.com/admin`
2. Login with default credentials:
   - **Username:** `admin`
   - **Password:** `admin123`
3. **IMMEDIATELY change password** for security
4. Configure your website through the admin panel

## 🎨 Admin Panel Setup Guide

### **Social Media Setup**
1. **Go to Admin Panel** → **Social Media Manager**
2. **Add your social links:**
   - Twitter: `https://twitter.com/yourusername`
   - Instagram: `https://instagram.com/yourusername`
   - Facebook: `https://facebook.com/yourpage`
   - YouTube: `https://youtube.com/@yourchannel`
   - Discord: `https://discord.gg/yourinvite`
   - Patreon: `https://patreon.com/yourusername`
   - Website: `https://yourwebsite.com`
   - GitHub: `https://github.com/yourusername`
   - TikTok: `https://tiktok.com/@yourusername`
   - Vimeo: `https://vimeo.com/yourusername`
3. **Save changes**

### **Background Images Setup**
1. **Go to Admin Panel** → **Upload Manager**
2. **Click "General" tab**
3. **Upload your background image** (recommended: 1920x1080px or larger)
4. **Click on the uploaded image** to copy its URL
5. **Go to Author Profile Manager**
6. **Paste the image URL** into:
   - **Background Image:** Main background
   - **Background Image Light:** Light theme background (optional)
   - **Background Image Dark:** Dark theme background (optional)
7. **Save profile changes**

### **Author Profile Setup**
1. **Go to Admin Panel** → **Author Profile Manager**
2. **Configure your information:**
   - **Name:** Your author name
   - **Bio:** Short description (e.g., "Fantasy & Sci-Fi Author")
   - **Tagline:** Catchy phrase (e.g., "Worlds of adventure and magic")
   - **Site Domain:** Your domain name (for SEO)
   - **Profile Image:** Upload through Upload Manager → General, then paste URL
   - **Background Images:** Follow background setup steps above
3. **Save changes**

### **Content Creation**
1. **Stories:**
   - Go to **Story Manager** → **Create New Story**
   - Add title, description, genres, keywords
   - Upload cover image through Upload Manager
   - Create chapters with markdown content

2. **Galleries:**
   - Go to **Gallery Manager** → **Create New Gallery**
   - Add title, description, rating (PG/X)
   - Upload images through Upload Manager
   - Add metadata and organize images

## ✅ Verification

After deployment, test these URLs:
- `https://yourdomain.com/` - Homepage
- `https://yourdomain.com/admin` - Admin panel
- `https://yourdomain.com/galleries` - Galleries
- `https://yourdomain.com/storytime` - Stories

## 📁 Package Contents

```
dist/
├── unified-schema.sql          # Database schema
├── index.html                  # React app entry point
├── .htaccess                   # URL rewriting rules
├── assets/                     # JavaScript and CSS bundles
├── api/                        # PHP backend
│   ├── config.example.php      # Database config template
│   ├── admin/                  # Admin endpoints
│   ├── auth/                   # Authentication
│   ├── author/                 # Author management
│   ├── chapters/               # Story chapters
│   ├── galleries/              # Image galleries
│   ├── images/                 # Image management
│   ├── socials/                # Social media
│   ├── stories/                # Story management
│   └── uploads/                # File uploads
├── icon/                       # Favicons
└── images/                     # Static images
```

## 🎨 Features

### **Content Management**
- ✅ Story publishing with chapters
- ✅ Image galleries with metadata
- ✅ Author profile management
- ✅ Social media integration
- ✅ SEO optimization

### **Admin Panel**
- ✅ Complete content management
- ✅ Analytics dashboard
- ✅ Comment moderation
- ✅ User management
- ✅ File upload system

### **Technical Features**
- ✅ Responsive design (mobile-friendly)
- ✅ Dark/light theme toggle
- ✅ Advanced analytics tracking
- ✅ Comment system with moderation
- ✅ Like/reaction system
- ✅ SEO-optimized URLs
- ✅ Dynamic sitemap generation

## 🔧 Configuration

### **Security Settings**
After deployment, update these in `api/config.php`:

```php
// Change these for security!
define('JWT_SECRET', 'your-unique-secret-key-change-this');
define('ANALYTICS_SALT', 'your-analytics-salt-change-this');
define('CORS_ORIGINS', 'yourdomain.com'); // Your domain
```

### **Admin Panel Features**
- **Author Profile Manager:** Configure your author information
- **Story Manager:** Create and manage story series
- **Gallery Manager:** Upload and organize image collections
- **Social Media Manager:** Configure social media links
- **Upload Manager:** Handle file uploads and organization
- **Analytics Manager:** View visitor statistics
- **Comment Moderation:** Approve/reject reader comments
- **Password Manager:** Change admin credentials

## 🛠️ Troubleshooting

### **Database Connection Error**
- Check database credentials in `api/config.php`
- Verify database exists and user has permissions

### **404 Errors on Pages**
- Ensure `.htaccess` file was uploaded
- Verify web server supports URL rewriting

### **Can't Access Admin**
- Check that `api/` folder was uploaded correctly
- Verify PHP is working on your server

### **File Upload Errors**
- Set `api/uploads/` folder permissions to `755` or `777`
- Check PHP upload limits in hosting settings

### **Network Error / Login Issues**
- **Default credentials:** `admin` / `admin123`
- **Network Error during login:** Check CORS setting in `api/config.php`
  ```php
  // Make sure this matches your ACTUAL domain (no typos!)
  define('CORS_ORIGINS', 'yourdomain.com'); // Example: 'larkdevon.com'
  ```
- **Common CORS mistakes:**
  - `lark_devon.com` vs `larkdevon.com` (underscore vs no underscore)
  - `www.yourdomain.com` vs `yourdomain.com` (www vs no www)
  - Wrong protocol: `http://` vs `https://`
- **Quick test:** Temporarily set `define('CORS_ORIGINS', '*');` to confirm CORS is the issue
- **If login still fails:** Re-import `unified-schema.sql` and check browser console for API errors

## 📋 System Requirements

### **PHP Requirements**
- **PHP Version:** 8.0 or higher (8.1+ recommended)
- **Required PHP Extensions:**
  - `pdo_mysql` - Database connectivity
  - `json` - JSON data handling
  - `gd` or `imagick` - Image processing and thumbnails
  - `curl` - External API requests
  - `mbstring` - Multi-byte string handling
  - `openssl` - Secure connections and encryption
  - `fileinfo` - File type detection
  - `zip` - Archive handling (optional)
- **PHP Configuration:**
  - `upload_max_filesize` ≥ 10MB (for image uploads)
  - `post_max_size` ≥ 12MB
  - `max_execution_time` ≥ 30 seconds
  - `memory_limit` ≥ 128MB (256MB recommended)
  - `allow_url_fopen` = On (for external requests)

### **Database Requirements**
- **MySQL 5.7+** or **MariaDB 10.2+**
- **Database Features:**
  - InnoDB storage engine support
  - UTF8MB4 character set support
  - Foreign key constraints
  - JSON data type support (MySQL 5.7+)
- **Recommended Settings:**
  - `max_allowed_packet` ≥ 16MB
  - `innodb_file_per_table` = ON

### **Web Server Requirements**
- **Apache 2.4+** with modules:
  - `mod_rewrite` (required for clean URLs)
  - `mod_headers` (for CORS and security headers)
  - `mod_ssl` (recommended for HTTPS)
- **OR Nginx 1.18+** with:
  - URL rewriting support
  - PHP-FPM integration
- **File Permissions:**
  - Web root: 755
  - PHP files: 644
  - Upload directory: 755 or 777
  - Config files: 600 (recommended)

### **Hosting Compatibility**

#### **✅ Shared Hosting**
- **cPanel/WHM** - Fully supported
- **Plesk** - Fully supported
- **DirectAdmin** - Supported
- **Requirements:** PHP 8.0+, MySQL access, .htaccess support

#### **✅ VPS/Dedicated Servers**
- **Linux distributions:** Ubuntu 20.04+, CentOS 8+, Debian 11+
- **Control panels:** cPanel, Plesk, Webmin, or command line
- **Full root access** for optimal configuration

#### **✅ Cloud Hosting**
- **AWS:** EC2, Lightsail, Elastic Beanstalk
- **DigitalOcean:** Droplets, App Platform
- **Google Cloud:** Compute Engine, App Engine
- **Azure:** Virtual Machines, App Service
- **Cloudflare Pages** (with Workers for API)

#### **✅ Managed WordPress Hosting**
- Most managed hosts support custom PHP applications
- May require subdomain or subdirectory installation

### **Performance Recommendations**

#### **Minimum Specifications**
- **CPU:** 1 core, 1GHz
- **RAM:** 512MB available for PHP
- **Storage:** 1GB free space
- **Bandwidth:** 10GB/month

#### **Recommended Specifications**
- **CPU:** 2+ cores, 2GHz+
- **RAM:** 2GB+ available for PHP
- **Storage:** 5GB+ free space (SSD preferred)
- **Bandwidth:** 50GB+/month

#### **High-Traffic Specifications**
- **CPU:** 4+ cores, 3GHz+
- **RAM:** 4GB+ available for PHP
- **Storage:** 10GB+ SSD
- **CDN:** Cloudflare or similar
- **Caching:** Redis or Memcached (optional)

### **Browser Compatibility**
- **Modern browsers:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile browsers:** iOS Safari 14+, Chrome Mobile 90+
- **JavaScript:** ES6+ support required
- **CSS:** Grid and Flexbox support required

### **Development Environment**
- **Node.js 18+** (for building frontend)
- **npm 8+** or **yarn 1.22+**
- **Git** (for version control)
- **Code editor** with PHP and React support

## 🔒 Security

### **Default Credentials**
- **Username:** `admin`
- **Password:** `admin123`
- **⚠️ CHANGE IMMEDIATELY** after first login

### **Security Checklist**
- [ ] Change default admin password
- [ ] Update JWT_SECRET in config.php
- [ ] Set CORS_ORIGINS to your domain
- [ ] Set proper file permissions
- [ ] Enable HTTPS on your domain

## 🌟 Customization

This website is fully customizable through the admin panel:
- **Author Information:** Name, bio, tagline, profile image
- **Branding:** Background images, color themes
- **Content:** Stories, chapters, galleries, images
- **Social Media:** All major platforms supported
- **SEO:** Meta descriptions, keywords, structured data

## 📞 Support

This is a complete, self-contained website package. All functionality is included and ready to use.

### **File Structure**
- Frontend: React SPA with routing
- Backend: PHP REST API
- Database: MySQL with full schema
- Assets: Optimized bundles and static files

---

## 🎉 You're Ready!

This package contains everything needed for a professional author website. Simply follow the 5-step deployment process above, and you'll have a fully functional website with content management capabilities.

**Default admin credentials:** `admin` / `admin123` (change immediately!)

**Happy publishing!** 📚✨
