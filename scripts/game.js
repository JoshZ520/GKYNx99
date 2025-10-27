// game.js - Game page functionality
// Handles questions, topic selection, preferences, submissions, and player turns

// === GAME STATE ===
let appQuestions = [];
let playerNames = [];
let currentPlayerIndex = 0;

// === QUESTION MANAGEMENT ===
function applyQuestionsForTopic(topic) {
    const topics = window.getTopics ? window.getTopics() : {};
    const topicData = topics[topic] || topics['default'] || {};
    let list = topicData.questions || [];
    
    // For the default topic, use only the second question (index 1) for the game page
    // The first question (index 0) is displayed on the front page
    if (topic === 'default' && list.length > 1) {
        list = [list[1]]; // Use only the second question
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
            // Display the options as well
            displayQuestionOptions(currentQuestion);
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
    // Update UI state after topic change (with small delay to ensure DOM is updated)
    setTimeout(() => updateSubmissionState(), 0);
}

// === TOPIC SELECTION SYSTEM ===
let availableTopics = [];

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
            console.log('Start button clicked');
            setTopic('default');
        });
        console.log('Start button listener added');
    } else {
        console.error('Start button not found');
    }
    
    if (randomButton) {
        randomButton.addEventListener('click', () => {
            console.log('Random button clicked');
            pickRandomTopic();
        });
        console.log('Random button listener added');
    } else {
        console.error('Random button not found');
    }
    
    if (topicsToggle) {
        topicsToggle.addEventListener('click', () => {
            console.log('Topics toggle clicked');
            toggleTopicsPanel();
        });
        console.log('Topics toggle listener added');
    } else {
        console.error('Topics toggle button not found');
    }
}

// Topic pagination variables
let currentTopicPage = 1;
const topicsPerPage = 6;

function renderTopicGrid() {
    const grid = document.getElementById('topicsGrid');
    if (!grid) {
        console.error('Topics grid element not found');
        return;
    }
    
    console.log('Rendering topics grid with', availableTopics.length, 'topics');
    
    // Calculate pagination
    const totalPages = Math.ceil(availableTopics.length / topicsPerPage);
    const startIndex = (currentTopicPage - 1) * topicsPerPage;
    const endIndex = startIndex + topicsPerPage;
    const currentPageTopics = availableTopics.slice(startIndex, endIndex);
    
    // Display current page topics in a 3x2 grid layout (6 topics max)
    grid.innerHTML = currentPageTopics.map(topic => `
        <label class="topic-option">
            <input type="radio" name="topic" value="${topic.value}">
            <span>${topic.name}</span>
        </label>
    `).join('');
    
    // Add event listeners
    grid.querySelectorAll('input[name="topic"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            console.log('Topic selected:', e.target.value);
            setTopic(e.target.value);
            
            // Close the topics dropdown after selection
            const panel = document.getElementById('topicsPanel');
            const toggle = document.getElementById('topicsToggle');
            if (panel && toggle) {
                panel.style.display = 'none';
                toggle.textContent = 'Topics ▼';
                console.log('Topics panel closed after selection');
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
    
    console.log('Toggle clicked - panel display:', panel.style.display);
    
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        toggle.textContent = 'Topics ▲';
        console.log('Showing topics panel');
    } else {
        panel.style.display = 'none';
        toggle.textContent = 'Topics ▼';
        console.log('Hiding topics panel');
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

// === PREFERENCE SYSTEM ===
function displayQuestionOptions(question) {
    // Show preference UI (all questions now have option1 and option2)
    const preferenceContainer = document.getElementById('preferenceContainer');
    
    if (preferenceContainer) {
        preferenceContainer.style.display = 'block';
    }
        
    // Set up image containers for contributors to add images
    const option1Image = document.getElementById('option1Image');
    const option2Image = document.getElementById('option2Image');
    
    // Add data attributes for image loading (contributors can use these)
    if (option1Image) {
        option1Image.setAttribute('data-option', question.option1.toLowerCase().replace(/\s+/g, '-'));
    }
    if (option2Image) {
        option2Image.setAttribute('data-option', question.option2.toLowerCase().replace(/\s+/g, '-'));
    }
    
    // Set the text labels above the images
    const option1Label = document.getElementById('option1Label');
    const option2Label = document.getElementById('option2Label');
    
    if (option1Label) {
        option1Label.textContent = question.option1;
    }
    if (option2Label) {
        option2Label.textContent = question.option2;
    }
    
    // Set up click handlers for preferences
    setupPreferenceClickHandlers(question);
}

function setupPreferenceClickHandlers(question) {
    const option1Elem = document.getElementById('option1');
    const option2Elem = document.getElementById('option2');
    
    // Remove any existing listeners
    const option1Clone = option1Elem?.cloneNode(true);
    const option2Clone = option2Elem?.cloneNode(true);
    
    if (option1Elem && option1Clone) {
        option1Elem.parentNode.replaceChild(option1Clone, option1Elem);
        option1Clone.addEventListener('click', () => selectPreference(question.option1));
    }
    
    if (option2Elem && option2Clone) {
        option2Elem.parentNode.replaceChild(option2Clone, option2Elem);
        option2Clone.addEventListener('click', () => selectPreference(question.option2));
    }
}

function selectPreference(choice) {
    // Visual feedback - highlight selected option
    const option1 = document.getElementById('option1');
    const option2 = document.getElementById('option2');
    
    if (option1) option1.classList.remove('selected');
    if (option2) option2.classList.remove('selected');
    
    // Determine which option to highlight based on the choice
    const currentIndex = parseInt(document.getElementById('question')?.getAttribute('data-index')) || 0;
    const currentQuestion = appQuestions[currentIndex];
    
    if (currentQuestion && currentQuestion.option1 && currentQuestion.option2) {
        if (choice === currentQuestion.option1 && option1) {
            option1.classList.add('selected');
        } else if (choice === currentQuestion.option2 && option2) {
            option2.classList.add('selected');
        }
    }
    
    // Store the choice in both the hidden preference field and the answer field for submission
    const selectedPreferenceField = document.getElementById('selectedPreference');
    const answerElem = document.getElementById('answer');
    
    if (selectedPreferenceField) {
        selectedPreferenceField.value = choice;
    }
    if (answerElem) {
        answerElem.value = choice;
    }
}

// === SUBMISSION SYSTEM ===
function getSubmittedCountForCurrentQuestion() {
    const questionElem = document.getElementById('question');
    const currentQuestion = questionElem?.textContent || '';
    const submissions = JSON.parse(localStorage.getItem('chronologicalSubmissions')) || [];
    const filteredSubmissions = submissions.filter(sub => sub.question === currentQuestion);
    return filteredSubmissions.length;
}

function updateSubmissionState() {
    const playerCountString = sessionStorage.getItem('playerCount');
    const playerCount = parseInt(playerCountString) || null;
    const submitBtn = document.getElementById('submitButton');
    const finalBtn = document.getElementById('final_submit');
    if (!submitBtn || !finalBtn) return;

    if (playerCount && playerCount > 0) {
        const submitted = getSubmittedCountForCurrentQuestion();
        if (submitted >= playerCount) {
            // hide/disable submit, show final only
            submitBtn.style.display = 'none';
            finalBtn.style.display = '';
            return;
        }

        // not yet reached count: show submit and hide final
        submitBtn.style.display = '';
        finalBtn.style.display = 'none';
    } else {
        // no count limit: always show submit, never show final
        submitBtn.style.display = '';
        finalBtn.style.display = 'none';
    }
}

function submitAnswer() {
    // Get answer from preference selection
    const answer = document.getElementById('selectedPreference').value;
    
    // Get current player's name from the player turn system
    let name = 'Player';
    const storedPlayerCount = parseInt(sessionStorage.getItem('playerCount')) || 1;
    
    if (storedPlayerCount > 1 && playerNames.length > 0) {
        // Use the current player's name from the turn system
        name = playerNames[currentPlayerIndex] || `Player ${currentPlayerIndex + 1}`;
    } else {
        // For single player, just use "Player" or get from session if available
        const storedNames = sessionStorage.getItem('playerNames');
        if (storedNames) {
            const names = JSON.parse(storedNames);
            name = names[0] || 'Player';
        }
    }
    
    const questionElem = document.getElementById('question');
    const currentQuestion = questionElem?.textContent || '';

    if (!answer.trim() || !currentQuestion.trim()) {
        alert('Please make a selection before submitting.');
        return; // Don't submit empty answers
    }

    // Get chronological submissions list
    const submissions = JSON.parse(localStorage.getItem('chronologicalSubmissions')) || [];
    
    // Check if this question already has enough answers (if player count is set)
    const playerCount = storedPlayerCount;
    if (playerCount) {
        const answersForThisQuestion = submissions.filter(sub => sub.question === currentQuestion).length;
        if (answersForThisQuestion >= playerCount) {
            updateSubmissionState();
            return;
        }
    }

    // Add new submission with timestamp
    const submission = {
        question: currentQuestion,
        answer: answer.trim(),
        name: name.trim(),
        timestamp: Date.now(),
        topic: window.currentTopic || 'unknown'
    };
    
    submissions.push(submission);

    // Save chronological submissions
    localStorage.setItem('chronologicalSubmissions', JSON.stringify(submissions));

    // Clear the preference system for the next player
    document.getElementById('selectedPreference').value = '';
    // Remove visual selection
    const option1 = document.getElementById('option1');
    const option2 = document.getElementById('option2');
    if (option1) option1.classList.remove('selected');
    if (option2) option2.classList.remove('selected');

    // Update UI state in case we've reached the player count
    updateSubmissionState();
    
    // Advance to next player if in multiplayer mode
    if (typeof advanceToNextPlayer === 'function') {
        advanceToNextPlayer();
    }
}

// === PLAYER TURN SYSTEM ===
function initializePlayerTurnSystem() {
    // Only initialize on game page
    const playerTurnIndicator = document.getElementById('playerTurnIndicator');
    if (!playerTurnIndicator) return;
    
    // Load player data from sessionStorage
    const storedPlayerNames = sessionStorage.getItem('playerNames');
    const playerCount = parseInt(sessionStorage.getItem('playerCount')) || 1;
    
    if (playerCount > 1 && storedPlayerNames) {
        playerNames = JSON.parse(storedPlayerNames);
        currentPlayerIndex = 0;
        showPlayerTurnIndicator();
        updateCurrentPlayerDisplay();
    } else {
        // Single player or no multiplayer setup
        hidePlayerTurnIndicator();
    }
}

function showPlayerTurnIndicator() {
    const playerTurnIndicator = document.getElementById('playerTurnIndicator');
    if (playerTurnIndicator) {
        playerTurnIndicator.style.display = 'block';
    }
}

function hidePlayerTurnIndicator() {
    const playerTurnIndicator = document.getElementById('playerTurnIndicator');
    if (playerTurnIndicator) {
        playerTurnIndicator.style.display = 'none';
    }
}

function updateCurrentPlayerDisplay() {
    const currentPlayerNameElement = document.getElementById('currentPlayerName');
    if (currentPlayerNameElement && playerNames.length > 0) {
        // Fade out old name
        currentPlayerNameElement.style.opacity = '0';
        
        setTimeout(() => {
            // Update name and fade in
            currentPlayerNameElement.textContent = playerNames[currentPlayerIndex];
            currentPlayerNameElement.style.opacity = '1';
        }, 150);
    }
}

function showTurnChangeAnimation() {
    if (playerNames.length <= 1) return;
    
    // Fade out the current answer content
    const formElements = document.querySelectorAll('input[type="radio"]:checked, textarea');
    const preferenceContainer = document.querySelector('.preference-container');
    
    if (preferenceContainer) {
        preferenceContainer.classList.add('content-clearing');
    }
    
    // Create flying shapes to "clear" the screen
    createFlyingShapes();
    
    // Remove fade effect after animation
    setTimeout(() => {
        if (preferenceContainer) {
            preferenceContainer.classList.remove('content-clearing');
        }
        // Clear the form
        formElements.forEach(element => {
            if (element.type === 'radio') {
                element.checked = false;
            } else if (element.tagName === 'TEXTAREA') {
                element.value = '';
            }
        });
    }, 800);
}

function createFlyingShapes() {
    const shapes = ['circle', 'square', 'triangle', 'star'];
    const numShapes = 5; // Create 5 shapes flying across
    
    for (let i = 0; i < numShapes; i++) {
        setTimeout(() => {
            const shape = document.createElement('div');
            const shapeType = shapes[Math.floor(Math.random() * shapes.length)];
            
            shape.className = `flying-shape ${shapeType}`;
            shape.style.top = `${Math.random() * 80 + 10}%`; // Random vertical position
            shape.style.animationDelay = '0s';
            shape.style.animationDuration = `${1.2 + Math.random() * 0.6}s`; // Slight variation in speed
            
            document.body.appendChild(shape);
            
            // Remove shape after animation
            setTimeout(() => {
                if (shape.parentNode) {
                    shape.parentNode.removeChild(shape);
                }
            }, 2000);
        }, i * 100); // Stagger the shapes slightly
    }
}

function advanceToNextPlayer() {
    if (playerNames.length > 1) {
        // Show turn change animation with flying shapes
        showTurnChangeAnimation();
        
        // Advance to next player after animation starts
        setTimeout(() => {
            currentPlayerIndex = (currentPlayerIndex + 1) % playerNames.length;
            updateCurrentPlayerDisplay();
            
            // Add new turn animation to indicator
            const indicator = document.getElementById('playerTurnIndicator');
            if (indicator) {
                indicator.classList.add('new-turn');
                setTimeout(() => {
                    indicator.classList.remove('new-turn');
                }, 600);
            }
        }, 200);
    }
}

// === FINAL SUBMISSION ===
function handleFinalSubmit() {
    // Get chronological submissions
    const submissions = JSON.parse(localStorage.getItem('chronologicalSubmissions')) || [];
    
    if (submissions.length === 0) {
        alert('No answers submitted yet!');
        return;
    }

    // Group submissions by question (in order they were first answered)
    const questionOrder = [];
    const submissionsByQuestion = {};
    
    submissions.forEach(submission => {
        if (!submissionsByQuestion[submission.question]) {
            submissionsByQuestion[submission.question] = [];
            questionOrder.push(submission.question);
        }
        submissionsByQuestion[submission.question].push(submission);
    });

    // Pass chronological data to display page
    sessionStorage.setItem('questionsInOrder', JSON.stringify(questionOrder));
    sessionStorage.setItem('submissionsByQuestion', JSON.stringify(submissionsByQuestion));

    // Clear stored submissions so the next run starts fresh, but keep other persisted settings (like currentTopic)
    try {
        localStorage.removeItem('chronologicalSubmissions');
    } catch (e) {
        console.warn('Could not remove chronologicalSubmissions from localStorage', e);
    }

    // Redirect to the display/results page
    window.location.href = 'display.html';
}

// === EVENT HANDLERS ===
function initializeGameEventHandlers() {
    // Submit button
    const submitBtn = document.getElementById('submitButton');
    if (submitBtn) submitBtn.addEventListener('click', submitAnswer);
    
    // Final submit button
    const finalBtn = document.getElementById('final_submit');
    if (finalBtn) finalBtn.addEventListener('click', handleFinalSubmit);
    
    // Topic pagination buttons
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => changePage('prev'));
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => changePage('next'));
    }
    
    // Switch question button
    const switchBtn = document.getElementById('switchQuestion');
    if (switchBtn) switchBtn.addEventListener('click', function() {
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
            // Display the options as well
            displayQuestionOptions(currentQuestion);
        } else {
            questionElem.textContent = '';
        }
        
        questionElem.setAttribute('data-index', currentIndex);
        // Update submission UI state for the new question index
        if (typeof updateSubmissionState === 'function') {
            updateSubmissionState();
        }
    });
}

// === INITIALIZATION ===
window.addEventListener('DOMContentLoaded', function() {
    // Wait for shared.js to load data, then initialize game
    if (window.loadQuestions) {
        window.loadQuestions().then(() => {
            // Always start with the default topic (instructions) on page load
            window.currentTopic = 'default';
            applyQuestionsForTopic('default');
            
            // Initialize new topic selection system
            initializeTopicSelection();

            // Ensure submission state reflects any configured player count on initial load
            updateSubmissionState();
            
            // Initialize player turn system for game page
            initializePlayerTurnSystem();
            
            // Initialize event handlers
            initializeGameEventHandlers();
        });
    }
});