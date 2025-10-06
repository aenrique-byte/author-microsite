# Build & Deployment Structure Issues

## Problem Description
**Symptom**: Build outputs go to wrong locations, sections not accessible after deployment, or manual copying required.

**What You See**:
- Built files in wrong directories
- Sections not accessible via URLs (404 errors)
- Need to manually copy files after builds
- Inconsistent deployment structure

## Root Cause
**Misaligned Build Configuration**: Different sections building to different locations without a unified structure.

In our case:
- Homepage built to `dist/`
- Galleries built to `dist/galleries/` (correct)
- Storytime built to `storytime/dist/` (wrong location)

## Solution Steps

### 1. Analyze Current Structure
Check where each section currently builds:
```bash
# Check build outputs
ls -la dist/
ls -la storytime/dist/
ls -la imagemanager/dist/
```

### 2. Identify Target Structure
Define the desired final structure:
```
dist/
├── index.html          # Homepage
├── api/               # Shared APIs
├── assets/            # Homepage assets
├── storytime/         # Storytime section
│   ├── index.html
│   └── assets/
├── galleries/         # Galleries section
│   ├── index.html
│   └── assets/
└── shared/            # Shared resources
    └── components/
```

### 3. Update Build Configurations

#### Storytime (vite.config.js)
```javascript
// Before (builds to storytime/dist/)
export default defineConfig({
  plugins: [react()],
  base: '/storytime/',
})

// After (builds to dist/storytime/)
export default defineConfig({
  plugins: [react()],
  base: '/storytime/',
  build: {
    outDir: '../dist/storytime'
  }
})
```

#### Galleries (vite.config.ts)
```typescript
// Already correct - builds to ../dist/galleries/
export default defineConfig({
  plugins: [react()],
  base: '/galleries/',
  build: {
    outDir: '../dist/galleries'
  }
})
```

#### Homepage (vite.config.ts)
```typescript
// Already correct - builds to dist/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  }
})
```

### 4. Test Build Process
Verify each section builds to the correct location:
```bash
# Homepage
npm run build
# Should create: dist/index.html, dist/assets/

# Storytime
cd storytime && npm run build
# Should create: dist/storytime/index.html, dist/storytime/assets/

# Galleries
cd imagemanager && npm run build
# Should create: dist/galleries/index.html, dist/galleries/assets/
```

## Prevention

### Best Practices

#### 1. Centralized Structure
**All shared resources should be in the home folder:**
- APIs: `api/` (accessible to all sections)
- Shared components: `shared/components/`
- Shared assets: `shared/assets/`
- Common configuration: Root level

#### 2. Consistent Build Targets
**All sections should build to subdirectories of main `dist/`:**
```
Project Root/
├── dist/              # Main build output
│   ├── index.html     # Homepage
│   ├── api/          # Shared APIs
│   ├── shared/       # Shared resources
│   ├── storytime/    # Storytime build
│   └── galleries/    # Galleries build
├── storytime/         # Storytime source
├── imagemanager/      # Galleries source
└── shared/           # Shared source
```

#### 3. Build Script Standardization
Create consistent build scripts in package.json:
```json
{
  "scripts": {
    "build": "npm run build:homepage && npm run build:storytime && npm run build:galleries",
    "build:homepage": "vite build",
    "build:storytime": "cd storytime && npm run build",
    "build:galleries": "cd imagemanager && npm run build"
  }
}
```

#### 4. Shared Resource Management
**APIs and endpoints should be centralized:**
- All API endpoints in `/api/` directory
- Shared components in `/shared/components/`
- Common utilities in `/shared/lib/`
- Shared types in `/shared/types/`

### Configuration Templates

#### Vite Config for Subsections
```javascript
// Template for storytime, galleries, etc.
export default defineConfig({
  plugins: [react()],
  base: '/[section-name]/',
  build: {
    outDir: '../dist/[section-name]'
  }
})
```

#### Directory Structure Template
```
project-root/
├── dist/                    # Build output (git-ignored)
├── api/                     # Shared backend APIs
├── shared/                  # Shared frontend resources
│   ├── components/
│   ├── lib/
│   └── types/
├── [section-name]/          # Individual sections
│   ├── src/
│   ├── vite.config.js
│   └── package.json
└── package.json             # Root package.json
```

### Code Review Checklist
- [ ] Does the section build to the correct location in `dist/`?
- [ ] Are shared resources accessed from the root level?
- [ ] Is the base URL configured correctly for the section?
- [ ] Can the section be accessed via its intended URL after build?
- [ ] Are there no manual copy steps required after build?

## Common Build Issues

### Wrong Output Directory
**Problem**: Section builds to its own directory instead of main `dist/`
**Solution**: Update `outDir` in vite.config to point to `../dist/[section]`

### Incorrect Base URL
**Problem**: Assets not loading due to wrong base path
**Solution**: Set `base: '/[section-name]/'` in vite config

### Missing Shared Resources
**Problem**: Shared components or APIs not accessible
**Solution**: Move shared resources to root level and update import paths

### Manual Copy Requirements
**Problem**: Need to manually copy files after build
**Solution**: Configure build tools to output directly to final location

## Related Issues
- [Component Centralization](./component-issues.md) - Shared components need proper build structure
- [Theme Persistence Problems](./theme-issues.md) - Theme state should be managed centrally
