// src/core/question-manager.js - Core game functionality: question management and navigation
// Handles loading, displaying, and navigating between questions
//
// LOGGING POLICY: Only keep essential logs (initialization, connections, errors)

import { GAME_CONFIG, CONFIG_UTILS } from '../config/game-config.js';

// === SHARED GAME STATE ===
let appQuestions = [];
let maxSubmissions = Infinity;
let questionCounter = 0;

// === QUESTION MANAGEMENT ===
function applyQuestionsForTopic(topic) {
    const topics = window.getTopics ? window.getTopics() : {};
    const topicData = topics[topic] || {};
    let list = topicData.questions || [];
    
    appQuestions.splice(0, appQuestions.length, ...list);
    
    const questionElem = CONFIG_UTILS.getElementById('QUESTION');
    if (questionElem) {
        questionElem.setAttribute('data-index', GAME_CONFIG.DEFAULTS.QUESTION_INDEX);
        // Handle both old string format and new object format
        const currentQuestion = appQuestions[0];
        if (typeof currentQuestion === 'string') {
            questionElem.textContent = currentQuestion;
        } else if (currentQuestion && currentQuestion.prompt) {
            questionElem.textContent = currentQuestion.prompt;
            // Display the options as well
            if (window.gameUI) {
                window.gameUI.displayQuestionOptions(currentQuestion);
            }
        } else {
            questionElem.textContent = '';
        }
        
        // Broadcast first question to players if in multiplayer mode
        if (currentQuestion && window.transport && window.transport.isMultiplayer()) {
            window.transport.broadcastQuestion(currentQuestion);
        }
    }
    
    // Show question area now that topic is selected
    showQuestionArea();
}

const questionLimitReachedElement = CONFIG_UTILS.getElement('askCon');

function showQuestionLimitReachedPanel() {
    if (questionLimitReachedElement) {
        CONFIG_UTILS.show(questionLimitReachedElement);
        hideQuestionArea(); 
    }
}

function hideQuestionLimitReachedPanel() {
    if (questionLimitReachedElement) {
        CONFIG_UTILS.hide(questionLimitReachedElement);
    }
}

export function recordAnsweredQuestion() {
    questionCounter++; 

    if (maxSubmissions !== Infinity && questionCounter >= maxSubmissions) {
        console.log("Maximum submission limit reached. Showing end-of-question prompt.");

        showQuestionLimitReachedPanel(); 
        return true; 
    }
    return false;
}

function showQuestionArea() {
    const questionElem = CONFIG_UTILS.getElementById('QUESTION');
    const preferenceContainer = CONFIG_UTILS.getElementById('PREFERENCE_CONTAINER');
    const submitButton = CONFIG_UTILS.getElementById('SUBMIT_BUTTON');
    const remoteControl = document.querySelector('.remote-control');
    
    if (questionElem) CONFIG_UTILS.show(questionElem);
    if (preferenceContainer) CONFIG_UTILS.show(preferenceContainer);
    if (submitButton) CONFIG_UTILS.show(submitButton);
    if (remoteControl) CONFIG_UTILS.show(remoteControl);
}

function hideQuestionArea() {
    const questionElem = CONFIG_UTILS.getElementById('QUESTION');
    const preferenceContainer = CONFIG_UTILS.getElementById('PREFERENCE_CONTAINER');
    const submitButton = CONFIG_UTILS.getElementById('SUBMIT_BUTTON');
    const remoteControl = document.querySelector('.remote-control');
    const topicNameElement = CONFIG_UTILS.getElement('currentTopicName');
    
    if (questionElem) {
        CONFIG_UTILS.hide(questionElem);
        CONFIG_UTILS.setText(questionElem, 'Please select a topic to begin');
    }
    if (preferenceContainer) CONFIG_UTILS.hide(preferenceContainer);
    if (submitButton) CONFIG_UTILS.hide(submitButton);
    if (remoteControl) CONFIG_UTILS.hide(remoteControl);
    if (topicNameElement) CONFIG_UTILS.setText(topicNameElement, 'No topic selected');
}

function switchToNextQuestion() {
    if (appQuestions.length === 0) return;
    
    const questionElem = CONFIG_UTILS.getElementById('QUESTION');
    if (!questionElem) return;
    
    const currentIndex = parseInt(questionElem.getAttribute('data-index')) || GAME_CONFIG.DEFAULTS.QUESTION_INDEX;
    const nextIndex = (currentIndex + 1) % appQuestions.length;
    const nextQuestion = appQuestions[nextIndex];
    
    // Update the question display
    if (typeof nextQuestion === 'string') {
        questionElem.textContent = nextQuestion;
        hidePreferenceContainer();
    } else if (nextQuestion && nextQuestion.prompt) {
        questionElem.textContent = nextQuestion.prompt;
        if (window.gameUI) {
            window.gameUI.displayQuestionOptions(nextQuestion);
        }
    } else {
        questionElem.textContent = GAME_CONFIG.DEFAULTS.NO_QUESTION_TEXT;
        hidePreferenceContainer();
    }
    
    questionElem.setAttribute('data-index', nextIndex);
    
    // Broadcast new question to players if in multiplayer mode
    if (window.transport && window.transport.isMultiplayer()) {
        window.transport.broadcastQuestion(nextQuestion);
    }
    
    // Ensure submit button is visible for the new question
    const submitBtn = CONFIG_UTILS.getElementById('SUBMIT_BUTTON');
    if (submitBtn) {
        CONFIG_UTILS.setDisplay(submitBtn, GAME_CONFIG.DISPLAY.BLOCK);
    }
    
    // Clear any previous submissions/answers
    clearPreviousAnswers();
    if (window.gamePlayer) {
        window.gamePlayer.updateSubmissionState();
    }
}

function switchToPreviousQuestion() {
    if (appQuestions.length === 0) return;
    
    const questionElem = CONFIG_UTILS.getElementById('QUESTION');
    if (!questionElem) return;
    
    const currentIndex = parseInt(questionElem.getAttribute('data-index')) || 0;
    const prevIndex = currentIndex === 0 ? appQuestions.length - 1 : currentIndex - 1;
    const prevQuestion = appQuestions[prevIndex];
    
    // Update the question display
    if (typeof prevQuestion === 'string') {
        questionElem.textContent = prevQuestion;
        hidePreferenceContainer();
    } else if (prevQuestion && prevQuestion.prompt) {
        questionElem.textContent = prevQuestion.prompt;
        if (window.gameUI) {
            window.gameUI.displayQuestionOptions(prevQuestion);
        }
    } else {
        questionElem.textContent = GAME_CONFIG.DEFAULTS.NO_QUESTION_TEXT;
        hidePreferenceContainer();
    }
    
    questionElem.setAttribute('data-index', prevIndex);
    
    // Broadcast previous question to players if in multiplayer mode
    if (window.transport && window.transport.isMultiplayer()) {
        window.transport.broadcastQuestion(prevQuestion);
    }
    
    // Ensure submit button is visible for the new question
    const submitBtn = CONFIG_UTILS.getElementById('SUBMIT_BUTTON');
    if (submitBtn) {
        CONFIG_UTILS.setDisplay(submitBtn, GAME_CONFIG.DISPLAY.BLOCK);
    }
    
    // Clear any previous submissions/answers
    clearPreviousAnswers();
    if (window.gamePlayer) {
        window.gamePlayer.updateSubmissionState();
    }
}

function setTopic(topic) {
    window.currentTopic = topic;
    applyQuestionsForTopic(topic);
    // Topic is stored in memory only - no localStorage needed
    
    // Update topic display
    const topicNameElement = CONFIG_UTILS.getElement('currentTopicName');
    if (topicNameElement) {
        // Simple display name without needing availableTopics
        const displayName = topic.charAt(0).toUpperCase() + topic.slice(1);
        CONFIG_UTILS.setText(topicNameElement, displayName);
    }
    
    // Broadcast first question to players if in multiplayer mode
    if (window.transport && window.transport.isMultiplayer() && appQuestions.length > 0) {
        const firstQuestion = appQuestions[0];
        window.transport.broadcastQuestion(firstQuestion);
    }
    
    // Update UI state after topic change (with small delay to ensure DOM is updated)
    setTimeout(() => {
        if (typeof updateSubmissionState === 'function') {
            updateSubmissionState();
        } else if (window.gamePlayer && typeof window.gamePlayer.updateSubmissionState === 'function') {
            window.gamePlayer.updateSubmissionState();
        }
    }, GAME_CONFIG.ANIMATIONS.UI_UPDATE_DELAY);
    
    // Save session after topic change
    if (window.gameSessionManager) {
        setTimeout(() => {
            gameSessionManager.saveCurrentSession();

        }, 100);
    }
}

// === UTILITY FUNCTIONS ===
function clearCurrentSelection() {
    const selectedPrefElement = CONFIG_UTILS.getElement('selectedPreference');
    if (selectedPrefElement) selectedPrefElement.value = '';
    
    document.querySelectorAll('.preference-option').forEach(opt => CONFIG_UTILS.removeClass(opt, 'SELECTED'));
}

function clearPreviousAnswers() {
    clearCurrentSelection();
}

function hidePreferenceContainer() {
    const preferenceContainer = CONFIG_UTILS.getElement('preferenceContainer');
    if (preferenceContainer) {
        CONFIG_UTILS.hide(preferenceContainer);
        preferenceContainer.classList.remove('visible');
    }
}

// === EXPORTS ===
// Make functions available globally for use by other modules
window.gameCore = {
    applyQuestionsForTopic,
    switchToNextQuestion,
    switchToPreviousQuestion,
    setTopic,
    clearCurrentSelection,
    clearPreviousAnswers,
    hidePreferenceContainer,
    refreshCurrentQuestion: () => {
        // Refresh the current question display and update UI state
        if (window.gamePlayer && window.gamePlayer.updateSubmissionState) {
            window.gamePlayer.updateSubmissionState();
        }
        if (window.gameUI && window.gameUI.updateQuestionUI) {
            window.gameUI.updateQuestionUI();
        }
    },
    // Getters for shared state
    getAppQuestions: () => appQuestions,
    getCurrentQuestionIndex: () => {
        const questionElem = CONFIG_UTILS.getElementById('QUESTION');
        return questionElem ? parseInt(questionElem.getAttribute('data-index')) || 0 : 0;
    }
};

// === EVENT LISTENERS SETUP ===
// Set up game control event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize player system
    if (window.gamePlayer && window.gamePlayer.initializePlayerSystem) {
        window.gamePlayer.initializePlayerSystem();
    }
    
    // Question navigation controls
    const switchBtn = CONFIG_UTILS.getElement('switchQuestion');
    const randomTopicBtn = CONFIG_UTILS.getElement('randomTopicBtn');
    const prevQuestionBtn = CONFIG_UTILS.getElement('prevQuestionBtn');
    const nextQuestionBtn = CONFIG_UTILS.getElement('nextQuestionBtn');
    const skipQuestionBtn = CONFIG_UTILS.getElement('skipQuestionBtn');
    
    if (switchBtn) {
        switchBtn.addEventListener('click', () => {
            window.gameCore.switchToNextQuestion();
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
            window.gameCore.switchToPreviousQuestion();
        });

    }
    
    if (nextQuestionBtn) {
        nextQuestionBtn.addEventListener('click', () => {
            window.gameCore.switchToNextQuestion();
        });

    }
    
    if (skipQuestionBtn) {
        skipQuestionBtn.addEventListener('click', () => {
            window.gameCore.switchToNextQuestion();
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

    // submit limitation
    const updateMaxSubmissions = (selectElement) => {
    const value = selectElement.value;
    
    if (value === 'Infinity') {
        maxSubmissions = Infinity;
    } else {
        maxSubmissions = parseInt(value, 10) || Infinity;
    }
    if (window.gamePlayer && window.gamePlayer.updateSubmissionState) {
        window.gamePlayer.updateSubmissionState();
    }
};

const questionNumberSelect = CONFIG_UTILS.getElement('question-number');

if (questionNumberSelect) {
    updateMaxSubmissions(questionNumberSelect);
    questionNumberSelect.addEventListener('change', (event) => {
        updateMaxSubmissions(event.target);
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
        endGameBtn.addEventListener('click', () => {
            if (window.showAllResults) {
                window.showAllResults();
            }
        });
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
        // Check and apply offline mode
        if (window.checkOfflineMode) {
            window.checkOfflineMode();
        }
        
        // No topic selected on load - hide question area and prompt user to select
        hideQuestionArea();
        
        // Update initial submission state
        if (window.gamePlayer && window.gamePlayer.updateSubmissionState) {
            window.gamePlayer.updateSubmissionState();
        }
    }, 100); // Small delay to ensure all modules are loaded
});