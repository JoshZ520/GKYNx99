let topics = {};

function loadQuestions() {
    // Use absolute path from server root for consistency
    const basePath = '/src/data/questions/topics/';
    
    return fetch(basePath + 'index.json').then(res => {
        if (!res.ok) throw new Error('Failed to load topics/index.json');
        return res.json();
    })
    .then(topicsIndex => {
        const topicPromises = Object.keys(topicsIndex).map(topicName => {
            const topicInfo = topicsIndex[topicName];
            return fetch(`${basePath}${topicInfo.file}`)
                .then(res => {
                    if (!res.ok) throw new Error(`Failed to load ${topicInfo.file}`);
                    return res.json();
                })
                .then(topicData => {
                    topics[topicName] = {
                        questions: topicData.questions || [],
                        colors: topicData.colors || { option1: '#3b82f6', option2: '#10b981' }
                    };
                });
        });
        return Promise.all(topicPromises);
    })
    .then(() => {
        window.topics = topics;

        return { topics };
    })
    .catch(err => {
        console.error('Error loading questions from modular files:', err);
        topics = {};

        return { topics };
    });
}

function initializeDropdown() {
    const dropdownBtn = document.querySelector('#open_page');
    const directions = document.querySelector('#directions');
    
    function updateButtonState() {
        if (directions && dropdownBtn) {
            if (directions.classList.contains('hide')) {
                dropdownBtn.classList.add('collapsed');
            } else {
                dropdownBtn.classList.remove('collapsed');
            }
        }
    }
    
    function dropdown(){
        directions.classList.toggle('hide');
        updateButtonState();
    }
    
    // Function to close directions (used when user starts interacting)
    function closeDirections() {
        if (directions && !directions.classList.contains('hide')) {
            directions.classList.add('hide');
            updateButtonState();
        }
    }
    
    // Initialize button state (directions start expanded)
    if (dropdownBtn) {
        dropdownBtn.classList.remove('collapsed'); // Start with up arrow
        dropdownBtn.addEventListener('click', dropdown);
    }
    
    const switchBtn = document.querySelector('#switchQuestion');
    if (switchBtn) {
        switchBtn.addEventListener('click', closeDirections);
    }
}

window.addEventListener('DOMContentLoaded', function () {
    initializeDropdown();
    loadQuestions();
});

window.loadQuestions = loadQuestions;
window.getTopics = () => topics;