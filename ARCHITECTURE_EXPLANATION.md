# Table Talk Game - Architecture Explanation

## 🎯 Overview
Your Table Talk game supports two modes: **Offline** (single device, pass-and-play) and **Multiplayer** (host + players on phones). The architecture uses a **Transport Layer** pattern to abstract away the differences between modes.

---

## 📦 Core Architecture Layers

### 1. **Transport Interface** (`transport-interface.js`)
**What it does:** Acts as a "middleman" between your game logic and the specific mode implementations.

**Key Concept:** The game code doesn't know or care if it's offline or multiplayer—it just calls `transport.broadcastQuestion()` and the transport layer figures out what to do.

```javascript
// Game code just calls this:
window.transport.broadcastQuestion(question);

// Transport interface delegates to the correct handler:
// - Offline: Does nothing (local only)
// - Multiplayer: Sends to server via Socket.io
```

**Key Functions:**
- `registerHandler()` - Offline or multiplayer handler registers itself
- `isMultiplayer()` / `isOffline()` - Check current mode
- `broadcastQuestion()` - Send question to players
- `initializeModeUI()` - Show/hide UI elements based on mode
- `getMode()` - Returns 'offline' or 'multiplayer'

**How handlers register:**
```javascript
// Both handlers do this when they load:
window.transport.registerHandler(offlineTransportHandler);
// Only ONE handler is active at a time based on sessionStorage
```

---

### 2. **Multiplayer Handler** (`multiplayer-handler.js`)

**What it does:** Coordinates all multiplayer functionality by importing and orchestrating 3 sub-modules.

**Structure:**
```
multiplayer-handler.js (Main Coordinator)
├── multiplayer-room-manager.js (Socket connection, room creation)
├── multiplayer-game-coordinator.js (Question broadcasting, answer tracking)
└── multiplayer-results-display.js (Results display logic)
```

**Key State (`gameState` object):**
```javascript
{
    isConnected: false,        // Is socket connected?
    roomCode: null,            // e.g., "AB12"
    isHost: false,             // Is this the host screen?
    players: [],               // Array of {id, name, joinedAt}
    currentPage: 'game',       // 'index', 'game', or 'player'
    allQuestionResults: [],    // Stored results from all questions
    currentQuestion: null      // Current question being asked
}
```

**Flow Example (Multiplayer):**
1. Host clicks "Create Room" → `createRoom()` → Socket emits `'create-room'` → Server generates code
2. Players join → Socket emits `'join-room'` → Server adds to room, notifies host
3. Host clicks "Start Game" → Navigate to game.html with roomCode in sessionStorage
4. Host selects topic → `applyQuestionsForTopic()` → `transport.broadcastQuestion()` → Socket emits `'broadcast-question'`
5. Server receives → Broadcasts to all players via `io.to(roomCode).emit('new-question')`
6. Players receive → Display question with answer buttons
7. Players submit → Socket emits `'submit-answer'` → Server stores and notifies host
8. When all answered → Auto-calls `revealAnswers()` → Socket emits `'reveal-answers'`
9. Server compiles results → Emits `'answers-revealed'` back to host only

---

### 3. **Offline Handler** (`offline-handler.js`)

**What it does:** Coordinates offline mode by importing 4 sub-modules.

**Structure:**
```
offline-handler.js (Main Coordinator)
├── offline-player-setup.js (Player input generation, validation)
├── offline-game-handler.js (Preference selection, answer handling)
├── offline-results.js (Results display with progress bars)
└── offline-html-loader.js (HTML injection for offline UI)
```

**Key Functions:**
- `startOfflineGame()` - Validates players, saves to sessionStorage, navigates to game.html
- `displayQuestionOptionsOffline()` - Shows clickable preference buttons
- `selectAnswerOffline()` - Records answer for current player
- `submitOfflineAnswer()` - Advances to next player or shows results

**Flow Example (Offline):**
1. User enters player count → `generatePlayerInputs()` creates name fields
2. Fills in names → `startOfflineGame()` → Stores in sessionStorage → Navigate to game.html
3. Selects topic → Question displays
4. Player 1 clicks answer → `selectAnswerOffline()` → Highlights selection
5. Clicks "Submit Answer" → `recordPlayerAnswer()` → Advances to Player 2
6. After all answer → Click "Show Results" → `populateResults()` displays bars

**No network involved** - all state stored locally in sessionStorage.

---

### 4. **Server** (`server.js`)

**What it does:** Node.js/Express server with Socket.io for real-time multiplayer communication.

**Key Components:**
- **Express** - Serves static files (HTML/CSS/JS)
- **Socket.io** - Real-time bidirectional communication
- **gameRooms Map** - Stores active rooms in memory

**Room Structure:**
```javascript
{
    code: "AB12",
    hostId: "socket_id_123",
    players: [{id, name, joinedAt}],
    currentQuestion: {...},
    questionInProgress: true,
    answers: Map(socketId => answerData),
    createdAt: "2025-11-11T..."
}
```

**Socket Events:**
| Event | Direction | Purpose |
|-------|-----------|---------|
| `create-room` | Client→Server | Generate room code |
| `room-created` | Server→Client | Return room code to host |
| `join-room` | Client→Server | Player joins with code |
| `joined-room` | Server→Client | Confirm join success |
| `player-joined` | Server→All | Notify everyone new player joined |
| `start-game` | Client→Server | Host starts game |
| `game-started` | Server→Players | Notify players game starting |
| `broadcast-question` | Client→Server | Host sends question |
| `new-question` | Server→All | Send question to everyone |
| `submit-answer` | Client→Server | Player submits answer |
| `answer-received` | Server→Host | Notify host of submission |
| `reveal-answers` | Client→Server | Host reveals answers |
| `answers-revealed` | Server→Host | Send compiled results |

---

### 5. **Question Manager** (`question-manager.js`)

**What it does:** Manages the question list, navigation (prev/next/random), and topic selection.

**Key Functions:**
- `applyQuestionsForTopic(topic)` - Loads questions from selected topic, broadcasts first question
- `switchToNextQuestion()` - Moves to next question, broadcasts it
- `switchToPreviousQuestion()` - Moves to previous question, broadcasts it
- `pickRandomTopic()` - Selects random topic from available list

**Smart Broadcasting:**
```javascript
// Automatically broadcasts in multiplayer, does nothing in offline
if (window.transport && window.transport.isMultiplayer()) {
    window.transport.broadcastQuestion(currentQuestion);
}
```

**Question Format:**
```javascript
{
    prompt: "Beach or Mountains?",
    option1: "Beach",
    option2: "Mountains",
    images: {
        option1: "/images/beach.jpg",
        option2: "/images/mountains.jpg"
    }
}
```

---

### 6. **Player Client** (`player-client.js`)

**What it does:** Runs on players' phones - connects to server, receives questions, submits answers.

**State (`playerState` object):**
```javascript
{
    name: "Alice",
    roomCode: "AB12",
    currentQuestion: {...},
    hasAnswered: false
}
```

**UI Sections:**
1. **Join Section** - Enter room code and name
2. **Waiting Section** - Shows room code, waiting for game to start
3. **Question Section** - Displays question with answer buttons
4. **Answer Status** - Shows "Answer submitted, waiting for others..."
5. **Results Section** - Shows what everyone answered (future feature)

**Flow:**
1. Player opens `/pages/player/index.html` on phone
2. Enters room code + name → Socket emits `'join-room'`
3. Server confirms → Shows waiting section
4. Host starts game → Receives `'game-started'` event
5. Host broadcasts question → Receives `'new-question'` → Shows question + buttons
6. Player taps answer → Socket emits `'submit-answer'`
7. Server confirms → Receives `'answer-confirmed'` → Shows "Waiting..." status

---

## 🔄 Complete Multiplayer Flow (Step-by-Step)

### **Setup Phase:**
1. **Host** opens browser → localhost:3000
2. **Transport interface** loads → Waits for handler registration
3. **Multiplayer handler** loads → Registers with transport → Calls `initSocket()`
4. **Socket connects** → `gameState.isConnected = true`
5. **Host** clicks "Create Multiplayer Game" → `createRoom()`
6. **Socket** emits `'create-room'` → **Server** generates code (e.g., "XY98")
7. **Server** emits `'room-created'` → **Host** displays room code
8. **Players** open phone browser → Go to `/player`
9. **Player** enters code "XY98" + name "Alice" → Socket emits `'join-room'`
10. **Server** adds Alice to room → Emits `'joined-room'` to Alice + `'player-joined'` to everyone
11. **Host** sees "Alice joined!" notification
12. Repeat for more players...
13. **Host** clicks "Start Game (3 players)" → `startGame()` function runs

### **Game Phase:**
14. **`startGame()`** saves room data to sessionStorage → Navigates to `/pages/game.html`
15. **Game page** loads → Multiplayer handler reads sessionStorage → Reconnects to room
16. **Host** clicks topic dropdown → Selects "Food" → `applyQuestionsForTopic('food')`
17. **Question manager** loads first question → Calls `transport.broadcastQuestion()`
18. **Transport** → **Multiplayer handler** → **Socket** emits `'broadcast-question'`
19. **Server** receives → Stores in `room.currentQuestion` → Emits `'new-question'` to ALL in room
20. **All players'** phones receive → Display question: "Pizza or Tacos?" with 2 buttons
21. **Alice** taps "Pizza" → Socket emits `'submit-answer'` with `{answer: "Pizza"}`
22. **Server** stores answer → Emits `'answer-received'` to host: `{answeredCount: 1, totalPlayers: 3}`
23. **Host** sees progress: "1/3 players answered"
24. **Bob** taps "Tacos" → Progress updates to "2/3"
25. **Charlie** taps "Pizza" → Progress updates to "3/3"
26. **Auto-trigger**: After 500ms → `revealAnswers()` called
27. **Socket** emits `'reveal-answers'` → **Server** compiles results
28. **Server** emits `'answers-revealed'` with results array:
    ```javascript
    [
        {playerName: "Alice", answer: "Pizza"},
        {playerName: "Bob", answer: "Tacos"},
        {playerName: "Charlie", answer: "Pizza"}
    ]
    ```
29. **Host** stores in `gameState.allQuestionResults[]`
30. **"End Game"** button appears
31. **Host** clicks "Random Question" button → Next question broadcasts → Repeat from step 20

### **Results Phase:**
32. **Host** clicks "End Game & Show All Results" → `showAllResults()`
33. Displays modal with navigation: "Question 1 of 5"
34. Shows who answered what for each question
35. Can navigate prev/next through results

---

## 🔍 Key Design Patterns

### **1. Transport Layer Pattern**
Game code doesn't know the mode - it just calls transport methods:
```javascript
// Instead of:
if (isMultiplayer) { socket.emit(...) } 
else { /* do nothing */ }

// We do:
transport.broadcastQuestion(question); // Works in both modes!
```

### **2. Coordinator Pattern**
Main handlers (multiplayer-handler.js, offline-handler.js) import and coordinate sub-modules:
```javascript
// multiplayer-handler.js
import { createRoom } from './multiplayer-room-manager.js';
import { broadcastQuestion } from './multiplayer-game-coordinator.js';
import { showResults } from './multiplayer-results-display.js';

// Acts as facade - exposes simple API
window.createRoom = createRoom;
```

### **3. Event-Driven Architecture**
Socket.io events drive the multiplayer flow - no polling needed:
```javascript
socket.on('new-question', (data) => {
    showQuestionSection(data.question); // Instant updates!
});
```

### **4. Session Storage for State Persistence**
Mode and game data survives page navigation:
```javascript
// index.html → game.html navigation
sessionStorage.setItem('multiplayerRoom', JSON.stringify({
    roomCode: 'XY98',
    isHost: true,
    players: [...]
}));
```

---

## ⚠️ Potential Issues I Found

### **1. Missing Options Handling** ✅ FIXED
The multiplayer-game-coordinator wasn't handling all question formats properly. You undid my fix, so let me re-add it:

**Issue:** If `question.options` is an array of strings like `["Pizza", "Tacos"]`, it wasn't converting to the format player-client expects: `[{text: "Pizza", value: "option1"}, ...]`

**Fix needed in `multiplayer-game-coordinator.js`:**
