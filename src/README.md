# Source Code Structure

This directory contains the modularized source code for the GKYNx99 game application.

## 📁 Directory Organization

### `/config`
**Purpose:** Centralized configuration and utility functions

**Files:**
- `game-config.js` - Game configuration constants, DOM IDs, and CONFIG_UTILS helper methods

**Key Features:**
- `GAME_CONFIG` - Constants for DOM IDs, CSS classes, messages, and game settings
- `CONFIG_UTILS` - Helper methods for DOM manipulation (show/hide/setText/getElement/etc.)

---

### `/core`
**Purpose:** Essential game logic and coordination

**Files:**
- `question-manager.js` - Question loading, display, navigation, and topic management
- `player-manager.js` - Player management coordinator (orchestrates turn, answer, resume modules)

**Key Responsibilities:**
- Question lifecycle management
- Player turn coordination
- Game state management

---

### `/player`
**Purpose:** Player-related functionality consolidated in one location

**Files:**
- `player-setup-utils.js` - Shared utilities for player input generation and validation
- `player-turn-manager.js` - Turn management and player indicator updates
- `answer-recorder.js` - Answer recording, submission state, and final submission
- `game-resume-manager.js` - Resume game functionality and results button setup

**Key Features:**
- Player name collection and validation
- Turn advancement logic
- Answer submission tracking
- Game resume after page refresh

---

### `/ui`
**Purpose:** User interface management and theming

**Files:**
- `ui-manager.js` - UI interactions for topics, preferences, and question display
- `ui-mode-switcher.js` - Game mode selection (offline/multiplayer) on index page
- `theme-utilities.js` - Theme switching (light/dark mode) functionality

**Key Features:**
- Topic selection and preference handling
- Mode switching UI logic
- Theme persistence across pages
- Custom UI components

---

### `/transport`
**Purpose:** Game mode implementations (offline and multiplayer)

#### Root Files:
- `transport-interface.js` - Common interface for transport layers
- `player-client.js` - Player client functionality
- `offline-handler.js` - Offline mode coordinator

#### `/transport/offline`
**Offline mode implementation**

**Files:**
- `player-setup.js` - Player setup and validation for offline mode (consolidated from multiple files)
- `game-handler.js` - Answer selection and submission logic for offline
- `results.js` - Results display for offline mode


#### `/transport/multiplayer`
**Multiplayer mode implementation**

**Files:**
- `handler.js` - Main multiplayer coordinator and event listener setup
- `room-manager.js` - Socket connection, room creation, player list management
- `game-coordinator.js` - Question broadcasting and answer coordination
- `results-display.js` - Results display for multiplayer mode

**Key Features:**
- WebSocket-based real-time multiplayer
- Room creation and joining
- Player synchronization
- Answer reveal coordination

---

### `/data`
**Purpose:** Game data and content

**Structure:**
```
/data
  /questions
    /topics
      - Individual topic JSON files
```

**Contains:**
- Question data organized by topic
- Game content that can be updated independently

---

### `/utilities`
**Purpose:** Remaining utility functions (if any)

**Note:** Most utilities have been moved to `/player`, `/ui`, or `CONFIG_UTILS` in `/config`.

---

## 🔧 Import Patterns

### Using CONFIG_UTILS:
```javascript
import { GAME_CONFIG, CONFIG_UTILS } from '../config/game-config.js';

// DOM manipulation
CONFIG_UTILS.show('elementId');
CONFIG_UTILS.hide('elementId');
CONFIG_UTILS.setText('elementId', 'text');

// Element lookup - two methods:
CONFIG_UTILS.getElementById('CONSTANT_KEY'); // For GAME_CONFIG.DOM_IDS constants
CONFIG_UTILS.getElement('direct-id');        // For direct ID strings or elements
```

### Module Imports:
```javascript
// Core modules
import { ... } from '../core/question-manager.js';
import { ... } from '../core/player-manager.js';

// Player modules
import { ... } from '../player/player-turn-manager.js';
import { ... } from '../player/answer-recorder.js';

// UI modules
import { ... } from '../ui/ui-manager.js';

// Transport modules
import { ... } from '../transport/offline/game-handler.js';
import { ... } from '../transport/multiplayer/room-manager.js';
```

---

## 🎯 Design Principles

1. **Single Responsibility:** Each file has a clear, focused purpose
2. **Domain Organization:** Files grouped by functional domain (player, ui, transport)
3. **No Redundancy:** Removed duplicate player-setup files and consolidated utilities
4. **Clear Naming:** File names are descriptive without redundant prefixes
5. **Centralized Config:** All constants and shared utilities in one place

---

## 🚀 Getting Started

### For Development:
1. Core game logic is in `/core`
2. Player features are in `/player`
3. UI changes are in `/ui`
4. Mode-specific logic is in `/transport/offline` or `/transport/multiplayer`

### Adding New Features:
- **New question type?** → Modify `/core/question-manager.js`
- **Player feature?** → Add to `/player` directory
- **UI component?** → Add to `/ui` directory
- **Multiplayer feature?** → Add to `/transport/multiplayer`
- **Offline feature?** → Add to `/transport/offline`

---

## 📝 File Naming Conventions

- **Descriptive names:** `question-manager.js`, `player-turn-manager.js`
- **No redundant prefixes:** Use folder structure for context
  - ✅ `/offline/game-handler.js` 
  - ❌ `/offline/offline-game-handler.js`
- **Kebab-case:** Use hyphens for multi-word files
- **Specific suffixes:** `-manager`, `-handler`, `-coordinator`, `-utils`

---

## 🔄 Recent Reorganization (Nov 2025)

### Changes Made:
1. ✅ Consolidated all player files → `/player`
2. ✅ Consolidated all UI files → `/ui`
3. ✅ Created `/core` for essential game logic
4. ✅ Removed redundant file name prefixes in `/transport` subdirectories
5. ✅ Deleted empty `/features` and `/game/player` directories
6. ✅ Updated all import paths across the codebase

### Benefits:
- Easier navigation and file discovery
- Clear separation of concerns
- Reduced cognitive load when adding features
- Better scalability for future development
