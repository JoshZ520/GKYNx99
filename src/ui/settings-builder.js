/**
 * Settings Builder - Dynamically generates settings HTML to reduce duplication
 */

const SETTINGS_CONFIG = {
    multiplayer: {
        groups: [
            {
                title: 'Game Options',
                items: [
                    {
                        type: 'select',
                        id: 'question-number',
                        label: 'Number of Questions:',
                        options: [
                            { value: '3', label: '3 Questions' },
                            { value: '5', label: '5 Questions' },
                            { value: '10', label: '10 Questions' },
                            { value: 'Infinity', label: 'Unlimited', selected: true }
                        ]
                    }
                ]
            },
            {
                title: 'Follow-Up Questions',
                items: [
                    {
                        type: 'radio',
                        label: 'Enable Follow-Ups:',
                        name: 'follow-up-option',
                        options: [
                            { id: 'follow-up-yes', value: 'true', label: 'Yes', checked: true },
                            { id: 'follow-up-no', value: 'false', label: 'No' }
                        ]
                    },
                    {
                        type: 'radio',
                        label: 'Discussion Mode:',
                        name: 'follow-up-question',
                        conditional: 'follow-up-type-setting',
                        options: [
                            { id: 'follow-up-oneonone', value: 'one-on-one', label: 'One-on-One', checked: true },
                            { id: 'follow-up-group', value: 'group', label: 'Group' }
                        ]
                    },
                    {
                        type: 'radio',
                        label: 'Answer Timer:',
                        name: 'need-timer',
                        options: [
                            { id: 'timer-no', value: 'false', label: 'No Timer', checked: true },
                            { id: 'timer-yes', value: 'true', label: 'Enable Timer' }
                        ]
                    },
                    {
                        type: 'select',
                        id: 'timer-duration',
                        label: 'Timer Duration:',
                        conditional: 'timer-duration-setting',
                        hidden: true,
                        options: [
                            { value: '1', label: '1 minute', selected: true },
                            { value: '3', label: '3 minutes' },
                            { value: '5', label: '5 minutes' },
                            { value: '10', label: '10 minutes' }
                        ]
                    }
                ]
            },
            {
                title: 'Appearance',
                items: [
                    {
                        type: 'select',
                        id: 'color-theme',
                        label: 'Color Theme:',
                        options: [
                            { value: 'white', label: 'White' },
                            { value: 'red', label: 'Red' },
                            { value: 'orange', label: 'Orange' },
                            { value: 'yellow', label: 'Yellow' },
                            { value: 'green', label: 'Green', selected: true },
                            { value: 'blue', label: 'Blue' },
                            { value: 'purple', label: 'Purple' }
                        ]
                    },
                    {
                        type: 'radio',
                        label: 'Theme Mode:',
                        name: 'theme-mode',
                        options: [
                            { id: 'theme-mode-light', value: 'light', label: 'Light', checked: true },
                            { id: 'theme-mode-dark', value: 'dark', label: 'Dark' }
                        ]
                    }
                ]
            }
        ]
    }
};

function generateSettingItem(item, prefix = '') {
    const prefixedId = prefix ? `${prefix}-${item.id}` : item.id;
    const prefixedName = prefix && item.name ? `${prefix}-${item.name}` : item.name;
    const conditionalId = item.conditional ? (prefix ? `${prefix}-${item.conditional}` : item.conditional) : '';
    
    if (item.type === 'select') {
        const optionsHTML = item.options.map(opt => 
            `<option value="${opt.value}"${opt.selected ? ' selected' : ''}>${opt.label}</option>`
        ).join('\n                            ');
        
        return `
                    <div class="setting-item"${conditionalId ? ` id="${conditionalId}"` : ''}${item.hidden ? ' style="display: none;"' : ''}>
                        <label for="${prefixedId}" class="setting-label">${item.label}</label>
                        <select id="${prefixedId}" name="${prefixedId}" class="setting-select">
                            ${optionsHTML}
                        </select>
                    </div>`;
    }
    
    if (item.type === 'radio') {
        const radiosHTML = item.options.map(opt => {
            const radioId = prefix ? `${prefix}-${opt.id}` : opt.id;
            return `
                            <label class="radio-option">
                                <input type="radio" id="${radioId}" name="${prefixedName}" value="${opt.value}"${opt.checked ? ' checked' : ''}>
                                <span>${opt.label}</span>
                            </label>`;
        }).join('');
        
        return `
                    <div class="setting-item"${conditionalId ? ` id="${conditionalId}"` : ''}>
                        <label class="setting-label">${item.label}</label>
                        <div class="radio-group">${radiosHTML}
                        </div>
                    </div>`;
    }
    
    return '';
}

function generateSettingsPanel() {
    const config = SETTINGS_CONFIG.multiplayer;
    
    const groupsHTML = config.groups.map(group => {
        const itemsHTML = group.items.map(item => generateSettingItem(item, '')).join('');
        return `
                <div class="setting-group">
                    <h3 class="setting-group-title">${group.title}</h3>
                    ${itemsHTML}
                </div>`;
    }).join('');
    
    return `
            <div class="settings-grid">${groupsHTML}
            </div>

            <!-- Settings Confirmation -->
            <div class="settings-confirmation">
                <label class="confirmation-label">
                    <input type="checkbox" id="confirmSettings" name="confirm-settings">
                    <span>I have reviewed and confirmed the game settings</span>
                </label>
            </div>`;
}

// Function to populate settings containers
function populateSettings() {
    const multiplayerContainer = document.getElementById('multiplayerSettingsContainer');
    
    if (multiplayerContainer && !multiplayerContainer.hasChildNodes()) {
        multiplayerContainer.innerHTML = generateSettingsPanel();
        console.log('Multiplayer settings populated');
    }
}

// Initialize settings on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', populateSettings);
} else {
    populateSettings();
}

// Also make settings available globally so they can be regenerated when needed
window.regenerateMultiplayerSettings = function() {
    const multiplayerContainer = document.getElementById('multiplayerSettingsContainer');
    if (multiplayerContainer) {
        multiplayerContainer.innerHTML = generateSettingsPanel();
    }
};

// Export for use in other modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateSettingsPanel, SETTINGS_CONFIG };
}