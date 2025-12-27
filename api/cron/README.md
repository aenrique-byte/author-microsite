# CritiqueRoom Cron Jobs

This directory contains scheduled maintenance scripts for the CritiqueRoom feature.

## cleanup-critiqueroom.php

Automatically deletes expired critique sessions and their associated data (comments, replies, feedback).

### Features

- Deletes sessions where `expires_at < current_time`
- Cascading deletion handles all related data automatically
- Transaction-safe (rolls back on error)
- Comprehensive logging to PHP error log
- Security restrictions (CLI or localhost only)
- JSON response format for monitoring

### Setup Instructions

#### Option 1: Server Crontab (Recommended)

Add to your server's crontab to run every hour:

```bash
# Edit crontab
crontab -e

# Add this line (adjust paths as needed)
0 * * * * /usr/bin/php /var/www/html/api/cron/cleanup-critiqueroom.php >> /var/log/critiqueroom-cleanup.log 2>&1
```

**Verify cron job is scheduled:**
```bash
crontab -l
```

#### Option 2: Web-Based Cron (Alternative)

If your hosting provider uses web-based cron (e.g., cPanel Cron Jobs), use:

```bash
# URL to call
https://yourdomain.com/api/cron/cleanup-critiqueroom.php

# Frequency
Every hour (0 * * * *)

# Command (if using curl)
curl -s https://yourdomain.com/api/cron/cleanup-critiqueroom.php > /dev/null 2>&1
```

#### Option 3: Manual Execution (Testing)

Test the script manually via CLI:

```bash
# From project root
php api/cron/cleanup-critiqueroom.php

# Expected output
{
    "success": true,
    "deleted_count": 0,
    "deleted_sessions": [],
    "timestamp": 1703001600000,
    "datetime": "2024-12-19 15:30:00",
    "message": "No expired sessions to delete"
}
```

Or via browser (localhost only):

```
http://localhost/api/cron/cleanup-critiqueroom.php
```

### Security

The script includes protection against unauthorized access:

- ✅ Can be run from command line (CLI)
- ✅ Can be accessed from localhost (127.0.0.1, ::1)
- ❌ Returns 403 Forbidden from external IPs

### Logging

All cleanup operations are logged to the PHP error log:

```bash
# View logs (adjust path based on your PHP configuration)
tail -f /var/log/php-errors.log

# Or application-specific log
tail -f /var/log/critiqueroom-cleanup.log
```

**Log format:**
```
[CritiqueRoom Cleanup] Deleted 3 expired session(s) at 2024-12-19 15:30:00 (timestamp: 1703001600000)
Deleted sessions: abc123, def456, ghi789
```

### Testing

1. **Create a test session with short expiration:**
   - Use API to create session with `expiration: "24 Hours"`
   - Manually update `expires_at` in database to past timestamp:
     ```sql
     UPDATE critiqueroom_sessions
     SET expires_at = 1000000000000
     WHERE id = 'test-session-id';
     ```

2. **Run cleanup script:**
   ```bash
   php api/cron/cleanup-critiqueroom.php
   ```

3. **Verify deletion:**
   ```sql
   SELECT COUNT(*) FROM critiqueroom_sessions WHERE id = 'test-session-id';
   -- Should return 0
   ```

### Monitoring

You can monitor cleanup operations by:

1. **Checking logs regularly:**
   ```bash
   grep "CritiqueRoom Cleanup" /var/log/php-errors.log | tail -20
   ```

2. **Setting up alerts for errors:**
   ```bash
   grep "CritiqueRoom Cleanup ERROR" /var/log/php-errors.log
   ```

3. **Using external monitoring services:**
   - Configure an uptime monitor to call the script URL
   - Alert if response is not 200 OK or JSON parsing fails

### Troubleshooting

**Problem: Script returns 403 Forbidden**
- **Cause:** Accessing from external IP
- **Solution:** Only run from CLI or localhost, or update security check in script

**Problem: No sessions being deleted**
- **Cause:** No sessions have expired yet, or `expires_at` is NULL
- **Solution:** Check database for sessions with `expires_at < NOW()`
  ```sql
  SELECT id, title, expires_at
  FROM critiqueroom_sessions
  WHERE expires_at IS NOT NULL
  AND expires_at < UNIX_TIMESTAMP() * 1000;
  ```

**Problem: Database connection error**
- **Cause:** `bootstrap.php` or `config.php` not found
- **Solution:** Ensure script is in correct directory and paths are valid

**Problem: Transaction rollback**
- **Cause:** Database constraint violation or connection lost
- **Solution:** Check error logs for specific PDO exception message

### Database Schema Dependencies

The cleanup script relies on CASCADE deletion configured in the database:

```sql
-- Comments are deleted automatically when session is deleted
FOREIGN KEY (session_id) REFERENCES critiqueroom_sessions(id) ON DELETE CASCADE

-- Replies are deleted automatically when comment is deleted
FOREIGN KEY (comment_id) REFERENCES critiqueroom_comments(id) ON DELETE CASCADE

-- Global feedback is deleted automatically when session is deleted
FOREIGN KEY (session_id) REFERENCES critiqueroom_sessions(id) ON DELETE CASCADE
```

If CASCADE is not configured, you'll need to manually delete child records first.

### Performance Considerations

- **Database indexes:** Ensure `expires_at` column is indexed for fast queries
- **Batch size:** Currently deletes all expired sessions in one transaction
- **Lock time:** Uses transaction locks - brief blocking on `critiqueroom_sessions` table

For very high-volume sites (thousands of sessions), consider:
- Running cleanup more frequently (every 15 minutes)
- Adding LIMIT clause to process in batches
- Using separate cleanup script for each data type

### Maintenance Schedule

| Task | Frequency | Command |
|------|-----------|---------|
| Cleanup expired sessions | Hourly | `0 * * * *` |
| Verify cron is running | Weekly | `crontab -l` |
| Review error logs | Weekly | `grep "ERROR" /var/log/php-errors.log` |
| Check disk space | Monthly | `df -h` |

---

## Future Enhancements (Phase 11)

Potential improvements to consider:

- [ ] Separate cleanup job for orphaned Discord user cache
- [ ] Archive sessions before deletion (backup feature)
- [ ] Email notifications to session authors before expiration
- [ ] Cleanup statistics dashboard in admin panel
- [ ] Configurable retention policies (delete after X days regardless of expiration)
