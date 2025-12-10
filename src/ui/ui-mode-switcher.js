import { GAME_CONFIG, CONFIG_UTILS } from '../config/game-config.js';

const INDEX_DOM_IDS = {
    NEW_GAME_SECTION: 'newGameSection',
    RESUME_SECTION: 'resumeSection',
    CONNECTION_SECTION: 'connectionSection',
    FRONT_INSTRUCTION: 'front-instruction'
};

// Simplified - only multiplayer mode now
function updateHeaderForMode() {
    const tagline = document.querySelector('.tagline');
    const instruction = document.getElementById(INDEX_DOM_IDS.FRONT_INSTRUCTION);
    
    if (tagline) tagline.textContent = 'A fun conversation game where everyone plays on their phone';
    if (instruction) instruction.textContent = 'Host creates the game, everyone joins with their phones using the room code!';
}

window.updateHeaderForMode = updateHeaderForMode;
window.uiModeSwitcher = { updateHeaderForMode };
