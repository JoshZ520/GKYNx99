// src/transport/multiplayer-handler.js - Multiplayer system
// Handles all multiplayer functionality - room creation, player management, game integration

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
function initializeSocket() {
    if (typeof io === 'undefined') {
        updateStatus('Server unavailable - Offline mode only', 'offline');
        return false;
    }

    try {
        socket = io();
        
        socket.on('connect', () => {
            gameState.isConnected = true;
            updateStatus('Connected to server', 'connected');
            
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
                // First question will be broadcast when topic is selected by the game
            }
        });
        
        socket.on('disconnect', () => {
            gameState.isConnected = false;
            updateStatus('Disconnected from server', 'disconnected');
        });
        
        socket.on('room-created', (data) => {
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
            gameState.players.push(data.player);
            updatePlayersList();
            updateStartButton();
        });
        
        socket.on('player-left', (data) => {
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
            
            // Auto-capture answers when all players have submitted
            if (data.answeredCount === data.totalPlayers && data.totalPlayers > 0) {
                setTimeout(() => {
                    revealAnswers(); // This will capture results without displaying them
                }, 500);
            }
        });
        
        socket.on('answers-revealed', (data) => {
            // Store results for this question
            gameState.allQuestionResults.push({
                question: data.question,
                results: data.results,
                timestamp: Date.now()
            });
            
            // Show the "End Game" button after first question is answered
            const endGameBtn = document.getElementById('end_game_btn');
            if (endGameBtn) {
                endGameBtn.style.display = 'block';
            }
            
            // Reset progress for next question
            updateAnswerProgress(0, gameState.playerNames.length);
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

// === GAME ACTIONS ===
function createRoom() {
    console.log('createRoom() called');
    console.log('Socket:', socket);
    console.log('Connected:', gameState.isConnected);
    
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

function startGame() {
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

function startOfflineMode() {
    // Clear any multiplayer data
    sessionStorage.removeItem('multiplayerRoom');
    sessionStorage.setItem('gameMode', 'offline');
    
    // Navigate to offline setup (fallback directory)
    // Fallback page no longer exists - show offline setup inline
    if (window.showOfflineSetup) {
        window.showOfflineSetup();
    } else {
        window.location.href = '../../pages/index.html';
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
    
    // Show answer progress container
    const progressContainer = document.getElementById('answerProgressContainer');
    if (progressContainer) {
        progressContainer.classList.remove('hidden');
    }
    
    // Convert question to multiplayer format - handle different question formats
    let questionText = '';
    if (typeof question === 'string') {
        questionText = question;
    } else if (question.prompt) {
        questionText = question.prompt;
    } else if (question.text) {
        questionText = typeof question.text === 'string' ? question.text : question.text.prompt;
    }
    
    // Extract options from different formats
    let options = [];
    if (question.options && Array.isArray(question.options)) {
        // Already has options array
        options = question.options;
    } else if (question.option1 && question.option2) {
        // Convert option1/option2 format to array
        options = [
            { text: question.option1, value: 'option1', image: question.images?.option1 },
            { text: question.option2, value: 'option2', image: question.images?.option2 }
        ];
    }
    
    const multiplayerQuestion = {
        text: questionText,
        options: options
    };
    
    socket.emit('broadcast-question', {
        roomCode: gameState.roomCode,
        question: multiplayerQuestion
    });
}

function revealAnswers() {
    if (!gameState.isHost || !socket || !gameState.isConnected) {
        console.log('Not authorized to reveal answers');
        return;
    }
    
    socket.emit('reveal-answers', {
        roomCode: gameState.roomCode
    });
}

function updateAnswerProgress(answeredCount, totalPlayers) {
    const progressElement = document.getElementById('answerProgress');
    if (progressElement) {
        progressElement.textContent = `${answeredCount}/${totalPlayers} players answered`;
    }
    
    // Auto-reveal disabled - host must click "All Answers Finished" button
    // if (answeredCount === totalPlayers && totalPlayers > 0) {
    //     setTimeout(() => {
    //         revealAnswers();
    //     }, 1000);
    // }
}

// Display results as a status bar
function displayResultsBar(results, question) {
    const resultsBar = document.getElementById('questionResultsBar');
    const resultsContent = document.getElementById('resultsBarContent');
    
    if (!resultsBar || !resultsContent) return;
    
    // Count votes for each option
    const voteCounts = {};
    results.forEach(result => {
        const answer = result.answer.text || result.answer.value || result.answer;
        voteCounts[answer] = (voteCounts[answer] || 0) + 1;
    });
    
    const totalVotes = results.length;
    
    // Build status bars HTML
    let html = '';
    Object.entries(voteCounts).forEach(([option, count]) => {
        const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        html += `
            <div class="result-option">
                <div class="option-label">${option}</div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${percentage}%"></div>
                    <span class="vote-count">${count} vote${count !== 1 ? 's' : ''} (${percentage}%)</span>
                </div>
            </div>
        `;
    });
    
    resultsContent.innerHTML = html;
    return html; // Return HTML for reuse in all results display
}

// Display all accumulated results
function showAllResults() {
    if (gameState.allQuestionResults.length === 0) {
        alert('No questions have been answered yet!');
        return;
    }
    
    const allResultsDisplay = document.getElementById('allResultsDisplay');
    const allResultsContent = document.getElementById('allResultsContent');
    const resultCounter = document.getElementById('resultCounter');
    
    if (!allResultsDisplay || !allResultsContent) return;
    
    // Clamp lastViewedQuestionIndex to valid range
    let lastSeen = Math.max(0, Math.min(gameState.lastViewedQuestionIndex, gameState.allQuestionResults.length - 1));
    // If new questions have been added since last view, start at the first new one
    let currentQuestionIndex = lastSeen;
    if (gameState.allQuestionResults.length > lastSeen + 1) {
        currentQuestionIndex = lastSeen + 1;
    }
    
    function displayQuestion(index) {
        const questionData = gameState.allQuestionResults[index];
        const question = questionData.question;
        const results = questionData.results;
        
        // Update last viewed index
        gameState.lastViewedQuestionIndex = index;
        
        // Count votes for each option
        const voteCounts = {};
        results.forEach(result => {
            const answer = result.answer.text || result.answer.value || result.answer;
            voteCounts[answer] = (voteCounts[answer] || 0) + 1;
        });
        
        const totalVotes = results.length;
        
        // Build display HTML
        let html = `
            <div class="question-result-card">
                <h3 class="result-question">${question.text || question.prompt || question}</h3>
        `;
        
        Object.entries(voteCounts).forEach(([option, count]) => {
            const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            html += `
                <div class="result-option">
                    <div class="option-label">${option}</div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${percentage}%"></div>
                        <span class="vote-count">${count} vote${count !== 1 ? 's' : ''} (${percentage}%)</span>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        allResultsContent.innerHTML = html;
        
        // Update counter
        resultCounter.textContent = `Question ${index + 1} of ${gameState.allQuestionResults.length}`;
        
        // Update navigation buttons
        document.getElementById('prevResultBtn').disabled = index === 0;
        document.getElementById('nextResultBtn').disabled = index === gameState.allQuestionResults.length - 1;
    }
    
    // Navigation handlers
    document.getElementById('prevResultBtn').onclick = () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayQuestion(currentQuestionIndex);
        }
    };
    
    document.getElementById('nextResultBtn').onclick = () => {
        if (currentQuestionIndex < gameState.allQuestionResults.length - 1) {
            currentQuestionIndex++;
            displayQuestion(currentQuestionIndex);
        }
    };
    
    document.getElementById('closeResultsBtn').onclick = () => {
    allResultsDisplay.classList.add('hidden');
    // Clamp lastViewedQuestionIndex to valid range on close
    gameState.lastViewedQuestionIndex = Math.max(0, Math.min(currentQuestionIndex, gameState.allQuestionResults.length - 1));
    };
    
    // Show modal and display first question
    allResultsDisplay.classList.remove('hidden');
    displayQuestion(currentQuestionIndex);
}

// Make functions globally available for HTML onclick handlers and game.js
if (typeof window !== 'undefined') {
    window.createRoom = createRoom;
    window.startGame = startGame;
    window.broadcastQuestionToPlayers = broadcastQuestionToPlayers;
    window.revealAnswers = revealAnswers;
    window.showAllResults = showAllResults;
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

// Helper function to extract current question options from the page
function extractCurrentQuestionOptions() {
    const optionsContainer = document.getElementById('preferenceContainer');
    if (!optionsContainer || optionsContainer.style.display === 'none') {
        return [
            { text: 'Yes', value: 'yes' },
            { text: 'No', value: 'no' }
        ];
    }
    
    const option1 = document.getElementById('option1')?.textContent || 'Option A';
    const option2 = document.getElementById('option2')?.textContent || 'Option B';
    
    return [
        { text: option1, value: 'A' },
        { text: option2, value: 'B' }
    ];
}

// === EXPORT API FOR GAME INTEGRATION ===
window.hostMultiplayer = {
    isActive: () => gameState.isConnected && gameState.isHost && gameState.roomCode,
    broadcastQuestion: broadcastQuestionToPlayers,
    revealAnswers: revealAnswers,
    getGameState: () => ({ ...gameState })
};