# Example: How to Add Real Images

## Current Status: CSS Placeholders
Right now, the system uses CSS-generated placeholder boxes with text. This works great for testing!

## To Add Real Images:

### 1. Add your image files:
```
images/preferences/food/
├── sweet.jpg          ← Image representing "Sweet" foods
├── savory.jpg         ← Image representing "Savory" foods  
├── cooking.jpg        ← Image of someone cooking
└── ordering.jpg       ← Image of food delivery/ordering
```

### 2. Update the CSS (Option A - Simple):
In `stylesheets/style.css`, find the `.preference-image` class and replace the placeholder styles:

**Replace this:**
```css
.preference-image {
    background: linear-gradient(135deg, var(--accent-light), var(--background-light));
    color: var(--text-dark);
    font-size: 48px;
    font-weight: bold;
}
```

**With this:**
```css
.preference-image {
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
}

.preference-image[data-option="sweet"] {
    background-image: url('../images/preferences/food/sweet.jpg');
}

.preference-image[data-option="savory"] {
    background-image: url('../images/preferences/food/savory.jpg');
}
/* Add more as needed... */
```

### 3. Update JavaScript (Option B - Dynamic):
Or modify the `displayQuestionOptions` function in `scripts/main.js` to automatically load images based on topic and option names.

The system is designed to be flexible - start simple and enhance as needed!