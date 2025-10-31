// player-turns.js - Player Turn Management and Animations for Table Talk
// Handles turn indicators, player advancement, and turn change animations
console.log('👥 Player Turns loaded');

// === SHARED STATE ===
let playerNames = [];
let currentPlayerIndex = 0;

// === PLAYER TURN SYSTEM ===
function initializePlayerTurnSystem() {
    // Only initialize on game page
    const playerTurnIndicator = document.getElementById('playerTurnIndicator');
    if (!playerTurnIndicator) return;
    
    // Load player data from sessionStorage
    const storedPlayerNames = sessionStorage.getItem('playerNames');
    const playerCount = parseInt(sessionStorage.getItem('playerCount')) || 1;
    
    if (playerCount > 1 && storedPlayerNames) {
        playerNames = JSON.parse(storedPlayerNames);
        currentPlayerIndex = 0;
        showPlayerTurnIndicator();
        updateCurrentPlayerDisplay();
    } else {
        // Single player or no multiplayer setup
        hidePlayerTurnIndicator();
    }
}

function showPlayerTurnIndicator() {
    const playerTurnIndicator = document.getElementById('playerTurnIndicator');
    if (playerTurnIndicator) {
        playerTurnIndicator.classList.remove('hidden');
        playerTurnIndicator.classList.add('visible');
    }
}

function hidePlayerTurnIndicator() {
    const playerTurnIndicator = document.getElementById('playerTurnIndicator');
    if (playerTurnIndicator) {
        playerTurnIndicator.classList.add('hidden');
        playerTurnIndicator.classList.remove('visible');
    }
}

function updateCurrentPlayerDisplay() {
    const currentPlayerNameElement = document.getElementById('currentPlayerName');
    if (currentPlayerNameElement && playerNames.length > 0) {
        // Fade out old name
        currentPlayerNameElement.classList.add('fade-out');
        currentPlayerNameElement.classList.remove('fade-in');
        
        setTimeout(() => {
            // Update name and fade in
            currentPlayerNameElement.textContent = playerNames[currentPlayerIndex];
            currentPlayerNameElement.classList.remove('fade-out');
            currentPlayerNameElement.classList.add('fade-in');
        }, 150);
    }
}

function showTurnChangeAnimation() {
    if (playerNames.length <= 1) return;
    
    // Fade out the current answer content
    const formElements = document.querySelectorAll('input[type="radio"]:checked, textarea');
    const preferenceContainer = document.querySelector('.preference-container');
    
    if (preferenceContainer) {
        preferenceContainer.classList.add('content-clearing');
    }
    
    // Create flying shapes to "clear" the screen
    createFlyingShapes();
    
    // Remove fade effect after animation
    setTimeout(() => {
        if (preferenceContainer) {
            preferenceContainer.classList.remove('content-clearing');
        }
        
        // Clear the form
        formElements.forEach(element => {
            if (element.type === 'radio') {
                element.checked = false;
            } else if (element.tagName === 'TEXTAREA') {
                element.value = '';
            }
        });
    }, 800);
}

function createFlyingShapes() {
    const colorClasses = [
        'color-red', 'color-teal', 'color-blue', 'color-green', 'color-yellow',
        'color-purple', 'color-mint', 'color-gold', 'color-lavender', 'color-sky',
        'color-orange', 'color-lime', 'color-coral', 'color-pink'
    ];
    const speedClasses = ['flying-shape-slow', 'flying-shape-medium', 'flying-shape-fast'];
    const numShapes = 5; // Create 5 star shapes flying across
    
    for (let i = 0; i < numShapes; i++) {
        setTimeout(() => {
            const shape = document.createElement('div');
            const randomColor = colorClasses[Math.floor(Math.random() * colorClasses.length)];
            const randomSpeed = speedClasses[Math.floor(Math.random() * speedClasses.length)];
            
            shape.className = `flying-shape star ${randomColor} ${randomSpeed}`;
            shape.style.top = `${Math.random() * 80 + 10}%`; // Random vertical position
            
            document.body.appendChild(shape);
            
            // Remove shape after animation
            setTimeout(() => {
                if (shape.parentNode) {
                    shape.parentNode.removeChild(shape);
                }
            }, 2000);
        }, i * 100); // Stagger the shapes slightly
    }
}

function advanceToNextPlayer() {
    if (playerNames.length > 1) {
        // Show turn change animation with flying shapes
        showTurnChangeAnimation();
        
        // Advance to next player after animation starts
        setTimeout(() => {
            currentPlayerIndex = (currentPlayerIndex + 1) % playerNames.length;
            updateCurrentPlayerDisplay();
            
            // Add new turn animation to indicator
            const indicator = document.getElementById('playerTurnIndicator');
            if (indicator) {
                indicator.classList.add('new-turn');
                setTimeout(() => {
                    indicator.classList.remove('new-turn');
                }, 600);
            }
        }, 200);
    }
}

function resetToFirstPlayer() {
    // Reset the turn system back to the first player
    if (Array.isArray(playerNames) && playerNames.length > 0) {
        currentPlayerIndex = 0;
        updateCurrentPlayerDisplay();
        console.log(`Reset to first player: ${playerNames[0]}`);
    }
}

// === UTILITY FUNCTIONS ===
function getCurrentPlayer() {
    return playerNames.length > 0 ? playerNames[currentPlayerIndex] : 'Player';
}

function getCurrentPlayerIndex() {
    return currentPlayerIndex;
}

function getPlayerNames() {
    return playerNames;
}

function getPlayerCount() {
    return playerNames.length;
}

function setCurrentPlayerIndex(index) {
    if (index >= 0 && index < playerNames.length) {
        currentPlayerIndex = index;
        updateCurrentPlayerDisplay();
    }
}

// === GLOBAL EXPORTS ===
// Make functions available to other modules
if (typeof window !== 'undefined') {
    window.playerTurns = {
        // Core functions
        initializePlayerTurnSystem: initializePlayerTurnSystem,
        advanceToNextPlayer: advanceToNextPlayer,
        resetToFirstPlayer: resetToFirstPlayer,
        
        // Display functions
        showPlayerTurnIndicator: showPlayerTurnIndicator,
        hidePlayerTurnIndicator: hidePlayerTurnIndicator,
        updateCurrentPlayerDisplay: updateCurrentPlayerDisplay,
        
        // Animation functions
        showTurnChangeAnimation: showTurnChangeAnimation,
        createFlyingShapes: createFlyingShapes,
        
        // State access
        getCurrentPlayer: getCurrentPlayer,
        getCurrentPlayerIndex: getCurrentPlayerIndex,
        getPlayerNames: getPlayerNames,
        getPlayerCount: getPlayerCount,
        setCurrentPlayerIndex: setCurrentPlayerIndex
    };
    
    // Legacy global functions for backward compatibility
    window.initializePlayerTurnSystem = initializePlayerTurnSystem;
    window.advanceToNextPlayer = advanceToNextPlayer;
    window.updateCurrentPlayerDisplay = updateCurrentPlayerDisplay;
    window.showTurnChangeAnimation = showTurnChangeAnimation;
    window.createFlyingShapes = createFlyingShapes;
}