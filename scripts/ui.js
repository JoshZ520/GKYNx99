// UI Components - themes, preferences, and front page functionality
// This module handles all user interface components and interactions

// === COLOR THEME SYSTEM ===

// Helper function to convert hex colors to CSS filter for SVG icons
function hexToFilter(hex) {
    // Simple conversion for common colors
    // For precise conversion, a more complex algorithm would be needed
    // but this handles the basic light/dark cases we need
    
    if (hex === '#ffffff') {
        // White
        return 'brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%)';
    }
    
    if (hex === '#cccccc') {
        // Light gray
        return 'brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(85%) contrast(100%)';
    }
    
    if (hex === '#495057') {
        // Dark gray for light themes
        return 'brightness(0) saturate(100%) invert(24%) sepia(37%) saturate(1015%) hue-rotate(319deg) brightness(94%) contrast(90%)';
    }
    
    if (hex === '#6c757d') {
        // Lighter gray for light theme hover
        return 'brightness(0) saturate(100%) invert(51%) sepia(21%) saturate(1343%) hue-rotate(316deg) brightness(96%) contrast(89%)';
    }
    
    // For other colors, use a basic filter based on lightness
    const rgb = hexToRgb(hex);
    if (rgb) {
        const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
        if (luminance > 0.7) {
            // Light color - use dark filter
            return 'brightness(0) saturate(100%) invert(24%) sepia(37%) saturate(1015%) hue-rotate(319deg) brightness(94%) contrast(90%)';
        } else {
            // Dark color - use white filter
            return 'brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%)';
        }
    }
    
    // Fallback
    return 'brightness(0) saturate(100%) invert(24%) sepia(37%) saturate(1015%) hue-rotate(319deg) brightness(94%) contrast(90%)';
}

// Helper function to convert hex to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
// Function to apply color scheme to any page
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
    
    // Set SVG filter properties based on colorScheme
    if (colorScheme.svgColor && colorScheme.svgHoverColor) {
        root.style.setProperty('--svg-filter', hexToFilter(colorScheme.svgColor));
        root.style.setProperty('--svg-hover-filter', hexToFilter(colorScheme.svgHoverColor));
    } else {
        // Fallback for themes without SVG colors defined
        if (isDarkTheme) {
            root.style.setProperty('--svg-filter', hexToFilter('#ffffff'));
            root.style.setProperty('--svg-hover-filter', hexToFilter('#cccccc'));
        } else {
            root.style.setProperty('--svg-filter', hexToFilter('#495057'));
            root.style.setProperty('--svg-hover-filter', hexToFilter('#6c757d'));
        }
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
    
    // Update switch button background to match body
    const switchBtn = document.querySelector('.switch_button');
    if (switchBtn) {
        switchBtn.style.backgroundColor = colorScheme.background;
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
    
    // Fetch questions.json to get color scheme
    fetch('files/questions.json')
        .then(res => res.json())
        .then(data => {
            let topicData, colorSchemes;
            
            // Handle new structure with separated colorSchemes and topics
            if (data.colorSchemes && data.topics) {
                colorSchemes = data.colorSchemes;
                topicData = data.topics[currentTopic] || data.topics['default'];
            } else {
                // Fallback for old structure
                topicData = data[currentTopic] || data['default'];
                colorSchemes = {};
            }
            
            if (topicData && topicData.colorScheme) {
                let colorScheme;
                if (typeof topicData.colorScheme === 'string') {
                    // Resolve color scheme reference
                    colorScheme = colorSchemes[topicData.colorScheme] || colorSchemes['light'] || {};
                } else {
                    // Direct color scheme object (fallback for old format)
                    colorScheme = topicData.colorScheme;
                }
                applyColorScheme(colorScheme);
            }
        })
        .catch(err => {
            console.warn('Could not load color scheme:', err);
        });
}

// === PREFERENCE SYSTEM ===
// Function to display question options
function displayQuestionOptions(question) {
    if (question.option1 && question.option2) {
        // Show preference UI and hide text input
        const preferenceContainer = document.getElementById('preferenceContainer');
        const textInput = document.getElementById('textInput');
        const answerElem = document.getElementById('answer');
        
        if (preferenceContainer && textInput) {
            preferenceContainer.style.display = 'block';
            textInput.style.display = 'none';
        }
        
        // Set up image containers for contributors to add images
        const option1Image = document.getElementById('option1Image');
        const option2Image = document.getElementById('option2Image');
        
        // Add data attributes for image loading (contributors can use these)
        if (option1Image) {
            option1Image.setAttribute('data-option', question.option1.toLowerCase().replace(/\s+/g, '-'));
        }
        if (option2Image) {
            option2Image.setAttribute('data-option', question.option2.toLowerCase().replace(/\s+/g, '-'));
        }
        
        // Set the text labels above the images
        const option1Label = document.getElementById('option1Label');
        const option2Label = document.getElementById('option2Label');
        
        if (option1Label) {
            option1Label.textContent = question.option1;
        }
        if (option2Label) {
            option2Label.textContent = question.option2;
        }
        
        // Set up click handlers for preferences
        setupPreferenceClickHandlers(question);
    } else {
        // Fallback to text input for backward compatibility
        showTextInput(question);
    }
}

// Function to show text input (fallback)
function showTextInput(question) {
    const preferenceContainer = document.getElementById('preferenceContainer');
    const textInput = document.getElementById('textInput');
    const answerElem = document.getElementById('answer');
    
    if (preferenceContainer) preferenceContainer.style.display = 'none';
    if (textInput) textInput.style.display = 'block';
    
    if (answerElem && question) {
        if (typeof question === 'string') {
            answerElem.placeholder = 'Answer: ';
        } else if (question.option1 && question.option2) {
            answerElem.placeholder = `Choose: ${question.option1} or ${question.option2}`;
        }
    }
}

// Function to set up preference click handlers
function setupPreferenceClickHandlers(question) {
    const option1Elem = document.getElementById('option1');
    const option2Elem = document.getElementById('option2');
    
    // Remove any existing listeners
    const option1Clone = option1Elem?.cloneNode(true);
    const option2Clone = option2Elem?.cloneNode(true);
    
    if (option1Elem && option1Clone) {
        option1Elem.parentNode.replaceChild(option1Clone, option1Elem);
        option1Clone.addEventListener('click', () => selectPreference(question.option1));
    }
    
    if (option2Elem && option2Clone) {
        option2Elem.parentNode.replaceChild(option2Clone, option2Elem);
        option2Clone.addEventListener('click', () => selectPreference(question.option2));
    }
}

// Function to handle preference selection
function selectPreference(choice) {
    // Visual feedback - highlight selected option
    const option1 = document.getElementById('option1');
    const option2 = document.getElementById('option2');
    
    if (option1) option1.classList.remove('selected');
    if (option2) option2.classList.remove('selected');
    
    // Determine which option to highlight based on the choice
    // We need to get the current question to match choice to option
    const currentIndex = parseInt(document.getElementById('question')?.getAttribute('data-index')) || 0;
    const currentQuestion = appQuestions[currentIndex];
    
    if (currentQuestion && currentQuestion.option1 && currentQuestion.option2) {
        if (choice === currentQuestion.option1 && option1) {
            option1.classList.add('selected');
        } else if (choice === currentQuestion.option2 && option2) {
            option2.classList.add('selected');
        }
    }
    
    // Store the choice in both the hidden preference field and the answer field for submission
    const selectedPreferenceField = document.getElementById('selectedPreference');
    const answerElem = document.getElementById('answer');
    
    if (selectedPreferenceField) {
        selectedPreferenceField.value = choice;
    }
    if (answerElem) {
        answerElem.value = choice;
    }
    
    console.log('Selected preference:', choice);
}

// === COLOR SCHEME LOADING ===
// Load color scheme for all pages
window.addEventListener('DOMContentLoaded', function () {
    // Load the current topic's color scheme if stored
    loadTopicColorScheme();
});