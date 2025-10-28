# Contributing Images to the Preference System
## Overview
This project uses a picture-based preference system where users choose between two visual options. You can easily contribute images to make the experience more engaging!
## How to Add Images
### 1. Image Requirements
- **Format**: JPG, PNG, or WebP
- **Size**: Minimum 280x180px (will be scaled to fit)
- **Quality**: Clear, high-contrast images work best
- **Content**: Should clearly represent the option (e.g., beach scene for "Beach" option)
### 2. Folder Structure
```
images/preferences/
├── dnd/
│   ├── combat.jpg
│   ├── roleplay.jpg
│   ├── homebrew.jpg
│   └── official.jpg
├── movies/
│   ├── action.jpg
│   ├── comedy.jpg
│   ├── theater.jpg
│   └── streaming.jpg
├── food/
│   ├── sweet.jpg
│   ├── savory.jpg
│   ├── cooking.jpg
│   └── ordering.jpg
└── [other-topics]/
    ├── option1-name.jpg
    └── option2-name.jpg
```
### 3. Naming Convention
- Use lowercase names matching the option text
- Replace spaces with hyphens (e.g., "Road Trip" becomes "road-trip.jpg")
- Keep names descriptive but concise
### 4. Current Topics & Options
Check `files/questions.json` for the complete list, but here are some examples:
**Food Topic**:
- sweet.jpg / savory.jpg
- cooking.jpg / ordering.jpg
- breakfast.jpg / dinner.jpg
**Travel Topic**:
- beach.jpg / mountains.jpg
- road-trip.jpg / flying.jpg
- relaxing.jpg / adventure.jpg
**Tech Topic**:
- iphone.jpg / android.jpg
- mac.jpg / pc.jpg
- social-media.jpg / messaging-apps.jpg
### 5. Implementation
Once you add images, update the CSS in `stylesheets/style.css`:
Find this section in `.preference-image`:
```css
/* CONTRIBUTOR NOTE: Replace this section with:
 * background-image: url('path/to/your/image.jpg');
 * background-size: cover;
 * background-position: center;
 * Remove the gradient and text styles above
 */
```
Replace with:
```css
background-image: url('../images/preferences/[topic]/[option-name].jpg');
background-size: cover;
background-position: center;
```
Or modify the JavaScript to dynamically load images based on the current topic and options.
## Free Image Resources
### Recommended Sources:
- **Unsplash** (unsplash.com) - High quality, free stock photos
- **Pixabay** (pixabay.com) - Free images, illustrations, vectors
- **Pexels** (pexels.com) - Free stock photos and videos
- **Wikimedia Commons** - Public domain images
### Tips:
- Search for generic concepts (e.g., "cooking" instead of specific dishes)
- Choose images with clear visual contrast to the text overlay
- Avoid images with too much text or busy patterns
- Consider the mood/tone you want to convey
## Testing Your Changes
1. Open `game.html` in your browser
2. Select different topics from the dropdown
3. Verify images load correctly and are visually appealing
4. Test on mobile devices for responsiveness
## Need Help?
- Check existing topics for examples
- Look at the current CSS placeholder system
- The JavaScript handles dynamic content loading
- Images should work immediately once properly named and placed
Happy contributing! 🎨