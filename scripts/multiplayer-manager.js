// multiplayer-manager.js - Unified multiplayer functionality for Table Talk
// Intelligently handles both room setup (index) and game hosting (game) contexts
console.log('🚀 Multiplayer Manager loaded');

// === CONTEXT DETECTION ===
const isIndexPage = window.location.pathname.includes('index.html') || window.location.pathname === '/';
const isGamePage = window.location.pathname.includes('game.html');

console.log(`📍 Page context: ${isIndexPage ? 'Index (Setup)' : isGamePage ? 'Game (Host)' : 'Unknown'}`);

// === SHARED STATE MANAGEMENT ===
let socket = null;
let multiplayerState = {
    isHost: false,
    roomCode: null,
    connectedPlayers: [],
    
    // Game-specific state
    currentQuestion: null,
    waitingForAnswers: false,
    collectedAnswers: new Map(),
    
    // Index-specific state
    canStart: false
};

// === CORE SOCKET MANAGEMENT ===
function initializeMultiplayerSocket() {
    if (typeof io === 'undefined') {
        console.log('Socket.io not available - showing offline mode');
        handleOfflineMode();
        return false;
    }

    try {
        socket = io();
        
        socket.on('connect', () => {
            console.log('✅ Connected to server');
            handleConnectionSuccess();
        });
        
        socket.on('disconnect', () => {
            console.log('❌ Disconnected from server');
            handleConnectionLost();
        });
        
        socket.on('connect_error', (error) => {
            console.error('❌ Connection error:', error);
            handleConnectionError();
        });
        
        setupSharedEventListeners();
        return true;
        
    } catch (error) {
        console.error('❌ Failed to initialize socket:', error);
        handleConnectionError();
        return false;
    }
}

// === SHARED EVENT LISTENERS ===
function setupSharedEventListeners() {
    // Room creation success
    socket.on('room-created', (data) => {
        console.log('🏠 Room created successfully:', data);
        multiplayerState.isHost = true;
        multiplayerState.roomCode = data.roomCode;
        
        if (isIndexPage) {
            handleRoomCreatedIndex();
        } else if (isGamePage) {
            handleRoomCreatedGame();
        }
    });
    
    // Player joined the room
    socket.on('player-joined', (data) => {
        console.log('👤 Player joined:', data);
        
        // Add player to our list if not already there
        const existingPlayer = multiplayerState.connectedPlayers.find(p => p.id === data.player.id);
        if (!existingPlayer) {
            multiplayerState.connectedPlayers.push(data.player);
        }
        
        updatePlayersDisplay();
        showPlayerJoinedNotification(data.player.name);
        
        if (isIndexPage) {
            updateStartButtonState();
        }
    });
    
    // Player left the room
    socket.on('player-left', (data) => {
        console.log('👋 Player left:', data);
        
        // Remove player from our list
        multiplayerState.connectedPlayers = multiplayerState.connectedPlayers.filter(p => p.id !== data.player.id);
        
        updatePlayersDisplay();
        
        if (isIndexPage) {
            updateStartButtonState();
        }
    });
    
    // Answer received from a player (game page only)
    if (isGamePage) {
        socket.on('answer-received', (data) => {
            console.log('💬 Answer received:', data);
            
            // Store the answer
            multiplayerState.collectedAnswers.set(data.playerName, data);
            
            updateAnswerProgress(data.answeredCount, data.totalPlayers);
            showPlayerAnsweredNotification(data.playerName);
        });
    }
    
    // General errors
    socket.on('error', (data) => {
        console.log('❌ Multiplayer error:', data);
        showMultiplayerError(data.message);
    });
}

// === CONNECTION HANDLERS ===
function handleConnectionSuccess() {
    if (isIndexPage) {
        updateMultiplayerConnectionStatus('connected', '✅ Connected to server');
        showCreateRoomStep();
    } else if (isGamePage) {
        showMultiplayerControls();
    }
}

function handleConnectionLost() {
    if (isIndexPage) {
        updateMultiplayerConnectionStatus('disconnected', '❌ Disconnected from server');
    } else if (isGamePage) {
        resetMultiplayerState();
    }
}

function handleConnectionError() {
    if (isIndexPage) {
        updateMultiplayerConnectionStatus('error', '❌ Connection failed');
        showOfflineMode();
    } else if (isGamePage) {
        hideMultiplayerControls();
    }
}

function handleOfflineMode() {
    if (isIndexPage) {
        showOfflineMode();
    } else if (isGamePage) {
        console.log('Socket.io not available - multiplayer disabled');
    }
}

// === ROOM MANAGEMENT ===
function createRoom() {
    if (!socket || !socket.connected) {
        showMultiplayerError('Not connected to server. Please refresh the page.');
        return;
    }
    
    const createBtn = document.getElementById(isIndexPage ? 'createRoomBtn' : 'createRoomBtn');
    if (createBtn) {
        createBtn.disabled = true;
        createBtn.innerHTML = isIndexPage ? 
            '<span>🔄 Creating room...</span>' : 
            '🔄 Creating Room...';
    }
    
    socket.emit('create-room', {
        hostName: 'Game Host'
    });
}

function handleRoomCreatedIndex() {
    showRoomCreatedStep();
    updateRoomCodeDisplay();
}

function handleRoomCreatedGame() {
    updateRoomDisplay();
    showRoomInfo();
}

// === ROOM CODE MANAGEMENT ===
function updateRoomCodeDisplay() {
    const roomCodeDisplay = document.getElementById(isIndexPage ? 'roomCodeDisplay' : 'roomCodeDisplay');
    if (roomCodeDisplay && multiplayerState.roomCode) {
        roomCodeDisplay.textContent = multiplayerState.roomCode;
    }
}

function updateRoomDisplay() {
    const roomCodeDisplay = document.getElementById('roomCodeDisplay');
    if (roomCodeDisplay) {
        roomCodeDisplay.textContent = multiplayerState.roomCode || '----';
    }
}

function copyRoomCode() {
    if (!multiplayerState.roomCode) return;
    
    navigator.clipboard.writeText(multiplayerState.roomCode).then(() => {
        const copyBtn = document.getElementById(isIndexPage ? 'copyRoomCodeBtn' : 'copyCodeBtn');
        if (copyBtn) {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✅';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, isIndexPage ? 2000 : 1500);
        }
        showMessage(`Room code ${multiplayerState.roomCode} copied${isIndexPage ? '!' : ' to clipboard!'}`);
    }).catch(err => {
        console.error('Failed to copy room code:', err);
        showMultiplayerError('Failed to copy room code');
    });
}

// === PLAYER MANAGEMENT ===
function updatePlayersDisplay() {
    if (isIndexPage) {
        updatePlayersDisplayIndex();
    } else if (isGamePage) {
        updatePlayersDisplayGame();
    }
}

function updatePlayersDisplayIndex() {
    const countElement = document.getElementById('joinedPlayersCount');
    const listElement = document.getElementById('joinedPlayersList');
    
    if (countElement) {
        countElement.textContent = multiplayerState.connectedPlayers.length;
    }
    
    if (listElement) {
        if (multiplayerState.connectedPlayers.length === 0) {
            listElement.innerHTML = '<div class="no-players">Waiting for players to join...</div>';
        } else {
            listElement.innerHTML = multiplayerState.connectedPlayers
                .map(player => `<div class="player-item">📱 ${player.name}</div>`)
                .join('');
        }
    }
}

function updatePlayersDisplayGame() {
    const playerCount = document.getElementById('playerCount');
    const playersList = document.getElementById('connectedPlayersList');
    
    if (playerCount) {
        playerCount.textContent = multiplayerState.connectedPlayers.length;
    }
    
    if (playersList) {
        if (multiplayerState.connectedPlayers.length === 0) {
            playersList.innerHTML = '<div class="no-players">No players connected yet</div>';
        } else {
            playersList.innerHTML = multiplayerState.connectedPlayers.map(player => 
                `<div class="player-item">📱 ${player.name}</div>`
            ).join('');
        }
    }
}

// === INDEX PAGE SPECIFIC FUNCTIONS ===
function updateMultiplayerConnectionStatus(status, text) {
    // Update connection status specifically for multiplayer functionality
    if (isIndexPage) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        
        if (statusDot && statusText) {
            statusDot.className = `status-dot ${status}`;
            statusText.textContent = text;
        }
    } else if (isGamePage) {
        // Handle game page status updates if needed
        console.log(`Multiplayer Status: ${status} - ${text}`);
    }
}

function showStep(stepId) {
    if (!isIndexPage) return;
    
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
    if (!isIndexPage) return;
    showStep('createRoomStep');
    hideResumeSection();
}

function showRoomCreatedStep() {
    if (!isIndexPage) return;
    showStep('roomCreatedStep');
}

function showOfflineMode() {
    if (!isIndexPage) return;
    showStep('offlineFallback');
    hideResumeSection();
}

function hideResumeSection() {
    if (!isIndexPage) return;
    const resumeSection = document.getElementById('resumeSection');
    if (resumeSection) {
        resumeSection.classList.add('hidden');
    }
}

function updateStartButtonState() {
    if (!isIndexPage) return;
    
    const startBtn = document.getElementById('startGameBtn');
    const startText = document.getElementById('startGameText');
    const minNote = document.querySelector('.min-players-note');
    
    const playerCount = multiplayerState.connectedPlayers.length;
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
    
    multiplayerState.canStart = canStart;
}

function startGame() {
    if (!isIndexPage || !multiplayerState.canStart) {
        showMultiplayerError('Need at least 2 players to start');
        return;
    }
    
    // Store room info for the game page
    sessionStorage.setItem('multiplayerRoom', JSON.stringify({
        roomCode: multiplayerState.roomCode,
        isHost: true,
        players: multiplayerState.connectedPlayers
    }));
    
    console.log('🎮 Starting game with', multiplayerState.connectedPlayers.length, 'players');
    
    // Navigate to game page
    window.location.href = 'game.html';
}

function startOfflineGame() {
    if (!isIndexPage) return;
    
    // Clear any multiplayer session data
    sessionStorage.removeItem('multiplayerRoom');
    
    console.log('🎮 Starting offline game');
    
    // Navigate to game page
    window.location.href = 'index.html';
}

// === GAME PAGE SPECIFIC FUNCTIONS ===
function showMultiplayerControls() {
    if (!isGamePage) return;
    
    const multiplayerInfo = document.getElementById('multiplayerInfo');
    if (multiplayerInfo) {
        multiplayerInfo.classList.remove('hidden');
    }
}

function hideMultiplayerControls() {
    if (!isGamePage) return;
    
    const multiplayerInfo = document.getElementById('multiplayerInfo');
    if (multiplayerInfo) {
        multiplayerInfo.classList.add('hidden');
    }
}

function resetMultiplayerState() {
    multiplayerState = {
        isHost: false,
        roomCode: null,
        connectedPlayers: [],
        currentQuestion: null,
        waitingForAnswers: false,
        collectedAnswers: new Map(),
        canStart: false
    };
    
    if (isGamePage) {
        hideRoomInfo();
        updateRoomDisplay();
        updatePlayersDisplay();
    }
}

function showRoomInfo() {
    if (!isGamePage) return;
    
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
    if (!isGamePage) return;
    
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

// Question broadcasting (game page only)
function broadcastQuestionToPlayers(question) {
    if (!isGamePage || !multiplayerState.isHost || !socket || !socket.connected) {
        console.log('Not in multiplayer mode, skipping broadcast');
        return;
    }
    
    multiplayerState.currentQuestion = question;
    multiplayerState.waitingForAnswers = true;
    multiplayerState.collectedAnswers.clear();
    
    // Convert question to multiplayer format
    const multiplayerQuestion = {
        text: question.text || question,
        options: question.options || [
            { text: question.option1 || 'Option A', value: 'A' },
            { text: question.option2 || 'Option B', value: 'B' }
        ]
    };
    
    socket.emit('broadcast-question', {
        roomCode: multiplayerState.roomCode,
        question: multiplayerQuestion
    });
    
    console.log('📤 Question broadcasted to players:', multiplayerQuestion);
    showMessage(`Question sent to ${multiplayerState.connectedPlayers.length} players`);
}

// Reveal answers (game page only)
function revealAnswersToPlayers() {
    if (!isGamePage || !multiplayerState.isHost || !socket || !socket.connected) {
        return;
    }
    
    multiplayerState.waitingForAnswers = false;
    
    socket.emit('reveal-answers', {
        roomCode: multiplayerState.roomCode
    });
    
    console.log('📊 Answers revealed to players');
    showMessage('Results shown to all players');
}

// Answer progress tracking (game page only)
function updateAnswerProgress(answeredCount, totalPlayers) {
    if (!isGamePage) return;
    
    console.log(`📊 Progress: ${answeredCount}/${totalPlayers} players answered`);
    
    // Auto-reveal when everyone has answered
    if (answeredCount === totalPlayers && totalPlayers > 0) {
        setTimeout(() => {
            if (multiplayerState.waitingForAnswers) {
                console.log('🎉 All players answered! Auto-revealing results...');
                revealAnswersToPlayers();
            }
        }, 1000); // Small delay for better UX
    }
}

// === RESUME GAME FUNCTIONALITY (INDEX PAGE ONLY) ===
function initializeResumeGameUI() {
    if (!isIndexPage) return;
    
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
    if (!isIndexPage) return;
    
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
    if (!isIndexPage) return;
    
    if (window.gameSessionManager) {
        const success = gameSessionManager.loadSession(sessionId);
        if (success) {
            window.location.href = 'game.html';
        } else {
            showMultiplayerError('Failed to load saved game');
        }
    }
}

function deleteSavedGame(sessionId) {
    if (!isIndexPage) return;
    
    if (confirm('Delete this saved game?')) {
        if (window.gameSessionManager) {
            gameSessionManager.deleteSession(sessionId);
            initializeResumeGameUI();
        }
    }
}

// === NOTIFICATION HELPERS ===
function showPlayerJoinedNotification(playerName) {
    showMessage(`🎉 ${playerName} joined the game!`);
}

function showPlayerAnsweredNotification(playerName) {
    showMessage(`✅ ${playerName} answered`);
}

function showMessage(message) {
    console.log('📢 Message:', message);
    // Could add toast notifications here in the future
}

function showMultiplayerError(message) {
    console.error('❌ Multiplayer Error:', message);
    // Could add error notifications here in the future
}

// === EVENT LISTENERS SETUP ===
function setupEventListeners() {
    // Shared event listeners
    const copyBtn = document.getElementById(isIndexPage ? 'copyRoomCodeBtn' : 'copyCodeBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', copyRoomCode);
    }
    
    // Index page specific
    if (isIndexPage) {
        const createRoomBtn = document.getElementById('createRoomBtn');
        const startGameBtn = document.getElementById('startGameBtn');
        const offlineGameBtn = document.getElementById('offlineGameBtn');
        
        if (createRoomBtn) {
            createRoomBtn.addEventListener('click', createRoom);
        }
        
        if (startGameBtn) {
            startGameBtn.addEventListener('click', startGame);
        }
        
        if (offlineGameBtn) {
            offlineGameBtn.addEventListener('click', startOfflineGame);
        }
    }
    
    // Game page specific
    if (isGamePage) {
        const createRoomBtn = document.getElementById('createRoomBtn');
        const closeRoomBtn = document.getElementById('closeRoomBtn');
        
        if (createRoomBtn) {
            createRoomBtn.addEventListener('click', createRoom);
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
}

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Multiplayer manager initialized for', isIndexPage ? 'index' : 'game', 'page');
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize socket connection
    if (isIndexPage) {
        updateMultiplayerConnectionStatus('connecting', '🔄 Connecting to server...');
    }
    
    const socketInitialized = initializeMultiplayerSocket();
    
    // Index page specific initialization
    if (isIndexPage) {
        setTimeout(() => {
            initializeResumeGameUI();
        }, 100);
    }
    
    if (!socketInitialized) {
        console.log('🎮 Socket not available -', isIndexPage ? 'offline mode only' : 'multiplayer disabled');
    }
    
    // Check for existing multiplayer session (game page)
    if (isGamePage) {
        const multiplayerRoom = sessionStorage.getItem('multiplayerRoom');
        if (multiplayerRoom) {
            try {
                const roomData = JSON.parse(multiplayerRoom);
                multiplayerState.roomCode = roomData.roomCode;
                multiplayerState.isHost = roomData.isHost;
                multiplayerState.connectedPlayers = roomData.players || [];
                console.log('🔄 Restored multiplayer session:', roomData);
            } catch (e) {
                console.warn('Failed to restore multiplayer session:', e);
            }
        }
    }
});

// === GLOBAL EXPORTS ===
// For integration with existing game scripts
if (typeof window !== 'undefined') {
    // Game page exports
    if (isGamePage) {
        window.multiplayerHost = {
            broadcastQuestion: broadcastQuestionToPlayers,
            revealAnswers: revealAnswersToPlayers,
            isActive: () => multiplayerState.isHost && multiplayerState.connectedPlayers.length > 0
        };
        
        window.hostMultiplayer = {
            broadcastQuestion: broadcastQuestionToPlayers,
            revealAnswers: revealAnswersToPlayers,
            isActive: () => multiplayerState.isHost,
            getConnectedPlayers: () => multiplayerState.connectedPlayers,
            getRoomCode: () => multiplayerState.roomCode
        };
    }
    
    // Index page exports
    if (isIndexPage) {
        window.resumeGame = resumeGame;
        window.deleteSavedGame = deleteSavedGame;
    }
    
    // Shared exports
    window.multiplayerManager = {
        getState: () => multiplayerState,
        isHost: () => multiplayerState.isHost,
        getRoomCode: () => multiplayerState.roomCode,
        getPlayers: () => multiplayerState.connectedPlayers,
        isConnected: () => socket && socket.connected
    };
}
