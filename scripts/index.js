// index.js - Front page functionality
// Handles player count selection, player setup, and game start

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

function showPlayerSetup(playerCount) {
    const playerSetupSection = document.getElementById('playerSetupSection');
    const playerNamesContainer = document.getElementById('playerNamesContainer');
    
    if (!playerSetupSection || !playerNamesContainer) return;
    
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
    playerSetupSection.style.display = 'block';
    
    // Focus on first input
    const firstInput = playerNamesContainer.querySelector('.player-name-input');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
}

function hidePlayerSetup() {
    const playerSetupSection = document.getElementById('playerSetupSection');
    if (playerSetupSection) {
        playerSetupSection.style.display = 'none';
    }
}

function updateStartButtonState() {
    const playerCountInput = document.getElementById('player_count');
    const playerNamesContainer = document.getElementById('playerNamesContainer');
    const startButton = document.getElementById('start-game-btn');
    
    if (!playerCountInput || !startButton) return;
    
    const selectedCount = parseInt(playerCountInput.value);
    
    if (!selectedCount || selectedCount < 2 || selectedCount > 20) {
        // No valid player count entered
        startButton.style.opacity = '0.5';
        startButton.style.pointerEvents = 'none';
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
            
            startButton.style.opacity = '1';
            startButton.style.pointerEvents = 'auto';
        } else {
            startButton.style.opacity = '0.5';
            startButton.style.pointerEvents = 'none';
        }
    } else {
        startButton.style.opacity = '0.5';
        startButton.style.pointerEvents = 'none';
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
    
    // Navigate to game page
    window.location.href = 'game.html';
}

// === INITIALIZATION ===
window.addEventListener('DOMContentLoaded', function() {
    // Handle front page functionality (player count selection)
    handleFrontPageFunctionality();
    
    // Initialize player setup system
    initializePlayerSetup();
});