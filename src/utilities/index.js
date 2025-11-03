// index.js - Main page functionality
// All multiplayer functionality handled by multiplayer-manager.js
// Player setup functionality moved to fallback/scripts/player-setup.js

console.log('Index page loading...');

// === OFFLINE MODE FUNCTIONALITY ===
function startOfflineMode() {
    console.log('Starting offline mode...');
    
    // Check if there's an existing snapshot
    if (window.gameSnapshot && window.gameSnapshot.hasSnapshot()) {
        const confirmed = confirm('You have an unfinished game. Starting a new game will overwrite your progress. Continue anyway?');
        if (!confirmed) {
            return; // User cancelled
        }
        // Clear the snapshot if user wants to start fresh
        window.gameSnapshot.clearSnapshot();
    }
    
    // Clear any multiplayer data
    sessionStorage.removeItem('multiplayerRoom');
    sessionStorage.setItem('gameMode', 'offline');
    
    // Navigate to offline setup (fallback directory)
    window.location.href = 'fallback/front-pg.html';
}

// === CONTINUE GAME FUNCTIONALITY ===
function checkForSavedGame() {
    if (!window.gameSnapshot) return;
    
    const continueSection = document.getElementById('continueGameSection');
    
    if (window.gameSnapshot.hasSnapshot()) {
        // Show the continue section
        continueSection.style.display = 'block';
    } else {
        // Hide the continue section
        continueSection.style.display = 'none';
    }
}

function continueGame() {
    if (!window.gameSnapshot) return;
    
    const snapshot = window.gameSnapshot.loadSnapshot();
    if (snapshot) {
        console.log('Continuing game from snapshot...');
        
        // Restore the game state
        if (window.gameSnapshot.restoreGameState(snapshot)) {
            // Navigate to the game page
            window.location.href = 'game.html';
        } else {
            alert('Failed to restore game state. Please start a new game.');
        }
    } else {
        alert('No saved game found. Please start a new game.');
    }
}

function discardSavedGame() {
    if (!window.gameSnapshot) return;
    
    const confirmed = confirm('Are you sure you want to discard your saved game? This cannot be undone.');
    if (confirmed) {
        window.gameSnapshot.clearSnapshot();
        checkForSavedGame(); // Refresh the UI
        console.log('Saved game discarded');
    }
}

// === MAIN PAGE EVENT LISTENERS ===
function initializeMainPageEventListeners() {
    // New game button (on game page) - for when returning from game
    const newGameBtn = document.getElementById('newGameBtn');
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
            sessionStorage.clear();
            window.location.href = 'pages/index.html';
        });
    }
    
    // Offline mode button
    const offlineGameBtn = document.getElementById('offlineGameBtn');
    if (offlineGameBtn) {
        offlineGameBtn.addEventListener('click', startOfflineMode);
    }
    
    // Continue game button
    const continueGameBtn = document.getElementById('continueGameBtn');
    if (continueGameBtn) {
        continueGameBtn.addEventListener('click', continueGame);
    }
    
    // Discard saved game button
    const discardGameBtn = document.getElementById('discardGameBtn');
    if (discardGameBtn) {
        discardGameBtn.addEventListener('click', discardSavedGame);
    }
}

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('Main index page initialized');
    
    // Initialize main page event listeners
    initializeMainPageEventListeners();
    
    // Check for saved games (wait a bit for game-snapshot.js to load)
    setTimeout(() => {
        checkForSavedGame();
    }, 100);
    
    console.log('Main page functionality ready');
});