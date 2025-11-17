// src/transport/player-client.js - Player-side client for multiplayer

import { CONFIG_UTILS } from '../config/game-config.js';

// Global state
let socket = null;
let playerState = {
    name: null,
    roomCode: null,
    currentQuestion: null,
    hasAnswered: false
};

// Initialize socket connection
function initializePlayerSocket() {
    try {
        socket = io();
        
        socket.on('connect', () => {
            updateConnectionStatus('connected', 'Connected');
        });
        
        socket.on('disconnect', () => {
            updateConnectionStatus('disconnected', 'Disconnected');
        });
        
        socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            updateConnectionStatus('disconnected', 'Connection Error');
        });
        
        // Game event listeners
        setupGameEventListeners();
        
    } catch (error) {
        console.error('Failed to initialize socket:', error);
        updateConnectionStatus('disconnected', 'Connection Failed');
    }
}

// Setup all game-related socket event listeners
function setupGameEventListeners() {
    // Join success
    socket.on('joined-room', (data) => {
        playerState.name = data.playerName;
        playerState.roomCode = data.roomCode;
        
        showWaitingSection();
    });
    
    // Join error
    socket.on('join-error', (data) => {
        console.log('Join error:', data);
        showPlayerError(data.message);
        resetJoinForm();
    });
    
    // Game started - host clicked start game button
    socket.on('game-started', (data) => {
        // Stay on waiting screen - question will come shortly
        updateConnectionStatus('connected', 'Game starting...');
    });
    
    // New question received
    socket.on('new-question', (data) => {
        playerState.currentQuestion = data.question;
        playerState.hasAnswered = false;
        
        showQuestionSection(data.question);
    });
    
    // Answer confirmation
    socket.on('answer-confirmed', (data) => {
        playerState.hasAnswered = true;
        showAnswerStatus();
    });
    
    // Your individual answer revealed
    socket.on('your-answer-revealed', (data) => {
        showYourAnswer(data.answer);
    });
    
    // Results revealed
    socket.on('answers-revealed', (data) => {
        showResults(data);
    });
    
    // Other players joining/leaving
    socket.on('player-joined', (data) => {
        updatePlayersList();
    });
    
    socket.on('player-left', (data) => {
        updatePlayersList();
    });
    
    // Host disconnected
    socket.on('host-disconnected', (data) => {
        showPlayerError('Host has left the game. Please rejoin or start a new game.');
        setTimeout(() => {
            showJoinSection();
        }, 3000);
    });
    
    // General errors
    socket.on('error', (data) => {
        showPlayerError(data.message);
    });
}

// Update connection status indicator
function updateConnectionStatus(status, text) {
    const indicator = CONFIG_UTILS.getElement('statusIndicator');
    const statusText = CONFIG_UTILS.getElement('statusText');
    
    if (indicator && statusText) {
        indicator.className = `status-indicator ${status}`;
        statusText.textContent = text;
    }
}

// Show error message
function showPlayerError(message) {
    const errorDiv = CONFIG_UTILS.setText('joinError', message);
    if (errorDiv) {
        CONFIG_UTILS.show(errorDiv);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            CONFIG_UTILS.hide('joinError');
        }, 5000);
    }
}

// Reset join form
function resetJoinForm() {
    const joinBtn = CONFIG_UTILS.getElement('joinBtn');
    if (joinBtn) {
        joinBtn.disabled = false;
        joinBtn.innerHTML = '<span>Join Game</span>';
    }
}

// Section management
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('visible');
        CONFIG_UTILS.hide(section);
    });
    
    // Show target section
    const targetSection = CONFIG_UTILS.getElement(sectionId);
    if (targetSection) {
        CONFIG_UTILS.show(targetSection);
        targetSection.classList.add('visible');
    }
}

function showJoinSection() {
    showSection('joinSection');
    playerState = { name: null, roomCode: null, currentQuestion: null, hasAnswered: false };
}

function showWaitingSection() {
    showSection('waitingSection');
    
    // Update UI with current info
    CONFIG_UTILS.setText('currentRoomCode', playerState.roomCode);
    CONFIG_UTILS.setText('currentPlayerName', playerState.name);
    
    updatePlayersList();
}

function showQuestionSection(question) {
    showSection('questionSection');
    
    // Reset answer status for new question
    CONFIG_UTILS.hide('answerStatus');
    CONFIG_UTILS.hide('yourAnswerDisplay');
    CONFIG_UTILS.showDisplay('answerOptions', 'flex');
    
    // Update UI
    CONFIG_UTILS.setText('questionRoomCode', playerState.roomCode);
    var name = playerState.name || sessionStorage.getItem('playerName') || localStorage.getItem('playerName') || '';
    CONFIG_UTILS.setText('questionPlayerName', name);
    
    // Extract the question text - handle different formats
    let questionText = '';
    if (typeof question.text === 'string') {
        questionText = question.text;
    } else if (question.text && question.text.prompt) {
        questionText = question.text.prompt;
    } else if (question.prompt) {
        questionText = question.prompt;
    } else {
        questionText = 'No question text';
    }
    
    CONFIG_UTILS.setText('currentQuestion', questionText);
    
    // Create answer buttons
    createAnswerButtons(question.options || []);
}

function showAnswerStatus() {
    CONFIG_UTILS.hideDisplay('answerOptions');
    CONFIG_UTILS.show('answerStatus');
}

function showYourAnswer(answer) {
    // Hide the "Answer Submitted!" status when revealing the answer
    CONFIG_UTILS.hide('answerStatus');
    
    // Show the player what they answered
    const answerText = answer.text || answer.value || answer;
    const yourAnswerDiv = CONFIG_UTILS.getElement('yourAnswerDisplay');
    
    if (yourAnswerDiv) {
        CONFIG_UTILS.setText('yourAnswerText', answerText);
        CONFIG_UTILS.show('yourAnswerDisplay');
    }
}

function showResults(data) {
    showSection('resultsSection');
    
    // Update question recap
    CONFIG_UTILS.setText('resultsQuestion', data.question.text);
    
    // Show results
    displayResults(data.results);
}

// Create answer buttons based on question options
function createAnswerButtons(options) {
    const container = CONFIG_UTILS.getElement('answerOptions');
    if (!container) return;
    
    container.innerHTML = '';
    CONFIG_UTILS.showDisplay(container, 'flex');
    
    options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'answer-btn';
        button.textContent = option.text;
        button.onclick = () => submitAnswer(option, index);
        container.appendChild(button);
    });
}

// Submit player's answer
function submitAnswer(selectedOption, index) {
    if (playerState.hasAnswered) return;
    
    // Visual feedback
    const buttons = document.querySelectorAll('.answer-btn');
    buttons.forEach((btn, i) => {
        btn.classList.remove('selected');
        if (i === index) {
            btn.classList.add('selected');
        }
    });
    
    // Send answer to server
    socket.emit('submit-answer', {
        roomCode: playerState.roomCode,
        answer: {
            text: selectedOption.text,
            value: selectedOption.value || selectedOption.text,
            index: index
        }
    });
}

// Display results
function displayResults(results) {
    const container = CONFIG_UTILS.getElement('resultsContent');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (results.length === 0) {
        container.innerHTML = '<p>No answers received</p>';
        return;
    }
    
    results.forEach(result => {
        const item = document.createElement('div');
        item.className = 'result-item';
        item.innerHTML = `
            <span class="result-player">${result.playerName}</span>
            <span class="result-answer">${result.answer.text}</span>
        `;
        container.appendChild(item);
    });
}

function updatePlayersList() {
    const container = CONFIG_UTILS.getElement('playersList');
    if (container) {
        // Display current player (server would populate full list in multiplayer)
        container.innerHTML = `<div>${playerState.name} (you)</div>`;
    }
}

// Join form handling
function setupJoinForm() {
    const joinForm = CONFIG_UTILS.getElement('joinForm');
    const playerNameInput = CONFIG_UTILS.getElement('playerName');
    const roomCodeInput = CONFIG_UTILS.getElement('roomCode');
    
    if (!joinForm) return;
    
    // Auto-uppercase room code
    if (roomCodeInput) {
        roomCodeInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }
    
    joinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const playerName = playerNameInput.value.trim();
        const roomCode = roomCodeInput.value.trim().toUpperCase();
        
        if (!playerName || !roomCode) {
            showPlayerError('Please enter both your name and room code');
            return;
        }
        
        if (roomCode.length !== 4) {
            showPlayerError('Room code must be 4 characters');
            return;
        }
        
        // Update button to show loading
        const joinBtn = CONFIG_UTILS.getElement('joinBtn');
        if (joinBtn) {
            joinBtn.disabled = true;
            joinBtn.innerHTML = '<span>Joining...</span>';
        }
        
        // Clear any previous errors
        CONFIG_UTILS.hide('joinError');
        
        // Save player name locally for persistence
        sessionStorage.setItem('playerName', playerName);
        localStorage.setItem('playerName', playerName);
        
        // Send join request
        socket.emit('join-room', {
            playerName: playerName,
            roomCode: roomCode
        });
    });
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize socket connection
    initializePlayerSocket();
    
    // Setup join form
    setupJoinForm();
    
    // Show join section initially
    showJoinSection();
});

// Handle page visibility changes (important for mobile)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && socket && !socket.connected) {
        socket.connect();
    }
});

window.addEventListener('beforeunload', function (e) {
    var playerName = sessionStorage.getItem('playerName') || localStorage.getItem('playerName');
    if (playerName) {
        var message = 'Do you want to clear your name from this device?';
        if (confirm(message)) {
            sessionStorage.removeItem('playerName');
            localStorage.removeItem('playerName');
        }
        // Note: returning a string or setting e.returnValue is ignored by most browsers now
    }
});
