-- =====================================================
-- UNIFIED AUTHOR CMS DATABASE SCHEMA
-- =====================================================
-- This is a consolidated schema combining all separate SQL files
-- with generic defaults for transferability
--
-- Features:
-- - All 16 production tables with exact structure/indexes
-- - Generic default data (no hardcoded author/domain references)
-- - Advanced analytics system with geolocation
-- - SEO metadata management
-- - PLUS transferability enhancements:
--   * site_config table for configurable defaults
--   * Automatic counter triggers for data integrity
--   * Convenience views for aggregated statistics
-- =====================================================

-- Set character set and collation
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- CORE CONFIGURATION TABLES
-- =====================================================

-- Site Configuration Table (for transferability)
CREATE TABLE `site_config` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) NOT NULL,
  `config_value` text,
  `description` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default Site Configuration (Generic Values)
INSERT INTO `site_config` (`config_key`, `config_value`, `description`) VALUES
('site_domain', 'example.com', 'Primary domain for the website'),
('default_author_name', 'Author Name', 'Default author name for fallbacks'),
('default_author_bio', 'Author & Writer', 'Default author bio'),
('default_author_tagline', 'Stories that captivate and inspire', 'Default author tagline'),
('default_genre_keywords', 'stories, novels, creative writing', 'Default genre keywords for SEO'),
('site_title_suffix', 'Author Website', 'Suffix for page titles'),
('default_meta_description', 'Discover engaging stories and creative writing', 'Default meta description'),
('analytics_enabled', '1', 'Enable/disable analytics tracking'),
('comments_require_approval', '0', 'Require admin approval for comments'),
('max_upload_size', '10485760', 'Maximum file upload size in bytes (10MB)');

-- =====================================================
-- SEO METADATA SYSTEM
-- =====================================================

CREATE TABLE `seo_metadata` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `content_type` enum('story','chapter','gallery','image','page') NOT NULL,
  `content_id` int(10) UNSIGNED DEFAULT NULL,
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` text DEFAULT NULL,
  `og_title` varchar(255) DEFAULT NULL,
  `og_description` text DEFAULT NULL,
  `og_image` varchar(255) DEFAULT NULL,
  `canonical_url` varchar(255) DEFAULT NULL,
  `robots_directive` varchar(100) DEFAULT 'index,follow',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_content` (`content_type`,`content_id`),
  KEY `idx_seo_content_type` (`content_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ANALYTICS SYSTEM (Advanced)
-- =====================================================

-- Daily aggregated content analytics
CREATE TABLE `analytics_daily_content` (
  `day` date NOT NULL,
  `content_type` enum('story','gallery','chapter','image') NOT NULL,
  `content_id` int(11) NOT NULL,
  `parent_type` enum('story','gallery') DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `views` int(11) NOT NULL DEFAULT 0,
  `uniques` int(11) NOT NULL DEFAULT 0,
  `clicks` int(11) NOT NULL DEFAULT 0,
  `completes` int(11) NOT NULL DEFAULT 0,
  `median_depth` double DEFAULT NULL,
  `median_time_s` double DEFAULT NULL,
  PRIMARY KEY (`day`,`content_type`,`content_id`),
  KEY `idx_parent_day` (`parent_type`,`parent_id`,`day`),
  KEY `idx_day` (`day`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Daily histogram data for analytics
CREATE TABLE `analytics_daily_histogram` (
  `day` date NOT NULL,
  `content_type` enum('chapter','image') NOT NULL,
  `content_id` int(11) NOT NULL,
  `metric` enum('depth','time_ms') NOT NULL,
  `bucket` int(11) NOT NULL,
  `count` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`day`,`content_type`,`content_id`,`metric`,`bucket`),
  KEY `idx_day_content` (`day`,`content_type`,`content_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enhanced analytics events with geolocation
CREATE TABLE `analytics_events` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `session_id` char(36) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `event_type` enum('page_view','story_view','gallery_view','image_view','chapter_view','chapter_depth','click') NOT NULL,
  `url_path` varchar(512) NOT NULL,
  `referrer` varchar(512) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `ip_hash` char(64) NOT NULL,
  `country_code` char(2) DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `content_type` enum('site','story','gallery','chapter','image') DEFAULT NULL,
  `content_id` int(11) DEFAULT NULL,
  `parent_type` enum('story','gallery') DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `value_num` double DEFAULT NULL,
  `meta_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`meta_json`)),
  `referrer_host` varchar(255) GENERATED ALWAYS AS (nullif(lcase(substring_index(substring_index(`referrer`,'//',-1),'/',1)),'')) STORED,
  PRIMARY KEY (`id`),
  KEY `idx_created` (`created_at`),
  KEY `idx_event_created` (`event_type`,`created_at`),
  KEY `idx_content_created` (`content_type`,`content_id`,`created_at`),
  KEY `idx_parent_created` (`parent_type`,`parent_id`,`created_at`),
  KEY `idx_session_created` (`session_id`,`created_at`),
  KEY `idx_referrer_host_created` (`referrer_host`,`created_at`),
  KEY `idx_country_created` (`country_code`,`created_at`),
  KEY `idx_region_created` (`region`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- USER MANAGEMENT
-- =====================================================

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(120) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','editor','viewer') NOT NULL DEFAULT 'admin',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default admin user (password: admin123 - CHANGE IMMEDIATELY)
INSERT INTO `users` (`username`, `email`, `password_hash`, `role`) VALUES
('admin', 'admin@example.com', '$2y$10$131VyG6AQ48LQStysKHUEedegPTI5PVOLx7T7vT7r0t7ofnQNZ1di', 'admin');

-- =====================================================
-- AUTHOR PROFILE
-- =====================================================

CREATE TABLE `author_profile` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL DEFAULT 'Author Name',
  `bio` text DEFAULT 'Author & Writer',
  `tagline` varchar(255) DEFAULT 'Stories that captivate and inspire',
  `profile_image` varchar(255) DEFAULT NULL,
  `background_image` varchar(255) DEFAULT NULL,
  `background_image_light` varchar(255) DEFAULT NULL,
  `background_image_dark` varchar(255) DEFAULT NULL,
  `site_domain` varchar(255) DEFAULT 'example.com',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default author profile with generic values
INSERT INTO `author_profile` (`name`, `bio`, `tagline`, `site_domain`) VALUES
('Author Name', 'Author & Writer', 'Stories that captivate and inspire', 'example.com');

-- =====================================================
-- SOCIAL MEDIA LINKS
-- =====================================================

CREATE TABLE `socials` (
  `key_name` varchar(64) NOT NULL,
  `url` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`key_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default social media placeholders (empty URLs - to be configured by admin)
INSERT INTO `socials` (`key_name`, `url`) VALUES
('discord', ''),
('facebook', ''),
('instagram', ''),
('patreon', ''),
('twitter', ''),
('website', ''),
('youtube', ''),
('github', ''),
('tiktok', ''),
('vimeo', ''),
('linkedin', '');

-- =====================================================
-- STORIES AND CHAPTERS
-- =====================================================

CREATE TABLE `stories` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` varchar(100) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `genres` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array of genre tags for SEO and categorization' CHECK (json_valid(`genres`)),
  `primary_keywords` text DEFAULT NULL COMMENT 'Primary SEO keywords, comma-separated',
  `longtail_keywords` text DEFAULT NULL COMMENT 'Long-tail SEO keywords, comma-separated',
  `target_audience` varchar(255) DEFAULT NULL COMMENT 'Target audience description for SEO',
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
  `cover_image` varchar(255) DEFAULT NULL,
  `break_image` varchar(255) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `fk_stories_created_by` (`created_by`),
  KEY `idx_stories_status` (`status`),
  KEY `idx_stories_sort` (`sort_order`),
  KEY `idx_stories_genres` (`genres`(255)),
  CONSTRAINT `fk_stories_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stories metadata with cover and break images';

CREATE TABLE `chapters` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `story_id` int(10) UNSIGNED NOT NULL,
  `chapter_number` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `content` longtext NOT NULL,
  `status` enum('draft','published') NOT NULL DEFAULT 'draft',
  `like_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `comment_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_story_chapter` (`story_id`,`chapter_number`),
  UNIQUE KEY `unique_story_slug` (`story_id`,`slug`),
  KEY `idx_chapters_story` (`story_id`),
  KEY `idx_chapters_status` (`status`),
  CONSTRAINT `fk_chapters_story` FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- GALLERIES AND IMAGES
-- =====================================================

CREATE TABLE `galleries` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` varchar(100) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'published',
  `rating` enum('PG','X') NOT NULL DEFAULT 'PG',
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `image_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `like_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `comment_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `hero_thumb` varchar(255) DEFAULT NULL,
  `hero_width` int(10) UNSIGNED DEFAULT NULL,
  `hero_height` int(10) UNSIGNED DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `fk_galleries_created_by` (`created_by`),
  KEY `idx_galleries_sort` (`sort_order`),
  CONSTRAINT `fk_galleries_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `images` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `gallery_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `alt_text` text DEFAULT NULL,
  `filename` varchar(255) NOT NULL,
  `original_path` varchar(255) NOT NULL,
  `thumbnail_path` varchar(255) NOT NULL,
  `prompt` longtext DEFAULT NULL,
  `parameters` longtext DEFAULT NULL,
  `checkpoint` varchar(255) DEFAULT NULL,
  `loras` longtext DEFAULT NULL,
  `file_size` int(10) UNSIGNED DEFAULT NULL,
  `width` int(10) UNSIGNED DEFAULT NULL,
  `height` int(10) UNSIGNED DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `uploaded_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `like_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `comment_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `fk_images_uploaded_by` (`uploaded_by`),
  KEY `idx_images_gallery` (`gallery_id`),
  KEY `idx_images_sort` (`sort_order`),
  KEY `idx_images_alt_text` (`alt_text`(255)),
  CONSTRAINT `fk_images_gallery` FOREIGN KEY (`gallery_id`) REFERENCES `galleries` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_images_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- COMMENTS SYSTEM
-- =====================================================

CREATE TABLE `chapter_comments` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `chapter_id` int(10) UNSIGNED NOT NULL,
  `author_name` varchar(100) DEFAULT NULL,
  `content` text NOT NULL,
  `is_approved` tinyint(1) NOT NULL DEFAULT 0,
  `ip_address` varchar(45) NOT NULL,
  `user_agent_hash` varchar(64) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approved_by` int(10) UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_chapter_comments_approved_by` (`approved_by`),
  KEY `idx_chapter_comments_chapter` (`chapter_id`),
  KEY `idx_chapter_comments_approved` (`is_approved`),
  KEY `idx_chapter_comments_ip` (`ip_address`),
  KEY `idx_chapter_comments_created` (`created_at`),
  CONSTRAINT `fk_chapter_comments_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_chapter_comments_chapter` FOREIGN KEY (`chapter_id`) REFERENCES `chapters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `image_comments` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `image_id` int(10) UNSIGNED NOT NULL,
  `author_name` varchar(100) DEFAULT NULL,
  `content` text NOT NULL,
  `is_approved` tinyint(1) NOT NULL DEFAULT 0,
  `ip_address` varchar(45) NOT NULL,
  `user_agent_hash` varchar(64) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approved_by` int(10) UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_image_comments_approved_by` (`approved_by`),
  KEY `idx_image_comments_image` (`image_id`),
  KEY `idx_image_comments_approved` (`is_approved`),
  KEY `idx_image_comments_ip` (`ip_address`),
  KEY `idx_image_comments_created` (`created_at`),
  CONSTRAINT `fk_image_comments_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_image_comments_image` FOREIGN KEY (`image_id`) REFERENCES `images` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- LIKES SYSTEM
-- =====================================================

CREATE TABLE `chapter_likes` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `chapter_id` int(10) UNSIGNED NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `user_agent_hash` varchar(64) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_chapter_like` (`chapter_id`,`ip_address`,`user_agent_hash`),
  KEY `idx_chapter_likes_chapter` (`chapter_id`),
  CONSTRAINT `fk_chapter_likes_chapter` FOREIGN KEY (`chapter_id`) REFERENCES `chapters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `image_likes` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `image_id` int(10) UNSIGNED NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `user_agent_hash` varchar(64) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_image_like` (`image_id`,`ip_address`,`user_agent_hash`),
  KEY `idx_image_likes_image` (`image_id`),
  CONSTRAINT `fk_image_likes_image` FOREIGN KEY (`image_id`) REFERENCES `images` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- MODERATION SYSTEM
-- =====================================================

CREATE TABLE `banned_ips` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(45) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `banned_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ip_address` (`ip_address`),
  KEY `fk_banned_ips_banned_by` (`banned_by`),
  KEY `idx_banned_ips_ip` (`ip_address`),
  KEY `idx_banned_ips_expires` (`expires_at`),
  CONSTRAINT `fk_banned_ips_banned_by` FOREIGN KEY (`banned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- RATE LIMITING SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS `rate_limit_agg` (
  `key_name` VARCHAR(191) NOT NULL,
  `window_start` INT UNSIGNED NOT NULL,
  `count` INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`key_name`, `window_start`),
  INDEX `idx_window_start` (`window_start`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Fixed-window rate limiting with atomic counters for security';

-- =====================================================
-- TRIGGERS FOR AUTOMATIC COUNTERS
-- =====================================================

-- Chapter comment count triggers
DELIMITER $$
CREATE TRIGGER `chapter_comments_insert` AFTER INSERT ON `chapter_comments`
FOR EACH ROW BEGIN
  UPDATE chapters SET comment_count = comment_count + 1 WHERE id = NEW.chapter_id;
END$$

CREATE TRIGGER `chapter_comments_delete` AFTER DELETE ON `chapter_comments`
FOR EACH ROW BEGIN
  UPDATE chapters SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.chapter_id;
END$$

-- Chapter like count triggers
CREATE TRIGGER `chapter_likes_insert` AFTER INSERT ON `chapter_likes`
FOR EACH ROW BEGIN
  UPDATE chapters SET like_count = like_count + 1 WHERE id = NEW.chapter_id;
END$$

CREATE TRIGGER `chapter_likes_delete` AFTER DELETE ON `chapter_likes`
FOR EACH ROW BEGIN
  UPDATE chapters SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.chapter_id;
END$$

-- Image comment count triggers
CREATE TRIGGER `image_comments_insert` AFTER INSERT ON `image_comments`
FOR EACH ROW BEGIN
  UPDATE images SET comment_count = comment_count + 1 WHERE id = NEW.image_id;
  UPDATE galleries SET comment_count = comment_count + 1 WHERE id = (SELECT gallery_id FROM images WHERE id = NEW.image_id);
END$$

CREATE TRIGGER `image_comments_delete` AFTER DELETE ON `image_comments`
FOR EACH ROW BEGIN
  UPDATE images SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.image_id;
  UPDATE galleries SET comment_count = GREATEST(0, comment_count - 1) WHERE id = (SELECT gallery_id FROM images WHERE id = OLD.image_id);
END$$

-- Image like count triggers
CREATE TRIGGER `image_likes_insert` AFTER INSERT ON `image_likes`
FOR EACH ROW BEGIN
  UPDATE images SET like_count = like_count + 1 WHERE id = NEW.image_id;
  UPDATE galleries SET like_count = like_count + 1 WHERE id = (SELECT gallery_id FROM images WHERE id = NEW.image_id);
END$$

CREATE TRIGGER `image_likes_delete` AFTER DELETE ON `image_likes`
FOR EACH ROW BEGIN
  UPDATE images SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.image_id;
  UPDATE galleries SET like_count = GREATEST(0, like_count - 1) WHERE id = (SELECT gallery_id FROM images WHERE id = OLD.image_id);
END$$

-- Gallery image count triggers
CREATE TRIGGER `images_insert` AFTER INSERT ON `images`
FOR EACH ROW BEGIN
  UPDATE galleries SET image_count = image_count + 1 WHERE id = NEW.gallery_id;
  -- Set hero image if this is the first image
  UPDATE galleries SET 
    hero_thumb = NEW.thumbnail_path,
    hero_width = NEW.width,
    hero_height = NEW.height
  WHERE id = NEW.gallery_id AND hero_thumb IS NULL;
END$$

CREATE TRIGGER `images_delete` AFTER DELETE ON `images`
FOR EACH ROW BEGIN
  UPDATE galleries SET image_count = GREATEST(0, image_count - 1) WHERE id = OLD.gallery_id;
  -- Clear hero image if this was the hero image
  UPDATE galleries SET 
    hero_thumb = NULL,
    hero_width = NULL,
    hero_height = NULL
  WHERE id = OLD.gallery_id AND hero_thumb = OLD.thumbnail_path;
END$$

DELIMITER ;

-- =====================================================
-- AUTO_INCREMENT SETTINGS
-- =====================================================

ALTER TABLE `analytics_events` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `author_profile` MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `banned_ips` MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `chapters` MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `chapter_comments` MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `chapter_likes` MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `galleries` MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `images` MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `image_comments` MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `image_likes` MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `seo_metadata` MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `site_config` MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `stories` MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `users` MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Story statistics view
CREATE VIEW `story_stats` AS
SELECT 
  s.id,
  s.slug,
  s.title,
  s.status,
  COUNT(c.id) as chapter_count,
  COALESCE(SUM(c.like_count), 0) as total_likes,
  COALESCE(SUM(c.comment_count), 0) as total_comments,
  s.created_at,
  s.updated_at
FROM stories s
LEFT JOIN chapters c ON s.id = c.story_id
GROUP BY s.id, s.slug, s.title, s.status, s.created_at, s.updated_at;

-- Gallery statistics view
CREATE VIEW `gallery_stats` AS
SELECT 
  g.id,
  g.slug,
  g.title,
  g.rating,
  g.image_count,
  g.like_count,
  g.comment_count,
  g.hero_thumb,
  g.created_at,
  g.updated_at
FROM galleries g;

-- =====================================================
-- ENABLE FOREIGN KEY CHECKS
-- =====================================================

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================
-- This unified schema provides:
-- 1. Complete CMS functionality
-- 2. Generic defaults for transferability
-- 3. Site configuration system
-- 4. SEO enhancements
-- 5. Analytics tracking
-- 6. Automatic counter maintenance
-- 7. Performance optimizations
-- 8. Rate limiting for security (brute force protection)
--
-- Rate Limiting Details:
-- - Login: 10 attempts per 15 minutes per IP+username (fail-closed)
-- - Chapter Comments: 5 comments per minute per IP (fail-open)
-- - Gallery Comments: 20 comments per minute per IP (fail-open)
-- - Uses atomic fixed-window algorithm (no race conditions)
-- - Returns standard X-RateLimit-* headers
--
-- Next steps:
-- 1. Import this schema to your database
-- 2. Configure site settings through admin panel
-- 3. Update application code to use generic fallbacks
-- 4. Test transferability on staging environment
-- 5. Set up daily cron for rate limit cleanup (see api/cron/cleanup-rate-limits.php)
-- =====================================================
