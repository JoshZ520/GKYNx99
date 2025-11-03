// ui-mode-switcher.js - UI mode switching for index page
// Handles switching between multiplayer and offline setup modes

import { GAME_CONFIG, CONFIG_UTILS } from '../config/game-config.js';

// === DOM IDS FOR INDEX PAGE ===
const INDEX_DOM_IDS = {
    NEW_GAME_SECTION: 'newGameSection',
    RESUME_SECTION: 'resumeSection',
    CONNECTION_SECTION: 'connectionSection',
    OFFLINE_FALLBACK: 'offlineFallback',
    OFFLINE_SETUP_SECTION: 'offlineSetupSection',
    PLAYER_NAMES_STEP: 'playerNamesStep',
    CREATE_ROOM_STEP: 'createRoomStep',
    ROOM_CREATED_STEP: 'roomCreatedStep',
    FRONT_INSTRUCTION: 'front-instruction'
};

// === UI MODE SWITCHING ===
function showOfflineSetup() {
    // Hide multiplayer sections
    const elementsToHide = [
        INDEX_DOM_IDS.NEW_GAME_SECTION,
        INDEX_DOM_IDS.RESUME_SECTION,
        INDEX_DOM_IDS.CONNECTION_SECTION,
        INDEX_DOM_IDS.OFFLINE_FALLBACK
    ];
    
    elementsToHide.forEach(id => {
        const element = document.getElementById(id);
        CONFIG_UTILS.addClass(element, 'HIDDEN');
    });
    
    // Show offline setup section
    const offlineSection = document.getElementById(INDEX_DOM_IDS.OFFLINE_SETUP_SECTION);
    CONFIG_UTILS.removeClass(offlineSection, 'HIDDEN');
    
    // Update header for offline mode
    updateHeaderForMode(GAME_CONFIG.MODES.OFFLINE);
}

function showMultiplayerSetup() {
    // Hide offline sections
    const elementsToHide = [
        INDEX_DOM_IDS.OFFLINE_SETUP_SECTION,
        INDEX_DOM_IDS.PLAYER_NAMES_STEP
    ];
    
    elementsToHide.forEach(id => {
        const element = document.getElementById(id);
        CONFIG_UTILS.addClass(element, 'HIDDEN');
    });
    
    // Show multiplayer sections
    const elementsToShow = [
        INDEX_DOM_IDS.NEW_GAME_SECTION,
        INDEX_DOM_IDS.RESUME_SECTION,
        INDEX_DOM_IDS.CONNECTION_SECTION
    ];
    
    elementsToShow.forEach(id => {
        const element = document.getElementById(id);
        CONFIG_UTILS.removeClass(element, 'HIDDEN');
    });
    
    // Update header for multiplayer mode
    updateHeaderForMode(GAME_CONFIG.MODES.MULTIPLAYER);
    
    // Reset to step 1
    const createRoomStep = document.getElementById(INDEX_DOM_IDS.CREATE_ROOM_STEP);
    const roomCreatedStep = document.getElementById(INDEX_DOM_IDS.ROOM_CREATED_STEP);
    CONFIG_UTILS.removeClass(createRoomStep, 'HIDDEN');
    CONFIG_UTILS.addClass(roomCreatedStep, 'HIDDEN');
}

function updateHeaderForMode(mode) {
    const tagline = document.querySelector('.tagline');
    const instruction = document.getElementById(INDEX_DOM_IDS.FRONT_INSTRUCTION);
    
    if (mode === GAME_CONFIG.MODES.OFFLINE) {
        if (tagline) tagline.textContent = 'Offline Mode - Single Device Game';
        if (instruction) instruction.textContent = 'Everyone takes turns on this device - pass it around after each turn!';
    } else {
        if (tagline) tagline.textContent = 'A fun conversation game where everyone plays on their phone';
        if (instruction) instruction.textContent = 'Host creates the game, everyone joins with their phones using the room code!';
    }
}

// === EXPORTS ===
// Make functions available globally for HTML onclick handlers
window.showOfflineSetup = showOfflineSetup;
window.showMultiplayerSetup = showMultiplayerSetup;
window.updateHeaderForMode = updateHeaderForMode;

// Also export as module
window.uiModeSwitcher = {
    showOfflineSetup,
    showMultiplayerSetup,
    updateHeaderForMode
};