// Display page functionality - handles results display and navigation
// Combines question navigation and answer rendering for the display page

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

    if (questionsInOrder.length > 0 && questionsInOrder[index]) {
        header.textContent = questionsInOrder[index];
    } else {
        header.textContent = "No more questions.";
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) nextBtn.disabled = true;
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

    // simple confetti reveal if there are answers
    if (submissions.length > 0) {
        const confettiContainer = document.getElementById('confetti-container');
        if (confettiContainer) {
            // assign random horizontal offsets to each piece so the animation spreads from center
            const pieces = confettiContainer.querySelectorAll('.confetti-piece');
            const colors = ['#f94144','#f3722c','#f9844a','#f9c74f','#90be6d','#43aa8b','#577590','#277da1','#9b5de5','#ff6b6b'];
            pieces.forEach(piece => {
                // random pixel offset between -250 and 250
                const x = Math.floor((Math.random() - 0.5) * 500);
                piece.style.setProperty('--confetti-x', x + 'px');
                // position all pieces at the center (they are absolutely positioned relative to fixed container)
                piece.style.left = '0px';
                piece.style.top = '0px';

                // vary size a bit
                const w = 8 + Math.floor(Math.random() * 10);
                const h = 12 + Math.floor(Math.random() * 12);
                piece.style.width = w + 'px';
                piece.style.height = h + 'px';

                // random color
                const color = colors[Math.floor(Math.random() * colors.length)];
                piece.style.backgroundImage = 'none';
                piece.style.backgroundColor = color;

                // stagger animation timings so pieces don't perfectly overlap
                const delay = Math.floor(Math.random() * 500); // ms
                const duration = 1400 + Math.floor(Math.random() * 1000); // ms
                piece.style.animationDelay = delay + 'ms';
                piece.style.animationDuration = duration + 'ms';
            });

            // ensure container is visible
            confettiContainer.style.display = '';
            confettiContainer.classList.add('show');

            // compute the maximum time any piece will take (delay + duration) and hide after that
            let maxTime = 0;
            pieces.forEach(piece => {
                // read computed animation-delay and animation-duration (may be in ms or s)
                const style = window.getComputedStyle(piece);
                const delayStr = style.animationDelay || piece.style.animationDelay || '0ms';
                const durStr = style.animationDuration || piece.style.animationDuration || '2000ms';

                function toMs(str) {
                    if (!str) return 0;
                    str = str.trim();
                    if (str.endsWith('ms')) return parseFloat(str);
                    if (str.endsWith('s')) return parseFloat(str) * 1000;
                    return parseFloat(str) || 0;
                }

                const delay = toMs(delayStr);
                const dur = toMs(durStr);
                const total = delay + dur;
                if (total > maxTime) maxTime = total;
            });

            const buffer = 250; // ms buffer after animations
            setTimeout(() => {
                confettiContainer.classList.remove('show');
                // hide container so it doesn't sit atop the page
                confettiContainer.style.display = 'none';
            }, Math.ceil(maxTime + buffer));
        }
    }
}

document.getElementById('next-btn')?.addEventListener('click', () => {
    currentIndex++;
    showQuestion(currentIndex);
    renderAnswers();
});

// initial render
showQuestion(currentIndex);
renderAnswers();

// === MAIN PAGE ANSWER DISPLAY ===
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