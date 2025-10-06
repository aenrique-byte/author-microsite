# Component Centralization Issues

## Problem Description
**Symptom**: Duplicate components across sections with inconsistent behavior, styling, or functionality.

**What You See**:
- Same component implemented differently in each section
- Inconsistent styling or behavior across sections
- Need to update the same component in multiple places
- Different social media icons, colors, or layouts between sections

## Root Cause
**Component Duplication**: Each section maintaining its own copy of shared components instead of using a centralized version.

In our case:
- `src/components/SocialIcons.tsx` (homepage)
- `storytime/src/components/SocialIcons.jsx` (storytime)
- `imagemanager/src/components/SocialIcons.tsx` (galleries)

Each had different styling, different icon sets, and different behavior patterns.

## Solution Steps

### 1. Identify Duplicate Components
Find components that exist in multiple sections:
```bash
# Search for duplicate component names
find . -name "SocialIcons.*" -type f
find . -name "ThemeToggle.*" -type f
find . -name "Header.*" -type f
```

### 2. Create Shared Component
Move the best version to a shared location:
```typescript
// shared/components/SocialIcons.tsx
import type { ReactElement } from "react";

type Props = {
  socials?: Record<string, string>;
  variant?: 'homepage' | 'footer';
};

export default function SocialIcons({ socials, variant = 'homepage' }: Props) {
  // Unified implementation with variant support
  if (variant === 'footer') {
    // Footer variant with copyright
    return (
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-center gap-4 py-6">
          {/* Social icons */}
        </div>
        <div className="pb-10 text-center text-xs opacity-70">
          &copy; {new Date().getFullYear()} All Rights Reserved.
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="flex items-center justify-center gap-3">
      {/* Social icons */}
    </div>
  );
}
```

### 3. Update All Sections to Use Shared Component
Replace individual implementations with imports:
```typescript
// Homepage: src/components/AuthorHomepage.tsx
import SocialIcons from '../../shared/components/SocialIcons'

// Storytime: storytime/src/components/SocialIcons.jsx
export { default } from '../../../shared/components/SocialIcons';

// Galleries: imagemanager/src/components/SocialIcons.tsx
export { default } from '../../../shared/components/SocialIcons';
```

### 4. Update Usage with Variants
Use appropriate variants for different contexts:
```typescript
// Homepage and storytime (default variant)
<SocialIcons socials={socials} />

// Galleries (footer variant with copyright)
<SocialIcons socials={socials} variant="footer" />
```

### 5. Test Consistency
Verify all sections now use the same component:
1. Check that styling is consistent across sections
2. Verify all social platforms are available in all sections
3. Test theme compatibility across all sections
4. Ensure responsive behavior is consistent

## Prevention

### Best Practices

#### 1. Shared Component Architecture
**All reusable components should be in the home folder:**
```
shared/
├── components/
│   ├── SocialIcons.tsx
│   ├── ThemeToggle.tsx
│   ├── Header.tsx
│   └── Footer.tsx
├── contexts/
│   └── ThemeContext.tsx
├── lib/
│   └── utils.ts
└── types/
    └── index.ts
```

#### 2. Component Variant System
**Use variants instead of separate components:**
```typescript
// Good: Single component with variants
<SocialIcons variant="homepage" />
<SocialIcons variant="footer" />

// Bad: Separate components
<HomepageSocialIcons />
<FooterSocialIcons />
```

#### 3. Consistent Import Patterns
**Use relative paths to shared components:**
```typescript
// From homepage
import SocialIcons from '../../shared/components/SocialIcons'

// From storytime
import SocialIcons from '../../../shared/components/SocialIcons'

// From galleries
import SocialIcons from '../../../shared/components/SocialIcons'
```

#### 4. Re-export Pattern for Compatibility
**Use re-exports to maintain existing import paths:**
```typescript
// storytime/src/components/SocialIcons.jsx
export { default } from '../../../shared/components/SocialIcons';

// This allows existing imports to continue working:
// import SocialIcons from './components/SocialIcons'
```

### Component Design Patterns

#### Variant-Based Components
```typescript
type ComponentVariant = 'default' | 'compact' | 'footer' | 'mobile';

interface ComponentProps {
  variant?: ComponentVariant;
  // other props
}

export default function Component({ variant = 'default', ...props }: ComponentProps) {
  const baseClasses = "shared-base-classes";
  const variantClasses = {
    default: "default-specific-classes",
    compact: "compact-specific-classes",
    footer: "footer-specific-classes",
    mobile: "mobile-specific-classes"
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]}`}>
      {/* Component content */}
    </div>
  );
}
```

#### Theme-Aware Components
```typescript
interface ThemeAwareProps {
  className?: string;
}

export default function ThemeAwareComponent({ className = "" }: ThemeAwareProps) {
  return (
    <div className={`
      bg-white text-gray-900 
      dark:bg-gray-900 dark:text-white 
      ${className}
    `}>
      {/* Component content */}
    </div>
  );
}
```

#### Responsive Components
```typescript
export default function ResponsiveComponent() {
  return (
    <div className="
      flex flex-col gap-2
      sm:flex-row sm:gap-4
      lg:gap-6
    ">
      {/* Component content */}
    </div>
  );
}
```

### Code Review Checklist
- [ ] Is this component used in multiple sections?
- [ ] Should this be moved to shared/components/?
- [ ] Does the component support necessary variants?
- [ ] Is the component theme-aware?
- [ ] Are import paths consistent across sections?
- [ ] Is the component responsive?

## Common Centralization Issues

### Inconsistent Styling
**Problem**: Same component looks different in each section
**Solution**: Centralize component with theme-aware styling

### Missing Features
**Problem**: Some sections have features others don't
**Solution**: Combine all features into shared component with variants

### Import Path Confusion
**Problem**: Different sections import from different locations
**Solution**: Use consistent relative paths to shared directory

### Breaking Changes
**Problem**: Updating shared component breaks some sections
**Solution**: Use variants and maintain backward compatibility

### Build Dependencies
**Problem**: Shared components don't build correctly
**Solution**: Ensure build tools can resolve shared component paths

## Migration Strategy

### 1. Audit Phase
- Identify all duplicate components
- Document differences between versions
- Choose the best implementation as base

### 2. Consolidation Phase
- Create shared version with all features
- Add variant support for different use cases
- Test shared component in isolation

### 3. Migration Phase
- Update one section at a time
- Use re-exports to maintain compatibility
- Test each section after migration

### 4. Cleanup Phase
- Remove old component files
- Update documentation
- Verify all sections work correctly

## Related Issues
- [Theme Persistence Problems](./theme-issues.md) - Shared components help maintain theme consistency
- [Build & Deployment Structure](./build-deployment-issues.md) - Shared components need proper build configuration
