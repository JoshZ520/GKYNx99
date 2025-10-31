// Host-side JavaScript for Table Talk multiplayer
console.log('🎮 Host client loaded');

// Global multiplayer state
let socket = null;
let hostState = {
    isHost: false,
    roomCode: null,
    connectedPlayers: [],
    currentQuestion: null,
    waitingForAnswers: false,
    collectedAnswers: new Map()
};

// Initialize socket connection (optional, fallback to standalone)
function initializeMultiplayerSocket() {
    if (typeof io === 'undefined') {
        console.log('Socket.io not available - multiplayer disabled');
        return false;
    }

    try {
        socket = io();
        
        socket.on('connect', () => {
            console.log('✅ Host connected to server');
            showMultiplayerControls();
        });
        
        socket.on('disconnect', () => {
            console.log('❌ Host disconnected from server');
            resetMultiplayerState();
        });
        
        socket.on('connect_error', (error) => {
            console.error('❌ Host connection error:', error);
            hideMultiplayerControls();
        });
        
        // Setup multiplayer event listeners
        setupMultiplayerEventListeners();
        return true;
        
    } catch (error) {
        console.error('❌ Failed to initialize socket:', error);
        return false;
    }
}

// Setup all multiplayer socket event listeners
function setupMultiplayerEventListeners() {
    // Room creation success
    socket.on('room-created', (data) => {
        console.log('🏠 Room created successfully:', data);
        hostState.isHost = true;
        hostState.roomCode = data.roomCode;
        
        updateRoomDisplay();
        showRoomInfo();
    });
    
    // Player joined the room
    socket.on('player-joined', (data) => {
        console.log('👤 Player joined:', data);
        
        // Add player to our list if not already there
        const existingPlayer = hostState.connectedPlayers.find(p => p.id === data.player.id);
        if (!existingPlayer) {
            hostState.connectedPlayers.push(data.player);
        }
        
        updatePlayersDisplay();
        showPlayerJoinedNotification(data.player.name);
    });
    
    // Player left the room
    socket.on('player-left', (data) => {
        console.log('👋 Player left:', data);
        
        // Remove player from our list
        hostState.connectedPlayers = hostState.connectedPlayers.filter(p => p.id !== data.player.id);
        
        updatePlayersDisplay();
    });
    
    // Answer received from a player
    socket.on('answer-received', (data) => {
        console.log('💬 Answer received:', data);
        
        // Store the answer
        hostState.collectedAnswers.set(data.playerName, data);
        
        updateAnswerProgress(data.answeredCount, data.totalPlayers);
        showPlayerAnsweredNotification(data.playerName);
    });
    
    // General errors
    socket.on('error', (data) => {
        console.log('❌ Multiplayer error:', data);
        showMultiplayerError(data.message);
    });
}

// Show/hide multiplayer controls
function showMultiplayerControls() {
    const multiplayerInfo = document.getElementById('multiplayerInfo');
    if (multiplayerInfo) {
        multiplayerInfo.classList.remove('hidden');
    }
}

function hideMultiplayerControls() {
    const multiplayerInfo = document.getElementById('multiplayerInfo');
    if (multiplayerInfo) {
        multiplayerInfo.classList.add('hidden');
    }
}

// Reset multiplayer state
function resetMultiplayerState() {
    hostState = {
        isHost: false,
        roomCode: null,
        connectedPlayers: [],
        currentQuestion: null,
        waitingForAnswers: false,
        collectedAnswers: new Map()
    };
    
    hideRoomInfo();
    updateRoomDisplay();
    updatePlayersDisplay();
}

// Room creation
function createRoom() {
    if (!socket || !socket.connected) {
        showMultiplayerError('Not connected to server. Please refresh the page.');
        return;
    }
    
    const createBtn = document.getElementById('createRoomBtn');
    if (createBtn) {
        createBtn.disabled = true;
        createBtn.textContent = '🔄 Creating Room...';
    }
    
    socket.emit('create-room', {
        hostName: 'Game Host'
    });
}

// Room display management
function updateRoomDisplay() {
    const roomCodeDisplay = document.getElementById('roomCodeDisplay');
    if (roomCodeDisplay) {
        roomCodeDisplay.textContent = hostState.roomCode || '----';
    }
}

function showRoomInfo() {
    const createBtn = document.getElementById('createRoomBtn');
    const closeBtn = document.getElementById('closeRoomBtn');
    const roomDisplay = document.querySelector('.room-display');
    
    if (createBtn) {
        createBtn.classList.add('hidden');
    }
    if (closeBtn) {
        closeBtn.classList.remove('hidden');
    }
    if (roomDisplay) {
        roomDisplay.classList.remove('hidden');
    }
}

function hideRoomInfo() {
    const createBtn = document.getElementById('createRoomBtn');
    const closeBtn = document.getElementById('closeRoomBtn');
    const roomDisplay = document.querySelector('.room-display');
    
    if (createBtn) {
        createBtn.classList.remove('hidden');
        createBtn.disabled = false;
        createBtn.textContent = '🏠 Create Room for Phones';
    }
    if (closeBtn) {
        closeBtn.classList.add('hidden');
    }
    if (roomDisplay) {
        roomDisplay.classList.add('hidden');
    }
}

// Players display management
function updatePlayersDisplay() {
    const playerCount = document.getElementById('playerCount');
    const playersList = document.getElementById('connectedPlayersList');
    
    if (playerCount) {
        playerCount.textContent = hostState.connectedPlayers.length;
    }
    
    if (playersList) {
        if (hostState.connectedPlayers.length === 0) {
            playersList.innerHTML = '<div class="no-players">No players connected yet</div>';
        } else {
            playersList.innerHTML = hostState.connectedPlayers.map(player => 
                `<div class="player-item">📱 ${player.name}</div>`
            ).join('');
        }
    }
}

// Copy room code to clipboard
function copyRoomCode() {
    if (!hostState.roomCode) return;
    
    navigator.clipboard.writeText(hostState.roomCode).then(() => {
        const copyBtn = document.getElementById('copyCodeBtn');
        if (copyBtn) {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✅';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 1500);
        }
        showMultiplayerMessage(`Room code ${hostState.roomCode} copied to clipboard!`);
    }).catch(err => {
        console.error('Failed to copy room code:', err);
        showMultiplayerError('Failed to copy room code');
    });
}

// Question broadcasting (integrate with existing game logic)
function broadcastQuestionToPlayers(question) {
    if (!hostState.isHost || !socket || !socket.connected) {
        console.log('Not in multiplayer mode, skipping broadcast');
        return;
    }
    
    hostState.currentQuestion = question;
    hostState.waitingForAnswers = true;
    hostState.collectedAnswers.clear();
    
    // Convert question to multiplayer format
    const multiplayerQuestion = {
        text: question.text || question,
        options: question.options || [
            { text: question.option1 || 'Option A', value: 'A' },
            { text: question.option2 || 'Option B', value: 'B' }
        ]
    };
    
    socket.emit('broadcast-question', {
        roomCode: hostState.roomCode,
        question: multiplayerQuestion
    });
    
    console.log('📤 Question broadcasted to players:', multiplayerQuestion);
    showMultiplayerMessage(`Question sent to ${hostState.connectedPlayers.length} players`);
}

// Reveal answers (integrate with existing game logic)
function revealAnswersToPlayers() {
    if (!hostState.isHost || !socket || !socket.connected) {
        return;
    }
    
    hostState.waitingForAnswers = false;
    
    socket.emit('reveal-answers', {
        roomCode: hostState.roomCode
    });
    
    console.log('📊 Answers revealed to players');
    showMultiplayerMessage('Results shown to all players');
}

// Answer progress tracking
function updateAnswerProgress(answeredCount, totalPlayers) {
    // This could show progress in the UI
    console.log(`📊 Progress: ${answeredCount}/${totalPlayers} players answered`);
    
    // Auto-reveal when everyone has answered
    if (answeredCount === totalPlayers && totalPlayers > 0) {
        setTimeout(() => {
            if (hostState.waitingForAnswers) {
                console.log('🎉 All players answered! Auto-revealing results...');
                revealAnswersToPlayers();
            }
        }, 1000); // Small delay for better UX
    }
}

// Notification helpers
function showPlayerJoinedNotification(playerName) {
    showMultiplayerMessage(`🎉 ${playerName} joined the game!`);
}

function showPlayerAnsweredNotification(playerName) {
    showMultiplayerMessage(`✅ ${playerName} answered`);
}

function showMultiplayerMessage(message) {
    console.log('📢 Multiplayer message:', message);
    // Could show toast notifications in the UI
}

function showMultiplayerError(message) {
    console.error('❌ Multiplayer error:', message);
    // Could show error notifications in the UI
}

// Event listeners setup
function setupMultiplayerUI() {
    const createRoomBtn = document.getElementById('createRoomBtn');
    const copyCodeBtn = document.getElementById('copyCodeBtn');
    const closeRoomBtn = document.getElementById('closeRoomBtn');
    
    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', createRoom);
    }
    
    if (copyCodeBtn) {
        copyCodeBtn.addEventListener('click', copyRoomCode);
    }
    
    if (closeRoomBtn) {
        closeRoomBtn.addEventListener('click', () => {
            resetMultiplayerState();
            if (socket) {
                socket.disconnect();
                socket.connect(); // Reconnect for next use
            }
        });
    }
}

// Integration hooks for existing game logic
window.multiplayerHost = {
    broadcastQuestion: broadcastQuestionToPlayers,
    revealAnswers: revealAnswersToPlayers,
    isActive: () => hostState.isHost && hostState.connectedPlayers.length > 0
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Host multiplayer initialized');
    
    // Setup UI event listeners
    setupMultiplayerUI();
    
    // Initialize socket connection
    const socketInitialized = initializeMultiplayerSocket();
    
    if (!socketInitialized) {
        console.log('🎮 Running in standalone mode');
        hideMultiplayerControls();
    }
});

// Export for integration with existing game scripts
if (typeof window !== 'undefined') {
    window.hostMultiplayer = {
        broadcastQuestion: broadcastQuestionToPlayers,
        revealAnswers: revealAnswersToPlayers,
        isActive: () => hostState.isHost,
        getConnectedPlayers: () => hostState.connectedPlayers,
        getRoomCode: () => hostState.roomCode
    };
}