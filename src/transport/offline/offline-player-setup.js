// src/transport/offline/offline-player-setup.js - Player setup and game initialization
import { generatePlayerInputs as sharedGeneratePlayerInputs, updateStartButtonState as sharedUpdateStartButtonState } from '../../utilities/player-setup-utils.js';
import { CONFIG_UTILS } from '../../config/game-config.js';

/**
 * Generate player input fields based on selected player count
 * @param {string|number} selectedValue - The number of players
 */
export function generatePlayerInputs(selectedValue) {
    const count = typeof selectedValue === 'string' ? parseInt(selectedValue, 10) : Number(selectedValue);
    const playerNamesStep = document.getElementById('playerNamesStep');
    const playerNamesContainer = document.getElementById('playerNamesContainer');
    
    if (isNaN(count) || count < 2 || count > 20) {
        if (playerNamesStep) playerNamesStep.classList.add('hidden');
        return;
    }
    
    if (playerNamesStep) playerNamesStep.classList.remove('hidden');
    
    if (playerNamesContainer) {
        if (typeof sharedGeneratePlayerInputs === 'function') {
            sharedGeneratePlayerInputs(playerNamesContainer, count, updateOfflineStartButton);
        } else {
            // Fallback implementation
            playerNamesContainer.innerHTML = '';
            for (let i = 1; i <= count; i++) {
                const playerDiv = document.createElement('div');
                playerDiv.className = 'player-input-group';
                
                const label = document.createElement('label');
                label.textContent = `Player ${i}:`;
                label.htmlFor = `player_${i}`;
                
                const input = document.createElement('input');
                input.type = 'text';
                input.id = `player_${i}`;
                input.name = `player_${i}`;
                input.placeholder = `Enter name for Player ${i}`;
                input.required = true;
                input.addEventListener('input', updateOfflineStartButton);
                
                playerDiv.appendChild(label);
                playerDiv.appendChild(input);
                playerNamesContainer.appendChild(playerDiv);
            }
        }
    }
    
    updateOfflineStartButton();
}

/**
 * Update the start button state based on player name validation
 */
export function updateOfflineStartButton() {
    const startBtn = document.getElementById('startGame');
    if (!startBtn) return;
    
    const inputs = document.querySelectorAll('#playerNamesContainer input');
    const names = Array.from(inputs).map(i => i.value || '');
    
    if (typeof sharedUpdateStartButtonState === 'function') {
        sharedUpdateStartButtonState(startBtn, names);
        if (startBtn.disabled) startBtn.classList.add('disabled');
        else startBtn.classList.remove('disabled');
        return;
    }
    
    // Fallback validation
    const allFilled = names.every(n => n && n.trim() !== '');
    const lower = names.map(n => (n || '').trim().toLowerCase());
    const hasDuplicates = new Set(lower).size !== lower.length;
    
    if (!allFilled) {
        startBtn.disabled = true;
        startBtn.classList.add('disabled');
        const span = startBtn.querySelector('span');
        if (span) span.textContent = 'Fill all player names to start';
    } else if (hasDuplicates) {
        startBtn.disabled = true;
        startBtn.classList.add('disabled');
        const span = startBtn.querySelector('span');
        if (span) span.textContent = 'Player names must be unique';
    } else {
        startBtn.disabled = false;
        startBtn.classList.remove('disabled');
        const span = startBtn.querySelector('span');
        if (span) span.textContent = 'Start Game';
    }
}

/**
 * Start an offline game with the configured players
 */
export function startOfflineGame() {
    const playerInputs = document.querySelectorAll('#playerNamesContainer input');
    
    if (!playerInputs || playerInputs.length === 0) {
        alert('Please select number of players first');
        return;
    }
    
    const players = Array.from(playerInputs).map((input, index) => ({
        id: `offline_player_${index + 1}`,
        name: (input.value || '').trim(),
        isHost: index === 0
    }));
    
    const names = players.map(p => p.name.toLowerCase());
    if (names.some(n => !n) || new Set(names).size !== names.length) {
        alert('Please ensure all player names are unique and filled');
        return;
    }
    
    if (typeof window.loadQuestions !== 'function') {
        console.error('Question loading system not available');
        alert('Question system not loaded. Please refresh the page and try again.');
        return;
    }
    
    window.loadQuestions().then(() => {
        CONFIG_UTILS.setStorageItem('GAME_MODE', 'offline');
        CONFIG_UTILS.setStorageItem('PLAYER_NAMES', JSON.stringify(players.map(p => p.name)));
        CONFIG_UTILS.setStorageItem('PLAYER_DATA', JSON.stringify(players));
        CONFIG_UTILS.setStorageItem('PLAYER_COUNT', players.length.toString());
        
        // Clear any previously selected topic for fresh game
        localStorage.removeItem('currentTopic');
        
        window.location.href = '/pages/game.html';
    }).catch(err => {
        console.error('Failed to load questions:', err);
        alert('Failed to load questions. Please check your connection and try again.');
    });
}

/**
 * Set up event listeners for offline mode
 */
export function setupOfflineEventListeners() {
    // Set up start button click handler
    const startButton = document.getElementById('startGame');
    if (startButton && !startButton._offlineWired) {
        startButton.addEventListener('click', startOfflineGame);
        startButton._offlineWired = true;
    }
    
    // Set up player count input handler
    const playerCountInput = document.getElementById('player_count');
    if (playerCountInput && !playerCountInput._offlineWired) {
        playerCountInput.addEventListener('input', function(e) {
            generatePlayerInputs(e.target.value);
        });
        playerCountInput._offlineWired = true;
    }
    
    // Add input event listeners for real-time validation
    document.addEventListener('input', function(e) {
        if (e.target.matches('#playerNamesContainer input')) {
            updateOfflineStartButton();
        }
    });
}
