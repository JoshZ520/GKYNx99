// src/features/customize/customize.js - Game customization utility
// Provides functions for customizing game configuration (topics, question count, style)
// Can be used as a dropdown or inline configuration on index/game pages

// === GAME CONFIGURATION STATE ===
let gameConfig = {
    selectedTopics: new Set(),
    questionCount: 10,
    gameStyle: 'balanced',
    isCustomGame: false
};

// === PRESET CONFIGURATIONS ===
const GAME_PRESETS = {
    quickStart: {
        name: 'Quick Start',
        description: '5 questions, random topics',
        questionCount: 5,
        topics: [], // Will use all available
        style: 'random'
    },
    standard: {
        name: 'Standard Game',
        description: '10 questions, balanced mix',
        questionCount: 10,
        topics: [],
        style: 'balanced'
    },
    deepDive: {
        name: 'Deep Dive',
        description: '15 questions, progressive depth',
        questionCount: 15,
        topics: [],
        style: 'progressive'
    },
    foodFocused: {
        name: 'Food & Dining',
        description: 'All food-related questions',
        questionCount: 10,
        topics: ['food'],
        style: 'random'
    },
    travelAdventure: {
        name: 'Travel & Adventure',
        description: 'Explore wanderlust topics',
        questionCount: 10,
        topics: ['travel', 'activity'],
        style: 'balanced'
    }
};

/**
 * Apply a preset configuration
 * @param {string} presetName - Name of the preset to apply
 * @returns {Object} The applied configuration
 */
export function applyPreset(presetName) {
    const preset = GAME_PRESETS[presetName];
    if (!preset) {
        console.error(`Preset "${presetName}" not found`);
        return null;
    }
    
    gameConfig.questionCount = preset.questionCount;
    gameConfig.gameStyle = preset.style;
    gameConfig.selectedTopics = new Set(preset.topics);
    gameConfig.isCustomGame = true;
    
    return { ...gameConfig, selectedTopics: Array.from(gameConfig.selectedTopics) };
}

/**
 * Get all available presets
 * @returns {Object} All preset configurations
 */
export function getPresets() {
    return GAME_PRESETS;
}

/**
 * Set question count for custom game
 * @param {number} count - Number of questions
 */
export function setQuestionCount(count) {
    gameConfig.questionCount = parseInt(count, 10) || 10;
    gameConfig.isCustomGame = true;
}

/**
 * Set game style
 * @param {string} style - 'balanced', 'random', or 'progressive'
 */
export function setGameStyle(style) {
    gameConfig.gameStyle = style;
    gameConfig.isCustomGame = true;
}

/**
 * Add or remove a topic from selection
 * @param {string} topicValue - Topic identifier
 */
export function toggleTopic(topicValue) {
    if (gameConfig.selectedTopics.has(topicValue)) {
        gameConfig.selectedTopics.delete(topicValue);
    } else {
        gameConfig.selectedTopics.add(topicValue);
    }
    gameConfig.isCustomGame = true;
}

/**
 * Get current game configuration
 * @returns {Object} Current configuration with selectedTopics as array
 */
export function getCurrentConfig() {
    return {
        ...gameConfig,
        selectedTopics: Array.from(gameConfig.selectedTopics)
    };
}

/**
 * Generate and save custom game configuration to session storage
 * @returns {Object|null} The generated config or null if invalid
 */
export function generateAndSaveConfig() {
    // Validate configuration
    if (gameConfig.selectedTopics.size === 0) {
        gameConfig.selectedTopics = new Set(); // Use all topics
    }
    
    if (gameConfig.questionCount < 1) {
        console.error('Question count must be at least 1');
        return null;
    }
    
    const config = {
        isCustomGame: gameConfig.isCustomGame,
        questionLimit: gameConfig.questionCount,
        selectedTopics: Array.from(gameConfig.selectedTopics),
        gameStyle: gameConfig.gameStyle,
        createdAt: new Date().toISOString()
    };
    
    // Save to session storage
    sessionStorage.setItem('customGameConfig', JSON.stringify(config));
    
    return config;
}

/**
 * Reset configuration to defaults
 */
export function resetConfig() {
    gameConfig = {
        selectedTopics: new Set(),
        questionCount: 10,
        gameStyle: 'balanced',
        isCustomGame: false
    };
}

/**
 * Check if a custom game configuration exists in session storage
 * @returns {boolean}
 */
export function hasCustomConfig() {
    return sessionStorage.getItem('customGameConfig') !== null;
}

/**
 * Load custom configuration from session storage
 * @returns {Object|null}
 */
export function loadCustomConfig() {
    try {
        const stored = sessionStorage.getItem('customGameConfig');
        return stored ? JSON.parse(stored) : null;
    } catch (error) {
        console.error('Failed to load custom config:', error);
        return null;
    }
}

// === EXPORTS FOR GLOBAL ACCESS ===
window.gameCustomize = {
    applyPreset,
    getPresets,
    setQuestionCount,
    setGameStyle,
    toggleTopic,
    getCurrentConfig,
    generateAndSaveConfig,
    resetConfig,
    hasCustomConfig,
    loadCustomConfig
};