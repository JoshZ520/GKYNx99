// Save selected player count to sessionStorage so the main page can enforce submission limits
window.addEventListener('DOMContentLoaded', function () {
    const select = document.getElementById('player_count');
    if (!select) return;

    // When the selection changes, store the value as an integer in sessionStorage
    select.addEventListener('change', function (e) {
        const val = parseInt(e.target.value, 10);
        if (!Number.isNaN(val) && val > 0) {
            sessionStorage.setItem('playerCount', String(val));
        } else {
            sessionStorage.removeItem('playerCount');
        }
    });

    // If the user navigates to this page and then back, pre-select the stored value
    const stored = parseInt(sessionStorage.getItem('playerCount'), 10);
    if (!Number.isNaN(stored) && stored > 0) {
        const opt = Array.from(select.options).find(o => parseInt(o.value, 10) === stored);
        if (opt) select.value = String(stored);
    }

    // Load the current topic's color scheme if stored
    loadTopicColorScheme();
    
    // Load and display the front page instruction
    loadFrontPageInstruction();
});

// Function to load and display the front page instruction
function loadFrontPageInstruction() {
    fetch('files/questions.json')
        .then(res => res.json())
        .then(data => {
            const defaultData = data['default'];
            if (defaultData && defaultData.questions && defaultData.questions.length > 0) {
                // Use the first question as the front page instruction
                const frontInstruction = defaultData.questions[0];
                const instructionElement = document.getElementById('front-instruction');
                if (instructionElement) {
                    instructionElement.textContent = frontInstruction;
                }
            }
        })
        .catch(err => {
            console.warn('Could not load front page instruction:', err);
        });
}
