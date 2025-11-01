// scripts/answers.js
// Renders submitted answers (reads from localStorage and saves to sessionStorage).
// Safe to include on both index.html and display.html.

function displayAnswers() {
    // Read answers from localStorage (used while collecting answers)
    const storedLocal = JSON.parse(localStorage.getItem('submittedAnswers')) || {};
    // Read any answers already stored in sessionStorage (used on the display page after redirect)
    const storedSession = JSON.parse(sessionStorage.getItem('currentAnswers')) || {};

    // Only copy local -> session if there are actual local answers to persist
    const hasLocalAnswers = Object.keys(storedLocal).length > 0;
    if (hasLocalAnswers) {
        try {
            sessionStorage.setItem('currentAnswers', JSON.stringify(storedLocal));
        } catch (e) {
            console.warn('Could not write currentAnswers to sessionStorage', e);
        }
    }

    // Decide which source to render from:
    // - If we're on the main page (answersList exists), prefer storedLocal
    // - If we're on the display page (answers-list exists), prefer storedSession (set by main.js before redirect)
    const answers = (document.getElementById('answersList')) ? storedLocal : storedSession;

    function renderInto(container, sourceAnswers) {
        if (!container) return;
        container.innerHTML = '';
        const entries = Object.entries(sourceAnswers || answers);
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
    // If display page exists but session had no answers, try to render from local as a fallback
    if (answersListDisplay) {
        const displaySource = Object.keys(storedSession).length > 0 ? storedSession : storedLocal;
        renderInto(answersListDisplay, displaySource);
    }
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

const swipeTarget = document.querySelector('#next-btn');

function swipeRightAndReturn(){
    swipeTarget.classList.add('swipe-right');
    const swipeDuration = 200;
    setTimeout(() => {
        swipeTarget.classList.remove('swipe-right');
    }, swipeDuration);
}

swipeTarget.addEventListener('click', swipeRightAndReturn);