# Best Practices & Architecture Guidelines

## Core Principle: Centralized Architecture

**All shared resources should be based in the home folder, including APIs and endpoints.**

This ensures consistency, maintainability, and prevents the issues documented in this learnings folder.

## Directory Structure

### Recommended Project Structure
```
project-root/                    # Home folder - base for all shared resources
├── api/                        # ✅ Centralized APIs (accessible to all sections)
│   ├── auth/
│   ├── images/
│   ├── galleries/
│   └── bootstrap.php
├── shared/                     # ✅ Shared frontend resources
│   ├── components/
│   │   ├── SocialIcons.tsx
│   │   └── ThemeToggle.tsx
│   ├── contexts/
│   │   └── ThemeContext.tsx
│   ├── lib/
│   │   └── utils.ts
│   └── types/
│       └── index.ts
├── dist/                       # ✅ Unified build output
│   ├── index.html             # Homepage
│   ├── api/                   # Copied APIs
│   ├── shared/                # Copied shared resources
│   ├── storytime/             # Storytime build
│   └── galleries/             # Galleries build
├── storytime/                  # Individual section
│   ├── src/
│   ├── vite.config.js         # Builds to ../dist/storytime/
│   └── package.json
├── imagemanager/               # Individual section (galleries)
│   ├── src/
│   ├── vite.config.ts         # Builds to ../dist/galleries/
│   └── package.json
├── src/                        # Homepage source
├── vite.config.ts             # Builds to dist/
└── package.json               # Root package.json
```

## API & Backend Best Practices

### 1. Centralized API Structure
**All API endpoints in `/api/` directory:**
```
api/
├── bootstrap.php              # Shared configuration
├── config.php                 # Database and settings
├── auth/                      # Authentication endpoints
│   ├── login.php
│   ├── logout.php
│   └── me.php
├── images/                    # Image management
│   ├── upload.php
│   ├── manage.php
│   └── gallery-list.php
├── galleries/                 # Gallery management
│   ├── create.php
│   ├── delete.php
│   └── list.php
└── uploads/                   # File storage
    ├── covers/
    ├── pagebreaks/
    └── general/
```

### 2. Consistent HTTP Methods
**Use POST for all data-modifying operations:**
```php
// ✅ Good: Consistent POST usage
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (isset($input['action'])) {
    switch ($input['action']) {
        case 'delete':
            // Handle delete
            break;
        case 'update':
            // Handle update
            break;
    }
}
```

### 3. Standard API Response Format
**Always return JSON with consistent structure:**
```php
// Success response
echo json_encode([
    'success' => true,
    'data' => $result,
    'message' => 'Operation completed successfully'
]);

// Error response
http_response_code(400);
echo json_encode([
    'success' => false,
    'error' => 'Descriptive error message'
]);
```

### 4. Robust Error Handling
**Every API endpoint should follow this pattern:**
```php
<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once '../bootstrap.php';

header('Content-Type: application/json');

// Authentication check
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Method check
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // API logic here
    echo json_encode(['success' => true, 'data' => $result]);
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
} catch (Throwable $e) {
    error_log("Fatal Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
?>
```

## Frontend Best Practices

### 1. Shared Component Architecture
**All reusable components in `/shared/components/`:**
```typescript
// shared/components/SocialIcons.tsx
export default function SocialIcons({ 
  socials, 
  variant = 'default' 
}: {
  socials?: Record<string, string>;
  variant?: 'default' | 'footer';
}) {
  // Unified implementation with variants
}
```

### 2. Centralized State Management
**Theme and global state in `/shared/contexts/`:**
```typescript
// shared/contexts/ThemeContext.tsx
export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'dark'
    })

    useEffect(() => {
        localStorage.setItem('theme', theme)
        document.documentElement.className = theme
    }, [theme])

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}
```

### 3. Consistent Import Patterns
**Use relative paths to shared resources:**
```typescript
// From any section, import shared components
import SocialIcons from '../../shared/components/SocialIcons'
import { ThemeProvider } from '../../shared/contexts/ThemeContext'
```

### 4. Unified Build Configuration
**All sections build to main `dist/` directory:**
```javascript
// storytime/vite.config.js
export default defineConfig({
  plugins: [react()],
  base: '/storytime/',
  build: {
    outDir: '../dist/storytime'  // ✅ Builds to main dist
  }
})

// imagemanager/vite.config.ts
export default defineConfig({
  plugins: [react()],
  base: '/galleries/',
  build: {
    outDir: '../dist/galleries'  // ✅ Builds to main dist
  }
})
```

## Database Best Practices

### 1. Version-Controlled Migrations
**All schema changes in migration files:**
```sql
-- api/schema-update-[feature].sql
ALTER TABLE authors 
ADD COLUMN background_image_light VARCHAR(255) DEFAULT NULL,
ADD COLUMN background_image_dark VARCHAR(255) DEFAULT NULL;
```

### 2. Safe Migration Scripts
**Always check before applying changes:**
```php
// api/run-[feature]-migration.php
$checkQuery = "SHOW COLUMNS FROM authors LIKE 'background_image_light'";
$result = $pdo->query($checkQuery);

if ($result->rowCount() == 0) {
    // Apply migration
    $sql = file_get_contents('schema-update-[feature].sql');
    $pdo->exec($sql);
}
```

### 3. Consistent API Column Handling
**Update all related endpoints when adding columns:**
```php
// api/author/get.php
$stmt = $pdo->prepare("
    SELECT name, bio, tagline, profile_image, 
           background_image_light, background_image_dark 
    FROM authors WHERE id = 1
");

// api/author/update.php
if (isset($data['background_image_light'])) {
    $stmt = $pdo->prepare("
        UPDATE authors 
        SET background_image_light = ? 
        WHERE id = 1
    ");
    $stmt->execute([$data['background_image_light']]);
}
```

## Build & Deployment Best Practices

### 1. Unified Build Process
**Single command builds entire project:**
```json
// Root package.json
{
  "scripts": {
    "build": "npm run build:homepage && npm run build:storytime && npm run build:galleries",
    "build:homepage": "vite build",
    "build:storytime": "cd storytime && npm run build",
    "build:galleries": "cd imagemanager && npm run build"
  }
}
```

### 2. Consistent Output Structure
**All builds go to main `dist/` directory:**
```
dist/
├── index.html              # Homepage
├── api/                   # Shared APIs (copied during build)
├── shared/                # Shared resources (copied during build)
├── storytime/             # Storytime section
│   ├── index.html
│   └── assets/
└── galleries/             # Galleries section
    ├── index.html
    └── assets/
```

### 3. Automated Asset Copying
**Build scripts copy shared resources:**
```javascript
// scripts/postbuild-copy.mjs
import { copyFileSync, mkdirSync } from 'fs';

// Copy API directory
copyRecursive('api/', 'dist/api/');

// Copy shared directory
copyRecursive('shared/', 'dist/shared/');
```

## Code Quality Standards

### 1. TypeScript Consistency
**Use TypeScript for all new components:**
```typescript
// ✅ Good: Proper TypeScript
interface Props {
  socials?: Record<string, string>;
  variant?: 'default' | 'footer';
}

export default function Component({ socials, variant = 'default' }: Props) {
  // Implementation
}

// ❌ Avoid: Untyped JavaScript in TypeScript projects
export default function Component({ socials, variant }) {
  // Implementation
}
```

### 2. Consistent Naming Conventions
```
Files: PascalCase.tsx (SocialIcons.tsx)
Components: PascalCase (SocialIcons)
Functions: camelCase (toggleTheme)
Variables: camelCase (currentTheme)
Constants: UPPER_SNAKE_CASE (API_BASE_URL)
CSS Classes: kebab-case (social-icon)
```

### 3. Error Handling Standards
**Always handle errors gracefully:**
```typescript
// Frontend
try {
    const data = await apiCall('/api/endpoint.php', { method: 'POST' });
    setSuccess('Operation completed successfully');
} catch (error) {
    setError(error.message || 'Operation failed');
    console.error('Operation error:', error);
}

// Backend
try {
    $result = performOperation($input);
    echo json_encode(['success' => true, 'data' => $result]);
} catch (Exception $e) {
    error_log("Error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}
```

## Development Workflow

### 1. Before Adding New Features
- [ ] Check if similar functionality exists in other sections
- [ ] Identify what can be shared vs. section-specific
- [ ] Plan shared component architecture first
- [ ] Consider database schema changes needed

### 2. During Development
- [ ] Use shared components when possible
- [ ] Follow established patterns from working sections
- [ ] Test across all sections, not just the one you're working on
- [ ] Document any new patterns or solutions

### 3. Before Deployment
- [ ] Build all sections successfully
- [ ] Test theme persistence across sections
- [ ] Verify shared components work in all contexts
- [ ] Check that APIs return proper JSON responses
- [ ] Test on both light and dark themes

### 4. After Deployment
- [ ] Monitor error logs for any issues
- [ ] Test critical user flows across sections
- [ ] Document any issues encountered for future reference

## Quick Reference Commands

### Build Commands
```bash
# Build everything
npm run build

# Build individual sections
npm run build                    # Homepage
cd storytime && npm run build    # Storytime → dist/storytime/
cd imagemanager && npm run build # Galleries → dist/galleries/
```

### Testing Commands
```bash
# Test API endpoints
curl -X POST -H "Content-Type: application/json" -d '{"action":"test"}' http://localhost/api/endpoint.php

# Check build outputs
ls -la dist/
ls -la dist/storytime/
ls -la dist/galleries/
```

### Database Commands
```bash
# Run migrations
php api/run-[feature]-migration.php

# Check table structure
mysql -u user -p -e "DESCRIBE authors;"
```

This architecture ensures that all sections can share resources efficiently while maintaining their independence where needed.
