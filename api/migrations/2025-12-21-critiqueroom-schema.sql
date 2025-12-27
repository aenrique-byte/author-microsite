-- CritiqueRoom Database Schema Migration
-- Date: 2025-12-21
-- Description: Creates all tables needed for the CritiqueRoom feature

-- Table 1: critiqueroom_sessions
-- Stores critique sessions created by authors
CREATE TABLE IF NOT EXISTS critiqueroom_sessions (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID for session',
  title VARCHAR(255) NOT NULL,
  content LONGTEXT NOT NULL COMMENT 'Manuscript text content',
  author_id INT(10) UNSIGNED NULL COMMENT 'FK to users.id if Discord logged in',
  author_name VARCHAR(100) NOT NULL COMMENT 'Display name for session creator',
  author_discord_id VARCHAR(100) NULL COMMENT 'Discord user ID if logged in',
  modes JSON NOT NULL COMMENT 'Array of FeedbackMode enums',
  questions JSON NOT NULL COMMENT 'Array of custom questions from author',
  sections JSON NOT NULL COMMENT 'Array of WritingSection objects (chapters/breaks)',
  expiration ENUM('24 Hours', '72 Hours', '7 Days', 'No Expiration') DEFAULT '7 Days',
  font_combo ENUM('LITERARY', 'MODERN', 'PAPERBACK') DEFAULT 'MODERN',
  password_hash VARCHAR(255) NULL COMMENT 'bcrypt hash if password-protected',
  created_at BIGINT NOT NULL COMMENT 'Unix timestamp in milliseconds',
  expires_at BIGINT NULL COMMENT 'Calculated expiration timestamp (NULL = never)',
  extension_count INT DEFAULT 0 COMMENT 'Number of times session has been extended',

  INDEX idx_author_id (author_id),
  INDEX idx_author_discord_id (author_discord_id),
  INDEX idx_expires_at (expires_at),
  INDEX idx_created_at (created_at),

  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 2: critiqueroom_comments
-- Stores inline and paragraph-level comments from reviewers
CREATE TABLE IF NOT EXISTS critiqueroom_comments (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID for comment',
  session_id VARCHAR(36) NOT NULL,
  paragraph_index INT NOT NULL COMMENT 'Which paragraph this comment is on',
  start_offset INT NULL COMMENT 'Character offset for inline highlight start',
  end_offset INT NULL COMMENT 'Character offset for inline highlight end',
  text_selection TEXT NULL COMMENT 'The actual text that was highlighted',
  content TEXT NOT NULL COMMENT 'The comment content',
  author_name VARCHAR(100) NOT NULL COMMENT 'Display name (Flower or Discord username)',
  author_discord_id VARCHAR(100) NULL COMMENT 'Discord user ID if logged in',
  timestamp BIGINT NOT NULL COMMENT 'Unix timestamp in milliseconds',
  status ENUM('open', 'resolved', 'implemented') DEFAULT 'open',
  rating ENUM('useful', 'irrelevant', 'unclear') NULL COMMENT 'Author rating of comment',

  INDEX idx_session_id (session_id),
  INDEX idx_paragraph_index (paragraph_index),
  INDEX idx_status (status),
  INDEX idx_timestamp (timestamp),

  FOREIGN KEY (session_id) REFERENCES critiqueroom_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3: critiqueroom_replies
-- Stores threaded replies to comments
CREATE TABLE IF NOT EXISTS critiqueroom_replies (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID for reply',
  comment_id VARCHAR(36) NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  author_discord_id VARCHAR(100) NULL,
  content TEXT NOT NULL,
  timestamp BIGINT NOT NULL COMMENT 'Unix timestamp in milliseconds',

  INDEX idx_comment_id (comment_id),
  INDEX idx_timestamp (timestamp),

  FOREIGN KEY (comment_id) REFERENCES critiqueroom_comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 4: critiqueroom_global_feedback
-- Stores big-picture feedback (what worked, what didn't, overall thoughts)
CREATE TABLE IF NOT EXISTS critiqueroom_global_feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL,
  category ENUM('overall', 'worked', 'didnt-work', 'confusing') NOT NULL,
  text TEXT NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  author_discord_id VARCHAR(100) NULL,
  timestamp BIGINT NOT NULL COMMENT 'Unix timestamp in milliseconds',

  INDEX idx_session_id (session_id),
  INDEX idx_category (category),
  INDEX idx_timestamp (timestamp),

  FOREIGN KEY (session_id) REFERENCES critiqueroom_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 5: critiqueroom_discord_users (Optional)
-- Caches Discord user profile data to reduce API calls
CREATE TABLE IF NOT EXISTS critiqueroom_discord_users (
  discord_id VARCHAR(100) PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  discriminator VARCHAR(10) NOT NULL COMMENT 'Legacy Discord discriminator (deprecated)',
  global_name VARCHAR(100) NULL COMMENT 'New Discord display name',
  avatar_hash VARCHAR(100) NULL,
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
