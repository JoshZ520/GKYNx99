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
    window.currentPlayerIndex = currentPlayerIndex; // Keep global sync
    updatePlayerTurnIndicator();
    
    // Clear the selection for the next player
    if (window.gameCore) {
        window.gameCore.clearCurrentSelection();
    }
}

function updatePlayerTurnIndicator() {
    const indicator = document.getElementById('playerTurnIndicator');
    const playerNameElement = document.getElementById('currentPlayerName');
    
    console.log('Updating player turn indicator:', {
        indicator: !!indicator,
        playerNameElement: !!playerNameElement,
        playerNamesLength: playerNames.length,
        playerNames: playerNames,
        currentPlayerIndex: currentPlayerIndex
    });
    
    if (indicator && playerNameElement && playerNames.length > 0) { // Changed from > 1 to > 0
        const currentPlayer = getCurrentPlayerName();
        playerNameElement.textContent = currentPlayer;
        indicator.classList.remove('hidden');
        
        console.log('Player indicator updated:', currentPlayer);
        
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
    
    console.log('Recorded answer:', { playerName, question, answer });
    console.log('Current submissions:', submissionsByQuestion);
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
    
    console.log(`${currentPlayerName} submitted: ${selectedPreference} for "${currentQuestionText}"`);
    
    // SIMPLE FIX: Always advance to next player unless explicitly in multiplayer mode
    console.log('Checking player advancement...');
    
    // Only skip player advancement if we're definitely in an active multiplayer game
    const skipAdvancement = window.hostMultiplayer && 
                           window.hostMultiplayer.isActive && 
                           window.hostMultiplayer.isActive() &&
                           sessionStorage.getItem('offlineMode') !== 'true';
    
    if (skipAdvancement) {
        console.log('Multiplayer mode detected - skipping automatic player advancement');
    } else {
        console.log('Advancing to next player...');
        advanceToNextPlayer();
    }
    
    // Update UI
    updateSubmissionState();
}

function handleFinalSubmit() {
    console.log('Final submit clicked - preparing results');
    
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
    
    // Navigate to results page - check if offline mode
    const isOffline = sessionStorage.getItem('offlineMode') === 'true';
    if (isOffline) {
        window.location.href = 'fallback/display.html';
    } else {
        // For online mode, we might need to create a main display page or redirect appropriately
        window.location.href = 'fallback/display.html'; // Temporary - use fallback for now
    }
}

// === PLAYER SETUP ===
function initializePlayers() {
    // Load player names from session storage
    const storedPlayerNames = JSON.parse(sessionStorage.getItem('playerNames')) || [];
    console.log('Initializing players from session storage:', storedPlayerNames);
    
    if (storedPlayerNames.length > 0) {
        playerNames = storedPlayerNames;
        currentPlayerIndex = 0;
        console.log('Players loaded:', playerNames, 'Current player index:', currentPlayerIndex);
        updatePlayerTurnIndicator();
    } else {
        console.log('No player names found in session storage');
    }
}

// === INITIALIZATION ===
function initializePlayerSystem() {
    console.log('Initializing player system...');
    
    // Load player data from session storage
    const storedNames = sessionStorage.getItem('playerNames');
    console.log('Session storage playerNames:', storedNames);
    
    if (storedNames) {
        try {
            const names = JSON.parse(storedNames);
            playerNames = names; // Set directly
            window.playerNames = names; // Keep global sync
            
            console.log('Loaded players:', names);
            
            // Initialize the first player's turn
            currentPlayerIndex = 0;
            window.currentPlayerIndex = 0;
            
            // Update the display
            updatePlayerTurnIndicator();
            
        } catch (error) {
            console.error('Error loading player names:', error);
        }
    } else {
        console.log('No playerNames found in session storage');
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
    initializePlayers,
    initializePlayerSystem,
    // Getters for shared state
    getPlayerNames: () => playerNames,
    getCurrentPlayerIndex: () => currentPlayerIndex,
    getSubmissionsByQuestion: () => submissionsByQuestion,
    // Setters for shared state
    setPlayerNames: (names) => { 
        playerNames = names; 
        window.playerNames = names; // Keep global sync for compatibility
    },
    setCurrentPlayerIndex: (index) => { 
        currentPlayerIndex = index; 
        window.currentPlayerIndex = index; // Keep global sync for compatibility
    }
};

// === AUTO-INITIALIZATION ===
// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Player System...');
    if (window.gamePlayer) {
        window.gamePlayer.initializePlayerSystem();
        console.log('Player system initialized');
    }
});