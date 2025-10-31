// Player-side JavaScript for Table Talk multiplayer
console.log('🎮 Player client loaded');

// Global state
let socket = null;
let playerState = {
    name: null,
    roomCode: null,
    currentQuestion: null,
    hasAnswered: false
};

// Initialize socket connection
function initializeSocket() {
    try {
        socket = io();
        
        socket.on('connect', () => {
            console.log('✅ Connected to server');
            updateConnectionStatus('connected', 'Connected');
        });
        
        socket.on('disconnect', () => {
            console.log('❌ Disconnected from server');
            updateConnectionStatus('disconnected', 'Disconnected');
        });
        
        socket.on('connect_error', (error) => {
            console.error('❌ Connection error:', error);
            updateConnectionStatus('disconnected', 'Connection Error');
        });
        
        // Game event listeners
        setupGameEventListeners();
        
    } catch (error) {
        console.error('❌ Failed to initialize socket:', error);
        updateConnectionStatus('disconnected', 'Connection Failed');
    }
}

// Setup all game-related socket event listeners
function setupGameEventListeners() {
    // Join success
    socket.on('joined-room', (data) => {
        console.log('🎉 Successfully joined room:', data);
        playerState.name = data.playerName;
        playerState.roomCode = data.roomCode;
        
        showWaitingSection();
    });
    
    // Join error
    socket.on('join-error', (data) => {
        console.log('❌ Join error:', data);
        showError(data.message);
        resetJoinForm();
    });
    
    // New question received
    socket.on('new-question', (data) => {
        console.log('❓ New question received:', data);
        playerState.currentQuestion = data.question;
        playerState.hasAnswered = false;
        
        showQuestionSection(data.question);
    });
    
    // Answer confirmation
    socket.on('answer-confirmed', (data) => {
        console.log('✅ Answer confirmed:', data);
        playerState.hasAnswered = true;
        showAnswerStatus();
    });
    
    // Results revealed
    socket.on('answers-revealed', (data) => {
        console.log('📊 Results revealed:', data);
        showResults(data);
    });
    
    // Other players joining/leaving
    socket.on('player-joined', (data) => {
        console.log('👤 Player joined:', data);
        updatePlayersList();
    });
    
    socket.on('player-left', (data) => {
        console.log('👋 Player left:', data);
        updatePlayersList();
    });
    
    // Host disconnected
    socket.on('host-disconnected', (data) => {
        console.log('🏠 Host disconnected:', data);
        showError('Host has left the game. Please rejoin or start a new game.');
        setTimeout(() => {
            showJoinSection();
        }, 3000);
    });
    
    // General errors
    socket.on('error', (data) => {
        console.log('❌ Error:', data);
        showError(data.message);
    });
}

// Update connection status indicator
function updateConnectionStatus(status, text) {
    const indicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    
    if (indicator && statusText) {
        indicator.className = `status-indicator ${status}`;
        statusText.textContent = text;
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('joinError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDiv.classList.add('hidden');
        }, 5000);
    }
}

// Reset join form
function resetJoinForm() {
    const joinBtn = document.getElementById('joinBtn');
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
        section.classList.add('hidden');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
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
    document.getElementById('currentRoomCode').textContent = playerState.roomCode;
    document.getElementById('currentPlayerName').textContent = playerState.name;
    
    updatePlayersList();
}

function showQuestionSection(question) {
    showSection('questionSection');
    
    // Update UI
    document.getElementById('questionRoomCode').textContent = playerState.roomCode;
    document.getElementById('currentQuestion').textContent = question.text;
    
    // Create answer buttons
    createAnswerButtons(question.options);
}

function showAnswerStatus() {
    const answerOptions = document.getElementById('answerOptions');
    const answerStatus = document.getElementById('answerStatus');
    
    if (answerOptions && answerStatus) {
        answerOptions.style.display = 'none';
        answerStatus.classList.remove('hidden');
    }
}

function showResults(data) {
    showSection('resultsSection');
    
    // Update question recap
    document.getElementById('resultsQuestion').textContent = data.question.text;
    
    // Show results
    displayResults(data.results);
}

// Create answer buttons based on question options
function createAnswerButtons(options) {
    const container = document.getElementById('answerOptions');
    if (!container) return;
    
    container.innerHTML = '';
    container.style.display = 'flex';
    
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
    
    console.log('📤 Answer submitted:', selectedOption);
}

// Display results
function displayResults(results) {
    const container = document.getElementById('resultsContent');
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

// Update players list (placeholder for now)
function updatePlayersList() {
    const container = document.getElementById('playersList');
    if (container) {
        // This would need to be populated by server data
        // For now, just show that we're connected
        container.innerHTML = `<div>✅ ${playerState.name} (you)</div>`;
    }
}

// Join form handling
function setupJoinForm() {
    const joinForm = document.getElementById('joinForm');
    const playerNameInput = document.getElementById('playerName');
    const roomCodeInput = document.getElementById('roomCode');
    
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
            showError('Please enter both your name and room code');
            return;
        }
        
        if (roomCode.length !== 4) {
            showError('Room code must be 4 characters');
            return;
        }
        
        // Update button to show loading
        const joinBtn = document.getElementById('joinBtn');
        if (joinBtn) {
            joinBtn.disabled = true;
            joinBtn.innerHTML = '<span>Joining...</span>';
        }
        
        // Clear any previous errors
        document.getElementById('joinError').classList.add('hidden');
        
        // Send join request
        socket.emit('join-room', {
            playerName: playerName,
            roomCode: roomCode
        });
        
        console.log('📤 Join request sent:', { playerName, roomCode });
    });
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Player page initialized');
    
    // Initialize socket connection
    initializeSocket();
    
    // Setup join form
    setupJoinForm();
    
    // Show join section initially
    showJoinSection();
});

// Handle page visibility changes (important for mobile)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && socket && !socket.connected) {
        console.log('🔄 Page visible, reconnecting...');
        socket.connect();
    }
});