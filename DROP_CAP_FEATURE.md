# Drop Cap Feature

## Overview
The drop cap feature allows stories to display the first letter of each chapter in a larger, manuscript-style format (similar to illuminated manuscripts). This is an optional, per-story setting with customizable decorative fonts.

## How It Works

### 1. Database Changes
- Added `enable_drop_cap` column to the `stories` table
  - Type: `tinyint(1)` (boolean)
  - Default: `0` (disabled)
- Added `drop_cap_font` column to the `stories` table
  - Type: `varchar(50)`
  - Default: `'serif'`
  - Options: `serif`, `cinzel`, `playfair`, `cormorant`, `unna`, `crimson`
- Migration file: `migrations/add_drop_cap_to_stories.sql`

### 2. Admin Interface
**Location:** Admin Dashboard → Stories → Create/Edit Story

A new checkbox appears in the story form:
- Label: "Enable Drop Cap (Manuscript Style)"
- Description: "When enabled, the first letter of each chapter will be larger and top-aligned (traditional manuscript style)"

When enabled, a **font dropdown** appears with these options:
- **Classic Serif (Default)** - Georgia font, traditional and readable
- **Cinzel** - Elegant Roman-style capitals, inspired by classical inscriptions
- **Playfair Display** - High-contrast serif with dramatic flourishes
- **Cormorant** - Delicate serif inspired by Garamond, elegant and refined
- **Unna** - Traditional newspaper-style serif
- **Crimson Pro** - Editorial serif with excellent readability

All decorative fonts are loaded from Google Fonts automatically when selected.

### 3. Frontend Display
When enabled for a story, each chapter will display with:
- First letter of the **first paragraph** is 3.5em (3.5x normal size)
- First letter of any paragraph **immediately after a page break** also gets the drop cap treatment
- Each drop cap floats left and aligns with the top of the paragraph
- Font weight is increased to 600 (semi-bold)
- Custom font family based on your selection
- Color adapts to the current theme (light/dark)

This creates a beautiful manuscript-style rhythm throughout your chapters - major sections get their own decorative initial!

## Testing Instructions

### Step 1: Run the Database Migration
```bash
# Connect to your MySQL database
mysql -u your_username -p your_database < migrations/add_drop_cap_to_stories.sql
```

### Step 2: Enable Drop Cap for a Story
1. Navigate to the admin dashboard: `/admin`
2. Go to the "Stories" section
3. Either create a new story or edit an existing one
4. Check the "Enable Drop Cap (Manuscript Style)" checkbox
5. Select a font from the dropdown (try "Cinzel" or "Playfair Display" for a dramatic effect)
6. Save the story

### Step 3: View the Chapter
1. Navigate to any chapter in the story you just modified
2. The first letter of the first paragraph should now be larger, top-aligned, and in the selected font
3. Test in both light and dark themes using the theme toggle
4. Try different fonts to see which matches your story's aesthetic

### Expected Behavior

**With Drop Cap Enabled:**
```
W hen recounting the boyhood of Iñigo...
  [body text continues]

--- (page break image appears here) ---

H e came to the armory as others came...
  [body text continues]

--- (page break image appears here) ---

I ñigo's father's sword rested on its stand...
  [body text continues]
```

Each section after a page break gets its own decorative initial, creating visual rhythm.

**With Drop Cap Disabled (default):**
```
When recounting the boyhood...
[text flows normally throughout]
```

## CSS Styling Details

The drop cap is styled with the `.drop-cap` class:
- `float: left` - Allows text to wrap around
- `font-size: 3.5em` - Makes the letter 3.5x larger
- `line-height: 0.85` - Tight line height for proper alignment
- `margin-right: 0.1em` - Small space between cap and text
- `margin-top: 0.05em` - Slight top margin for alignment
- `font-weight: 600` - Semi-bold for emphasis
- `font-family` - Dynamic based on selected font (loaded from Google Fonts if needed)

## Files Modified

### Database
- `unified-schema.sql` - Added `enable_drop_cap` and `drop_cap_font` column definitions
- `migrations/add_drop_cap_to_stories.sql` - Migration for existing databases

### Frontend TypeScript/React
- `src/components/admin/StoryManager.tsx` - Added checkbox UI, font dropdown, and form handling
- `src/features/storytime/utils/api-story.ts` - Added `enableDropCap` and `dropCapFont` to Story interface
- `src/features/storytime/components/Chapter.tsx` - Added drop cap parsing, CSS, and Google Fonts loading
- `src/features/storytime/components/RenderedMarkdown.tsx` - Added drop cap support with font selection

### Backend API
- `api/stories/create.php` - Handle `enable_drop_cap` and `drop_cap_font` in INSERT
- `api/stories/update.php` - Handle `enable_drop_cap` and `drop_cap_font` in UPDATE
- `api/stories/list.php` - Returns both fields (via SELECT *)

## Troubleshooting

**Drop cap not showing:**
1. Verify the database migration ran successfully
2. Check that the story has `enable_drop_cap = 1` in the database
3. Ensure the chapter has at least one paragraph starting with a letter
4. Clear browser cache and refresh

**Drop cap looks misaligned:**
- This is expected for some fonts; the CSS can be adjusted in Chapter.tsx or RenderedMarkdown.tsx
- Look for the `.drop-cap` class in the style block

**Theme not updating:**
- The drop cap color should automatically adapt when switching themes
- If not, try refreshing the page after switching themes
