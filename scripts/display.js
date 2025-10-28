// display.js - Display page functionality
// Handles results display and navigation for the display page only
// === DISPLAY PAGE QUESTION NAVIGATION ===
const questionsInOrder = JSON.parse(sessionStorage.getItem('questionsInOrder')) || [];
const submissionsByQuestion = JSON.parse(sessionStorage.getItem('submissionsByQuestion')) || {};
let currentIndex = 0;
// Load color scheme on page load
window.addEventListener('DOMContentLoaded', function() {
    loadTopicColorScheme();
});
function showQuestion(index) {
    const header = document.getElementById('question-header');
    const nextBtn = document.getElementById('next-btn');
    const backHomeBtn = document.getElementById('back-home-btn');
    if (questionsInOrder.length > 0 && questionsInOrder[index]) {
        header.textContent = questionsInOrder[index];
        // Show next button, hide back home button
        if (nextBtn) nextBtn.classList.remove('hidden');
        if (backHomeBtn) backHomeBtn.classList.add('hidden');
    } else {
        header.textContent = "All questions completed!";
        // Hide next button, show back home button
        if (nextBtn) nextBtn.classList.add('hidden');
        if (backHomeBtn) backHomeBtn.classList.remove('hidden');
    }
}
function renderAnswers() {
    const container = document.getElementById('answers-list');
    if (!container) return;
    container.innerHTML = '';
    const currentQuestion = questionsInOrder[currentIndex];
    if (!currentQuestion) {
        container.textContent = 'No answers for this question.';
        return;
    }
    const submissions = submissionsByQuestion[currentQuestion] || [];
    if (submissions.length === 0) {
        container.textContent = 'No answers submitted for this question.';
        return;
    }
    const list = document.createElement('div');
    list.className = 'answers-entries';
    // Sort submissions by timestamp to show them in order they were submitted
    submissions.sort((a, b) => a.timestamp - b.timestamp);
    submissions.forEach(submission => {
        const item = document.createElement('div');
        item.className = 'answer-item';
        const who = document.createElement('strong');
        who.textContent = submission.name + ': ';
        const text = document.createElement('span');
        text.textContent = submission.answer;
        item.appendChild(who);
        item.appendChild(text);
        list.appendChild(item);
    });
    container.appendChild(list);
}
document.getElementById('next-btn')?.addEventListener('click', () => {
    currentIndex++;
    showQuestion(currentIndex);
    renderAnswers();
});
document.getElementById('back-home-btn')?.addEventListener('click', () => {
    // Clear session data for a fresh start
    sessionStorage.removeItem('playerCount');
    sessionStorage.removeItem('questionsInOrder');
    sessionStorage.removeItem('submissionsByQuestion');
    // Go back to home
    window.location.href = 'index.html';
});
// initial render
showQuestion(currentIndex);
renderAnswers();
// === INITIALIZATION ===
// Load color scheme and initialize display on page load
window.addEventListener('DOMContentLoaded', function() {
    if (window.loadTopicColorScheme) {
        window.loadTopicColorScheme();
    }
    // Initialize display
    showQuestion(currentIndex);
    renderAnswers();
});