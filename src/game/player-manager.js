// src/game/player-manager.js - Player management: turns, submissions, and answer tracking
// Handles player progression, answer recording, and submission state

import { GAME_CONFIG, CONFIG_UTILS } from '../config/game-config.js';

// === SHARED GAME STATE ===
let playerNames = [];
let currentPlayerIndex = 0;
let submissionsByQuestion = {};

// === PLAYER TURN MANAGEMENT ===
function getCurrentPlayerName() {
    if (playerNames.length === 0) return 'Player';
    return playerNames[currentPlayerIndex] || 'Unknown Player';
}

function advanceToNextPlayer() {
    if (playerNames.length === 0) return;
    
    currentPlayerIndex = (currentPlayerIndex + 1) % playerNames.length;
    updatePlayerTurnIndicator();
    
    // Clear the selection for the next player
    if (window.gameCore) {
        window.gameCore.clearCurrentSelection();
    }
}

function updatePlayerTurnIndicator() {
    // Use offlinePlayerIndicator for offline mode
    const offlineIndicator = document.getElementById('offlinePlayerIndicator');
    const playerNameElement = document.getElementById('currentPlayerName');
    if (offlineIndicator && playerNameElement && playerNames.length > 0) {
        const currentPlayer = getCurrentPlayerName();
        playerNameElement.textContent = currentPlayer;
        offlineIndicator.style.display = '';
        // Add animation class for new turn
        offlineIndicator.classList.add('new-turn');
        setTimeout(() => offlineIndicator.classList.remove('new-turn'), GAME_CONFIG.ANIMATIONS.TURN_INDICATOR_DURATION);
    } else if (offlineIndicator) {
        offlineIndicator.style.display = 'none';
    }
}

function recordPlayerAnswer(playerName, question, answer) {
    // Initialize question entry if it doesn't exist
    if (!submissionsByQuestion[question]) {
        submissionsByQuestion[question] = {
            answers: {},
            timestamp: Date.now()
        };
    }
    
    // Record the player's answer
    submissionsByQuestion[question].answers[playerName] = answer;
    

}

function updateSubmissionState() {
    const questionElement = document.getElementById('question');
    const currentQuestionText = questionElement ? questionElement.textContent : '';
    
    if (!currentQuestionText || currentQuestionText === 'No question available') {
        return;
    }
    
    const currentQuestionData = submissionsByQuestion[currentQuestionText];
    const answersReceived = currentQuestionData ? Object.keys(currentQuestionData.answers).length : 0;
    const totalPlayers = playerNames.length;
    
    const submitBtn = document.getElementById('submitButton');
    const finBtn = document.getElementById('final_submit');
    
    // Update submit button text and state
    if (submitBtn) {
        const currentPlayer = getCurrentPlayerName();
        const hasCurrentPlayerAnswered = currentQuestionData && currentQuestionData.answers[currentPlayer];
        
        if (hasCurrentPlayerAnswered) {
            submitBtn.textContent = `${currentPlayer} Already Answered`;
            submitBtn.disabled = true;
            submitBtn.classList.add('disabled');
        } else {
            submitBtn.textContent = 'Submit Answer';
            submitBtn.disabled = false;
            submitBtn.classList.remove('disabled');
        }
    }
    
    // Show/hide final submit button based on completion
    if (finBtn) {
        // In multiplayer mode, always show the button (host controls when to reveal)
        if (window.transport && window.transport.isMultiplayer()) {
            finBtn.style.display = 'block';
            finBtn.textContent = `Record Answers (${answersReceived}/${totalPlayers} answered)`;
        } else {
            // Offline mode: only show when all players answered
            if (answersReceived >= totalPlayers && totalPlayers > 0) {
                finBtn.style.display = 'block';
                finBtn.textContent = `All ${totalPlayers} Players Answered - Show Results`;
            } else {
                finBtn.style.display = 'none';
            }
        }
    }
    
    // Update progress display if it exists
    const progressElement = document.getElementById('answerProgress');
    if (progressElement && totalPlayers > 0) {
        progressElement.textContent = `${answersReceived}/${totalPlayers} players answered`;
    }
}

// === ANSWER SUBMISSION ===
function submitAnswer() {
    // In offline mode, try to get answer from offline.js function first
    let selectedPreference = '';
    if (window.getSelectedAnswerOffline) {
        selectedPreference = window.getSelectedAnswerOffline();
    } else {
        const input = document.getElementById('selectedPreference');
        selectedPreference = input ? input.value : '';
    }
    
    if (!selectedPreference) {
        alert('Please select an option before submitting.');
        return;
    }
    
    const currentPlayerName = getCurrentPlayerName();
    const questionElement = document.getElementById('question');
    const currentQuestionText = questionElement ? questionElement.textContent : 'Unknown Question';
    
    // Record this answer
    recordPlayerAnswer(currentPlayerName, currentQuestionText, selectedPreference);
    

    
    // MULTIPLAYER INTEGRATION: Advance to next player if in multiplayer mode
    if (window.transport && window.transport.isMultiplayer()) {
        // Let multiplayer manager handle player advancement
        // This will be handled by the multiplayer system
    } else {
        // Offline mode - show flying shapes and advance to next player
        spawnFlyingShapes();
        advanceToNextPlayer();
    }
    
    // Update UI
    updateSubmissionState();
}

// Spawn flying shapes animation for offline mode
function spawnFlyingShapes() {
    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b'];
    const numShapes = 3;
    
    for (let i = 0; i < numShapes; i++) {
        setTimeout(() => {
            const shape = document.createElement('div');
            shape.className = 'flying-shape star';
            shape.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            shape.style.top = `${20 + Math.random() * 60}%`;
            shape.style.animationDelay = `${i * 0.1}s`;
            
            document.body.appendChild(shape);
            
            // Remove shape after animation completes
            setTimeout(() => {
                shape.remove();
            }, 2000);
        }, i * 200);
    }
}

function handleFinalSubmit() {

    
    // Create chronological list of questions in the order they were answered
    const questionOrder = Object.keys(submissionsByQuestion).map(question => ({
        question: question,
        timestamp: submissionsByQuestion[question].timestamp || Date.now()
    })).sort((a, b) => a.timestamp - b.timestamp);
    
    // Pass chronological data to display page
    CONFIG_UTILS.setStorageItem('QUESTIONS_ORDER', JSON.stringify(questionOrder));
    CONFIG_UTILS.setStorageItem('SUBMISSIONS', JSON.stringify(submissionsByQuestion));
    
    // Save final session state before finishing (offline mode only)
    if (window.gameSessionManager && !window.transport.isMultiplayer()) {
        gameSessionManager.saveCurrentSession();
    }
    
    // Use transport interface to show results (works for both offline and multiplayer)
    if (window.transport && window.transport.showResults) {
        // Prepare results data
        const resultsData = {
            submissionsByQuestion: submissionsByQuestion,
            playerNames: playerNames,
            questionsOrder: JSON.parse(CONFIG_UTILS.getStorageItem('QUESTIONS_ORDER') || '[]')
        };
        
        window.transport.showResults(resultsData);
    } else {
        // Fallback to old method if transport not available
        showGameResults();
    }
}

function showGameResults() {
    // Hide the main game interface
    const gameContainer = document.querySelector('main > div');
    if (gameContainer) {
        gameContainer.style.display = 'none';
    }
    
    // Show results section
    const resultsSection = document.getElementById('gameResults');
    if (!resultsSection) {
        console.error('Results section not found');
        return;
    }
    
    resultsSection.classList.remove('hidden');
    
    // Populate game stats
    const totalQuestions = Object.keys(submissionsByQuestion).length;
    const totalPlayers = playerNames.length;
    
    document.getElementById('totalQuestions').textContent = totalQuestions;
    document.getElementById('totalPlayers').textContent = totalPlayers;
    
    // Calculate game duration (basic implementation)
    const gameStart = CONFIG_UTILS.getStorageItem('GAME_START_TIME');
    const gameDuration = gameStart ? 
        Math.round((Date.now() - parseInt(gameStart)) / 60000) + ' minutes' : 
        'Unknown';
    document.getElementById('gameDuration').textContent = gameDuration;
    
    // Populate questions and answers
    const questionsList = document.getElementById('questionsList');
    questionsList.innerHTML = '';
    
    // Get questions in chronological order
    const questionsInOrder = JSON.parse(CONFIG_UTILS.getStorageItem('QUESTIONS_ORDER') || '[]');
    
    questionsInOrder.forEach(questionData => {
        const questionText = questionData.question;
        const submissions = submissionsByQuestion[questionText];
        
        if (submissions) {
            const questionItem = document.createElement('div');
            questionItem.className = 'question-item';
            
            const questionTextDiv = document.createElement('div');
            questionTextDiv.className = 'question-text';
            questionTextDiv.textContent = questionText;
            
            const answersDiv = document.createElement('div');
            answersDiv.className = 'question-answers';
            
            // Group answers by preference
            const answerGroups = {};
            Object.entries(submissions.answers).forEach(([player, answer]) => {
                if (!answerGroups[answer]) {
                    answerGroups[answer] = [];
                }
                answerGroups[answer].push(player);
            });
            
            // Create answer chips
            Object.entries(answerGroups).forEach(([answer, players]) => {
                const chip = document.createElement('span');
                chip.className = 'answer-chip';
                chip.textContent = `${answer}: ${players.join(', ')}`;
                answersDiv.appendChild(chip);
            });
            
            questionItem.appendChild(questionTextDiv);
            questionItem.appendChild(answersDiv);
            questionsList.appendChild(questionItem);
        }
    });
    
    // Set up action buttons
    setupResultsButtons();
}

function setupResultsButtons() {
    const continueGameBtn = document.getElementById('continueGameBtn');
    const playAgainBtn = document.getElementById('playAgainBtn');
    const backToMenuBtn = document.getElementById('backToMenuBtn');
    
    if (continueGameBtn) {
        continueGameBtn.addEventListener('click', () => {
            // Resume the game with current state
            resumeGame();
        });
    }
    
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            // Clear game data and restart
            CONFIG_UTILS.removeStorageItem('SUBMISSIONS');
            CONFIG_UTILS.removeStorageItem('QUESTIONS_ORDER');
            CONFIG_UTILS.removeStorageItem('GAME_START_TIME');
            window.location.reload();
        });
    }
    
    if (backToMenuBtn) {
        backToMenuBtn.addEventListener('click', () => {
            // Clear all game data and go to main menu
            sessionStorage.clear();
            window.location.href = '../pages/index.html';
        });
    }
}

function resumeGame() {
    // Use transport interface to hide results
    if (window.transport && window.transport.hideResults) {
        window.transport.hideResults();
    } else {
        // Fallback: Hide results section manually
        const resultsSection = document.getElementById('gameResults');
        if (resultsSection) {
            resultsSection.classList.add('hidden');
        }
        
        // Show the main game interface again
        const gameContainer = document.querySelector('main > div');
        if (gameContainer) {
            gameContainer.style.display = '';
        }
    }
    
    // Find the next question that hasn't been fully answered by all players
    findNextUncompletedQuestion();
    
    // Update the player turn indicator to current state
    updatePlayerTurnIndicator();
    
    // Update submit button state based on current question
    updateSubmissionState();
    
    // If there's a current question, make sure it's displayed properly
    if (window.gameCore && window.gameCore.refreshCurrentQuestion) {
        window.gameCore.refreshCurrentQuestion();
    }
    
    // Optionally show a toast/message that the game has resumed
    showGameResumedMessage();
}

function findNextUncompletedQuestion() {
    // Get all questions and find one that doesn't have answers from all players
    const totalPlayers = playerNames.length;
    const currentQuestionElement = document.getElementById('question');
    
    if (!currentQuestionElement) return;
    
    // Check current question first
    const currentQuestionText = currentQuestionElement.textContent;
    const currentQuestionData = submissionsByQuestion[currentQuestionText];
    const currentAnswers = currentQuestionData ? Object.keys(currentQuestionData.answers).length : 0;
    
    // If current question is not fully answered, stay on it
    if (currentAnswers < totalPlayers) {
        return; // Stay on current question
    }
    
    // Otherwise, try to find next uncompleted question by switching questions
    let attempts = 0;
    const maxAttempts = 20; // Prevent infinite loop
    
    while (attempts < maxAttempts) {
        // Switch to the next question
        if (window.gameCore && window.gameCore.switchToNextQuestion) {
            window.gameCore.switchToNextQuestion();
        }
        
        // Check if this new question is incomplete
        const newQuestionText = currentQuestionElement.textContent;
        const newQuestionData = submissionsByQuestion[newQuestionText];
        const newAnswers = newQuestionData ? Object.keys(newQuestionData.answers).length : 0;
        
        if (newAnswers < totalPlayers) {
            return; // Found an incomplete question
        }
        
        attempts++;
    }
}

function showGameResumedMessage() {
    // Create a temporary message to confirm game resumed
    const message = document.createElement('div');
    message.className = 'game-resumed-message';
    message.textContent = '🎮 Game resumed! Continue where you left off.';
    message.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--accent-dark);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 1001;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(message);
    
    // Remove message after 3 seconds
    setTimeout(() => {
        message.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, GAME_CONFIG.ANIMATIONS.FADE_TRANSITION);
    }, GAME_CONFIG.ANIMATIONS.MESSAGE_DISPLAY_TIME);
}

// === INITIALIZATION ===
function initializePlayerSystem() {
    // Track game start time
    if (!CONFIG_UTILS.getStorageItem('GAME_START_TIME')) {
        CONFIG_UTILS.setStorageItem('GAME_START_TIME', Date.now().toString());
    }
    // Load player data from session storage (for offline mode)
    const gameMode = CONFIG_UTILS.getStorageItem('GAME_MODE');
    if (gameMode === GAME_CONFIG.MODES.OFFLINE) {
        const storedNames = CONFIG_UTILS.getStorageItem('PLAYER_NAMES');
        // Show submit button for offline mode
        const offlineSubmitContainer = document.getElementById('offlineSubmitContainer');
        if (offlineSubmitContainer) offlineSubmitContainer.style.display = '';
        // Show current player indicator for offline mode
        const offlinePlayerIndicator = document.getElementById('offlinePlayerIndicator');
        if (offlinePlayerIndicator) offlinePlayerIndicator.style.display = '';
        // Submit button handler is set by question-manager.js using addEventListener
        if (storedNames) {
            try {
                const names = JSON.parse(storedNames);
                playerNames = names;
                // Initialize the first player's turn
                currentPlayerIndex = 0;
                updatePlayerTurnIndicator();
            } catch (error) {
                // Keep error handling for debugging issues
                console.error('Error loading player names:', error);
            }
        }
    }
}

// === EXPORTS ===
// Make functions available globally for use by other modules
window.gamePlayer = {
    getCurrentPlayerName,
    advanceToNextPlayer,
    updatePlayerTurnIndicator,
    recordPlayerAnswer,
    updateSubmissionState,
    submitAnswer,
    handleFinalSubmit,
    showGameResults,
    setupResultsButtons,
    resumeGame,
    showGameResumedMessage,
    initializePlayerSystem,
    // Getters for shared state
    getPlayerNames: () => playerNames,
    getCurrentPlayerIndex: () => currentPlayerIndex,
    getSubmissionsByQuestion: () => submissionsByQuestion,
    // Setters for shared state
    setPlayerNames: (names) => { playerNames = names; },
    setCurrentPlayerIndex: (index) => { currentPlayerIndex = index; }
};

// === AUTO-INITIALIZATION ===
// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (window.gamePlayer) {
        window.gamePlayer.initializePlayerSystem();
    }
});