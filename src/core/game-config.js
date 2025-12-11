// game-config.js - Centralized configuration for the entire game
// All magic numbers, strings, and settings in one place

export const GAME_CONFIG = {
    // === TIMING & ANIMATIONS ===
    ANIMATIONS: {
        TURN_INDICATOR_DURATION: 600,      // Player turn animation
        MESSAGE_DISPLAY_TIME: 3000,        // Success/error messages
        FADE_TRANSITION: 300,              // UI fade in/out
        UI_UPDATE_DELAY: 0                 // DOM update delay
    },

    // === SESSION STORAGE KEYS ===
    STORAGE_KEYS: {
        PLAYER_NAMES: 'playerNames',
        PLAYER_DATA: 'playerData',
        PLAYER_COUNT: 'playerCount',
        SUBMISSIONS: 'submissionsByQuestion',
        QUESTIONS_ORDER: 'questionsInOrder',
        GAME_START_TIME: 'gameStartTime',
        CUSTOM_CONFIG: 'customGameConfig'
    },

    // === LOCAL STORAGE KEYS ===
    LOCAL_STORAGE_KEYS: {
        CURRENT_TOPIC: 'currentTopic'
    },

    // === DOM ELEMENT IDS ===
    DOM_IDS: {
        QUESTION: 'question',
        SUBMIT_BUTTON: 'submitButton',
        PREV_PAGE_BTN: 'prevPageBtn',
        NEXT_PAGE_BTN: 'nextPageBtn',
        PREFERENCE_CONTAINER: 'preferenceContainer',
        OPTION1_LABEL: 'option1Label',
        OPTION2_LABEL: 'option2Label',
        OPTION1_IMAGE: 'option1Image',
        OPTION2_IMAGE: 'option2Image',
        SELECTED_PREFERENCE: 'selectedPreference',
        PLAYER_TURN_INDICATOR: 'playerTurnIndicator',
        ANSWER_INPUT: 'answerInput',
        GAME_RESULTS: 'gameResults',
        RESULTS_CONTENT: 'resultsContent'
    },

    // === CSS CLASSES ===
    CSS_CLASSES: {
        HIDDEN: 'hidden',
        VISIBLE: 'visible',
        FADE_IN: 'fade-in',
        FADE_OUT: 'fade-out',
        ACTIVE: 'active',
        SELECTED: 'selected'
    },

    // === NAVIGATION DIRECTIONS ===
    NAVIGATION: {
        PREV: 'prev',
        NEXT: 'next'
    },

    // === FILE PATHS ===
    PATHS: {
        TOPICS_INDEX: {
            FROM_PAGES: '../src/data/questions/topics/index.json',
            FROM_ROOT: 'src/data/questions/topics/index.json'
        }
    },

    // === PLAYER LIMITS ===
    PLAYERS: {
        MIN_COUNT: 2,
        MAX_COUNT: 20
    },

    // === UI DIMENSIONS ===
    UI: {
        RESULTS_MAX_HEIGHT: '300px',
        MODAL_MAX_WIDTH: '600px', 
        CARD_MAX_WIDTH: '720px',
        ROOM_CODE_WIDTH: '300px'
    },

    // === DISPLAY VALUES ===
    DISPLAY: {
        BLOCK: 'block',
        NONE: 'none'
    },

    // === DEFAULT VALUES ===
    DEFAULTS: {
        QUESTION_INDEX: 0,
        NO_QUESTION_TEXT: 'No question available'
    },

    // === MESSAGES ===
    MESSAGES: {
        GAME_COMPLETE: 'Game Complete! Thanks for playing Table Talk!',
        GAME_RESUMED: ' Game resumed! Continue where you left off.',
        LOADED_TOPICS: 'Loaded topics index:',
        AVAILABLE_TOPICS: 'Available topics:',
        FAILED_LOAD_TOPICS: 'Failed to load topics:'
    },

    // === VALIDATION ===
    VALIDATION: {
        REQUIRED_NAME_LENGTH: 1,
        MAX_QUESTION_LENGTH: 500,
        MAX_ANSWER_LENGTH: 100
    }
};

// === COMPUTED VALUES ===
// Values that depend on other config values
export const COMPUTED_CONFIG = {
    // CSS custom properties that can be used in stylesheets
    getCSSVariables: () => ({
        '--results-max-height': GAME_CONFIG.UI.RESULTS_MAX_HEIGHT,
        '--modal-max-width': GAME_CONFIG.UI.MODAL_MAX_WIDTH,
        '--card-max-width': GAME_CONFIG.UI.CARD_MAX_WIDTH
    })
};

// === UTILITY FUNCTIONS ===
export const CONFIG_UTILS = {
    // Easy access to session storage with proper keys
    getStorageItem: (key) => sessionStorage.getItem(GAME_CONFIG.STORAGE_KEYS[key]),
    setStorageItem: (key, value) => sessionStorage.setItem(GAME_CONFIG.STORAGE_KEYS[key], value),
    removeStorageItem: (key) => sessionStorage.removeItem(GAME_CONFIG.STORAGE_KEYS[key]),
    
    // Easy access to local storage with proper keys
    getLocalStorageItem: (key) => localStorage.getItem(GAME_CONFIG.LOCAL_STORAGE_KEYS[key]),
    setLocalStorageItem: (key, value) => localStorage.setItem(GAME_CONFIG.LOCAL_STORAGE_KEYS[key], value),
    
    // DOM element access with proper IDs
    getElementById: (elementKey) => document.getElementById(GAME_CONFIG.DOM_IDS[elementKey]),
    
    // Direct element access (accepts either ID string or element)
    getElement: (elementOrId) => {
        if (typeof elementOrId === 'string') {
            return document.getElementById(elementOrId);
        }
        return elementOrId;
    },
    
    // CSS class manipulation helpers
    addClass: (element, classKey) => element?.classList.add(GAME_CONFIG.CSS_CLASSES[classKey]),
    removeClass: (element, classKey) => element?.classList.remove(GAME_CONFIG.CSS_CLASSES[classKey]),
    
    // Path resolution helper
    getTopicsPath: () => window.location.pathname.includes('/pages/') 
        ? GAME_CONFIG.PATHS.TOPICS_INDEX.FROM_PAGES 
        : GAME_CONFIG.PATHS.TOPICS_INDEX.FROM_ROOT,
    
    // Check game mode easily
    isMultiplayerMode: () => true, // Always multiplayer now
    
    // Validation helpers
    isValidPlayerCount: (count) => count >= GAME_CONFIG.PLAYERS.MIN_COUNT && 
                                  count <= GAME_CONFIG.PLAYERS.MAX_COUNT,
    
    // DOM visibility helpers (classList-based)
    show: (elementOrId) => {
        const el = typeof elementOrId === 'string' 
            ? document.getElementById(elementOrId) 
            : elementOrId;
        if (el) el.classList.remove(GAME_CONFIG.CSS_CLASSES.HIDDEN);
        return el;
    },
    
    hide: (elementOrId) => {
        const el = typeof elementOrId === 'string' 
            ? document.getElementById(elementOrId) 
            : elementOrId;
        if (el) el.classList.add(GAME_CONFIG.CSS_CLASSES.HIDDEN);
        return el;
    },
    
    toggle: (elementOrId, force) => {
        const el = typeof elementOrId === 'string' 
            ? document.getElementById(elementOrId) 
            : elementOrId;
        if (el) el.classList.toggle(GAME_CONFIG.CSS_CLASSES.HIDDEN, force);
        return el;
    },
    
    // DOM display style helpers (style.display-based)
    setDisplay: (elementOrId, displayValue = '') => {
        const el = typeof elementOrId === 'string' 
            ? document.getElementById(elementOrId) 
            : elementOrId;
        if (el) el.style.display = displayValue;
        return el;
    },
    
    showDisplay: (elementOrId, displayValue = '') => {
        const el = typeof elementOrId === 'string' 
            ? document.getElementById(elementOrId) 
            : elementOrId;
        if (el) el.style.display = displayValue;
        return el;
    },
    
    hideDisplay: (elementOrId) => {
        const el = typeof elementOrId === 'string' 
            ? document.getElementById(elementOrId) 
            : elementOrId;
        if (el) el.style.display = 'none';
        return el;
    },
    
    // Text content helpers
    setText: (elementOrId, text) => {
        const el = typeof elementOrId === 'string' 
            ? document.getElementById(elementOrId) 
            : elementOrId;
        if (el) el.textContent = text;
        return el;
    },
    
    setHTML: (elementOrId, html) => {
        const el = typeof elementOrId === 'string' 
            ? document.getElementById(elementOrId) 
            : elementOrId;
        if (el) el.innerHTML = html;
        return el;
    },
    
    // Dynamic script loading for multiplayer mode
    initializeGameScripts: () => {
        const socketScript = document.createElement('script');
        socketScript.src = '/socket.io/socket.io.js';
        document.head.appendChild(socketScript);

        socketScript.onload = function() {
            const multiplayerScript = document.createElement('script');
            multiplayerScript.src = '../src/multiplayer/handler.js';
            multiplayerScript.type = 'module';
            document.head.appendChild(multiplayerScript);
        };

        socketScript.onerror = function() {
            console.error('Failed to load socket.io - multiplayer required');
        };
    }
};