# Chapter Publishing Schedule System

A recurring schedule-based system for automatically publishing chapters on a regular cadence.

## Overview

Instead of setting individual publish dates for each chapter, you create **recurring schedules** (like "Daily at 5pm EST" or "Monday/Wednesday/Friday at 9am") and assign them to stories. When you upload chapters and mark them as "queued", the system automatically calculates when each chapter should publish based on the schedule.

## Features

- **Recurring Schedules**: Create daily or weekly publishing schedules
- **Timezone Support**: Each schedule has its own timezone
- **Queue System**: Chapters are queued in order and automatically published
- **Flexible Patterns**: Daily, or specific days of the week (M/W/F, Tue/Thu, etc.)
- **Multiple Stories**: Assign different schedules to different stories
- **Automatic Calculation**: Publish dates are calculated automatically based on queue position

## How It Works

1. **Create Schedules** (one-time setup):
   - "Daily at 5pm EST" → Publishes every day at 5pm Eastern
   - "Weekly MWF at 9am PST" → Publishes Monday, Wednesday, Friday at 9am Pacific
   - "Weekly Tue/Thu at 12pm EST" → Publishes Tuesday and Thursday at noon Eastern

2. **Assign Schedule to Story**:
   - Go to Stories admin
   - Edit a story
   - Select a publishing schedule from the dropdown

3. **Queue Chapters**:
   - Upload/create chapters
   - Set status to "Queued" instead of "Published"
   - System automatically sets queue_position (1, 2, 3...)

4. **Automatic Publishing**:
   - Cron job calculates `publish_at` dates for all queued chapters
   - Another cron job publishes chapters when their `publish_at` time arrives
   - Chapters publish in queue order, following the schedule pattern

## Database Migration

Run this migration to set up the schedule system:

```bash
mysql -u your_user -p your_database < migrations/replace_with_schedule_system.sql
```

This will:
- Create the `publishing_schedules` table
- Add `schedule_id` to `stories` table
- Change chapter status from 'scheduled' to 'queued'
- Add `queue_position` field to chapters
- Insert example schedules

## Cron Jobs Setup

You need **TWO** cron jobs for the system to work:

### 1. Calculate Publish Dates (Every 5-15 minutes)

```bash
*/5 * * * * /usr/bin/php /path/to/api/cron/calculate-publish-schedule.php >> /path/to/logs/calculate-schedule.log 2>&1
```

This calculates the `publish_at` date for each queued chapter based on:
- The story's assigned schedule
- The chapter's position in the queue
- The last published chapter's date

### 2. Publish Chapters (Every 1-5 minutes)

```bash
*/5 * * * * /usr/bin/php /path/to/api/cron/publish-scheduled-chapters.php >> /path/to/logs/publish-chapters.log 2>&1
```

This finds all queued chapters where `publish_at <= NOW()` and publishes them.

## Usage Example

### Scenario: Daily Web Serial

1. **Create Schedule**: "Daily at 8pm EST"
   - Frequency: Daily
   - Time: 20:00
   - Timezone: America/New_York

2. **Assign to Story**: "My Epic Tale" uses this schedule

3. **Upload 10 Chapters**:
   - Ch 1-10 all set to status "Queued"
   - System assigns queue_position 1-10

4. **Automatic Calculation**:
   - Calculate cron runs
   - Ch 1 → Today at 8pm
   - Ch 2 → Tomorrow at 8pm
   - Ch 3 → Day after at 8pm
   - ... and so on

5. **Automatic Publishing**:
   - At 8pm today, Ch 1 publishes
   - At 8pm tomorrow, Ch 2 publishes
   - Continues until all chapters published

### Scenario: Weekly Serial (M/W/F)

1. **Create Schedule**: "Weekly MWF at 12pm EST"
   - Frequency: Weekly
   - Days: Monday (1), Wednesday (3), Friday (5)
   - Time: 12:00
   - Timezone: America/New_York

2. **Assign to Story**: "The Adventures Continue"

3. **Upload 6 Chapters** (all queued)

4. **Automatic Calculation**:
   - Ch 1 → Next Monday at 12pm
   - Ch 2 → Next Wednesday at 12pm
   - Ch 3 → Next Friday at 12pm
   - Ch 4 → Following Monday at 12pm
   - Ch 5 → Following Wednesday at 12pm
   - Ch 6 → Following Friday at 12pm

## Managing Schedules

### Via Database (Initially)

Insert schedules directly:

```sql
INSERT INTO publishing_schedules (name, frequency, time, timezone, days_of_week, active) VALUES
('Daily at 5pm EST', 'daily', '17:00:00', 'America/New_York', NULL, 1),
('Weekly MWF 9am PST', 'weekly', '09:00:00', 'America/Los_Angeles', '1,3,5', 1);
```

### Days of Week Format

For weekly schedules, `days_of_week` is a comma-separated list:
- 0 = Sunday
- 1 = Monday
- 2 = Tuesday
- 3 = Wednesday
- 4 = Thursday
- 5 = Friday
- 6 = Saturday

Examples:
- `'1,3,5'` = Monday, Wednesday, Friday
- `'2,4'` = Tuesday, Thursday
- `'1,2,3,4,5'` = Weekdays only
- `'0,6'` = Weekends only
- `NULL` = Every day (for daily frequency)

## Timezones

Common timezone values:
- `'America/New_York'` - EST/EDT
- `'America/Chicago'` - CST/CDT
- `'America/Denver'` - MST/MDT
- `'America/Los_Angeles'` - PST/PDT
- `'America/Phoenix'` - MST (no DST)
- `'UTC'` - Coordinated Universal Time
- `'Europe/London'` - GMT/BST
- `'Asia/Tokyo'` - JST

Full list: https://www.php.net/manual/en/timezones.php

## Queue Management

### Reordering Chapters

To change the publish order, update `queue_position`:

```sql
-- Move chapter 5 to position 2 (will publish earlier)
UPDATE chapters
SET queue_position = 2
WHERE id = 5 AND status = 'queued';

-- Re-normalize all positions for a story
SET @pos = 0;
UPDATE chapters
SET queue_position = (@pos := @pos + 1)
WHERE story_id = 123 AND status = 'queued'
ORDER BY queue_position ASC, chapter_number ASC;
```

### Removing from Queue

```sql
-- Change back to draft (removes from queue)
UPDATE chapters
SET status = 'draft', queue_position = NULL, publish_at = NULL
WHERE id = 456;
```

### Publishing Immediately

```sql
-- Bypass queue and publish now
UPDATE chapters
SET status = 'published', queue_position = NULL
WHERE id = 789;
```

## Monitoring

### Check Calculated Publish Dates

```sql
SELECT
  c.chapter_number,
  c.title,
  c.status,
  c.queue_position,
  c.publish_at,
  s.title as story_title,
  ps.name as schedule_name
FROM chapters c
JOIN stories s ON c.story_id = s.id
LEFT JOIN publishing_schedules ps ON s.schedule_id = ps.id
WHERE c.status = 'queued'
ORDER BY c.publish_at ASC;
```

### Check What Will Publish Soon

```sql
SELECT
  c.chapter_number,
  c.title,
  c.publish_at,
  TIMESTAMPDIFF(MINUTE, NOW(), c.publish_at) as minutes_until_publish
FROM chapters c
WHERE c.status = 'queued'
AND c.publish_at <= DATE_ADD(NOW(), INTERVAL 1 DAY)
ORDER BY c.publish_at ASC;
```

## Troubleshooting

**Chapters not getting publish dates:**
- Check if story has a schedule assigned (`SELECT * FROM stories WHERE id = X`)
- Check if schedule is active (`SELECT * FROM publishing_schedules WHERE id = Y`)
- Run calculate cron manually: `php api/cron/calculate-publish-schedule.php`
- Check cron logs for errors

**Chapters not publishing:**
- Check if `publish_at` is in the past: `SELECT * FROM chapters WHERE status = 'queued' AND publish_at <= NOW()`
- Run publish cron manually: `php api/cron/publish-scheduled-chapters.php`
- Check cron is running: `crontab -l`
- Check PHP timezone matches database timezone

**Wrong publish times:**
- Verify server timezone: `SELECT @@system_time_zone`
- Verify PHP timezone in php.ini
- Check schedule timezone is correct
- Times are stored in database timezone, displayed/calculated in schedule timezone

## Frontend Integration

The admin panel should include:
1. Schedule Manager page to create/edit schedules
2. Story form dropdown to select schedule
3. Chapter form with "Queued" status option
4. Visual queue display showing upcoming publish dates
5. Drag-and-drop to reorder queued chapters

(Frontend implementation coming next)
