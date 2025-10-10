// initialize global topic and questions so they are available everywhere in this script
window.currentTopic = window.currentTopic || 'default';

let questions = [
    "What do you like to eat in the morning?",
    "What is your favorite color?",
    "What is your dream vacation spot?",
    "If you could have any superpower, what would it be?",
    "What is your favorite hobby?",
    "If you could meet any historical figure, who would it be?",
    "What is your favorite movie or TV show?",
    "What is one thing you can't live without?",
    "What is your favorite book?",
    "If you could travel anywhere in the world, where would you go?",
    "What is your favorite season and why?",
    "What is your favorite animal?",
    "What is a fun fact about yourself?",
    "What is your favorite way to relax?",
    "If you could learn any skill instantly, what would it be?"
];
// helpers to change topic and questions
function applyQuestionsForTopic(topic) {
    if (topic === 'dnd') {
        questions.splice(0, questions.length,
            "What is your favorite D&D class?",
            "Do you prefer roleplaying or combat in D&D sessions?",
            "What is your favorite part of D&D?"
        );
    } else if (topic === 'movies') {
        questions.splice(0, questions.length,
            "What's your favorite movie of all time?",
            "Which TV show are you currently watching?",
            "Which movie character do you relate to the most?"
        );
    } else if (topic === 'sports') {
        questions.splice(0, questions.length,
            "What's your favorite sport to watch or play?",
            "Do you have a favorite team or athlete?",
            "What's your most memorable sports moment?"
        );
    } else if (topic === 'music') {
        questions.splice(0, questions.length,
            "What's the best concert you've ever been to?",
            "What's your favorite music genre right now?",
            "Which artist do you think everyone should listen to?"
        );
    } else if (topic === 'tech') {
        questions.splice(0, questions.length,
            "What's one gadget you can't live without?",
            "Which app do you use most days?",
            "What's a tech trend you find exciting (or annoying)?"
        );
    } else if (topic === 'travel') {
        questions.splice(0, questions.length,
            "What's the best place you've ever visited?",
            "Do you prefer relaxing vacations or active/adventure trips?",
            "What's one place on your travel bucket list?"
        );
    } else if (topic === 'history') {
        questions.splice(0, questions.length,
            "If you could witness one historical event, which would it be?",
            "Which historical figure fascinates you most?",
            "What's a lesser-known historical fact you find interesting?"
        );
    } else if (topic === 'books') {
        questions.splice(0, questions.length,
            "What's a book you think everyone should read?",
            "Do you prefer fiction or non-fiction?",
            "Which book character would you most like to meet?"
        );
    } else if (topic === 'games') {
        questions.splice(0, questions.length,
            "What's your favorite board or video game?",
            "Do you prefer cooperative or competitive games?",
            "What's a game you always recommend to friends?"
        );
    } else if (topic === 'food') {
        questions.splice(0, questions.length,
            "What's your go-to comfort food?",
            "Do you prefer sweet or savory?",
            "What's the best meal you've ever had?"
        );
    } else {
        questions.splice(0, questions.length,
            "What do you like to eat in the morning?",
            "What is your favorite color?",
            "What is your dream vacation spot?",
            "If you could have any superpower, what would it be?",
            "What is your favorite hobby?",
            "If you could meet any historical figure, who would it be?",
            "What is your favorite movie or TV show?",
            "What is one thing you can't live without?",
            "What is your favorite book?",
            "If you could travel anywhere in the world, where would you go?",
            "What is your favorite season and why?",
            "What is your favorite animal?",
            "What is a fun fact about yourself?",
            "What is your favorite way to relax?",
            "If you could learn any skill instantly, what would it be?"
        );
    }

    const questionElem = document.getElementById('question');
    if (questionElem) {
        questionElem.setAttribute('data-index', 0);
        questionElem.textContent = questions[0] || '';
    }
}

function setTopic(topic) {
    window.currentTopic = topic;
    applyQuestionsForTopic(topic);
    localStorage.setItem('currentTopic', topic);
}

document.getElementById('submitButton').addEventListener('click', submitAnswer);
document.getElementById('switchQuestion').addEventListener('click', function() {
    // Advance to the next question in the current topic (do not change the topic)
    const questionElem = document.getElementById('question');
    if (!questionElem) return;
    if (!Array.isArray(questions) || questions.length === 0) {
        // no questions available for the current topic
        questionElem.textContent = '';
        questionElem.setAttribute('data-index', 0);
        return;
    }

    let currentIndex = parseInt(questionElem.getAttribute('data-index')) || 0;
    currentIndex = (currentIndex + 1) % questions.length;
    questionElem.textContent = questions[currentIndex];
    questionElem.setAttribute('data-index', currentIndex);
});

// wire the topic dropdown and restore persisted topic
window.addEventListener('DOMContentLoaded', function () {
    // restore saved topic
    const saved = localStorage.getItem('currentTopic');
    if (saved) {
        window.currentTopic = saved;
        applyQuestionsForTopic(saved);
        const select = document.getElementById('topicSelect');
        if (select) select.value = saved;
    }

    const select = document.getElementById('topicSelect');
    if (select) {
        select.addEventListener('change', function (e) {
            setTopic(e.target.value);
        });
    }
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

// Function to display all answers under each other
function displayAnswers() {
    const answers = JSON.parse(localStorage.getItem('submittedAnswers')) || {};
    const answersList = document.getElementById('answersList');
    answersList.innerHTML = ''; // Clear previous list

    Object.entries(answers).forEach(([name, answer]) => {
        const item = document.createElement('div');
        item.textContent = `${name}: ${answer}`;
        answersList.appendChild(item);
    });
}

// Call displayAnswers to show existing answers
window.addEventListener('DOMContentLoaded', displayAnswers);
document.getElementById('final_submit').addEventListener('click', function() {
    
    document.getElementById('answers').classList.add('show');
    document.getElementById('answersList').classList.add('show');
    document.getElementById('final_submit').classList.add('hide');
});

// function redirectToAnswersPage() {
//     const questionElem = document.getElementById('question');
//     const question = questionElem.textContent;
//     const answers = JSON.parse(localStorage.getItem('submittedAnswers')) || {};

//     // Store question and answers in sessionStorage for the answers page
//     sessionStorage.setItem('questions', question);
//     sessionStorage.setItem('currentAnswers', JSON.stringify(answers));

//     // Redirect to the answers page
//     window.location.href = 'display.html';
//     displayAnswers();
// }