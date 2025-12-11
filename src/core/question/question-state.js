// src/core/question/question-state.js
// Manages question state: questions list, counter, and submission limits

import { GAME_CONFIG, CONFIG_UTILS } from '../game-config.js';

// === SHARED GAME STATE ===
export let appQuestions = [];
export let maxSubmissions = Infinity;
export let questionCounter = 0;

// State setters
export function setAppQuestions(questions) {
    appQuestions.splice(0, appQuestions.length, ...questions);
}

export function setMaxSubmissions(value) {
    if (value === 'Infinity' || value === Infinity) {
        maxSubmissions = Infinity;
    } else {
        maxSubmissions = parseInt(value, 10) || Infinity;
    }
}

export function incrementQuestionCounter() {
    questionCounter++;
}

export function resetQuestionCounter() {
    questionCounter = 0;
}

// === QUESTION LIMIT MANAGEMENT ===
export function recordAnsweredQuestion() {
    questionCounter++;

    if (maxSubmissions !== Infinity && questionCounter >= maxSubmissions) {
        return true; // Limit reached
    }
    return false;
}

export function isQuestionLimitReached() {
    return maxSubmissions !== Infinity && questionCounter >= maxSubmissions;
}

export function addMoreQuestions(additionalQuestions) {
    if (additionalQuestions === 'Infinity') {
        maxSubmissions = Infinity;
    } else {
        const questionsToAdd = parseInt(additionalQuestions, 10) || 0;
        maxSubmissions = questionCounter + questionsToAdd;
    }
}

// Initialize max submissions from settings
export function initializeMaxSubmissions() {
    const questionNumberInput = CONFIG_UTILS.getElement('question-number');
    const unlimitedCheckbox = document.getElementById('question-number-unlimited');
    const endGameBtn = document.getElementById('end_game_btn');

    if (questionNumberInput) {
        // Function to get the current max submissions value
        const getMaxSubmissionsValue = () => {
            if (unlimitedCheckbox && unlimitedCheckbox.checked) {
                return 'Infinity';
            }
            return questionNumberInput.value;
        };
        
        // Function to update max submissions
        const updateMax = () => {
            const value = getMaxSubmissionsValue();
            if (value === 'Infinity') {
                setMaxSubmissions(Infinity);
                if (endGameBtn) CONFIG_UTILS.setDisplay('end_game_btn', 'block');
            } else {
                setMaxSubmissions(parseInt(value, 10) || 10);
                if (endGameBtn) CONFIG_UTILS.setDisplay('end_game_btn', 'none');
            }
        };
        
        // Initialize
        updateMax();
        
        // Listen for changes
        questionNumberInput.addEventListener('change', updateMax);
        if (unlimitedCheckbox) {
            unlimitedCheckbox.addEventListener('change', updateMax);
        }
    }
}
