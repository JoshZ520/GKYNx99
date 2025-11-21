// Load environment variables from .env file in development
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const staticPath = process.env.NODE_ENV === 'production' 
    ? path.join(__dirname, '..') 
    : path.join(__dirname, '..');
app.use(express.static(staticPath, {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
        else if (filePath.endsWith('.js')) res.setHeader('Content-Type', 'text/javascript');
        else if (filePath.endsWith('.json')) res.setHeader('Content-Type', 'application/json');
        else if (filePath.endsWith('.html')) res.setHeader('Content-Type', 'text/html');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
}));
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

const gameRooms = new Map();

function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function createPairs(playerIds) {
    // Create mutual pairs where A gets B's answer and B gets A's answer
    // playerIds should already include host if they answered
    
    if (playerIds.length === 0) return new Map();
    if (playerIds.length === 1) {
        // Single player - no pairing possible
        return new Map();
    }
    
    // Shuffle the player IDs for randomness
    const shuffled = [...playerIds];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    const pairs = new Map();
    
    // Create pairs from shuffled list
    for (let i = 0; i < shuffled.length - 1; i += 2) {
        const player1 = shuffled[i];
        const player2 = shuffled[i + 1];
        pairs.set(player1, player2);
        pairs.set(player2, player1);
    }
    
    // If odd number, the last person doesn't get paired this round
    if (shuffled.length % 2 === 1) {
        const lastPlayer = shuffled[shuffled.length - 1];
        pairs.set(lastPlayer, null); // Mark as unpaired
    }
    
    return pairs;
}

app.get('/', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, '../pages/index.html'));
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

app.get('/player', (req, res) => {
    res.redirect('/pages/player/index.html');
});

app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        rooms: gameRooms.size 
    });
});

app.get('/api/env', (req, res) => {
    res.json({ 
        isDev: process.env.NODE_ENV !== 'production'
    });
});

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    socket.emit('welcome', {
        message: 'Welcome to Table Talk!',
        socketId: socket.id,
        timestamp: new Date().toLocaleTimeString()
    });
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
        
        socket.emit('room-created', {
            roomCode: roomCode,
            success: true
        });
    });

    socket.on('join-room', (data) => {
        const { roomCode, playerName } = data;
        const room = gameRooms.get(roomCode);
        
        if (!room) {
            socket.emit('join-error', { message: 'Room not found' });
            return;
        }
        
        const existingPlayer = room.players.find(p => p.name === playerName);
        if (existingPlayer) {
            socket.emit('join-error', { message: 'Player name already taken' });
            return;
        }
        const player = {
            id: socket.id,
            name: playerName,
            joinedAt: new Date().toISOString()
        };
        
        room.players.push(player);
        socket.join(roomCode);
        
        socket.emit('joined-room', {
            roomCode: roomCode,
            playerName: playerName,
            success: true
        });
        
        io.to(roomCode).emit('player-joined', {
            player: player,
            totalPlayers: room.players.length
        });
    });

    socket.on('rejoin-room', (data) => {
        const { roomCode, isHost } = data;
        const room = gameRooms.get(roomCode);
        
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }
        
        if (isHost) {
            if (room.hostDisconnectTimeout) {
                clearTimeout(room.hostDisconnectTimeout);
                room.hostDisconnectTimeout = null;
            }
            
            if (room.hostId !== socket.id) {
                room.hostId = socket.id;
            }
            socket.join(roomCode);
            socket.emit('rejoined-room', { roomCode: roomCode, success: true });
        }
    });

    socket.on('start-game', (data) => {
        const { roomCode } = data;
        const room = gameRooms.get(roomCode);
        
        if (!room || room.hostId !== socket.id) {
            socket.emit('error', { message: 'Not authorized' });
            return;
        }
        
        socket.to(roomCode).emit('game-started', {
            roomCode: roomCode,
            timestamp: new Date().toISOString()
        });
    });

    socket.on('broadcast-question', (data) => {
        const { roomCode, question } = data;
        const room = gameRooms.get(roomCode);
        
        if (!room || room.hostId !== socket.id) {
            socket.emit('error', { message: 'Not authorized' });
            return;
        }
        
        room.currentQuestion = question;
        room.questionInProgress = true;
        room.answers.clear();
        
        io.to(roomCode).emit('new-question', {
            question: question,
            timestamp: new Date().toISOString()
        });
    });

    socket.on('submit-answer', (data) => {
        const { roomCode, answer } = data;
        const room = gameRooms.get(roomCode);
        
        if (!room || !room.questionInProgress) {
            socket.emit('error', { message: 'No active question' });
            return;
        }
        
        const player = room.players.find(p => p.id === socket.id);
        if (!player) {
            socket.emit('error', { message: 'Player not found' });
            return;
        }
        
        room.answers.set(socket.id, {
            playerId: socket.id,
            playerName: player.name,
            answer: answer,
            timestamp: new Date().toISOString()
        });
        
        const hostSocket = io.sockets.sockets.get(room.hostId);
        if (hostSocket) {
            hostSocket.emit('answer-received', {
                answeredCount: room.answers.size,
                totalPlayers: room.players.length,
                playerName: player.name
            });
        }
        
        socket.emit('answer-confirmed', {
            success: true,
            answer: answer
        });
    });

    socket.on('reveal-answers', (data) => {
        const { roomCode, hostAnswer } = data;
        const room = gameRooms.get(roomCode);
        
        if (!room || room.hostId !== socket.id) {
            socket.emit('error', { message: 'Not authorized' });
            return;
        }
        
        room.questionInProgress = false;
        
        // Get player IDs (excluding host initially)
        const playerIds = Array.from(room.answers.keys()).filter(id => id !== room.hostId);
        
        // If odd number of players and host provided an answer, include host
        if (playerIds.length % 2 === 1 && hostAnswer) {
            // Add host's answer to the pool
            room.answers.set(room.hostId, {
                playerId: room.hostId,
                playerName: room.hostName || 'Host',
                answer: hostAnswer,
                timestamp: new Date().toISOString(),
                isHost: true
            });
            playerIds.push(room.hostId);
        }
        
        const results = Array.from(room.answers.values());
        
        socket.emit('answers-revealed', {
            results: results,
            question: room.currentQuestion
        });
        
        const pairs = createPairs(playerIds);
        
        // Send matched answers to all participants
        playerIds.forEach((playerId) => {
            const pairedPlayerId = pairs.get(playerId);
            
            // If no pair (odd one out - shouldn't happen now), send a message
            if (pairedPlayerId === null || pairedPlayerId === undefined) {
                io.to(playerId).emit('your-answer-revealed', {
                    answer: { text: "You're the odd one out this round - no match!" },
                    playerName: 'System',
                    followUpQuestion: room.currentQuestion?.followUpQuestion || null,
                    question: room.currentQuestion,
                    isUnpaired: true
                });
            } else {
                // Normal pairing
                const pairedPlayerData = room.answers.get(pairedPlayerId);
                
                if (pairedPlayerData) {
                    io.to(playerId).emit('your-answer-revealed', {
                        answer: pairedPlayerData.answer,
                        playerName: pairedPlayerData.playerName,
                        followUpQuestion: room.currentQuestion?.followUpQuestion || null,
                        question: room.currentQuestion
                    });
                }
            }
        });
    });

    socket.on('disconnect', (reason) => {
        console.log('Client disconnected:', socket.id, 'Reason:', reason);
        
        for (const [roomCode, room] of gameRooms.entries()) {
            if (room.hostId === socket.id) {
                const cleanupTimeout = setTimeout(() => {
                    const currentRoom = gameRooms.get(roomCode);
                    if (currentRoom && currentRoom.hostId === socket.id) {
                        socket.to(roomCode).emit('host-disconnected', {
                            message: 'Host has left the game'
                        });
                        gameRooms.delete(roomCode);
                    }
                }, 5000);
                room.hostDisconnectTimeout = cleanupTimeout;
            } else {
                const playerIndex = room.players.findIndex(p => p.id === socket.id);
                if (playerIndex > -1) {
                    const player = room.players[playerIndex];
                    room.players.splice(playerIndex, 1);
                    room.answers.delete(socket.id);
                    
                    io.to(roomCode).emit('player-left', {
                        player: player,
                        totalPlayers: room.players.length
                    });
                }
            }
        }
    });
});
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