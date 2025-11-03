// display.js - Display page functionality
// Handles results display and navigation for the display page only
// === DISPLAY PAGE QUESTION NAVIGATION ===
const questionsData = JSON.parse(sessionStorage.getItem('questionsInOrder')) || [];
const submissionsByQuestion = JSON.parse(sessionStorage.getItem('submissionsByQuestion')) || {};
// Convert questionsData to simple array of question strings
const questionsInOrder = questionsData.map(item => {
    // Handle both old format (string) and new format (object)
    return typeof item === 'string' ? item : item.question;
});
let currentIndex = 0;

console.log('Display page loaded with:', {
    questionsCount: questionsInOrder.length,
    submissionsCount: Object.keys(submissionsByQuestion).length
});
// Color scheme now handled by CSS variables only
window.addEventListener('DOMContentLoaded', function() {
    // Static color scheme - no dynamic loading needed
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
    
    const questionData = submissionsByQuestion[currentQuestion];
    if (!questionData || !questionData.answers) {
        container.textContent = 'No answers submitted for this question.';
        return;
    }
    
    const answers = questionData.answers;
    const answerEntries = Object.entries(answers);
    
    if (answerEntries.length === 0) {
        container.textContent = 'No answers submitted for this question.';
        return;
    }
    
    const list = document.createElement('div');
    list.className = 'answers-entries';
    
    // Convert answers object to array and display
    answerEntries.forEach(([playerName, answer]) => {
        const item = document.createElement('div');
        item.className = 'answer-item';
        const who = document.createElement('strong');
        who.textContent = playerName + ': ';
        const text = document.createElement('span');
        text.textContent = answer;
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
    sessionStorage.removeItem('playerNames');
    sessionStorage.removeItem('playerData');
    sessionStorage.removeItem('gameMode');
    sessionStorage.removeItem('offlineMode');
    
    // Check if we're in offline mode
    const isOffline = sessionStorage.getItem('offlineMode') === 'true';
    if (isOffline) {
        // Go back to offline front page
        window.location.href = 'front-pg.html';
    } else {
        // Go back to main index
        window.location.href = '../index.html';
    }
});
// initial render
showQuestion(currentIndex);
renderAnswers();
// === INITIALIZATION ===
// Initialize display on page load
window.addEventListener('DOMContentLoaded', function() {
    // Color scheme handled by static CSS variables
    // Initialize display
    showQuestion(currentIndex);
    renderAnswers();
});