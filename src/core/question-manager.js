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
        // Update the count display
        const countElement = document.getElementById('questionsAnsweredCount');
        if (countElement) {
            countElement.textContent = questionCounter;
        }
        
        CONFIG_UTILS.show(questionLimitReachedElement);
        hideQuestionArea(); 
    }
}

function hideQuestionLimitReachedPanel() {
    if (questionLimitReachedElement) {
        CONFIG_UTILS.hide(questionLimitReachedElement);
    }
}

function addMoreQuestions(additionalQuestions) {
    if (additionalQuestions === 'Infinity') {
        maxSubmissions = Infinity;
    } else {
        const questionsToAdd = parseInt(additionalQuestions, 10) || 0;
        maxSubmissions = questionCounter + questionsToAdd;
    }
    
    hideQuestionLimitReachedPanel();
    showQuestionArea();
}

function handleEndGame() {
    if (CONFIG_UTILS.isOfflineMode()) {
        if (window.gamePlayer && window.gamePlayer.getSubmissionsByQuestion) {
            const submissionsByQuestion = window.gamePlayer.getSubmissionsByQuestion();
            const playerNames = JSON.parse(CONFIG_UTILS.getStorageItem('PLAYER_NAMES') || '[]');
            const questionsOrder = Object.keys(submissionsByQuestion).map(q => ({ question: q }));
            
            window.transport?.showResults({ submissionsByQuestion, playerNames, questionsOrder });
        } else {
            console.error('Unable to retrieve offline submission data');
        }
    } else {
        window.showAllResults?.() || console.error('Multiplayer results display not available');
    }
}

export function recordAnsweredQuestion() {
    questionCounter++;

    if (maxSubmissions !== Infinity && questionCounter >= maxSubmissions) {
        showQuestionLimitReachedPanel(); 
        return true; 
    }
    return false;
}

export function isQuestionLimitReached() {
    return maxSubmissions !== Infinity && questionCounter >= maxSubmissions;
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

function switchQuestion(direction) {
    if (appQuestions.length === 0) return;
    
    const questionElem = CONFIG_UTILS.getElementById('QUESTION');
    if (!questionElem) return;
    
    const currentIndex = parseInt(questionElem.getAttribute('data-index')) || GAME_CONFIG.DEFAULTS.QUESTION_INDEX;
    const nextIndex = direction === 1 
        ? (currentIndex + 1) % appQuestions.length 
        : currentIndex === 0 ? appQuestions.length - 1 : currentIndex - 1;
    const question = appQuestions[nextIndex];
    
    // Update the question display
    if (typeof question === 'string') {
        questionElem.textContent = question;
        hidePreferenceContainer();
    } else if (question && question.prompt) {
        questionElem.textContent = question.prompt;
        if (window.gameUI) window.gameUI.displayQuestionOptions(question);
    } else {
        questionElem.textContent = GAME_CONFIG.DEFAULTS.NO_QUESTION_TEXT;
        hidePreferenceContainer();
    }
    
    questionElem.setAttribute('data-index', nextIndex);
    
    // Broadcast question to players if in multiplayer mode
    if (window.transport && window.transport.isMultiplayer()) {
        window.transport.broadcastQuestion(question);
    }
    
    // Ensure submit button is visible for the new question
    const submitBtn = CONFIG_UTILS.getElementById('SUBMIT_BUTTON');
    if (submitBtn) CONFIG_UTILS.setDisplay(submitBtn, GAME_CONFIG.DISPLAY.BLOCK);
    
    // Clear any previous submissions/answers
    clearPreviousAnswers();
    if (window.gamePlayer) window.gamePlayer.updateSubmissionState();
}

function switchToNextQuestion() {
    switchQuestion(1);
}

function switchToPreviousQuestion() {
    switchQuestion(-1);
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
    recordAnsweredQuestion,
    isQuestionLimitReached,
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
    
    if (switchBtn) {
        switchBtn.addEventListener('click', () => {
            if (!window.gameCore.isQuestionLimitReached()) {
                window.gameCore.switchToNextQuestion();
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
            if (!window.gameCore.isQuestionLimitReached()) {
                window.gameCore.switchToPreviousQuestion();
            }
        });
    }
    
    if (nextQuestionBtn) {
        nextQuestionBtn.addEventListener('click', () => {
            if (!window.gameCore.isQuestionLimitReached()) {
                window.gameCore.switchToNextQuestion();
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

// Support both multiplayer and offline settings
const questionNumberSelect = CONFIG_UTILS.getElement(
    CONFIG_UTILS.isOfflineMode() ? 'offline-question-number' : 'question-number'
);

if (questionNumberSelect) {
    updateMaxSubmissions(questionNumberSelect);
    questionNumberSelect.addEventListener('change', (event) => {
        updateMaxSubmissions(event.target);
        
        // Show end game button if unlimited is selected
        if (event.target.value === 'Infinity' && endGameBtn) {
            CONFIG_UTILS.setDisplay('end_game_btn', 'block');
        }
    });
    
    // Show end game button initially if unlimited is already selected
    if (questionNumberSelect.value === 'Infinity' && endGameBtn) {
        CONFIG_UTILS.setDisplay('end_game_btn', 'block');
    }
}

    // Handle continue game button (add more questions)
    const continueGameBtn = CONFIG_UTILS.getElement('continueGameBtn');
    const endGameFromLimitBtn = CONFIG_UTILS.getElement('endGameFromLimitBtn');
    const addQuestionsSelect = document.getElementById('addQuestionsSelect');
    
    if (continueGameBtn) {
        continueGameBtn.addEventListener('click', () => {
            const additionalQuestions = addQuestionsSelect ? addQuestionsSelect.value : '5';
            addMoreQuestions(additionalQuestions);
        });
    }
    
    if (endGameFromLimitBtn) {
        endGameFromLimitBtn.addEventListener('click', () => {
            hideQuestionLimitReachedPanel();
            // Show results or end game screen
            if (window.transport && window.transport.showResults) {
                window.transport.showResults();
            }
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