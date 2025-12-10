let topics = {};

function loadQuestions() {
    const basePath = '/src/data/questions/topics/';
    return fetch(basePath + 'index.json').then(res => {
        if (!res.ok) throw new Error('Failed to load topics/index.json');
        return res.json();
    })
    .then(topicsIndex => {
        const topicPromises = Object.keys(topicsIndex).map(topicName => {
            const topicInfo = topicsIndex[topicName];
            return fetch(`${basePath}${topicInfo.file}`)
                .then(res => { if (!res.ok) throw new Error(`Failed to load ${topicInfo.file}`); return res.json(); })
                .then(topicData => { topics[topicName] = { questions: topicData.questions || [], colors: topicData.colors || { option1: '#3b82f6', option2: '#10b981' } }; });
        });
        return Promise.all(topicPromises);
    })
    .then(() => { window.topics = topics; return { topics }; })
    .catch(err => { console.error('Error loading questions from modular files:', err); topics = {}; return { topics }; });
}

function initializeDropdown() {
    const dropdownBtn = document.querySelector('#open_page');
    const directions = document.querySelector('#directions');
    function updateButtonState() {
        if (directions && dropdownBtn) {
            if (directions.classList.contains('hide')) dropdownBtn.classList.add('collapsed');
            else dropdownBtn.classList.remove('collapsed');
        }
    }
    function dropdown(){ directions.classList.toggle('hide'); updateButtonState(); }
    function closeDirections() {
        if (directions && !directions.classList.contains('hide')) { directions.classList.add('hide'); updateButtonState(); }
    }
    if (dropdownBtn) { dropdownBtn.classList.remove('collapsed'); dropdownBtn.addEventListener('click', dropdown); }
    const switchBtn = document.querySelector('#switchQuestion');
    if (switchBtn) switchBtn.addEventListener('click', closeDirections);
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
        light: {
            'text-dark': 'rgb(0 0 0)',
            'dark': 'rgb(0 0 0)',
            'accent-dark': 'rgb(64 64 64)',
            'accent-light': 'rgb(128 128 128)',
            'background-light': 'rgb(255 255 255)'
        },
        dark: {
            'background-light': 'rgb(40 40 40)'
        }
    },
    red: {
        light: {
            'text-dark': '#421010',
            'dark': '#421010',
            'accent-dark': '#8a2424',
            'accent-light': '#c94444',
            'background-light': '#fab9b9'
        },
        dark: {
            'background-light': '#421010'
        }
    },
    orange: {
        light: {
            'text-dark': '#422410',
            'dark': '#422410',
            'accent-dark': '#8a4324',
            'accent-light': '#c97b44',
            'background-light': '#fad1b9'
        },
        dark: {
            'background-light': '#422410'
        }
    },
    yellow: {
        light: {
            'text-dark': '#424010',
            'dark': '#424010',
            'accent-dark': '#8a8124',
            'accent-light': '#c9c944',
            'background-light': '#faf9b9'
        },
        dark: {
            'background-light': '#424010'
        }
    },
    green: {
        light: {
            'text-dark': '#0b2d0c',
            'dark': '#0b2d0c',
            'accent-dark': '#248a2e',
            'accent-light': '#44c95a',
            'background-light': '#b9fac3'
        },
        dark: {
            'background-light': '#0b2d0c'
        }
    },
    blue: {
        light: {
            'text-dark': '#102742',
            'dark': '#102742',
            'accent-dark': '#24528a',
            'accent-light': '#4482c9',
            'background-light': '#b9ddfa'
        },
        dark: {
            'background-light': '#102742'
        }
    },
    purple: {
        light: {
            'text-dark': '#371042',
            'dark': '#371042',
            'accent-dark': '#76248a',
            'accent-light': '#ac44c9',
            'background-light': '#e4b9fa'
        },
        dark: {
            'background-light': '#371042'
        }
    }
};

/**
 * Apply a theme by setting CSS variables
 * @param {string} theme - The theme name (white, red, orange, yellow, green, blue, purple)
 * @param {string} mode - The theme mode (light or dark)
 */
function applyTheme(theme, mode = 'light') {
    const themeColors = themeColorMap[theme];
    if (!themeColors) {
        console.warn(`Unknown theme: ${theme}`);
        return;
    }

    // Start with light theme colors as base
    const lightColors = themeColors.light || {};
    const modeColors = themeColors[mode] || {};
    
    // Merge: dark mode overrides only specific properties
    const colors = { ...lightColors, ...modeColors };

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
 * @param {string} initialMode - Initial mode from server (optional, for joining players)
 */
function initializeThemeManager(socket = null, roomCode = null, isHost = false, initialTheme = null, initialMode = null) {
    // Support both offline and multiplayer theme controls
    const gameMode = sessionStorage.getItem('gameMode');
    const isOffline = gameMode === 'offline';
    
    const themeDropdown = document.getElementById(isOffline ? 'offline-color-theme' : 'color-theme');
    const modeRadios = document.querySelectorAll(`input[name="${isOffline ? 'offline-theme-mode' : 'theme-mode'}"]`);

    // Determine which theme and mode to use
    const savedTheme = initialTheme || sessionStorage.getItem('selectedTheme') || 'green';
    const savedMode = initialMode || sessionStorage.getItem('themeMode') || 'light';
    
    // Apply initial theme and mode
    applyTheme(savedTheme, savedMode);
    
    // Update dropdown and radio values if they exist
    if (themeDropdown) {
        themeDropdown.value = savedTheme;
    }
    if (modeRadios.length > 0) {
        modeRadios.forEach(radio => {
            if (radio.value === savedMode) {
                radio.checked = true;
            }
        });
    }

    // Handle theme dropdown changes
    if (themeDropdown) {
        themeDropdown.addEventListener('change', (e) => {
            const selectedTheme = e.target.value;
            const currentMode = document.querySelector(`input[name="${isOffline ? 'offline-theme-mode' : 'theme-mode'}"]:checked`)?.value || savedMode;
            
            sessionStorage.setItem('selectedTheme', selectedTheme);
            applyTheme(selectedTheme, currentMode);
            
            // Broadcast theme change if host in multiplayer
            if (isHost && socket && roomCode) {
                socket.emit('change-room-theme', {
                    roomCode: roomCode,
                    theme: selectedTheme,
                    mode: currentMode
                });
            }
        });
    }

    // Handle mode radio changes
    if (modeRadios.length > 0) {
        modeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const selectedMode = e.target.value;
                const currentTheme = themeDropdown?.value || sessionStorage.getItem('selectedTheme') || 'green';
                
                sessionStorage.setItem('themeMode', selectedMode);
                applyTheme(currentTheme, selectedMode);
                
                if (isHost && socket && roomCode) {
                    socket.emit('change-room-theme', {
                        roomCode: roomCode,
                        theme: currentTheme,
                        mode: selectedMode
                    });
                }
            });
        });
    }

    // Listen for theme changes from server (for multiplayer players)
    if (socket) {
        socket.on('theme-changed', (data) => {
            sessionStorage.setItem('selectedTheme', data.theme);
            if (data.mode) sessionStorage.setItem('themeMode', data.mode);
            
            const mode = data.mode || 'light';
            applyTheme(data.theme, mode);
            
            if (isHost && themeDropdown && themeDropdown.value !== data.theme) {
                themeDropdown.value = data.theme;
            }
            if (modeRadios.length > 0 && data.mode) {
                modeRadios.forEach(radio => {
                    if (radio.value === data.mode) {
                        radio.checked = true;
                    }
                });
            }
        });
    }
}
/**
 * Set up event listeners for color buttons
 */
function setupColorButtons() {
    const gameMode = sessionStorage.getItem('GAME_MODE');
    const isOffline = gameMode === 'offline';
    const themeDropdown = document.getElementById(isOffline ? 'offline-color-theme' : 'color-theme');
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