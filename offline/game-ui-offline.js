// Deprecated shim: offline logic now lives in offline/offline.js
/* DELETED: moved to offline/offline.js
   Original file removed; keep this stub to avoid 404s during development.
   Use ../offline/offline.js instead. */
// Simplified answer selection and submit button logic for offline mode

let selectedAnswer = null;

function displayQuestionOptionsOffline(question) {
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    selectedAnswer = null;
    updateSubmitButtonOffline();
    question.options.forEach((option, idx) => {
        const btn = document.createElement('button');
        btn.className = 'preference-option';
        btn.textContent = option;
        btn.onclick = () => selectAnswerOffline(option, btn);
        optionsContainer.appendChild(btn);
    });
}

function selectAnswerOffline(answer, btn) {
    selectedAnswer = answer;
    document.querySelectorAll('.preference-option').forEach(opt => opt.classList.remove('SELECTED'));
    btn.classList.add('SELECTED');
    updateSubmitButtonOffline();
}

function updateSubmitButtonOffline() {
    const submitBtn = document.getElementById('submitButton');
    if (submitBtn) {
        submitBtn.disabled = !selectedAnswer;
        submitBtn.classList.toggle('disabled', !selectedAnswer);
    }
}

function getSelectedAnswerOffline() {
    return selectedAnswer;
}

// Dynamically load and inject all offline HTML elements
function loadOfflineHtmlElements() {
    fetch('../offline/offline.html')
        .then(response => response.text())
        .then(html => {
            const container = document.createElement('div');
            container.innerHTML = html;
            const main = document.querySelector('main');
            if (main) {
                // Insert each child at the top of <main>
                Array.from(container.children).forEach(child => {
                    main.insertBefore(child, main.firstChild);
                });
            }
        })
        .catch(err => console.error('Failed to load offline HTML elements:', err));
}

// Example usage: load when offline mode is detected
if (sessionStorage.getItem('gameMode') === 'offline') {
    window.addEventListener('DOMContentLoaded', loadOfflineHtmlElements);
}

// Export functions for offline game logic
window.displayQuestionOptionsOffline = displayQuestionOptionsOffline;
window.selectAnswerOffline = selectAnswerOffline;
window.updateSubmitButtonOffline = updateSubmitButtonOffline;
window.getSelectedAnswerOffline = getSelectedAnswerOffline;
