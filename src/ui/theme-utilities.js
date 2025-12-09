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
            'background-light': 'rgb(255 255 255)',
            'light': 'rgb(245 245 245)'
        },
        dark: {
            'text-dark': 'rgb(220 220 220)',
            'dark': 'rgb(200 200 200)',
            'accent-dark': 'rgb(160 160 160)',
            'accent-light': 'rgb(100 100 100)',
            'background-light': 'rgb(30 30 30)',
            'light': 'rgb(40 40 40)'
        }
    },
    red: {
        light: {
            'text-dark': '#421010',
            'dark': '#421010',
            'accent-dark': '#8a2424',
            'accent-light': '#c94444',
            'background-light': '#fab9b9',
            'light': '#ffe5e5'
        },
        dark: {
            'text-dark': '#ffc9c9',
            'dark': '#ff9999',
            'accent-dark': '#ff6b6b',
            'accent-light': '#c94444',
            'background-light': '#2d0a0a',
            'light': '#3d1414'
        }
    },
    orange: {
        light: {
            'text-dark': '#422410',
            'dark': '#422410',
            'accent-dark': '#8a4324',
            'accent-light': '#c97b44',
            'background-light': '#fad1b9',
            'light': '#ffe9db'
        },
        dark: {
            'text-dark': '#ffd4b9',
            'dark': '#ffb380',
            'accent-dark': '#ff9447',
            'accent-light': '#c97b44',
            'background-light': '#2d1a0a',
            'light': '#3d2414'
        }
    },
    yellow: {
        light: {
            'text-dark': '#424010',
            'dark': '#424010',
            'accent-dark': '#8a8124',
            'accent-light': '#c9c944',
            'background-light': '#faf9b9',
            'light': '#feffdb'
        },
        dark: {
            'text-dark': '#f9f7b9',
            'dark': '#e8e380',
            'accent-dark': '#d4d047',
            'accent-light': '#c9c944',
            'background-light': '#2d2b0a',
            'light': '#3d3914'
        }
    },
    green: {
        light: {
            'text-dark': '#0b2d0c',
            'dark': '#0b2d0c',
            'accent-dark': '#248a2e',
            'accent-light': '#44c95a',
            'background-light': '#b9fac3',
            'light': '#dbffe5'
        },
        dark: {
            'text-dark': '#b9fac3',
            'dark': '#80ff99',
            'accent-dark': '#47d65a',
            'accent-light': '#44c95a',
            'background-light': '#0a2d0f',
            'light': '#143d19'
        }
    },
    blue: {
        light: {
            'text-dark': '#102742',
            'dark': '#102742',
            'accent-dark': '#24528a',
            'accent-light': '#4482c9',
            'background-light': '#b9ddfa',
            'light': '#dbeeff'
        },
        dark: {
            'text-dark': '#b9ddfa',
            'dark': '#80b3ff',
            'accent-dark': '#4782d6',
            'accent-light': '#4482c9',
            'background-light': '#0a1a2d',
            'light': '#14243d'
        }
    },
    purple: {
        light: {
            'text-dark': '#371042',
            'dark': '#371042',
            'accent-dark': '#76248a',
            'accent-light': '#ac44c9',
            'background-light': '#e4b9fa',
            'light': '#f5dbff'
        },
        dark: {
            'text-dark': '#e4b9fa',
            'dark': '#d080ff',
            'accent-dark': '#b647d6',
            'accent-light': '#ac44c9',
            'background-light': '#1f0a2d',
            'light': '#2d143d'
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

    const colors = themeColors[mode];
    if (!colors) {
        console.warn(`Unknown mode: ${mode} for theme: ${theme}`);
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
 * @param {string} initialMode - Initial mode from server (optional, for joining players)
 */
function initializeThemeManager(socket = null, roomCode = null, isHost = false, initialTheme = null, initialMode = null) {
    const themeDropdown = document.getElementById('color-theme');
    const modeRadios = document.querySelectorAll('input[name="theme-mode"]');

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
    if (isHost && socket && roomCode && themeDropdown) {
        themeDropdown.addEventListener('change', (e) => {
            const selectedTheme = e.target.value;
            const currentMode = document.querySelector('input[name="theme-mode"]:checked')?.value || 'light';
            
            sessionStorage.setItem('selectedTheme', selectedTheme);
            applyTheme(selectedTheme, currentMode);
            
            socket.emit('change-room-theme', {
                roomCode: roomCode,
                theme: selectedTheme,
                mode: currentMode
            });
        });
    } else if (!socket && themeDropdown) {
        themeDropdown.addEventListener('change', (e) => {
            const selectedTheme = e.target.value;
            const currentMode = document.querySelector('input[name="theme-mode"]:checked')?.value || 'light';
            
            sessionStorage.setItem('selectedTheme', selectedTheme);
            applyTheme(selectedTheme, currentMode);
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