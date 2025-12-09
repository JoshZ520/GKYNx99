// src/core/game-loader.js - Dynamic script loading for game page
// Handles conditional loading of multiplayer scripts based on game mode

import { GAME_CONFIG, CONFIG_UTILS } from '../config/game-config.js';

// === SCRIPT LOADING ===
function initializeGameScripts() {
    // Check if we're in offline mode
    const isOfflineMode = CONFIG_UTILS.getStorageItem('GAME_MODE') === GAME_CONFIG.MODES.OFFLINE;

    if (!isOfflineMode) {
        // Load socket.io and multiplayer manager for online mode only
        const socketScript = document.createElement('script');
        socketScript.src = '/socket.io/socket.io.js';
        document.head.appendChild(socketScript);

        socketScript.onload = function() {
            const multiplayerScript = document.createElement('script');
            multiplayerScript.src = '../src/transport/multiplayer/handler.js';
            multiplayerScript.type = 'module';
            document.head.appendChild(multiplayerScript);
        };

        socketScript.onerror = function() {
            CONFIG_UTILS.setStorageItem('GAME_MODE', GAME_CONFIG.MODES.OFFLINE);
            window.location.reload();
        };
    }
}

// === AUTO-INITIALIZATION ===
// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeGameScripts();
    
    // Initialize theme manager for game page (offline or before room creation)
    if (typeof window.initializeThemeManager === 'function') {
        window.initializeThemeManager();
    } else {
        // Theme utilities might not be loaded yet, try again after a short delay
        setTimeout(() => {
            if (typeof window.initializeThemeManager === 'function') {
                window.initializeThemeManager();
            }
        }, 100);
    }
});

// Make available globally if needed
window.gameLoader = {
    initializeGameScripts
};