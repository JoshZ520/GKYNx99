// question-manager.js - Question and Topic Management for Table Talk
// Handles question loading, topic selection, and question navigation
console.log('📚 Question Manager loaded');

// === SHARED STATE ===
// These are shared with other modules - declared here but may be used elsewhere
let appQuestions = [];
let availableTopics = [];

// Topic pagination variables
let currentTopicPage = 1;
const topicsPerPage = 6;

// === QUESTION MANAGEMENT ===
function applyQuestionsForTopic(topic) {
    const topics = window.getTopics ? window.getTopics() : {};
    const topicData = topics[topic] || topics['default'] || {};
    let list = topicData.questions || [];
    
    // For the default topic, skip the first question since it's displayed on the front page
    // Use questions starting from index 1 for the game page
    if (topic === 'default' && list.length > 1) {
        list = list.slice(1); // Use all questions except the first one
    }
    
    appQuestions.splice(0, appQuestions.length, ...list);
    
    const questionElem = document.getElementById('question');
    if (questionElem) {
        questionElem.setAttribute('data-index', 0);
        // Handle both old string format and new object format
        const currentQuestion = appQuestions[0];
        if (typeof currentQuestion === 'string') {
            questionElem.textContent = currentQuestion;
        } else if (currentQuestion && currentQuestion.prompt) {
            questionElem.textContent = currentQuestion.prompt;
            // Display the options as well (requires game-interactions.js)
            if (typeof displayQuestionOptions === 'function') {
                displayQuestionOptions(currentQuestion);
            }
        } else {
            questionElem.textContent = '';
        }
    }
    
    // Apply color scheme if available
    if (topicData.colorScheme && window.applyColorScheme) {
        // Handle both string reference and direct object
        let colorScheme;
        if (typeof topicData.colorScheme === 'string') {
            // Resolve color scheme reference
            const colorSchemes = window.getColorSchemes ? window.getColorSchemes() : {};
            colorScheme = colorSchemes[topicData.colorScheme] || colorSchemes['light'] || {};
        } else {
            // Direct color scheme object (fallback for old format)
            colorScheme = topicData.colorScheme;
        }
        window.applyColorScheme(colorScheme);
    }
}

function setTopic(topic) {
    window.currentTopic = topic;
    applyQuestionsForTopic(topic);
    localStorage.setItem('currentTopic', topic);
    
    // Update topic display
    const topicNameElement = document.getElementById('currentTopicName');
    if (topicNameElement) {
        const selectedTopic = availableTopics.find(t => t.value === topic);
        const displayName = selectedTopic ? selectedTopic.name : 
                           (topic === 'default' ? 'Instructions' : topic.charAt(0).toUpperCase() + topic.slice(1));
        topicNameElement.textContent = displayName;
    }
    
    // Update UI state after topic change (with small delay to ensure DOM is updated)
    setTimeout(() => {
        if (typeof updateSubmissionState === 'function') {
            updateSubmissionState();
        }
    }, 0);
    
    // Save session after topic change
    if (window.gameSessionManager) {
        setTimeout(() => {
            gameSessionManager.saveCurrentSession();
            console.log(`Topic changed to ${topic} - session saved`);
        }, 100);
    }
}

function switchToNextQuestion() {
    // Advance to the next question in the current topic (do not change the topic)
    const questionElem = document.getElementById('question');
    if (!questionElem) return;
    
    if (!Array.isArray(appQuestions) || appQuestions.length === 0) {
        // no questions available for the current topic
        questionElem.textContent = '';
        questionElem.setAttribute('data-index', 0);
        return;
    }
    
    let currentIndex = parseInt(questionElem.getAttribute('data-index')) || 0;
    currentIndex = (currentIndex + 1) % appQuestions.length;
    
    // Handle both old string format and new object format
    const currentQuestion = appQuestions[currentIndex];
    if (typeof currentQuestion === 'string') {
        questionElem.textContent = currentQuestion;
    } else if (currentQuestion && currentQuestion.prompt) {
        questionElem.textContent = currentQuestion.prompt;
        // Display the options as well (requires game-interactions.js)
        if (typeof displayQuestionOptions === 'function') {
            displayQuestionOptions(currentQuestion);
        }
    } else {
        questionElem.textContent = '';
    }
    
    questionElem.setAttribute('data-index', currentIndex);
    
    // Broadcast new question to multiplayer players if active
    if (window.hostMultiplayer && window.hostMultiplayer.isActive()) {
        window.hostMultiplayer.broadcastQuestion(currentQuestion);
    }
    
    // Ensure submit button is visible for the new question
    const submitBtn = document.getElementById('submitButton');
    if (submitBtn) {
        submitBtn.classList.remove('hidden');
    }
    
    // Update submission UI state for the new question index
    if (typeof updateSubmissionState === 'function') {
        updateSubmissionState();
    }
    
    // Save session after question switch
    if (window.gameSessionManager) {
        gameSessionManager.saveCurrentSession();
        console.log('Question switched - session saved');
    }
}

// === TOPIC SELECTION SYSTEM ===
function initializeTopicSelection() {
    // Load topics from JSON
    fetch('files/topics/index.json')
        .then(res => res.json())
        .then(topicsIndex => {
            console.log('Loaded topics index:', topicsIndex);
            // Convert to array, excluding 'default'
            availableTopics = Object.keys(topicsIndex)
                .filter(key => key !== 'default')
                .map(key => ({
                    value: key,
                    name: key.charAt(0).toUpperCase() + key.slice(1)
                }));
            console.log('Available topics:', availableTopics);
            renderTopicGrid();
        })
        .catch(err => {
            console.error('Could not load topics:', err);
        });
    
    // Set up button listeners
    const startButton = document.getElementById('startButton');
    const randomButton = document.getElementById('randomButton');
    const topicsToggle = document.getElementById('topicsToggle');
    
    if (startButton) {
        startButton.addEventListener('click', () => {
            setTopic('default');
        });
    }
    
    if (randomButton) {
        randomButton.addEventListener('click', () => {
            pickRandomTopic();
        });
    }
    
    if (topicsToggle) {
        topicsToggle.addEventListener('click', () => {
            toggleTopicsPanel();
        });
    }
    
    // Ensure topics panel starts closed
    const panel = document.getElementById('topicsPanel');
    if (panel) {
        panel.classList.add('hidden');
        panel.classList.remove('visible');
        if (topicsToggle) {
            topicsToggle.textContent = 'Topics ▼';
        }
    }
}

function renderTopicGrid() {
    const grid = document.getElementById('topicsGrid');
    if (!grid) {
        console.error('Topics grid element not found');
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(availableTopics.length / topicsPerPage);
    const startIndex = (currentTopicPage - 1) * topicsPerPage;
    const endIndex = startIndex + topicsPerPage;
    const currentPageTopics = availableTopics.slice(startIndex, endIndex);
    
    // Display current page topics in a 3x2 grid layout (6 topics max)
    grid.innerHTML = currentPageTopics.map(topic => `
        <label class="topic-option smooth-transition">
            <input type="radio" name="topic" value="${topic.value}">
            <span>${topic.name}</span>
        </label>
    `).join('');
    
    // Add event listeners
    grid.querySelectorAll('input[name="topic"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            setTopic(e.target.value);
            // Close the topics dropdown after selection
            const panel = document.getElementById('topicsPanel');
            const toggle = document.getElementById('topicsToggle');
            if (panel && toggle) {
                panel.classList.add('hidden');
                panel.classList.remove('visible');
                toggle.textContent = 'Topics ▼';
            }
        });
    });
    
    // Update pagination controls
    updatePaginationControls(totalPages);
}

function updatePaginationControls(totalPages) {
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    
    if (pageInfo) {
        pageInfo.textContent = `Page ${currentTopicPage} of ${totalPages}`;
    }
    
    if (prevBtn) {
        prevBtn.disabled = currentTopicPage <= 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentTopicPage >= totalPages;
    }
}

function changePage(direction) {
    const totalPages = Math.ceil(availableTopics.length / topicsPerPage);
    
    if (direction === 'next' && currentTopicPage < totalPages) {
        currentTopicPage++;
    } else if (direction === 'prev' && currentTopicPage > 1) {
        currentTopicPage--;
    }
    
    renderTopicGrid();
}

function toggleTopicsPanel() {
    const panel = document.getElementById('topicsPanel');
    const toggle = document.getElementById('topicsToggle');
    
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        panel.classList.add('visible');
        toggle.textContent = 'Topics ▲';
    } else {
        panel.classList.add('hidden');
        panel.classList.remove('visible');
        toggle.textContent = 'Topics ▼';
    }
}

function pickRandomTopic() {
    if (availableTopics.length === 0) {
        // Fall back to default if no topics available
        setTopic('default');
        return 'default';
    }
    
    // Choose a random topic
    const randomTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
    const choice = randomTopic.value;
    
    // Apply the topic
    setTopic(choice);
    return choice;
}

// === GLOBAL EXPORTS ===
// Make functions available to other modules
if (typeof window !== 'undefined') {
    window.questionManager = {
        // State
        getQuestions: () => appQuestions,
        getAvailableTopics: () => availableTopics,
        
        // Core functions
        setTopic: setTopic,
        switchToNextQuestion: switchToNextQuestion,
        applyQuestionsForTopic: applyQuestionsForTopic,
        
        // Topic selection
        initializeTopicSelection: initializeTopicSelection,
        pickRandomTopic: pickRandomTopic,
        changePage: changePage,
        
        // UI functions
        renderTopicGrid: renderTopicGrid,
        toggleTopicsPanel: toggleTopicsPanel
    };
    
    // Legacy global functions for backward compatibility
    window.setTopic = setTopic;
    window.switchToNextQuestion = switchToNextQuestion;
    window.applyQuestionsForTopic = applyQuestionsForTopic;
    window.pickRandomTopic = pickRandomTopic;
    window.changePage = changePage;
    window.initializeTopicSelection = initializeTopicSelection;
}