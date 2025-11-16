# Scheduled Chapter Publishing

This CMS now supports scheduled publishing for chapters. You can set a chapter to publish automatically at a specific date and time.

## Features

- **Draft Status**: Chapter is not visible to the public
- **Published Status**: Chapter is immediately visible to the public
- **Scheduled Status**: Chapter will auto-publish at the specified date/time

## Setup Instructions

### 1. Run the Database Migration

First, apply the database migration to add the new fields:

```bash
mysql -u your_username -p your_database < migrations/add_scheduled_publishing.sql
```

Or run the SQL manually in phpMyAdmin/MySQL Workbench:

```sql
-- Add scheduled status to chapters
ALTER TABLE chapters
MODIFY COLUMN status ENUM('draft','published','scheduled') NOT NULL DEFAULT 'draft';

-- Add publish_at column
ALTER TABLE chapters
ADD COLUMN publish_at DATETIME DEFAULT NULL COMMENT 'Scheduled publish date/time (for status=scheduled)' AFTER status;

-- Add index
ALTER TABLE chapters
ADD INDEX idx_chapters_publish_at (publish_at);
```

### 2. Set Up the Cron Job

The cron job file is located at: `api/cron/publish-scheduled-chapters.php`

#### Option A: Run Every Minute (Most Accurate)

```bash
* * * * * /usr/bin/php /path/to/your/website/api/cron/publish-scheduled-chapters.php >> /path/to/logs/scheduled-publish.log 2>&1
```

#### Option B: Run Every 5 Minutes (Recommended)

```bash
*/5 * * * * /usr/bin/php /path/to/your/website/api/cron/publish-scheduled-chapters.php >> /path/to/logs/scheduled-publish.log 2>&1
```

#### Option C: Run Every Hour (For Low-Frequency Publishing)

```bash
0 * * * * /usr/bin/php /path/to/your/website/api/cron/publish-scheduled-chapters.php >> /path/to/logs/scheduled-publish.log 2>&1
```

### 3. Setting Up the Cron Job

**On Linux/Unix (cPanel, Plesk, SSH):**

1. Open your crontab:
   ```bash
   crontab -e
   ```

2. Add one of the cron job lines above

3. Save and exit

**On Windows:**

1. Open Task Scheduler
2. Create a new task
3. Set the trigger (e.g., every 5 minutes)
4. Set the action to run:
   ```
   C:\path\to\php.exe C:\path\to\website\api\cron\publish-scheduled-chapters.php
   ```

**On cPanel:**

1. Go to "Cron Jobs" in cPanel
2. Add a new cron job
3. Set the interval (e.g., */5 * * * *)
4. Set the command:
   ```
   /usr/bin/php /home/username/public_html/api/cron/publish-scheduled-chapters.php
   ```

## How to Use

### In the Admin Panel

1. Go to **Stories** in the admin panel
2. Select a story
3. Create or edit a chapter
4. Set the **Status** to "Scheduled"
5. Choose a **Publish At** date and time
6. Save the chapter

The chapter will automatically change from "scheduled" to "published" at the specified time when the cron job runs.

### Important Notes

- **Timezone**: The publish_at time is stored in your database server's timezone
- **Cron Frequency**: If you run the cron every 5 minutes, chapters will publish within 5 minutes of the scheduled time
- **Past Dates**: If you set a publish_at time in the past, the chapter will be published immediately on the next cron run
- **Draft Protection**: Chapters with status "draft" or "scheduled" are NOT visible to the public, only to logged-in admins

## Testing

To test the cron job manually:

```bash
php api/cron/publish-scheduled-chapters.php
```

You should see output like:
```
[2025-01-15 14:30:00] Published: Chapter 5: The Final Battle (ID: 123, Scheduled: 2025-01-15 14:30:00)
[2025-01-15 14:30:00] Total published: 1 chapter(s)
```

Or if there are no chapters to publish:
```
[2025-01-15 14:30:00] No chapters to publish
```

## Monitoring

Check the log file to monitor scheduled publishing:

```bash
tail -f /path/to/logs/scheduled-publish.log
```

## Troubleshooting

**Chapters not publishing:**
- Check if the cron job is running (`crontab -l`)
- Check the log file for errors
- Verify the database has the new columns (`DESCRIBE chapters`)
- Make sure the PHP path in the cron command is correct
- Check file permissions on the cron script

**Wrong publish times:**
- Check your server's timezone: `date`
- Update PHP timezone in php.ini if needed
- Use datetime-local input which handles timezones automatically
