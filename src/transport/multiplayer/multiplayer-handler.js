// src/transport/multiplayer-handler.js - Multiplayer system coordinator
// Main coordinator that imports and orchestrates all multiplayer modules

import {
    initializeSocket,
    updatePlayersList,
    updateStartButton,
    createRoom as roomManagerCreateRoom,
    startGame as roomManagerStartGame,
    copyRoomCode,
    startOfflineMode
} from './multiplayer-room-manager.js';

import {
    broadcastQuestionToPlayers,
    revealAnswers as gameRevealAnswers,
    updateAnswerProgress,
    handleAnswerReceived,
    handleAnswersRevealed,
    getCurrentQuestionOptions
} from './multiplayer-game-coordinator.js';

import {
    displayResultsBar,
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
    console.log('Setting up event listeners...');
    
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
        copyRoomCodeBtn.addEventListener('click', () => copyRoomCode(gameState));
    }
}

// === WRAPPER FUNCTION FOR BROADCASTING ===
function broadcastQuestion(question) {
    broadcastQuestionToPlayers(question, socket, gameState);
}

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    console.log(`Table Talk initializing on ${gameState.currentPage} page`);
    
    // Make functions globally available for HTML onclick handlers and game.js
    if (typeof window !== 'undefined') {
        window.createRoom = createRoom;
        window.startGame = startGame;
        window.broadcastQuestionToPlayers = broadcastQuestion;
        window.revealAnswers = revealAnswers;
        window.showAllResults = showAllResults;
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize socket connection
    const connected = initSocket();
    
    // Initialize UI state
    updateStartButton(gameState);
    
    // Game page specific initialization
    if (gameState.currentPage === 'game') {
        const multiplayerRoom = sessionStorage.getItem('multiplayerRoom');
        if (multiplayerRoom) {
            try {
                const roomData = JSON.parse(multiplayerRoom);
                gameState.roomCode = roomData.roomCode;
                gameState.isHost = roomData.isHost;
                gameState.players = roomData.players || [];
                
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
        }
    }
});

// === EXPORT API FOR GAME INTEGRATION ===
window.hostMultiplayer = {
    isActive: () => gameState.isConnected && gameState.isHost && gameState.roomCode,
    broadcastQuestion: broadcastQuestion,
    revealAnswers: revealAnswers,
    getGameState: () => ({ ...gameState })
};

// === TRANSPORT INTERFACE IMPLEMENTATION ===
/**
 * Multiplayer handler implementation of the transport interface
 * Registers itself with the transport layer
 */
const multiplayerTransportHandler = {
    /**
     * Check if multiplayer mode is active
     */
    isActive() {
        return gameState.isConnected && gameState.isHost && gameState.roomCode;
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