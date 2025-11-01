// player-setup.js - Enhanced player setup functionality for fallback system
// Moved from main index.js since it's primarily used in offline mode

let playerNames = [];

// === PLAYER SETUP SYSTEM ===
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
    console.log('🔧 initializePlayerSetup() called');
    const playerCountInput = document.getElementById('player_count');
    const playerNamesStep = document.getElementById('playerNamesStep');
    const playerNamesContainer = document.getElementById('playerNamesContainer');
    
    console.log('Elements found:', {
        playerCountInput: !!playerCountInput,
        playerNamesStep: !!playerNamesStep,
        playerNamesContainer: !!playerNamesContainer
    });
    
    if (!playerCountInput) {
        console.log('❌ No player_count element found - exiting');
        return; // Not on a page with player setup
    }
    
    console.log('📝 Adding change event listener to player count dropdown');
    
    playerCountInput.addEventListener('change', function(e) {
        console.log('🎯 Dropdown changed! Selected value:', e.target.value);
        const count = parseInt(e.target.value, 10);
        console.log('Parsed count:', count);
        
        // Store in session storage
        if (!Number.isNaN(count) && count >= 2 && count <= 20) {
            sessionStorage.setItem('playerCount', String(count));
        } else {
            sessionStorage.removeItem('playerCount');
        }
        
        if (Number.isNaN(count) || count < 2 || count > 20) {
            console.log('❌ Invalid count, hiding step');
            if (playerNamesStep) playerNamesStep.classList.add('hidden');
            return;
        }
        
        console.log('✅ Valid count, showing player names step');
        // Show player names step
        if (playerNamesStep) {
            playerNamesStep.classList.remove('hidden');
            console.log('Step 2 should now be visible');
        } else {
            console.log('❌ playerNamesStep element not found!');
        }
        
        // Generate player name inputs
        if (playerNamesContainer) {
            playerNamesContainer.innerHTML = '';
            
            for (let i = 1; i <= count; i++) {
                const playerDiv = document.createElement('div');
                playerDiv.className = 'player-name-input';
                
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
        updateStartButtonState();
        
        // Add input listeners for real-time validation
        const inputs = playerNamesContainer.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', updateStartButtonState);
        });
    });
    
    // Restore stored value if available
    const stored = parseInt(sessionStorage.getItem('playerCount'), 10);
    if (!Number.isNaN(stored) && stored >= 2 && stored <= 20) {
        playerCountInput.value = String(stored);
        // Trigger the change event to show player setup if there's a stored value
        playerCountInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
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
    const names = [];
    
    for (let i = 1; i <= playerCount; i++) {
        const input = document.getElementById(`player_${i}`);
        if (!input || !input.value.trim()) {
            allFilled = false;
            break;
        }
        names.push(input.value.trim().toLowerCase());
    }
    
    // Check for duplicates
    const uniqueNames = new Set(names);
    const hasDuplicates = uniqueNames.size !== names.length;
    
    startButton.disabled = !allFilled || hasDuplicates;
    
    if (hasDuplicates) {
        startButton.textContent = 'Player names must be unique';
    } else {
        startButton.textContent = allFilled ? 'Start Offline Game' : 'Fill all player names to start';
    }
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
    
    console.log('Starting offline game with players:', players);
    
    // Ensure topics are loaded before starting game
    if (!window.loadQuestions) {
        console.error('Question loading system not available');
        alert('Question system not loaded. Please refresh the page and try again.');
        return;
    }
    
    // Load questions first, then navigate
    window.loadQuestions().then(() => {
        console.log('Questions loaded successfully for offline mode');
        // Navigate to game page
        window.location.href = '../game.html';
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
            window.location.href = '../index.html';
        });
    }
}

// === INITIALIZATION ===
function initializePlayerSetupSystem() {
    console.log('📄 Player setup system loading...');
    console.log('Current page URL:', window.location.href);
    console.log('Document ready state:', document.readyState);
    
    // Initialize offline event listeners
    initializeOfflineEventListeners();
    
    // Handle front page functionality (for offline fallback pages)
    // Note: handleFrontPageFunctionality() merged into initializePlayerSetup()
    
    // Initialize player setup system
    initializePlayerSetup();
    
    console.log('✅ Player setup system ready');
}

console.log('🚀 player-setup.js script loaded!');
console.log('Document ready state at script load:', document.readyState);

// Auto-initialize if DOM is already loaded, otherwise wait
if (document.readyState === 'loading') {
    console.log('⏳ DOM still loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', initializePlayerSetupSystem);
} else {
    console.log('✅ DOM already loaded, initializing immediately');
    initializePlayerSetupSystem();
}