// offline/offline.js - ES module
// offline/offline.js - ES module
import {
    generatePlayerInputs as sharedGeneratePlayerInputs,
    updateStartButtonState as sharedUpdateStartButtonState
} from '../scripts/player-setup-utils.js';

// --- Game UI (answer selection) ---
let selectedAnswer = null;

export function displayQuestionOptionsOffline(question) {
    const optionsContainer = document.getElementById('optionsContainer');
    if (!optionsContainer || !question) return;
    optionsContainer.innerHTML = '';
    selectedAnswer = null;
    updateSubmitButtonOffline();

    // Support both new question format (question.options = [..]) and legacy option1/option2
    const opts = [];
    if (Array.isArray(question.options) && question.options.length > 0) {
        question.options.forEach(o => opts.push({ label: o, image: null }));
    } else if (question.option1 || question.option2) {
        if (question.option1) opts.push({ label: question.option1, image: question.images && question.images.option1 });
        if (question.option2) opts.push({ label: question.option2, image: question.images && question.images.option2 });
    }

    // Make preference container visible (mirror game-ui behavior)
    const preferenceContainer = document.getElementById('preferenceContainer');
    if (preferenceContainer) {
        preferenceContainer.classList.remove('hidden');
        preferenceContainer.classList.add('visible');
    }

    opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'preference-option';
        btn.type = 'button';
        btn.textContent = opt.label || '';
        btn.addEventListener('click', () => selectAnswerOffline(opt.label, btn));

        // If image provided, show image inside the button
        if (opt.image) {
            const img = document.createElement('img');
            img.src = opt.image;
            img.alt = opt.label || '';
            img.loading = 'lazy';
            img.style.maxWidth = '100%';
            btn.innerHTML = '';
            btn.appendChild(img);
            const span = document.createElement('span');
            span.textContent = opt.label || '';
            btn.appendChild(span);
        }

        optionsContainer.appendChild(btn);
    });
}

export function selectAnswerOffline(answer, btn) {
    selectedAnswer = answer;
    document.querySelectorAll('.preference-option').forEach(opt => opt.classList.remove('SELECTED'));
    if (btn && btn.classList) btn.classList.add('SELECTED');
    updateSubmitButtonOffline();
}

export function updateSubmitButtonOffline() {
    const submitBtn = document.getElementById('submitButton');
    if (!submitBtn) return;
    const disabled = !selectedAnswer;
    submitBtn.disabled = disabled;
    submitBtn.classList.toggle('disabled', disabled);
}

export function getSelectedAnswerOffline() {
    return selectedAnswer;
}

// --- Player setup (index page) ---
export function generatePlayerInputs(countOrValue) {
    const count = typeof countOrValue === 'string' ? parseInt(countOrValue, 10) : Number(countOrValue);
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

export function updateOfflineStartButton() {
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

export function startOfflineGame() {
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

export async function loadOfflineHtmlElements() {
    try {
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

export async function loadOfflineIndexHtmlElements() {
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

export function initOfflineAutoLoad() {
    if (sessionStorage.getItem('gameMode') !== 'offline') return;
    window.addEventListener('DOMContentLoaded', () => {
        const path = window.location.pathname || '';
        if (path.includes('game.html')) loadOfflineHtmlElements();
        else if (path.includes('index.html')) loadOfflineIndexHtmlElements();
    });
}

export function attachToWindow() {
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

    // Ensure the offline Start button (#startGame) is wired to startOfflineGame.
    function wireIndexStartButton() {
        try {
            const btn = document.getElementById('startGame');
            if (btn && !btn._offlineWired) {
                btn.addEventListener('click', startOfflineGame);
                btn._offlineWired = true;
            }
        } catch (e) {
            // ignore any timing issues
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

    // Expose a helper `checkOfflineMode` so game-core can call it during init to switch UI
    // to offline versions where appropriate.
    window.checkOfflineMode = function checkOfflineMode() {
        try {
            const isOffline = sessionStorage.getItem('gameMode') === 'offline' || sessionStorage.getItem('offlineMode') === 'true';
            if (!isOffline) return;
            // Replace gameUI display/select functions with offline implementations
            if (window.gameUI) {
                window.gameUI.displayQuestionOptions = displayQuestionOptionsOffline;
                window.gameUI.selectPreference = function(choice) {
                    // Map to offline select; choice might be option1/option2 or label text
                    if (choice === 'option1' || choice === 'option2') {
                        // Try to map to text labels in DOM
                        const labelElem = document.getElementById(choice === 'option1' ? 'option1Label' : 'option2Label');
                        const text = labelElem ? labelElem.textContent : null;
                        if (text) return selectAnswerOffline(text, document.querySelector(`.preference-option:contains("${text}")`));
                    }
                    // Fallback: treat choice as label text
                    return selectAnswerOffline(choice, null);
                };
            }
        } catch (e) {
            console.error('checkOfflineMode failed:', e);
        }
    };

if (typeof document !== 'undefined' && document.currentScript && document.currentScript.type !== 'module') {
    attachToWindow();
    initOfflineAutoLoad();
}
