// server.js - Step 1: Basic Express + Socket.io server
// This is our starting point - just connection testing
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // Allow all origins for development
        methods: ["GET", "POST"]
    }
});
// Serve static files (your current HTML/CSS/JS)
// In production, serve from parent directory; in development, same behavior
const staticPath = process.env.NODE_ENV === 'production' 
    ? path.join(__dirname, '..') 
    : path.join(__dirname, '..');

// Configure proper MIME types for static files
app.use(express.static(staticPath, {
    setHeaders: (res, filePath) => {
        // Set proper MIME types for different file extensions
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'text/javascript');
        } else if (filePath.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/json');
        } else if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html');
        }
        // Add cache control for better performance
        res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
}));

// Add explicit static file serving for common paths with proper MIME types
app.use('/stylesheets', express.static(path.join(__dirname, '../stylesheets'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));
app.use('/scripts', express.static(path.join(__dirname, '../scripts')));
app.use('/images', express.static(path.join(__dirname, '../images')));
app.use('/pages', express.static(path.join(__dirname, '../pages')));
app.use('/src', express.static(path.join(__dirname, '../src'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'text/javascript');
        } else if (filePath.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/json');
        }
    }
}));
app.use('/assets', express.static(path.join(__dirname, '../assets'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

// Game rooms storage - in production, you'd use a database
const gameRooms = new Map();

// Generate unique room codes
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoiding confusing chars like I, O, 1, 0
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Basic route to test server is working
app.get('/', (req, res) => {
    try {
        const indexPath = path.join(__dirname, '../pages/index.html');
        console.log('Serving index.html from:', indexPath);
        res.sendFile(indexPath);
    } catch (error) {
        console.error('Error serving index.html:', error);
        res.status(500).send('Server Error: Cannot serve index.html');
    }
});

// Route for phone players to join games
// This redirects to the full path so relative URLs work correctly
app.get('/player', (req, res) => {
    res.redirect('/pages/player/index.html');
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        rooms: gameRooms.size 
    });
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    // Send a welcome message to the newly connected client
    socket.emit('welcome', {
        message: 'Welcome to Table Talk!',
        socketId: socket.id,
        timestamp: new Date().toLocaleTimeString()
    });

    // HOST EVENTS - Create and manage game rooms
    socket.on('create-room', (data) => {
        const roomCode = generateRoomCode();
        const room = {
            code: roomCode,
            hostId: socket.id,
            hostName: data.hostName || 'Host',
            players: [],
            currentQuestion: null,
            questionInProgress: false,
            answers: new Map(),
            createdAt: new Date().toISOString()
        };
        
        gameRooms.set(roomCode, room);
        socket.join(roomCode);
        
        console.log(`Room ${roomCode} created by ${socket.id}`);
        
        socket.emit('room-created', {
            roomCode: roomCode,
            success: true
        });
    });

    // PLAYER EVENTS - Join existing rooms
    socket.on('join-room', (data) => {
        const { roomCode, playerName } = data;
        const room = gameRooms.get(roomCode);
        
        if (!room) {
            socket.emit('join-error', { message: 'Room not found' });
            return;
        }
        
        // Check if player already exists
        const existingPlayer = room.players.find(p => p.name === playerName);
        if (existingPlayer) {
            socket.emit('join-error', { message: 'Player name already taken' });
            return;
        }
        
        // Add player to room
        const player = {
            id: socket.id,
            name: playerName,
            joinedAt: new Date().toISOString()
        };
        
        room.players.push(player);
        socket.join(roomCode);
        
        console.log(` ${playerName} joined room ${roomCode}`);
        
        // Notify player they joined successfully
        socket.emit('joined-room', {
            roomCode: roomCode,
            playerName: playerName,
            success: true
        });
        
        // Notify host and other players (including host!)
        io.to(roomCode).emit('player-joined', {
            player: player,
            totalPlayers: room.players.length
        });
    });

    // HOST EVENTS - Rejoin room after navigation
    socket.on('rejoin-room', (data) => {
        const { roomCode, isHost } = data;
        const room = gameRooms.get(roomCode);
        
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }
        
        if (isHost) {
            // Cancel the cleanup timeout if it exists (host reconnecting after page navigation)
            if (room.hostDisconnectTimeout) {
                clearTimeout(room.hostDisconnectTimeout);
                room.hostDisconnectTimeout = null;
                console.log(`Cancelled cleanup timeout for room ${roomCode}`);
            }
            
            if (room.hostId === socket.id) {
                // Host is already the owner, just rejoin the socket room
                socket.join(roomCode);
                console.log(`Host rejoined room ${roomCode}`);
                socket.emit('rejoined-room', { roomCode: roomCode, success: true });
            } else {
                // Different socket ID - update host ID (happens on page reload)
                const oldHostId = room.hostId;
                room.hostId = socket.id;
                socket.join(roomCode);
                console.log(`Host reconnected to room ${roomCode} (old: ${oldHostId}, new: ${socket.id})`);
                socket.emit('rejoined-room', { roomCode: roomCode, success: true });
            }
        }
    });

    // GAME EVENTS - Start game notification
    socket.on('start-game', (data) => {
        const { roomCode } = data;
        const room = gameRooms.get(roomCode);
        
        if (!room || room.hostId !== socket.id) {
            socket.emit('error', { message: 'Not authorized to start game' });
            return;
        }
        
        console.log(`Game starting in room ${roomCode}`);
        
        // Notify all players (except host) that game is starting
        socket.to(roomCode).emit('game-started', {
            roomCode: roomCode,
            timestamp: new Date().toISOString()
        });
    });

    // GAME EVENTS - Question broadcasting and answers
    socket.on('broadcast-question', (data) => {
        const { roomCode, question } = data;
        const room = gameRooms.get(roomCode);
        
        if (!room || room.hostId !== socket.id) {
            socket.emit('error', { message: 'Not authorized to broadcast questions' });
            return;
        }
        
        room.currentQuestion = question;
        room.questionInProgress = true;
        room.answers.clear();
        
        console.log(`Question broadcasted to room ${roomCode}`);
        
        // Send question to all players in room
        io.to(roomCode).emit('new-question', {
            question: question,
            timestamp: new Date().toISOString()
        });
    });

    socket.on('submit-answer', (data) => {
        const { roomCode, answer } = data;
        const room = gameRooms.get(roomCode);
        
        if (!room || !room.questionInProgress) {
            socket.emit('error', { message: 'No active question to answer' });
            return;
        }
        
        // Find player in room
        const player = room.players.find(p => p.id === socket.id);
        if (!player) {
            socket.emit('error', { message: 'Player not found in room' });
            return;
        }
        
        // Store answer
        room.answers.set(socket.id, {
            playerId: socket.id,
            playerName: player.name,
            answer: answer,
            timestamp: new Date().toISOString()
        });
        
        console.log(` ${player.name} answered in room ${roomCode}`);
        
        // Notify host of answer count
        const hostSocket = io.sockets.sockets.get(room.hostId);
        if (hostSocket) {
            hostSocket.emit('answer-received', {
                answeredCount: room.answers.size,
                totalPlayers: room.players.length,
                playerName: player.name
            });
        }
        
        // Notify player their answer was received
        socket.emit('answer-confirmed', {
            success: true,
            answer: answer
        });
    });

    socket.on('reveal-answers', (data) => {
        const { roomCode } = data;
        const room = gameRooms.get(roomCode);
        
        if (!room || room.hostId !== socket.id) {
            socket.emit('error', { message: 'Not authorized to reveal answers' });
            return;
        }
        
        room.questionInProgress = false;
        
        // Compile results
        const results = Array.from(room.answers.values());
        
        console.log(`Results recorded for room ${roomCode}`);
        
        // Send results only to host (not to players)
        socket.emit('answers-revealed', {
            results: results,
            question: room.currentQuestion
        });
    });

    // LEGACY - Keep existing test message functionality
    socket.on('test-message', (data) => {
        console.log(' Test message received from', socket.id, ':', data.message);
        socket.emit('test-response', {
            message: `Server received: "${data.message}"`,
            serverTime: new Date().toLocaleTimeString(),
            yourId: socket.id
        });
        socket.broadcast.emit('someone-sent-message', {
            from: socket.id,
            message: data.message,
            timestamp: new Date().toLocaleTimeString()
        });
    });

    // Handle disconnection and cleanup
    socket.on('disconnect', (reason) => {
        console.log('Client disconnected:', socket.id, 'Reason:', reason);
        
        // Clean up rooms where this socket was host or player
        for (const [roomCode, room] of gameRooms.entries()) {
            if (room.hostId === socket.id) {
                // Host disconnected - give them 5 seconds to reconnect (page navigation)
                console.log(`Host socket disconnected from room ${roomCode}, waiting for reconnection...`);
                
                // Set a timeout to delete the room if host doesn't reconnect
                const cleanupTimeout = setTimeout(() => {
                    // Check if the room still exists and host hasn't reconnected
                    const currentRoom = gameRooms.get(roomCode);
                    if (currentRoom && currentRoom.hostId === socket.id) {
                        console.log(`Host didn't reconnect to room ${roomCode}, cleaning up`);
                        socket.to(roomCode).emit('host-disconnected', {
                            message: 'Host has left the game'
                        });
                        gameRooms.delete(roomCode);
                    }
                }, 5000); // 5 second grace period
                
                // Store the timeout so we can cancel it if host rejoins
                room.hostDisconnectTimeout = cleanupTimeout;
                
            } else {
                // Remove player from room
                const playerIndex = room.players.findIndex(p => p.id === socket.id);
                if (playerIndex > -1) {
                    const player = room.players[playerIndex];
                    room.players.splice(playerIndex, 1);
                    room.answers.delete(socket.id);
                    
                    console.log(`${player.name} left room ${roomCode}`);
                    
                    // Notify remaining players (including host!)
                    io.to(roomCode).emit('player-left', {
                        player: player,
                        totalPlayers: room.players.length
                    });
                }
            }
        }
    });
});
// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
    console.log('Table Talk server running on port', PORT);
    console.log('Static files served from:', path.join(__dirname, '..'));
    console.log('Environment:', process.env.NODE_ENV || 'development');
    if (process.env.NODE_ENV === 'production') {
        console.log('Production server running');
    } else {
        console.log('Open http://localhost:3000 in your browser');
    }
    console.log('Watch this console for connection logs');
}).on('error', (error) => {
    console.error('Server failed to start:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
    }
    process.exit(1);
});