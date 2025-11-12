// Multiplayer system coordinator
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

var socket = socket || null;
var gameState = gameState || {
    isConnected: false,
    roomCode: null,
    isHost: false,
    players: [],
    currentPage: getCurrentPage(),
    allQuestionResults: [],
    lastViewedQuestionIndex: 0
};

function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('index.html') || path === '/') return 'index';
    if (path.includes('game.html')) return 'game';
    if (path.includes('player.html')) return 'player';
    return 'unknown';
}

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

function setupEventListeners() {
    const createRoomBtn = document.getElementById('createRoomBtn');
    if (createRoomBtn && gameState.currentPage === 'index') {
        createRoomBtn.addEventListener('click', () => {
            const createRoomStep = document.getElementById('createRoomStep');
            const hostNameStep = document.getElementById('hostNameStep');
            if (createRoomStep && hostNameStep) {
                createRoomStep.classList.add('hidden');
                hostNameStep.classList.remove('hidden');
            }
        });
    }
    
    if (createRoomBtn && gameState.currentPage === 'game') {
        createRoomBtn.addEventListener('click', () => {
            if (socket && socket.connected) {
                createRoom();
            } else {
                gameState.needsRoomCreation = true;
            }
        });
    }
    
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
                sessionStorage.setItem('hostName', hostName);
                sessionStorage.setItem('gameMode', 'multiplayer');
                sessionStorage.setItem('isHost', 'true');
                window.location.href = '../pages/game.html';
            }
        });
    }
    
    const copyRoomCodeBtn = document.getElementById('copyCodeBtn');
    if (copyRoomCodeBtn) {
        copyRoomCodeBtn.addEventListener('click', () => copyRoomCode(gameState));
    }
}

function broadcastQuestion(question) {
    broadcastQuestionToPlayers(question, socket, gameState);
}

function initializeMultiplayerHandler() {
    setupEventListeners();
    initSocket();
    updateStartButton(gameState);
    
    if (gameState.currentPage === 'game') {
        const multiplayerRoom = sessionStorage.getItem('multiplayerRoom');
        const isHost = sessionStorage.getItem('isHost') === 'true';
        const gameMode = sessionStorage.getItem('gameMode');
        
        if (multiplayerRoom) {
            try {
                const roomData = JSON.parse(multiplayerRoom);
                gameState.roomCode = roomData.roomCode;
                gameState.isHost = roomData.isHost;
                gameState.players = roomData.players || [];
                
                if (window.transport && window.multiplayerTransportHandler) {
                    window.transport.registerHandler(window.multiplayerTransportHandler);
                }
                
                if (window.transport && window.transport.initializeModeUI) {
                    window.transport.initializeModeUI();
                }
                
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
            if (window.transport && window.transport.initializeModeUI) {
                window.transport.initializeModeUI();
            }
            
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
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMultiplayerHandler);
} else {
    initializeMultiplayerHandler();
}

const multiplayerTransportHandler = {
    isActive() {
        const gameMode = sessionStorage.getItem('gameMode');
        const isOffline = gameMode === 'offline';
        return gameState.currentPage === 'game' && !isOffline;
    },

    getMode() {
        return 'multiplayer';
    },

    broadcastQuestion(question) {
        broadcastQuestion(question);
    },

    submitAnswer(answer, playerName) {
    },

    revealAnswers() {
        revealAnswers();
    }
};

window.multiplayerTransportHandler = multiplayerTransportHandler;

if (window.transport) {
    window.transport.registerHandler(multiplayerTransportHandler);
    window.transport.initializeModeUI();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.transport) {
            window.transport.registerHandler(multiplayerTransportHandler);
            window.transport.initializeModeUI();
        }
    });
}