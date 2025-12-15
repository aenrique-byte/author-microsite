# Deployment Guide - Shoutout Manager with MySQL

This guide will help you deploy your Shoutout Manager application to your shared hosting server with MySQL database.

## Prerequisites

- Shared hosting server with PHP and MySQL support
- Database: `u473142779_authorsite2`
- Database user: `u473142779_author_user2`
- FTP/SFTP access to your server

## Step 1: Set Up MySQL Database

1. **Run the SQL schema** on your MySQL database:
   - Log into your hosting control panel (cPanel, Plesk, etc.)
   - Open phpMyAdmin
   - Select database `u473142779_authorsite2`
   - Go to the SQL tab
   - Copy and paste the contents of `mysql_schema.sql`
   - Click "Go" to execute

2. **Verify tables were created:**
   - You should see these new tables:
     - `shoutout_config`
     - `shoutout_stories`
     - `shoutout_admin_shoutouts`
     - `shoutout_availability`
     - `shoutout_bookings`
   - The `users` table should already exist for admin authentication

## Step 2: Build the React Application

On your local machine:

```bash
# Install dependencies
npm install

# Build the production version
npm run build
```

This creates a `dist` folder with your compiled React application.

## Step 3: Upload Files to Server

Upload the following to your server via FTP/SFTP:

### Upload to your web root (e.g., `public_html` or `www`):
- All files from the `dist` folder (index.html, assets/, etc.)

### Upload the `api` folder to your web root:
- `api/config.php`
- `api/config.endpoint.php`
- `api/stories.endpoint.php`
- `api/shoutouts.endpoint.php`
- `api/availability.endpoint.php`
- `api/bookings.endpoint.php`
- `api/.htaccess`

Your server structure should look like:
```
public_html/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── api/
    ├── .htaccess
    ├── config.php
    ├── config.endpoint.php
    ├── stories.endpoint.php
    ├── shoutouts.endpoint.php
    ├── availability.endpoint.php
    └── bookings.endpoint.php
```

## Step 4: Configure API Base URL

If your site is at a subdomain or subfolder, update the API_BASE_URL in `services/api-db.ts`:

```typescript
// For root domain: https://yourdomain.com
const API_BASE_URL = '/api';

// For subdomain: https://shoutout.yourdomain.com
const API_BASE_URL = '/api';

// For subfolder: https://yourdomain.com/shoutout
const API_BASE_URL = '/shoutout/api';
```

Then rebuild and re-upload the `dist` folder.

## Step 5: Test the Application

1. **Visit your site** in a browser
2. **Check the public page** loads and shows the calendar
3. **Click "Admin Login"** and verify you can access the admin panel
4. **Test creating a story** in the Stories tab
5. **Test setting availability** in the Calendar tab
6. **Test creating a booking** from the public page

## Troubleshooting

### Database Connection Errors

If you see "Database connection failed":
- Verify database credentials in `api/config.php`
- Check that your hosting allows connections to localhost
- Ensure the database user has proper permissions

### API Not Found (404 Errors)

If API calls return 404:
- Verify the `api` folder is uploaded correctly
- Check that `.htaccess` is present in the `api` folder
- Ensure your hosting supports `.htaccess` files
- Check file permissions (644 for PHP files, 755 for directories)

### CORS Errors

If you see CORS errors in the browser console:
- Verify the CORS headers in `api/config.php`
- Check that `mod_headers` is enabled on your server
- Update `Access-Control-Allow-Origin` to your specific domain in production

### Blank Page or JavaScript Errors

- Open browser console (F12) to see specific errors
- Verify all files from `dist` folder were uploaded
- Check that file paths are correct

## Security Recommendations

1. **Change JWT_SECRET** in `api/config.php` to a unique random string
2. **Update CORS_ORIGINS** to your specific domain instead of `*`
3. **Disable error display** in production (comment out display_errors in .htaccess)
4. **Use HTTPS** for your site (most shared hosts provide free SSL)
5. **Regularly backup** your database

## Database Backup

To backup your data:
```sql
-- Export all shoutout tables
mysqldump -u u473142779_author_user2 -p u473142779_authorsite2 \
  shoutout_config \
  shoutout_stories \
  shoutout_admin_shoutouts \
  shoutout_availability \
  shoutout_bookings \
  > shoutout_backup.sql
```

## Updating the Application

To update after making changes:
1. Make changes to your local code
2. Run `npm run build`
3. Upload the new `dist` folder contents
4. If you changed API files, upload those too

## Support

If you encounter issues:
- Check browser console for JavaScript errors
- Check server error logs (usually in cPanel)
- Verify database connection with a simple PHP test script
- Ensure all file permissions are correct (644 for files, 755 for folders)
