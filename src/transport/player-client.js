import { CONFIG_UTILS } from '../config/game-config.js';

let socket = null;
let playerState = {
    name: null,
    roomCode: null,
    currentQuestion: null,
    hasAnswered: false
};

function initializePlayerSocket() {
    try {
        socket = io();
        socket.on('connect', () => updateConnectionStatus('connected', 'Connected'));
        socket.on('disconnect', () => updateConnectionStatus('disconnected', 'Disconnected'));
        socket.on('connect_error', () => updateConnectionStatus('disconnected', 'Connection Error'));
        setupGameEventListeners();
    } catch (error) {
        updateConnectionStatus('disconnected', 'Connection Failed');
    }
}

function setupGameEventListeners() {
    socket.on('joined-room', (data) => {
        playerState.name = data.playerName;
        playerState.roomCode = data.roomCode;
        showWaitingSection();
    });
    
    socket.on('join-error', (data) => {
        showPlayerError(data.message);
        resetJoinForm();
    });
    
    socket.on('game-started', (data) => {
        updateConnectionStatus('connected', 'Game starting...');
    });
    
    socket.on('new-question', (data) => {
        playerState.currentQuestion = data.question;
        playerState.hasAnswered = false;
        showQuestionSection(data.question);
    });
    
    socket.on('answer-confirmed', (data) => {
        playerState.hasAnswered = true;
        showAnswerStatus();
    });
    
    socket.on('your-answer-revealed', (data) => {
        showYourAnswer(data);
    });
    
    socket.on('answers-revealed', (data) => {
        showResults(data);
    });
    
    socket.on('player-joined', () => updatePlayersList());
    socket.on('player-left', () => updatePlayersList());
    
    socket.on('host-disconnected', (data) => {
        showPlayerError('Host has left the game. Please rejoin or start a new game.');
        setTimeout(() => showJoinSection(), 3000);
    });
    
    socket.on('error', (data) => {
        showPlayerError(data.message);
    });
}

function updateConnectionStatus(status, text) {
    const indicator = CONFIG_UTILS.getElement('statusIndicator');
    const statusText = CONFIG_UTILS.getElement('statusText');
    if (indicator && statusText) {
        indicator.className = `status-indicator ${status}`;
        statusText.textContent = text;
    }
}

function showPlayerError(message) {
    const errorDiv = CONFIG_UTILS.setText('joinError', message);
    if (errorDiv) {
        CONFIG_UTILS.show(errorDiv);
        setTimeout(() => CONFIG_UTILS.hide('joinError'), 5000);
    }
}
function resetJoinForm() {
    const joinBtn = CONFIG_UTILS.getElement('joinBtn');
    if (joinBtn) {
        joinBtn.disabled = false;
        joinBtn.innerHTML = '<span>Join Game</span>';
    }
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        CONFIG_UTILS.removeClass(section, 'VISIBLE');
        CONFIG_UTILS.hide(section);
    });
    const targetSection = CONFIG_UTILS.getElement(sectionId);
    if (targetSection) {
        CONFIG_UTILS.show(targetSection);
        CONFIG_UTILS.addClass(targetSection, 'VISIBLE');
    }
}

function showJoinSection() {
    showSection('joinSection');
    playerState = { name: null, roomCode: null, currentQuestion: null, hasAnswered: false };
}

function showWaitingSection() {
    showSection('waitingSection');
    CONFIG_UTILS.setText('currentRoomCode', playerState.roomCode);
    CONFIG_UTILS.setText('currentPlayerName', playerState.name);
    updatePlayersList();
}

function showQuestionSection(question) {
    showSection('questionSection');
    CONFIG_UTILS.hide('answerStatus');
    CONFIG_UTILS.hide('yourAnswerDisplay');
    CONFIG_UTILS.showDisplay('answerOptions', 'flex');
    CONFIG_UTILS.setText('questionRoomCode', playerState.roomCode);
    CONFIG_UTILS.setText('questionPlayerName', playerState.name || '');
    
    let questionText = question.prompt || question.text?.prompt || question.text || 'No question text';
    CONFIG_UTILS.setText('currentQuestion', questionText);
    createAnswerButtons(question.options || []);
}

function showAnswerStatus() {
    CONFIG_UTILS.hideDisplay('answerOptions');
    CONFIG_UTILS.show('answerStatus');
}

function showYourAnswer(data) {
    CONFIG_UTILS.hide('answerStatus');
    const answer = data.answer;
    const answerText = answer.text || answer.value || answer;
    const yourAnswerDiv = CONFIG_UTILS.getElement('yourAnswerDisplay');
    
    if (yourAnswerDiv) {
        CONFIG_UTILS.setText('matchedPlayerName', data.playerName);
        CONFIG_UTILS.setText('yourAnswerText', answerText);
        
        if (data.followUpQuestion) {
            CONFIG_UTILS.setText('followUpQuestionText', data.followUpQuestion);
            CONFIG_UTILS.show('followUpQuestionDisplay');
        } else {
            CONFIG_UTILS.hide('followUpQuestionDisplay');
        }
        CONFIG_UTILS.show('yourAnswerDisplay');
    }
}

function showResults(data) {
    showSection('resultsSection');
    CONFIG_UTILS.setText('resultsQuestion', data.question.text);
    displayResults(data.results);
}

function createAnswerButtons(options) {
    const container = CONFIG_UTILS.getElement('answerOptions');
    if (!container) return;
    container.innerHTML = '';
    CONFIG_UTILS.showDisplay(container, 'flex');
    
    options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'answer-btn';
        button.onclick = () => submitAnswer(option, index);
        
        const textLabel = document.createElement('div');
        textLabel.className = 'answer-btn-text';
        textLabel.textContent = option.text;
        button.appendChild(textLabel);
        
        if (option.image) {
            const img = document.createElement('img');
            let imagePath = option.image.startsWith('../') ? option.image.substring(3) : option.image;
            img.src = imagePath.startsWith('/') ? imagePath : '/' + imagePath;
            img.alt = option.text;
            img.className = 'answer-btn-image';
            img.loading = 'lazy';
            button.appendChild(img);
        }
        container.appendChild(button);
    });
}

function submitAnswer(selectedOption, index) {
    if (playerState.hasAnswered) return;
    const buttons = document.querySelectorAll('.answer-btn');
    buttons.forEach((btn, i) => {
        CONFIG_UTILS.removeClass(btn, 'SELECTED');
        if (i === index) CONFIG_UTILS.addClass(btn, 'SELECTED');
    });
    socket.emit('submit-answer', {
        roomCode: playerState.roomCode,
        answer: {
            text: selectedOption.text,
            value: selectedOption.value || selectedOption.text,
            index: index
        }
    });
}

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
        
        const joinBtn = CONFIG_UTILS.getElement('joinBtn');
        if (joinBtn) {
            joinBtn.disabled = true;
            joinBtn.innerHTML = '<span>Joining...</span>';
        }
        CONFIG_UTILS.hide('joinError');
        
        socket.emit('join-room', {
            playerName: playerName,
            roomCode: roomCode
        });
    });
}

// Setup connection status click handler
function setupConnectionStatusToggle() {
    const connectionStatus = CONFIG_UTILS.getElement('connectionStatus');
    
    if (connectionStatus) {
        connectionStatus.addEventListener('click', () => {
            // Toggle the 'expanded' class to show/hide status text on mobile
            connectionStatus.classList.toggle('expanded'); // Keep as-is (custom class, not in CONFIG)
            
            // Auto-collapse after 3 seconds if expanded
            if (connectionStatus.classList.contains('expanded')) {
                setTimeout(() => {
                    connectionStatus.classList.remove('expanded');
                }, 3000);
            }
        });
    }
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize socket connection
    initializePlayerSocket();
    
    // Setup join form
    setupJoinForm();
    
    // Setup connection status toggle for mobile
    setupConnectionStatusToggle();
    
    // Show join section initially
    showJoinSection();
});

// Handle page visibility changes (important for mobile)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && socket && !socket.connected) {
        socket.connect();
    }
});

// Note: Player data cleanup removed - not needed for session-based multiplayer
// Player state is managed in memory and cleared when leaving the game
