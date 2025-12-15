# Troubleshooting Guide

## Error: "Failed to connect to database" - HTML instead of JSON

This error means the API endpoints are returning HTML (likely a 404 page) instead of JSON. Here's how to fix it:

### Step 1: Test PHP Execution

1. Upload `api/test.php` to your server at `public_html/shoutouts/api/test.php`
2. Visit: `https://ocwanderer.com/shoutouts/api/test.php` in your browser
3. You should see JSON output like:
   ```json
   {
     "status": "success",
     "message": "PHP is working!",
     "server_info": {...}
   }
   ```

**If you see HTML or a 404 error:**
- PHP files are not in the correct location
- Verify the folder structure matches exactly

### Step 2: Verify Folder Structure

Your server should have this exact structure:

```
public_html/
└── shoutouts/
    ├── index.html
    ├── assets/
    │   └── index-B0DSomIQ.js
    └── api/
        ├── test.php
        ├── config.php
        ├── config.endpoint.php
        ├── stories.endpoint.php
        ├── shoutouts.endpoint.php
        ├── availability.endpoint.php
        ├── bookings.endpoint.php
        └── .htaccess
```

### Step 3: Check File Permissions

Set correct permissions via FTP/cPanel:
- **Folders**: 755 (rwxr-xr-x)
- **PHP files**: 644 (rw-r--r--)
- **.htaccess**: 644 (rw-r--r--)

### Step 4: Test Individual Endpoints

Once test.php works, try each endpoint:

1. **Config**: `https://ocwanderer.com/shoutouts/api/config.endpoint.php`
   - Should return: `{"monthsToShow":3}`

2. **Stories**: `https://ocwanderer.com/shoutouts/api/stories.endpoint.php`
   - Should return: `[{"id":"default","title":"My Royal Road Story",...}]`

**If you get database errors:**
- Check database credentials in `api/config.php`
- Verify the SQL schema was run successfully
- Check database user permissions

### Step 5: Common Issues & Solutions

#### Issue: 404 Not Found
**Solution**: 
- Verify files are uploaded to the correct path
- Check that your hosting supports PHP
- Ensure .htaccess is uploaded

#### Issue: 500 Internal Server Error
**Solution**:
- Check PHP error logs in cPanel
- Verify database credentials in `api/config.php`
- Check file permissions (should be 644 for PHP files)

#### Issue: CORS Errors
**Solution**:
- Verify `Access-Control-Allow-Origin` headers in `api/config.php`
- Check that mod_headers is enabled on your server

#### Issue: Database Connection Failed
**Solution**:
- Verify database name: `u473142779_authorsite2`
- Verify database user: `u473142779_author_user2`
- Verify password in `api/config.php`
- Check that database user has permissions on the database
- Verify SQL schema was executed successfully

### Step 6: Enable Debug Mode

Temporarily enable error display in `api/.htaccess`:

Uncomment these lines:
```apache
php_flag display_errors on
php_value error_reporting E_ALL
```

This will show PHP errors directly in the browser. **Remember to disable this in production!**

### Step 7: Check Database Tables

Log into phpMyAdmin and verify these tables exist:
- `shoutout_config`
- `shoutout_stories`
- `shoutout_admin_shoutouts`
- `shoutout_availability`
- `shoutout_bookings`

If they don't exist, run `mysql_schema.sql` again.

### Step 8: Alternative - Use Root Path Instead

If subfolder deployment is causing issues, you can deploy to the root:

1. **Update vite.config.ts**:
   ```typescript
   base: '/', // Change from '/shoutouts/'
   ```

2. **Update services/api-db.ts**:
   ```typescript
   const API_BASE_URL = '/api'; // Change from '/shoutouts/api'
   ```

3. **Rebuild**:
   ```bash
   npm run build
   ```

4. **Upload to root**:
   - Upload `dist/*` to `public_html/`
   - Upload `api/` to `public_html/api/`

### Need More Help?

1. Check browser console (F12) for the exact error
2. Check server error logs in cPanel
3. Try accessing the test.php file directly
4. Verify your hosting supports PHP 7.4+
5. Contact your hosting support if PHP isn't executing
