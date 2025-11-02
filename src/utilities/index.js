// index.js - Main page functionality
// All multiplayer functionality handled by multiplayer-manager.js
// Player setup functionality moved to fallback/scripts/player-setup.js

console.log('Index page loading...');

// === OFFLINE MODE FUNCTIONALITY ===
function startOfflineMode() {
    console.log('Starting offline mode...');
    
    // Clear any multiplayer data
    sessionStorage.removeItem('multiplayerRoom');
    sessionStorage.setItem('gameMode', 'offline');
    
    // Navigate to offline setup (fallback directory)
    window.location.href = 'fallback/front-pg.html';
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
}

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('Main index page initialized');
    
    // Initialize main page event listeners
    initializeMainPageEventListeners();
    
    console.log('Main page functionality ready');
});