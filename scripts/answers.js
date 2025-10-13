// scripts/answers.js
// Renders submitted answers (reads from localStorage and saves to sessionStorage).
// Safe to include on both index.html and display.html.

function displayAnswers() {
    const answers = JSON.parse(localStorage.getItem('submittedAnswers')) || {};

    // Persist answers for the display page to read
    try {
        sessionStorage.setItem('currentAnswers', JSON.stringify(answers));
    } catch (e) {
        console.warn('Could not write currentAnswers to sessionStorage', e);
    }

    function renderInto(container) {
        if (!container) return;
        container.innerHTML = '';

        const entries = Object.entries(answers);
        if (entries.length === 0) {
            container.textContent = 'No answers submitted.';
            return;
        }

        const list = document.createElement('div');
        list.className = 'answers-entries';
        entries.forEach(([name, answer]) => {
            const item = document.createElement('div');
            item.className = 'answer-item';
            const who = document.createElement('strong');
            who.textContent = name + ': ';
            const text = document.createElement('span');
            text.textContent = answer;
            item.appendChild(who);
            item.appendChild(text);
            list.appendChild(item);
        });

        container.appendChild(list);
    }

    const answersListMain = document.getElementById('answersList');
    renderInto(answersListMain);

    const answersListDisplay = document.getElementById('answers-list');
    renderInto(answersListDisplay);
}

// expose globally in case code calls it explicitly
window.displayAnswers = displayAnswers;

// Run displayAnswers when DOM is ready
window.addEventListener('DOMContentLoaded', function () {
    try {
        displayAnswers();
    } catch (e) {
        console.warn('displayAnswers failed on DOMContentLoaded', e);
    }
});
