// scripts/answers.js
// Renders submitted answers (reads from localStorage and saves to sessionStorage).
// Safe to include on both index.html and display.html.

function displayAnswers() {
    // Read chronological submissions from localStorage (used while collecting answers)
    const submissions = JSON.parse(localStorage.getItem('chronologicalSubmissions')) || [];

    function renderInto(container) {
        if (!container) return;
        container.innerHTML = '';
        
        if (submissions.length === 0) {
            container.textContent = 'No answers submitted yet.';
            return;
        }

        const list = document.createElement('div');
        list.className = 'answers-entries';
        
        // Show all submissions in chronological order
        submissions.sort((a, b) => a.timestamp - b.timestamp);
        
        submissions.forEach(submission => {
            const item = document.createElement('div');
            item.className = 'answer-item';
            
            const questionDiv = document.createElement('div');
            questionDiv.className = 'submission-question';
            questionDiv.textContent = `Q: ${submission.question}`;
            
            const answerDiv = document.createElement('div');
            answerDiv.className = 'submission-answer';
            const who = document.createElement('strong');
            who.textContent = submission.name + ': ';
            const text = document.createElement('span');
            text.textContent = submission.answer;
            answerDiv.appendChild(who);
            answerDiv.appendChild(text);
            
            item.appendChild(questionDiv);
            item.appendChild(answerDiv);
            list.appendChild(item);
        });

        container.appendChild(list);
    }

    // Only render on the main page - display page uses its own logic
    const answersListMain = document.getElementById('answersList');
    if (answersListMain) {
        renderInto(answersListMain);
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
