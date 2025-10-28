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
    // Update topic display
    const topicNameElement = document.getElementById('currentTopicName');
    if (topicNameElement) {
        const selectedTopic = availableTopics.find(t => t.value === topic);
        const displayName = selectedTopic ? selectedTopic.name : 
                           (topic === 'default' ? 'Instructions' : topic.charAt(0).toUpperCase() + topic.slice(1));
        topicNameElement.textContent = displayName;
    }
    // Update UI state after topic change (with small delay to ensure DOM is updated)
    setTimeout(() => updateSubmissionState(), 0);
    // Save session after topic change
    if (window.gameSessionManager) {
        setTimeout(() => {
            gameSessionManager.saveCurrentSession();
            console.log(`Topic changed to ${topic} - session saved`);
        }, 100);
    }
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
// Topic pagination variables
let currentTopicPage = 1;
const topicsPerPage = 6;
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
// === PREFERENCE SYSTEM ===
function displayQuestionOptions(question) {
    // Show preference UI (all questions now have option1 and option2)
    const preferenceContainer = document.getElementById('preferenceContainer');
    if (preferenceContainer) {
        preferenceContainer.classList.remove('hidden');
        preferenceContainer.classList.add('visible');
    }
    // Set up image containers for contributors to add images
    const option1Image = document.getElementById('option1Image');
    const option2Image = document.getElementById('option2Image');
    // Load images from JSON URLs if available, otherwise use CSS fallback
    if (option1Image) {
        const option1Name = question.option1.toLowerCase().replace(/[\s\/]+/g, '-').replace(/[^\w\-]/g, '');
        option1Image.setAttribute('data-option', option1Name);
        
        // Use image URL from JSON if available and not placeholder
        if (question.images && question.images.option1 && question.images.option1 !== "PASTE_URL_HERE") {
            option1Image.style.backgroundImage = `url('${question.images.option1}')`;
        } else {
            // Clear any previous background-image to use CSS fallback (kitten image)
            option1Image.style.backgroundImage = '';
        }
    }
    
    if (option2Image) {
        const option2Name = question.option2.toLowerCase().replace(/[\s\/]+/g, '-').replace(/[^\w\-]/g, '');
        option2Image.setAttribute('data-option', option2Name);
        
        // Use image URL from JSON if available and not placeholder
        if (question.images && question.images.option2 && question.images.option2 !== "PASTE_URL_HERE") {
            option2Image.style.backgroundImage = `url('${question.images.option2}')`;
        } else {
            // Clear any previous background-image to use CSS fallback (kitten image)
            option2Image.style.backgroundImage = '';
        }
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
    const submissions = JSON.parse(sessionStorage.getItem('chronologicalSubmissions')) || [];
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
            // All players have answered - show final submit button
            console.log(`All ${playerCount} players have answered.`);
            submitBtn.classList.add('hidden');
            finalBtn.classList.remove('hidden');
            return;
        }
        // not yet reached count: show submit and hide final
        submitBtn.classList.remove('hidden');
        finalBtn.classList.add('hidden');
    } else {
        // no count limit: always show submit, never show final
        submitBtn.classList.remove('hidden');
        finalBtn.classList.add('hidden');
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
        // Display the options as well
        displayQuestionOptions(currentQuestion);
    } else {
        questionElem.textContent = '';
    }
    questionElem.setAttribute('data-index', currentIndex);
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
function resetToFirstPlayer() {
    // Reset the turn system back to the first player
    if (typeof playerNames !== 'undefined' && Array.isArray(playerNames) && playerNames.length > 0) {
        currentPlayerIndex = 0;
        updatePlayerTurnDisplay();
        console.log(`Reset to first player: ${playerNames[0]}`);
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
    const submissions = JSON.parse(sessionStorage.getItem('chronologicalSubmissions')) || [];
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
    sessionStorage.setItem('chronologicalSubmissions', JSON.stringify(submissions));
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
    // Save session after answer submission
    if (window.gameSessionManager) {
        gameSessionManager.saveCurrentSession();
        console.log('Answer submitted - session saved');
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
        playerTurnIndicator.classList.remove('hidden');
        playerTurnIndicator.classList.add('visible');
    }
}
function hidePlayerTurnIndicator() {
    const playerTurnIndicator = document.getElementById('playerTurnIndicator');
    if (playerTurnIndicator) {
        playerTurnIndicator.classList.add('hidden');
        playerTurnIndicator.classList.remove('visible');
    }
}
function updateCurrentPlayerDisplay() {
    const currentPlayerNameElement = document.getElementById('currentPlayerName');
    if (currentPlayerNameElement && playerNames.length > 0) {
        // Fade out old name
        currentPlayerNameElement.classList.add('fade-out');
        currentPlayerNameElement.classList.remove('fade-in');
        setTimeout(() => {
            // Update name and fade in
            currentPlayerNameElement.textContent = playerNames[currentPlayerIndex];
            currentPlayerNameElement.classList.remove('fade-out');
            currentPlayerNameElement.classList.add('fade-in');
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
    const colorClasses = [
        'color-red', 'color-teal', 'color-blue', 'color-green', 'color-yellow',
        'color-purple', 'color-mint', 'color-gold', 'color-lavender', 'color-sky',
        'color-orange', 'color-lime', 'color-coral', 'color-pink'
    ];
    const speedClasses = ['flying-shape-slow', 'flying-shape-medium', 'flying-shape-fast'];
    const numShapes = 5; // Create 5 star shapes flying across
    for (let i = 0; i < numShapes; i++) {
        setTimeout(() => {
            const shape = document.createElement('div');
            const randomColor = colorClasses[Math.floor(Math.random() * colorClasses.length)];
            const randomSpeed = speedClasses[Math.floor(Math.random() * speedClasses.length)];
            shape.className = `flying-shape star ${randomColor} ${randomSpeed}`;
            shape.style.top = `${Math.random() * 80 + 10}%`; // Random vertical position
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
    const submissions = JSON.parse(sessionStorage.getItem('chronologicalSubmissions')) || [];
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
    // Save final session state before finishing
    if (window.gameSessionManager) {
        gameSessionManager.saveCurrentSession();
        gameSessionManager.disableAutoSave(); // Stop auto-saving since game is ending
        console.log('Game completed - final session saved');
    }
    // Clear stored submissions so the next run starts fresh, but keep other persisted settings (like currentTopic)
    try {
        sessionStorage.removeItem('chronologicalSubmissions');
    } catch (e) {
        console.warn('Could not remove chronologicalSubmissions from sessionStorage', e);
    }
    // Redirect to the display/results page
    window.location.href = 'display.html';
}
// === MANUAL SAVE GAME ===
function initializeSaveGameButton() {
    const saveGameBtn = document.getElementById('saveGameBtn');
    if (!saveGameBtn) return;
    saveGameBtn.addEventListener('click', function() {
        if (window.gameSessionManager) {
            gameSessionManager.saveCurrentSession();
            // Show feedback to user
            const originalHTML = saveGameBtn.innerHTML;
            saveGameBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
            saveGameBtn.classList.add('success-state');
            // Reset button after 2 seconds
            setTimeout(() => {
                saveGameBtn.innerHTML = originalHTML;
                saveGameBtn.classList.remove('success-state');
            }, 2000);
            console.log('Game manually saved by user');
        } else {
            alert('Save system not available');
        }
    });
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
    if (switchBtn) switchBtn.addEventListener('click', switchToNextQuestion);
}
// === INITIALIZATION ===
window.addEventListener('DOMContentLoaded', function() {
    // Wait for shared.js to load data, then initialize game
    if (window.loadQuestions) {
        window.loadQuestions().then(() => {
            // Always start with the default topic (instructions) on page load
            window.currentTopic = 'default';
            applyQuestionsForTopic('default');
            // Initialize topic display
            const topicNameElement = document.getElementById('currentTopicName');
            if (topicNameElement) {
                topicNameElement.textContent = 'Instructions';
            }
            // Initialize new topic selection system
            initializeTopicSelection();
            // Ensure submission state reflects any configured player count on initial load
            updateSubmissionState();
            // Initialize player turn system for game page
            initializePlayerTurnSystem();
            // Initialize event handlers
            initializeGameEventHandlers();
            // Initialize manual save game button
            initializeSaveGameButton();
            // Save initial game session state and enable auto-save
            if (window.gameSessionManager) {
                gameSessionManager.saveCurrentSession();
                gameSessionManager.enableAutoSave(2); // Auto-save every 2 minutes
                console.log('Game initialized - session saved and auto-save enabled');
            }
        });
    }
});