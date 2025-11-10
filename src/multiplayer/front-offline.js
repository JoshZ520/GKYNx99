import { generatePlayerInputs as sharedGeneratePlayerInputs, updateStartButtonState as sharedUpdateStartButtonState } from '../../scripts/player-setup-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Front-offline.js loaded');
    // Only initialize if we're in offline mode or on the main page
    if (document.getElementById('offlineSetupSection') || document.getElementById('playerCountStep')) {
        setupOfflineEventListeners();
    }
});

// Active player setup functionality - combines HTML script + this file
function generatePlayerInputs(selectedValue) {
    console.log('generatePlayerInputs called with:', selectedValue);
    const count = parseInt(selectedValue, 10);
    const playerNamesStep = document.getElementById('playerNamesStep');
    const playerNamesContainer = document.getElementById('playerNamesContainer');
    if (isNaN(count) || count < 2 || count > 20) {
        if (playerNamesStep) playerNamesStep.classList.add('hidden');
        return;
    }
    if (playerNamesStep) playerNamesStep.classList.remove('hidden');
    if (playerNamesContainer) {
        sharedGeneratePlayerInputs(playerNamesContainer, count, updateOfflineStartButton);
    }
    updateOfflineStartButton();
}

// Remove the duplicate initializePlayerSetup function since player-setup.js handles this

function updateOfflineStartButton() {
    const startBtn = document.getElementById('startGame');
    const inputs = document.querySelectorAll('#playerNamesContainer input');
    if (!startBtn) return;
    const names = Array.from(inputs).map(input => input.value);
    sharedUpdateStartButtonState(startBtn, names);
    // Optionally update the button label span if you use a <span> inside the button
    if (startBtn.querySelector('span')) {
        startBtn.querySelector('span').textContent = startBtn.textContent;
    }
}

function startOfflineGame() {
    const playerInputs = document.querySelectorAll('#playerNamesContainer input');
    
    if (playerInputs.length === 0) {
        alert('Please select number of players first');
        return;
    }
    
    // Collect player names
    const players = Array.from(playerInputs).map((input, index) => ({
        id: `offline_player_${index + 1}`,
        name: input.value.trim(),
        isHost: index === 0
    }));
    
    // Check for empty names or duplicates
    const names = players.map(p => p.name.toLowerCase());
    if (names.some(name => !name) || new Set(names).size !== names.length) {
        alert('Please ensure all player names are unique and filled');
        return;
    }
    
    // Ensure topics are loaded before starting game
    if (!window.loadQuestions) {
        console.error('Question loading system not available');
        alert('Question system not loaded. Please refresh the page and try again.');
        return;
    }
    
    // Load questions first, then start game
    window.loadQuestions().then(() => {
        console.log('Questions loaded successfully for offline mode');
        
        // Store in session storage
        sessionStorage.setItem('gameMode', 'offline');
        sessionStorage.setItem('offlineMode', 'true');
        sessionStorage.setItem('playerNames', JSON.stringify(players.map(p => p.name)));
        sessionStorage.setItem('playerData', JSON.stringify(players));
        sessionStorage.setItem('playerCount', players.length);
        
        // Navigate to game
        window.location.href = '../pages/game.html';
    }).catch(error => {
        console.error('Failed to load questions:', error);
        alert('Failed to load questions. Please check your internet connection and try again.');
    });
}

function setupOfflineEventListeners() {
    // Set up start button click handler
    const startButton = document.getElementById('startGame');
    if (startButton) {
        startButton.addEventListener('click', startOfflineGame);
    }
    
    // Add input event listeners for real-time validation
    document.addEventListener('input', function(e) {
        if (e.target.matches('#playerNamesContainer input')) {
            updateOfflineStartButton();
        }
    });
}

// Make generatePlayerInputs available globally for HTML oninput attribute
window.generatePlayerInputs = generatePlayerInputs;