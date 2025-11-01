// index.js - Offline functionality only
// All multiplayer functionality handled by multiplayer-manager.js

console.log('📄 Index offline functionality loading...');

// === OFFLINE MODE FUNCTIONALITY ===
let playerNames = [];

function startOfflineMode() {
    console.log('🔄 Starting offline mode...');
    
    // Clear any multiplayer data
    sessionStorage.removeItem('multiplayerRoom');
    sessionStorage.setItem('gameMode', 'offline');
    
    // Navigate to offline setup (fallback directory)
    window.location.href = 'fallback/front.html';
}

// === PLAYER SETUP SYSTEM (for offline fallback) ===
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

function initializePlayerSetup() {
    const playerCountInput = document.getElementById('player_count');
    const playerSetupSection = document.getElementById('playerSetupSection');
    const playerNamesContainer = document.getElementById('playerNamesContainer');
    
    if (!playerCountInput) return; // Not on a page with player setup
    
    playerCountInput.addEventListener('input', function(e) {
        const count = parseInt(e.target.value, 10);
        
        if (Number.isNaN(count) || count < 2 || count > 20) {
            if (playerSetupSection) playerSetupSection.classList.add('hidden');
            return;
        }
        
        // Show player setup section
        if (playerSetupSection) playerSetupSection.classList.remove('hidden');
        
        // Generate player name inputs
        if (playerNamesContainer) {
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
                
                playerDiv.appendChild(label);
                playerDiv.appendChild(input);
                playerNamesContainer.appendChild(playerDiv);
            }
        }
        
        // Update start button state
        playerNamesContainer.addEventListener('input', updateStartButtonState);
        updateStartButtonState();
    });
}

function updateStartButtonState() {
    const startButton = document.getElementById('startGame');
    const playerCount = parseInt(document.getElementById('player_count')?.value, 10);
    
    if (!startButton || Number.isNaN(playerCount) || playerCount < 2) {
        if (startButton) {
            startButton.disabled = true;
            startButton.textContent = 'Enter player details to start';
        }
        return;
    }
    
    // Check if all player names are filled
    let allFilled = true;
    for (let i = 1; i <= playerCount; i++) {
        const input = document.getElementById(`player_${i}`);
        if (!input || !input.value.trim()) {
            allFilled = false;
            break;
        }
    }
    
    startButton.disabled = !allFilled;
    startButton.textContent = allFilled ? 'Start Game' : 'Fill all player names to start';
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
        players.push(input.value.trim());
    }
    
    // Check for duplicate names
    const uniqueNames = new Set(players);
    if (uniqueNames.size !== players.length) {
        alert('Please ensure all player names are unique');
        return;
    }
    
    // Store player data in sessionStorage
    sessionStorage.setItem('playerCount', playerCount.toString());
    sessionStorage.setItem('playerNames', JSON.stringify(players));
    sessionStorage.setItem('gameMode', 'offline');
    
    console.log('Starting offline game with players:', players);
    
    // Navigate to game page
    window.location.href = 'game.html';
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
            window.location.href = 'index.html';
        });
    }
    
    // Additional offline-only buttons can be added here
}

// === INITIALIZATION (OFFLINE ONLY) ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Index offline functionality initialized');
    
    // Initialize offline event listeners
    initializeOfflineEventListeners();
    
    // Handle front page functionality (for offline fallback pages)
    handleFrontPageFunctionality();
    
    // Initialize player setup system
    initializePlayerSetup();
    
    console.log('✅ Offline functionality ready');
});