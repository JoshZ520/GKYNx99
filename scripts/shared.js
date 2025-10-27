// shared.js - Common functionality used across all pages
// Contains theme system, utility functions, and shared data loading

// === GLOBAL VARIABLES ===
// Shared variables accessible from all pages
window.currentTopic = window.currentTopic || 'default';
let topics = {};
let colorSchemes = {};

// === DATA LOADING ===
function loadQuestions() {
    return Promise.all([
        fetch('files/color-schemes.json').then(res => {
            if (!res.ok) throw new Error('Failed to load color-schemes.json');
            return res.json();
        }),
        fetch('files/topics/index.json').then(res => {
            if (!res.ok) throw new Error('Failed to load topics/index.json');
            return res.json();
        })
    ])
    .then(([colorSchemesData, topicsIndex]) => {
        colorSchemes = colorSchemesData || {};
        
        // Load individual topic files
        const topicPromises = Object.keys(topicsIndex).map(topicName => {
            const topicInfo = topicsIndex[topicName];
            return fetch(`files/topics/${topicInfo.file}`)
                .then(res => {
                    if (!res.ok) throw new Error(`Failed to load ${topicInfo.file}`);
                    return res.json();
                })
                .then(topicData => {
                    // Create topic structure with color scheme reference
                    topics[topicName] = {
                        questions: topicData.questions || [],
                        colorScheme: topicInfo.colorScheme || "light"
                    };
                });
        });
        
        return Promise.all(topicPromises);
    })
    .then(() => {
        // Ensure default exists with proper structure
        if (!topics.default) {
            topics.default = {
                questions: [],
                colorScheme: "light"
            };
        }
        
        // Ensure light color scheme exists as fallback
        if (!colorSchemes.light) {
            colorSchemes.light = {
                background: "#f8f9fa",
                headerBackground: "#ffffff",
                headerBorder: "#6c757d",
                primaryButton: "#4169E1",
                secondaryButton: "#28a745",
                accent: "#17a2b8",
                focusColor: "#4169E1",
                textColor: "#212529",
                headerTextColor: "#212529",
                svgColor: "#495057",
                svgHoverColor: "#6c757d"
            };
        }
        
        // Update global references
        window.topics = topics;
        window.colorSchemes = colorSchemes;
        
        return { topics, colorSchemes };
    })
    .catch(err => {
        console.error('Error loading questions from modular files:', err);
        // Final fallback with empty data
        topics = { 
            default: {
                questions: [],
                colorScheme: "light"
            }
        };
        colorSchemes = {
            light: {
                background: "#f8f9fa",
                headerBackground: "#ffffff",
                headerBorder: "#6c757d",
                primaryButton: "#4169E1",
                secondaryButton: "#28a745",
                accent: "#17a2b8",
                focusColor: "#4169E1",
                textColor: "#212529",
                headerTextColor: "#212529",
                svgColor: "#495057",
                svgHoverColor: "#6c757d"
            }
        };
        return { topics, colorSchemes };
    });
}

// === COLOR THEME SYSTEM ===
function applyColorScheme(colorScheme) {
    const root = document.documentElement;
    
    // Determine if this is a dark theme based on background color
    const isDarkTheme = colorScheme.textColor === '#ffffff' || isColorDark(colorScheme.background);
    
    // Add or remove dark theme class on body
    if (isDarkTheme) {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
    } else {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
    }
    
    // Set CSS custom properties using the new variable names
    if (isDarkTheme) {
        root.style.setProperty('--background-dark', colorScheme.background);
        root.style.setProperty('--background-light', colorScheme.headerBackground);
        root.style.setProperty('--accent-dark', colorScheme.headerBorder);
        root.style.setProperty('--accent-light', colorScheme.accent);
        root.style.setProperty('--text-light', colorScheme.textColor);
        root.style.setProperty('--text-dark', colorScheme.headerTextColor);
        root.style.setProperty('--dark', colorScheme.background);
        root.style.setProperty('--light', colorScheme.headerBackground);
    } else {
        root.style.setProperty('--background-light', colorScheme.background);
        root.style.setProperty('--background-dark', colorScheme.headerBackground);
        root.style.setProperty('--accent-light', colorScheme.accent);
        root.style.setProperty('--accent-dark', colorScheme.headerBorder);
        root.style.setProperty('--text-dark', colorScheme.textColor);
        root.style.setProperty('--text-light', colorScheme.headerTextColor);
        root.style.setProperty('--light', colorScheme.background);
        root.style.setProperty('--dark', colorScheme.textColor);
    }
    
    // Apply colors directly to elements for immediate effect
    document.body.style.backgroundColor = colorScheme.background;
    document.body.style.color = colorScheme.textColor || '#333333';
    
    const header = document.querySelector('header');
    if (header) {
        header.style.backgroundColor = colorScheme.headerBackground;
        header.style.borderColor = colorScheme.headerBorder;
        header.style.color = colorScheme.textColor || '#333333';
    }
    
    // Update all headings
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
        heading.style.color = colorScheme.headerTextColor || '#333333';
    });
    
    // Update all paragraphs and text elements
    const textElements = document.querySelectorAll('p, label, .topic, .preference-label');
    textElements.forEach(element => {
        element.style.color = colorScheme.textColor || '#333333';
    });
    
    const submitBtn = document.querySelector('.submit');
    if (submitBtn) {
        submitBtn.style.backgroundColor = colorScheme.primaryButton;
        submitBtn.style.color = colorScheme.headerTextColor || '#ffffff';
    }
    
    const finBtn = document.querySelector('.fin');
    if (finBtn) {
        finBtn.style.backgroundColor = colorScheme.secondaryButton;
        finBtn.style.color = colorScheme.headerTextColor || '#ffffff';
    }
    
    const startBtn = document.querySelector('.start-btn');
    if (startBtn) {
        startBtn.style.backgroundColor = colorScheme.secondaryButton;
        startBtn.style.color = colorScheme.headerTextColor || '#ffffff';
    }
    
    const footer = document.querySelector('footer');
    if (footer) {
        footer.style.backgroundColor = colorScheme.accent;
        footer.style.color = colorScheme.headerTextColor || '#ffffff';
    }
    
    // Update switch button and dropdown button colors using dedicated SVG colors
    const switchBtn = document.querySelector('.switch_button');
    if (switchBtn) {
        switchBtn.style.backgroundColor = colorScheme.background;
        // Use dedicated SVG color from color scheme
        switchBtn.style.color = colorScheme.svgColor || colorScheme.textColor;
    }
    
    const openPageBtn = document.querySelector('#open_page');
    if (openPageBtn) {
        // Use dedicated SVG color from color scheme
        openPageBtn.style.color = colorScheme.svgColor || colorScheme.textColor;
    }
}

// Helper function to determine if a color is dark
function isColorDark(color) {
    // Convert hex color to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance using the relative luminance formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return true if luminance is less than 0.5 (dark color)
    return luminance < 0.5;
}

// Function to load and apply color scheme from the currently selected topic
function loadTopicColorScheme() {
    const currentTopic = localStorage.getItem('currentTopic') || 'default';
    
    // Load color schemes and topic index to get color scheme for current topic
    Promise.all([
        fetch('files/color-schemes.json').then(res => res.json()),
        fetch('files/topics/index.json').then(res => res.json())
    ])
    .then(([colorSchemes, topicsIndex]) => {
        const topicInfo = topicsIndex[currentTopic] || topicsIndex['default'];
        if (topicInfo && topicInfo.colorScheme) {
            const colorScheme = colorSchemes[topicInfo.colorScheme] || colorSchemes['light'] || {};
            applyColorScheme(colorScheme);
        }
    })
    .catch(err => {
        console.warn('Could not load color scheme:', err);
    });
}

// === COMMON UI UTILITIES ===
// Dropdown toggle functionality (used on game page)
function initializeDropdown() {
    const dropdownBtn = document.querySelector('#open_page');
    const directions = document.querySelector('#directions');

    function dropdown(){
        directions.classList.toggle('hide');
    }

    if (dropdownBtn) dropdownBtn.addEventListener('click', dropdown);
}

// === INITIALIZATION ===
// Load color scheme for all pages
window.addEventListener('DOMContentLoaded', function () {
    // Add default light theme class if no theme is set
    if (!document.body.classList.contains('light-theme') && !document.body.classList.contains('dark-theme')) {
        document.body.classList.add('light-theme');
    }
    
    // Load the current topic's color scheme if stored
    loadTopicColorScheme();
    
    // Initialize dropdown if present
    initializeDropdown();
});

// === EXPORTS ===
// Make functions available globally
window.loadQuestions = loadQuestions;
window.applyColorScheme = applyColorScheme;
window.loadTopicColorScheme = loadTopicColorScheme;

// Make data available globally
window.getTopics = () => topics;
window.getColorSchemes = () => colorSchemes;