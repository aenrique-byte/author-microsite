# CritiqueRoom Implementation Plan

## 📋 Implementation Checklist

### Phase 1: Database Setup
- [x] Create `critiqueroom_sessions` table
- [x] Create `critiqueroom_comments` table
- [x] Create `critiqueroom_replies` table
- [x] Create `critiqueroom_global_feedback` table
- [x] Create `critiqueroom_discord_users` table (optional cache)
- [x] Add database migration file to `/api/migrations/`
- [x] Run migration on development database
- [x] Verify indexes and foreign keys are working

### Phase 2: Discord OAuth Setup
- [x] Create Discord application in Developer Portal
- [x] Configure OAuth2 redirect URIs (production + dev)
- [x] Save Client ID and Client Secret
- [x] Add Discord credentials to `/api/config.php`
- [ ] Test OAuth flow manually with redirect URLs

### Phase 3: Backend API Development
- [x] Create `/api/critiqueroom/` directory structure
- [x] Implement session endpoints:
  - [x] `sessions/create.php` - Create new critique session
  - [x] `sessions/get.php` - Retrieve session by ID
  - [x] `sessions/update.php` - Update session (author only)
  - [x] `sessions/delete.php` - Delete session (author only)
  - [x] `sessions/list.php` - List user's sessions (auth required)
- [x] Implement comment endpoints:
  - [x] `comments/create.php` - Add inline/paragraph comment
  - [x] `comments/update.php` - Update comment status/rating (author only)
  - [x] `comments/reply.php` - Reply to a comment
- [x] Implement feedback endpoints:
  - [x] `feedback/create.php` - Add global feedback
- [x] Implement auth endpoints:
  - [x] `auth/discord.php` - Initiate Discord OAuth
  - [x] `auth/callback.php` - Handle Discord callback
  - [x] `auth/me.php` - Get current Discord user
  - [x] `auth/logout.php` - Logout Discord session
- [x] Add rate limiting rules for CritiqueRoom endpoints
- [x] Add input validation and sanitization
- [ ] Test all endpoints with Postman/curl

### Phase 4: Frontend Integration into src/
- [x] Create feature directory: `src/features/critiqueroom/`
- [x] Move existing components from `critiqueroom/` to new structure:
  - [x] `critiqueroom/pages/` → `src/features/critiqueroom/components/`
  - [x] `critiqueroom/types.ts` → `src/features/critiqueroom/types.ts`
  - [x] `critiqueroom/App.tsx` → Split into CritiqueRoomRoute.tsx + components
- [x] Create `src/features/critiqueroom/utils/api-critiqueroom.ts` (API service)
- [x] Replace localStorage calls with API calls from api-critiqueroom.ts
- [x] Create `src/features/critiqueroom/CritiqueRoomRoute.tsx` (main route component)
  - [x] Implement dynamic background system (theme-aware, uses getRandomBackground)
  - [x] Fetch author profile for custom backgrounds
  - [x] Fetch homepage settings for brand colors
  - [x] Add theme detection and polling (100ms interval)
  - [x] Add background overlay layer
  - [x] Inject brand color CSS variables
- [x] Create `src/features/critiqueroom/index.ts` (export CritiqueRoomRoute)
- [x] Migrate components with standard layout:
  - [x] `UploadPage.tsx` → `WriterWorkspace.tsx`:
    - [x] Add PageNavbar with breadcrumbs
    - [x] Add SocialIcons footer
    - [x] Integrate API for session creation
  - [x] `FeedbackPage.tsx` → `CritiqueSession.tsx`:
    - [x] Add PageNavbar with breadcrumbs
    - [x] Add SocialIcons footer
    - [x] Fetch session from API
  - [x] `LandingPage.tsx` → `CritiqueRoomHome.tsx`:
    - [x] Add PageNavbar (no breadcrumbs on home)
    - [ ] Add NewsletterCTA component (card variant) - deferred to Phase 5
    - [ ] Add PatreonCTA component (card or banner variant) - deferred to Phase 5
    - [x] Add SocialIcons footer
- [x] Implement real Discord OAuth login (replace mock connectDiscord)
- [x] Add loading states for API calls
- [x] Add error handling for failed API requests
- [x] Update session expiration logic to use server timestamps
- [ ] Test anonymous user flow (no login) - requires backend testing
- [ ] Test Discord logged-in user flow - requires backend testing
- [x] Add SessionList.tsx component for user's session management
- [x] Add route to `src/app/router.tsx`: `/critiqueroom/*`

### Phase 5: Integration with Main Website
- [x] Add route to `src/app/router.tsx`: `/critiqueroom/*`
- [x] Add CritiqueRoom link to `src/components/PageNavbar.tsx`
- [x] Update PageNavbar navigation items to include CritiqueRoom
- [x] Integrate with existing AuthContext for session management
- [x] Apply consistent theming (use ThemeContext if needed)
- [x] Test routing between main site and CritiqueRoom
- [x] Verify CritiqueRoom respects light/dark theme toggle

### Phase 6: User Management Integration
- [x] **Decision: Keep Discord auth separate from main users table (Discord-only for CritiqueRoom)**
- [x] Existing schema already supports this with nullable `author_id` field
- [x] No additional integration needed - Phase 6 marked as complete (N/A)

### Phase 7: Cleanup & Maintenance
- [x] Create `/api/cron/cleanup-critiqueroom.php` for expired sessions
- [x] Add cron job to run cleanup script hourly
- [x] Test automatic deletion of expired sessions (to be tested on production server)
- [x] Add logging for cleanup operations
- [x] Create comprehensive documentation in `/api/cron/README.md`

### Phase 8: Security Hardening
- [ ] Add rate limiting: 5 sessions per hour per IP
- [ ] Add rate limiting: 10 comments per minute per session
- [ ] Implement XSS sanitization for comment content
- [ ] Verify CSRF protection on Discord OAuth state parameter
- [ ] Add content size validation (500KB max per session)
- [ ] Test session ownership validation on update/delete
- [ ] Security audit: SQL injection prevention
- [ ] Security audit: Authentication bypass attempts

### Phase 9: Testing & QA
- [ ] Test full anonymous user flow (create → share → comment)
- [ ] Test Discord login flow (authorize → create → manage sessions)
- [ ] Test session password protection
- [ ] Test session expiration (24h, 72h, 7 days, never)
- [ ] Test comment threading and replies
- [ ] Test author controls (approve/reject comments)
- [ ] Test export functionality
- [ ] Test responsive design on mobile
- [ ] Browser compatibility testing (Chrome, Firefox, Safari, Edge)

### Phase 10: Deployment
- [ ] Update production `config.php` with Discord credentials
- [ ] Run database migration on production
- [ ] Deploy updated API endpoints
- [ ] Build main React app with CritiqueRoom feature (`npm run build`)
- [ ] Deploy updated frontend build to production
- [ ] Set up cron job on production server
- [ ] Test production Discord OAuth callback
- [ ] Monitor error logs for first 24 hours
- [ ] Create user documentation/help guide

### Phase 11: Optional Enhancements
- [ ] Real-time updates with WebSockets (Socket.io)
- [ ] Email notifications for new comments (if Discord user)
- [ ] Export to PDF format
- [ ] Collaborative editing features
- [ ] AI-assisted critique suggestions (Gemini integration)
- [ ] Discord bot integration for notifications
- [ ] Analytics tracking for session usage

### Phase 12: Session Extension Feature
- [ ] Add `extension_count` column to `critiqueroom_sessions` table
- [ ] Create `/api/critiqueroom/sessions/extend.php` endpoint
- [ ] Add "Extend +7 Days" button to SessionList component
- [ ] Show extension usage count (e.g., "2/3 extensions used")
- [ ] Enforce max 3 extensions per session
- [ ] Update frontend to display extension status
- [ ] Test extension functionality

**Extension Rules:**
- Each session can be extended max 3 times
- Each extension adds 7 days from current time
- Max total lifespan: 28 days (7 initial + 3×7 extensions)
- Only session owner can extend (Discord auth required)
- "No Expiration" sessions cannot be extended (already permanent)

---

## 🗄️ Database Schema

### 1. critiqueroom_sessions

Stores critique sessions created by authors.

```sql
CREATE TABLE critiqueroom_sessions (
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
```

**Sample Data:**
```json
{
  "id": "a3f2c1d4-5e6b-7c8d-9e0f-1a2b3c4d5e6f",
  "title": "Chapter 1: The Awakening",
  "content": "The sun rose over the distant mountains...",
  "author_id": null,
  "author_name": "WriterPerson",
  "modes": ["Line-level feedback", "Character voice"],
  "questions": ["Does the opening hook you?", "Is the pacing too slow?"],
  "sections": [
    {"id": "s1", "label": "Scene 1: Morning", "paragraphIndex": 0},
    {"id": "s2", "label": "Scene 2: The Letter", "paragraphIndex": 5}
  ],
  "expiration": "7 Days",
  "font_combo": "LITERARY",
  "created_at": 1703001600000,
  "expires_at": 1703606400000
}
```

---

### 2. critiqueroom_comments

Stores inline and paragraph-level comments from reviewers.

```sql
CREATE TABLE critiqueroom_comments (
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
```

**Sample Data:**
```json
{
  "id": "c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6",
  "session_id": "a3f2c1d4-5e6b-7c8d-9e0f-1a2b3c4d5e6f",
  "paragraph_index": 2,
  "start_offset": 15,
  "end_offset": 42,
  "text_selection": "the sun rose over mountains",
  "content": "This feels a bit cliché. Maybe try a more unique opening image?",
  "author_name": "Lavender",
  "author_discord_id": null,
  "timestamp": 1703002000000,
  "status": "open",
  "rating": null
}
```

---

### 3. critiqueroom_replies

Stores threaded replies to comments.

```sql
CREATE TABLE critiqueroom_replies (
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
```

**Sample Data:**
```json
{
  "id": "r1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6",
  "comment_id": "c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6",
  "author_name": "WriterPerson",
  "author_discord_id": null,
  "content": "Good point! I'll rework this opening.",
  "timestamp": 1703002300000
}
```

---

### 4. critiqueroom_global_feedback

Stores big-picture feedback (what worked, what didn't, overall thoughts).

```sql
CREATE TABLE critiqueroom_global_feedback (
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
```

**Sample Data:**
```json
{
  "id": 1,
  "session_id": "a3f2c1d4-5e6b-7c8d-9e0f-1a2b3c4d5e6f",
  "category": "worked",
  "text": "The dialogue felt natural and the pacing kept me engaged throughout.",
  "author_name": "Rose",
  "author_discord_id": null,
  "timestamp": 1703003000000
}
```

---

### 5. critiqueroom_discord_users (Optional)

Caches Discord user profile data to reduce API calls.

```sql
CREATE TABLE critiqueroom_discord_users (
  discord_id VARCHAR(100) PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  discriminator VARCHAR(10) NOT NULL COMMENT 'Legacy Discord discriminator (deprecated)',
  global_name VARCHAR(100) NULL COMMENT 'New Discord display name',
  avatar_hash VARCHAR(100) NULL,
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🔐 Discord OAuth2 Integration

### Step 1: Discord Developer Portal Setup

1. Navigate to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"**
3. Name it **"CritiqueRoom"** or your website name
4. Click **"OAuth2"** in the left sidebar
5. Under **"Redirects"**, add:
   - **Production**: `https://yourdomain.com/api/critiqueroom/auth/callback.php`
   - **Development**: `http://localhost:5173/api/critiqueroom/auth/callback.php`
6. Click **"Save Changes"**
7. Copy your **Client ID** and **Client Secret**

### Step 2: Add to Configuration

Edit `/api/config.php`:

```php
// Discord OAuth Configuration
define('DISCORD_CLIENT_ID', 'your_client_id_here');
define('DISCORD_CLIENT_SECRET', 'your_client_secret_here');
define('DISCORD_REDIRECT_URI', BASE_URL . '/api/critiqueroom/auth/callback.php');
define('DISCORD_API_ENDPOINT', 'https://discord.com/api/v10');

// CritiqueRoom Settings
define('CRITIQUEROOM_MAX_SESSION_SIZE', 500000); // 500KB max content
define('CRITIQUEROOM_CLEANUP_INTERVAL', 3600); // Cleanup every hour
define('CRITIQUEROOM_SESSION_COOKIE', 'critiqueroom_session');
define('CRITIQUEROOM_RATE_LIMIT_SESSIONS', 5); // 5 sessions per hour
define('CRITIQUEROOM_RATE_LIMIT_COMMENTS', 10); // 10 comments per minute
```

### Step 3: OAuth Flow Implementation

#### `/api/critiqueroom/auth/discord.php`

Initiates the OAuth flow by redirecting to Discord.

```php
<?php
require_once __DIR__ . '/../../bootstrap.php';

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Generate CSRF state token
$state = bin2hex(random_bytes(32));
$_SESSION['discord_oauth_state'] = $state;

// Store return URL if provided
if (isset($_GET['return_to'])) {
    $_SESSION['discord_oauth_return'] = $_GET['return_to'];
}

// Build Discord authorization URL
$params = [
    'client_id' => DISCORD_CLIENT_ID,
    'redirect_uri' => DISCORD_REDIRECT_URI,
    'response_type' => 'code',
    'scope' => 'identify',
    'state' => $state
];

$authUrl = 'https://discord.com/api/oauth2/authorize?' . http_build_query($params);

header('Location: ' . $authUrl);
exit;
```

#### `/api/critiqueroom/auth/callback.php`

Handles the OAuth callback from Discord.

```php
<?php
require_once __DIR__ . '/../../bootstrap.php';

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Verify state parameter (CSRF protection)
if (!isset($_GET['state']) || $_GET['state'] !== $_SESSION['discord_oauth_state']) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid state parameter']);
    exit;
}

// Check for error from Discord
if (isset($_GET['error'])) {
    http_response_code(400);
    echo json_encode(['error' => $_GET['error']]);
    exit;
}

// Verify code parameter
if (!isset($_GET['code'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing authorization code']);
    exit;
}

$code = $_GET['code'];

// Exchange code for access token
$tokenData = [
    'client_id' => DISCORD_CLIENT_ID,
    'client_secret' => DISCORD_CLIENT_SECRET,
    'grant_type' => 'authorization_code',
    'code' => $code,
    'redirect_uri' => DISCORD_REDIRECT_URI
];

$ch = curl_init('https://discord.com/api/v10/oauth2/token');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query($tokenData),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded']
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to exchange code for token']);
    exit;
}

$tokenResponse = json_decode($response, true);
$accessToken = $tokenResponse['access_token'];

// Fetch user info
$ch = curl_init('https://discord.com/api/v10/users/@me');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $accessToken]
]);

$userResponse = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch user info']);
    exit;
}

$discordUser = json_decode($userResponse, true);

// Cache user in database (optional)
try {
    $stmt = $pdo->prepare("
        INSERT INTO critiqueroom_discord_users (discord_id, username, discriminator, global_name, avatar_hash)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            username = VALUES(username),
            discriminator = VALUES(discriminator),
            global_name = VALUES(global_name),
            avatar_hash = VALUES(avatar_hash),
            cached_at = CURRENT_TIMESTAMP
    ");

    $stmt->execute([
        $discordUser['id'],
        $discordUser['username'],
        $discordUser['discriminator'] ?? '0',
        $discordUser['global_name'] ?? null,
        $discordUser['avatar'] ?? null
    ]);
} catch (PDOException $e) {
    error_log('Failed to cache Discord user: ' . $e->getMessage());
}

// Store in session
$_SESSION['discord_user'] = [
    'id' => $discordUser['id'],
    'username' => $discordUser['username'],
    'discriminator' => $discordUser['discriminator'] ?? '0',
    'global_name' => $discordUser['global_name'] ?? null,
    'avatar' => $discordUser['avatar'] ?? null,
    'display_name' => $discordUser['global_name'] ?? $discordUser['username']
];

// Redirect back to CritiqueRoom
$returnUrl = $_SESSION['discord_oauth_return'] ?? '/critiqueroom/';
unset($_SESSION['discord_oauth_state']);
unset($_SESSION['discord_oauth_return']);

header('Location: ' . $returnUrl);
exit;
```

#### `/api/critiqueroom/auth/me.php`

Returns the currently logged-in Discord user.

```php
<?php
require_once __DIR__ . '/../../bootstrap.php';

header('Content-Type: application/json');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['discord_user'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

echo json_encode([
    'user' => $_SESSION['discord_user']
]);
```

#### `/api/critiqueroom/auth/logout.php`

Logs out the Discord user.

```php
<?php
require_once __DIR__ . '/../../bootstrap.php';

header('Content-Type: application/json');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

unset($_SESSION['discord_user']);

echo json_encode(['success' => true]);
```

---

## 📡 Backend API Endpoints

### Session Management

#### `POST /api/critiqueroom/sessions/create.php`

Creates a new critique session.

**Request Body:**
```json
{
  "title": "Chapter 1: The Awakening",
  "content": "The sun rose over the distant mountains...",
  "authorName": "WriterPerson",
  "modes": ["Line-level feedback", "Character voice"],
  "questions": ["Does the opening hook you?"],
  "sections": [
    {"id": "s1", "label": "Scene 1", "paragraphIndex": 0}
  ],
  "expiration": "7 Days",
  "fontCombo": "LITERARY",
  "password": "optional-password"
}
```

**Response:**
```json
{
  "id": "a3f2c1d4-5e6b-7c8d-9e0f-1a2b3c4d5e6f",
  "createdAt": 1703001600000,
  "expiresAt": 1703606400000
}
```

**Implementation:**
```php
<?php
require_once __DIR__ . '/../../../bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Parse JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
$required = ['title', 'content', 'authorName', 'modes', 'questions', 'sections', 'expiration', 'fontCombo'];
foreach ($required as $field) {
    if (!isset($input[$field])) {
        http_response_code(400);
        echo json_encode(['error' => "Missing required field: $field"]);
        exit;
    }
}

// Validate content size
if (strlen($input['content']) > CRITIQUEROOM_MAX_SESSION_SIZE) {
    http_response_code(413);
    echo json_encode(['error' => 'Content too large (max 500KB)']);
    exit;
}

// Rate limiting check (5 sessions per hour per IP)
// ... implement using existing rate limiting system ...

// Generate UUID
$sessionId = sprintf(
    '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
    mt_rand(0, 0xffff), mt_rand(0, 0xffff),
    mt_rand(0, 0xffff),
    mt_rand(0, 0x0fff) | 0x4000,
    mt_rand(0, 0x3fff) | 0x8000,
    mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
);

$createdAt = round(microtime(true) * 1000);

// Calculate expiration
$expiresAt = null;
switch ($input['expiration']) {
    case '24 Hours':
        $expiresAt = $createdAt + (24 * 60 * 60 * 1000);
        break;
    case '72 Hours':
        $expiresAt = $createdAt + (72 * 60 * 60 * 1000);
        break;
    case '7 Days':
        $expiresAt = $createdAt + (7 * 24 * 60 * 60 * 1000);
        break;
    case 'No Expiration':
        $expiresAt = null;
        break;
}

// Get author ID if Discord logged in
session_start();
$authorId = $_SESSION['discord_user']['id'] ?? null;

// Hash password if provided
$passwordHash = null;
if (isset($input['password']) && !empty($input['password'])) {
    $passwordHash = password_hash($input['password'], PASSWORD_ARGON2ID);
}

// Insert session
try {
    $stmt = $pdo->prepare("
        INSERT INTO critiqueroom_sessions
        (id, title, content, author_id, author_name, modes, questions, sections,
         expiration, font_combo, password_hash, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $sessionId,
        $input['title'],
        $input['content'],
        $authorId,
        $input['authorName'],
        json_encode($input['modes']),
        json_encode($input['questions']),
        json_encode($input['sections']),
        $input['expiration'],
        $input['fontCombo'],
        $passwordHash,
        $createdAt,
        $expiresAt
    ]);

    echo json_encode([
        'id' => $sessionId,
        'createdAt' => $createdAt,
        'expiresAt' => $expiresAt
    ]);
} catch (PDOException $e) {
    error_log('Failed to create session: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create session']);
}
```

---

#### `GET /api/critiqueroom/sessions/get.php?id={sessionId}&password={password}`

Retrieves a session by ID.

**Response:**
```json
{
  "id": "a3f2c1d4-5e6b-7c8d-9e0f-1a2b3c4d5e6f",
  "title": "Chapter 1: The Awakening",
  "content": "The sun rose...",
  "authorName": "WriterPerson",
  "modes": ["Line-level feedback"],
  "questions": ["Does the opening hook you?"],
  "sections": [...],
  "expiration": "7 Days",
  "fontCombo": "LITERARY",
  "createdAt": 1703001600000,
  "expiresAt": 1703606400000,
  "comments": [...],
  "globalFeedback": [...],
  "isAuthor": false,
  "passwordProtected": false
}
```

**Implementation:**
```php
<?php
require_once __DIR__ . '/../../../bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$sessionId = $_GET['id'] ?? null;
if (!$sessionId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing session ID']);
    exit;
}

// Fetch session
try {
    $stmt = $pdo->prepare("SELECT * FROM critiqueroom_sessions WHERE id = ?");
    $stmt->execute([$sessionId]);
    $session = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$session) {
        http_response_code(404);
        echo json_encode(['error' => 'Session not found']);
        exit;
    }

    // Check expiration
    if ($session['expires_at'] && $session['expires_at'] < round(microtime(true) * 1000)) {
        http_response_code(410);
        echo json_encode(['error' => 'Session expired']);
        exit;
    }

    // Check password protection
    if ($session['password_hash']) {
        session_start();
        $isAuthor = isset($_SESSION['discord_user']) && $_SESSION['discord_user']['id'] === $session['author_id'];

        if (!$isAuthor) {
            $password = $_GET['password'] ?? null;
            if (!$password || !password_verify($password, $session['password_hash'])) {
                http_response_code(401);
                echo json_encode([
                    'error' => 'Password required',
                    'passwordProtected' => true
                ]);
                exit;
            }
        }
    }

    // Fetch comments
    $stmt = $pdo->prepare("
        SELECT * FROM critiqueroom_comments
        WHERE session_id = ?
        ORDER BY paragraph_index, timestamp
    ");
    $stmt->execute([$sessionId]);
    $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch replies for each comment
    foreach ($comments as &$comment) {
        $stmt = $pdo->prepare("
            SELECT * FROM critiqueroom_replies
            WHERE comment_id = ?
            ORDER BY timestamp
        ");
        $stmt->execute([$comment['id']]);
        $comment['replies'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Fetch global feedback
    $stmt = $pdo->prepare("
        SELECT * FROM critiqueroom_global_feedback
        WHERE session_id = ?
        ORDER BY timestamp
    ");
    $stmt->execute([$sessionId]);
    $globalFeedback = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Determine if current user is author
    session_start();
    $isAuthor = isset($_SESSION['discord_user']) && $_SESSION['discord_user']['id'] === $session['author_id'];

    // Parse JSON fields
    $session['modes'] = json_decode($session['modes'], true);
    $session['questions'] = json_decode($session['questions'], true);
    $session['sections'] = json_decode($session['sections'], true);

    // Remove sensitive data
    unset($session['password_hash']);
    unset($session['author_id']);

    echo json_encode([
        ...$session,
        'comments' => $comments,
        'globalFeedback' => $globalFeedback,
        'isAuthor' => $isAuthor,
        'passwordProtected' => !empty($session['password_hash'])
    ]);

} catch (PDOException $e) {
    error_log('Failed to fetch session: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch session']);
}
```

---

#### `POST /api/critiqueroom/sessions/extend.php`

Extends a session's expiration by 7 days (max 3 extensions per session).

**Request Body:**
```json
{
  "sessionId": "a3f2c1d4-5e6b-7c8d-9e0f-1a2b3c4d5e6f"
}
```

**Response:**
```json
{
  "success": true,
  "newExpiresAt": 1704211200000,
  "extensionCount": 1,
  "extensionsRemaining": 2
}
```

**Implementation:**
```php
<?php
require_once __DIR__ . '/../../../bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

session_start();

// Verify Discord user is logged in
if (!isset($_SESSION['discord_user'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$sessionId = $input['sessionId'] ?? null;

if (!$sessionId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing session ID']);
    exit;
}

try {
    // Fetch session
    $stmt = $pdo->prepare("SELECT * FROM critiqueroom_sessions WHERE id = ?");
    $stmt->execute([$sessionId]);
    $session = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$session) {
        http_response_code(404);
        echo json_encode(['error' => 'Session not found']);
        exit;
    }

    // Verify ownership
    if ($session['author_discord_id'] !== $_SESSION['discord_user']['id']) {
        http_response_code(403);
        echo json_encode(['error' => 'Only the session owner can extend expiration']);
        exit;
    }

    // Check if session has "No Expiration"
    if ($session['expires_at'] === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Permanent sessions cannot be extended']);
        exit;
    }

    // Check extension limit (max 3)
    $extensionCount = $session['extension_count'] ?? 0;
    if ($extensionCount >= 3) {
        http_response_code(400);
        echo json_encode([
            'error' => 'Maximum extensions reached (3/3)',
            'extensionCount' => $extensionCount
        ]);
        exit;
    }

    // Add 7 days (in milliseconds)
    $now = round(microtime(true) * 1000);
    $sevenDays = 7 * 24 * 60 * 60 * 1000;
    $newExpiresAt = max($now, $session['expires_at']) + $sevenDays;
    $newExtensionCount = $extensionCount + 1;

    // Update session
    $stmt = $pdo->prepare("
        UPDATE critiqueroom_sessions
        SET expires_at = ?, extension_count = ?
        WHERE id = ?
    ");
    $stmt->execute([$newExpiresAt, $newExtensionCount, $sessionId]);

    echo json_encode([
        'success' => true,
        'newExpiresAt' => $newExpiresAt,
        'extensionCount' => $newExtensionCount,
        'extensionsRemaining' => 3 - $newExtensionCount
    ]);

} catch (PDOException $e) {
    error_log('Failed to extend session: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to extend session']);
}
```

---

### Comment Management

#### `POST /api/critiqueroom/comments/create.php`

Adds a comment to a session.

**Request Body:**
```json
{
  "sessionId": "a3f2c1d4-5e6b-7c8d-9e0f-1a2b3c4d5e6f",
  "paragraphIndex": 2,
  "startOffset": 15,
  "endOffset": 42,
  "textSelection": "the sun rose over mountains",
  "content": "This feels a bit cliché.",
  "authorName": "Lavender"
}
```

**Response:**
```json
{
  "id": "c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6",
  "timestamp": 1703002000000
}
```

---

## 🎨 Frontend API Service Layer

### `src/features/critiqueroom/utils/api-critiqueroom.ts`

Replace localStorage-based `storage.ts` with this API service (follows the pattern from `api-blog.ts` and `api-social.ts`):

```typescript
import { Session, Comment, CommentReply, GlobalFeedback } from '../types';

const API_BASE = '/api/critiqueroom';

interface CreateSessionRequest {
  title: string;
  content: string;
  authorName: string;
  modes: string[];
  questions: string[];
  sections: any[];
  expiration: string;
  fontCombo: string;
  password?: string;
}

interface CreateSessionResponse {
  id: string;
  createdAt: number;
  expiresAt: number | null;
}

export const critiqueRoomAPI = {
  // Session management
  sessions: {
    async create(data: CreateSessionRequest): Promise<CreateSessionResponse> {
      const response = await fetch(`${API_BASE}/sessions/create.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create session');
      }

      return response.json();
    },

    async get(id: string, password?: string): Promise<Session & { isAuthor: boolean }> {
      const url = new URL(`${API_BASE}/sessions/get.php`, window.location.origin);
      url.searchParams.set('id', id);
      if (password) url.searchParams.set('password', password);

      const response = await fetch(url.toString(), {
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch session');
      }

      return response.json();
    },

    async update(session: Session): Promise<void> {
      const response = await fetch(`${API_BASE}/sessions/update.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(session)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update session');
      }
    },

    async delete(id: string): Promise<void> {
      const response = await fetch(`${API_BASE}/sessions/delete.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete session');
      }
    },

    async list(): Promise<Session[]> {
      const response = await fetch(`${API_BASE}/sessions/list.php`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch sessions');
      }

      return response.json();
    }
  },

  // Comment management
  comments: {
    async create(comment: Omit<Comment, 'id' | 'timestamp' | 'replies'> & { sessionId: string }): Promise<{ id: string; timestamp: number }> {
      const response = await fetch(`${API_BASE}/comments/create.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(comment)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create comment');
      }

      return response.json();
    },

    async updateStatus(commentId: string, status: 'open' | 'resolved' | 'implemented'): Promise<void> {
      const response = await fetch(`${API_BASE}/comments/update.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ commentId, status })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update comment');
      }
    },

    async reply(commentId: string, content: string, authorName: string): Promise<{ id: string; timestamp: number }> {
      const response = await fetch(`${API_BASE}/comments/reply.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ commentId, content, authorName })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add reply');
      }

      return response.json();
    }
  },

  // Global feedback
  feedback: {
    async create(feedback: Omit<GlobalFeedback, 'timestamp'> & { sessionId: string }): Promise<{ timestamp: number }> {
      const response = await fetch(`${API_BASE}/feedback/create.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(feedback)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create feedback');
      }

      return response.json();
    }
  },

  // Authentication
  auth: {
    loginWithDiscord(returnTo?: string): void {
      const url = new URL(`${API_BASE}/auth/discord.php`, window.location.origin);
      if (returnTo) url.searchParams.set('return_to', returnTo);
      window.location.href = url.toString();
    },

    async getCurrentUser(): Promise<{ user: any } | null> {
      const response = await fetch(`${API_BASE}/auth/me.php`, {
        credentials: 'include'
      });

      if (response.status === 401) {
        return null;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch current user');
      }

      return response.json();
    },

    async logout(): Promise<void> {
      const response = await fetch(`${API_BASE}/auth/logout.php`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to logout');
      }
    }
  }
};
```

---

## 🔧 Frontend Migration Example

### Update `WriterWorkspace.tsx` (formerly UploadPage.tsx)

**Before (localStorage):**
```typescript
import { saveSession } from '../services/storage';

// Inside component...
const handlePublish = () => {
  const session: Session = {
    id: Math.random().toString(36).substr(2, 9),
    // ... other fields
  };
  saveSession(session);
  navigate(`/feedback/${session.id}`);
};
```

**After (API):**
```typescript
import { critiqueRoomAPI } from '../utils/api-critiqueroom';
import { useNavigate } from 'react-router-dom';

// Inside component...
const navigate = useNavigate();
const [isPublishing, setIsPublishing] = useState(false);
const [error, setError] = useState<string | null>(null);

const handlePublish = async () => {
  setIsPublishing(true);
  setError(null);

  try {
    const response = await critiqueRoomAPI.sessions.create({
      title: sessionTitle,
      content: rawText,
      authorName: authorName,
      modes: selectedModes,
      questions: customQuestions,
      sections: sections,
      expiration: selectedExpiration,
      fontCombo: selectedFont,
      password: sessionPassword || undefined
    });

    navigate(`/critiqueroom/session/${response.id}`);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to create session');
  } finally {
    setIsPublishing(false);
  }
};
```

---

## 🚀 Integration into Existing React App

### Feature Directory Structure

```
src/features/critiqueroom/
├── CritiqueRoomRoute.tsx           # Main route component (handles layout & routing)
├── index.ts                         # Export: export { default as CritiqueRoomRoute }
├── types.ts                         # TypeScript types (Session, Comment, etc.)
├── components/
│   ├── CritiqueRoomHome.tsx        # Landing page (formerly LandingPage.tsx)
│   ├── WriterWorkspace.tsx         # Upload & create session (formerly UploadPage.tsx)
│   ├── CritiqueSession.tsx         # Feedback interface (formerly FeedbackPage.tsx)
│   ├── SessionList.tsx             # List user's sessions (new)
│   ├── IdentitySelector.tsx        # Flower identity picker
│   ├── CommentThread.tsx           # Comment display & replies
│   └── GlobalFeedbackPanel.tsx     # Overall thoughts section
└── utils/
    └── api-critiqueroom.ts         # API service layer
```

### Router Configuration

Add to `src/app/router.tsx`:

```typescript
import { CritiqueRoomRoute } from '@/features/critiqueroom';

export function Router() {
  return (
    <Routes>
      {/* ... existing routes ... */}
      <Route path="/critiqueroom/*" element={<CritiqueRoomRoute />} />
      {/* ... */}
    </Routes>
  );
}
```

### Navigation Integration

Add to `src/components/PageNavbar.tsx`:

```typescript
const navItems = [
  { label: 'Stories', path: '/storytime' },
  { label: 'Blog', path: '/blog' },
  { label: 'Galleries', path: '/galleries' },
  { label: 'Tools', path: '/litrpg' },
  { label: 'Critique Room', path: '/critiqueroom' }, // NEW
];
```

### CritiqueRoomRoute.tsx Example (Full Template)

```typescript
import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import CritiqueRoomHome from './components/CritiqueRoomHome';
import WriterWorkspace from './components/WriterWorkspace';
import CritiqueSession from './components/CritiqueSession';
import SessionList from './components/SessionList';
import { getRandomBackground } from '../../utils/backgroundUtils';

interface AuthorProfile {
  name: string;
  bio: string;
  tagline: string;
  profile_image?: string;
  background_image?: string;
  background_image_light?: string;
  background_image_dark?: string;
  site_domain?: string;
}

interface HomepageSettings {
  brand_color: string;
  brand_color_dark: string;
  hero_title?: string;
  hero_tagline?: string;
}

export default function CritiqueRoomRoute() {
  const [profile, setProfile] = useState<AuthorProfile | null>(null);
  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    // Fetch author profile for background image
    fetch('/api/author/get.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProfile(data.profile);
        }
      })
      .catch(err => {
        console.error('Failed to fetch author profile:', err);
      });

    // Fetch homepage settings for brand color
    fetch('/api/homepage/settings.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSettings(data.settings);
        }
      })
      .catch(err => {
        console.error('Failed to fetch homepage settings:', err);
      });

    // Listen for theme changes from localStorage
    const checkTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      setTheme((savedTheme as 'light' | 'dark') || 'dark');
    };

    // Check theme periodically to sync with other components
    const interval = setInterval(checkTheme, 100);

    return () => clearInterval(interval);
  }, []);

  // Use theme-specific custom background if set, with smart fallback logic
  const backgroundImage = profile
    ? theme === 'light'
      ? getRandomBackground(
          profile.background_image_light || profile.background_image,
          '/images/lofi_light_bg.webp'
        )
      : getRandomBackground(
          profile.background_image_dark || profile.background_image,
          '/images/lofi_bg.webp'
        )
    : theme === 'light'
      ? '/images/lofi_light_bg.webp'
      : '/images/lofi_bg.webp';

  const overlayClass = theme === 'light' ? 'bg-white/60' : 'bg-black/40';

  // Brand color based on theme
  const brandColor = theme === 'light'
    ? (settings?.brand_color || '#6366f1') // indigo-500 fallback
    : (settings?.brand_color_dark || '#818cf8'); // indigo-400 fallback

  return (
    <div className="relative font-sans min-h-screen transition-colors duration-200">
      {/* Dynamic CSS for brand color */}
      <style>{`
        :root { --brand-color: ${brandColor}; }
        .brand-bg { background-color: ${brandColor}; }
        .brand-text { color: ${brandColor}; }
        .brand-border { border-color: ${brandColor}; }
      `}</style>

      {/* Fixed background layer */}
      <div
        className="fixed inset-0 -z-10 bg-no-repeat bg-cover bg-center"
        style={{
          backgroundImage: `url('${backgroundImage}')`,
          backgroundColor: theme === 'light' ? '#f7f7f7' : '#0a0a0a',
        }}
      />
      {/* Overlay */}
      <div className={`fixed inset-0 ${overlayClass} -z-10`} />

      {/* Content */}
      <div className="relative z-10">
        <Routes>
          <Route path="/" element={<CritiqueRoomHome />} />
          <Route path="/workspace" element={<WriterWorkspace />} />
          <Route path="/session/:sessionId" element={<CritiqueSession />} />
          <Route path="/my-sessions" element={<SessionList />} />
        </Routes>
      </div>
    </div>
  );
}
```

---

## 🎨 Component Layout Templates

### Standard Page Layout Pattern

All CritiqueRoom pages should follow this structure for consistency with the rest of the website:

```typescript
import { useTheme } from '../../storytime/contexts/ThemeContext';
import PageNavbar from '../../../components/PageNavbar';
import SocialIcons from '../../../components/SocialIcons';
import NewsletterCTA from '../../../components/NewsletterCTA';
import PatreonCTA from '../../../components/PatreonCTA';

export default function ComponentName() {
  const { theme } = useTheme();

  // Theme-aware styles
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-white';
  const textSecondary = theme === 'light' ? 'text-gray-700' : 'text-neutral-200';
  const textMuted = theme === 'light' ? 'text-gray-500' : 'text-neutral-400';
  const cardBg = theme === 'light'
    ? 'bg-white/60 border-gray-200 backdrop-blur-xl'
    : 'bg-neutral-900/60 border-white/10 backdrop-blur-xl';

  return (
    <div className={`min-h-screen ${textPrimary}`}>
      {/* Header with breadcrumbs */}
      <PageNavbar breadcrumbs={[
        { label: 'Critique Room', path: '/critiqueroom' },
        { label: 'Current Page' }
      ]} />

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Your content here */}
      </main>

      {/* Footer with social icons */}
      <footer className="mt-16 border-t border-neutral-200 dark:border-neutral-800">
        <SocialIcons variant="footer" showCopyright={true} />
      </footer>
    </div>
  );
}
```

### CritiqueRoomHome.tsx Template

```typescript
import { useTheme } from '../../storytime/contexts/ThemeContext';
import PageNavbar from '../../../components/PageNavbar';
import SocialIcons from '../../../components/SocialIcons';
import NewsletterCTA from '../../../components/NewsletterCTA';
import PatreonCTA from '../../../components/PatreonCTA';
import { Link } from 'react-router-dom';

export default function CritiqueRoomHome() {
  const { theme } = useTheme();

  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-white';
  const textSecondary = theme === 'light' ? 'text-gray-700' : 'text-neutral-200';
  const cardBg = theme === 'light'
    ? 'bg-white/70 border-gray-200 backdrop-blur-xl'
    : 'bg-neutral-900/70 border-white/10 backdrop-blur-xl';

  return (
    <div className={`min-h-screen ${textPrimary}`}>
      {/* No breadcrumbs on home page */}
      <PageNavbar />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className={`text-5xl font-black tracking-tight ${textPrimary}`}>
            CritiqueRoom
          </h1>
          <p className={`text-xl ${textSecondary}`}>
            Focused critique, better writing, zero friction.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/critiqueroom/workspace"
              className="px-8 py-4 brand-bg text-white rounded-2xl font-bold hover:opacity-90 transition shadow-lg"
            >
              Start Writing
            </Link>
            <button
              className={`px-8 py-4 border-2 rounded-2xl font-bold transition ${
                theme === 'light'
                  ? 'border-gray-300 hover:border-gray-400'
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              How it Works
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        {/* Feature cards here */}
      </section>

      {/* CTAs */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto space-y-6">
          <NewsletterCTA
            variant="card"
            source="critiqueroom-home"
            buttonText="Get updates on new features"
          />
          <PatreonCTA variant="card" />
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 border-t border-neutral-200 dark:border-neutral-800">
        <SocialIcons variant="footer" showCopyright={true} />
      </footer>
    </div>
  );
}
```

### WriterWorkspace.tsx Template

```typescript
import { useTheme } from '../../storytime/contexts/ThemeContext';
import PageNavbar from '../../../components/PageNavbar';
import SocialIcons from '../../../components/SocialIcons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { critiqueRoomAPI } from '../utils/api-critiqueroom';

export default function WriterWorkspace() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isPublishing, setIsPublishing] = useState(false);

  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-white';
  const cardBg = theme === 'light'
    ? 'bg-white/70 border-gray-200 backdrop-blur-xl'
    : 'bg-neutral-900/70 border-white/10 backdrop-blur-xl';

  const handlePublish = async () => {
    // Publishing logic here
  };

  return (
    <div className={`min-h-screen ${textPrimary}`}>
      <PageNavbar breadcrumbs={[
        { label: 'Critique Room', path: '/critiqueroom' },
        { label: 'Writer Workspace' }
      ]} />

      <main className="container mx-auto px-4 py-8">
        {/* Workspace content */}
      </main>

      <footer className="mt-16 border-t border-neutral-200 dark:border-neutral-800">
        <SocialIcons variant="footer" showCopyright={true} />
      </footer>
    </div>
  );
}
```

### CritiqueSession.tsx Template

```typescript
import { useTheme } from '../../storytime/contexts/ThemeContext';
import PageNavbar from '../../../components/PageNavbar';
import SocialIcons from '../../../components/SocialIcons';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { critiqueRoomAPI } from '../utils/api-critiqueroom';
import type { Session } from '../types';

export default function CritiqueSession() {
  const { theme } = useTheme();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-white';

  useEffect(() => {
    if (sessionId) {
      critiqueRoomAPI.sessions.get(sessionId)
        .then(data => {
          setSession(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load session:', err);
          setLoading(false);
        });
    }
  }, [sessionId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className={`min-h-screen ${textPrimary}`}>
      <PageNavbar breadcrumbs={[
        { label: 'Critique Room', path: '/critiqueroom' },
        { label: session?.title || 'Session' }
      ]} />

      <main className="container mx-auto px-4 py-8">
        {/* Session content */}
      </main>

      <footer className="mt-16 border-t border-neutral-200 dark:border-neutral-800">
        <SocialIcons variant="footer" showCopyright={true} />
      </footer>
    </div>
  );
}
```

---

## 🧹 Cleanup Cron Job

### `/api/cron/cleanup-critiqueroom.php`

```php
<?php
require_once __DIR__ . '/../bootstrap.php';

// Delete expired sessions
try {
    $now = round(microtime(true) * 1000);

    $stmt = $pdo->prepare("
        DELETE FROM critiqueroom_sessions
        WHERE expires_at IS NOT NULL
        AND expires_at < ?
    ");

    $stmt->execute([$now]);
    $deletedCount = $stmt->rowCount();

    error_log("CritiqueRoom cleanup: Deleted $deletedCount expired sessions");

    echo json_encode([
        'success' => true,
        'deleted' => $deletedCount,
        'timestamp' => $now
    ]);
} catch (PDOException $e) {
    error_log('CritiqueRoom cleanup failed: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Cleanup failed']);
}
```

### Crontab Entry

```bash
# Run every hour
0 * * * * curl -s https://yourdomain.com/api/cron/cleanup-critiqueroom.php > /dev/null 2>&1
```

---

## 🔒 Security Implementation

### Rate Limiting

Add to `/api/critiqueroom/sessions/create.php`:

```php
// Rate limit: 5 sessions per hour per IP
$rateLimitKey = 'critiqueroom_sessions_' . $clientIp;
$rateLimitWindow = 3600; // 1 hour
$rateLimitMax = CRITIQUEROOM_RATE_LIMIT_SESSIONS;

$stmt = $pdo->prepare("
    INSERT INTO rate_limit_agg (key_name, counter, window_start)
    VALUES (?, 1, UNIX_TIMESTAMP())
    ON DUPLICATE KEY UPDATE
        counter = IF(UNIX_TIMESTAMP() - window_start >= ?, 1, counter + 1),
        window_start = IF(UNIX_TIMESTAMP() - window_start >= ?, UNIX_TIMESTAMP(), window_start)
");
$stmt->execute([$rateLimitKey, $rateLimitWindow, $rateLimitWindow]);

$stmt = $pdo->prepare("SELECT counter FROM rate_limit_agg WHERE key_name = ?");
$stmt->execute([$rateLimitKey]);
$current = $stmt->fetchColumn();

if ($current > $rateLimitMax) {
    http_response_code(429);
    header('Retry-After: 3600');
    echo json_encode(['error' => 'Rate limit exceeded. Try again later.']);
    exit;
}
```

### XSS Prevention

Add HTML sanitization for comment content:

```php
// Install: composer require ezyang/htmlpurifier
use HTMLPurifier;
use HTMLPurifier_Config;

function sanitizeComment(string $content): string {
    $config = HTMLPurifier_Config::createDefault();
    $config->set('HTML.Allowed', 'b,i,em,strong,u,a[href],br,p');
    $purifier = new HTMLPurifier($config);
    return $purifier->purify($content);
}
```

---

## 📊 Testing Checklist

### Manual Testing Scenarios

1. **Anonymous User Flow**
   - [ ] Create session without logging in
   - [ ] View session with direct link
   - [ ] Add comments as "Flower Identity"
   - [ ] Verify cannot edit/delete session

2. **Discord User Flow**
   - [ ] Click "Login with Discord"
   - [ ] Complete OAuth flow
   - [ ] Create session as logged-in user
   - [ ] View "My Sessions" list
   - [ ] Edit own session
   - [ ] Delete own session

3. **Password Protection**
   - [ ] Create password-protected session
   - [ ] Try to access without password (should fail)
   - [ ] Access with correct password (should succeed)
   - [ ] Author can access without password

4. **Comments & Feedback**
   - [ ] Add inline comment (highlight text)
   - [ ] Add paragraph comment
   - [ ] Reply to comment
   - [ ] Author marks comment as "Implemented"
   - [ ] Submit global feedback (What Worked / Didn't Work)

5. **Expiration**
   - [ ] Create session with 24h expiration
   - [ ] Manually update `expires_at` to past timestamp
   - [ ] Try to access (should show "Session expired")
   - [ ] Verify cleanup cron deletes it

6. **Rate Limiting**
   - [ ] Create 5 sessions rapidly
   - [ ] Attempt 6th session (should fail with 429)
   - [ ] Wait 1 hour, try again (should succeed)

---

## 🎯 Success Metrics

After deployment, track these metrics:

- Number of sessions created per day
- Average session length (word count)
- Number of comments per session
- Discord login conversion rate
- Session expiration distribution (24h vs 7d vs never)
- Password protection usage rate

---

## 📚 Additional Resources

- [Discord OAuth2 Documentation](https://discord.com/developers/docs/topics/oauth2)
- [PHP PDO Security Best Practices](https://phpdelusions.net/pdo)
- [React Query for API State Management](https://tanstack.com/query/latest) (optional enhancement)
- [WebSocket.io for Real-time Updates](https://socket.io/) (Phase 11)

---

## ✅ Final Notes

This implementation plan integrates CritiqueRoom seamlessly into your existing architecture:

- **Database**: Uses your existing MySQL instance with `critiqueroom_` prefix
- **Authentication**: Leverages your existing session management + adds Discord OAuth
- **API**: Follows your existing PHP endpoint patterns
- **Frontend**: Builds as separate SPA, served from `/critiqueroom/` subdirectory
- **Security**: Uses your existing rate limiting infrastructure
- **Deployment**: Fits into your current Apache/PHP hosting setup

**Estimated Implementation Time**: 2-3 weeks for full deployment with testing.

Good luck! 🚀
