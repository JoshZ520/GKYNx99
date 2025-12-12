// src/core/question-manager.js - Main question management module
// Imports and coordinates all question-related functionality
//
// LOGGING POLICY: Only keep essential logs (initialization, connections, errors)

import { GAME_CONFIG, CONFIG_UTILS } from './game-config.js';

// Import question modules
import {
    appQuestions,
    maxSubmissions,
    questionCounter,
    recordAnsweredQuestion,
    isQuestionLimitReached,
    addMoreQuestions,
    initializeMaxSubmissions
} from './question/question-state.js';

import {
    switchToNextQuestion,
    switchToPreviousQuestion,
    getCurrentQuestionIndex,
    clearCurrentSelection,
    clearPreviousAnswers,
    hidePreferenceContainer
} from './question/question-navigation.js';

import {
    applyQuestionsForTopic,
    setTopic,
    showQuestionArea,
    hideQuestionArea,
    showQuestionLimitReachedPanel,
    hideQuestionLimitReachedPanel,
    handleEndGame,
    refreshCurrentQuestion
} from './question/question-display.js';

// Re-export commonly used functions
export { recordAnsweredQuestion, isQuestionLimitReached };

// === GLOBAL API ===
// Make functions available globally for use by other modules
window.gameCore = {
    applyQuestionsForTopic,
    switchToNextQuestion,
    switchToPreviousQuestion,
    setTopic,
    clearCurrentSelection,
    clearPreviousAnswers,
    hidePreferenceContainer,
    recordAnsweredQuestion,
    isQuestionLimitReached,
    showQuestionLimitReachedPanel,
    refreshCurrentQuestion,
    // Getters for shared state
    getAppQuestions: () => appQuestions,
    getCurrentQuestionIndex
};

// === EVENT LISTENERS SETUP ===
// Set up game control event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize player system
    if (window.gamePlayer && window.gamePlayer.initializePlayerSystem) {
        window.gamePlayer.initializePlayerSystem();
    }
    
    // Initialize max submissions from settings
    initializeMaxSubmissions();
    
    // Question navigation controls
    const switchBtn = CONFIG_UTILS.getElement('switchQuestion');
    const randomTopicBtn = CONFIG_UTILS.getElement('randomTopicBtn');
    const prevQuestionBtn = CONFIG_UTILS.getElement('prevQuestionBtn');
    const nextQuestionBtn = CONFIG_UTILS.getElement('nextQuestionBtn');
    
    if (switchBtn) {
        switchBtn.addEventListener('click', () => {
            if (!isQuestionLimitReached()) {
                switchToNextQuestion();
            }
        });
    }
    
    if (randomTopicBtn) {
        randomTopicBtn.addEventListener('click', () => {
            if (window.gameUI && window.gameUI.pickRandomTopic) {
                window.gameUI.pickRandomTopic();
            }
        });
    }
    
    if (prevQuestionBtn) {
        prevQuestionBtn.addEventListener('click', () => {
            if (!isQuestionLimitReached()) {
                switchToPreviousQuestion();
            }
        });
    }
    
    if (nextQuestionBtn) {
        nextQuestionBtn.addEventListener('click', () => {
            if (!isQuestionLimitReached()) {
                switchToNextQuestion();
            }
        });
    }
    
    // Topics and UI controls
    const topicsToggleBtn = CONFIG_UTILS.getElement('topicsToggle');
    if (topicsToggleBtn) {
        topicsToggleBtn.addEventListener('click', () => {
            if (window.gameUI && window.gameUI.toggleTopicsPanel) {
                window.gameUI.toggleTopicsPanel();
            }
        });
    }
    
    // Preference selection
    const option1 = CONFIG_UTILS.getElement('option1');
    const option2 = CONFIG_UTILS.getElement('option2');
    
    if (option1) {
        option1.addEventListener('click', () => {
            if (window.gameUI && window.gameUI.selectPreference) {
                window.gameUI.selectPreference('option1');
            }
        });
    }
    
    if (option2) {
        option2.addEventListener('click', () => {
            if (window.gameUI && window.gameUI.selectPreference) {
                window.gameUI.selectPreference('option2');
            }
        });
    }
    
    // Player actions
    const submitBtn = CONFIG_UTILS.getElement('submitButton');
    const finalSubmitBtn = CONFIG_UTILS.getElement('final_submit');
    const endGameBtn = CONFIG_UTILS.getElement('end_game_btn');
    
    // Handle continue game button (add more questions)
    const continueGameBtn = CONFIG_UTILS.getElement('continueGameBtn');
    const endGameFromLimitBtn = CONFIG_UTILS.getElement('endGameFromLimitBtn');
    const addQuestionsSelect = document.getElementById('addQuestionsSelect');
    
    if (continueGameBtn) {
        continueGameBtn.addEventListener('click', () => {
            const additionalQuestions = addQuestionsSelect ? addQuestionsSelect.value : '5';
            addMoreQuestions(additionalQuestions);
            hideQuestionLimitReachedPanel();
            showQuestionArea();
        });
    }
    
    if (endGameFromLimitBtn) {
        endGameFromLimitBtn.addEventListener('click', () => {
            // Clear session data
            sessionStorage.clear();
            
            // If multiplayer, emit end-game event to kick players
            if (window.socket && window.socket.connected) {
                window.socket.emit('end-game');
            }
            
            // Redirect host to index page
            window.location.href = '/pages/index.html';
        });
    }
    
    if (submitBtn) {
        // Use addEventListener with { once: false } to ensure it only fires once per click
        // Remove any existing listeners first by cloning the button
        const newSubmitBtn = submitBtn.cloneNode(true);
        submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
        
        newSubmitBtn.addEventListener('click', () => {
            if (window.gamePlayer && window.gamePlayer.submitAnswer) {
                window.gamePlayer.submitAnswer();
            }
        });
    }
    
    if (finalSubmitBtn) {
        finalSubmitBtn.addEventListener('click', () => {
            if (window.gamePlayer && window.gamePlayer.handleFinalSubmit) {
                window.gamePlayer.handleFinalSubmit();
            }
        });
    }
    
    if (endGameBtn) {
        endGameBtn.addEventListener('click', handleEndGame);
    }
    
    // Topics pagination
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (window.gameUI && window.gameUI.changePage) {
                window.gameUI.changePage('prev');
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            if (window.gameUI && window.gameUI.changePage) {
                window.gameUI.changePage('next');
            }
        });
    }
    
    // Perform final initialization after all modules are set up
    setTimeout(() => {
        // No topic selected on load - hide question area and prompt user to select
        hideQuestionArea();
        
        // Update initial submission state
        if (window.gamePlayer && window.gamePlayer.updateSubmissionState) {
            window.gamePlayer.updateSubmissionState();
        }
    }, 100); // Small delay to ensure all modules are loaded
});
