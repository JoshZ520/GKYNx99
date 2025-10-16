// initialize global topic and appQuestions so they are available everywhere in this script
window.currentTopic = window.currentTopic || 'default';

// topics will be loaded from files/questions.json
let topics = {};
let appQuestions = [];

function loadQuestions() {
    return fetch('files/questions.json')
        .then(res => {
            if (!res.ok) throw new Error('Failed to load questions.json');
            return res.json();
        })
        .then(data => {
            topics = data || {};
            // ensure default exists
            if (!topics.default) topics.default = [];
            return topics;
        })
        .catch(err => {
            console.error('Error loading questions.json:', err);
            topics = { default: [] };
            return topics;
        });
}
// helpers to change topic and questions
function applyQuestionsForTopic(topic) {
    const list = (topics && topics[topic]) || topics['default'] || [];
    appQuestions.splice(0, appQuestions.length, ...list);

    const questionElem = document.getElementById('question');
    if (questionElem) {
        questionElem.setAttribute('data-index', 0);
        questionElem.textContent = appQuestions[0] || '';
    }
}

function setTopic(topic) {
    window.currentTopic = topic;
    applyQuestionsForTopic(topic);
    localStorage.setItem('currentTopic', topic);
}

// Utility: count how many distinct players have submitted an answer for the current question index
function getSubmittedCountForIndex(indexOverride) {
    const existingAnswers = JSON.parse(localStorage.getItem('submittedAnswers')) || {};
    const questionElem = document.getElementById('question');
    const currentIndex = typeof indexOverride === 'number' ? indexOverride : (parseInt(questionElem?.getAttribute('data-index')) || 0);
    let count = 0;
    Object.keys(existingAnswers).forEach(name => {
        const arr = existingAnswers[name];
        if (Array.isArray(arr) && arr[currentIndex]) count += 1;
    });
    return count;
}

// Update buttons and inputs according to the selected player count and current submission progress
function updateSubmissionState() {
    const playerCount = parseInt(sessionStorage.getItem('playerCount')) || null;
    const submitBtn = document.getElementById('submitButton');
    const finalBtn = document.getElementById('final_submit');
    const answerInput = document.getElementById('answer');
    const nameInput = document.getElementById('name');
    if (!submitBtn || !finalBtn) return;

    if (playerCount && playerCount > 0) {
        const submitted = getSubmittedCountForIndex();
        if (submitted >= playerCount) {
            // hide/disable submit, show final only
            submitBtn.style.display = 'none';
            finalBtn.style.display = '';
            if (answerInput) answerInput.disabled = true;
            if (nameInput) nameInput.disabled = true;
            return;
        }

        // not yet reached count: show submit and hide final
        submitBtn.style.display = '';
        finalBtn.style.display = 'none';
        if (answerInput) answerInput.disabled = false;
        if (nameInput) nameInput.disabled = false;
    } else {
        // no playerCount set -> default behavior (both visible)
        submitBtn.style.display = '';
        finalBtn.style.display = '';
        if (answerInput) answerInput.disabled = false;
        if (nameInput) nameInput.disabled = false;
    }
}
// Pick a random topic (excluding the 'default' fallback and any non-topic keys)
function pickRandomTopic() {
    const keys = Object.keys(topics || {}).filter(k => k && k !== 'default');
    if (!keys || keys.length === 0) {
        // Fall back to default if nothing else
        setTopic('default');
        return 'default';
    }
    // Choose a random topic key
    const choice = keys[Math.floor(Math.random() * keys.length)];
    setTopic(choice);
    return choice;
}

// safe attach: only add listeners if elements exist
const submitBtn = document.getElementById('submitButton');
if (submitBtn) submitBtn.addEventListener('click', submitAnswer);
const switchBtn = document.getElementById('switchQuestion');
if (switchBtn) switchBtn.addEventListener('click', function() {
    // Advance to the next question in the current topic (do not change the topic)
    const questionElem = document.getElementById('question');
    if (!questionElem) return;
    if (!Array.isArray(appQuestions) || appQuestions.length === 0) {
        // no questions available for the current topic
        questionElem.textContent = '';
        questionElem.setAttribute('data-index', 0);
        return;
    }

    let currentIndex = parseInt(questionElem.getAttribute('data-index')) || 0;
    currentIndex = (currentIndex + 1) % appQuestions.length;
    questionElem.textContent = appQuestions[currentIndex];
    questionElem.setAttribute('data-index', currentIndex);
    // Update submission UI state for the new question index
    updateSubmissionState();
});

// wire the topic dropdown and restore persisted topic after loading questions
window.addEventListener('DOMContentLoaded', function () {
    loadQuestions().then(() => {
        const saved = localStorage.getItem('currentTopic');
        if (saved && topics[saved]) {
            window.currentTopic = saved;
            applyQuestionsForTopic(saved);
            const select = document.getElementById('topicSelect');
            if (select) select.value = saved;
        } else {
            // apply default topic
            applyQuestionsForTopic(window.currentTopic || 'default');
        }

        const select = document.getElementById('topicSelect');
        if (select) {
            select.addEventListener('change', function (e) {
                const val = e.target.value;
                if (val === 'random') {
                    // pick and apply a random topic
                    pickRandomTopic();
                } else {
                    setTopic(val);
                }
            });

            // If the dropdown's current value is the built-in 'random' selection on load,
            // immediately pick a random topic so the UI shows a real question set.
            if (select.value === 'random') {
                pickRandomTopic();
            }
        }

        // Ensure submission state reflects any configured player count on initial load
        updateSubmissionState();
    });
});
function submitAnswer() {
    const answer = document.getElementById('answer').value;
    const name = document.getElementById('name').value;

    // Retrieve existing answers from localStorage or initialize as empty object
    const existingAnswers = JSON.parse(localStorage.getItem('submittedAnswers')) || {};

    // Enforce player count if set
    const playerCount = parseInt(sessionStorage.getItem('playerCount')) || null;
    const questionElem = document.getElementById('question');
    const currentIndex = parseInt(questionElem?.getAttribute('data-index')) || 0;
    const currentSubmitted = getSubmittedCountForIndex(currentIndex);
    if (playerCount && currentSubmitted >= playerCount) {
        // already reached the expected number of answers for this question
        updateSubmissionState();
        return;
    }

    // Add/update the answer for the current name and question index
    // (questionElem and currentIndex were computed above)
    if (!existingAnswers[name] || !Array.isArray(existingAnswers[name])) existingAnswers[name] = [];
    existingAnswers[name][currentIndex] = answer;

    // Save the updated answers to localStorage
    localStorage.setItem('submittedAnswers', JSON.stringify(existingAnswers));

    // Clear the input boxes for the next player
    document.getElementById('answer').value = '';
    document.getElementById('name').value = '';

    // Display all answers on the page
    displayAnswers();

    // Update UI state in case we've reached the player count
    updateSubmissionState();
}

// displayAnswers is implemented in scripts/answers.js and will be available globally

// displayAnswers will register itself on DOMContentLoaded from scripts/answers.js
const finalBtn = document.getElementById('final_submit');
if (finalBtn) finalBtn.addEventListener('click', function() {
    // Save the current question and submitted answers to sessionStorage
    const questionElem = document.getElementById('question');
    const answers = JSON.parse(localStorage.getItem('submittedAnswers')) || {};

    // Pass the full questions list to the display page so it can step through all questions
    sessionStorage.setItem('questions', JSON.stringify(appQuestions));
    sessionStorage.setItem('currentAnswers', JSON.stringify(answers));
    // Redirect to the display/results page

    // Clear stored answers so the next run starts fresh, but keep other persisted settings (like currentTopic)
    try {
        localStorage.removeItem('submittedAnswers');
    } catch (e) {
        console.warn('Could not remove submittedAnswers from localStorage', e);
    }

    // Redirect to the display/results page
    window.location.href = 'display.html';
});