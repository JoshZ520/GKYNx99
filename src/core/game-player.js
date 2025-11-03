// game-player.js - Player management: turns, submissions, and answer tracking
// Handles player progression, answer recording, and submission state

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
    const indicator = document.getElementById('playerTurnIndicator');
    const playerNameElement = document.getElementById('currentPlayerName');
    
    if (indicator && playerNameElement && playerNames.length > 0) {
        const currentPlayer = getCurrentPlayerName();
        playerNameElement.textContent = currentPlayer;
        indicator.classList.remove('hidden');
        
        // Add animation class for new turn
        indicator.classList.add('new-turn');
        setTimeout(() => indicator.classList.remove('new-turn'), 600);
    } else if (indicator) {
        indicator.classList.add('hidden');
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
        if (answersReceived >= totalPlayers && totalPlayers > 0) {
            finBtn.style.display = 'block';
            finBtn.textContent = `All ${totalPlayers} Players Answered - Show Results`;
        } else {
            finBtn.style.display = 'none';
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
    const selectedPreference = document.getElementById('selectedPreference').value;
    
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
    if (window.hostMultiplayer && window.hostMultiplayer.isActive()) {
        // Let multiplayer manager handle player advancement
        // This will be handled by the multiplayer system
    } else {
        // Single player mode - proceed normally
        advanceToNextPlayer();
    }
    
    // Update UI
    updateSubmissionState();
}

function handleFinalSubmit() {

    
    // Create chronological list of questions in the order they were answered
    const questionOrder = Object.keys(submissionsByQuestion).map(question => ({
        question: question,
        timestamp: submissionsByQuestion[question].timestamp || Date.now()
    })).sort((a, b) => a.timestamp - b.timestamp);
    
    // Pass chronological data to display page
    sessionStorage.setItem('questionsInOrder', JSON.stringify(questionOrder));
    sessionStorage.setItem('submissionsByQuestion', JSON.stringify(submissionsByQuestion));
    
    // MULTIPLAYER INTEGRATION: Reveal answers to multiplayer players if active
    if (window.hostMultiplayer && window.hostMultiplayer.isActive()) {
        window.hostMultiplayer.revealAnswers();
    }
    
    // Save final session state before finishing
    if (window.gameSessionManager) {
        gameSessionManager.saveCurrentSession();

    }
    
    // Navigate to results page - fallback pages were consolidated
    // For now, redirect back to main page since display.html was removed
    // TODO: Create a proper results/summary page
    const isOffline = sessionStorage.getItem('offlineMode') === 'true';
    if (isOffline) {
        // Could show a game complete message and return to setup
        alert('Game Complete! Thanks for playing Table Talk!');
        sessionStorage.clear();
        window.location.href = 'index.html';
    } else {
        // For online mode
        alert('Game Complete! Thanks for playing Table Talk!');
        window.location.href = 'index.html';
    }
}

// === INITIALIZATION ===
function initializePlayerSystem() {
    // Load player data from session storage (for offline mode)
    const gameMode = sessionStorage.getItem('gameMode');
    
    if (gameMode === 'offline') {
        const storedNames = sessionStorage.getItem('playerNames');
        
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