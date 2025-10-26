// index.js - Front page functionality
// Handles player count selection, player setup, and game start

// === PLAYER SETUP SYSTEM ===
let playerNames = [];

// Handle player count selection and storage
function handleFrontPageFunctionality() {
    const select = document.getElementById('player_count');
    if (!select) return; // Not on front page
    
    // When the selection changes, store the value as an integer in sessionStorage
    select.addEventListener('change', function (e) {
        const rawValue = e.target.value;
        const val = parseInt(rawValue, 10);
        if (!Number.isNaN(val) && val > 0) {
            sessionStorage.setItem('playerCount', String(val));
        } else {
            sessionStorage.removeItem('playerCount');
        }
    });

    // If the user navigates to this page and then back, pre-select the stored value
    const stored = parseInt(sessionStorage.getItem('playerCount'), 10);
    if (!Number.isNaN(stored) && stored > 0) {
        const opt = Array.from(select.options).find(o => parseInt(o.value, 10) === stored);
        if (opt) select.value = String(stored);
    }
}

// Function to load and display the front page instruction
function loadFrontPageInstruction() {
    const instructionElement = document.getElementById('front-instruction');
    if (!instructionElement) return; // Not on front page
    
    fetch('files/topics/default.json')
        .then(res => {
            if (!res.ok) throw new Error('Failed to load default.json');
            return res.json();
        })
        .then(data => {
            if (data.questions && data.questions.length > 0) {
                // Use the first question as the front page instruction
                const frontInstruction = data.questions[0];
                instructionElement.textContent = frontInstruction;
            }
        })
        .catch(err => {
            console.warn('Could not load front page instruction:', err);
        });
}

function initializePlayerSetup() {
    const playerCountSelect = document.getElementById('player_count');
    const playerSetupSection = document.getElementById('playerSetupSection');
    const playerNamesContainer = document.getElementById('playerNamesContainer');
    
    if (!playerCountSelect || !playerSetupSection || !playerNamesContainer) return;
    
    playerCountSelect.addEventListener('change', function(e) {
        const playerCount = parseInt(e.target.value);
        
        if (playerCount && playerCount > 0) {
            showPlayerSetup(playerCount);
            updateStartButtonState();
        } else {
            hidePlayerSetup();
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
    const playerCountSelect = document.getElementById('player_count');
    const playerNamesContainer = document.getElementById('playerNamesContainer');
    const startButton = document.getElementById('start-game-btn');
    
    if (!playerCountSelect || !startButton) return;
    
    const selectedCount = parseInt(playerCountSelect.value);
    
    if (!selectedCount) {
        // No player count selected
        startButton.style.opacity = '0.5';
        startButton.style.pointerEvents = 'none';
        return;
    }
    
    if (selectedCount > 1 && playerNamesContainer) {
        // Check if all player names are filled
        const nameInputs = playerNamesContainer.querySelectorAll('.player-name-input');
        const allNamesFilled = Array.from(nameInputs).every(input => input.value.trim() !== '');
        
        if (allNamesFilled) {
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
        // Single player or no setup needed
        startButton.style.opacity = '1';
        startButton.style.pointerEvents = 'auto';
    }
    
    // Add click handler if not already added
    if (!startButton.hasAttribute('data-handler-added')) {
        startButton.addEventListener('click', handleStartGame);
        startButton.setAttribute('data-handler-added', 'true');
    }
}

function handleStartGame(e) {
    e.preventDefault();
    
    const playerCountSelect = document.getElementById('player_count');
    const selectedCount = parseInt(playerCountSelect.value);
    
    if (!selectedCount) {
        alert('Please select the number of players first.');
        return;
    }
    
    // Store player count in sessionStorage
    sessionStorage.setItem('playerCount', selectedCount.toString());
    
    if (selectedCount > 1) {
        const playerNamesContainer = document.getElementById('playerNamesContainer');
        const nameInputs = playerNamesContainer.querySelectorAll('.player-name-input');
        const allNamesFilled = Array.from(nameInputs).every(input => input.value.trim() !== '');
        
        if (!allNamesFilled) {
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
    
    // Load front page instruction
    loadFrontPageInstruction();
    
    // Initialize player setup system
    initializePlayerSetup();
});