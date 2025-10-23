// Enhanced Table Talk - Setup Configuration System
// This version demonstrates how setup answers control game behavior

// Initialize global variables
window.currentTopic = window.currentTopic || 'setup';
let topics = {};
let appQuestions = [];
let gameConfig = {}; // NEW: Store game configuration from setup

// NEW: Setup configuration mapping
const SETUP_CONFIG_MAP = {
    0: { // "How would you like to start this session?"
        "Learn the Rules First": { sessionStyle: "learn_rules" },
        "Jump Right Into Playing": { sessionStyle: "jump_in" }
    },
    1: { // "What's your group's preferred style?"
        "Structured & Organized": { groupStyle: "structured" },
        "Casual & Free-flowing": { groupStyle: "casual" }
    },
    2: { // "How should players approach questions?"
        "Quick Gut Reactions": { responseStyle: "quick" },
        "Thoughtful Responses": { responseStyle: "thoughtful" }
    },
    3: { // "What kind of discussion do you want?"
        "Light & Fun": { discussionStyle: "light" },
        "Deep & Meaningful": { discussionStyle: "deep" }
    },
    4: { // "How should the group handle disagreements?"
        "Move On Quickly": { conflictStyle: "move_on" },
        "Explore Different Views": { conflictStyle: "explore" }
    },
    5: { // "What's the goal for this session?"
        "Getting to Know Each Other": { sessionGoal: "know_each_other" },
        "Having Fun Together": { sessionGoal: "have_fun" }
    }
};

function loadQuestions() {
    return fetch('files/questions.json')
        .then(res => {
            if (!res.ok) throw new Error('Failed to load questions.json');
            return res.json();
        })
        .then(data => {
            topics = data || {};
            // Ensure setup exists with proper structure
            if (!topics.setup) {
                topics.setup = {
                    questions: [],
                    colorScheme: {
                        background: "#f8f9fa",
                        headerBackground: "#e9ecef",
                        headerBorder: "#6c757d",
                        primaryButton: "#007bff",
                        secondaryButton: "#28a745",
                        accent: "#17a2b8",
                        focusColor: "#fd7e14",
                        textColor: "#212529",
                        headerTextColor: "#495057"
                    }
                };
            }
            return topics;
        })
        .catch(err => {
            console.error('Error loading questions.json:', err);
            topics = { 
                setup: {
                    questions: [],
                    colorScheme: {
                        background: "#f8f9fa",
                        headerBackground: "#e9ecef",
                        headerBorder: "#6c757d",
                        primaryButton: "#007bff",
                        secondaryButton: "#28a745",
                        accent: "#17a2b8",
                        focusColor: "#fd7e14",
                        textColor: "#212529",
                        headerTextColor: "#495057"
                    }
                }
            };
            return topics;
        });
}

// Helper to change topic and questions
function applyQuestionsForTopic(topic) {
    const topicData = (topics && topics[topic]) || topics['setup'] || {};
    let list = topicData.questions || [];
    
    // NEW: Apply topic filtering based on game config
    if (gameConfig.discussionStyle && topic !== 'setup') {
        list = filterQuestionsByStyle(list, topic);
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
    if (topicData.colorScheme) {
        applyColorScheme(topicData.colorScheme);
    }
}

// NEW: Filter questions based on discussion style preference
function filterQuestionsByStyle(questions, topic) {
    if (!gameConfig.discussionStyle) return questions;
    
    // Example filtering logic - in a real implementation, you'd tag questions
    if (gameConfig.discussionStyle === 'light') {
        // For light discussions, prefer certain topics
        const lightTopics = ['games', 'food', 'movies'];
        if (!lightTopics.includes(topic)) {
            // Could return fewer questions or modify prompts
        }
    }
    
    return questions; // For demo, return all questions
}

function setTopic(topic) {
    window.currentTopic = topic;
    applyQuestionsForTopic(topic);
    localStorage.setItem('currentTopic', topic);
    // Update UI state after topic change
    setTimeout(() => {
        updateSubmissionState();
        displayAnswers();
        
        // Clear any existing feedback messages when changing topics
        const existingFeedback = document.querySelectorAll('#submissionSuccess, #validationErrors, #completionStatus, #submissionProgress');
        existingFeedback.forEach(element => element.remove());
    }, 0);
}

// Utility: count how many answers have been submitted for the current question
function getSubmittedCountForCurrentQuestion() {
    const questionElem = document.getElementById('question');
    const currentQuestion = questionElem?.textContent || '';
    const submissions = JSON.parse(localStorage.getItem('chronologicalSubmissions')) || [];
    return submissions.filter(sub => sub.question === currentQuestion).length;
}

// NEW: Store and process setup answers
function storeSetupAnswer(questionIndex, answer) {
    const setupAnswers = JSON.parse(localStorage.getItem('setupAnswers')) || {};
    setupAnswers[questionIndex] = answer;
    localStorage.setItem('setupAnswers', JSON.stringify(setupAnswers));
    
    // Update game configuration
    if (SETUP_CONFIG_MAP[questionIndex] && SETUP_CONFIG_MAP[questionIndex][answer]) {
        Object.assign(gameConfig, SETUP_CONFIG_MAP[questionIndex][answer]);
        localStorage.setItem('gameConfig', JSON.stringify(gameConfig));
        
        // Show immediate feedback
        showConfigurationFeedback(questionIndex, answer);
    }
}

// NEW: Show what each setup choice configures
function showConfigurationFeedback(questionIndex, answer) {
    const feedbackElement = document.getElementById('setup-feedback');
    if (!feedbackElement) return;
    
    const feedbackMessages = {
        0: {
            "Learn the Rules First": "✓ Will show instructions and tutorial prompts",
            "Jump Right Into Playing": "✓ Will skip instructions and go straight to questions"
        },
        1: {
            "Structured & Organized": "✓ Will enforce turn order and track progress",
            "Casual & Free-flowing": "✓ Will allow flexible answering without strict rules"
        },
        2: {
            "Quick Gut Reactions": "✓ Will add 30-second timers to encourage fast responses",
            "Thoughtful Responses": "✓ Will provide unlimited time for detailed answers"
        },
        3: {
            "Light & Fun": "✓ Will focus on entertaining and playful questions",
            "Deep & Meaningful": "✓ Will include personal and reflective questions"
        },
        4: {
            "Move On Quickly": "✓ Will auto-advance after 5 minutes of discussion",
            "Explore Different Views": "✓ Will allow extended discussion time"
        },
        5: {
            "Getting to Know Each Other": "✓ Will prioritize personal and sharing questions",
            "Having Fun Together": "✓ Will focus on entertaining and lighthearted content"
        }
    };
    
    const message = feedbackMessages[questionIndex]?.[answer];
    if (message) {
        feedbackElement.textContent = message;
        feedbackElement.style.display = 'block';
        setTimeout(() => {
            feedbackElement.style.display = 'none';
        }, 3000);
    }
}

// NEW: Apply game configuration to UI
function applyGameConfiguration() {
    const config = JSON.parse(localStorage.getItem('gameConfig')) || {};
    gameConfig = config;
    
    // Apply timer based on response style
    if (config.responseStyle === 'quick') {
        startResponseTimer(30); // 30 seconds
    }
    
    // Apply instruction visibility
    if (config.sessionStyle === 'learn_rules') {
        showInstructions(true);
    } else {
        showInstructions(false);
    }
    
    // Apply progress tracking
    if (config.groupStyle === 'structured') {
        enableProgressTracking(true);
    }
    
    // Show configuration summary
    showConfigurationSummary(config);
}

// NEW: Timer functionality for quick responses
function startResponseTimer(seconds) {
    const timerElement = document.getElementById('response-timer');
    if (!timerElement) return;
    
    let timeLeft = seconds;
    timerElement.style.display = 'block';
    timerElement.textContent = `Time remaining: ${timeLeft}s`;
    
    const countdown = setInterval(() => {
        timeLeft--;
        timerElement.textContent = `Time remaining: ${timeLeft}s`;
        
        if (timeLeft <= 0) {
            clearInterval(countdown);
            timerElement.textContent = "Time's up! Submit your gut reaction.";
            // Could auto-submit or highlight submit button
        }
    }, 1000);
}

// NEW: Show/hide instructions based on configuration
function showInstructions(show) {
    const instructionsElement = document.getElementById('instructions-panel');
    if (instructionsElement) {
        instructionsElement.style.display = show ? 'block' : 'none';
    }
}

// NEW: Enable progress tracking for structured groups
function enableProgressTracking(enable) {
    const progressElement = document.getElementById('progress-tracker');
    if (progressElement) {
        progressElement.style.display = enable ? 'block' : 'none';
    }
}

// NEW: Show configuration summary
function showConfigurationSummary(config) {
    const summaryElement = document.getElementById('config-summary');
    if (!summaryElement) return;
    
    const summary = [];
    if (config.sessionStyle) summary.push(`Session: ${config.sessionStyle.replace('_', ' ')}`);
    if (config.groupStyle) summary.push(`Style: ${config.groupStyle}`);
    if (config.responseStyle) summary.push(`Responses: ${config.responseStyle}`);
    if (config.discussionStyle) summary.push(`Discussion: ${config.discussionStyle.replace('_', ' ')}`);
    
    summaryElement.innerHTML = `<strong>Game Configuration:</strong> ${summary.join(' | ')}`;
    summaryElement.style.display = 'block';
}

// Update buttons and inputs according to the selected player count and current submission progress
function updateSubmissionState() {
    const playerCount = parseInt(sessionStorage.getItem('playerCount')) || null;
    const submitBtn = document.getElementById('submitButton');
    const finalBtn = document.getElementById('final_submit');
    const answerInput = document.getElementById('answer');
    const nameInput = document.getElementById('name');
    const answerStats = document.getElementById('answerStats');
    
    if (!submitBtn || !finalBtn) return;

    const submitted = getSubmittedCountForCurrentQuestion();
    
    // Update button text with progress information
    if (playerCount && playerCount > 0) {
        submitBtn.textContent = `Submit Answer (${submitted}/${playerCount})`;
        
        if (submitted >= playerCount) {
            // All players have submitted - hide submit, show final only
            submitBtn.style.display = 'none';
            finalBtn.style.display = '';
            finalBtn.textContent = 'All Answers Complete - View Results';
            if (answerInput) {
                answerInput.disabled = true;
                answerInput.placeholder = 'All players have answered this question';
            }
            if (nameInput) {
                nameInput.disabled = true;
                nameInput.placeholder = 'All players have answered';
            }
            
            // Show completion message
            showCompletionStatus(submitted, playerCount);
            return;
        }

        // Not yet reached count: show submit and hide final
        submitBtn.style.display = '';
        finalBtn.style.display = 'none';
        if (answerInput) {
            answerInput.disabled = false;
            answerInput.placeholder = 'Answer: ';
        }
        if (nameInput) {
            nameInput.disabled = false;
            nameInput.placeholder = 'First Name: ';
        }
    } else {
        // No playerCount set -> default behavior (both visible)
        submitBtn.textContent = submitted > 0 ? `Submit Answer (${submitted} submitted)` : 'Submit Answer';
        submitBtn.style.display = '';
        finalBtn.style.display = '';
        finalBtn.textContent = 'All Answers Finished';
        if (answerInput) {
            answerInput.disabled = false;
            answerInput.placeholder = 'Answer: ';
        }
        if (nameInput) {
            nameInput.disabled = false;
            nameInput.placeholder = 'First Name: ';
        }
    }
    
    // Update progress indicator
    updateProgressIndicator(submitted, playerCount);
}

// Show completion status when all players have answered
function showCompletionStatus(submitted, required) {
    let completionMsg = document.getElementById('completionStatus');
    if (!completionMsg) {
        completionMsg = document.createElement('div');
        completionMsg.id = 'completionStatus';
        completionMsg.className = 'completion-status';
        
        // Insert after the buttons
        const buttonsContainer = document.querySelector('.buttons');
        if (buttonsContainer) {
            buttonsContainer.insertAdjacentElement('afterend', completionMsg);
        }
    }
    
    completionMsg.innerHTML = `
        <div class="completion-content">
            <span class="completion-icon">🎉</span>
            <div class="completion-text">
                <strong>All ${required} players have answered!</strong>
                <p>Click "View Results" to see everyone's responses.</p>
            </div>
        </div>
    `;
    
    completionMsg.style.display = 'block';
}

// Update progress indicator
function updateProgressIndicator(submitted, required) {
    const progressElement = document.getElementById('submissionProgress');
    
    // Create progress indicator if it doesn't exist
    if (!progressElement && required && required > 0) {
        const progressDiv = document.createElement('div');
        progressDiv.id = 'submissionProgress';
        progressDiv.className = 'submission-progress';
        
        // Insert before the buttons
        const buttonsContainer = document.querySelector('.buttons');
        if (buttonsContainer) {
            buttonsContainer.insertAdjacentElement('beforebegin', progressDiv);
        }
    }
    
    const progressDiv = document.getElementById('submissionProgress');
    if (progressDiv && required && required > 0) {
        const percentage = Math.round((submitted / required) * 100);
        progressDiv.innerHTML = `
            <div class="progress-header">
                <span>Submission Progress</span>
                <span>${submitted}/${required} (${percentage}%)</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
        `;
        progressDiv.style.display = 'block';
    } else if (progressDiv) {
        progressDiv.style.display = 'none';
    }
}

// Pick a random topic (excluding the 'setup' fallback and any non-topic keys)
function pickRandomTopic() {
    const keys = Object.keys(topics || {}).filter(k => k && k !== 'setup');
    if (!keys || keys.length === 0) {
        // Fall back to setup if nothing else
        setTopic('setup');
        return 'setup';
    }
    // Choose a random topic key
    const choice = keys[Math.floor(Math.random() * keys.length)];
    setTopic(choice);
    return choice;
}

// Safe attach: only add listeners if elements exist
const submitBtn = document.getElementById('submitButton');
if (submitBtn) submitBtn.addEventListener('click', submitAnswer);
const switchBtn = document.getElementById('switchQuestion');
if (switchBtn) switchBtn.addEventListener('click', function() {
    // Advance to the next question in the current topic
    const questionElem = document.getElementById('question');
    if (!questionElem) return;
    if (!Array.isArray(appQuestions) || appQuestions.length === 0) {
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
        displayQuestionOptions(currentQuestion);
    } else {
        questionElem.textContent = '';
    }
    
    questionElem.setAttribute('data-index', currentIndex);
    updateSubmissionState();
    displayAnswers(); // Refresh answers display for the new question
    
    // Clear any existing feedback messages
    const existingFeedback = document.querySelectorAll('#submissionSuccess, #validationErrors, #completionStatus');
    existingFeedback.forEach(element => element.remove());
});

// Wire the topic dropdown and restore persisted topic after loading questions
window.addEventListener('DOMContentLoaded', function () {
    loadQuestions().then(() => {
        // Load saved game configuration
        const savedConfig = JSON.parse(localStorage.getItem('gameConfig')) || {};
        gameConfig = savedConfig;
        
        // Always start with the setup topic (game configuration) on page load
        window.currentTopic = 'setup';
        applyQuestionsForTopic('setup');
        const select = document.getElementById('topicSelect');
        if (select) {
            select.value = 'setup';
            
            select.addEventListener('change', function (e) {
                const val = e.target.value;
                if (val === 'random') {
                    pickRandomTopic();
                } else {
                    setTopic(val);
                }
                
                // Apply configuration when switching away from setup
                if (val !== 'setup') {
                    applyGameConfiguration();
                }
            });

            if (select.value === 'random') {
                pickRandomTopic();
            }
        }

        updateSubmissionState();
        displayAnswers(); // Show any existing answers for the current question
    });
});

function submitAnswer() {
    const answer = document.getElementById('answer').value;
    const name = document.getElementById('name').value;
    const questionElem = document.getElementById('question');
    const currentQuestion = questionElem?.textContent || '';

    // Enhanced validation
    const validationErrors = validateSubmission(answer, name, currentQuestion);
    if (validationErrors.length > 0) {
        showValidationErrors(validationErrors);
        return;
    }

    // NEW: Handle setup answers specially
    if (window.currentTopic === 'setup') {
        const currentIndex = parseInt(questionElem.getAttribute('data-index')) || 0;
        storeSetupAnswer(currentIndex, answer.trim());
    }

    // Get chronological submissions list
    const submissions = JSON.parse(localStorage.getItem('chronologicalSubmissions')) || [];
    
    // Check if this question already has enough answers (if player count is set)
    const playerCount = parseInt(sessionStorage.getItem('playerCount')) || null;
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
    localStorage.setItem('chronologicalSubmissions', JSON.stringify(submissions));

    // Clear the input boxes for the next player
    document.getElementById('answer').value = '';
    document.getElementById('name').value = '';

    // Display all answers on the page
    displayAnswers();
    updateSubmissionState();
    
    // Show success feedback
    showSubmissionSuccess(name.trim());
}

// Final submit button handler
const finalBtn = document.getElementById('final_submit');
if (finalBtn) finalBtn.addEventListener('click', function() {
    const submissions = JSON.parse(localStorage.getItem('chronologicalSubmissions')) || [];
    
    if (submissions.length === 0) {
        alert('No answers submitted yet!');
        return;
    }

    // Group submissions by question
    const questionOrder = [];
    const submissionsByQuestion = {};
    
    submissions.forEach(submission => {
        if (!submissionsByQuestion[submission.question]) {
            submissionsByQuestion[submission.question] = [];
            questionOrder.push(submission.question);
        }
        submissionsByQuestion[submission.question].push(submission);
    });

    // Pass data to display page
    sessionStorage.setItem('questionsInOrder', JSON.stringify(questionOrder));
    sessionStorage.setItem('submissionsByQuestion', JSON.stringify(submissionsByQuestion));
    
    // Clear stored submissions
    try {
        localStorage.removeItem('chronologicalSubmissions');
    } catch (e) {
        console.warn('Could not remove chronologicalSubmissions from localStorage', e);
    }

    window.location.href = 'display.html';
});
// ===== ANSWER DISPLAY AND FEEDBACK FUNCTIONS =====

// Display all submitted answers for the current question
function displayAnswers() {
    const answersList = document.getElementById('answersList');
    const answerStats = document.getElementById('answerStats');
    const submittedCountElem = document.getElementById('submittedCount');
    const requiredCountElem = document.getElementById('requiredCount');
    
    if (!answersList) return;
    
    const questionElem = document.getElementById('question');
    const currentQuestion = questionElem?.textContent || '';
    const submissions = JSON.parse(localStorage.getItem('chronologicalSubmissions')) || [];
    
    // Filter submissions for current question
    const currentQuestionSubmissions = submissions.filter(sub => sub.question === currentQuestion);
    
    // Clear and rebuild the answers list
    answersList.innerHTML = '';
    
    if (currentQuestionSubmissions.length === 0) {
        answersList.innerHTML = '<li class="no-answers">No answers submitted yet for this question.</li>';
        if (answerStats) answerStats.style.display = 'none';
        return;
    }
    
    // Display each answer
    currentQuestionSubmissions.forEach((submission, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'answer-item';
        listItem.innerHTML = `
            <div class="answer-header">
                <strong class="answer-name">${escapeHtml(submission.name)}</strong>
                <span class="answer-time">${formatTimeAgo(submission.timestamp)}</span>
            </div>
            <div class="answer-text">${escapeHtml(submission.answer)}</div>
        `;
        answersList.appendChild(listItem);
    });
    
    // Update statistics
    const playerCount = parseInt(sessionStorage.getItem('playerCount')) || 0;
    if (answerStats && submittedCountElem && requiredCountElem) {
        submittedCountElem.textContent = currentQuestionSubmissions.length;
        requiredCountElem.textContent = playerCount || '∞';
        answerStats.style.display = 'flex';
    }
}

// Show success feedback when an answer is submitted
function showSubmissionSuccess(playerName) {
    // Create or update success message
    let successMsg = document.getElementById('submissionSuccess');
    if (!successMsg) {
        successMsg = document.createElement('div');
        successMsg.id = 'submissionSuccess';
        successMsg.className = 'submission-success';
        
        // Insert after the buttons
        const buttonsContainer = document.querySelector('.buttons');
        if (buttonsContainer) {
            buttonsContainer.insertAdjacentElement('afterend', successMsg);
        }
    }
    
    successMsg.innerHTML = `
        <div class="success-content">
            <span class="success-icon">✅</span>
            <span class="success-text">Answer submitted by <strong>${escapeHtml(playerName)}</strong>!</span>
        </div>
    `;
    
    successMsg.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
        if (successMsg) {
            successMsg.style.display = 'none';
        }
    }, 3000);
}

// Enhanced validation for answer submission
function validateSubmission(answer, name, currentQuestion) {
    const errors = [];
    
    // Check for empty fields
    if (!answer.trim()) {
        errors.push('Please provide an answer.');
    }
    if (!name.trim()) {
        errors.push('Please enter your name.');
    }
    if (!currentQuestion.trim()) {
        errors.push('No question is currently selected.');
    }
    
    // Check answer length (reasonable limits)
    if (answer.trim().length > 1000) {
        errors.push('Answer is too long (maximum 1000 characters).');
    }
    if (name.trim().length > 50) {
        errors.push('Name is too long (maximum 50 characters).');
    }
    
    // Check for duplicate submissions from same player for same question
    const submissions = JSON.parse(localStorage.getItem('chronologicalSubmissions')) || [];
    const duplicateSubmission = submissions.find(sub => 
        sub.question === currentQuestion && 
        sub.name.toLowerCase() === name.trim().toLowerCase()
    );
    
    if (duplicateSubmission) {
        errors.push(`${name.trim()} has already answered this question.`);
    }
    
    return errors;
}

// Show validation errors to user
function showValidationErrors(errors) {
    // Remove any existing error display
    const existingErrors = document.getElementById('validationErrors');
    if (existingErrors) {
        existingErrors.remove();
    }
    
    if (errors.length === 0) return;
    
    // Create error display
    const errorDiv = document.createElement('div');
    errorDiv.id = 'validationErrors';
    errorDiv.className = 'validation-errors';
    
    const errorList = errors.map(error => `<li>${escapeHtml(error)}</li>`).join('');
    errorDiv.innerHTML = `
        <div class="error-header">
            <span class="error-icon">⚠️</span>
            <strong>Please fix the following:</strong>
        </div>
        <ul class="error-list">${errorList}</ul>
    `;
    
    // Insert before the input section
    const inputSection = document.getElementById('textInput');
    if (inputSection) {
        inputSection.insertAdjacentElement('beforebegin', errorDiv);
    }
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (errorDiv) {
            errorDiv.remove();
        }
    }, 5000);
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
}

// Dropdown functionality
const dropdownBtn = document.querySelector('#open_page');
const directions = document.querySelector('#directions');

function dropdown(){
    directions.classList.toggle('hide');
}

if (dropdownBtn) dropdownBtn.addEventListener('click', dropdown);