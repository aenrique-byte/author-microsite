# My Stories - Sample Microsite

This is a complete, ready-to-deploy microsite containing all the files needed to run the My Stories platform.

## What's Included

- **index.html** - Main application entry point
- **assets/** - Compiled CSS and JavaScript files
- **api/** - PHP backend for comments and likes
- **admin/** - Comment moderation panel
- **stories/** - Story content in Markdown format
- **images/** - Story covers and illustrations
- **icon/** - Favicon and app icons
- **.htaccess** - Apache configuration for routing

## Quick Setup

1. Upload all files to your web server
2. Create a MySQL database
3. Import the database schema from `database/schema.sql` (in the main project)
4. Create `.env` file in the `api/` folder with your database credentials:
   ```
   DB_HOST=localhost
   DB_NAME=your_database_name
   DB_USER=your_username
   DB_PASS=your_password
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your_secure_password
   ```
5. Set proper permissions on the `api/` folder (755 recommended)

## Features

- ✅ Story reading interface with chapters
- ✅ Comment system with moderation
- ✅ Like/heart system for chapters
- ✅ Admin panel for comment management
- ✅ IP banning for spam prevention
- ✅ Responsive design
- ✅ RSS feed for comments

## Admin Access

Visit `/admin/moderate.php` to access the comment moderation panel.

## Requirements

- PHP 7.4+ with PDO MySQL extension
- MySQL 5.7+ or MariaDB 10.2+
- Apache web server (for .htaccess support)

This is a complete, self-contained microsite that can be deployed anywhere that supports PHP and MySQL.
