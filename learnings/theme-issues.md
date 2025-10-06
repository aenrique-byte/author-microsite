# Theme Persistence Problems

## Problem Description
**Symptom**: Theme selection (light/dark mode) doesn't persist across different sections of the website.

**What You See**:
- Set theme to light on homepage, but storytime/galleries still show dark
- Theme resets when navigating between sections
- Inconsistent theme state across the application
- Each section seems to have its own theme setting

## Root Cause
**Inconsistent localStorage Keys**: Different sections using different keys to store theme preference.

In our case:
- Homepage used `localStorage.getItem('homepage-theme')`
- Storytime used `localStorage.getItem('theme')`
- Galleries used `localStorage.getItem('theme')`

This meant homepage had its own isolated theme state while other sections shared a different one.

## Solution Steps

### 1. Identify Current Theme Storage
Check how each section stores theme preference:
```typescript
// Homepage (wrong)
const savedTheme = localStorage.getItem('homepage-theme')

// Storytime (correct)
const savedTheme = localStorage.getItem('theme')

// Galleries (correct)
const savedTheme = localStorage.getItem('theme')
```

### 2. Standardize localStorage Key
Update all sections to use the same key:
```typescript
// Before (homepage)
const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('homepage-theme')
    return (savedTheme as 'light' | 'dark') || 'dark'
})

useEffect(() => {
    localStorage.setItem('homepage-theme', theme)
}, [theme])

// After (homepage)
const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme')
    return (savedTheme as 'light' | 'dark') || 'dark'
})

useEffect(() => {
    localStorage.setItem('theme', theme)
    
    // Apply theme class to document element for consistency
    if (theme === 'dark') {
        document.documentElement.classList.add('dark')
        document.documentElement.classList.remove('light')
    } else {
        document.documentElement.classList.add('light')
        document.documentElement.classList.remove('dark')
    }
}, [theme])
```

### 3. Ensure Document Class Management
All sections should apply theme classes to the document element:
```typescript
// Consistent theme application across all sections
useEffect(() => {
    localStorage.setItem('theme', theme)
    
    // Apply theme class to document element
    if (theme === 'dark') {
        document.documentElement.classList.add('dark')
        document.documentElement.classList.remove('light')
    } else {
        document.documentElement.classList.add('light')
        document.documentElement.classList.remove('dark')
    }
}, [theme])
```

### 4. Test Theme Persistence
Verify theme persists across sections:
1. Set theme to light on homepage
2. Navigate to storytime - should remain light
3. Navigate to galleries - should remain light
4. Refresh any page - should maintain theme

## Prevention

### Best Practices

#### 1. Centralized Theme Management
**Theme state should be managed from the home folder:**
```typescript
// shared/contexts/ThemeContext.tsx
export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme')
        return savedTheme || 'dark'
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

#### 2. Consistent localStorage Keys
**All sections must use the same localStorage key:**
- ✅ `localStorage.getItem('theme')`
- ❌ `localStorage.getItem('homepage-theme')`
- ❌ `localStorage.getItem('storytime-theme')`
- ❌ `localStorage.getItem('galleries-theme')`

#### 3. Document Class Management
**Apply theme classes to document element consistently:**
```typescript
// Standard pattern for all sections
useEffect(() => {
    localStorage.setItem('theme', theme)
    
    if (theme === 'dark') {
        document.documentElement.classList.add('dark')
        document.documentElement.classList.remove('light')
    } else {
        document.documentElement.classList.add('light')
        document.documentElement.classList.remove('dark')
    }
}, [theme])
```

#### 4. Theme Context Sharing
**Consider using a shared theme context:**
```typescript
// Import shared theme context in all sections
import { ThemeProvider } from '../shared/contexts/ThemeContext'

// Wrap each section's root component
export default function App() {
    return (
        <ThemeProvider>
            <YourAppContent />
        </ThemeProvider>
    )
}
```

### Configuration Templates

#### Theme Context Template
```typescript
// shared/contexts/ThemeContext.tsx
import { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
    theme: Theme
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export const useTheme = () => {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider')
    }
    return context
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem('theme')
        return (saved as Theme) || 'dark'
    })

    useEffect(() => {
        localStorage.setItem('theme', theme)
        document.documentElement.className = theme
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark')
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}
```

#### Theme Toggle Component Template
```typescript
// shared/components/ThemeToggle.tsx
import { useTheme } from '../contexts/ThemeContext'

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()

    return (
        <button
            onClick={toggleTheme}
            className={`fixed top-4 left-4 z-50 p-2 rounded-lg transition-colors ${
                theme === 'dark'
                    ? 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700'
                    : 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300'
            }`}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
            {theme === 'dark' ? '☀️' : '🌙'}
        </button>
    )
}
```

### Code Review Checklist
- [ ] Do all sections use the same localStorage key for theme?
- [ ] Is the theme applied to document.documentElement?
- [ ] Does theme persist when navigating between sections?
- [ ] Are theme classes consistent across all sections?
- [ ] Is there a single source of truth for theme state?

## Common Theme Issues

### Isolated Theme States
**Problem**: Each section has its own theme state
**Solution**: Use shared localStorage key and document classes

### Missing Document Classes
**Problem**: Theme doesn't apply to global styles
**Solution**: Apply theme classes to document.documentElement

### Inconsistent Default Themes
**Problem**: Different sections have different default themes
**Solution**: Standardize default theme across all sections

### Theme Flash on Load
**Problem**: Brief flash of wrong theme on page load
**Solution**: Apply theme class early in the loading process

## Related Issues
- [Component Centralization](./component-issues.md) - Shared theme components help maintain consistency
- [Build & Deployment Structure](./build-deployment-issues.md) - Shared theme context needs proper build structure
