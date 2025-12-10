import { CONFIG_UTILS } from '../config/game-config.js';
import { generatePlayerInputs, updateOfflineStartButton, startOfflineGame, setupOfflineEventListeners } from './offline/player-setup.js';
import { displayQuestionOptionsOffline, selectAnswerOffline, updateSubmitButtonOffline, getSelectedAnswerOffline, submitOfflineAnswer } from './offline/game-handler.js';
import { populateResults } from './offline/results.js';

// === HTML LOADING UTILITIES ===
export async function loadOfflineHtmlElements() {
    try {
        if (document.getElementById('offlinePlayerIndicator')) return;
        const res = await fetch('../offline/offline.html');
        const html = await res.text();
        const container = document.createElement('div');
        container.innerHTML = html;
        const main = document.querySelector('main');
        if (!main) return;
        Array.from(container.children).forEach(child => main.insertBefore(child, main.firstChild));
    } catch (err) { console.error('Failed to load offline HTML elements:', err); }
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
    } catch (err) { console.error('Failed to load offline setup section:', err); }
}

export function initOfflineAutoLoad() {
    if (sessionStorage.getItem('gameMode') !== 'offline') return;
    window.addEventListener('DOMContentLoaded', () => {
        const path = window.location.pathname || '';
        if (path.includes('game.html')) loadOfflineHtmlElements();
        else if (path.includes('index.html')) loadOfflineIndexHtmlElements();
    });
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('offlineSetupSection') || document.getElementById('playerCountStep')) {
        setupOfflineEventListeners();
    }
});

function attachToWindow() {
    if (typeof window === 'undefined') return;
    window.generatePlayerInputs = generatePlayerInputs;
    window.updateOfflineStartButton = updateOfflineStartButton;
    window.startOfflineGame = startOfflineGame;
    window.displayQuestionOptionsOffline = displayQuestionOptionsOffline;
    window.selectAnswerOffline = selectAnswerOffline;
    window.updateSubmitButtonOffline = updateSubmitButtonOffline;
    window.getSelectedAnswerOffline = getSelectedAnswerOffline;
    window.submitOfflineAnswer = submitOfflineAnswer;
    wireOfflineFunctions();
}
function wireOfflineFunctions() {
    if (CONFIG_UTILS.getStorageItem('GAME_MODE') !== 'offline') return;
    if (!window.displayQuestionOptionsOffline) { setTimeout(wireOfflineFunctions, 50); return; }
    window.displayQuestionOptions = window.displayQuestionOptionsOffline;
    window.selectPreference = window.selectAnswerOffline;
    window.updateSubmitButton = window.updateSubmitButtonOffline;
}

function wireIndexStartButton() {
    try {
        const btn = CONFIG_UTILS.getElement('startGame');
        if (btn && !btn._offlineWired) { btn.addEventListener('click', startOfflineGame); btn._offlineWired = true; }
    } catch (e) { console.error('Failed to wire offline start button:', e); }
}
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireIndexStartButton);
    else wireIndexStartButton();
}
window.checkOfflineMode = function checkOfflineMode() {
    try {
        const isOffline = CONFIG_UTILS.getStorageItem('GAME_MODE') === 'offline';
        if (!isOffline) return;
        if (window.transport && window.transport.initializeModeUI) window.transport.initializeModeUI();
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
    } catch (e) { console.error('checkOfflineMode failed:', e); }
};

const offlineTransportHandler = {
    isActive() { return CONFIG_UTILS.isOfflineMode(); },
    getMode() { return 'offline'; },
    broadcastQuestion(question) {},
    submitAnswer(answer, playerName) {},
    revealAnswers() {},
    populateResults(resultsData) { populateResults(resultsData); }
};
window.offlineTransportHandler = offlineTransportHandler;
function registerOfflineHandler() {
    if (window.transport) {
        window.transport.registerHandler(offlineTransportHandler);
        setTimeout(() => { if (window.transport.initializeModeUI) window.transport.initializeModeUI(); }, 100);
    }
}
if (window.transport) registerOfflineHandler();
else { document.addEventListener('DOMContentLoaded', registerOfflineHandler); setTimeout(registerOfflineHandler, 200); }

attachToWindow();

export { attachToWindow, offlineTransportHandler };