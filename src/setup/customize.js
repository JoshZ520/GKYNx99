// customize.js - Custom game setup interface
// Handles the customize game page UI and configuration creation

// === SETUP STATE ===
let selectedTopics = new Set();
let questionCount = 10;
let gameStyle = 'balanced';

// === TOPIC SELECTION ===
function loadAvailableTopicsForSetup() {
    // Load topics from the main topic system
    // Display checkboxes for each topic
    // Show question counts per topic
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
    // Add all available topics to selection
    // This would be implemented when full topic system is integrated
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
    // Show preview of what the game will include
    // - Questions per topic
    // - Estimated time
    // - Warnings about availability
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
    
    return config;
}

function startCustomGame() {
    const config = generateCustomGameConfig();
    if (!config) return;
    
    // Save configuration to session storage
    sessionStorage.setItem('customGameConfig', JSON.stringify(config));
    
    // Redirect to appropriate game page
    // Check if this should be multiplayer or offline
    const gameMode = sessionStorage.getItem('gameMode') || 'offline';
    
    // Redirect to game page (both modes use same page currently)
    window.location.href = '../pages/game.html';
}

// === EVENT LISTENERS ===
function setupEventListeners() {
    // Event listeners will be implemented when customize functionality is fully integrated
}

// === INITIALIZATION ===
function initializeCustomizeGame() {
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