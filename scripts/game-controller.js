// game-controller.js - Main Game Controller and Initialization for Table Talk
// Coordinates all modules and handles main game initialization
console.log('🎮 Game Controller loaded');

// === MANUAL SAVE GAME ===
function initializeSaveGameButton() {
    const saveGameBtn = document.getElementById('saveGameBtn');
    if (!saveGameBtn) return;
    
    saveGameBtn.addEventListener('click', function() {
        if (window.gameSessionManager) {
            gameSessionManager.saveCurrentSession();
            
            // Show feedback to user
            const originalHTML = saveGameBtn.innerHTML;
            saveGameBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
            saveGameBtn.classList.add('success-state');
            
            // Reset button after 2 seconds
            setTimeout(() => {
                saveGameBtn.innerHTML = originalHTML;
                saveGameBtn.classList.remove('success-state');
            }, 2000);
            
            console.log('Game manually saved by user');
        } else {
            alert('Save system not available');
        }
    });
}

// === EVENT HANDLERS ===
function initializeGameEventHandlers() {
    // Submit button - delegates to game-interactions module
    const submitBtn = document.getElementById('submitButton');
    if (submitBtn && window.gameInteractions) {
        submitBtn.addEventListener('click', window.gameInteractions.submitAnswer);
    }
    
    // Final submit button - delegates to game-interactions module
    const finalBtn = document.getElementById('final_submit');
    if (finalBtn && window.gameInteractions) {
        finalBtn.addEventListener('click', window.gameInteractions.handleFinalSubmit);
    }
    
    // Topic pagination buttons - delegates to question-manager module
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    
    if (prevPageBtn && window.questionManager) {
        prevPageBtn.addEventListener('click', () => window.questionManager.changePage('prev'));
    }
    if (nextPageBtn && window.questionManager) {
        nextPageBtn.addEventListener('click', () => window.questionManager.changePage('next'));
    }
    
    // Switch question button - delegates to question-manager module
    const switchBtn = document.getElementById('switchQuestion');
    if (switchBtn && window.questionManager) {
        switchBtn.addEventListener('click', window.questionManager.switchToNextQuestion);
    }
}

// === MODULE COORDINATION ===
function waitForModules() {
    return new Promise((resolve) => {
        const checkModules = () => {
            // Check if all required modules are loaded
            if (window.questionManager && 
                window.gameInteractions && 
                window.playerTurns && 
                window.loadQuestions) {
                resolve();
            } else {
                // Check again in 50ms
                setTimeout(checkModules, 50);
            }
        };
        checkModules();
    });
}

// === INITIALIZATION ===
window.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Game Controller: DOM loaded, waiting for modules...');
    
    // Wait for all modules to be loaded
    await waitForModules();
    
    console.log('✅ All modules loaded, initializing game...');
    
    // Wait for theme-utilities.js to load data, then initialize game
    if (window.loadQuestions) {
        window.loadQuestions().then(() => {
            // Always start with the default topic (instructions) on page load
            window.currentTopic = 'default';
            
            if (window.questionManager) {
                window.questionManager.applyQuestionsForTopic('default');
            }
            
            // Initialize topic display
            const topicNameElement = document.getElementById('currentTopicName');
            if (topicNameElement) {
                topicNameElement.textContent = 'Instructions';
            }
            
            // Initialize modules in proper order
            if (window.questionManager) {
                window.questionManager.initializeTopicSelection();
            }
            
            // Ensure submission state reflects any configured player count on initial load
            if (window.gameInteractions) {
                window.gameInteractions.updateSubmissionState();
            }
            
            // Initialize player turn system for game page
            if (window.playerTurns) {
                window.playerTurns.initializePlayerTurnSystem();
            }
            
            // Initialize event handlers
            initializeGameEventHandlers();
            
            // Initialize manual save game button
            initializeSaveGameButton();
            
            // Save initial game session state and enable auto-save
            if (window.gameSessionManager) {
                gameSessionManager.saveCurrentSession();
                gameSessionManager.enableAutoSave(2); // Auto-save every 2 minutes
                console.log('Game initialized - session saved and auto-save enabled');
            }
            
            console.log('🎉 Game fully initialized and ready!');
        }).catch(error => {
            console.error('❌ Failed to load questions:', error);
        });
    } else {
        console.warn('⚠️ loadQuestions not available, game may not function properly');
    }
});

// === GLOBAL EXPORTS ===
if (typeof window !== 'undefined') {
    window.gameController = {
        initializeSaveGameButton: initializeSaveGameButton,
        initializeGameEventHandlers: initializeGameEventHandlers,
        waitForModules: waitForModules
    };
    
    // Keep legacy functions for any external dependencies
    window.initializeSaveGameButton = initializeSaveGameButton;
    window.initializeGameEventHandlers = initializeGameEventHandlers;
}