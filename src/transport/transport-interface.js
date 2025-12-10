import { CONFIG_UTILS } from '../config/game-config.js';

let currentHandler = null;
let isInitialized = false;

function initialize() {
    if (isInitialized) return;
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
    return currentHandler && currentHandler.getMode ? currentHandler.getMode() : 'multiplayer';
}
function isMultiplayer() { return true; } // Always multiplayer now

function initializeModeUI() {
    // Always multiplayer mode - show only multiplayer elements
    CONFIG_UTILS.show('answerProgressContainer');
    CONFIG_UTILS.show('multiplayerInfo');
    CONFIG_UTILS.show('createRoomSection');
}

function showResults(resultsData) {
    if (!currentHandler) {
        console.error('No handler registered for results display');
        return;
    }
    
    CONFIG_UTILS.hide('gameContainer');
    const resultsSection = CONFIG_UTILS.getElement('gameResults');
    if (!resultsSection) { 
        console.error('Results section not found'); 
        return; 
    }
    
    CONFIG_UTILS.show(resultsSection);
    
    if (currentHandler.populateResults) {
        currentHandler.populateResults(resultsData);
    } else {
        console.warn('Current handler does not implement populateResults()');
    }
}
function hideResults() {
    CONFIG_UTILS.hide('gameResults');
    CONFIG_UTILS.show('gameContainer');
}

window.transport = { initialize, registerHandler, isActive, broadcastQuestion, submitAnswer, revealAnswers, getMode, isMultiplayer, initializeModeUI, showResults, hideResults };
document.addEventListener('DOMContentLoaded', initialize);
