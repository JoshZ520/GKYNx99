// Enhanced UI Components - with setup configuration demonstrations
// This module handles all user interface components and interactions

// === COLOR THEME SYSTEM ===
// Function to apply color scheme to any page
function applyColorScheme(colorScheme) {
    const root = document.documentElement;
    
    // Determine if this is a dark theme based on background color
    const isDarkTheme = colorScheme.textColor === '#ffffff';
    
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
    
    // Update switch button background to match body
    const switchBtn = document.querySelector('.switch_button');
    if (switchBtn) {
        switchBtn.style.backgroundColor = colorScheme.background;
    }
}

// Function to load and apply color scheme from the currently selected topic
function loadTopicColorScheme() {
    const currentTopic = localStorage.getItem('currentTopic') || 'setup';
    
    // Fetch questions.json to get color scheme
    fetch('files/questions.json')
        .then(res => res.json())
        .then(data => {
            const topicData = data[currentTopic] || data['setup'];
            if (topicData && topicData.colorScheme) {
                applyColorScheme(topicData.colorScheme);
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
            
            // Hide name instruction initially
            const nameInstruction = document.getElementById('nameInstruction');
            if (nameInstruction) {
                nameInstruction.style.display = 'none';
            }
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
    
    // Hide name instruction for regular text input
    const nameInstruction = document.getElementById('nameInstruction');
    if (nameInstruction) {
        nameInstruction.style.display = 'none';
    }
    
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
    
    // Store the choice in the hidden answer field for submission
    const answerElem = document.getElementById('answer');
    if (answerElem) {
        answerElem.value = choice;
    }
    
    // Show name instruction when preference is selected
    const nameInstruction = document.getElementById('nameInstruction');
    if (nameInstruction) {
        nameInstruction.style.display = 'block';
    }
    
    // Focus on name input to guide user
    const nameInput = document.getElementById('name');
    if (nameInput) {
        setTimeout(() => nameInput.focus(), 100);
    }
    
    console.log('Selected preference:', choice);
}

// === FRONT PAGE FUNCTIONALITY ===
// Save selected player count to sessionStorage so the main page can enforce submission limits
window.addEventListener('DOMContentLoaded', function () {
    const select = document.getElementById('player_count');
    if (select) {
        // When the selection changes, store the value as an integer in sessionStorage
        select.addEventListener('change', function (e) {
            const val = parseInt(e.target.value, 10);
            if (!Number.isNaN(val) && val > 0) {
                sessionStorage.setItem('playerCount', String(val));
            } else {
                sessionStorage.removeItem('playerCount');
            }
        });

        // If the user navigates to this page and then back, pre-select the stored value
        const stored = parseInt(sessionStorage.getItem('playerCount'), 10);
        if (!Number.isNaN(stored) && stored > 0) {
            const opt = Array.from(select.options).find(o => parseInt(o.value, 10) === stored);
            if (opt) select.value = String(stored);
        }
    }

    // Load the current topic's color scheme if stored
    loadTopicColorScheme();
    
    // Load and display the front page instruction
    loadFrontPageInstruction();
});

// Function to load and display the front page instruction
function loadFrontPageInstruction() {
    fetch('files/questions.json')
        .then(res => res.json())
        .then(data => {
            const setupData = data['setup'];
            if (setupData && setupData.questions && setupData.questions.length > 0) {
                // Use the first question as the front page instruction
                const frontInstruction = setupData.questions[0].prompt;
                const instructionElement = document.getElementById('front-instruction');
                if (instructionElement) {
                    instructionElement.textContent = frontInstruction;
                }
            }
        })
        .catch(err => {
            console.warn('Could not load front page instruction:', err);
        });
}