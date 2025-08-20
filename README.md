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

## To add a new story, all you need to do is edit the storiesmeta.md file and follow this formatting exactly:
```
# Story Title
BLURB: A short description of the story. This will appear on the homepage.

### stories/story-folder-name/
ID: unique-story-id
COVER: ./images/covers/cover-filename.jpg
FILENAME: Chapter-%i.md
BREAK: ./images/breaks/break-image.png
```
### Example Entries:
```
# Fractured Horizons
BLURB: When the crew of the Vultee Vengeance stumbles upon a rift in deep space, they hear faint transmissions from their own future selves. To survive, they must untangle the paradox of their destiny before the rift consumes both time and reality.

### stories/fractured-horizons-01/
ID: fractured-horizons
COVER: ./images/covers/fractured-horizons.jpg
FILENAME: chapter-%i.md
BREAK: ./images/breaks/scifi-break.png

---

# Letters in the Rain
BLURB: After a breakup she never truly understood, Clara begins finding anonymous letters left on her windowsill during rainy nights. Each one pulls her closer to a second chance at love... or a heartbreak she might never recover from.

### stories/letters-01/
ID: letters-01
COVER: ./images/covers/letters-in-the-rain.jpg
FILENAME: Chapter-%i.md
BREAK: ./images/breaks/romance-break.png

---

# Ashes of the Serpent King
BLURB: Long ago, the Serpent King ruled with fire and venom until he was struck down and buried beneath his cursed throne. Now the ashes stir again, and only one untested adventurer dares to claim the power hidden within the ruins.

### stories/ashes-of-the-serpent-king-01/
ID: ashes-01
COVER: ./images/covers/ashes-of-the-serpent-king.jpg
FILENAME: Chapter-%i.md
BREAK: ./images/breaks/fantasy-break.png
```

## Admin Access

Visit `/admin/moderate.php` to access the comment moderation panel.

## Requirements

- PHP 7.4+ with PDO MySQL extension
- MySQL 5.7+ or MariaDB 10.2+
- Apache web server (for .htaccess support)

This is a complete, self-contained microsite that can be deployed anywhere that supports PHP and MySQL.
