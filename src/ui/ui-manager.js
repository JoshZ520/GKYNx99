import { GAME_CONFIG, CONFIG_UTILS } from '../config/game-config.js';

const popup = document.querySelector('#popup');
const closePopupBtn = document.querySelector('#close');
if (closePopupBtn) {
    closePopupBtn.addEventListener('click', () => { 
        if (popup) popup.style.display = 'none'; 
    });
}
const openPopupBtn = document.querySelector('#directionDisplay');
if (openPopupBtn) {
    openPopupBtn.addEventListener('click', () => { 
        if (popup) popup.style.display = 'block'; 
    });
}

let availableTopics = [];
let currentTopicPage = 1;
const topicsPerPage = 6;

function initializeTopicSelection() {
    const basePath = CONFIG_UTILS.getTopicsPath();
    fetch(basePath)
        .then(res => res.json())
        .then(topicsIndex => {
            availableTopics = Object.keys(topicsIndex).map(key => ({ name: key.charAt(0).toUpperCase() + key.slice(1), value: key }));
            renderTopicGrid();
            const prevBtn = CONFIG_UTILS.getElementById('PREV_PAGE_BTN');
            const nextBtn = CONFIG_UTILS.getElementById('NEXT_PAGE_BTN');
            if (prevBtn) prevBtn.addEventListener('click', () => changePage(GAME_CONFIG.NAVIGATION.PREV));
            if (nextBtn) nextBtn.addEventListener('click', () => changePage(GAME_CONFIG.NAVIGATION.NEXT));
        })
        .catch(err => { console.error(GAME_CONFIG.MESSAGES.FAILED_LOAD_TOPICS, err); availableTopics = []; });
}

function displayQuestionOptions(question) {
    const preferenceContainer = CONFIG_UTILS.getElement('preferenceContainer');
    if (preferenceContainer) { CONFIG_UTILS.show(preferenceContainer); CONFIG_UTILS.addClass(preferenceContainer, 'VISIBLE'); }
    const optionsContainer = CONFIG_UTILS.getElement('optionsContainer');
    if (optionsContainer) {
        optionsContainer.innerHTML = '';
        const opts = [];
        if (Array.isArray(question.options) && question.options.length > 0) question.options.forEach(o => opts.push({ label: o, image: null }));
        else if (question.option1 || question.option2) {
            if (question.option1) opts.push({ label: question.option1, image: question.images && question.images.option1 });
            if (question.option2) opts.push({ label: question.option2, image: question.images && question.images.option2 });
        }
        opts.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'preference-option'; btn.type = 'button'; btn.textContent = '';
            btn.addEventListener('click', () => selectPreference(opt.label));
            const labelDiv = document.createElement('div');
            labelDiv.className = 'option-label'; labelDiv.textContent = opt.label || '';
            btn.appendChild(labelDiv);
            if (opt.image) {
                const img = document.createElement('img');
                img.src = opt.image; img.alt = opt.label || ''; img.loading = 'lazy'; img.style.maxWidth = '100%';
                btn.appendChild(img);
            }
            optionsContainer.appendChild(btn);
        });
    }
    const selectedPref = CONFIG_UTILS.getElement('selectedPreference');
    if (selectedPref) selectedPref.value = '';
    document.querySelectorAll('.preference-option').forEach(opt => CONFIG_UTILS.removeClass(opt, 'SELECTED'));
    const submitBtn = CONFIG_UTILS.getElement('submitButton');
    if (submitBtn) { submitBtn.disabled = true; CONFIG_UTILS.addClass(submitBtn, 'DISABLED'); }
}

function selectPreference(choice) {
    document.querySelectorAll('.preference-option').forEach(opt => CONFIG_UTILS.removeClass(opt, 'SELECTED'));
    const selectedOption = CONFIG_UTILS.getElement(choice);
    if (selectedOption) CONFIG_UTILS.addClass(selectedOption, 'SELECTED');
    let actualAnswer = choice;
    if (choice === 'option1') {
        const option1Label = CONFIG_UTILS.getElement('option1Label');
        if (option1Label && option1Label.textContent) actualAnswer = option1Label.textContent;
    } else if (choice === 'option2') {
        const option2Label = CONFIG_UTILS.getElement('option2Label');
        if (option2Label && option2Label.textContent) actualAnswer = option2Label.textContent;
    }
    const selectedPrefInput = CONFIG_UTILS.getElement('selectedPreference');
    if (selectedPrefInput) selectedPrefInput.value = actualAnswer;
    const submitBtn = CONFIG_UTILS.getElement('submitButton');
    if (submitBtn) { submitBtn.disabled = !actualAnswer || actualAnswer === 'option1' || actualAnswer === 'option2'; CONFIG_UTILS.toggle(submitBtn, submitBtn.disabled); }
}

function loadOptionImages(question, option1Image, option2Image) {
    if (question.images) {
        if (question.images.option1 && option1Image) option1Image.innerHTML = `<img src="${question.images.option1}" alt="${question.option1}" loading="lazy">`;
        if (question.images.option2 && option2Image) option2Image.innerHTML = `<img src="${question.images.option2}" alt="${question.option2}" loading="lazy">`;
    } else {
        if (option1Image) option1Image.innerHTML = '';
        if (option2Image) option2Image.innerHTML = '';
    }
}

function renderTopicGrid() {
    const grid = CONFIG_UTILS.getElement('topicsGrid');
    if (!grid) { console.error('Topics grid element not found'); return; }
    const totalPages = Math.ceil(availableTopics.length / topicsPerPage);
    const startIndex = (currentTopicPage - 1) * topicsPerPage;
    const endIndex = startIndex + topicsPerPage;
    const currentPageTopics = availableTopics.slice(startIndex, endIndex);
    grid.innerHTML = currentPageTopics.map(topic => `<label class="topic-option smooth-transition"><input type="radio" name="topic" value="${topic.value}"><span>${topic.name}</span></label>`).join('');
    grid.querySelectorAll('input[name="topic"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (window.gameCore) window.gameCore.setTopic(e.target.value);
            closeTopicsPanel();
        });
    });
    updatePaginationControls(totalPages);
}
function updatePaginationControls(totalPages) {
    CONFIG_UTILS.setText('pageInfo', `Page ${currentTopicPage} of ${totalPages}`);
    const prevBtn = CONFIG_UTILS.getElement('prevPageBtn');
    if (prevBtn) prevBtn.disabled = currentTopicPage <= 1;
    const nextBtn = CONFIG_UTILS.getElement('nextPageBtn');
    if (nextBtn) nextBtn.disabled = currentTopicPage >= totalPages;
}
function changePage(direction) {
    const totalPages = Math.ceil(availableTopics.length / topicsPerPage);
    if (direction === 'next' && currentTopicPage < totalPages) currentTopicPage++;
    else if (direction === 'prev' && currentTopicPage > 1) currentTopicPage--;
    renderTopicGrid();
}

function toggleTopicsPanel() {
    const panel = CONFIG_UTILS.getElement('topicsPanel');
    const toggle = CONFIG_UTILS.getElement('topicsToggle');
    if (panel && toggle) {
        if (panel.classList.contains('hidden')) { CONFIG_UTILS.show(panel); CONFIG_UTILS.addClass(panel, 'VISIBLE'); toggle.textContent = 'Topics ▲'; }
        else closeTopicsPanel();
    }
}
function closeTopicsPanel() {
    const panel = CONFIG_UTILS.getElement('topicsPanel');
    const toggle = CONFIG_UTILS.getElement('topicsToggle');
    if (panel && toggle) { CONFIG_UTILS.hide(panel); CONFIG_UTILS.removeClass(panel, 'VISIBLE'); toggle.textContent = 'Topics ▼'; }
}
function pickRandomTopic() {
    if (availableTopics.length === 0) { console.error('No topics available'); return null; }
    const randomTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
    const choice = randomTopic.value;
    if (window.gameCore) window.gameCore.setTopic(choice);
    return choice;
}

window.gameUI = { initializeTopicSelection, displayQuestionOptions, selectPreference, loadOptionImages, renderTopicGrid, updatePaginationControls, changePage, toggleTopicsPanel, closeTopicsPanel, pickRandomTopic, getAvailableTopics: () => availableTopics };

function initializeConditionalSettings() {
    const timerRadios = document.querySelectorAll('input[name="need-timer"]');
    const timerDurationSetting = document.getElementById('timer-duration-setting');
    if (timerRadios && timerDurationSetting) {
        timerRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                timerDurationSetting.style.display = e.target.value === 'true' ? 'block' : 'none';
            });
        });
    }
    const followUpRadios = document.querySelectorAll('input[name="follow-up-option"]');
    const followUpTypeSetting = document.getElementById('follow-up-type-setting');
    const timerRadioContainer = document.querySelector('input[name="need-timer"]')?.closest('.setting-item');
    if (followUpRadios && followUpTypeSetting) {
        const checkedFollowUp = document.querySelector('input[name="follow-up-option"]:checked');
        const isFollowUpEnabled = checkedFollowUp?.value === 'true';
        followUpTypeSetting.style.display = isFollowUpEnabled ? 'block' : 'none';
        if (timerRadioContainer) timerRadioContainer.style.display = isFollowUpEnabled ? 'block' : 'none';
        if (timerDurationSetting) timerDurationSetting.style.display = 'none';
        followUpRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const isEnabled = e.target.value === 'true';
                followUpTypeSetting.style.display = isEnabled ? 'block' : 'none';
                if (timerRadioContainer) timerRadioContainer.style.display = isEnabled ? 'block' : 'none';
                if (timerDurationSetting && !isEnabled) timerDurationSetting.style.display = 'none';
            });
        });
    }
}

function initializeSettingsConfirmation(isOffline = false) {
    const confirmCheckbox = document.getElementById(isOffline ? 'offlineConfirmSettings' : 'confirmSettings');
    const topicsButton = document.getElementById('topicsToggle');
    const randomTopicButton = document.getElementById('randomTopicBtn');
    
    if (confirmCheckbox && topicsButton && randomTopicButton) {
        confirmCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                topicsButton.disabled = false;
                randomTopicButton.disabled = false;
            } else {
                topicsButton.disabled = true;
                randomTopicButton.disabled = true;
            }
        });
    }
}

function initializeOfflineConditionalSettings() {
    const timerRadios = document.querySelectorAll('input[name="offline-need-timer"]');
    if (timerRadios.length > 0) {
        timerRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const isEnabled = e.target.value === 'true';
                const timerDurationSetting = document.getElementById('offline-timer-duration-setting');
                if (timerDurationSetting) {
                    timerDurationSetting.style.display = isEnabled ? 'block' : 'none';
                }
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (window.gameUI) window.gameUI.initializeTopicSelection();
    
    const gameMode = CONFIG_UTILS.getStorageItem('GAME_MODE');
    
    if (gameMode === GAME_CONFIG.MODES.MULTIPLAYER) {
        initializeConditionalSettings();
        initializeSettingsConfirmation(false);
    } else if (gameMode === GAME_CONFIG.MODES.OFFLINE) {
        initializeOfflineConditionalSettings();
        initializeSettingsConfirmation(true);
        
        const option1 = CONFIG_UTILS.getElement('option1');
        const option2 = CONFIG_UTILS.getElement('option2');
        if (option1) option1.onclick = () => window.gameUI.selectPreference('option1');
        if (option2) option2.onclick = () => window.gameUI.selectPreference('option2');
    }
});