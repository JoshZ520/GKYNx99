// index-multiplayer.js - Simplified index page with room creation
console.log('🚀 Index multiplayer loaded');

// Global state
let socket = null;
let roomState = {
    isHost: false,
    roomCode: null,
    joinedPlayers: [],
    canStart: false
};

// Initialize socket connection
function initializeSocket() {
    if (typeof io === 'undefined') {
        console.log('Socket.io not available - showing offline mode');
        showOfflineMode();
        return false;
    }

    try {
        socket = io();
        
        socket.on('connect', () => {
            console.log('✅ Connected to server');
            updateConnectionStatus('connected', '✅ Connected to server');
            showCreateRoomStep();
        });
        
        socket.on('disconnect', () => {
            console.log('❌ Disconnected from server');
            updateConnectionStatus('disconnected', '❌ Disconnected from server');
        });
        
        socket.on('connect_error', (error) => {
            console.error('❌ Connection error:', error);
            updateConnectionStatus('error', '❌ Connection failed');
            showOfflineMode();
        });
        
        setupSocketEventListeners();
        return true;
        
    } catch (error) {
        console.error('❌ Failed to initialize socket:', error);
        updateConnectionStatus('error', '❌ Socket initialization failed');
        showOfflineMode();
        return false;
    }
}

// Setup socket event listeners
function setupSocketEventListeners() {
    // Room creation success
    socket.on('room-created', (data) => {
        console.log('🏠 Room created:', data);
        roomState.isHost = true;
        roomState.roomCode = data.roomCode;
        
        showRoomCreatedStep();
        updateRoomCodeDisplay();
    });
    
    // Player joined
    socket.on('player-joined', (data) => {
        console.log('👤 Player joined:', data);
        
        // Add to our players list
        const existingPlayer = roomState.joinedPlayers.find(p => p.id === data.player.id);
        if (!existingPlayer) {
            roomState.joinedPlayers.push(data.player);
        }
        
        updatePlayersDisplay();
        updateStartButtonState();
    });
    
    // Player left
    socket.on('player-left', (data) => {
        console.log('👋 Player left:', data);
        
        // Remove from players list
        roomState.joinedPlayers = roomState.joinedPlayers.filter(p => p.id !== data.player.id);
        
        updatePlayersDisplay();
        updateStartButtonState();
    });
    
    // Error handling
    socket.on('error', (data) => {
        console.error('❌ Socket error:', data);
        showError(data.message);
    });
}

// Connection status management
function updateConnectionStatus(status, text) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    if (statusDot && statusText) {
        statusDot.className = `status-dot ${status}`;
        statusText.textContent = text;
    }
}

// Step navigation
function showStep(stepId) {
    // Hide all steps
    const steps = document.querySelectorAll('.step-section');
    steps.forEach(step => step.classList.add('hidden'));
    
    // Show target step
    const targetStep = document.getElementById(stepId);
    if (targetStep) {
        targetStep.classList.remove('hidden');
    }
}

function showCreateRoomStep() {
    showStep('createRoomStep');
    hideResumeSection();
}

function showRoomCreatedStep() {
    showStep('roomCreatedStep');
}

function showOfflineMode() {
    showStep('offlineFallback');
    hideResumeSection();
}

function hideResumeSection() {
    const resumeSection = document.getElementById('resumeSection');
    if (resumeSection) {
        resumeSection.classList.add('hidden');
    }
}

// Room creation
function createRoom() {
    if (!socket || !socket.connected) {
        showError('Not connected to server');
        return;
    }
    
    const createBtn = document.getElementById('createRoomBtn');
    if (createBtn) {
        createBtn.disabled = true;
        createBtn.innerHTML = '<span>🔄 Creating room...</span>';
    }
    
    socket.emit('create-room', {
        hostName: 'Game Host'
    });
}

// Room code display
function updateRoomCodeDisplay() {
    const roomCodeDisplay = document.getElementById('roomCodeDisplay');
    if (roomCodeDisplay && roomState.roomCode) {
        roomCodeDisplay.textContent = roomState.roomCode;
    }
}

// Copy room code
function copyRoomCode() {
    if (!roomState.roomCode) return;
    
    navigator.clipboard.writeText(roomState.roomCode).then(() => {
        const copyBtn = document.getElementById('copyRoomCodeBtn');
        if (copyBtn) {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✅';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        }
        showMessage(`Room code ${roomState.roomCode} copied!`);
    }).catch(err => {
        console.error('Failed to copy:', err);
        showError('Failed to copy room code');
    });
}

// Players display
function updatePlayersDisplay() {
    const countElement = document.getElementById('joinedPlayersCount');
    const listElement = document.getElementById('joinedPlayersList');
    
    if (countElement) {
        countElement.textContent = roomState.joinedPlayers.length;
    }
    
    if (listElement) {
        if (roomState.joinedPlayers.length === 0) {
            listElement.innerHTML = '<div class="no-players">Waiting for players to join...</div>';
        } else {
            listElement.innerHTML = roomState.joinedPlayers
                .map(player => `<div class="player-item">📱 ${player.name}</div>`)
                .join('');
        }
    }
}

// Start button state
function updateStartButtonState() {
    const startBtn = document.getElementById('startGameBtn');
    const startText = document.getElementById('startGameText');
    const minNote = document.querySelector('.min-players-note');
    
    const playerCount = roomState.joinedPlayers.length;
    const canStart = playerCount >= 2;
    
    if (startBtn && startText) {
        if (canStart) {
            startBtn.disabled = false;
            startBtn.classList.remove('disabled');
            startText.textContent = `Start Game (${playerCount} players)`;
            if (minNote) minNote.style.display = 'none';
        } else {
            startBtn.disabled = true;
            startBtn.classList.add('disabled');
            if (playerCount === 0) {
                startText.textContent = 'Waiting for players...';
            } else {
                startText.textContent = `Need ${2 - playerCount} more player${2 - playerCount === 1 ? '' : 's'}`;
            }
            if (minNote) minNote.style.display = 'block';
        }
    }
    
    roomState.canStart = canStart;
}

// Start the game
function startGame() {
    if (!roomState.canStart) {
        showError('Need at least 2 players to start');
        return;
    }
    
    // Store room info for the game page
    sessionStorage.setItem('multiplayerRoom', JSON.stringify({
        roomCode: roomState.roomCode,
        isHost: true,
        players: roomState.joinedPlayers
    }));
    
    console.log('🎮 Starting game with', roomState.joinedPlayers.length, 'players');
    
    // Navigate to game page
    window.location.href = 'game.html';
}

// Start offline game (fallback)
function startOfflineGame() {
    // Clear any multiplayer session data
    sessionStorage.removeItem('multiplayerRoom');
    
    console.log('🎮 Starting offline game');
    
    // Navigate to game page
    window.location.href = 'game.html';
}

// Message/error display
function showMessage(message) {
    console.log('📢 Message:', message);
    // Could add toast notifications here
}

function showError(message) {
    console.error('❌ Error:', message);
    // Could add error notifications here
}

// Resume game functionality (keep existing)
function initializeResumeGameUI() {
    const resumeSection = document.getElementById('resumeSection');
    const newGameSection = document.getElementById('newGameSection');
    const newGameBtn = document.getElementById('newGameBtn');
    
    if (!resumeSection || !newGameSection) return;
    
    // Check for saved games
    if (window.gameSessionManager) {
        const availableSessions = gameSessionManager.listAvailableSessions();
        if (availableSessions.length > 0) {
            // Show resume section
            resumeSection.classList.remove('hidden');
            newGameSection.classList.add('hidden');
            populateSavedGamesList(availableSessions);
        }
    }
    
    // "Start Fresh" button handler
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
            resumeSection.classList.add('hidden');
            newGameSection.classList.remove('hidden');
            if (socket && socket.connected) {
                showCreateRoomStep();
            } else {
                showOfflineMode();
            }
        });
    }
}

function populateSavedGamesList(sessions) {
    const savedGamesList = document.getElementById('savedGamesList');
    if (!savedGamesList) return;
    
    savedGamesList.innerHTML = sessions.map(session => {
        const summary = gameSessionManager.getSessionSummary(session.sessionId);
        const createdDate = new Date(summary.createdAt).toLocaleDateString();
        const playerList = summary.playerNames.join(', ') || 'No players set';
        
        return `
            <div class="saved-game-item">
                <div class="saved-game-info">
                    <div class="saved-game-topic">Topic: ${summary.currentTopic || 'default'}</div>
                    <div class="saved-game-details">
                        ${summary.playerCount || 0} players • Started: ${createdDate}<br>
                        Players: ${playerList}
                    </div>
                </div>
                <div class="saved-game-actions">
                    <button class="resume-btn" onclick="resumeGame('${summary.sessionId}')">Resume</button>
                    <button class="delete-btn" onclick="deleteSavedGame('${summary.sessionId}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function resumeGame(sessionId) {
    if (window.gameSessionManager) {
        const success = gameSessionManager.loadSession(sessionId);
        if (success) {
            window.location.href = 'game.html';
        } else {
            showError('Failed to load saved game');
        }
    }
}

function deleteSavedGame(sessionId) {
    if (confirm('Delete this saved game?')) {
        if (window.gameSessionManager) {
            gameSessionManager.deleteSession(sessionId);
            initializeResumeGameUI();
        }
    }
}

// Event listeners setup
function setupEventListeners() {
    const createRoomBtn = document.getElementById('createRoomBtn');
    const copyCodeBtn = document.getElementById('copyRoomCodeBtn');
    const startGameBtn = document.getElementById('startGameBtn');
    const offlineGameBtn = document.getElementById('offlineGameBtn');
    
    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', createRoom);
    }
    
    if (copyCodeBtn) {
        copyCodeBtn.addEventListener('click', copyRoomCode);
    }
    
    if (startGameBtn) {
        startGameBtn.addEventListener('click', startGame);
    }
    
    if (offlineGameBtn) {
        offlineGameBtn.addEventListener('click', startOfflineGame);
    }
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Index page initialized');
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize socket connection
    updateConnectionStatus('connecting', '🔄 Connecting to server...');
    const socketInitialized = initializeSocket();
    
    // Initialize resume game UI
    setTimeout(() => {
        initializeResumeGameUI();
    }, 100);
    
    if (!socketInitialized) {
        console.log('🎮 Socket not available - offline mode only');
    }
});

// Global functions for saved games (called from HTML)
window.resumeGame = resumeGame;
window.deleteSavedGame = deleteSavedGame;