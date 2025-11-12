// player-setup.js - Enhanced player setup functionality for fallback system
// Refactored to use shared player-setup-utils.js

import { generatePlayerInputs, updateStartButtonState as sharedUpdateStartButtonState } from '../utilities/player-setup-utils.js';

// === PLAYER SETUP SYSTEM ===
function initializePlayerSetup() {
    const playerCountInput = document.getElementById('player_count');
    const playerNamesStep = document.getElementById('playerNamesStep');
    const playerNamesContainer = document.getElementById('playerNamesContainer');
    if (!playerCountInput) return;

    playerCountInput.addEventListener('change', function(e) {
        const count = parseInt(e.target.value, 10);
        // Store in session storage
        if (!Number.isNaN(count) && count >= 2 && count <= 20) {
            sessionStorage.setItem('playerCount', String(count));
        } else {
            sessionStorage.removeItem('playerCount');
        }
        if (Number.isNaN(count) || count < 2 || count > 20) {
            if (playerNamesStep) playerNamesStep.classList.add('hidden');
            return;
        }
        if (playerNamesStep) playerNamesStep.classList.remove('hidden');
        if (playerNamesContainer) {
            generatePlayerInputs(playerNamesContainer, count, updateStartButtonState);
        }
        updateStartButtonState();
    });

    // Restore stored value if available
    const stored = parseInt(sessionStorage.getItem('playerCount'), 10);
    if (!Number.isNaN(stored) && stored >= 2 && stored <= 20) {
        playerCountInput.value = String(stored);
        playerCountInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

function updateStartButtonState() {
    const startButton = document.getElementById('startGame');
    const playerCount = parseInt(document.getElementById('player_count')?.value, 10);
    const names = [];
    for (let i = 1; i <= playerCount; i++) {
        const input = document.getElementById(`player_${i}`);
        names.push(input ? input.value : '');
    }
    sharedUpdateStartButtonState(startButton, names);
}

function handleStartGame() {
    const playerCount = parseInt(document.getElementById('player_count')?.value, 10);
    
    if (Number.isNaN(playerCount) || playerCount < 2) {
        alert('Please enter a valid number of players (2-20)');
        return;
    }
    
    // Collect player names
    const players = [];
    for (let i = 1; i <= playerCount; i++) {
        const input = document.getElementById(`player_${i}`);
        if (!input || !input.value.trim()) {
            alert(`Please enter a name for Player ${i}`);
            return;
        }
        players.push({
            id: `offline_player_${i}`,
            name: input.value.trim(),
            isHost: i === 1
        });
    }
    
    // Check for duplicate names
    const names = players.map(p => p.name.toLowerCase());
    if (new Set(names).size !== names.length) {
        alert('Please ensure all player names are unique');
        return;
    }
    
    // Store player data in sessionStorage
    sessionStorage.setItem('playerCount', playerCount.toString());
    sessionStorage.setItem('playerNames', JSON.stringify(players.map(p => p.name)));
    sessionStorage.setItem('playerData', JSON.stringify(players));
    sessionStorage.setItem('gameMode', 'offline');
    sessionStorage.setItem('offlineMode', 'true');
    
    // Ensure topics are loaded before starting game
    if (!window.loadQuestions) {
        console.error('Question loading system not available');
        alert('Question system not loaded. Please refresh the page and try again.');
        return;
    }
    
    // Load questions first, then navigate
    window.loadQuestions().then(() => {
        // Navigate to game page
        window.location.href = '../../pages/game.html';
    }).catch(error => {
        console.error('Failed to load questions:', error);
        alert('Failed to load questions. Please check your internet connection and try again.');
    });
}

// === OFFLINE EVENT LISTENERS ===
function initializeOfflineEventListeners() {
    // Player setup functionality
    const startButton = document.getElementById('startGame');
    if (startButton) {
        startButton.addEventListener('click', handleStartGame);
    }
    
    // New game button (on game page)
    const newGameBtn = document.getElementById('newGameBtn');
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
            sessionStorage.clear();
            window.location.href = '../../pages/index.html';
        });
    }
}

// === INITIALIZATION ===
function initializePlayerSetupSystem() {
    // Initialize offline event listeners
    initializeOfflineEventListeners();
    
    // Initialize player setup system
    initializePlayerSetup();
}

// Only initialize if we're NOT on the main index page (which uses offline/front-offline.js)
const isMainIndexPage = window.location.pathname.includes('index.html') || 
                       window.location.pathname.endsWith('/') || 
                       window.location.pathname === '/pages/';

if (!isMainIndexPage) {
    // Auto-initialize if DOM is already loaded, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePlayerSetupSystem);
    } else {
        initializePlayerSetupSystem();
    }
}