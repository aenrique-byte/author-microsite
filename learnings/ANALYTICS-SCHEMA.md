# Analytics Schema Reference (MariaDB 10.6)

## Overview
- **Purpose**: Power Site → Story/Gallery → Chapter/Image analytics with lean, privacy-aware storage.
- **Privacy**: IP addresses are not stored. We store `ip_hash = SHA-256(remote_ip + server_salt)`.
- **Session**: Anonymous UUIDv4 persisted in localStorage (visitors), or `user_id` if logged-in author/admin.
- **Retention**: Raw events 90 days. Aggregates (if used) 2 years.
- **Parent pointers**: `parent_type`/`parent_id` on chapter/image events enable cheap story/gallery drilldowns.

## 1) Table: analytics_events (Phase 1, live)
Row-per-event stream (page views, story/chapter/gallery/image views, chapter depth, CTA clicks).

### Columns
- `id`: BIGINT UNSIGNED PK, auto-increment
- `created_at`: DATETIME, default CURRENT_TIMESTAMP
- `session_id`: CHAR(36), UUIDv4
- `user_id`: INT, nullable (set if logged-in)
- `event_type`: ENUM('page_view','story_view','gallery_view','image_view','chapter_view','chapter_depth','click')
- `url_path`: VARCHAR(512) — path portion of current URL
- `referrer`: VARCHAR(512) — raw document.referrer
- `user_agent`: VARCHAR(255) — request UA (trimmed)
- `ip_hash`: CHAR(64) — sha256(ip + analytics_salt)
- `content_type`: ENUM('site','story','gallery','chapter','image'), nullable
- `content_id`: INT, nullable
- `parent_type`: ENUM('story','gallery'), nullable
- `parent_id`: INT, nullable
- `value_num`: DOUBLE, nullable — numeric value for the event (e.g., chapter_depth depth 0..1)
- `meta_json`: JSON, nullable — extra data e.g. {"time_ms":12345,"name":"next_chapter"}
- `referrer_host`: VARCHAR(255) GENERATED ALWAYS AS:
  - `NULLIF(LOWER(SUBSTRING_INDEX(SUBSTRING_INDEX(referrer,'//',-1), '/', 1)), '') PERSISTENT`

### Indexes
- `idx_created` (created_at)
- `idx_event_created` (event_type, created_at)
- `idx_content_created` (content_type, content_id, created_at)
- `idx_parent_created` (parent_type, parent_id, created_at)
- `idx_session_created` (session_id, created_at)
- `idx_referrer_host_created` (referrer_host, created_at)
- **Optional covering index** (recommended for story/gallery drilldowns):
  - `CREATE INDEX idx_parent_event_created ON analytics_events (parent_type, parent_id, event_type, created_at, content_id);`

### DDL (Applied)
```sql
CREATE TABLE IF NOT EXISTS `analytics_events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `session_id` CHAR(36) NOT NULL,
  `user_id` INT NULL,

  `event_type` ENUM(
    'page_view','story_view','gallery_view','image_view',
    'chapter_view','chapter_depth','click'
  ) NOT NULL,

  `url_path` VARCHAR(512) NOT NULL,
  `referrer` VARCHAR(512) NULL,
  `user_agent` VARCHAR(255) NULL,
  `ip_hash` CHAR(64) NOT NULL,

  `content_type` ENUM('site','story','gallery','chapter','image') NULL,
  `content_id` INT NULL,

  `parent_type` ENUM('story','gallery') NULL,
  `parent_id` INT NULL,

  `value_num` DOUBLE NULL,
  `meta_json` JSON NULL,

  `referrer_host` VARCHAR(255)
    AS (
      NULLIF(
        LOWER(SUBSTRING_INDEX(SUBSTRING_INDEX(`referrer`, '//', -1), '/', 1)),
        ''
      )
    ) PERSISTENT,

  PRIMARY KEY (`id`),
  KEY `idx_created` (`created_at`),
  KEY `idx_event_created` (`event_type`, `created_at`),
  KEY `idx_content_created` (`content_type`, `content_id`, `created_at`),
  KEY `idx_parent_created` (`parent_type`, `parent_id`, `created_at`),
  KEY `idx_session_created` (`session_id`, `created_at`),
  KEY `idx_referrer_host_created` (`referrer_host`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 2) Table: analytics_daily_content (Phase 2, optional)
Daily rollups per content item for long-range fast reads.

### Columns
- `day`: DATE — primary time key
- `content_type`: ENUM('story','gallery','chapter','image')
- `content_id`: INT
- `parent_type`: ENUM('story','gallery'), nullable
- `parent_id`: INT, nullable
- `views`: INT — total events (e.g., view types)
- `uniques`: INT — distinct sessions
- `clicks`: INT — derived total clicks targeting that content
- `completes`: INT — count where depth ≥ 0.9
- `median_depth`: DOUBLE — daily median depth (0..1)
- `median_time_s`: DOUBLE — daily median dwell in seconds

### Keys
- PK(day, content_type, content_id)
- idx_parent_day(parent_type, parent_id, day)
- idx_day(day)

### DDL (Phase 2)
```sql
CREATE TABLE IF NOT EXISTS `analytics_daily_content` (
  `day` DATE NOT NULL,
  `content_type` ENUM('story','gallery','chapter','image') NOT NULL,
  `content_id` INT NOT NULL,
  `parent_type` ENUM('story','gallery') NULL,
  `parent_id` INT NULL,

  `views` INT NOT NULL DEFAULT 0,
  `uniques` INT NOT NULL DEFAULT 0,
  `clicks` INT NOT NULL DEFAULT 0,
  `completes` INT NOT NULL DEFAULT 0,
  `median_depth` DOUBLE NULL,
  `median_time_s` DOUBLE NULL,

  PRIMARY KEY (`day`, `content_type`, `content_id`),
  KEY `idx_parent_day` (`parent_type`, `parent_id`, `day`),
  KEY `idx_day` (`day`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 3) Table: analytics_daily_histogram (Phase 2, optional)
Robust medians via histograms.

### Columns
- `day`: DATE
- `content_type`: ENUM('chapter','image')
- `content_id`: INT
- `metric`: ENUM('depth','time_ms')
- `bucket`: INT
- `count`: INT NOT NULL DEFAULT 0

### Keys
- PK(day, content_type, content_id, metric, bucket)
- idx_day_content(day, content_type, content_id)

### DDL (Phase 2)
```sql
CREATE TABLE IF NOT EXISTS `analytics_daily_histogram` (
  `day` DATE NOT NULL,
  `content_type` ENUM('chapter','image') NOT NULL,
  `content_id` INT NOT NULL,
  `metric` ENUM('depth','time_ms') NOT NULL,
  `bucket` INT NOT NULL,
  `count` INT NOT NULL DEFAULT 0,

  PRIMARY KEY (`day`, `content_type`, `content_id`, `metric`, `bucket`),
  KEY `idx_day_content` (`day`, `content_type`, `content_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Bucket guidance
- **Depth (0..1)**: 20 buckets (0.00–1.00 in 0.05 steps) → `bucket = FLOOR(value_num*20)`
- **Time (ms)**: log-ish buckets (e.g., <10s, 10–30s, 30–90s, 90–180s, >180s) mapped to bucket ids

## 4) Event taxonomy (client emits, server validates)
- **page_view**: url_path, referrer (auto). Use for site PV/UV and referrers.
- **story_view**: when viewing a story page (optional if you only list chapters).
- **chapter_view**: on Chapter mount. Include `content_type='chapter'`, `content_id=<chapter_id>`, `parent_type='story'`, `parent_id=<story_id>`.
- **chapter_depth**: on Chapter unmount. `value_num=depth(0..1)`, `meta_json.time_ms=readTimeMs`. Same content/parent as above.
- **click**: name (e.g., 'start_reading','next_chapter','like','comment_submit'), meta (optional). Attach parent/content hints where useful.
- **gallery_view**: when a gallery is opened. parent_type not needed; `content_type='gallery'`, `content_id=<gallery_id>`.
- **image_view**: when an image is zoomed/opened. `content_type='image'`, `content_id=<image_id>`, `parent_type='gallery'`, `parent_id=<gallery_id>`.

## 5) Server ingest rules (PHP)
- Same-origin enforcement using Origin/Referer host vs HTTP_HOST.
- `user_id` from session if present.
- `ip_hash = sha256(remote_ip + analytics_salt)`.
- Light bot filter by UA (bot|spider|crawl|headless…).
- Payload clamps: allowlisted event_type; truncate user_agent; limit URL/referrer length (already constrained by schema).
- Optional soft throttle: drop >5 events/sec per session_id.

## 6) Derived metric hygiene (in read endpoints)
- Ignore `chapter_depth` where `time_ms < 2000 AND value_num < 0.05` (likely bots/no-ops).
- Completion = `count(depth ≥ 0.9) / starts` (chapter_view).
- Median depth/time: for Phase 1 compute via window functions; for Phase 2 compute from histograms.

## 7) Common queries (MariaDB 10.6)

### Chapter starts/uniques (range)
```sql
SELECT COUNT(*) AS starts, COUNT(DISTINCT session_id) AS uniques 
FROM analytics_events 
WHERE event_type='chapter_view' 
  AND content_id=? 
  AND created_at BETWEEN ? AND ?;
```

### Completion rate by chapter
```sql
SELECT
  SUM(event_type='chapter_view') AS starts,
  SUM(event_type='chapter_depth' AND value_num>=0.9) AS completes,
  ROUND(SUM(event_type='chapter_depth' AND value_num>=0.9) / NULLIF(SUM(event_type='chapter_view'),0), 3) AS completion_rate
FROM analytics_events
WHERE content_type='chapter' AND content_id = ?
  AND created_at BETWEEN ? AND ?;
```

### Median depth (window function)
```sql
WITH s AS (
  SELECT
    value_num,
    ROW_NUMBER() OVER (ORDER BY value_num) AS rn,
    COUNT(*) OVER () AS cnt
  FROM analytics_events
  WHERE event_type='chapter_depth'
    AND content_id = ?
    AND created_at BETWEEN ? AND ?
)
SELECT AVG(value_num) AS median_depth
FROM s
WHERE rn IN (FLOOR((cnt + 1)/2), FLOOR((cnt + 2)/2));
```

### Median read time (from JSON)
```sql
WITH s AS (
  SELECT
    CAST(JSON_VALUE(meta_json, '$.time_ms') AS DECIMAL(20,6)) AS time_ms,
    ROW_NUMBER() OVER (ORDER BY CAST(JSON_VALUE(meta_json, '$.time_ms') AS DECIMAL(20,6))) AS rn,
    COUNT(*) OVER () AS cnt
  FROM analytics_events
  WHERE event_type='chapter_depth'
    AND content_id = ?
    AND created_at BETWEEN ? AND ?
)
SELECT ROUND(AVG(time_ms)/1000, 1) AS median_time_s
FROM s
WHERE rn IN (FLOOR((cnt + 1)/2), FLOOR((cnt + 2)/2));
```

### Story funnel (sessions starting at Ch1)
```sql
WITH ch AS (
  SELECT id, chapter_number AS num FROM chapters WHERE story_id = :storyId
),
views AS (
  SELECT e.session_id, e.content_id, e.created_at
  FROM analytics_events e
  JOIN ch ON ch.id = e.content_id
  WHERE e.event_type='chapter_view'
    AND e.created_at BETWEEN :from AND :to
),
first_hit AS (
  SELECT session_id, MIN(created_at) AS first_time
  FROM views GROUP BY session_id
),
starts_at_1 AS (
  SELECT v.session_id
  FROM views v
  JOIN first_hit f ON f.session_id = v.session_id AND f.first_time = v.created_at
  JOIN ch ON ch.id = v.content_id
  WHERE ch.num = 1
)
SELECT ch.num AS chapter_number, COUNT(DISTINCT v.session_id) AS reach
FROM views v
JOIN ch ON ch.id = v.content_id
JOIN starts_at_1 s1 ON s1.session_id = v.session_id
GROUP BY ch.num
ORDER BY ch.num;
```

### Top images for gallery with median dwell
```sql
WITH times AS (
  SELECT
    e.content_id,
    CAST(JSON_VALUE(e.meta_json, '$.time_ms') AS DECIMAL(20,6)) AS time_ms
  FROM analytics_events e
  WHERE e.event_type='image_view'
    AND e.parent_type='gallery' AND e.parent_id = :galleryId
    AND e.created_at BETWEEN :from AND :to
),
w AS (
  SELECT
    t.content_id,
    t.time_ms,
    ROW_NUMBER() OVER (PARTITION BY t.content_id ORDER BY t.time_ms) AS rn,
    COUNT(*) OVER (PARTITION BY t.content_id) AS cnt
  FROM times t
)
SELECT
  w.content_id AS image_id,
  COUNT(*) AS views,
  COUNT(DISTINCT e.session_id) AS uniques,
  ROUND(AVG(CASE WHEN rn IN (FLOOR((cnt+1)/2), FLOOR((cnt+2)/2)) THEN time_ms END)/1000, 1) AS median_dwell_s
FROM analytics_events e
JOIN w ON w.content_id = e.content_id
WHERE e.event_type='image_view'
  AND e.parent_type='gallery' AND e.parent_id = :galleryId
  AND e.created_at BETWEEN :from AND :to
GROUP BY w.content_id;
```

### Top referrers (excluding self)
```sql
SELECT referrer_host, COUNT(*) AS pageviews
FROM analytics_events
WHERE event_type='page_view'
  AND referrer_host IS NOT NULL
  AND referrer_host NOT IN ('your-domain.com','www.your-domain.com')
  AND created_at BETWEEN ? AND ?
GROUP BY referrer_host
ORDER BY pageviews DESC
LIMIT 50;
```

## 8) Retention
- **Raw events**: `DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL 90 DAY;`
- **Aggregates/histograms**: keep ~2 years.

## 9) Notes and trade-offs
- `parent_type`/`parent_id` dramatically speeds story/gallery drilldowns and simplifies queries (versus deriving parents from joins).
- `referrer_host` generated column avoids SUBSTRING_INDEX cost in hot GROUP BYs.
- If volume grows, consider monthly partitions on `analytics_events` by `TO_DAYS(created_at)`.

## 10) Bucket guidance (for Phase 2 histograms)
- **Depth (0..1)**: 20 buckets (0.00–1.00 in 0.05 steps) → `bucket = FLOOR(value_num*20)`
- **Time (ms)**: log-ish buckets (e.g., <10s, 10–30s, 30–90s, 90–180s, >180s) mapped to bucket ids

## 11) Implementation status
- ✅ **Phase 1**: `analytics_events` table created
- ⏳ **Phase 1**: Ingest endpoint, client SDK, admin UI (in progress)
- ⏳ **Phase 2**: Daily rollup tables and histogram-based medians
