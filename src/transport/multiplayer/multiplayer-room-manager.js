// src/transport/multiplayer-room-manager.js
// Handles room creation, player management, and socket connection

// === UTILITIES ===
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
}

// === SOCKET CONNECTION ===
export function initializeSocket(gameState, onAnswerReceived, onAnswersRevealed) {
    if (typeof io === 'undefined') {
        updateStatus('Server unavailable - Offline mode only', 'offline');
        return { success: false, socket: null };
    }

    try {
        const socket = io();
        
        socket.on('connect', () => {
            gameState.isConnected = true;
            updateStatus('Connected to server', 'connected');
            
            // Re-register handler when socket connects (important for game page on load)
            if (window.multiplayerTransportHandler && window.transport && gameState.roomCode) {
                window.transport.registerHandler(window.multiplayerTransportHandler);
                
                // Initialize UI if on game page
                if (gameState.currentPage === 'game' && window.transport.initializeModeUI) {
                    window.transport.initializeModeUI();
                }
            }
            
            if (gameState.currentPage === 'index') {
                showElement('createRoomStep');
                hideElement('offlineFallback');
            }
            
            // If on game page with existing room, rejoin
            if (gameState.currentPage === 'game' && gameState.roomCode && gameState.isHost) {
                socket.emit('rejoin-room', {
                    roomCode: gameState.roomCode,
                    isHost: true
                });
            }
        });
        
        socket.on('disconnect', () => {
            gameState.isConnected = false;
            updateStatus('Disconnected from server', 'disconnected');
        });
        
        socket.on('room-created', (data) => {
            gameState.roomCode = data.roomCode;
            gameState.isHost = true;
            
            // Save to sessionStorage
            const roomData = {
                roomCode: data.roomCode,
                isHost: true,
                players: gameState.players || []
            };
            sessionStorage.setItem('multiplayerRoom', JSON.stringify(roomData));
            
            // Re-register the handler now that we're connected and have a room
            if (window.multiplayerTransportHandler && window.transport) {
                window.transport.registerHandler(window.multiplayerTransportHandler);
                
                // Initialize UI now that handler is registered
                if (window.transport.initializeModeUI) {
                    window.transport.initializeModeUI();
                }
            }
            
            // Update UI
            const roomCodeDisplay = document.getElementById('roomCodeDisplay');
            if (roomCodeDisplay) roomCodeDisplay.textContent = data.roomCode;
            
            // Show multiplayer info panel and hide create button on game page
            if (gameState.currentPage === 'game') {
                const multiplayerInfo = document.getElementById('multiplayerInfo');
                if (multiplayerInfo) {
                    multiplayerInfo.classList.remove('hidden');
                }
                
                const createRoomSection = document.getElementById('createRoomSection');
                if (createRoomSection) {
                    createRoomSection.classList.add('hidden');
                }
            }
            
            // For index page (old flow, still supported)
            showElement('roomCreatedStep');
            hideElement('createRoomStep');
            updateStatus(`Room ${data.roomCode} created`, 'connected');
        });
        
        socket.on('player-joined', (data) => {
            gameState.players.push(data.player);
            updatePlayersList(gameState);
            updateStartButton(gameState);
        });
        
        socket.on('player-left', (data) => {
            gameState.players = gameState.players.filter(p => p.id !== data.player.id);
            updatePlayersList(gameState);
            updateStartButton(gameState);
        });
        
        // Game page specific socket events
        socket.on('answer-received', (data) => {
            if (onAnswerReceived) {
                onAnswerReceived(data);
            }
        });
        
        socket.on('answers-revealed', (data) => {
            if (onAnswersRevealed) {
                onAnswersRevealed(data);
            }
        });
        
        return { success: true, socket };
    } catch (error) {
        updateStatus('Connection failed - Offline mode only', 'offline');
        return { success: false, socket: null };
    }
}

// === PLAYER MANAGEMENT ===
export function updatePlayersList(gameState) {
    // Index page elements
    const indexPlayersList = document.getElementById('joinedPlayersList');
    const indexPlayersCount = document.getElementById('joinedPlayersCount');
    
    // Game page elements
    const gamePlayersList = document.getElementById('connectedPlayersList');
    const gamePlayersCount = document.getElementById('playerCount');
    
    // Update index page if elements exist
    if (indexPlayersCount) {
        indexPlayersCount.textContent = gameState.players.length;
    }
    
    if (indexPlayersList) {
        if (gameState.players.length === 0) {
            indexPlayersList.innerHTML = '<div class="no-players">Waiting for players to join...</div>';
        } else {
            indexPlayersList.innerHTML = gameState.players.map(player => 
                `<div class="player-item">${player.name}</div>`
            ).join('');
        }
    }
    
    // Update game page if elements exist
    if (gamePlayersCount) {
        gamePlayersCount.textContent = gameState.players.length;
    }
    
    if (gamePlayersList) {
        if (gameState.players.length === 0) {
            gamePlayersList.innerHTML = '<div class="no-players">Waiting for players to join...</div>';
        } else {
            gamePlayersList.innerHTML = gameState.players.map(player => 
                `<div class="player-item">${player.name}</div>`
            ).join('');
        }
    }
    
    // Show/hide game controls based on player count (multiplayer mode on game page)
    if (gameState.currentPage === 'game' && gameState.isHost) {
        const waitingMessage = document.getElementById('waitingForPlayers');
        const gameContainer = document.getElementById('gameContainer');
        
        const hasEnoughPlayers = gameState.players.length >= 2;
        
        if (waitingMessage) {
            waitingMessage.style.display = hasEnoughPlayers ? 'none' : 'block';
            waitingMessage.classList.toggle('hidden', hasEnoughPlayers);
        }
        
        if (gameContainer) {
            gameContainer.style.display = hasEnoughPlayers ? '' : 'none';
        }
    }
}

export function updateStartButton(gameState) {
    const startBtn = document.getElementById('startGameBtn');
    
    if (startBtn) {
        const canStart = gameState.players.length >= 2;
        
        if (canStart) {
            startBtn.disabled = false;
            startBtn.classList.remove('disabled');
            startBtn.textContent = `Start Game (${gameState.players.length} players)`;
        } else {
            startBtn.disabled = true;
            startBtn.classList.add('disabled');
            startBtn.textContent = gameState.players.length === 0 
                ? 'Waiting for players...' 
                : `Need ${2 - gameState.players.length} more player${2 - gameState.players.length === 1 ? '' : 's'}`;
        }
    }
}

// === ROOM ACTIONS ===
export function createRoom(socket, gameState) {
    if (!socket || !gameState.isConnected) {
        updateStatus('Not connected to server', 'error');
        return;
    }
    
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

export function startGame(gameState, socket) {
    if (!gameState.isHost || gameState.players.length < 2) {
        updateStatus('Need at least 2 players to start', 'error');
        return;
    }
    
    // Notify all players that game is starting
    if (socket && gameState.roomCode) {
        socket.emit('start-game', {
            roomCode: gameState.roomCode
        });
    }
    
    // Store game data for the game page
    sessionStorage.setItem('multiplayerRoom', JSON.stringify({
        roomCode: gameState.roomCode,
        isHost: true,
        players: gameState.players
    }));
    
    // Navigate to game page
    window.location.href = '../../pages/game.html';
}

export function copyRoomCode(gameState) {
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

export function startOfflineMode() {
    // Clear any multiplayer data
    sessionStorage.removeItem('multiplayerRoom');
    sessionStorage.setItem('gameMode', 'offline');
    
    // Navigate to offline setup
    if (window.showOfflineSetup) {
        window.showOfflineSetup();
    } else {
        window.location.href = '../../pages/index.html';
    }
}
