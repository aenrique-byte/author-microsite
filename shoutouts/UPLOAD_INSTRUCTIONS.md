# Upload Instructions for ocwanderer.com/shoutouts

## Important: Two Separate Uploads Required!

The `api` folder is **NOT** included in the `dist` folder. You need to upload them separately.

## What to Upload

### Upload #1: React App (from `dist` folder)
Upload these files to: `public_html/shoutouts/`

```
dist/
├── index.html          → upload to public_html/shoutouts/
└── assets/             → upload to public_html/shoutouts/assets/
    └── index-B0DSomIQ.js
```

### Upload #2: PHP API (from `api` folder)
Upload the entire `api` folder to: `public_html/shoutouts/api/`

```
api/
├── .htaccess           → upload to public_html/shoutouts/api/
├── test.php            → upload to public_html/shoutouts/api/
├── config.php          → upload to public_html/shoutouts/api/
├── config.endpoint.php → upload to public_html/shoutouts/api/
├── stories.endpoint.php → upload to public_html/shoutouts/api/
├── shoutouts.endpoint.php → upload to public_html/shoutouts/api/
├── availability.endpoint.php → upload to public_html/shoutouts/api/
└── bookings.endpoint.php → upload to public_html/shoutouts/api/
```

## Final Server Structure

After uploading, your server should look like this:

```
public_html/
└── shoutouts/
    ├── index.html                    (from dist/)
    ├── assets/                       (from dist/)
    │   └── index-B0DSomIQ.js
    └── api/                          (from api/ folder - uploaded separately!)
        ├── .htaccess
        ├── test.php
        ├── config.php
        ├── config.endpoint.php
        ├── stories.endpoint.php
        ├── shoutouts.endpoint.php
        ├── availability.endpoint.php
        └── bookings.endpoint.php
```

## Step-by-Step Upload Process

### Using FTP/SFTP:

1. **Connect to your server** via FTP client (FileZilla, etc.)

2. **Navigate to** `public_html/`

3. **Create folder** `shoutouts` if it doesn't exist

4. **Upload dist contents:**
   - Select all files from your local `dist` folder
   - Upload to `public_html/shoutouts/`

5. **Upload api folder:**
   - Select the entire `api` folder from your project
   - Upload to `public_html/shoutouts/` (so it becomes `public_html/shoutouts/api/`)

### Using cPanel File Manager:

1. **Log into cPanel**

2. **Open File Manager**

3. **Navigate to** `public_html/`

4. **Create folder** `shoutouts`

5. **Upload dist files:**
   - Click "Upload" button
   - Select all files from your local `dist` folder
   - Upload to `public_html/shoutouts/`

6. **Upload api folder:**
   - Click "Upload" button
   - Select all files from your local `api` folder
   - Upload to `public_html/shoutouts/api/`
   - OR upload as a zip and extract

## Verification Steps

After uploading:

1. **Test the React app:**
   - Visit: `https://ocwanderer.com/shoutouts/`
   - You should see the shoutout manager interface

2. **Test PHP is working:**
   - Visit: `https://ocwanderer.com/shoutouts/api/test.php`
   - You should see JSON output (not HTML)

3. **Test API endpoint:**
   - Visit: `https://ocwanderer.com/shoutouts/api/config.endpoint.php`
   - You should see: `{"monthsToShow":3}`

## If You Get Errors

- See **TROUBLESHOOTING.md** for detailed debugging steps
- Make sure you ran the SQL schema in phpMyAdmin first
- Verify file permissions (644 for files, 755 for folders)
- Check that the `api` folder is in the correct location

## Quick Checklist

- [ ] SQL schema executed in phpMyAdmin
- [ ] Created `shoutouts` folder in public_html
- [ ] Uploaded all files from `dist/` to `public_html/shoutouts/`
- [ ] Uploaded entire `api/` folder to `public_html/shoutouts/api/`
- [ ] Verified file permissions
- [ ] Tested https://ocwanderer.com/shoutouts/api/test.php
- [ ] Tested https://ocwanderer.com/shoutouts/
