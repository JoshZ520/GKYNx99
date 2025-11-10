import { generatePlayerInputs as sharedGeneratePlayerInputs, updateStartButtonState as sharedUpdateStartButtonState } from '../../scripts/player-setup-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Front-offline.js loaded');
    // Only initialize if we're in offline mode or on the main page
        if (document.getElementById('offlineSetupSection') || document.getElementById('playerCountStep')) {
        setupOfflineEventListeners();
    }
});

// Active player setup functionality - combines HTML script + this file
function generatePlayerInputs(selectedValue) {
    const count = typeof selectedValue === 'string' ? parseInt(selectedValue, 10) : Number(selectedValue);
    const playerNamesStep = document.getElementById('playerNamesStep');
    const playerNamesContainer = document.getElementById('playerNamesContainer');
    if (isNaN(count) || count < 2 || count > 20) {
        if (playerNamesStep) playerNamesStep.classList.add('hidden');
        return;
    }
    if (playerNamesStep) playerNamesStep.classList.remove('hidden');
    if (playerNamesContainer) {
        if (typeof sharedGeneratePlayerInputs === 'function') {
            sharedGeneratePlayerInputs(playerNamesContainer, count, updateOfflineStartButton);
        } else {
            playerNamesContainer.innerHTML = '';
            for (let i = 1; i <= count; i++) {
                const playerDiv = document.createElement('div');
                playerDiv.className = 'player-input-group';
                const label = document.createElement('label');
                label.textContent = `Player ${i}:`;
                label.htmlFor = `player_${i}`;
                const input = document.createElement('input');
                input.type = 'text';
                input.id = `player_${i}`;
                input.name = `player_${i}`;
                input.placeholder = `Enter name for Player ${i}`;
                input.required = true;
                input.addEventListener('input', updateOfflineStartButton);
                playerDiv.appendChild(label);
                playerDiv.appendChild(input);
                playerNamesContainer.appendChild(playerDiv);
            }
        }
    }
    updateOfflineStartButton();
}

// Remove the duplicate initializePlayerSetup function since player-setup.js handles this

function updateOfflineStartButton() {
    const startBtn = document.getElementById('startGame');
    if (!startBtn) return;
    const inputs = document.querySelectorAll('#playerNamesContainer input');
    const names = Array.from(inputs).map(i => i.value || '');
    if (typeof sharedUpdateStartButtonState === 'function') {
        sharedUpdateStartButtonState(startBtn, names);
        if (startBtn.disabled) startBtn.classList.add('disabled');
        else startBtn.classList.remove('disabled');
        return;
    }
    const allFilled = names.every(n => n && n.trim() !== '');
    const lower = names.map(n => (n || '').trim().toLowerCase());
    const hasDuplicates = new Set(lower).size !== lower.length;
    if (!allFilled) {
        startBtn.disabled = true;
        startBtn.classList.add('disabled');
        const span = startBtn.querySelector('span');
        if (span) span.textContent = 'Fill all player names to start';
    } else if (hasDuplicates) {
        startBtn.disabled = true;
        startBtn.classList.add('disabled');
        const span = startBtn.querySelector('span');
        if (span) span.textContent = 'Player names must be unique';
    } else {
        startBtn.disabled = false;
        startBtn.classList.remove('disabled');
        const span = startBtn.querySelector('span');
        if (span) span.textContent = 'Start Game';
    }
}

function startOfflineGame() {
    const playerInputs = document.querySelectorAll('#playerNamesContainer input');
    if (!playerInputs || playerInputs.length === 0) {
        alert('Please select number of players first');
        return;
    }
    const players = Array.from(playerInputs).map((input, index) => ({
        id: `offline_player_${index + 1}`,
        name: (input.value || '').trim(),
        isHost: index === 0
    }));
    const names = players.map(p => p.name.toLowerCase());
    if (names.some(n => !n) || new Set(names).size !== names.length) {
        alert('Please ensure all player names are unique and filled');
        return;
    }
    if (typeof window.loadQuestions !== 'function') {
        console.error('Question loading system not available');
        alert('Question system not loaded. Please refresh the page and try again.');
        return;
    }
    window.loadQuestions().then(() => {
        sessionStorage.setItem('gameMode', 'offline');
        sessionStorage.setItem('offlineMode', 'true');
        sessionStorage.setItem('playerNames', JSON.stringify(players.map(p => p.name)));
        sessionStorage.setItem('playerData', JSON.stringify(players));
        sessionStorage.setItem('playerCount', players.length);
        window.location.href = '../pages/game.html';
    }).catch(err => {
        console.error('Failed to load questions:', err);
        alert('Failed to load questions. Please check your connection and try again.');
    });
}

function setupOfflineEventListeners() {
    // Set up start button click handler
    const startButton = document.getElementById('startGame');
    if (startButton && !startButton._offlineWired) {
        startButton.addEventListener('click', startOfflineGame);
        startButton._offlineWired = true;
    }
    // Add input event listeners for real-time validation
    document.addEventListener('input', function(e) {
        if (e.target.matches('#playerNamesContainer input')) {
            updateOfflineStartButton();
        }
    });
// --- Preference selection logic ---
function displayQuestionOptionsOffline(question) {
    const optionsContainer = document.getElementById('optionsContainer');
    if (!optionsContainer || !question) return;
    optionsContainer.innerHTML = '';
    selectedAnswer = null;
    updateSubmitButtonOffline();
    const opts = [];
    if (Array.isArray(question.options) && question.options.length > 0) {
        question.options.forEach(o => opts.push({ label: o, image: null }));
    } else if (question.option1 || question.option2) {
        if (question.option1) opts.push({ label: question.option1, image: question.images && question.images.option1 });
        if (question.option2) opts.push({ label: question.option2, image: question.images && question.images.option2 });
    }
    const preferenceContainer = document.getElementById('preferenceContainer');
    if (preferenceContainer) {
        preferenceContainer.classList.remove('hidden');
        preferenceContainer.classList.add('visible');
    }
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

function selectAnswerOffline(answer, btn) {
    selectedAnswer = answer;
    document.getElementById('selectedPreference').value = answer;
    document.querySelectorAll('.preference-option').forEach(opt => opt.classList.remove('selected'));
    if (btn && btn.classList) btn.classList.add('selected');
    updateSubmitButtonOffline();
}

function updateSubmitButtonOffline() {
    const submitBtn = document.getElementById('submitButton');
    if (!submitBtn) return;
    const disabled = !selectedAnswer;
    submitBtn.disabled = disabled;
    submitBtn.classList.toggle('disabled', disabled);
}

function getSelectedAnswerOffline() {
    const input = document.getElementById('selectedPreference');
    return input ? input.value : selectedAnswer;
}

// --- HTML injection logic ---
async function loadOfflineHtmlElements() {
    try {
        if (document.getElementById('offlinePlayerIndicator')) return;
        const res = await fetch('../offline/offline.html');
        const html = await res.text();
        const container = document.createElement('div');
        container.innerHTML = html;
        const main = document.querySelector('main');
        if (!main) return;
        Array.from(container.children).forEach(child => main.insertBefore(child, main.firstChild));
    } catch (err) {
        console.error('Failed to load offline HTML elements:', err);
    }
}

async function loadOfflineIndexHtmlElements() {
    try {
        const res = await fetch('../offline/offline.html');
        const html = await res.text();
        const container = document.createElement('div');
        container.innerHTML = html;
        const offlineSetupSection = container.querySelector('#offline-setup-section');
        if (offlineSetupSection) {
            const main = document.querySelector('main') || document.body;
            main.insertBefore(offlineSetupSection, main.firstChild);
        }
    } catch (err) {
        console.error('Failed to load offline setup section:', err);
    }
}

function initOfflineAutoLoad() {
    if (sessionStorage.getItem('gameMode') !== 'offline') return;
    window.addEventListener('DOMContentLoaded', () => {
        const path = window.location.pathname || '';
        if (path.includes('game.html')) loadOfflineHtmlElements();
        else if (path.includes('index.html')) loadOfflineIndexHtmlElements();
    });
}

function attachToWindow() {
    if (typeof window === 'undefined') return;
    window.displayQuestionOptionsOffline = displayQuestionOptionsOffline;
    window.selectAnswerOffline = selectAnswerOffline;
    window.updateSubmitButtonOffline = updateSubmitButtonOffline;
    window.getSelectedAnswerOffline = getSelectedAnswerOffline;
    window.generatePlayerInputs = generatePlayerInputs;
    window.updateOfflineStartButton = updateOfflineStartButton;
    window.startOfflineGame = startOfflineGame;
    window.loadOfflineHtmlElements = loadOfflineHtmlElements;
    window.loadOfflineIndexHtmlElements = loadOfflineIndexHtmlElements;
    window.submitOfflineAnswer = function submitOfflineAnswer() {
        const ans = getSelectedAnswerOffline();
        if (!ans) { alert('Please select an answer before submitting.'); return; }
        alert('Answer submitted: ' + ans);
    };
    function wireIndexStartButton() {
        try {
            const btn = document.getElementById('startGame');
            if (btn && !btn._offlineWired) {
                btn.addEventListener('click', startOfflineGame);
                btn._offlineWired = true;
            }
        } catch (e) {
            console.error('Failed to wire offline start button:', e);
        }
    }
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', wireIndexStartButton);
        } else {
            wireIndexStartButton();
        }
    }
}

window.checkOfflineMode = function checkOfflineMode() {
    try {
        const isOffline = sessionStorage.getItem('gameMode') === 'offline' || sessionStorage.getItem('offlineMode') === 'true';
        if (!isOffline) return;
        if (window.gameUI) {
            window.gameUI.displayQuestionOptions = displayQuestionOptionsOffline;
            window.gameUI.selectPreference = function(choice) {
                if (choice === 'option1' || choice === 'option2') {
                    const labelElem = document.getElementById(choice === 'option1' ? 'option1Label' : 'option2Label');
                    const text = labelElem ? labelElem.textContent : null;
                    if (text) return selectAnswerOffline(text, document.querySelector(`.preference-option:contains("${text}")`));
                }
                return selectAnswerOffline(choice, null);
            };
        }
    } catch (e) {
        console.error('checkOfflineMode failed:', e);
    }
};
}

// Make generatePlayerInputs available globally for HTML oninput attribute
window.generatePlayerInputs = generatePlayerInputs;