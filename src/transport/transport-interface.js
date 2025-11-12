// src/transport/transport-interface.js
// Unified transport interface that abstracts offline vs multiplayer modes
// Game modules interact with this interface instead of checking mode directly

/**
 * Transport Interface
 * Provides a unified API for game modules to communicate regardless of mode
 */

// === INTERFACE STATE ===
let currentHandler = null;
let isInitialized = false;

// === INTERFACE METHODS ===

/**
 * Initialize the transport layer
 * Detects the current mode and sets up the appropriate handler
 */
function initialize() {
    if (isInitialized) return;

    // Detect mode from sessionStorage
    const gameMode = sessionStorage.getItem('gameMode');
    const isOffline = gameMode === 'offline' || 
                     sessionStorage.getItem('offlineMode') === 'true';

    // Handler will be set by the actual handler modules when they load
    // We just mark as initialized
    isInitialized = true;
}

/**
 * Register a handler (called by offline-handler.js or multiplayer-handler.js)
 * @param {Object} handler - The handler object with required methods
 */
function registerHandler(handler) {
    console.log('📝 Attempting to register handler:', {
        hasHandler: !!handler,
        hasIsActive: !!(handler && handler.isActive),
        isActive: handler && handler.isActive ? handler.isActive() : false,
        mode: handler && handler.getMode ? handler.getMode() : 'unknown'
    });
    
    if (handler && handler.isActive) {
        const active = handler.isActive();
        console.log('  Handler isActive() returned:', active);
        
        if (active) {
            currentHandler = handler;
            console.log('✅ Handler registered successfully:', handler.getMode ? handler.getMode() : 'unknown');
        } else {
            console.log('❌ Handler NOT registered - isActive() returned false');
            console.log('  Checking why isActive is false...');
            if (handler.getMode) {
                console.log('    Handler mode:', handler.getMode());
            }
        }
    } else {
        console.log('❌ Handler NOT registered - missing handler or isActive method');
    }
}

/**
 * Check if transport layer is active and ready
 * @returns {boolean}
 */
function isActive() {
    return currentHandler && currentHandler.isActive ? currentHandler.isActive() : false;
}

/**
 * Broadcast a question to all players
 * @param {Object} question - The question object to broadcast
 */
function broadcastQuestion(question) {   
    if (currentHandler && currentHandler.broadcastQuestion) {
        currentHandler.broadcastQuestion(question);
    }
}

/**
 * Submit an answer
 * @param {string} answer - The answer value
 * @param {string} playerName - Name of the player submitting
 */
function submitAnswer(answer, playerName) {
    if (currentHandler && currentHandler.submitAnswer) {
        currentHandler.submitAnswer(answer, playerName);
    }
}

/**
 * Reveal all answers to players
 */
function revealAnswers() {
    if (currentHandler && currentHandler.revealAnswers) {
        currentHandler.revealAnswers();
    }
}

/**
 * Get current game mode
 * @returns {string} 'offline' or 'multiplayer'
 */
function getMode() {
    if (currentHandler && currentHandler.getMode) {
        return currentHandler.getMode();
    }
    return 'unknown';
}

/**
 * Check if currently in multiplayer mode
 * @returns {boolean}
 */
function isMultiplayer() {
    return getMode() === 'multiplayer' && isActive();
}

/**
 * Check if currently in offline mode
 * @returns {boolean}
 */
function isOffline() {
    return getMode() === 'offline';
}

/**
 * Initialize UI elements based on current mode
 * Shows/hides elements that are mode-specific
 */
function initializeModeUI() {
    let mode = getMode();
    
    // Fallback: if no handler registered yet, check sessionStorage
    if (mode === 'unknown') {
        const multiplayerRoom = sessionStorage.getItem('multiplayerRoom');
        const gameMode = sessionStorage.getItem('gameMode');
        
        if (multiplayerRoom) {
            mode = 'multiplayer';
        } else if (gameMode === 'offline') {
            mode = 'offline';
        }
    }
    
    // Elements that should only show in offline mode
    const offlineOnlyElements = [
        'offlineSubmitContainer',
        'offlinePlayerIndicator'
    ];
    
    // Elements that should only show in multiplayer mode
    const multiplayerOnlyElements = [
        'answerProgressContainer',
        'multiplayerInfo',
        'createRoomSection'
    ];
    
    if (mode === 'multiplayer') {
        // Hide offline elements
        offlineOnlyElements.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                elem.style.display = 'none';
                elem.classList.add('hidden');
            }
        });
        
        // Show multiplayer elements
        multiplayerOnlyElements.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                elem.style.display = '';
                elem.classList.remove('hidden');
            }
        });
    } else if (mode === 'offline') {
        // Show offline elements
        offlineOnlyElements.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                elem.style.display = '';
                elem.classList.remove('hidden');
            }
        });
        
        // Hide multiplayer elements
        multiplayerOnlyElements.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                elem.style.display = 'none';
                elem.classList.add('hidden');
            }
        });
    }
}

/**
 * Show results section
 * Hides the game interface and displays the results section
 * Delegates to the current handler to populate results
 * @param {Object} resultsData - Data to display in results (questions, submissions, stats)
 */
function showResults(resultsData) {
    // Hide the main game interface
    const gameContainer = document.getElementById('gameContainer');
    if (gameContainer) {
        gameContainer.style.display = 'none';
    }
    
    // Show results section
    const resultsSection = document.getElementById('gameResults');
    if (!resultsSection) {
        console.error('Results section not found');
        return;
    }
    
    resultsSection.classList.remove('hidden');
    
    // Delegate to current handler to populate results
    if (currentHandler && currentHandler.populateResults) {
        currentHandler.populateResults(resultsData);
    } else {
        console.warn('Current handler does not implement populateResults()');
    }
}

/**
 * Hide results section
 * Shows the game interface and hides the results section
 */
function hideResults() {
    // Hide results section
    const resultsSection = document.getElementById('gameResults');
    if (resultsSection) {
        resultsSection.classList.add('hidden');
    }
    
    // Show the main game interface again
    const gameContainer = document.getElementById('gameContainer');
    if (gameContainer) {
        gameContainer.style.display = '';
    }
}

// === EXPORTS ===
// Export as window object for compatibility with existing code
window.transport = {
    initialize,
    registerHandler,
    isActive,
    broadcastQuestion,
    submitAnswer,
    revealAnswers,
    getMode,
    isMultiplayer,
    isOffline,
    initializeModeUI,
    showResults,
    hideResults
};

// Auto-initialize on load
document.addEventListener('DOMContentLoaded', initialize);
