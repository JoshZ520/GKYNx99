// game-ui.js - User interface management: topics, preferences, and interactions
// Handles topic selection, preference display, and UI interactions

import { GAME_CONFIG, CONFIG_UTILS } from '../config/game-config.js';

// === SHARED STATE ===
let availableTopics = [];
let currentTopicPage = 1;
const topicsPerPage = 6;

// === TOPIC SELECTION SYSTEM ===
function initializeTopicSelection() {
    // Load topics from JSON - use dynamic path resolution
    const basePath = CONFIG_UTILS.getTopicsPath();
    fetch(basePath)
        .then(res => res.json())
        .then(topicsIndex => {
            console.log(GAME_CONFIG.MESSAGES.LOADED_TOPICS, topicsIndex);
            // Convert to array, excluding 'default'
            availableTopics = Object.keys(topicsIndex)
                .filter(key => key !== GAME_CONFIG.TOPICS.DEFAULT)
                .map(key => ({
                    name: key.charAt(0).toUpperCase() + key.slice(1),
                    value: key
                }));
            
            console.log(GAME_CONFIG.MESSAGES.AVAILABLE_TOPICS, availableTopics);
            
            // Initialize the grid with topics
            renderTopicGrid();
            
            // Initialize pagination controls
            const prevBtn = CONFIG_UTILS.getElementById('PREV_PAGE_BTN');
            const nextBtn = CONFIG_UTILS.getElementById('NEXT_PAGE_BTN');
            
            if (prevBtn) {
                prevBtn.addEventListener('click', () => changePage(GAME_CONFIG.NAVIGATION.PREV));
            }
            if (nextBtn) {
                nextBtn.addEventListener('click', () => changePage(GAME_CONFIG.NAVIGATION.NEXT));
            }
        })
        .catch(err => {
            console.error(GAME_CONFIG.MESSAGES.FAILED_LOAD_TOPICS, err);
            availableTopics = [];
        });
}

// === PREFERENCE SYSTEM ===
function displayQuestionOptions(question) {
    // Show preference UI (all questions now have option1 and option2)
    const preferenceContainer = CONFIG_UTILS.getElementById('PREFERENCE_CONTAINER');
    if (preferenceContainer) {
        CONFIG_UTILS.removeClass(preferenceContainer, 'HIDDEN');
        CONFIG_UTILS.addClass(preferenceContainer, 'VISIBLE');
        
        // Update option labels and images
        const option1Label = CONFIG_UTILS.getElementById('OPTION1_LABEL');
        const option2Label = CONFIG_UTILS.getElementById('OPTION2_LABEL');
        const option1Image = CONFIG_UTILS.getElementById('OPTION1_IMAGE');
        const option2Image = CONFIG_UTILS.getElementById('OPTION2_IMAGE');
        
        if (option1Label && question.option1) {
            option1Label.textContent = question.option1;
        }
        if (option2Label && question.option2) {
            option2Label.textContent = question.option2;
        }
        
        // Handle image loading for options
        loadOptionImages(question, option1Image, option2Image);
    }
    
    // Clear any previous selection
    CONFIG_UTILS.getElementById('SELECTED_PREFERENCE').value = '';
    
    // Update selection highlights
    document.querySelectorAll('.preference-option').forEach(opt => {
        CONFIG_UTILS.removeClass(opt, 'SELECTED');
    });
}

function selectPreference(choice) {
    // Clear previous selections
    document.querySelectorAll('.preference-option').forEach(opt => {
        CONFIG_UTILS.removeClass(opt, 'SELECTED');
    });
    
    // Highlight selected option
    const selectedOption = document.getElementById(choice);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
    
    // Get the actual text value instead of the option key
    let actualAnswer = choice; // fallback to choice if we can't find the text
    
    if (choice === 'option1') {
        const option1Label = document.getElementById('option1Label');
        if (option1Label) {
            actualAnswer = option1Label.textContent;
        }
    } else if (choice === 'option2') {
        const option2Label = document.getElementById('option2Label');
        if (option2Label) {
            actualAnswer = option2Label.textContent;
        }
    }
    
    // Store the actual answer text, not the option key
    document.getElementById('selectedPreference').value = actualAnswer;
    
    console.log('Selected preference:', choice, '→ actual answer:', actualAnswer);
}

// === IMAGE LOADING ===
function loadOptionImages(question, option1Image, option2Image) {
    // Handle image loading with proper error handling
    if (question.images) {
        if (question.images.option1 && option1Image) {
            option1Image.innerHTML = `<img src="${question.images.option1}" alt="${question.option1}" loading="lazy">`;
        }
        
        if (question.images.option2 && option2Image) {
            option2Image.innerHTML = `<img src="${question.images.option2}" alt="${question.option2}" loading="lazy">`;
        }
    } else {
        // Clear images if none specified
        if (option1Image) option1Image.innerHTML = '';
        if (option2Image) option2Image.innerHTML = '';
    }
}

// === TOPIC GRID AND PAGINATION ===
function renderTopicGrid() {
    const grid = document.getElementById('topicsGrid');
    if (!grid) {
        console.error('Topics grid element not found');
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(availableTopics.length / topicsPerPage);
    const startIndex = (currentTopicPage - 1) * topicsPerPage;
    const endIndex = startIndex + topicsPerPage;
    const currentPageTopics = availableTopics.slice(startIndex, endIndex);
    
    // Display current page topics in a 3x2 grid layout (6 topics max)
    grid.innerHTML = currentPageTopics.map(topic => `
        <label class="topic-option smooth-transition">
            <input type="radio" name="topic" value="${topic.value}">
            <span>${topic.name}</span>
        </label>
    `).join('');
    
    // Add event listeners
    grid.querySelectorAll('input[name="topic"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (window.gameCore) {
                window.gameCore.setTopic(e.target.value);
            }
            // Close the topics dropdown after selection
            closeTopicsPanel();
        });
    });
    
    // Update pagination controls
    updatePaginationControls(totalPages);
}

function updatePaginationControls(totalPages) {
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    
    if (pageInfo) {
        pageInfo.textContent = `Page ${currentTopicPage} of ${totalPages}`;
    }
    
    if (prevBtn) {
        prevBtn.disabled = currentTopicPage <= 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentTopicPage >= totalPages;
    }
}

function changePage(direction) {
    const totalPages = Math.ceil(availableTopics.length / topicsPerPage);
    
    if (direction === 'next' && currentTopicPage < totalPages) {
        currentTopicPage++;
    } else if (direction === 'prev' && currentTopicPage > 1) {
        currentTopicPage--;
    }
    
    renderTopicGrid();
}

function toggleTopicsPanel() {
    const panel = document.getElementById('topicsPanel');
    const toggle = document.getElementById('topicsToggle');
    
    if (panel && toggle) {
        if (panel.classList.contains('hidden')) {
            panel.classList.remove('hidden');
            panel.classList.add('visible');
            toggle.textContent = 'Topics ▲';
        } else {
            closeTopicsPanel();
        }
    }
}

function closeTopicsPanel() {
    const panel = document.getElementById('topicsPanel');
    const toggle = document.getElementById('topicsToggle');
    
    if (panel && toggle) {
        panel.classList.add('hidden');
        panel.classList.remove('visible');
        toggle.textContent = 'Topics ▼';
    }
}

function pickRandomTopic() {
    if (availableTopics.length === 0) {
        // Fall back to default if no topics available
        if (window.gameCore) {
            window.gameCore.setTopic('default');
        }
        return 'default';
    }
    
    // Choose a random topic
    const randomTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
    const choice = randomTopic.value;
    
    // Apply the topic
    if (window.gameCore) {
        window.gameCore.setTopic(choice);
    }
    return choice;
}

// === EXPORTS ===
// Make functions available globally for use by other modules
window.gameUI = {
    initializeTopicSelection,
    displayQuestionOptions,
    selectPreference,
    loadOptionImages,
    renderTopicGrid,
    updatePaginationControls,
    changePage,
    toggleTopicsPanel,
    closeTopicsPanel,
    pickRandomTopic,
    // Getters for shared state
    getAvailableTopics: () => availableTopics
};

// === AUTO-INITIALIZATION ===
// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Game UI...');
    if (window.gameUI) {
        window.gameUI.initializeTopicSelection();
        console.log('Topic selection initialized');
    }
});