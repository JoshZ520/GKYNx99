// index-consolidated.js - Complete front page functionality for Option A architecture
// Combines x99-JoshZ structure with multiplayer integration hooks
// Handles both online multiplayer and offline fallback modes

// ===== MULTIPLAYER INTEGRATION HOOKS =====
let socket = null;
let isMultiplayerMode = false;
let roomCode = null;
let joinedPlayers = [];

// Initialize Socket.IO connection (optional - graceful fallback if server unavailable)
function initializeMultiplayer() {
    if (typeof io !== 'undefined') {
        try {
            socket = io();
            
            socket.on('connect', () => {
                console.log('Connected to server from INDEX page!');
                console.log('Socket ID:', socket.id);
                updateConnectionStatus('connected', 'Connected to server - Multiplayer available');
                showCreateRoomOption();
            });
            
            socket.on('disconnect', () => {
                console.log('Disconnected from server');
                updateConnectionStatus('disconnected', 'Server disconnected - Offline mode only');
                fallbackToOfflineMode();
            });
            
            socket.on('welcome', (message) => {
                console.log('Welcome message on index page:', message);
            });
            
            // ✅ MULTIPLAYER INTEGRATION: Room creation response
            socket.on('roomCreated', (data) => {
                roomCode = data.roomCode;
                updateRoomCodeDisplay(data.roomCode);
                showRoomCreatedStep();
                isMultiplayerMode = true;
            });
            
            // ✅ MULTIPLAYER INTEGRATION: Player joined room
            socket.on('playerJoined', (data) => {
                joinedPlayers.push(data.player);
                updateJoinedPlayersList();
                updateStartGameButton();
            });
            
            // ✅ MULTIPLAYER INTEGRATION: Player left room
            socket.on('playerLeft', (data) => {
                joinedPlayers = joinedPlayers.filter(p => p.id !== data.playerId);
                updateJoinedPlayersList();
                updateStartGameButton();
            });
            
            // Connection timeout fallback
            setTimeout(() => {
                if (!socket.connected) {
                    console.log('Socket.io connection timeout - falling back to offline mode');
                    updateConnectionStatus('offline', 'Server unavailable - Offline mode only');
                    fallbackToOfflineMode();
                }
            }, 3000);
            
        } catch (error) {
            console.log('Socket.io not available - running in offline mode');
            updateConnectionStatus('offline', 'Server unavailable - Offline mode only');
            fallbackToOfflineMode();
        }
    } else {
        console.log('Socket.io not loaded - running in offline mode');
        updateConnectionStatus('offline', 'Server unavailable - Offline mode only');
        fallbackToOfflineMode();
    }
}

// ===== CONNECTION STATUS MANAGEMENT =====
function updateConnectionStatus(status, message) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    if (statusDot && statusText) {
        statusText.textContent = message;
        statusDot.className = `status-dot ${status}`;
    }
}

function showCreateRoomOption() {
    const createRoomStep = document.getElementById('createRoomStep');
    const offlineFallback = document.getElementById('offlineFallback');
    
    if (createRoomStep) createRoomStep.classList.remove('hidden');
    if (offlineFallback) offlineFallback.classList.add('hidden');
}

function fallbackToOfflineMode() {
    const createRoomStep = document.getElementById('createRoomStep');
    const roomCreatedStep = document.getElementById('roomCreatedStep');
    const offlineFallback = document.getElementById('offlineFallback');
    
    if (createRoomStep) createRoomStep.classList.add('hidden');
    if (roomCreatedStep) roomCreatedStep.classList.add('hidden');
    if (offlineFallback) offlineFallback.classList.remove('hidden');
    
    isMultiplayerMode = false;
}

// ===== MULTIPLAYER ROOM MANAGEMENT =====
function createMultiplayerRoom() {
    if (socket && socket.connected) {
        // ✅ MULTIPLAYER INTEGRATION: Create room request
        socket.emit('createRoom', {
            hostName: 'Host Player',
            gameType: 'tabletalk'
        });
    } else {
        alert('Cannot create room - server connection not available');
        fallbackToOfflineMode();
    }
}

function updateRoomCodeDisplay(code) {
    const roomCodeDisplay = document.getElementById('roomCodeDisplay');
    if (roomCodeDisplay) {
        roomCodeDisplay.textContent = code;
    }
}

function showRoomCreatedStep() {
    const createRoomStep = document.getElementById('createRoomStep');
    const roomCreatedStep = document.getElementById('roomCreatedStep');
    
    if (createRoomStep) createRoomStep.classList.add('hidden');
    if (roomCreatedStep) roomCreatedStep.classList.remove('hidden');
}

function updateJoinedPlayersList() {
    const playersList = document.getElementById('joinedPlayersList');
    const playersCount = document.getElementById('joinedPlayersCount');
    
    if (playersCount) {
        playersCount.textContent = joinedPlayers.length;
    }
    
    if (playersList) {
        if (joinedPlayers.length === 0) {
            playersList.innerHTML = '<div class="no-players">Waiting for players to join...</div>';
        } else {
            playersList.innerHTML = joinedPlayers.map(player => 
                `<div class="player-item">${player.name}</div>`
            ).join('');
        }
    }
}

function updateStartGameButton() {
    const startGameBtn = document.getElementById('startGameBtn');
    const startGameText = document.getElementById('startGameText');
    
    if (startGameBtn && startGameText) {
        if (joinedPlayers.length >= 2) {
            startGameBtn.classList.remove('disabled');
            startGameBtn.removeAttribute('disabled');
            startGameText.textContent = `Start Game with ${joinedPlayers.length} Players`;
        } else {
            startGameBtn.classList.add('disabled');
            startGameBtn.setAttribute('disabled', 'true');
            startGameText.textContent = 'Waiting for players...';
        }
    }
}

function startMultiplayerGame() {
    if (joinedPlayers.length >= 2 && socket && socket.connected) {
        // Store multiplayer session info
        sessionStorage.setItem('multiplayerMode', 'true');
        sessionStorage.setItem('roomCode', roomCode);
        sessionStorage.setItem('playerCount', joinedPlayers.length.toString());
        sessionStorage.setItem('playerNames', JSON.stringify(joinedPlayers.map(p => p.name)));
        
        // ✅ MULTIPLAYER INTEGRATION: Start game signal
        socket.emit('startGame', { roomCode: roomCode });
        
        // Navigate to game
        window.location.href = 'game.html';
    } else {
        alert('Need at least 2 players to start the game');
    }
}

// ===== OFFLINE MODE FUNCTIONALITY =====
let playerNames = [];

function startOfflineMode() {
    // Clear any multiplayer data
    sessionStorage.removeItem('multiplayerMode');
    sessionStorage.removeItem('roomCode');
    
    // Navigate to player setup (front.html) for offline mode
    window.location.href = 'front.html';
}

// ===== PLAYER SETUP SYSTEM (for offline fallback) =====
function handleFrontPageFunctionality() {
    const input = document.getElementById('player_count');
    if (!input) return; // Not on front page
    
    // When the input changes, store the value as an integer in sessionStorage
    input.addEventListener('input', function (e) {
        const rawValue = e.target.value;
        const val = parseInt(rawValue, 10);
        if (!Number.isNaN(val) && val >= 2 && val <= 20) {
            sessionStorage.setItem('playerCount', String(val));
        } else {
            sessionStorage.removeItem('playerCount');
        }
    });
    
    // If the user navigates to this page and then back, pre-fill the stored value
    const stored = parseInt(sessionStorage.getItem('playerCount'), 10);
    if (!Number.isNaN(stored) && stored >= 2 && stored <= 20) {
        input.value = String(stored);
        // Trigger the input event to show player setup if there's a stored value
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

function initializePlayerSetup() {
    const playerCountInput = document.getElementById('player_count');
    const playerSetupSection = document.getElementById('playerSetupSection');
    const playerNamesContainer = document.getElementById('playerNamesContainer');
    
    if (!playerCountInput || !playerSetupSection || !playerNamesContainer) return;
    
    playerCountInput.addEventListener('input', function(e) {
        const playerCount = parseInt(e.target.value);
        if (playerCount && playerCount >= 2 && playerCount <= 20) {
            showPlayerSetup(playerCount);
            updateStartButtonState();
        } else {
            hidePlayerSetup();
            updateStartButtonState();
        }
    });
    
    // Check start button state when player names change
    if (playerNamesContainer) {
        playerNamesContainer.addEventListener('input', updateStartButtonState);
    }
}

function showPlayerSetup(playerCount) {
    const playerSetupSection = document.getElementById('playerSetupSection');
    const playerNamesContainer = document.getElementById('playerNamesContainer');
    
    if (!playerSetupSection || !playerNamesContainer) return;
    
    // Clear existing inputs
    playerNamesContainer.innerHTML = '';
    
    // Create player name inputs
    for (let i = 1; i <= playerCount; i++) {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'player-input-group';
        inputGroup.innerHTML = `
            <div class="player-number">${i}</div>
            <input 
                type="text" 
                class="player-name-input" 
                placeholder="Enter player ${i} name"
                data-player="${i}"
                required
            >
        `;
        playerNamesContainer.appendChild(inputGroup);
    }
    
    // Show the section
    playerSetupSection.classList.remove('hidden');
    playerSetupSection.classList.add('visible');
    
    // Focus on first input
    const firstInput = playerNamesContainer.querySelector('.player-name-input');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
}

function hidePlayerSetup() {
    const playerSetupSection = document.getElementById('playerSetupSection');
    if (playerSetupSection) {
        playerSetupSection.classList.remove('visible');
        playerSetupSection.classList.add('hidden');
    }
}

function updateStartButtonState() {
    const playerCountInput = document.getElementById('player_count');
    const playerNamesContainer = document.getElementById('playerNamesContainer');
    const startButton = document.getElementById('start-game-btn');
    const buttonText = document.getElementById('button-text');
    
    if (!playerCountInput || !startButton || !buttonText) return;
    
    const selectedCount = parseInt(playerCountInput.value);
    if (!selectedCount || selectedCount < 2 || selectedCount > 20) {
        // No valid player count entered
        startButton.classList.add('disabled');
        startButton.classList.remove('enabled');
        buttonText.textContent = selectedCount ? "Enter 2-20 players" : "Enter number of players first";
        return;
    }
    
    if (selectedCount >= 2 && playerNamesContainer) {
        // Check if all player names are filled
        const nameInputs = playerNamesContainer.querySelectorAll('.player-name-input');
        const allNamesFilled = Array.from(nameInputs).every(input => input.value.trim() !== '');
        
        if (allNamesFilled && nameInputs.length === selectedCount) {
            // Save player names to sessionStorage
            const playerNames = Array.from(nameInputs).map(input => input.value.trim());
            sessionStorage.setItem('playerNames', JSON.stringify(playerNames));
            
            startButton.classList.remove('disabled');
            startButton.classList.add('enabled');
            buttonText.textContent = `Start Game with ${selectedCount} Players`;
        } else {
            startButton.classList.add('disabled');
            startButton.classList.remove('enabled');
            const missingNames = selectedCount - nameInputs.filter(input => input.value.trim() !== '').length;
            buttonText.textContent = `Enter ${missingNames} more name${missingNames === 1 ? '' : 's'}`;
        }
    } else {
        startButton.classList.add('disabled');
        startButton.classList.remove('enabled');
        buttonText.textContent = `Enter names for ${selectedCount} players`;
    }
    
    // Add click handler if not already added
    if (!startButton.hasAttribute('data-handler-added')) {
        startButton.addEventListener('click', handleStartGame);
        startButton.setAttribute('data-handler-added', 'true');
    }
}

function handleStartGame(e) {
    e.preventDefault();
    
    const playerCountInput = document.getElementById('player_count');
    const selectedCount = parseInt(playerCountInput.value);
    
    if (!selectedCount || selectedCount < 2 || selectedCount > 20) {
        alert('Please enter a valid number of players (2-20).');
        return;
    }
    
    // Store player count in sessionStorage
    sessionStorage.setItem('playerCount', selectedCount.toString());
    
    if (selectedCount >= 2) {
        const playerNamesContainer = document.getElementById('playerNamesContainer');
        const nameInputs = playerNamesContainer.querySelectorAll('.player-name-input');
        const allNamesFilled = Array.from(nameInputs).every(input => input.value.trim() !== '');
        
        if (!allNamesFilled || nameInputs.length !== selectedCount) {
            alert('Please enter names for all players.');
            return;
        }
        
        // Player names are already saved by updateStartButtonState
    }
    
    // Create new game session
    if (window.gameSessionManager) {
        const sessionId = gameSessionManager.createNewSession();
        console.log(`Started new game session: ${sessionId}`);
    }
    
    // Navigate to game page
    window.location.href = 'game.html';
}

// ===== RESUME GAME FUNCTIONALITY =====
function initializeResumeGameUI() {
    const resumeSection = document.getElementById('resumeSection');
    const newGameSection = document.getElementById('newGameSection');
    const newGameBtn = document.getElementById('newGameBtn');
    const savedGamesList = document.getElementById('savedGamesList');
    
    if (!resumeSection || !newGameSection || !savedGamesList) return;
    
    // Check for available saved games
    if (window.gameSessionManager) {
        const availableSessions = gameSessionManager.listAvailableSessions();
        if (availableSessions.length > 0) {
            // Show resume section, hide new game section initially
            resumeSection.classList.remove('hidden');
            resumeSection.classList.add('visible');
            newGameSection.classList.add('hidden');
            newGameSection.classList.remove('visible');
            
            // Populate saved games list
            populateSavedGamesList(availableSessions);
        } else {
            // No saved games, show new game section
            resumeSection.classList.add('hidden');
            resumeSection.classList.remove('visible');
            newGameSection.classList.remove('hidden');
            newGameSection.classList.add('visible');
        }
    }
    
    // Handle "Start New Game Instead" button
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
            resumeSection.classList.add('hidden');
            resumeSection.classList.remove('visible');
            newGameSection.classList.remove('hidden');
            newGameSection.classList.add('visible');
        });
    }
}

function populateSavedGamesList(sessions) {
    const savedGamesList = document.getElementById('savedGamesList');
    if (!savedGamesList) return;
    
    savedGamesList.innerHTML = '';
    
    if (sessions.length === 0) {
        savedGamesList.innerHTML = '<div class="no-saved-games">No saved games found</div>';
        return;
    }
    
    sessions.forEach(session => {
        const summary = gameSessionManager.getSessionSummary(session.sessionId);
        const gameItem = createSavedGameItem(summary);
        savedGamesList.appendChild(gameItem);
    });
}

function createSavedGameItem(summary) {
    const item = document.createElement('div');
    item.className = 'saved-game-item';
    
    const createdDate = new Date(summary.createdAt).toLocaleDateString();
    const lastUpdated = new Date(summary.lastUpdated).toLocaleTimeString();
    const playerList = summary.playerNames.join(', ') || 'No players set';
    
    item.innerHTML = `
        <div class="saved-game-info">
            <div class="saved-game-topic">Topic: ${summary.currentTopic || 'default'}</div>
            <div class="saved-game-details">
                ${summary.playerCount || 0} players • ${summary.totalAnswers} answers • ${summary.questionsAnswered} questions<br>
                Started: ${createdDate} • Last played: ${lastUpdated}<br>
                Players: ${playerList}
            </div>
        </div>
        <div class="saved-game-actions">
            <button class="resume-btn" onclick="resumeGame('${summary.sessionId}')">Resume</button>
            <button class="delete-btn" onclick="deleteSavedGame('${summary.sessionId}')">Delete</button>
        </div>
    `;
    
    return item;
}

function resumeGame(sessionId) {
    if (window.gameSessionManager) {
        const success = gameSessionManager.loadSession(sessionId);
        if (success) {
            console.log(`Resuming game session: ${sessionId}`);
            window.location.href = 'game.html';
        } else {
            alert('Failed to load saved game. It may have been corrupted.');
        }
    }
}

function deleteSavedGame(sessionId) {
    if (confirm('Are you sure you want to delete this saved game? This cannot be undone.')) {
        if (window.gameSessionManager) {
            const success = gameSessionManager.deleteSession(sessionId);
            if (success) {
                console.log(`Deleted game session: ${sessionId}`);
                // Refresh the UI
                initializeResumeGameUI();
            }
        }
    }
}

// ===== UTILITY FUNCTIONS =====
function copyRoomCodeToClipboard() {
    if (roomCode) {
        navigator.clipboard.writeText(roomCode).then(() => {
            const copyBtn = document.getElementById('copyRoomCodeBtn');
            if (copyBtn) {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = '✅';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                }, 2000);
            }
        }).catch(err => {
            console.error('Could not copy room code: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = roomCode;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        });
    }
}

// ===== EVENT LISTENERS AND INITIALIZATION =====
function initializeEventListeners() {
    // Create Room Button
    const createRoomBtn = document.getElementById('createRoomBtn');
    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', createMultiplayerRoom);
    }
    
    // Start Game Button (multiplayer)
    const startGameBtn = document.getElementById('startGameBtn');
    if (startGameBtn) {
        startGameBtn.addEventListener('click', startMultiplayerGame);
    }
    
    // Offline Game Button
    const offlineGameBtn = document.getElementById('offlineGameBtn');
    if (offlineGameBtn) {
        offlineGameBtn.addEventListener('click', startOfflineMode);
    }
    
    // Copy Room Code Button
    const copyRoomCodeBtn = document.getElementById('copyRoomCodeBtn');
    if (copyRoomCodeBtn) {
        copyRoomCodeBtn.addEventListener('click', copyRoomCodeToClipboard);
    }
}

// ===== MAIN INITIALIZATION =====
window.addEventListener('DOMContentLoaded', function() {
    console.log('Index page loading - initializing consolidated functionality');
    
    // Initialize multiplayer connection
    initializeMultiplayer();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Handle front page functionality (for offline fallback pages)
    handleFrontPageFunctionality();
    
    // Initialize player setup system (for offline mode)
    initializePlayerSetup();
    
    // Initialize resume game UI
    setTimeout(() => {
        initializeResumeGameUI();
    }, 100); // Small delay to ensure session manager is loaded
    
    console.log('Index page initialization complete');
});

// Make functions available globally for HTML onclick handlers
window.resumeGame = resumeGame;
window.deleteSavedGame = deleteSavedGame;