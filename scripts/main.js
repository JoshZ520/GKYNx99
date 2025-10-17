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
    // Update UI state after topic change (with small delay to ensure DOM is updated)
    setTimeout(() => updateSubmissionState(), 0);
}

// Utility: count how many answers have been submitted for the current question
function getSubmittedCountForCurrentQuestion() {
    const questionElem = document.getElementById('question');
    const currentQuestion = questionElem?.textContent || '';
    const submissions = JSON.parse(localStorage.getItem('chronologicalSubmissions')) || [];
    return submissions.filter(sub => sub.question === currentQuestion).length;
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
        const submitted = getSubmittedCountForCurrentQuestion();
        console.log('updateSubmissionState:', { playerCount, submitted }); // Debug
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
    const questionElem = document.getElementById('question');
    const currentQuestion = questionElem?.textContent || '';

    console.log('submitAnswer called:', { answer, name, currentQuestion }); // Debug

    if (!answer.trim() || !name.trim() || !currentQuestion.trim()) {
        console.log('Submission blocked: empty fields'); // Debug
        return; // Don't submit empty answers
    }

    // Get chronological submissions list
    const submissions = JSON.parse(localStorage.getItem('chronologicalSubmissions')) || [];
    
    // Check if this question already has enough answers (if player count is set)
    const playerCount = parseInt(sessionStorage.getItem('playerCount')) || null;
    if (playerCount) {
        const answersForThisQuestion = submissions.filter(sub => sub.question === currentQuestion).length;
        console.log('Player count check:', { playerCount, answersForThisQuestion }); // Debug
        if (answersForThisQuestion >= playerCount) {
            console.log('Submission blocked: player count reached'); // Debug
            updateSubmissionState();
            return;
        }
    }

    // Add new submission with timestamp
    const submission = {
        question: currentQuestion,
        answer: answer.trim(),
        name: name.trim(),
        timestamp: Date.now(),
        topic: window.currentTopic || 'unknown'
    };
    
    submissions.push(submission);

    // Save chronological submissions
    localStorage.setItem('chronologicalSubmissions', JSON.stringify(submissions));

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
    // Get chronological submissions
    const submissions = JSON.parse(localStorage.getItem('chronologicalSubmissions')) || [];
    
    if (submissions.length === 0) {
        alert('No answers submitted yet!');
        return;
    }

    // Group submissions by question (in order they were first answered)
    const questionOrder = [];
    const submissionsByQuestion = {};
    
    submissions.forEach(submission => {
        if (!submissionsByQuestion[submission.question]) {
            submissionsByQuestion[submission.question] = [];
            questionOrder.push(submission.question);
        }
        submissionsByQuestion[submission.question].push(submission);
    });

    // Pass chronological data to display page
    sessionStorage.setItem('questionsInOrder', JSON.stringify(questionOrder));
    sessionStorage.setItem('submissionsByQuestion', JSON.stringify(submissionsByQuestion));
    // Redirect to the display/results page

    // Clear stored submissions so the next run starts fresh, but keep other persisted settings (like currentTopic)
    try {
        localStorage.removeItem('chronologicalSubmissions');
    } catch (e) {
        console.warn('Could not remove chronologicalSubmissions from localStorage', e);
    }

    // Redirect to the display/results page
    window.location.href = 'display.html';
});

 const dropdownBtn = document.querySelector('#open_page');
 const directions = document.querySelector('#directions');

 function dropdown(){
     directions.classList.toggle('hide');
 }

 dropdownBtn.addEventListener('click', dropdown);