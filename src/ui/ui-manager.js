// src/game/ui-manager.js - User interface management: topics, preferences, and interactions
// Handles topic selection, preference display, and UI interactions

import { GAME_CONFIG, CONFIG_UTILS } from '../config/game-config.js';

// popup
const popup = document.querySelector('#popup');
const closePopupBtn = document.querySelector('#close');
closePopupBtn.addEventListener('click', () => {
    popup.style.display = 'none';
});

const openPopupBtn = document.querySelector('#directionDisplay');
openPopupBtn.addEventListener('click', () => {
    console.log('open popup');
    popup.style.display = 'block';
}); 

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
            // Convert to array
            availableTopics = Object.keys(topicsIndex)
                .map(key => ({
                    name: key.charAt(0).toUpperCase() + key.slice(1),
                    value: key
                }));
            
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
    // Show preference UI
    const preferenceContainer = CONFIG_UTILS.getElement('preferenceContainer');
    if (preferenceContainer) {
        CONFIG_UTILS.show(preferenceContainer);
        CONFIG_UTILS.addClass(preferenceContainer, 'VISIBLE');
    }

    // Render options visually in optionsContainer
    const optionsContainer = CONFIG_UTILS.getElement('optionsContainer');
    if (optionsContainer) {
        optionsContainer.innerHTML = '';
        // Support both new format (question.options) and legacy option1/option2
        const opts = [];
        if (Array.isArray(question.options) && question.options.length > 0) {
            question.options.forEach(o => opts.push({ label: o, image: null }));
        } else if (question.option1 || question.option2) {
            if (question.option1) opts.push({ label: question.option1, image: question.images && question.images.option1 });
            if (question.option2) opts.push({ label: question.option2, image: question.images && question.images.option2 });
        }
        opts.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'preference-option';
            btn.type = 'button';
            btn.textContent = '';
            btn.addEventListener('click', () => selectPreference(opt.label));
            // Label above image
            const labelDiv = document.createElement('div');
            labelDiv.className = 'option-label';
            labelDiv.textContent = opt.label || '';
            btn.appendChild(labelDiv);
            if (opt.image) {
                const img = document.createElement('img');
                img.src = opt.image;
                img.alt = opt.label || '';
                img.loading = 'lazy';
                img.style.maxWidth = '100%';
                btn.appendChild(img);
            }
            optionsContainer.appendChild(btn);
        });
    }

    // Clear any previous selection
    const selectedPref = CONFIG_UTILS.getElement('selectedPreference');
    if (selectedPref) selectedPref.value = '';
    document.querySelectorAll('.preference-option').forEach(opt => {
        CONFIG_UTILS.removeClass(opt, 'SELECTED');
    });
    // Also update submit button state
    const submitBtn = CONFIG_UTILS.getElement('submitButton');
    if (submitBtn) {
        submitBtn.disabled = true;
        CONFIG_UTILS.addClass(submitBtn, 'DISABLED');
    }
}

function selectPreference(choice) {
    // Clear previous selections
    document.querySelectorAll('.preference-option').forEach(opt => {
        CONFIG_UTILS.removeClass(opt, 'SELECTED');
    });
    
    // Highlight selected option
    const selectedOption = CONFIG_UTILS.getElement(choice);
    if (selectedOption) {
        CONFIG_UTILS.addClass(selectedOption, 'SELECTED');
    }
    
    // Get the actual text value instead of the option key
    let actualAnswer = choice; // fallback to choice if we can't find the text
    
    if (choice === 'option1') {
        const option1Label = CONFIG_UTILS.getElement('option1Label');
        if (option1Label && option1Label.textContent) {
            actualAnswer = option1Label.textContent;
        }
    } else if (choice === 'option2') {
        const option2Label = CONFIG_UTILS.getElement('option2Label');
        if (option2Label && option2Label.textContent) {
            actualAnswer = option2Label.textContent;
        }
    }
    
    // Store the actual answer text, not the option key
    const selectedPrefInput = CONFIG_UTILS.getElement('selectedPreference');
    if (selectedPrefInput) selectedPrefInput.value = actualAnswer;
    
    // Update submit button state if present
    const submitBtn = CONFIG_UTILS.getElement('submitButton');
    if (submitBtn) {
        submitBtn.disabled = !actualAnswer || actualAnswer === 'option1' || actualAnswer === 'option2';
        CONFIG_UTILS.toggle(submitBtn, submitBtn.disabled);
    }
    
    // Host selection is stored but not automatically submitted
    // It will only be used if needed for pairing (odd number of players)
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
    const grid = CONFIG_UTILS.getElement('topicsGrid');
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
    CONFIG_UTILS.setText('pageInfo', `Page ${currentTopicPage} of ${totalPages}`);
    
    const prevBtn = CONFIG_UTILS.getElement('prevPageBtn');
    if (prevBtn) {
        prevBtn.disabled = currentTopicPage <= 1;
    }
    
    const nextBtn = CONFIG_UTILS.getElement('nextPageBtn');
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
    const panel = CONFIG_UTILS.getElement('topicsPanel');
    const toggle = CONFIG_UTILS.getElement('topicsToggle');
    
    if (panel && toggle) {
        if (panel.classList.contains('hidden')) {
            CONFIG_UTILS.show(panel);
            CONFIG_UTILS.addClass(panel, 'VISIBLE');
            toggle.textContent = 'Topics ▲';
        } else {
            closeTopicsPanel();
        }
    }
}

function closeTopicsPanel() {
    const panel = CONFIG_UTILS.getElement('topicsPanel');
    const toggle = CONFIG_UTILS.getElement('topicsToggle');
    
    if (panel && toggle) {
        CONFIG_UTILS.hide(panel);
        CONFIG_UTILS.removeClass(panel, 'VISIBLE');
        toggle.textContent = 'Topics ▼';
    }
}

function pickRandomTopic() {
    if (availableTopics.length === 0) {
        console.error('No topics available');
        return null;
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
    if (window.gameUI) {
        window.gameUI.initializeTopicSelection();
    }
    // Enable clicking on preference images only in offline mode
    const gameMode = CONFIG_UTILS.getStorageItem('GAME_MODE');
    if (gameMode === GAME_CONFIG.MODES.OFFLINE) {
        const option1 = CONFIG_UTILS.getElement('option1');
        const option2 = CONFIG_UTILS.getElement('option2');
        if (option1) option1.onclick = () => window.gameUI.selectPreference('option1');
        if (option2) option2.onclick = () => window.gameUI.selectPreference('option2');
    }
});