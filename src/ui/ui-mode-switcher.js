import { GAME_CONFIG, CONFIG_UTILS } from '../config/game-config.js';

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

function showOfflineSetup() {
    const elementsToHide = [INDEX_DOM_IDS.NEW_GAME_SECTION, INDEX_DOM_IDS.RESUME_SECTION, INDEX_DOM_IDS.CONNECTION_SECTION, INDEX_DOM_IDS.OFFLINE_FALLBACK];
    elementsToHide.forEach(id => { const element = document.getElementById(id); CONFIG_UTILS.addClass(element, 'HIDDEN'); });
    const offlineSection = document.getElementById(INDEX_DOM_IDS.OFFLINE_SETUP_SECTION);
    CONFIG_UTILS.removeClass(offlineSection, 'HIDDEN');
    updateHeaderForMode(GAME_CONFIG.MODES.OFFLINE);
}

function showMultiplayerSetup() {
    const elementsToHide = [INDEX_DOM_IDS.OFFLINE_SETUP_SECTION, INDEX_DOM_IDS.PLAYER_NAMES_STEP];
    elementsToHide.forEach(id => { const element = document.getElementById(id); CONFIG_UTILS.addClass(element, 'HIDDEN'); });
    const elementsToShow = [INDEX_DOM_IDS.NEW_GAME_SECTION, INDEX_DOM_IDS.RESUME_SECTION, INDEX_DOM_IDS.CONNECTION_SECTION];
    elementsToShow.forEach(id => { const element = document.getElementById(id); CONFIG_UTILS.removeClass(element, 'HIDDEN'); });
    updateHeaderForMode(GAME_CONFIG.MODES.MULTIPLAYER);
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
window.showOfflineSetup = showOfflineSetup;
window.showMultiplayerSetup = showMultiplayerSetup;
window.updateHeaderForMode = updateHeaderForMode;
window.uiModeSwitcher = { showOfflineSetup, showMultiplayerSetup, updateHeaderForMode };