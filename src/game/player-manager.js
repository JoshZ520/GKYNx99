// src/game/player-manager.js - Player management coordinator
// Main coordinator that imports and orchestrates all player modules

import { GAME_CONFIG, CONFIG_UTILS } from '../config/game-config.js';

import {
    getCurrentPlayerName,
    getCurrentPlayerIndex,
    getPlayerNames,
    setPlayerNames,
    setCurrentPlayerIndex,
    advanceToNextPlayer,
    updatePlayerTurnIndicator
} from './player/player-turn-manager.js';

import {
    getSubmissionsByQuestion,
    recordPlayerAnswer,
    updateSubmissionState as updateSubmissionStateModule,
    submitAnswer as submitAnswerModule,
    handleFinalSubmit as handleFinalSubmitModule
} from './player/answer-recorder.js';

import {
    setupResultsButtons,
    resumeGame,
    showGameResumedMessage
} from './player/game-resume-manager.js';

// === WRAPPER FUNCTIONS ===
function updateSubmissionState() {
    const playerNames = getPlayerNames();
    updateSubmissionStateModule(playerNames, getCurrentPlayerName);
}

function submitAnswer() {
    const playerNames = getPlayerNames();
    submitAnswerModule(getCurrentPlayerName, advanceToNextPlayer, playerNames);
}

function handleFinalSubmit() {
    const playerNames = getPlayerNames();
    handleFinalSubmitModule(playerNames);
}

function showGameResults() {
    // Hide the main game interface
    const gameContainer = document.querySelector('main > div');
    if (gameContainer) {
        gameContainer.style.display = 'none';
    }
    
    // Show results section
    const resultsSection = document.getElementById('gameResults');
    if (!resultsSection) {
        console.error('Results section not found');
        return;
    }
    
    resultsSection.classList.remove('hidden');
    
    // Populate game stats
    const submissionsByQuestion = getSubmissionsByQuestion();
    const playerNames = getPlayerNames();
    const totalQuestions = Object.keys(submissionsByQuestion).length;
    const totalPlayers = playerNames.length;
    
    document.getElementById('totalQuestions').textContent = totalQuestions;
    document.getElementById('totalPlayers').textContent = totalPlayers;
    
    // Calculate game duration (basic implementation)
    const gameStart = CONFIG_UTILS.getStorageItem('GAME_START_TIME');
    const gameDuration = gameStart ? 
        Math.round((Date.now() - parseInt(gameStart)) / 60000) + ' minutes' : 
        'Unknown';
    document.getElementById('gameDuration').textContent = gameDuration;
    
    // Populate questions and answers
    const questionsList = document.getElementById('questionsList');
    questionsList.innerHTML = '';
    
    // Get questions in chronological order
    const questionsInOrder = JSON.parse(CONFIG_UTILS.getStorageItem('QUESTIONS_ORDER') || '[]');
    
    questionsInOrder.forEach(questionData => {
        const questionText = questionData.question;
        const submissions = submissionsByQuestion[questionText];
        
        if (submissions) {
            const questionItem = document.createElement('div');
            questionItem.className = 'question-item';
            
            const questionTextDiv = document.createElement('div');
            questionTextDiv.className = 'question-text';
            questionTextDiv.textContent = questionText;
            
            const answersDiv = document.createElement('div');
            answersDiv.className = 'question-answers';
            
            // Group answers by preference
            const answerGroups = {};
            Object.entries(submissions.answers).forEach(([player, answer]) => {
                if (!answerGroups[answer]) {
                    answerGroups[answer] = [];
                }
                answerGroups[answer].push(player);
            });
            
            // Create answer chips
            Object.entries(answerGroups).forEach(([answer, players]) => {
                const chip = document.createElement('span');
                chip.className = 'answer-chip';
                chip.textContent = `${answer}: ${players.join(', ')}`;
                answersDiv.appendChild(chip);
            });
            
            questionItem.appendChild(questionTextDiv);
            questionItem.appendChild(answersDiv);
            questionsList.appendChild(questionItem);
        }
    });
    
    // Set up action buttons
    setupResultsButtons();
}

// === INITIALIZATION ===
function initializePlayerSystem() {
    // Track game start time
    if (!CONFIG_UTILS.getStorageItem('GAME_START_TIME')) {
        CONFIG_UTILS.setStorageItem('GAME_START_TIME', Date.now().toString());
    }
    // Load player data from session storage (for offline mode)
    const gameMode = CONFIG_UTILS.getStorageItem('GAME_MODE');
    if (gameMode === GAME_CONFIG.MODES.OFFLINE) {
        const storedNames = CONFIG_UTILS.getStorageItem('PLAYER_NAMES');
        // Show submit button for offline mode
        const offlineSubmitContainer = document.getElementById('offlineSubmitContainer');
        if (offlineSubmitContainer) offlineSubmitContainer.style.display = '';
        // Show current player indicator for offline mode
        const offlinePlayerIndicator = document.getElementById('offlinePlayerIndicator');
        if (offlinePlayerIndicator) offlinePlayerIndicator.style.display = '';
        // Submit button handler is set by question-manager.js using addEventListener
        if (storedNames) {
            try {
                const names = JSON.parse(storedNames);
                setPlayerNames(names);
                // Initialize the first player's turn
                setCurrentPlayerIndex(0);
                updatePlayerTurnIndicator();
            } catch (error) {
                // Keep error handling for debugging issues
                console.error('Error loading player names:', error);
            }
        }
    }
}

// === EXPORTS ===
// Make functions available globally for use by other modules
window.gamePlayer = {
    getCurrentPlayerName,
    advanceToNextPlayer,
    updatePlayerTurnIndicator,
    recordPlayerAnswer,
    updateSubmissionState,
    submitAnswer,
    handleFinalSubmit,
    showGameResults,
    setupResultsButtons,
    resumeGame,
    showGameResumedMessage,
    initializePlayerSystem,
    // Getters for shared state
    getPlayerNames,
    getCurrentPlayerIndex,
    getSubmissionsByQuestion,
    // Setters for shared state
    setPlayerNames,
    setCurrentPlayerIndex
};

// === AUTO-INITIALIZATION ===
// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (window.gamePlayer) {
        window.gamePlayer.initializePlayerSystem();
    }
});