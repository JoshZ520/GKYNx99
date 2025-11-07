let playerNames = [];

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
    
    // Show step 2
    if (playerNamesStep) {
        playerNamesStep.classList.remove('hidden');
    }
    
    // Generate player inputs
    if (playerNamesContainer) {
        playerNamesContainer.innerHTML = '';
        
        for (let i = 1; i <= count; i++) {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-input-group';  // Updated to match CSS class
            
            const label = document.createElement('label');
            label.textContent = `Player ${i}:`;
            label.htmlFor = `player_${i}`;
            
            const input = document.createElement('input');
            input.type = 'text';
            input.id = `player_${i}`;
            input.name = `player_${i}`;
            input.placeholder = `Enter name for Player ${i}`;
            input.required = true;
            
            playerDiv.appendChild(label);
            playerDiv.appendChild(input);
            playerNamesContainer.appendChild(playerDiv);
        }
        
        // Update start button
        updateOfflineStartButton();
    }
}

// Remove the duplicate initializePlayerSetup function since player-setup.js handles this

function updateOfflineStartButton() {
    const startBtn = document.getElementById('startGame');
    const inputs = document.querySelectorAll('#playerNamesContainer input');
    
    if (!startBtn) return;
    
    if (inputs.length === 0) {
        startBtn.disabled = true;
        startBtn.classList.add('disabled');
        startBtn.querySelector('span').textContent = 'Enter number of players first';
        return;
    }
    
    // Check if all player names are filled
    const allFilled = Array.from(inputs).every(input => input.value.trim().length > 0);
    
    // Check for duplicates
    const names = Array.from(inputs).map(input => input.value.trim().toLowerCase());
    const uniqueNames = new Set(names.filter(name => name !== ''));
    const hasDuplicates = uniqueNames.size !== names.filter(name => name !== '').length;
    
    if (startBtn) {
        if (hasDuplicates) {
            startBtn.disabled = true;
            startBtn.classList.add('disabled');
            startBtn.querySelector('span').textContent = 'Player names must be unique';
        } else if (allFilled && inputs.length > 0) {
            startBtn.disabled = false;
            startBtn.classList.remove('disabled');
            startBtn.querySelector('span').textContent = 'Start Offline Game';
        } else {
            startBtn.disabled = true;
            startBtn.classList.add('disabled');
            startBtn.querySelector('span').textContent = 'Fill all player names to start';
        }
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