// src/transport/multiplayer-handler.js - Multiplayer system coordinator
// Main coordinator that imports and orchestrates all multiplayer modules

import {
    initializeSocket,
    createRoom as roomManagerCreateRoom,
    startGame as roomManagerStartGame,
    copyRoomCode,
    updateStartButton
} from './multiplayer-room-manager.js';

import {
    broadcastQuestionToPlayers,
    revealAnswers as gameRevealAnswers,
    handleAnswerReceived,
    handleAnswersRevealed
} from './multiplayer-game-coordinator.js';

import {
    showAllResults as resultsShowAll
} from './multiplayer-results-display.js';

// === GLOBAL STATE ===
// Use var to allow redeclaration if script is loaded multiple times (shouldn't happen but prevents errors)
var socket = socket || null;
var gameState = gameState || {
    isConnected: false,
    roomCode: null,
    isHost: false,
    players: [],
    currentPage: getCurrentPage(),
    allQuestionResults: [], // Store results for all questions
    lastViewedQuestionIndex: 0 // Track where we left off in results
};

// === UTILITIES ===
function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('index.html') || path === '/') return 'index';
    if (path.includes('game.html')) return 'game';
    if (path.includes('player.html')) return 'player';
    return 'unknown';
}

// === WRAPPER FUNCTIONS FOR SOCKET INITIALIZATION ===
function initSocket() {
    const onAnswerReceived = (data) => {
        handleAnswerReceived(data, gameState, () => revealAnswers());
    };
    
    const onAnswersRevealed = (data) => {
        handleAnswersRevealed(data, gameState);
    };
    
    const result = initializeSocket(gameState, onAnswerReceived, onAnswersRevealed);
    socket = result.socket;
    return result.success;
}

// === WRAPPER FUNCTIONS FOR GAME ACTIONS ===
function createRoom() {
    roomManagerCreateRoom(socket, gameState);
}

function startGame() {
    roomManagerStartGame(gameState, socket);
}

function revealAnswers() {
    gameRevealAnswers(socket, gameState);
}

function showAllResults() {
    resultsShowAll(gameState);
}

// === EVENT LISTENERS ===
function setupEventListeners() {
    // "Host Multiplayer Game" button on index page - shows host name step
    const createRoomBtn = document.getElementById('createRoomBtn');
    if (createRoomBtn && gameState.currentPage === 'index') {
        createRoomBtn.addEventListener('click', () => {
            console.log('📝 Showing host name step');
            const createRoomStep = document.getElementById('createRoomStep');
            const hostNameStep = document.getElementById('hostNameStep');
            if (createRoomStep && hostNameStep) {
                createRoomStep.classList.add('hidden');
                hostNameStep.classList.remove('hidden');
            }
        });
    }
    
    // "Create Room" button on game page - actually creates the room
    if (createRoomBtn && gameState.currentPage === 'game') {
        createRoomBtn.addEventListener('click', () => {
            console.log('🎮 Create Room button clicked');
            if (socket && socket.connected) {
                createRoom();
            } else {
                console.log('Socket not connected yet, waiting...');
                gameState.needsRoomCreation = true;
            }
        });
    }
    
    // Host Name Input - Enable continue button when name is entered
    const hostNameInput = document.getElementById('host_name');
    const continueBtn = document.getElementById('continueToGameBtn');
    if (hostNameInput && continueBtn) {
        hostNameInput.addEventListener('input', () => {
            const hasName = hostNameInput.value.trim().length > 0;
            continueBtn.disabled = !hasName;
            continueBtn.classList.toggle('disabled', !hasName);
        });
        
        continueBtn.addEventListener('click', () => {
            const hostName = hostNameInput.value.trim();
            if (hostName) {
                // Save host name to sessionStorage
                sessionStorage.setItem('hostName', hostName);
                sessionStorage.setItem('gameMode', 'multiplayer');
                sessionStorage.setItem('isHost', 'true');
                
                // Navigate to game page where room will be created
                window.location.href = '../pages/game.html';
            }
        });
    }
    
    // Copy Room Code Button (on game page)
    const copyRoomCodeBtn = document.getElementById('copyCodeBtn');
    if (copyRoomCodeBtn) {
        copyRoomCodeBtn.addEventListener('click', () => copyRoomCode(gameState));
    }
}

// === WRAPPER FUNCTION FOR BROADCASTING ===
function broadcastQuestion(question) {
    broadcastQuestionToPlayers(question, socket, gameState);
}

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    // Setup event listeners
    setupEventListeners();
    
    // Initialize socket connection
    const connected = initSocket();
    
    // Initialize UI state
    updateStartButton(gameState);
    
    // Game page specific initialization
    if (gameState.currentPage === 'game') {
        const multiplayerRoom = sessionStorage.getItem('multiplayerRoom');
        const isHost = sessionStorage.getItem('isHost') === 'true';
        const gameMode = sessionStorage.getItem('gameMode');
        
        if (multiplayerRoom) {
            // Existing room - rejoin it
            try {
                const roomData = JSON.parse(multiplayerRoom);
                gameState.roomCode = roomData.roomCode;
                gameState.isHost = roomData.isHost;
                gameState.players = roomData.players || [];
                
                // Re-register handler now that gameState is restored
                if (window.transport && window.multiplayerTransportHandler) {
                    console.log('🔄 Re-registering handler on game page load');
                    window.transport.registerHandler(window.multiplayerTransportHandler);
                }
                
                // Initialize UI for multiplayer mode via transport interface
                if (window.transport && window.transport.initializeModeUI) {
                    window.transport.initializeModeUI();
                }
                
                // Set up player names for the game system (like offline mode does)
                // Wait for gamePlayer module to load
                setTimeout(() => {
                    if (window.gamePlayer && gameState.players.length > 0) {
                        const playerNames = gameState.players.map(p => p.name);
                        window.gamePlayer.setPlayerNames(playerNames);
                    }
                }, 500);
                
            } catch (error) {
                console.error('Failed to parse multiplayer room data:', error);
            }
        } else if (isHost && gameMode === 'multiplayer') {
            // New multiplayer session - show create room button
            console.log('🎮 New multiplayer session detected on game page');
            
            // Initialize UI for multiplayer mode FIRST
            if (window.transport && window.transport.initializeModeUI) {
                window.transport.initializeModeUI();
            }
            
            // Then show create room section and hide multiplayer info (until room is created)
            const createRoomSection = document.getElementById('createRoomSection');
            const multiplayerInfo = document.getElementById('multiplayerInfo');
            
            if (createRoomSection) {
                createRoomSection.classList.remove('hidden');
                createRoomSection.style.display = '';
            }
            if (multiplayerInfo) {
                multiplayerInfo.classList.add('hidden');
                multiplayerInfo.style.display = 'none';
            }
        }
    }
});

// === TRANSPORT INTERFACE IMPLEMENTATION ===
/**
 * Multiplayer handler implementation of the transport interface
 * Registers itself with the transport layer
 */
const multiplayerTransportHandler = {
    /**
     * Check if multiplayer mode is active
     * Returns true if NOT in offline mode (multiplayer is the default)
     */
    isActive() {
        const gameMode = sessionStorage.getItem('gameMode');
        const isOffline = gameMode === 'offline';
        // Active if we're on game page and NOT in offline mode
        return gameState.currentPage === 'game' && !isOffline;
    },

    /**
     * Get current mode
     */
    getMode() {
        return 'multiplayer';
    },

    /**
     * Broadcast question to all connected players
     */
    broadcastQuestion(question) {
        broadcastQuestion(question);
    },

    /**
     * Submit answer - handled by socket events
     */
    submitAnswer(answer, playerName) {
        // Multiplayer submission is handled by socket events
        // This is just for interface compatibility
    },

    /**
     * Reveal answers to all players
     */
    revealAnswers() {
        revealAnswers();
    }
};

// Expose handler on window so it can be re-registered after room creation
window.multiplayerTransportHandler = multiplayerTransportHandler;

// Register with transport interface when available
if (window.transport) {
    window.transport.registerHandler(multiplayerTransportHandler);
    // Initialize UI for the current mode
    window.transport.initializeModeUI();
} else {
    // If transport not loaded yet, register on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        if (window.transport) {
            window.transport.registerHandler(multiplayerTransportHandler);
            // Initialize UI for the current mode
            window.transport.initializeModeUI();
        }
    });
}