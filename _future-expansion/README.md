# 🚀 Future Expansion Plans

This directory contains templates and planning materials for when Table Talk grows into a multi-game platform.

## 📋 Expansion Roadmap

### Phase 1: Current State ✅
- **Single Game Focus:** Table Talk is fully functional
- **Direct Access:** `index.html` → Game Setup → Play
- **Proven Architecture:** Multiplayer + Fallback system working

### Phase 2: Multi-Game Platform (Future)
- **Game Hub Landing:** Choose from multiple games
- **Modular Structure:** Each game in separate directory
- **Shared Components:** Common multiplayer, UI, utilities
- **Scalable Architecture:** Easy to add new games

## 📁 What's in This Directory

- **`_hub-template.html`** - Multi-game landing page template
- **`shared/`** - Common components for all games
  - `scripts/game-registry.js` - Central game configuration
  - `stylesheets/` - Shared CSS variables and components
- **`games/`** - Individual game directories structure

## 🔄 When to Transition

**Trigger for Phase 2:**
- When you're ready to build a second game
- When you want to position as a gaming platform
- When you need to scale beyond Table Talk

## 🛠️ Migration Steps (Future)

1. **Move Table Talk to games directory:**
   ```
   games/table-talk/index.html (current index.html)
   games/table-talk/game.html (current game.html)
   games/table-talk/scripts/ (current scripts/)
   ```

2. **Implement shared components:**
   ```
   shared/scripts/multiplayer-manager.js (universal)
   shared/stylesheets/shared.css (global variables)
   ```

3. **Update main index.html:**
   ```
   index.html becomes game selection hub
   ```

4. **Add new games using established pattern**

## 💡 Benefits of Waiting

- ✅ Keep current simplicity and speed
- ✅ Focus on perfecting Table Talk
- ✅ Avoid premature optimization
- ✅ Learn what actually needs to be shared

---

*This expansion plan ensures Table Talk stays fast and functional while providing a clear path for future growth.*