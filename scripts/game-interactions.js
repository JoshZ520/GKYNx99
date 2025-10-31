// game-interactions.js - Preference System and Answer Submission for Table Talk
// Handles question options display, preference selection, and answer submission
console.log('🎯 Game Interactions loaded');

// === PREFERENCE SYSTEM ===
function displayQuestionOptions(question) {
    // Show preference UI (all questions now have option1 and option2)
    const preferenceContainer = document.getElementById('preferenceContainer');
    if (preferenceContainer) {
        preferenceContainer.classList.remove('hidden');
        preferenceContainer.classList.add('visible');
    }
    
    // Set up image containers for contributors to add images
    const option1Image = document.getElementById('option1Image');
    const option2Image = document.getElementById('option2Image');
    
    // Load images from JSON URLs if available, otherwise use CSS fallback
    if (option1Image) {
        const option1Name = question.option1.toLowerCase().replace(/[\s\/]+/g, '-').replace(/[^\w\-]/g, '');
        option1Image.setAttribute('data-option', option1Name);
        
        // Use image URL from JSON if available and not placeholder
        if (question.images && question.images.option1 && question.images.option1 !== "PASTE_URL_HERE") {
            option1Image.style.backgroundImage = `url('${question.images.option1}')`;
        } else {
            // Clear any previous background-image to use CSS fallback (kitten image)
            option1Image.style.backgroundImage = '';
        }
    }
    
    if (option2Image) {
        const option2Name = question.option2.toLowerCase().replace(/[\s\/]+/g, '-').replace(/[^\w\-]/g, '');
        option2Image.setAttribute('data-option', option2Name);
        
        // Use image URL from JSON if available and not placeholder
        if (question.images && question.images.option2 && question.images.option2 !== "PASTE_URL_HERE") {
            option2Image.style.backgroundImage = `url('${question.images.option2}')`;
        } else {
            // Clear any previous background-image to use CSS fallback (kitten image)
            option2Image.style.backgroundImage = '';
        }
    }
    
    // Set the text labels above the images
    const option1Label = document.getElementById('option1Label');
    const option2Label = document.getElementById('option2Label');
    if (option1Label) {
        option1Label.textContent = question.option1;
    }
    if (option2Label) {
        option2Label.textContent = question.option2;
    }
    
    // Set up click handlers for preferences
    setupPreferenceClickHandlers(question);
}

function setupPreferenceClickHandlers(question) {
    const option1Elem = document.getElementById('option1');
    const option2Elem = document.getElementById('option2');
    
    // Remove any existing listeners
    const option1Clone = option1Elem?.cloneNode(true);
    const option2Clone = option2Elem?.cloneNode(true);
    
    if (option1Elem && option1Clone) {
        option1Elem.parentNode.replaceChild(option1Clone, option1Elem);
        option1Clone.addEventListener('click', () => selectPreference(question.option1));
    }
    
    if (option2Elem && option2Clone) {
        option2Elem.parentNode.replaceChild(option2Clone, option2Elem);
        option2Clone.addEventListener('click', () => selectPreference(question.option2));
    }
}

function selectPreference(choice) {
    // Visual feedback - highlight selected option
    const option1 = document.getElementById('option1');
    const option2 = document.getElementById('option2');
    
    if (option1) option1.classList.remove('selected');
    if (option2) option2.classList.remove('selected');
    
    // Determine which option to highlight based on the choice
    // Note: appQuestions is defined in question-manager.js
    const currentIndex = parseInt(document.getElementById('question')?.getAttribute('data-index')) || 0;
    const appQuestions = window.questionManager?.getQuestions() || [];
    const currentQuestion = appQuestions[currentIndex];
    
    if (currentQuestion && currentQuestion.option1 && currentQuestion.option2) {
        if (choice === currentQuestion.option1 && option1) {
            option1.classList.add('selected');
        } else if (choice === currentQuestion.option2 && option2) {
            option2.classList.add('selected');
        }
    }
    
    // Store the choice in both the hidden preference field and the answer field for submission
    const selectedPreferenceField = document.getElementById('selectedPreference');
    const answerElem = document.getElementById('answer');
    
    if (selectedPreferenceField) {
        selectedPreferenceField.value = choice;
    }
    if (answerElem) {
        answerElem.value = choice;
    }
}

// === SUBMISSION SYSTEM ===
function getSubmittedCountForCurrentQuestion() {
    const questionElem = document.getElementById('question');
    const currentQuestion = questionElem?.textContent || '';
    const submissions = JSON.parse(sessionStorage.getItem('chronologicalSubmissions')) || [];
    const filteredSubmissions = submissions.filter(sub => sub.question === currentQuestion);
    return filteredSubmissions.length;
}

function updateSubmissionState() {
    const playerCountString = sessionStorage.getItem('playerCount');
    const playerCount = parseInt(playerCountString) || null;
    const submitBtn = document.getElementById('submitButton');
    const finalBtn = document.getElementById('final_submit');
    
    if (!submitBtn || !finalBtn) return;
    
    if (playerCount && playerCount > 0) {
        const submitted = getSubmittedCountForCurrentQuestion();
        if (submitted >= playerCount) {
            // All players have answered - show final submit button
            console.log(`All ${playerCount} players have answered.`);
            submitBtn.classList.add('hidden');
            finalBtn.classList.remove('hidden');
            return;
        }
        // not yet reached count: show submit and hide final
        submitBtn.classList.remove('hidden');
        finalBtn.classList.add('hidden');
    } else {
        // no count limit: always show submit, never show final
        submitBtn.classList.remove('hidden');
        finalBtn.classList.add('hidden');
    }
}

function submitAnswer() {
    // Get answer from preference selection
    const answer = document.getElementById('selectedPreference').value;
    
    // Get current player's name from the player turn system
    let name = 'Player';
    const storedPlayerCount = parseInt(sessionStorage.getItem('playerCount')) || 1;
    
    // Access shared player state from player-turns.js
    const playerTurns = window.playerTurns || {};
    const playerNames = playerTurns.getPlayerNames ? playerTurns.getPlayerNames() : [];
    const currentPlayerIndex = playerTurns.getCurrentPlayerIndex ? playerTurns.getCurrentPlayerIndex() : 0;
    
    if (storedPlayerCount > 1 && playerNames.length > 0) {
        // Use the current player's name from the turn system
        name = playerNames[currentPlayerIndex] || `Player ${currentPlayerIndex + 1}`;
    } else {
        // For single player, just use "Player" or get from session if available
        const storedNames = sessionStorage.getItem('playerNames');
        if (storedNames) {
            const names = JSON.parse(storedNames);
            name = names[0] || 'Player';
        }
    }
    
    const questionElem = document.getElementById('question');
    const currentQuestion = questionElem?.textContent || '';
    
    if (!answer.trim() || !currentQuestion.trim()) {
        alert('Please make a selection before submitting.');
        return; // Don't submit empty answers
    }
    
    // Get chronological submissions list
    const submissions = JSON.parse(sessionStorage.getItem('chronologicalSubmissions')) || [];
    
    // Check if this question already has enough answers (if player count is set)
    const playerCount = storedPlayerCount;
    if (playerCount) {
        const answersForThisQuestion = submissions.filter(sub => sub.question === currentQuestion).length;
        if (answersForThisQuestion >= playerCount) {
            updateSubmissionState();
            return;
        }
    }
    
    // Add new submission with timestamp
    const submission = {
        question: currentQuestion,
        answer: answer.trim(),
        name: name.trim(),
        timestamp: Date.now(),
        topic: window.currentTopic || 'unknown'
    };
    
    submissions.push(submission);
    
    // Save chronological submissions
    sessionStorage.setItem('chronologicalSubmissions', JSON.stringify(submissions));
    
    // Clear the preference system for the next player
    document.getElementById('selectedPreference').value = '';
    
    // Remove visual selection
    const option1 = document.getElementById('option1');
    const option2 = document.getElementById('option2');
    if (option1) option1.classList.remove('selected');
    if (option2) option2.classList.remove('selected');
    
    // Update UI state in case we've reached the player count
    updateSubmissionState();
    
    // Advance to next player if in multiplayer mode
    if (window.playerTurns && window.playerTurns.advanceToNextPlayer) {
        window.playerTurns.advanceToNextPlayer();
    }
    
    // Save session after answer submission
    if (window.gameSessionManager) {
        gameSessionManager.saveCurrentSession();
        console.log('Answer submitted - session saved');
    }
}

function resetToFirstPlayer() {
    // Reset the turn system back to the first player
    if (window.playerTurns && window.playerTurns.resetToFirstPlayer) {
        window.playerTurns.resetToFirstPlayer();
    }
}

// === FINAL SUBMISSION ===
function handleFinalSubmit() {
    // Get chronological submissions
    const submissions = JSON.parse(sessionStorage.getItem('chronologicalSubmissions')) || [];
    
    if (submissions.length === 0) {
        alert('No answers submitted yet!');
        return;
    }
    
    // Group submissions by question (in order they were first answered)
    const questionOrder = [];
    const submissionsByQuestion = {};
    
    submissions.forEach(submission => {
        if (!submissionsByQuestion[submission.question]) {
            submissionsByQuestion[submission.question] = [];
            questionOrder.push(submission.question);
        }
        submissionsByQuestion[submission.question].push(submission);
    });
    
    // Pass chronological data to display page
    sessionStorage.setItem('questionsInOrder', JSON.stringify(questionOrder));
    sessionStorage.setItem('submissionsByQuestion', JSON.stringify(submissionsByQuestion));
    
    // Reveal answers to multiplayer players if active
    if (window.hostMultiplayer && window.hostMultiplayer.isActive()) {
        window.hostMultiplayer.revealAnswers();
    }
    
    // Save final session state before finishing
    if (window.gameSessionManager) {
        gameSessionManager.saveCurrentSession();
        gameSessionManager.disableAutoSave(); // Stop auto-saving since game is ending
        console.log('Game completed - final session saved');
    }
    
    // Clear stored submissions so the next run starts fresh, but keep other persisted settings (like currentTopic)
    try {
        sessionStorage.removeItem('chronologicalSubmissions');
    } catch (e) {
        console.warn('Could not remove chronologicalSubmissions from sessionStorage', e);
    }
    
    // Redirect to the display/results page
    window.location.href = 'display.html';
}

// === GLOBAL EXPORTS ===
// Make functions available to other modules and legacy code
if (typeof window !== 'undefined') {
    window.gameInteractions = {
        // Preference system
        displayQuestionOptions: displayQuestionOptions,
        setupPreferenceClickHandlers: setupPreferenceClickHandlers,
        selectPreference: selectPreference,
        
        // Submission system
        getSubmittedCountForCurrentQuestion: getSubmittedCountForCurrentQuestion,
        updateSubmissionState: updateSubmissionState,
        submitAnswer: submitAnswer,
        resetToFirstPlayer: resetToFirstPlayer,
        handleFinalSubmit: handleFinalSubmit
    };
    
    // Legacy global functions for backward compatibility
    window.displayQuestionOptions = displayQuestionOptions;
    window.selectPreference = selectPreference;
    window.updateSubmissionState = updateSubmissionState;
    window.submitAnswer = submitAnswer;
    window.handleFinalSubmit = handleFinalSubmit;
    window.getSubmittedCountForCurrentQuestion = getSubmittedCountForCurrentQuestion;
}