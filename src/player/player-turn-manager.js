// src/player/player-turn-manager.js - Player turn management and indicators

import { GAME_CONFIG } from '../config/game-config.js';

// Shared state
let playerNames = [];
let currentPlayerIndex = 0;

/**
 * Get the name of the current player
 * @returns {string} Current player name
 */
export function getCurrentPlayerName() {
    if (playerNames.length === 0) return 'Player';
    return playerNames[currentPlayerIndex] || 'Unknown Player';
}

/**
 * Get the current player index
 * @returns {number} Current player index
 */
export function getCurrentPlayerIndex() {
    return currentPlayerIndex;
}

/**
 * Get all player names
 * @returns {string[]} Array of player names
 */
export function getPlayerNames() {
    return playerNames;
}

/**
 * Set player names
 * @param {string[]} names - Array of player names
 */
export function setPlayerNames(names) {
    playerNames = names;
}

/**
 * Set current player index
 * @param {number} index - Player index
 */
export function setCurrentPlayerIndex(index) {
    currentPlayerIndex = index;
}

/**
 * Advance to the next player and update UI
 */
export function advanceToNextPlayer() {
    if (playerNames.length === 0) return;
    
    currentPlayerIndex = (currentPlayerIndex + 1) % playerNames.length;
    updatePlayerTurnIndicator();
    
    // Clear the selection for the next player
    if (window.gameCore) {
        window.gameCore.clearCurrentSelection();
    }
}

/**
 * Update the player turn indicator UI
 */
export function updatePlayerTurnIndicator() {
    // Multiplayer mode - player turn handled by server
    // This function is kept for compatibility but doesn't display anything
}
