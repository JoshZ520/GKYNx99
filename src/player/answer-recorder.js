// src/game/player/answer-recorder.js - Answer recording and submission handling

import { CONFIG_UTILS } from '../../config/game-config.js';

// Shared state for submissions
let submissionsByQuestion = {};

/**
 * Get all submissions by question
 * @returns {Object} Submissions object
 */
export function getSubmissionsByQuestion() {
    return submissionsByQuestion;
}

/**
 * Record a player's answer for a question
 * @param {string} playerName - Name of the player
 * @param {string} question - Question text
 * @param {string} answer - Player's answer
 */
export function recordPlayerAnswer(playerName, question, answer) {
    // Initialize question entry if it doesn't exist
    if (!submissionsByQuestion[question]) {
        submissionsByQuestion[question] = {
            answers: {},
            timestamp: Date.now(),
            topic: localStorage.getItem('currentTopic')
        };
    }
    
    // Record the player's answer
    submissionsByQuestion[question].answers[playerName] = answer;
}

/**
 * Update submission state UI elements
 * @param {string[]} playerNames - Array of player names
 * @param {Function} getCurrentPlayerName - Function to get current player name
 */
export function updateSubmissionState(playerNames, getCurrentPlayerName) {
    const questionElement = document.getElementById('question');
    const currentQuestionText = questionElement ? questionElement.textContent : '';
    
    if (!currentQuestionText || currentQuestionText === 'No question available') {
        return;
    }
    
    const currentQuestionData = submissionsByQuestion[currentQuestionText];
    const answersReceived = currentQuestionData ? Object.keys(currentQuestionData.answers).length : 0;
    const totalPlayers = playerNames.length;
    
    const submitBtn = document.getElementById('submitButton');
    const finBtn = document.getElementById('final_submit');
    
    // Update submit button text and state
    if (submitBtn) {
        const currentPlayer = getCurrentPlayerName();
        const hasCurrentPlayerAnswered = currentQuestionData && currentQuestionData.answers[currentPlayer];
        
        if (hasCurrentPlayerAnswered) {
            submitBtn.textContent = `${currentPlayer} Already Answered`;
            submitBtn.disabled = true;
            submitBtn.classList.add('disabled');
        } else {
            submitBtn.textContent = 'Submit Answer';
            submitBtn.disabled = false;
            submitBtn.classList.remove('disabled');
        }
    }
    
    // Show/hide final submit button based on completion
    if (finBtn) {
        // In multiplayer mode, always show the button (host controls when to reveal)
        if (window.transport && window.transport.isMultiplayer()) {
            finBtn.style.display = 'block';
            finBtn.textContent = `Record Answers (${answersReceived}/${totalPlayers} answered)`;
        } else {
            // Offline mode: only show when all players answered
            if (answersReceived >= totalPlayers && totalPlayers > 0) {
                finBtn.style.display = 'block';
                finBtn.textContent = `All ${totalPlayers} Players Answered - Show Results`;
            } else {
                finBtn.style.display = 'none';
            }
        }
    }
    
    // Update progress display if it exists
    const progressElement = document.getElementById('answerProgress');
    if (progressElement && totalPlayers > 0) {
        progressElement.textContent = `${answersReceived}/${totalPlayers} players answered`;
    }
}

/**
 * Submit an answer for the current player
 * @param {Function} getCurrentPlayerName - Function to get current player name
 * @param {Function} advanceToNextPlayer - Function to advance to next player
 * @param {string[]} playerNames - Array of player names
 */
export function submitAnswer(getCurrentPlayerName, advanceToNextPlayer, playerNames) {
    // In offline mode, try to get answer from offline.js function first
    let selectedPreference = '';
    if (window.getSelectedAnswerOffline) {
        selectedPreference = window.getSelectedAnswerOffline();
    } else {
        const input = document.getElementById('selectedPreference');
        selectedPreference = input ? input.value : '';
    }
    
    if (!selectedPreference) {
        alert('Please select an option before submitting.');
        return;
    }
    
    const currentPlayerName = getCurrentPlayerName();
    const questionElement = document.getElementById('question');
    const currentQuestionText = questionElement ? questionElement.textContent : 'Unknown Question';
    
    // Record this answer
    recordPlayerAnswer(currentPlayerName, currentQuestionText, selectedPreference);
    
    // MULTIPLAYER INTEGRATION: Advance to next player if in multiplayer mode
    if (window.transport && window.transport.isMultiplayer()) {
        // Let multiplayer manager handle player advancement
        // This will be handled by the multiplayer system
    } else {
        // Offline mode - show flying shapes and advance to next player
        spawnFlyingShapes();
        advanceToNextPlayer();
    }
    
    // Update UI
    updateSubmissionState(playerNames, getCurrentPlayerName);
}

/**
 * Spawn flying shapes animation for offline mode
 */
function spawnFlyingShapes() {
    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b'];
    const numShapes = 3;
    
    for (let i = 0; i < numShapes; i++) {
        setTimeout(() => {
            const shape = document.createElement('div');
            shape.className = 'flying-shape star';
            shape.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            shape.style.top = `${20 + Math.random() * 60}%`;
            shape.style.animationDelay = `${i * 0.1}s`;
            
            document.body.appendChild(shape);
            
            // Remove shape after animation completes
            setTimeout(() => {
                shape.remove();
            }, 2000);
        }, i * 200);
    }
}

/**
 * Handle final submission of all answers
 * @param {string[]} playerNames - Array of player names
 */
export function handleFinalSubmit(playerNames) {
    // Create chronological list of questions in the order they were answered
    const questionOrder = Object.keys(submissionsByQuestion).map(question => ({
        question: question,
        timestamp: submissionsByQuestion[question].timestamp || Date.now(),
        topic: submissionsByQuestion[question].topic || localStorage.getItem('currentTopic')
    })).sort((a, b) => a.timestamp - b.timestamp);
    
    // Pass chronological data to display page
    CONFIG_UTILS.setStorageItem('QUESTIONS_ORDER', JSON.stringify(questionOrder));
    CONFIG_UTILS.setStorageItem('SUBMISSIONS', JSON.stringify(submissionsByQuestion));
    
    // Save final session state before finishing (offline mode only)
    if (window.gameSessionManager && !window.transport.isMultiplayer()) {
        gameSessionManager.saveCurrentSession();
    }
    
    // Use transport interface to show results (works for both offline and multiplayer)
    if (window.transport && window.transport.showResults) {
        // Prepare results data
        const resultsData = {
            submissionsByQuestion: submissionsByQuestion,
            playerNames: playerNames,
            questionsOrder: JSON.parse(CONFIG_UTILS.getStorageItem('QUESTIONS_ORDER') || '[]')
        };
        
        window.transport.showResults(resultsData);
    }
}
