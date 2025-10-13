const questions = JSON.parse(sessionStorage.getItem('questions')) || [];
let currentIndex = 0;

function showQuestion(index) {
    const header = document.getElementById('question-header');

    if (questions.length > 0 && questions[index]) {
        // If questions are objects, use questions[index].text; if strings, use questions[index]
        header.textContent = typeof questions[index] === 'object' && questions[index] !== null
            ? questions[index].text || "Question text missing."
            : questions[index];
    } else {
        header.textContent = "No more questions.";
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) nextBtn.disabled = true;
    }
}

function renderAnswers() {
    const answers = JSON.parse(sessionStorage.getItem('currentAnswers')) || {};
    const container = document.getElementById('answers-list');
    if (!container) return;

    container.innerHTML = '';
    const entries = Object.entries(answers);
    if (entries.length === 0) {
        container.textContent = 'No answers submitted.';
        return;
    }

    const list = document.createElement('div');
    list.className = 'answers-entries';
    entries.forEach(([name, answerArr]) => {
        const item = document.createElement('div');
        item.className = 'answer-item';
        const who = document.createElement('strong');
        who.textContent = name + ': ';
        const text = document.createElement('span');
        const answerForThisQuestion = Array.isArray(answerArr) ? answerArr[currentIndex] : answerArr;
        text.textContent = answerForThisQuestion || '';
        item.appendChild(who);
        item.appendChild(text);
        list.appendChild(item);
    });

    container.appendChild(list);

    // simple confetti reveal if there are answers
    if (entries.length > 0) {
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