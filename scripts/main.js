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
                setTopic(e.target.value);
            });
        }
    });
});
function submitAnswer() {
    const answer = document.getElementById('answer').value;
    const name = document.getElementById('name').value;

    // Retrieve existing answers from localStorage or initialize as empty object
    const existingAnswers = JSON.parse(localStorage.getItem('submittedAnswers')) || {};

    // Add/update the answer for the current name
    existingAnswers[name] = answer;

    // Save the updated answers to localStorage
    localStorage.setItem('submittedAnswers', JSON.stringify(existingAnswers));

    // Clear the input boxes for the next player
    document.getElementById('answer').value = '';
    document.getElementById('name').value = '';

    // Display all answers on the page
    displayAnswers();
}

// displayAnswers is implemented in scripts/answers.js and will be available globally

// displayAnswers will register itself on DOMContentLoaded from scripts/answers.js
const finalBtn = document.getElementById('final_submit');
if (finalBtn) finalBtn.addEventListener('click', function() {
    // Save the current question and submitted answers to sessionStorage
    const questionElem = document.getElementById('question');
    const currentQuestion = questionElem ? questionElem.textContent : '';
    const answers = JSON.parse(localStorage.getItem('submittedAnswers')) || {};

    // question.js expects an array under 'questions'
    sessionStorage.setItem('questions', JSON.stringify([currentQuestion]));
    sessionStorage.setItem('currentAnswers', JSON.stringify(answers));

    // Redirect to the display/results page
    window.location.href = 'display.html';
});