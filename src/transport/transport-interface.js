let currentHandler = null;
let isInitialized = false;

function initialize() {
    if (isInitialized) return;

    const gameMode = sessionStorage.getItem('gameMode');
    const isOffline = gameMode === 'offline' || 
                     sessionStorage.getItem('offlineMode') === 'true';

    isInitialized = true;
}

function registerHandler(handler) {
    if (handler && handler.isActive && handler.isActive()) {
        currentHandler = handler;
    }
}

function isActive() {
    return currentHandler && currentHandler.isActive ? currentHandler.isActive() : false;
}

function broadcastQuestion(question) {
    if (currentHandler && currentHandler.broadcastQuestion) {
        currentHandler.broadcastQuestion(question);
    }
}

function submitAnswer(answer, playerName) {
    if (currentHandler && currentHandler.submitAnswer) {
        currentHandler.submitAnswer(answer, playerName);
    }
}

function revealAnswers() {
    if (currentHandler && currentHandler.revealAnswers) {
        currentHandler.revealAnswers();
    }
}

function getMode() {
    if (currentHandler && currentHandler.getMode) {
        return currentHandler.getMode();
    }
    return 'unknown';
}

function isMultiplayer() {
    return getMode() === 'multiplayer' && isActive();
}

function isOffline() {
    return getMode() === 'offline';
}

function initializeModeUI() {
    let mode = getMode();
    
    if (mode === 'unknown') {
        const multiplayerRoom = sessionStorage.getItem('multiplayerRoom');
        const gameMode = sessionStorage.getItem('gameMode');
        
        if (multiplayerRoom) {
            mode = 'multiplayer';
        } else if (gameMode === 'offline') {
            mode = 'offline';
        }
    }
    
    const offlineOnlyElements = [
        'offlineSubmitContainer',
        'offlinePlayerIndicator'
    ];
    
    const multiplayerOnlyElements = [
        'answerProgressContainer',
        'multiplayerInfo',
        'createRoomSection'
    ];
    
    if (mode === 'multiplayer') {
        offlineOnlyElements.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                elem.style.display = 'none';
                elem.classList.add('hidden');
            }
        });
        
        multiplayerOnlyElements.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                elem.style.display = '';
                elem.classList.remove('hidden');
            }
        });
    } else if (mode === 'offline') {
        offlineOnlyElements.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                elem.style.display = '';
                elem.classList.remove('hidden');
            }
        });
        
        multiplayerOnlyElements.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                elem.style.display = 'none';
                elem.classList.add('hidden');
            }
        });
    }
}

function showResults(resultsData) {
    const gameContainer = document.getElementById('gameContainer');
    if (gameContainer) {
        gameContainer.style.display = 'none';
    }
    
    const resultsSection = document.getElementById('gameResults');
    if (!resultsSection) {
        console.error('Results section not found');
        return;
    }
    
    resultsSection.classList.remove('hidden');
    
    if (currentHandler && currentHandler.populateResults) {
        currentHandler.populateResults(resultsData);
    } else {
        console.warn('Current handler does not implement populateResults()');
    }
}

function hideResults() {
    const resultsSection = document.getElementById('gameResults');
    if (resultsSection) {
        resultsSection.classList.add('hidden');
    }
    
    const gameContainer = document.getElementById('gameContainer');
    if (gameContainer) {
        gameContainer.style.display = '';
    }
}

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
