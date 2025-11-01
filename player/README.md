# Player View Directory

This directory contains all files related to the mobile player interface for Table Talk.

## Structure

```
player/
├── index.html              # Main player interface (mobile-optimized)
├── scripts/
│   └── player.js          # Player-side JavaScript functionality
└── stylesheets/
    └── player.css         # Player-specific styles (mobile-first)
```

## Purpose

The player view is designed for mobile devices and provides:

- **Room Joining**: Enter room code and player name
- **Question Display**: Show questions from the host
- **Answer Submission**: Submit answers to questions
- **Real-time Updates**: Live connection to game host via Socket.IO

## Access

Players access this interface by:
1. Navigating to `/player` on any device
2. Entering the room code provided by the host
3. Joining the game with their chosen name

## Technical Details

- **Mobile-First Design**: Optimized for phone screens
- **Socket.IO Client**: Real-time communication with server
- **Responsive Layout**: Works on various screen sizes
- **Touch-Friendly**: Large buttons and clear interface

## Dependencies

- Socket.IO client library (served from `/socket.io/socket.io.js`)
- Shared CSS from parent directory (`../stylesheets/shared.css`)
- Player-specific CSS (`stylesheets/player.css`)

## Development

To modify the player interface:
1. Edit `index.html` for structure changes
2. Edit `scripts/player.js` for functionality changes  
3. Edit `stylesheets/player.css` for styling changes

All changes are automatically served by the Express server.