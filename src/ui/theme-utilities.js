let topics = {};

function loadQuestions() {
    // Use absolute path from server root for consistency
    const basePath = '/src/data/questions/topics/';
    
    return fetch(basePath + 'index.json').then(res => {
        if (!res.ok) throw new Error('Failed to load topics/index.json');
        return res.json();
    })
    .then(topicsIndex => {
        const topicPromises = Object.keys(topicsIndex).map(topicName => {
            const topicInfo = topicsIndex[topicName];
            return fetch(`${basePath}${topicInfo.file}`)
                .then(res => {
                    if (!res.ok) throw new Error(`Failed to load ${topicInfo.file}`);
                    return res.json();
                })
                .then(topicData => {
                    topics[topicName] = {
                        questions: topicData.questions || [],
                        colors: topicData.colors || { option1: '#3b82f6', option2: '#10b981' }
                    };
                });
        });
        return Promise.all(topicPromises);
    })
    .then(() => {
        window.topics = topics;

        return { topics };
    })
    .catch(err => {
        console.error('Error loading questions from modular files:', err);
        topics = {};

        return { topics };
    });
}

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
    
    const switchBtn = document.querySelector('#switchQuestion');
    if (switchBtn) {
        switchBtn.addEventListener('click', closeDirections);
    }
}

window.addEventListener('DOMContentLoaded', function () {
    initializeDropdown();
    loadQuestions();
});

window.loadQuestions = loadQuestions;
window.getTopics = () => topics;

// Theme management
const themeColorMap = {
    white: {
        'text-dark': 'rgb(0 0 0)',
        'dark': 'rgb(0 0 0)',
        'accent-dark': 'rgb(64 64 64)',
        'accent-light': 'rgb(128 128 128)',
        'background-light': 'rgb(255 255 255)'
    },
    red: {
        'text-dark': '#421010',
        'dark': '#421010',
        'accent-dark': '#8a2424',
        'accent-light': '#c94444',
        'background-light': '#fab9b9'
    },
    orange: {
        'text-dark': '#422410',
        'dark': '#422410',
        'accent-dark': '#8a4324',
        'accent-light': '#c97b44',
        'background-light': '#fad1b9'
    },
    yellow: {
        'text-dark': '#424010',
        'dark': '#424010',
        'accent-dark': '#8a8124',
        'accent-light': '#c9c944',
        'background-light': '#faf9b9'
    },
    green: {
        'text-dark': '#0b2d0c',
        'dark': '#0b2d0c',
        'accent-dark': '#248a2e',
        'accent-light': '#44c95a',
        'background-light': '#b9fac3'
    },
    blue: {
        'text-dark': '#102742',
        'dark': '#102742',
        'accent-dark': '#24528a',
        'accent-light': '#4482c9',
        'background-light': '#b9ddfa'
    },
    purple: {
        'text-dark': '#371042',
        'dark': '#371042',
        'accent-dark': '#76248a',
        'accent-light': '#ac44c9',
        'background-light': '#e4b9fa'
    }
};

/**
 * Apply a theme by setting CSS variables
 * @param {string} theme - The theme name (white, red, orange, yellow, green, blue, purple)
 */
function applyTheme(theme) {
    const colors = themeColorMap[theme];
    if (!colors) {
        console.warn(`Unknown theme: ${theme}`);
        return;
    }

    Object.entries(colors).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--${key}`, value);
    });
}

/**
 * Initialize theme manager on a page
 * @param {object} socket - Socket.io connection (optional, for multiplayer)
 * @param {string} roomCode - Current room code (optional, for multiplayer)
 * @param {boolean} isHost - Whether this is the host (optional, for multiplayer)
 * @param {string} initialTheme - Initial theme from server (optional, for joining players)
 */
function initializeThemeManager(socket = null, roomCode = null, isHost = false, initialTheme = null) {
    const themeDropdown = document.getElementById('color-theme');

    // Determine which theme to use:
    // 1. If initialTheme is provided (from server for players), use that
    // 2. Otherwise use saved theme from sessionStorage, default to green
    const savedTheme = initialTheme || sessionStorage.getItem('selectedTheme') || 'green';
    
    // Apply initial theme (works even if dropdown doesn't exist)
    applyTheme(savedTheme);
    
    // Update dropdown value if it exists
    if (themeDropdown) {
        themeDropdown.value = savedTheme;
    }

    // If host and has socket, listen to dropdown changes for multiplayer
    if (isHost && socket && roomCode && themeDropdown) {
        themeDropdown.addEventListener('change', (e) => {
            const selectedTheme = e.target.value;
            
            // Save to sessionStorage
            sessionStorage.setItem('selectedTheme', selectedTheme);
            
            // Apply theme locally
            applyTheme(selectedTheme);
            
            // Send to server
            socket.emit('change-room-theme', {
                roomCode: roomCode,
                theme: selectedTheme
            });
        });
    } else if (!socket && themeDropdown) {
        // Single-player mode (index page) - just apply theme locally
        themeDropdown.addEventListener('change', (e) => {
            const selectedTheme = e.target.value;
            
            // Save to sessionStorage
            sessionStorage.setItem('selectedTheme', selectedTheme);
            
            applyTheme(selectedTheme);
        });
    }

    // Listen for theme changes from server (for multiplayer players)
    if (socket) {
        socket.on('theme-changed', (data) => {
            // Save to sessionStorage (for host/same-session players)
            sessionStorage.setItem('selectedTheme', data.theme);
            
            // Apply the theme
            applyTheme(data.theme);
            
            // Update dropdown if it exists and this is the host
            if (isHost && themeDropdown && themeDropdown.value !== data.theme) {
                themeDropdown.value = data.theme;
            }
        });
    }
}
/**
 * Set up event listeners for color buttons
 */
function setupColorButtons() {
    const themeDropdown = document.getElementById('color-theme');
    const colors = ['white', 'red', 'orange', 'yellow', 'green', 'blue', 'purple'];
    
    colors.forEach(color => {
        const button = document.getElementById(`${color}Button`);
        if (button) {
            button.addEventListener('click', () => {
                // Save to sessionStorage
                sessionStorage.setItem('selectedTheme', color);
                
                // Apply theme
                applyTheme(color);
                
                // Update dropdown to match
                if (themeDropdown) {
                    themeDropdown.value = color;
                }
                
                // If multiplayer host, broadcast the change
                const roomCode = new URLSearchParams(window.location.search).get('roomCode');
                if (window.socket && roomCode) {
                    window.socket.emit('change-room-theme', {
                        roomCode: roomCode,
                        theme: color
                    });
                }
            });
        }
    });
}

// Initialize theme manager on index page when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof initializeThemeManager === 'function') {
            initializeThemeManager();
        }
        setupColorButtons();
    });
} else {
    // DOM already loaded
    if (typeof initializeThemeManager === 'function') {
        initializeThemeManager();
    }
    setupColorButtons();
}