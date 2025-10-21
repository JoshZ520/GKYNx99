// Save selected player count to sessionStorage so the main page can enforce submission limits
window.addEventListener('DOMContentLoaded', function () {
    const select = document.getElementById('player_count');
    if (!select) return;

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
            const defaultData = data['default'];
            if (defaultData && defaultData.questions && defaultData.questions.length > 0) {
                // Use the first question as the front page instruction
                const frontInstruction = defaultData.questions[0];
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

// Function to load and apply color scheme from the currently selected topic
function loadTopicColorScheme() {
    const currentTopic = localStorage.getItem('currentTopic') || 'default';
    
    // Fetch questions.json to get color scheme
    fetch('files/questions.json')
        .then(res => res.json())
        .then(data => {
            const topicData = data[currentTopic] || data['default'];
            if (topicData && topicData.colorScheme) {
                applyColorScheme(topicData.colorScheme);
            }
        })
        .catch(err => {
            console.warn('Could not load color scheme for front page:', err);
        });
}

// Function to apply color scheme to the front page
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
    const textElements = document.querySelectorAll('p, label');
    textElements.forEach(element => {
        element.style.color = colorScheme.textColor || '#333333';
    });
    
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
}
