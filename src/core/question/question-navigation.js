// src/core/question/question-navigation.js
// Handles question navigation: next, previous, switching between questions

import { GAME_CONFIG, CONFIG_UTILS } from '../game-config.js';
import { appQuestions } from './question-state.js';
import { getAskedQuestionIndices, addAskedQuestionIndex } from './question-display.js';

// === QUESTION NAVIGATION ===
export function switchQuestion(direction) {
    if (appQuestions.length === 0) return;
    
    const questionElem = CONFIG_UTILS.getElementById('QUESTION');
    if (!questionElem) return;
    
    const currentIndex = parseInt(questionElem.getAttribute('data-index')) || GAME_CONFIG.DEFAULTS.QUESTION_INDEX;
    const askedIndices = getAskedQuestionIndices();
    
    // Check if all questions have been asked
    if (askedIndices.length >= appQuestions.length) {
        alert('You\'ve asked all questions in this topic! Please select a different topic to continue.');
        return;
    }
    
    // Find next unasked question in the direction
    let nextIndex = currentIndex;
    let attempts = 0;
    do {
        nextIndex = direction === 1 
            ? (nextIndex + 1) % appQuestions.length 
            : nextIndex === 0 ? appQuestions.length - 1 : nextIndex - 1;
        attempts++;
    } while (askedIndices.includes(nextIndex) && attempts < appQuestions.length);
    
    const question = appQuestions[nextIndex];
    addAskedQuestionIndex(nextIndex);
    
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

export function switchToNextQuestion() {
    switchQuestion(1);
}

export function switchToPreviousQuestion() {
    switchQuestion(-1);
}

export function getCurrentQuestionIndex() {
    const questionElem = CONFIG_UTILS.getElementById('QUESTION');
    return questionElem ? parseInt(questionElem.getAttribute('data-index')) || 0 : 0;
}

// === UTILITY FUNCTIONS ===
export function clearCurrentSelection() {
    const selectedPrefElement = CONFIG_UTILS.getElement('selectedPreference');
    if (selectedPrefElement) selectedPrefElement.value = '';
    
    document.querySelectorAll('.preference-option').forEach(opt => CONFIG_UTILS.removeClass(opt, 'SELECTED'));
}

export function clearPreviousAnswers() {
    clearCurrentSelection();
}

export function hidePreferenceContainer() {
    const preferenceContainer = CONFIG_UTILS.getElement('preferenceContainer');
    if (preferenceContainer) {
        CONFIG_UTILS.hide(preferenceContainer);
        preferenceContainer.classList.remove('visible');
    }
}
