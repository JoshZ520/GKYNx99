// game-core.js - Core game functionality: question management and navigation
// Handles loading, displaying, and navigating between questions
//
// LOGGING POLICY: Only keep essential logs (initialization, connections, errors)


// === SHARED GAME STATE ===
let appQuestions = [];

// === QUESTION MANAGEMENT ===
function applyQuestionsForTopic(topic) {
    const topics = window.getTopics ? window.getTopics() : {};
    const topicData = topics[topic] || topics['default'] || {};
    let list = topicData.questions || [];
    
    // For the default topic, skip the first question since it's displayed on the front page
    // Use questions starting from index 1 for the game page
    if (topic === 'default' && list.length > 1) {
        list = list.slice(1); // Use all questions except the first one
    }
    
    appQuestions.splice(0, appQuestions.length, ...list);
    
    const questionElem = document.getElementById('question');
    if (questionElem) {
        questionElem.setAttribute('data-index', 0);
        // Handle both old string format and new object format
        const currentQuestion = appQuestions[0];
        if (typeof currentQuestion === 'string') {
            questionElem.textContent = currentQuestion;
        } else if (currentQuestion && currentQuestion.prompt) {
            questionElem.textContent = currentQuestion.prompt;
            // Display the options as well
            displayQuestionOptions(currentQuestion);
        } else {
            questionElem.textContent = '';
        }
    }
}

function switchToNextQuestion() {
    if (appQuestions.length === 0) return;
    
    const questionElem = document.getElementById('question');
    if (!questionElem) return;
    
    const currentIndex = parseInt(questionElem.getAttribute('data-index')) || 0;
    const nextIndex = (currentIndex + 1) % appQuestions.length;
    const nextQuestion = appQuestions[nextIndex];
    
    // Update the question display
    if (typeof nextQuestion === 'string') {
        questionElem.textContent = nextQuestion;
        hidePreferenceContainer();
    } else if (nextQuestion && nextQuestion.prompt) {
        questionElem.textContent = nextQuestion.prompt;
        displayQuestionOptions(nextQuestion);
    } else {
        questionElem.textContent = 'No question available';
        hidePreferenceContainer();
    }
    
    questionElem.setAttribute('data-index', nextIndex);
    
    // Broadcast new question to multiplayer players if active
    if (window.hostMultiplayer && window.hostMultiplayer.isActive()) {
        window.hostMultiplayer.broadcastQuestion(nextQuestion);
    }
    
    // Ensure submit button is visible for the new question
    const submitBtn = document.getElementById('submitButton');
    if (submitBtn) {
        submitBtn.style.display = 'block';
    }
    
    // Clear any previous submissions/answers
    clearPreviousAnswers();
    updateSubmissionState();
}

function switchToPreviousQuestion() {
    if (appQuestions.length === 0) return;
    
    const questionElem = document.getElementById('question');
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
        displayQuestionOptions(prevQuestion);
    } else {
        questionElem.textContent = 'No question available';
        hidePreferenceContainer();
    }
    
    questionElem.setAttribute('data-index', prevIndex);
    
    // Broadcast new question to multiplayer players if active
    if (window.hostMultiplayer && window.hostMultiplayer.isActive()) {
        window.hostMultiplayer.broadcastQuestion(prevQuestion);
    }
    
    // Ensure submit button is visible for the new question
    const submitBtn = document.getElementById('submitButton');
    if (submitBtn) {
        submitBtn.style.display = 'block';
    }
    
    // Clear any previous submissions/answers
    clearPreviousAnswers();
    updateSubmissionState();
}

function setTopic(topic) {
    window.currentTopic = topic;
    applyQuestionsForTopic(topic);
    localStorage.setItem('currentTopic', topic);
    
    // Update topic display
    const topicNameElement = document.getElementById('currentTopicName');
    if (topicNameElement) {
        const selectedTopic = availableTopics.find(t => t.value === topic);
        const displayName = selectedTopic ? selectedTopic.name : 
                           (topic === 'default' ? 'Instructions' : topic.charAt(0).toUpperCase() + topic.slice(1));
        topicNameElement.textContent = displayName;
    }
    
    // Update UI state after topic change (with small delay to ensure DOM is updated)
    setTimeout(() => updateSubmissionState(), 0);
    
    // Save session after topic change
    if (window.gameSessionManager) {
        setTimeout(() => {
            gameSessionManager.saveCurrentSession();

        }, 100);
    }
}

// === UTILITY FUNCTIONS ===
function clearCurrentSelection() {
    const selectedPrefElement = document.getElementById('selectedPreference');
    if (selectedPrefElement) {
        selectedPrefElement.value = '';
    }
    
    document.querySelectorAll('.preference-option').forEach(opt => {
        opt.classList.remove('selected');
    });
}

function clearPreviousAnswers() {
    clearCurrentSelection();
}

function hidePreferenceContainer() {
    const preferenceContainer = document.getElementById('preferenceContainer');
    if (preferenceContainer) {
        preferenceContainer.classList.add('hidden');
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
    // Getters for shared state
    getAppQuestions: () => appQuestions,
    getCurrentQuestionIndex: () => {
        const questionElem = document.getElementById('question');
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
    const switchBtn = document.getElementById('switchQuestion');
    const randomTopicBtn = document.getElementById('randomTopicBtn');
    const prevQuestionBtn = document.getElementById('prevQuestionBtn');
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');
    const skipQuestionBtn = document.getElementById('skipQuestionBtn');
    
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
    const topicsToggleBtn = document.getElementById('topicsToggle');
    if (topicsToggleBtn) {
        topicsToggleBtn.addEventListener('click', () => {
            if (window.gameUI && window.gameUI.toggleTopicsPanel) {
                window.gameUI.toggleTopicsPanel();
            }
        });

    }
    
    // Preference selection
    const option1 = document.getElementById('option1');
    const option2 = document.getElementById('option2');
    
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
        console.log('Option 2 selection connected');
    }
    
    // Player actions
    const submitBtn = document.getElementById('submitButton');
    const finalSubmitBtn = document.getElementById('final_submit');
    
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            if (window.gamePlayer && window.gamePlayer.submitAnswer) {
                window.gamePlayer.submitAnswer();
            }
        });
        console.log('Submit answer button connected');
    }
    
    if (finalSubmitBtn) {
        finalSubmitBtn.addEventListener('click', () => {
            if (window.gamePlayer && window.gamePlayer.handleFinalSubmit) {
                window.gamePlayer.handleFinalSubmit();
            }
        });
        console.log('Final submit button connected');
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
        console.log('Previous page button connected');
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            if (window.gameUI && window.gameUI.changePage) {
                window.gameUI.changePage('next');
            }
        });
        console.log('Next page button connected');
    }
    
    console.log('Game Core event listeners setup complete!');
    
    // Perform final initialization after all modules are set up
    setTimeout(() => {
        // Check and apply offline mode
        if (window.checkOfflineMode) {
            window.checkOfflineMode();
        }
        
        // Load current topic and apply questions
        const currentTopic = localStorage.getItem('currentTopic') || 'default';
        if (window.gameCore) {
            window.gameCore.setTopic(currentTopic);
        }
        
        // Update initial submission state
        if (window.gamePlayer && window.gamePlayer.updateSubmissionState) {
            window.gamePlayer.updateSubmissionState();
        }
        
        console.log('Final game initialization complete!');
    }, 100); // Small delay to ensure all modules are loaded
});