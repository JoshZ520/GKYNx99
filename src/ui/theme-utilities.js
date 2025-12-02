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

document.getElementById("whiteButton").addEventListener("click", () => {
    document.documentElement.style.setProperty("--text-dark", "rgb(0 0 0)");
    document.documentElement.style.setProperty("--dark", "rgb(0 0 0)");
    document.documentElement.style.setProperty("--accent-dark", "rgb(64 64 64)");
    document.documentElement.style.setProperty("--accent-light", "rgb(128 128 128)");
    /*document.documentElement.style.setProperty("", "rgb(192 192 192)");*/
    document.documentElement.style.setProperty("--background-light", "rgb(255 255 255)");
});

document.getElementById("redButton").addEventListener("click", () => {
    document.documentElement.style.setProperty("--text-dark", "#421010");
    document.documentElement.style.setProperty("--dark", "#421010");
    document.documentElement.style.setProperty("--accent-dark", "#8a2424");
    document.documentElement.style.setProperty("--accent-light", "#c94444");
    /*document.documentElement.style.setProperty("", "#e88e8e");*/
    document.documentElement.style.setProperty("--background-light", "#fab9b9");
});

document.getElementById("orangeButton").addEventListener("click", () => {
    document.documentElement.style.setProperty("--text-dark", "#422410");
    document.documentElement.style.setProperty("--dark", "#422410");
    document.documentElement.style.setProperty("--accent-dark", "#8a4324");
    document.documentElement.style.setProperty("--accent-light", "#c97b44");
    /*document.documentElement.style.setProperty("", "#e8ab8e");*/
    document.documentElement.style.setProperty("--background-light", "#fad1b9");
});

document.getElementById("yellowButton").addEventListener("click", () => {
    document.documentElement.style.setProperty("--text-dark", "#424010");
    document.documentElement.style.setProperty("--dark", "#424010");
    document.documentElement.style.setProperty("--accent-dark", "#8a8124");
    document.documentElement.style.setProperty("--accent-light", "#c9c944");
    /*document.documentElement.style.setProperty("", "#e8e88e");*/
    document.documentElement.style.setProperty("--background-light", "#faf9b9");
});

document.getElementById("greenButton").addEventListener("click", () => {
    document.documentElement.style.setProperty("--text-dark", "#0b2d0c");
    document.documentElement.style.setProperty("--dark", "#0b2d0c");
    document.documentElement.style.setProperty("--accent-dark", "#248a2e");
    document.documentElement.style.setProperty("--accent-light", "#44c95a");
    /*document.documentElement.style.setProperty("", "");*/
    document.documentElement.style.setProperty("--background-light", "#b9fac3");
});

document.getElementById("blueButton").addEventListener("click", () => {
    document.documentElement.style.setProperty("--text-dark", "#102742");
    document.documentElement.style.setProperty("--dark", "#102742");
    document.documentElement.style.setProperty("--accent-dark", "#24528a");
    document.documentElement.style.setProperty("--accent-light", "#4482c9");
    /*document.documentElement.style.setProperty("", "#8eafe8");*/
    document.documentElement.style.setProperty("--background-light", "#b9ddfa");
});

document.getElementById("purpleButton").addEventListener("click", () => {
    document.documentElement.style.setProperty("--text-dark", "#371042");
    document.documentElement.style.setProperty("--dark", "#371042");
    document.documentElement.style.setProperty("--accent-dark", "#76248a");
    document.documentElement.style.setProperty("--accent-light", "#ac44c9");
    /*document.documentElement.style.setProperty("", "#c98ee8");*/
    document.documentElement.style.setProperty("--background-light", "#e4b9fa");
});