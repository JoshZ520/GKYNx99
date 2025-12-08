# Timer Implementation - Planning & Refinements

## Core Requirements
- Timer starts when host clicks "Final Answer" button
- Duration comes from Settings section (configurable before game)
- Timer is for discussion phase between matched players
- Only host sees settings section
- Settings accessible mid-game but pauses the game
- Settings panel has close/collapse button to resume game

## Implementation Phases

### Phase 1: Add Timer Duration Setting
- [ ] Add timer duration input field to Settings section
- [ ] Set default value (e.g., 60 seconds)
- [ ] Store in game configuration

### Phase 2: Server-Side Timer Logic
- [ ] Track `discussionTimerDuration` in room state
- [ ] Add `isPaused` flag to track pause state
- [ ] Handle `pause-game` event from host
- [ ] Handle `resume-game` event from host
- [ ] Manage timer start/pause/resume with proper time accounting
- [ ] Broadcast timer state to all players

### Phase 3: Host UI (Game Page)
- [ ] Add discussion timer display during game
- [ ] Make Settings section collapsible/toggleable
- [ ] Send pause/resume events when opening/closing settings
- [ ] Display remaining time prominently

### Phase 4: Player UI (Player Page)
- [ ] Display countdown timer during discussion phase
- [ ] Show "Game Paused" indicator when paused
- [ ] Disable answer interactions during pause

### Phase 5: Timer Events
- [ ] Emit timer updates to keep all clients in sync
- [ ] Handle timer completion (move to next question)
- [ ] Handle pause/resume scenarios

## Refinement Options to Consider

### Timer Input Validation
- [ ] Min/max limits (e.g., 10-300 seconds)
- [ ] User-friendly number input with spinners or slider
- [ ] Preset buttons ("30s", "60s", "90s", "120s")

### Edge Cases & Behavior
- [ ] Timer expires but not all players paired - handle gracefully
- [ ] Host changes timer mid-discussion - apply to next round only
- [ ] Player disconnects during discussion - decide if timer pauses for others
- [ ] Should pause prevent new question selection?
- [ ] Can host change timer while paused, or only while active?

### Visual Feedback
- [ ] Timer color changes (green → yellow → red as time runs low)
- [ ] Visual progress bar in addition to number countdown
- [ ] Sound effect when time nearly expires (future enhancement)

### Settings Panel UX
- [ ] Modal overlay, sidebar, or toggle section?
- [ ] Visible "Settings" button during gameplay?
- [ ] Auto-close after saving or require explicit close?
- [ ] "Paused by Host" message to players?

### Game Flow
- [ ] What happens after timer expires? (Auto-advance, show results, wait for host)
- [ ] Should timer be optional? (Toggle to disable)
- [ ] Timer display format (MM:SS or just seconds?)

## Socket.io Events to Implement
- `pause-game` - Host pauses the game
- `resume-game` - Host resumes the game
- `discussion-timer-started` - Server tells players timer started with duration
- `timer-tick` - Periodic updates to keep clients in sync (or client-side countdown?)
- `timer-expired` - Timer reached zero

## Files to Modify
- `server/server.js` - Add timer logic and pause/resume handlers
- `pages/game.html` - Add timer display and settings visibility
- `pages/player/index.html` - Add timer display and pause indicator
- `src/transport/multiplayer/room-manager.js` - Handle timer events
- `src/transport/player-client.js` - Handle timer events on player side
- `src/transport/multiplayer/game-coordinator.js` - Manage game flow

## Notes
- Start simple: get basic timer working first
- Add visual enhancements after core functionality
- Test pause/resume edge cases thoroughly
- Consider client-side countdown to reduce server load
