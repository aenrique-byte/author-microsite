-- MySQL Schema for Shoutout Manager
-- Database: u473142779_authorsite2
-- 
-- This schema converts the LocalStorage-based application to MySQL
-- The 'users' table is assumed to already exist for admin authentication

-- ============================================
-- TABLE: users (assumed to already exist)
-- ============================================
-- CREATE TABLE IF NOT EXISTS users (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     username VARCHAR(255) NOT NULL UNIQUE,
--     email VARCHAR(255) DEFAULT NULL,
--     password_hash VARCHAR(255) NOT NULL,
--     role ENUM('admin', 'user') DEFAULT 'user',
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     last_login TIMESTAMP NULL DEFAULT NULL
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: shoutout_config
-- ============================================
-- Stores global application configuration
CREATE TABLE IF NOT EXISTS shoutout_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default config
INSERT INTO shoutout_config (config_key, config_value) VALUES 
('monthsToShow', '3')
ON DUPLICATE KEY UPDATE config_value = config_value;

-- ============================================
-- TABLE: shoutout_stories
-- ============================================
-- Stores Royal Road stories/books
CREATE TABLE IF NOT EXISTS shoutout_stories (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    link VARCHAR(500) NOT NULL,
    cover_image VARCHAR(500) NOT NULL,
    color ENUM('amber', 'blue', 'rose', 'emerald', 'violet', 'cyan') DEFAULT 'amber',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default story
INSERT INTO shoutout_stories (id, title, link, cover_image, color) VALUES 
('default', 'My Royal Road Story', 'https://www.royalroad.com/fiction/12345/my-story', 'https://picsum.photos/400/600', 'amber')
ON DUPLICATE KEY UPDATE title = title;

-- ============================================
-- TABLE: shoutout_admin_shoutouts
-- ============================================
-- Stores shoutout templates/codes for stories
CREATE TABLE IF NOT EXISTS shoutout_admin_shoutouts (
    id VARCHAR(50) PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    code TEXT NOT NULL,
    story_id VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES shoutout_stories(id) ON DELETE CASCADE,
    INDEX idx_story_id (story_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default shoutout
INSERT INTO shoutout_admin_shoutouts (id, label, code, story_id) VALUES 
('1', 'Main Shoutout', '<div style="border: 1px solid #ccc; padding: 10px;"><strong>My Story</strong><br><a href="#">Read Now</a></div>', 'default')
ON DUPLICATE KEY UPDATE label = label;

-- ============================================
-- TABLE: shoutout_availability
-- ============================================
-- Stores available dates for shoutout bookings per story
CREATE TABLE IF NOT EXISTS shoutout_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date_str DATE NOT NULL,
    story_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES shoutout_stories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_date_story (date_str, story_id),
    INDEX idx_date_str (date_str),
    INDEX idx_story_id (story_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: shoutout_bookings
-- ============================================
-- Stores shoutout booking requests from authors
CREATE TABLE IF NOT EXISTS shoutout_bookings (
    id VARCHAR(50) PRIMARY KEY,
    date_str DATE NOT NULL,
    story_id VARCHAR(50) NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    story_link VARCHAR(500) NOT NULL,
    shoutout_code TEXT NOT NULL,
    email VARCHAR(255) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES shoutout_stories(id) ON DELETE CASCADE,
    INDEX idx_date_str (date_str),
    INDEX idx_story_id (story_id),
    INDEX idx_status (status),
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SUMMARY OF TABLES
-- ============================================
-- 
-- 1. users (existing) - Admin authentication
--    - id, username, email, password_hash, role, created_at, last_login
--
-- 2. shoutout_config - Application configuration
--    - id, config_key, config_value, updated_at
--
-- 3. shoutout_stories - Royal Road stories/books
--    - id, title, link, cover_image, color, created_at, updated_at
--
-- 4. shoutout_admin_shoutouts - Shoutout templates
--    - id, label, code, story_id, created_at, updated_at
--
-- 5. shoutout_availability - Available booking dates
--    - id, date_str, story_id, created_at
--
-- 6. shoutout_bookings - Author booking requests
--    - id, date_str, story_id, author_name, story_link, shoutout_code, 
--      email, status, created_at, updated_at
--
-- ============================================
-- RELATIONSHIPS
-- ============================================
--
-- shoutout_stories (1) -> (many) shoutout_admin_shoutouts
-- shoutout_stories (1) -> (many) shoutout_availability
-- shoutout_stories (1) -> (many) shoutout_bookings
--
-- ============================================
-- NOTES
-- ============================================
--
-- 1. The 'users' table is assumed to already exist in your database
-- 2. All foreign keys use CASCADE DELETE to maintain referential integrity
-- 3. Indexes are added for common query patterns
-- 4. UTF8MB4 charset supports emoji and international characters
-- 5. TIMESTAMP fields auto-update for tracking changes
-- 6. Default values match the LocalStorage implementation
