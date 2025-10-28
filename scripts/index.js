// index.js - Front page functionality
// Handles player count selection, player setup, and game start
// Optional Socket.io connection (only if server is running)
let socket = null;
if (typeof io !== 'undefined') {
    try {
        socket = io();
        socket.on('connect', () => {
            console.log('Connected to server from INDEX page!');
            console.log('Socket ID:', socket.id);
        });
        socket.on('welcome', (message) => {
            console.log('Welcome message on index page:', message);
        });
    } catch (error) {
        console.log('Socket.io not available - running in standalone mode');
        socket = null;
    }
} else {
    console.log('Socket.io not loaded - running in standalone mode');
}
// === PLAYER SETUP SYSTEM ===
let playerNames = [];
// Handle player count selection and storage
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
// Front page instruction is now hardcoded in HTML - no need to load from file
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
// Step progress management
function updateStepProgress(currentStep) {
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        const stepNumber = index + 1;
        step.classList.remove('active', 'completed');
        if (stepNumber < currentStep) {
            step.classList.add('completed');
        } else if (stepNumber === currentStep) {
            step.classList.add('active');
        }
    });
}
function showPlayerSetup(playerCount) {
    const playerSetupSection = document.getElementById('playerSetupSection');
    const playerNamesContainer = document.getElementById('playerNamesContainer');
    if (!playerSetupSection || !playerNamesContainer) return;
    // Update step progress to step 2
    updateStepProgress(2);
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
            // Update to step 3 (ready to start)
            updateStepProgress(3);
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
// === RESUME GAME FUNCTIONALITY ===
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
// === INITIALIZATION ===
window.addEventListener('DOMContentLoaded', function() {
    // Handle front page functionality (player count selection)
    handleFrontPageFunctionality();
    // Initialize player setup system
    initializePlayerSetup();
    // Initialize resume game UI
    setTimeout(() => {
        initializeResumeGameUI();
    }, 100); // Small delay to ensure session manager is loaded
});