// src/player/game-resume-manager.js - Game resume and results display

import { CONFIG_UTILS, GAME_CONFIG } from '../config/game-config.js';

/**
 * Set up results button event listeners
 */
export function setupResultsButtons() {
    const continueGameBtn = document.getElementById('continueGameBtn');
    const playAgainBtn = document.getElementById('playAgainBtn');
    const backToMenuBtn = document.getElementById('backToMenuBtn');
    
    if (continueGameBtn) {
        continueGameBtn.addEventListener('click', () => {
            // Resume the game with current state
            resumeGame();
        });
    }
    
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            // Clear game data and restart
            CONFIG_UTILS.removeStorageItem('SUBMISSIONS');
            CONFIG_UTILS.removeStorageItem('QUESTIONS_ORDER');
            CONFIG_UTILS.removeStorageItem('GAME_START_TIME');
            window.location.reload();
        });
    }
    
    if (backToMenuBtn) {
        backToMenuBtn.addEventListener('click', () => {
            // Clear all game data and go to main menu
            sessionStorage.clear();
            window.location.href = '../pages/index.html';
        });
    }
}

/**
 * Resume the game from results screen
 */
export function resumeGame() {
    // Use transport interface to hide results
    if (window.transport && window.transport.hideResults) {
        window.transport.hideResults();
    } else {
        // Fallback: Hide results section manually
        const resultsSection = document.getElementById('gameResults');
        if (resultsSection) {
            resultsSection.classList.add('hidden');
        }
        
        // Show the main game interface again
        const gameContainer = document.querySelector('main > div');
        if (gameContainer) {
            gameContainer.style.display = '';
        }
    }
    
    // Find the next question that hasn't been fully answered by all players
    findNextUncompletedQuestion();
    
    // Update the player turn indicator to current state
    if (window.gamePlayer && window.gamePlayer.updatePlayerTurnIndicator) {
        window.gamePlayer.updatePlayerTurnIndicator();
    }
    
    // Update submit button state based on current question
    if (window.gamePlayer && window.gamePlayer.updateSubmissionState) {
        window.gamePlayer.updateSubmissionState();
    }
    
    // If there's a current question, make sure it's displayed properly
    if (window.gameCore && window.gameCore.refreshCurrentQuestion) {
        window.gameCore.refreshCurrentQuestion();
    }
    
    // Optionally show a toast/message that the game has resumed
    showGameResumedMessage();
}

/**
 * Find the next uncompleted question
 * @param {Object} submissionsByQuestion - Submissions object
 * @param {string[]} playerNames - Array of player names
 */
function findNextUncompletedQuestion() {
    // Get all questions and find one that doesn't have answers from all players
    const submissionsByQuestion = window.gamePlayer ? window.gamePlayer.getSubmissionsByQuestion() : {};
    const playerNames = window.gamePlayer ? window.gamePlayer.getPlayerNames() : [];
    const totalPlayers = playerNames.length;
    const currentQuestionElement = document.getElementById('question');
    
    if (!currentQuestionElement) return;
    
    // Check current question first
    const currentQuestionText = currentQuestionElement.textContent;
    const currentQuestionData = submissionsByQuestion[currentQuestionText];
    const currentAnswers = currentQuestionData ? Object.keys(currentQuestionData.answers).length : 0;
    
    // If current question is not fully answered, stay on it
    if (currentAnswers < totalPlayers) {
        return; // Stay on current question
    }
    
    // Otherwise, try to find next uncompleted question by switching questions
    let attempts = 0;
    const maxAttempts = 20; // Prevent infinite loop
    
    while (attempts < maxAttempts) {
        // Switch to the next question
        if (window.gameCore && window.gameCore.switchToNextQuestion) {
            window.gameCore.switchToNextQuestion();
        }
        
        // Check if this new question is incomplete
        const newQuestionText = currentQuestionElement.textContent;
        const newQuestionData = submissionsByQuestion[newQuestionText];
        const newAnswers = newQuestionData ? Object.keys(newQuestionData.answers).length : 0;
        
        if (newAnswers < totalPlayers) {
            return; // Found an incomplete question
        }
        
        attempts++;
    }
}

/**
 * Show a message that the game has resumed
 */
export function showGameResumedMessage() {
    // Create a temporary message to confirm game resumed
    const message = document.createElement('div');
    message.className = 'game-resumed-message';
    message.textContent = '🎮 Game resumed! Continue where you left off.';
    message.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--accent-dark);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 1001;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(message);
    
    // Remove message after 3 seconds
    setTimeout(() => {
        message.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, GAME_CONFIG.ANIMATIONS.FADE_TRANSITION);
    }, GAME_CONFIG.ANIMATIONS.MESSAGE_DISPLAY_TIME);
}
