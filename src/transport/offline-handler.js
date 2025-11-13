// Offline mode coordinator
import {
    generatePlayerInputs,
    updateOfflineStartButton,
    startOfflineGame,
    setupOfflineEventListeners
} from './offline/player-setup.js';

import {
    displayQuestionOptionsOffline,
    selectAnswerOffline,
    updateSubmitButtonOffline,
    getSelectedAnswerOffline,
    submitOfflineAnswer
} from './offline/game-handler.js';

import {
    populateResults
} from './offline/results.js';

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('offlineSetupSection') || document.getElementById('playerCountStep')) {
        setupOfflineEventListeners();
    }
});

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
    
    wireOfflineFunctions();
}

function wireOfflineFunctions() {
    if (sessionStorage.getItem('gameMode') !== 'offline') return;
    
    if (!window.displayQuestionOptionsOffline) {
        setTimeout(wireOfflineFunctions, 50);
        return;
    }
    
    window.displayQuestionOptions = window.displayQuestionOptionsOffline;
    window.selectPreference = window.selectAnswerOffline;
    window.updateSubmitButton = window.updateSubmitButtonOffline;
}

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

window.checkOfflineMode = function checkOfflineMode() {
    try {
        const isOffline = sessionStorage.getItem('gameMode') === 'offline';
        if (!isOffline) return;
        
        if (window.transport && window.transport.initializeModeUI) {
            window.transport.initializeModeUI();
        }
        
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

const offlineTransportHandler = {
    isActive() {
        const gameMode = sessionStorage.getItem('gameMode');
        return gameMode === 'offline';
    },

    getMode() {
        return 'offline';
    },

    broadcastQuestion(question) {
    },

    submitAnswer(answer, playerName) {
    },

    revealAnswers() {
    },

    populateResults(resultsData) {
        populateResults(resultsData);
    }
};

// Make handler available globally for registration
window.offlineTransportHandler = offlineTransportHandler;

// Register with transport interface when available
function registerOfflineHandler() {
    if (window.transport) {
        window.transport.registerHandler(offlineTransportHandler);
        // Initialize UI for the current mode - force it after a short delay to ensure DOM is ready
        setTimeout(() => {
            if (window.transport.initializeModeUI) {
                window.transport.initializeModeUI();
            }
        }, 100);
    }
}

if (window.transport) {
    registerOfflineHandler();
} else {
    document.addEventListener('DOMContentLoaded', registerOfflineHandler);
    setTimeout(registerOfflineHandler, 200);
}

attachToWindow();

export { attachToWindow, offlineTransportHandler };