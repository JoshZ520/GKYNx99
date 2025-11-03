// multiplayer-manager.js - Clean multiplayer system
// Handles all multiplayer functionality - room creation, player management, game integration

console.log('Table Talk App Loading...');

// === GLOBAL STATE ===
let socket = null;
let gameState = {
    isConnected: false,
    roomCode: null,
    isHost: false,
    players: [],
    currentPage: getCurrentPage()
};

// === UTILITIES ===
function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('index.html') || path === '/') return 'index';
    if (path.includes('game.html')) return 'game';
    if (path.includes('player.html')) return 'player';
    return 'unknown';
}

function showElement(id) {
    const element = document.getElementById(id);
    if (element) element.classList.remove('hidden');
}

function hideElement(id) {
    const element = document.getElementById(id);
    if (element) element.classList.add('hidden');
}

function updateStatus(message, type = 'info') {
    const statusText = document.getElementById('statusText');
    const statusDot = document.getElementById('statusDot');
    
    if (statusText) statusText.textContent = message;
    if (statusDot) {
        statusDot.className = `status-dot ${type}`;
    }
    console.log(`Status: ${message}`);
}

// === SOCKET CONNECTION ===
function initializeSocket() {
    if (typeof io === 'undefined') {
        console.log('Socket.IO not available');
        updateStatus('Server unavailable - Offline mode only', 'offline');
        return false;
    }

    try {
        socket = io();
        
        socket.on('connect', () => {
            console.log('Connected to server');
            gameState.isConnected = true;
            updateStatus('Connected to server', 'connected');
            
            if (gameState.currentPage === 'index') {
                showElement('createRoomStep');
                hideElement('offlineFallback');
            }
        });
        
        socket.on('disconnect', () => {
            console.log('Disconnected from server');
            gameState.isConnected = false;
            updateStatus('Disconnected from server', 'disconnected');
        });
        
        socket.on('room-created', (data) => {
            console.log('Room created:', data.roomCode);
            gameState.roomCode = data.roomCode;
            gameState.isHost = true;
            
            // Update UI
            const roomCodeDisplay = document.getElementById('roomCodeDisplay');
            if (roomCodeDisplay) roomCodeDisplay.textContent = data.roomCode;
            
            showElement('roomCreatedStep');
            hideElement('createRoomStep');
            updateStatus(`Room ${data.roomCode} created`, 'connected');
        });
        
        socket.on('player-joined', (data) => {
            console.log('Player joined:', data.player.name);
            gameState.players.push(data.player);
            updatePlayersList();
            updateStartButton();
        });
        
        socket.on('player-left', (data) => {
            console.log('Player left:', data.player.name);
            gameState.players = gameState.players.filter(p => p.id !== data.player.id);
            updatePlayersList();
            updateStartButton();
        });
        
        // Game page specific socket events
        socket.on('answer-received', (data) => {
            console.log('Answer received:', data.playerName);
            updateAnswerProgress(data.answeredCount, data.totalPlayers);
            
            // Show notification
            const notification = document.getElementById('playerAnsweredNotification');
            if (notification) {
                notification.textContent = `${data.playerName} answered!`;
                notification.style.display = 'block';
                setTimeout(() => {
                    notification.style.display = 'none';
                }, 2000);
            }
        });
        
        socket.on('answers-revealed', (data) => {
            console.log('Answers revealed:', data.results);
            // This would be handled by game.js
            if (typeof handleAnswersRevealed === 'function') {
                handleAnswersRevealed(data.results, data.question);
            }
        });
        
        return true;
    } catch (error) {
        console.log('Socket connection failed:', error);
        updateStatus('Connection failed - Offline mode only', 'offline');
        return false;
    }
}

// === UI UPDATES ===
function updatePlayersList() {
    const playersList = document.getElementById('joinedPlayersList');
    const playersCount = document.getElementById('joinedPlayersCount');
    
    if (playersCount) {
        playersCount.textContent = gameState.players.length;
    }
    
    if (playersList) {
        if (gameState.players.length === 0) {
            playersList.innerHTML = '<div class="no-players">Waiting for players to join...</div>';
        } else {
            playersList.innerHTML = gameState.players.map(player => 
                `<div class="player-item">${player.name}</div>`
            ).join('');
        }
    }
}

function updateStartButton() {
    const startBtn = document.getElementById('startGameBtn');
    const startText = document.getElementById('startGameText');
    
    if (startBtn && startText) {
        const canStart = gameState.players.length >= 2;
        
        if (canStart) {
            startBtn.disabled = false;
            startBtn.classList.remove('disabled');
            startText.textContent = `Start Game (${gameState.players.length} players)`;
        } else {
            startBtn.disabled = true;
            startBtn.classList.add('disabled');
            startText.textContent = gameState.players.length === 0 
                ? 'Waiting for players...' 
                : `Need ${2 - gameState.players.length} more player${2 - gameState.players.length === 1 ? '' : 's'}`;
        }
    }
}

// === GAME ACTIONS ===
function createRoom() {
    if (!socket || !gameState.isConnected) {
        updateStatus('Not connected to server', 'error');
        return;
    }
    
    console.log('Creating room...');
    updateStatus('Creating room...', 'connecting');
    
    const createBtn = document.getElementById('createRoomBtn');
    if (createBtn) {
        createBtn.disabled = true;
        createBtn.textContent = 'Creating room...';
    }
    
    socket.emit('create-room', {
        hostName: 'Game Host'
    });
}

function startGame() {
    if (!gameState.isHost || gameState.players.length < 2) {
        updateStatus('Need at least 2 players to start', 'error');
        return;
    }
    
    console.log('Starting game...');
    
    // Store game data for the game page
    sessionStorage.setItem('multiplayerRoom', JSON.stringify({
        roomCode: gameState.roomCode,
        isHost: true,
        players: gameState.players
    }));
    
    // Navigate to game page
    window.location.href = '../pages/game.html';
}

function startOfflineMode() {
    console.log('Starting offline mode...');
    
    // Clear any multiplayer data
    sessionStorage.removeItem('multiplayerRoom');
    sessionStorage.setItem('gameMode', 'offline');
    
    // Navigate to offline setup (fallback directory)
    // Fallback page no longer exists - show offline setup inline
    if (window.showOfflineSetup) {
        window.showOfflineSetup();
    } else {
        window.location.href = 'pages/index.html';
    }
}

function copyRoomCode() {
    if (!gameState.roomCode) return;
    
    navigator.clipboard.writeText(gameState.roomCode).then(() => {
        const copyBtn = document.getElementById('copyRoomCodeBtn');
        if (copyBtn) {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        }
        updateStatus(`Room code ${gameState.roomCode} copied!`, 'connected');
    }).catch(err => {
        console.error('Failed to copy room code:', err);
        updateStatus('Failed to copy room code', 'error');
    });
}

// === EVENT LISTENERS ===
function setupEventListeners() {
    // Create Room Button
    const createRoomBtn = document.getElementById('createRoomBtn');
    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', createRoom);
    }
    
    // Start Game Button
    const startGameBtn = document.getElementById('startGameBtn');
    if (startGameBtn) {
        startGameBtn.addEventListener('click', startGame);
    }
    
    // Offline Game Button
    const offlineGameBtn = document.getElementById('offlineGameBtn');
    if (offlineGameBtn) {
        offlineGameBtn.addEventListener('click', startOfflineMode);
    }
    
    // Copy Room Code Button
    const copyRoomCodeBtn = document.getElementById('copyRoomCodeBtn');
    if (copyRoomCodeBtn) {
        copyRoomCodeBtn.addEventListener('click', copyRoomCode);
    }
}

// === GAME FUNCTIONALITY ===
function broadcastQuestionToPlayers(question) {
    if (gameState.currentPage !== 'game' || !gameState.isHost || !socket || !gameState.isConnected) {
        console.log('Not in multiplayer mode, skipping broadcast');
        return;
    }
    
    gameState.currentQuestion = question;
    gameState.waitingForAnswers = true;
    gameState.collectedAnswers = new Map();
    
    // Convert question to multiplayer format
    const multiplayerQuestion = {
        text: question.text || question,
        options: question.options || [
            { text: question.option1 || 'Option A', value: 'A' },
            { text: question.option2 || 'Option B', value: 'B' }
        ]
    };
    
    socket.emit('broadcast-question', {
        roomCode: gameState.roomCode,
        question: multiplayerQuestion
    });
    
    console.log('Question broadcasted to players:', multiplayerQuestion);
}

function revealAnswers() {
    if (!gameState.isHost || !socket || !gameState.isConnected) {
        console.log('Not authorized to reveal answers');
        return;
    }
    
    socket.emit('reveal-answers', {
        roomCode: gameState.roomCode
    });
    
    console.log('Revealing answers to all players');
}

function updateAnswerProgress(answeredCount, totalPlayers) {
    const progressElement = document.getElementById('answerProgress');
    if (progressElement) {
        progressElement.textContent = `${answeredCount}/${totalPlayers} players answered`;
    }
    
    // Auto-reveal when all players answered
    if (answeredCount === totalPlayers && totalPlayers > 0) {
        setTimeout(() => {
            revealAnswers();
        }, 1000);
    }
}

// Make functions globally available for game.js
if (typeof window !== 'undefined') {
    window.broadcastQuestionToPlayers = broadcastQuestionToPlayers;
    window.revealAnswers = revealAnswers;
}

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    console.log(`Table Talk initializing on ${gameState.currentPage} page`);
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize socket connection
    updateStatus('Connecting to server...', 'connecting');
    const connected = initializeSocket();
    
    if (!connected) {
        // Show offline fallback
        if (gameState.currentPage === 'index') {
            hideElement('createRoomStep');
            showElement('offlineFallback');
        }
    }
    
    // Initialize UI state
    updateStartButton();
    
    // Game page specific initialization
    if (gameState.currentPage === 'game') {
        const multiplayerRoom = sessionStorage.getItem('multiplayerRoom');
        if (multiplayerRoom) {
            try {
                const roomData = JSON.parse(multiplayerRoom);
                gameState.roomCode = roomData.roomCode;
                gameState.isHost = roomData.isHost;
                gameState.players = roomData.players || [];
                console.log('Game page initialized with room:', gameState.roomCode);
            } catch (error) {
                console.error('Failed to parse multiplayer room data:', error);
            }
        }
    }
    
    console.log('Table Talk initialized');
});