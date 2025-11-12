// src/transport/offline-handler.js - Offline mode coordinator
// Main coordinator that imports and orchestrates all offline modules

import {
    generatePlayerInputs,
    updateOfflineStartButton,
    startOfflineGame,
    setupOfflineEventListeners
} from './offline/offline-player-setup.js';

import {
    displayQuestionOptionsOffline,
    selectAnswerOffline,
    updateSubmitButtonOffline,
    getSelectedAnswerOffline,
    submitOfflineAnswer
} from './offline/offline-game-handler.js';

import {
    populateResults
} from './offline/offline-results.js';

import {
    loadOfflineHtmlElements,
    loadOfflineIndexHtmlElements,
    initOfflineAutoLoad
} from './offline/offline-html-loader.js';

// === DOM INITIALIZATION ===
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're in offline mode or on the main page
    if (document.getElementById('offlineSetupSection') || document.getElementById('playerCountStep')) {
        setupOfflineEventListeners();
    }
});

// === GLOBAL WINDOW ATTACHMENT ===
function attachToWindow() {
    if (typeof window === 'undefined') return;
    
    // Player setup functions
    window.generatePlayerInputs = generatePlayerInputs;
    window.updateOfflineStartButton = updateOfflineStartButton;
    window.startOfflineGame = startOfflineGame;
    
    // Game handler functions
    window.displayQuestionOptionsOffline = displayQuestionOptionsOffline;
    window.selectAnswerOffline = selectAnswerOffline;
    window.updateSubmitButtonOffline = updateSubmitButtonOffline;
    window.getSelectedAnswerOffline = getSelectedAnswerOffline;
    window.submitOfflineAnswer = submitOfflineAnswer;
    
    // HTML loader functions
    window.loadOfflineHtmlElements = loadOfflineHtmlElements;
    window.loadOfflineIndexHtmlElements = loadOfflineIndexHtmlElements;
    
    // Wire index start button
    function wireIndexStartButton() {
        try {
            const btn = document.getElementById('startGame');
            if (btn && !btn._offlineWired) {
                btn.addEventListener('click', startOfflineGame);
                btn._offlineWired = true;
            }
        } catch (e) {
            console.error('Failed to wire offline start button:', e);
        }
    }
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', wireIndexStartButton);
        } else {
            wireIndexStartButton();
        }
    }
}

// === OFFLINE MODE CHECKER ===
window.checkOfflineMode = function checkOfflineMode() {
    try {
        const isOffline = sessionStorage.getItem('gameMode') === 'offline' || sessionStorage.getItem('offlineMode') === 'true';
        if (!isOffline) return;
        
        if (window.gameUI) {
            window.gameUI.displayQuestionOptions = displayQuestionOptionsOffline;
            window.gameUI.selectPreference = function(choice) {
                if (choice === 'option1' || choice === 'option2') {
                    const labelElem = document.getElementById(choice === 'option1' ? 'option1Label' : 'option2Label');
                    const text = labelElem ? labelElem.textContent : null;
                    if (text) return selectAnswerOffline(text, document.querySelector(`.preference-option:contains("${text}")`));
                }
                return selectAnswerOffline(choice, null);
            };
        }
    } catch (e) {
        console.error('checkOfflineMode failed:', e);
    }
};

// === TRANSPORT INTERFACE IMPLEMENTATION ===
/**
 * Offline handler implementation of the transport interface
 * Registers itself with the transport layer
 */
const offlineTransportHandler = {
    /**
     * Check if offline mode is active
     */
    isActive() {
        const gameMode = sessionStorage.getItem('gameMode');
        return gameMode === 'offline' || sessionStorage.getItem('offlineMode') === 'true';
    },

    /**
     * Get current mode
     */
    getMode() {
        return 'offline';
    },

    /**
     * Broadcast question - in offline mode, this is a no-op since there's no network
     * The question is already displayed locally
     */
    broadcastQuestion(question) {
        // No-op for offline mode - question is already shown locally
    },

    /**
     * Submit answer - offline mode handles this through local state
     */
    submitAnswer(answer, playerName) {
        // Offline submission is handled by the existing offline logic
        // This is just for interface compatibility
    },

    /**
     * Reveal answers - in offline mode, answers are revealed immediately
     */
    revealAnswers() {
        // No-op for offline mode - results shown immediately after submission
    },

    /**
     * Populate results section with offline game data
     * Delegates to the results module
     */
    populateResults(resultsData) {
        populateResults(resultsData);
    }
};

// Make handler available globally for registration
window.offlineTransportHandler = offlineTransportHandler;

// Register with transport interface when available
if (window.transport) {
    window.transport.registerHandler(offlineTransportHandler);
    // Initialize UI for the current mode
    window.transport.initializeModeUI();
} else {
    // If transport not loaded yet, register on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        if (window.transport) {
            window.transport.registerHandler(offlineTransportHandler);
            // Initialize UI for the current mode
            window.transport.initializeModeUI();
        }
    });
}

// Call initialization functions when module loads
attachToWindow();
initOfflineAutoLoad();

// Export for module imports
export { attachToWindow, initOfflineAutoLoad, offlineTransportHandler };