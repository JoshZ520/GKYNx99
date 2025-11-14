// src/transport/offline/game-handler.js - Answer selection and submission logic

// Module-level state for selected answer
import { CONFIG_UTILS } from '../../config/game-config.js';

let selectedAnswer = null;

/**
 * Display question options for offline mode
 * @param {Object} question - The question object with options
 */
export function displayQuestionOptionsOffline(question) {
    const optionsContainer = CONFIG_UTILS.getElement('optionsContainer');
    if (!optionsContainer || !question) return;
    
    optionsContainer.innerHTML = '';
    selectedAnswer = null;
    updateSubmitButtonOffline();
    
    const opts = [];
    
    // Parse options from different question formats
    if (Array.isArray(question.options) && question.options.length > 0) {
        question.options.forEach(o => opts.push({ label: o, image: null }));
    } else if (question.option1 || question.option2) {
        if (question.option1) opts.push({ 
            label: question.option1, 
            image: question.images && question.images.option1 
        });
        if (question.option2) opts.push({ 
            label: question.option2, 
            image: question.images && question.images.option2 
        });
    }
    
    // Show preference container
    const preferenceContainer = CONFIG_UTILS.getElement('preferenceContainer');
    if (preferenceContainer) {
        CONFIG_UTILS.show(preferenceContainer);
        preferenceContainer.classList.add('visible');
    }
    
    // Create option buttons
    opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'preference-option';
        btn.type = 'button';
        btn.textContent = '';
        btn.addEventListener('click', () => selectAnswerOffline(opt.label, btn));
        
        const labelDiv = document.createElement('div');
        labelDiv.className = 'option-label';
        labelDiv.textContent = opt.label || '';
        btn.appendChild(labelDiv);
        
        if (opt.image) {
            const img = document.createElement('img');
            img.src = opt.image;
            img.alt = opt.label || '';
            img.loading = 'lazy';
            img.style.maxWidth = '100%';
            btn.appendChild(img);
        }
        
        optionsContainer.appendChild(btn);
    });
}

/**
 * Select an answer in offline mode
 * @param {string} answer - The selected answer text
 * @param {HTMLElement} btn - The button element that was clicked
 */
export function selectAnswerOffline(answer, btn) {
    selectedAnswer = answer;
    
    const input = CONFIG_UTILS.getElement('selectedPreference');
    if (input) input.value = answer;
    
    document.querySelectorAll('.preference-option').forEach(opt => CONFIG_UTILS.removeClass(opt, 'SELECTED'));
    if (btn && btn.classList) CONFIG_UTILS.addClass(btn, 'SELECTED');
    
    updateSubmitButtonOffline();
}

/**
 * Update submit button state based on whether an answer is selected
 */
export function updateSubmitButtonOffline() {
    const submitBtn = CONFIG_UTILS.getElement('submitButton');
    if (!submitBtn) return;

    const disabled = !selectedAnswer;
    submitBtn.disabled = disabled;
    if (disabled) CONFIG_UTILS.addClass(submitBtn, 'DISABLED'); else CONFIG_UTILS.removeClass(submitBtn, 'DISABLED');
}

/**
 * Get the currently selected answer
 * @returns {string|null} The selected answer or null
 */
export function getSelectedAnswerOffline() {
    const input = CONFIG_UTILS.getElement('selectedPreference');
    return input ? input.value : selectedAnswer;
}

/**
 * Submit the selected answer (basic implementation for compatibility)
 */
export function submitOfflineAnswer() {
    const ans = getSelectedAnswerOffline();
    if (!ans) { 
        alert('Please select an answer before submitting.'); 
        return; 
    }
    alert('Answer submitted: ' + ans);
}
