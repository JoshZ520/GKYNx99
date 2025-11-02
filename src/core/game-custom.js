// game-custom.js - Custom game functionality: filtered questions and game configurations
// Handles custom game setups, question filtering, and progress tracking

// === CUSTOM GAME STATE ===
let customGameConfig = null;
let filteredQuestions = [];
let currentQuestionNumber = 0;

// === CUSTOM GAME CONFIGURATION ===
function loadCustomGameConfig() {
    try {
        const config = JSON.parse(sessionStorage.getItem('customGameConfig'));
        if (config && config.isCustomGame) {
            customGameConfig = config;
            console.log('Loaded custom game config:', customGameConfig);
            return true;
        }
    } catch (e) {
        console.warn('Failed to load custom game config:', e);
    }
    customGameConfig = null;
    return false;
}

function isCustomGame() {
    return customGameConfig !== null && customGameConfig.isCustomGame;
}

// === QUESTION FILTERING ===
function buildFilteredQuestionPool() {
    if (!isCustomGame()) {
        console.warn('Not in custom game mode - no filtering applied');
        return;
    }
    
    // TODO: Implement question filtering based on customGameConfig
    // This will:
    // 1. Load questions from selected topics
    // 2. Apply question limit
    // 3. Distribute questions based on game style (balanced, random, progressive)
    // 4. Store filtered questions for use
    
    console.log('Building filtered question pool for custom game...');
    filteredQuestions = []; // Placeholder
    currentQuestionNumber = 1;
}

function getCustomProgress() {
    if (!isCustomGame()) return null;
    
    return {
        current: currentQuestionNumber,
        total: customGameConfig.questionLimit || 0,
        percentage: customGameConfig.questionLimit ? 
            Math.round((currentQuestionNumber / customGameConfig.questionLimit) * 100) : 0
    };
}

function shouldEndGame() {
    if (!isCustomGame()) return false;
    
    return currentQuestionNumber >= customGameConfig.questionLimit;
}

// === CUSTOM GAME UI UPDATES ===
function updateCustomProgressDisplay() {
    if (!isCustomGame()) return;
    
    const progress = getCustomProgress();
    
    // Update progress indicator if it exists
    const progressElement = document.getElementById('customGameProgress');
    if (progressElement && progress) {
        progressElement.textContent = `Question ${progress.current} of ${progress.total}`;
    }
    
    // Update topic labels if configured
    // TODO: Show which topic the current question belongs to
}

// === INTEGRATION WITH CORE GAME ===
function initializeCustomGame() {
    if (loadCustomGameConfig()) {
        console.log('Initializing custom game mode');
        buildFilteredQuestionPool();
        updateCustomProgressDisplay();
        return true;
    }
    return false;
}

// TODO: Hook into question navigation to:
// - Increment currentQuestionNumber
// - Check if game should end
// - Filter available questions

// === EXPORTS ===
// Make functions available globally for use by other modules
window.gameCustom = {
    loadCustomGameConfig,
    isCustomGame,
    buildFilteredQuestionPool,
    getCustomProgress,
    shouldEndGame,
    updateCustomProgressDisplay,
    initializeCustomGame,
    // Getters for shared state
    getCustomGameConfig: () => customGameConfig,
    getFilteredQuestions: () => filteredQuestions,
    getCurrentQuestionNumber: () => currentQuestionNumber
};