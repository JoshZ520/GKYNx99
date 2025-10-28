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
app.use(express.static(path.join(__dirname, '..')));
// Basic route to test server is working
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});
// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);
    // Send a welcome message to the newly connected client
    socket.emit('welcome', {
        message: 'Welcome to Table Talk!',
        socketId: socket.id,
        timestamp: new Date().toLocaleTimeString()
    });
    // STEP 2: Handle test messages from clients
    socket.on('test-message', (data) => {
        console.log('📨 Test message received from', socket.id, ':', data.message);
        // Send a response back to the same client
        socket.emit('test-response', {
            message: `Server received: "${data.message}"`,
            serverTime: new Date().toLocaleTimeString(),
            yourId: socket.id
        });
        // Also broadcast to ALL other connected clients
        socket.broadcast.emit('someone-sent-message', {
            from: socket.id,
            message: data.message,
            timestamp: new Date().toLocaleTimeString()
        });
    });
    // Listen for disconnection
    socket.on('disconnect', (reason) => {
        console.log('❌ Client disconnected:', socket.id, 'Reason:', reason);
    });
});
// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('🚀 Table Talk server running on port', PORT);
    console.log('📱 Open http://localhost:3000 in your browser');
    console.log('👀 Watch this console for connection logs');
});