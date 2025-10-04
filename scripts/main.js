document.getElementById('submitButton').addEventListener('click', submitAnswer);

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

// Call displayAnswers on page load to show existing answers
window.addEventListener('DOMContentLoaded', displayAnswers);
document.getElementById('final_submit').addEventListener('click', function() {
     document.getElementById(`answers`).style.display = 'block';
    document.getElementById('answersList').style.display = 'block';
    this.style.display = 'none';
});

// Hide answers list by default on page load
window.addEventListener('DOMContentLoaded', function() {
    document.getElementById(`answers`).style.display = 'none';
    document.getElementById('answersList').style.display = 'none';
    document.getElementById('final_submit').style.display = '';
});