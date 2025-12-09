import { CONFIG_UTILS } from '../config/game-config.js';

let currentHandler = null;
let isInitialized = false;

function initialize() {
    if (isInitialized) return;
    const gameMode = CONFIG_UTILS.getStorageItem('GAME_MODE');
    const isOffline = gameMode === 'offline' || CONFIG_UTILS.getStorageItem('OFFLINE_MODE') === 'true';
    isInitialized = true;
}

function registerHandler(handler) {
    if (handler && handler.isActive && handler.isActive()) currentHandler = handler;
}

function isActive() {
    return currentHandler && currentHandler.isActive ? currentHandler.isActive() : false;
}
function broadcastQuestion(question) {
    if (currentHandler && currentHandler.broadcastQuestion) currentHandler.broadcastQuestion(question);
}
function submitAnswer(answer, playerName) {
    if (currentHandler && currentHandler.submitAnswer) currentHandler.submitAnswer(answer, playerName);
}
function revealAnswers() {
    if (currentHandler && currentHandler.revealAnswers) currentHandler.revealAnswers();
}
function getMode() {
    return currentHandler && currentHandler.getMode ? currentHandler.getMode() : 'unknown';
}
function isMultiplayer() { return getMode() === 'multiplayer' && isActive(); }
function isOffline() { return getMode() === 'offline'; }

function initializeModeUI() {
    let mode = getMode();
    if (mode === 'unknown') {
        const multiplayerRoom = CONFIG_UTILS.getStorageItem('multiplayerRoom');
        const gameMode = CONFIG_UTILS.getStorageItem('GAME_MODE');
        if (multiplayerRoom) mode = 'multiplayer';
        else if (gameMode === 'offline') mode = 'offline';
    }
    const offlineOnlyElements = ['offlineSubmitContainer', 'offlinePlayerIndicator', 'offlineSettings'];
    const multiplayerOnlyElements = ['answerProgressContainer', 'multiplayerInfo', 'createRoomSection'];
    if (mode === 'multiplayer') {
        offlineOnlyElements.forEach(id => { CONFIG_UTILS.hideDisplay(id); CONFIG_UTILS.hide(id); });
        multiplayerOnlyElements.forEach(id => { CONFIG_UTILS.showDisplay(id); CONFIG_UTILS.show(id); });
    } else if (mode === 'offline') {
        offlineOnlyElements.forEach(id => { CONFIG_UTILS.showDisplay(id); CONFIG_UTILS.show(id); });
        multiplayerOnlyElements.forEach(id => { CONFIG_UTILS.hideDisplay(id); CONFIG_UTILS.hide(id); });
    }
}

function showResults(resultsData) {
    CONFIG_UTILS.hideDisplay('gameContainer');
    const resultsSection = CONFIG_UTILS.getElement('gameResults');
    if (!resultsSection) { console.error('Results section not found'); return; }
    CONFIG_UTILS.show(resultsSection);
    if (currentHandler && currentHandler.populateResults) currentHandler.populateResults(resultsData);
    else console.warn('Current handler does not implement populateResults()');
}
function hideResults() {
    CONFIG_UTILS.hide('gameResults');
    CONFIG_UTILS.showDisplay('gameContainer');
}

window.transport = { initialize, registerHandler, isActive, broadcastQuestion, submitAnswer, revealAnswers, getMode, isMultiplayer, isOffline, initializeModeUI, showResults, hideResults };
document.addEventListener('DOMContentLoaded', initialize);
