# CSS Variables Reference

This file documents all the standardized CSS variables used across the project.

## Defined Variables in `shared.css`

### Colors
- `--background-dark: #1a1a1a` - Softer dark background for better readability
- `--background-light: #EADCE1` - Light background
- `--accent-dark: #8B4B5C` - Primary accent color (dark)
- `--accent-light: #e9b7bd` - Primary accent color (light)
- `--text-light: #f5f5f5` - Bright text for dark theme readability
- `--text-dark: #5F3A48` - Dark text color
- `--dark: #0d0d0d` - True dark for high contrast elements
- `--light: #ffeff5` - Light color

### Dark Theme Colors
- `--dark-card-bg: #2a2a2a` - Card backgrounds in dark theme
- `--dark-border: #4a4a4a` - Borders in dark theme
- `--dark-input-bg: #333333` - Input backgrounds in dark theme
- `--dark-text-secondary: #cccccc` - Secondary text in dark theme

### Typography
- `--font-sm: 14px` - Mobile/small text
- `--font-base: 16px` - Body text
- `--font-lg: 18px` - Large text
- `--font-xl: 20px` - Buttons/headers

### Spacing
- `--space-sm: 8px` - Small padding/gaps
- `--space-md: 16px` - Medium spacing
- `--space-lg: 20px` - Large spacing
- `--space-xl: 40px` - Extra large margins

## Variable Usage Rules

1. **Always use variables defined in `shared.css`**
2. **Never reference undefined variables** - this causes styling failures
3. **Common replacements made:**
   - `--primary-color` → `--accent-dark`
   - `--secondary-color` → `--accent-light`
   - `--accent-color` → `--accent-dark`
   - `--text-secondary` → `--text-dark`
   - `--primary-light` → `--accent-light`
   - `--secondary-light` → `--background-light`

## Files Updated
- ✅ `stylesheets/shared.css` - Defines all variables
- ✅ `stylesheets/player.css` - Fixed variable references
- ✅ `stylesheets/index.css` - Fixed variable references
- ✅ `stylesheets/game.css` - Fixed variable references
- ✅ `stylesheets/display.css` - Uses correct variables
- ✅ `stylesheets/options.css` - Uses correct variables
- ✅ `stylesheets/images.css` - Uses correct variables

All CSS variables are now consistent across the entire project!