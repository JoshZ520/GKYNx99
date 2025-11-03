// shared.js - Common functionality used across all pages
// Contains utility functions and shared data loading
// === GLOBAL VARIABLES ===
let topics = {};
// === DATA LOADING ===
function loadQuestions() {
    // Determine the correct path based on current page location
    const isInPages = window.location.pathname.includes('/pages/');
    const isInFallback = window.location.pathname.includes('/fallback/');
    const basePath = (isInPages || isInFallback) ? '../data/questions/topics/' : 'data/questions/topics/';
    
    return fetch(basePath + 'index.json').then(res => {
        if (!res.ok) throw new Error('Failed to load topics/index.json');
        return res.json();
    })
    .then(topicsIndex => {
        // Load individual topic files
        const topicPromises = Object.keys(topicsIndex).map(topicName => {
            const topicInfo = topicsIndex[topicName];
            return fetch(`${basePath}${topicInfo.file}`)
                .then(res => {
                    if (!res.ok) throw new Error(`Failed to load ${topicInfo.file}`);
                    return res.json();
                })
                .then(topicData => {
                    // Create topic structure
                    topics[topicName] = {
                        questions: topicData.questions || []
                    };
                });
        });
        return Promise.all(topicPromises);
    })
    .then(() => {
        // Ensure default exists with proper structure
        if (!topics.default) {
            topics['default'] = {
                questions: []
            };
        }
        // Update global references
        window.topics = topics;

        return { topics };
    })
    .catch(err => {
        console.error('Error loading questions from modular files:', err);
        // Final fallback with empty data
        topics = { 
            default: {
                questions: []
            }
        };

        return { topics };
    });
}

// Helper function to determine if a color is dark

// === COMMON UI UTILITIES ===
// Dropdown toggle functionality (used on game page)
function initializeDropdown() {
    const dropdownBtn = document.querySelector('#open_page');
    const directions = document.querySelector('#directions');
    
    function updateButtonState() {
        if (directions && dropdownBtn) {
            if (directions.classList.contains('hide')) {
                dropdownBtn.classList.add('collapsed');
            } else {
                dropdownBtn.classList.remove('collapsed');
            }
        }
    }
    
    function dropdown(){
        directions.classList.toggle('hide');
        updateButtonState();
    }
    
    // Function to close directions (used when user starts interacting)
    function closeDirections() {
        if (directions && !directions.classList.contains('hide')) {
            directions.classList.add('hide');
            updateButtonState();
        }
    }
    
    // Initialize button state (directions start expanded)
    if (dropdownBtn) {
        dropdownBtn.classList.remove('collapsed'); // Start with up arrow
        dropdownBtn.addEventListener('click', dropdown);
    }
    
    // Auto-close directions when user starts playing
    // Close when switching questions
    const switchBtn = document.querySelector('#switchQuestion');
    if (switchBtn) {
        switchBtn.addEventListener('click', closeDirections);
    }
}
// === INITIALIZATION ===
// Load color scheme for all pages
window.addEventListener('DOMContentLoaded', function () {

    // Initialize dropdown if present
    initializeDropdown();
    // Load questions
    loadQuestions();
});

// === EXPORTS ===
// Make functions available globally
window.loadQuestions = loadQuestions;
// Make data available globally
window.getTopics = () => topics;