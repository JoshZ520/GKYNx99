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

document.getElementById('submitButton').addEventListener('click', submitAnswer);
document.getElementById('switchQuestion').addEventListener('click', function() {
    // toggle topic and replace the questions array contents accordingly
    if (window.currentTopic === 'default' || !window.currentTopic) {
        window.currentTopic = 'dnd';
        questions.splice(0, questions.length,
            "What is your favorite D&D class?",
            "Do you prefer roleplaying or combat in D&D sessions?",
            "What is your favorite part of D&D?"
        );
    } else {
        window.currentTopic = 'default';
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
    let currentIndex = parseInt(questionElem.getAttribute('data-index')) || 0;
    currentIndex = (currentIndex + 1) % questions.length;
    questionElem.textContent = questions[currentIndex];
    questionElem.setAttribute('data-index', currentIndex);
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