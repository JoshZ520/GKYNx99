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
});

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
    
    // Set CSS custom properties for the color scheme
    root.style.setProperty('--bg-color', colorScheme.background);
    root.style.setProperty('--header-bg', colorScheme.headerBackground);
    root.style.setProperty('--header-border', colorScheme.headerBorder);
    root.style.setProperty('--primary-btn', colorScheme.primaryButton);
    root.style.setProperty('--secondary-btn', colorScheme.secondaryButton);
    root.style.setProperty('--accent-color', colorScheme.accent);
    root.style.setProperty('--focus-color', colorScheme.focusColor);
    
    // Apply colors directly to elements for immediate effect
    document.body.style.backgroundColor = colorScheme.background;
    
    const header = document.querySelector('header');
    if (header) {
        header.style.backgroundColor = colorScheme.headerBackground;
        header.style.borderColor = colorScheme.headerBorder;
    }
    
    const startBtn = document.querySelector('.start-btn');
    if (startBtn) {
        startBtn.style.backgroundColor = colorScheme.secondaryButton;
    }
    
    const footer = document.querySelector('footer');
    if (footer) {
        footer.style.backgroundColor = colorScheme.accent;
    }
}
