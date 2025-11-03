# Offline Fallback System

This directory contains the **offline fallback** version of Table Talk for situations where multiplayer isn't available.

## When to Use This

- **Server is down** - No internet connection to multiplayer server
- **Testing locally** - Want to test game logic without networking
- **Backup mode** - Multiplayer fails and you need a quick alternative
- **Single device** - Only one device available for all players

## Fallback Structure

```
fallback/
├── front-pg.html → Player setup (enter names)
├── display.html → Results display page
├── scripts/
│ ├── answers.js → Answer processing utilities
│ ├── question.js → Question display logic
│ └── display.js → Results page logic
└── stylesheets/
├── front_style.css → Player setup styling
└── display.css → Results page styling
```

## How to Use Fallback Mode

### Option 1: Direct Access
```
1. Open fallback/front-pg.html in browser
2. Set up players manually
3. Play on single device (pass around)
4. View results on fallback/display.html
```

### Option 2: Automatic Fallback (Recommended)
Add this to your main index.html to auto-detect server issues:
```javascript
// Auto-fallback if multiplayer fails
setTimeout(() => {
if (!multiplayerConnected) {
window.location.href = 'fallback/front-pg.html';
}
}, 5000); // 5 second timeout
```

## Integration with Main Game

The fallback uses the same:
- **Question data** from `/files/topics/`
- **Image assets** from `/images/`
- **Session utilities** (shared from main)
- **Theme utilities** (shared from main)

## ️ Limitations of Fallback Mode

- **No real-time sync** - Players take turns on one device
- **Manual progression** - Host controls everything manually
- **No phone interface** - Everyone uses the main screen
- **Basic UI** - Simpler interface than multiplayer version

## ️ Maintenance

When updating the main game:
1. **Questions/Topics** - Automatically work in fallback
2. **Core game logic** - May need to update fallback scripts
3. **Styling** - Keep fallback CSS in sync if needed

---

**Tip**: This fallback ensures your game **always works** even if technology fails!