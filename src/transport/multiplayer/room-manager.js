import { CONFIG_UTILS } from '../../config/game-config.js';

function updateStatus(message, type = 'info') {
    const statusText = CONFIG_UTILS.setText('statusText', message);
    const statusDot = CONFIG_UTILS.getElement('statusDot');
    
    if (statusDot) {
        statusDot.className = `status-dot ${type}`;
    }
}

export function initializeSocket(gameState, onAnswerReceived, onAnswersRevealed) {
    if (typeof io === 'undefined') {
        updateStatus('Server unavailable - Please refresh', 'error');
        return { success: false, socket: null };
    }

    try {
        const socket = io();
        
        // Make socket globally accessible for theme buttons
        window.socket = socket;
        
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
                CONFIG_UTILS.show('createRoomStep');
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
            CONFIG_UTILS.setText('roomCodeDisplay', data.roomCode);
            
            // Show multiplayer info panel on game page
            if (gameState.currentPage === 'game') {
                CONFIG_UTILS.show('multiplayerInfo');
                
                console.log('Room created, calling regenerateMultiplayerSettings');
                console.log('Function exists:', typeof window.regenerateMultiplayerSettings);
                
                // Regenerate settings to ensure they're visible
                if (typeof window.regenerateMultiplayerSettings === 'function') {
                    window.regenerateMultiplayerSettings();
                } else {
                    console.error('regenerateMultiplayerSettings function not found!');
                }
                
                // Initialize theme manager for host
                initializeThemeManager(socket, data.roomCode, true);
            }
            
            // For index page (old flow, still supported)
            CONFIG_UTILS.show('roomCreatedStep');
            CONFIG_UTILS.hide('createRoomStep');
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
        updateStatus('Connection failed - Please refresh', 'error');
        return { success: false, socket: null };
    }
}

export function updatePlayersList(gameState) {
    const indexPlayersList = CONFIG_UTILS.getElement('joinedPlayersList');
    const indexPlayersCount = CONFIG_UTILS.getElement('joinedPlayersCount');
    
    const gamePlayersList = CONFIG_UTILS.getElement('connectedPlayersList');
    const gamePlayersCount = CONFIG_UTILS.getElement('playerCount');
    
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
        const hasEnoughPlayers = gameState.players.length >= 2;
        
        const waitingMessage = CONFIG_UTILS.getElement('waitingForPlayers');
        if (waitingMessage) {
            CONFIG_UTILS.setDisplay(waitingMessage, hasEnoughPlayers ? 'none' : 'block');
            CONFIG_UTILS.toggle(waitingMessage, !hasEnoughPlayers);
        }
        
        CONFIG_UTILS.setDisplay('gameContainer', hasEnoughPlayers ? '' : 'none');
    }
}

export function updateStartButton(gameState) {
    const startBtn = CONFIG_UTILS.getElement('startGameBtn');
    
    if (startBtn) {
        const canStart = gameState.players.length >= 2;
        
        if (canStart) {
            startBtn.disabled = false;
            CONFIG_UTILS.removeClass(startBtn, 'DISABLED');
            startBtn.textContent = `Start Game (${gameState.players.length} players)`;
        } else {
            startBtn.disabled = true;
            CONFIG_UTILS.addClass(startBtn, 'DISABLED');
            startBtn.textContent = gameState.players.length === 0 
                ? 'Waiting for players...' 
                : `Need ${2 - gameState.players.length} more player${2 - gameState.players.length === 1 ? '' : 's'}`;
        }
    }
}

export function createRoom(socket, gameState) {
    if (!socket || !gameState.isConnected) {
        updateStatus('Not connected to server', 'error');
        return;
    }
    
    updateStatus('Room created!', 'connected');
    
    const createBtn = CONFIG_UTILS.getElement('createRoomBtn');
    if (createBtn) {
        createBtn.disabled = true;
        createBtn.textContent = 'Room Created!';
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
        const copyBtn = CONFIG_UTILS.getElement('copyRoomCodeBtn');
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