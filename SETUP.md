# Author CMS - Setup Guide

## Initial Setup

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd Website
npm install
```

### 2. Configure Database & API

**Copy the example config:**
```bash
cp api/config.example.php api/config.php
```

**Edit `api/config.php` with your actual credentials:**
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_actual_database');
define('DB_USER', 'your_actual_username');
define('DB_PASS', 'your_actual_password');

// IMPORTANT: Change these secrets!
define('JWT_SECRET', 'generate-a-long-random-string-here');
define('ANALYTICS_SALT', 'another-unique-random-string');

// For production, use specific domain(s)
define('CORS_ORIGINS', 'https://yourdomain.com,https://admin.yourdomain.com');
```

⚠️ **NEVER commit `api/config.php` to Git!** (Already excluded in `.gitignore`)

### 3. Run Database Migrations

```bash
mysql -u username -p database_name < api/migrations/001_create_rate_limit_table.sql
# Or import via phpMyAdmin
```

If starting fresh, use the full schema:
```bash
mysql -u username -p database_name < unified-schema.sql
```

### 4. Build for Production

```bash
npm run build
```

This creates a `dist/` folder with your production files.

### 5. Deploy

Upload the `dist/` folder to your server:
- `dist/` → Your web root (e.g., `/public_html/`)
- Ensure PHP and MySQL are configured on your server
- Set up SSL/HTTPS (required for secure sessions)

### 6. Set Up Cron Job (Optional but recommended)

For rate limit cleanup:
```cron
0 2 * * * /usr/bin/php /path/to/api/cron/cleanup-rate-limits.php
```

## Security Checklist

- [x] `.gitignore` excludes `config.php`
- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Change `ANALYTICS_SALT` to a unique value
- [ ] Set `CORS_ORIGINS` to your actual domain(s)
- [ ] Enable HTTPS on your server
- [ ] Update Cloudflare IP ranges if behind CF (see `api/migrations/CLOUDFLARE_SETUP.md`)
- [ ] Set strong database password
- [ ] Change default admin password after first login

## Development vs Production

### Development (Local)

**Session cookies:** Edit `api/bootstrap.php` line 156:
```php
'secure' => false,  // Allow HTTP for local dev
```

**CORS:** Can use `*` for local testing:
```php
define('CORS_ORIGINS', '*');
```

### Production (Live Server)

**Session cookies:** Keep as:
```php
'secure' => true,  // HTTPS only
```

**CORS:** Use specific domains:
```php
define('CORS_ORIGINS', 'https://yoursite.com');
```

## File Structure

```
Website/
├── api/                      # PHP Backend (commit to Git)
│   ├── config.example.php   # ✅ Commit this
│   ├── config.php           # ❌ NEVER commit (in .gitignore)
│   ├── bootstrap.php
│   ├── migrations/
│   └── ...
├── src/                     # React Frontend (commit to Git)
├── dist/                    # Build output (excluded from Git)
├── node_modules/            # Dependencies (excluded from Git)
├── .gitignore              # Git exclusions
├── package.json
└── unified-schema.sql      # Full DB schema
```

## Common Issues

### "Headers already sent"
- Check for output before session_start()
- Ensure no BOM in PHP files

### CORS errors
- Verify `CORS_ORIGINS` matches your frontend domain
- Check browser console for exact error

### Session expires immediately
- Ensure HTTPS is enabled if `secure: true`
- Check server timezone matches your config

### Rate limiting not working
- Verify migration was run
- Check that `rate_limit_agg` table exists
- Review logs for structured JSON events

## Documentation

- **Security**: See `api/SECURITY_FIXES_FINAL.md`
- **Rate Limiting**: See `api/SECURITY_HARDENING.md`
- **Cloudflare Setup**: See `api/migrations/CLOUDFLARE_SETUP.md`
- **Database Queries**: See `api/sql-queries/rate-limit-dashboard.sql`

## Support

Check error logs:
- PHP: Check your server's error log (often `/var/log/apache2/error.log`)
- Application: Check `error.log` in your API directory
- Rate Limits: Search logs for `rate_limit_hit` events (JSON format)

For issues, check:
1. Database connection (`api/config.php` credentials)
2. File permissions (uploads directory needs write access)
3. PHP version (7.2+ required for Argon2id)
4. MySQL version (5.7+ recommended)
