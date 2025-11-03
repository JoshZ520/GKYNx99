// customize.js - Custom game setup interface
// Handles the customize game page UI and configuration creation

// === SETUP STATE ===
let selectedTopics = new Set();
let questionCount = 10;
let gameStyle = 'balanced';

// === TOPIC SELECTION ===
function loadAvailableTopicsForSetup() {
    // TODO: Load topics from the main topic system
    // Display checkboxes for each topic
    // Show question counts per topic
    console.log('Loading topics for custom setup...');
}

function toggleTopicSelection(topicValue) {
    if (selectedTopics.has(topicValue)) {
        selectedTopics.delete(topicValue);
    } else {
        selectedTopics.add(topicValue);
    }
    
    validateSelection();
    updatePreview();
}

function selectAllTopics() {
    // TODO: Add all available topics to selection
    console.log('Selecting all topics...');
}

function selectNoTopics() {
    selectedTopics.clear();
    validateSelection();
    updatePreview();
}

// === QUESTION COUNT MANAGEMENT ===
function setQuestionCount(count) {
    questionCount = parseInt(count, 10) || 10;
    validateSelection();
    updatePreview();
}

function setGameStyle(style) {
    gameStyle = style;
    updatePreview();
}

// === VALIDATION AND PREVIEW ===
function validateSelection() {
    const isValid = selectedTopics.size > 0 && questionCount > 0;
    
    // Update start button state
    const startButton = document.getElementById('startCustomGameBtn');
    if (startButton) {
        startButton.disabled = !isValid;
        startButton.classList.toggle('disabled', !isValid);
    }
    
    return isValid;
}

function updatePreview() {
    // TODO: Show preview of what the game will include
    // - Questions per topic
    // - Estimated time
    // - Warnings about availability
    console.log('Updating preview...', {
        topics: Array.from(selectedTopics),
        questionCount,
        gameStyle
    });
}

// === CONFIGURATION GENERATION ===
function generateCustomGameConfig() {
    if (!validateSelection()) {
        alert('Please select at least one topic and set a question count.');
        return null;
    }
    
    const config = {
        isCustomGame: true,
        questionLimit: questionCount,
        selectedTopics: Array.from(selectedTopics),
        gameStyle: gameStyle,
        createdAt: new Date().toISOString()
    };
    
    console.log('Generated custom game config:', config);
    return config;
}

function startCustomGame() {
    const config = generateCustomGameConfig();
    if (!config) return;
    
    // Save configuration to session storage
    sessionStorage.setItem('customGameConfig', JSON.stringify(config));
    
    // TODO: Redirect to appropriate game page
    // Check if this should be multiplayer or offline
    const gameMode = sessionStorage.getItem('gameMode') || 'offline';
    
    if (gameMode === 'multiplayer') {
        // TODO: Redirect to multiplayer game with custom config
        window.location.href = '../game.html';
    } else {
        // TODO: Redirect to offline game with custom config
        window.location.href = '../game.html';
    }
}

// === EVENT LISTENERS ===
function setupEventListeners() {
    // TODO: Add event listeners for:
    // - Topic checkboxes
    // - Question count slider/input
    // - Game style radio buttons
    // - Start button
    console.log('Setting up customize page event listeners...');
}

// === INITIALIZATION ===
function initializeCustomizeGame() {
    console.log('Initializing customize game page...');
    loadAvailableTopicsForSetup();
    setupEventListeners();
    validateSelection();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeCustomizeGame);

// === EXPORTS ===
window.gameSetup = {
    loadAvailableTopicsForSetup,
    toggleTopicSelection,
    selectAllTopics,
    selectNoTopics,
    setQuestionCount,
    setGameStyle,
    validateSelection,
    updatePreview,
    generateCustomGameConfig,
    startCustomGame,
    initializeCustomizeGame
};