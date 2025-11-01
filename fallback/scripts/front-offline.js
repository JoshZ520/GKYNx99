let playerNames = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log('Fallback front page loaded');
    
    // Player setup is now handled by player-setup.js
    // initializePlayerSetup(); // Disabled - conflicts with player-setup.js
    // updateStartButtonState(); // Disabled - handled by player-setup.js
});

// DEPRECATED: This function conflicts with player-setup.js
// Player setup functionality is now handled by player-setup.js
function initializePlayerSetup_DISABLED() {
    const playerCountInput = document.getElementById('player_count');
    const playerSetupSection = document.getElementById('playerSetupSection');
    const playerNamesContainer = document.getElementById('playerNamesContainer');
    
    if (!playerCountInput) return;
    
    playerCountInput.addEventListener('change', function(e) {
        const count = parseInt(e.target.value, 10);
        
        if (Number.isNaN(count) || count < 2 || count > 10) {
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
                playerDiv.style.marginBottom = '10px';
                
                const label = document.createElement('label');
                label.textContent = `Player ${i}:`;
                label.htmlFor = `player_${i}`;
                label.style.display = 'block';
                label.style.marginBottom = '5px';
                
                const input = document.createElement('input');
                input.type = 'text';
                input.id = `player_${i}`;
                input.name = `player_${i}`;
                input.placeholder = `Enter name for Player ${i}`;
                input.required = true;
                input.style.width = '100%';
                input.style.padding = '8px';
                input.style.border = '1px solid #ddd';
                input.style.borderRadius = '4px';
                
                playerDiv.appendChild(label);
                playerDiv.appendChild(input);
                playerNamesContainer.appendChild(playerDiv);
            }
        }
        
        // Update start button state
        updateStartButtonState();
        
        // Add input listeners
        const inputs = playerNamesContainer.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', updateStartButtonState);
        });
    });
}

function updateStartButtonState() {
    const startButton = document.getElementById('startGame');
    if (!startButton) return;
    
    const playerInputs = document.querySelectorAll('#playerNamesContainer input');
    
    if (playerInputs.length === 0) {
        startButton.disabled = true;
        startButton.textContent = 'Select number of players first';
        return;
    }
    
    // Check if all player names are filled
    const allFilled = Array.from(playerInputs).every(input => 
        input.value && input.value.trim() !== ''
    );
    
    // Check for duplicates
    const names = Array.from(playerInputs).map(input => input.value.trim().toLowerCase());
    const uniqueNames = new Set(names.filter(name => name !== ''));
    const hasDuplicates = uniqueNames.size !== names.filter(name => name !== '').length;
    
    startButton.disabled = !allFilled || hasDuplicates;
    
    if (hasDuplicates) {
        startButton.textContent = 'Player names must be unique';
    } else {
        startButton.textContent = allFilled ? 'Start Offline Game' : 'Fill all player names to start';
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
        window.location.href = '../game.html';
    }).catch(error => {
        console.error('Failed to load questions:', error);
        alert('Failed to load questions. Please check your internet connection and try again.');
    });
}

// Set up start button click handler
document.addEventListener('DOMContentLoaded', function() {
    const startButton = document.getElementById('startGame');
    if (startButton) {
        startButton.addEventListener('click', startOfflineGame);
    }
});