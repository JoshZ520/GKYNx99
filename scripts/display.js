// Display Module - Enhanced for setup configuration demonstration
// This module handles game display logic and answer management

// Global variables for display functionality
let gameData = null;
let currentSessionData = {};
let currentPlayers = [];
let currentIndex = 0;

// === DATA LOADING FUNCTIONS ===
// Function to load questions data
async function loadQuestionsData() {
    try {
        const response = await fetch('files/questions.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        gameData = await response.json();
        console.log('Questions data loaded successfully');
        return gameData;
    } catch (error) {
        console.error('Error loading questions data:', error);
        alert('Error loading game data. Please refresh the page.');
        return null;
    }
}

// === DISPLAY FUNCTIONALITY ===
// Function to display game data and submissions
function displayData() {
    console.log('Starting display process...');
    
    // Load data from sessionStorage (data passed from main.js)
    const questionsInOrder = sessionStorage.getItem('questionsInOrder');
    const submissionsByQuestion = sessionStorage.getItem('submissionsByQuestion');
    
    // If no data, create demo data or show empty state
    if (!questionsInOrder || !submissionsByQuestion) {
        console.log('No game session data found. Creating demo data for testing...');
        createDemoData();
        return;
    }

    try {
        const questions = JSON.parse(questionsInOrder);
        const submissions = JSON.parse(submissionsByQuestion);
        
        // Convert to our expected format
        currentSessionData = {
            questions: questions.map(q => ({ prompt: q })),
            submissionsByQuestion: submissions
        };
        
        // Extract unique players
        currentPlayers = [];
        Object.values(submissions).forEach(questionSubmissions => {
            questionSubmissions.forEach(sub => {
                if (!currentPlayers.includes(sub.name)) {
                    currentPlayers.push(sub.name);
                }
            });
        });
        
        console.log('Session data loaded:', currentSessionData);
        console.log('Players found:', currentPlayers);
    } catch (error) {
        console.error('Error parsing session data:', error);
        createDemoData();
        return;
    }

    // Load questions data and start display
    loadQuestionsData().then(data => {
        if (data) {
            setupDisplayInterface();
            showCurrentQuestion();
            updateDisplayStats();
        }
    });
}

// Function to set up the display interface
function setupDisplayInterface() {
    console.log('Setting up display interface...');
    
    // Apply color scheme from current topic
    const currentTopic = localStorage.getItem('currentTopic') || 'personal';
    if (gameData && gameData[currentTopic] && gameData[currentTopic].colorScheme) {
        if (typeof applyColorScheme === 'function') {
            applyColorScheme(gameData[currentTopic].colorScheme);
        }
    }

    // Set up navigation buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const backBtn = document.getElementById('backBtn');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                showCurrentQuestion();
                updateNavigationButtons();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalQuestions = getTotalQuestions();
            if (currentIndex < totalQuestions - 1) {
                currentIndex++;
                showCurrentQuestion();
                updateNavigationButtons();
            }
        });
    }

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            // Clear all game session data to restart fresh
            sessionStorage.removeItem('questionsInOrder');
            sessionStorage.removeItem('submissionsByQuestion');
            sessionStorage.removeItem('playerCount');
            
            // Also clear any localStorage game data
            localStorage.removeItem('chronologicalSubmissions');
            localStorage.removeItem('setupAnswers');
            localStorage.removeItem('gameConfig');
            
            console.log('Game data cleared - restarting fresh');
            window.location.href = 'game.html';
        });
    }

    updateNavigationButtons();
}

// Function to get total number of questions from current session
function getTotalQuestions() {
    if (!currentSessionData.questions) return 0;
    return currentSessionData.questions.length;
}

// Create demo data for testing when no game data is available
function createDemoData() {
    console.log('Creating demo data for display testing...');
    
    currentSessionData = {
        questions: [
            { prompt: "What's your preferred color theme?", option1: "Warm Colors", option2: "Cool Colors" },
            { prompt: "How do you like to relax?", option1: "Reading", option2: "Music" },
            { prompt: "What's your ideal weekend?", option1: "Outdoors", option2: "Indoors" },
            { prompt: "Which do you prefer?", option1: "Board Games", option2: "Video Games" },
            { prompt: "What's your gaming style?", option1: "Cooperative", option2: "Competitive" }
        ],
        submissionsByQuestion: {
            "What's your preferred color theme?": [
                { name: "Alice", answer: "Warm Colors", timestamp: Date.now() - 300000 },
                { name: "Bob", answer: "Cool Colors", timestamp: Date.now() - 240000 },
                { name: "Charlie", answer: "Warm Colors", timestamp: Date.now() - 180000 }
            ],
            "How do you like to relax?": [
                { name: "Alice", answer: "Reading", timestamp: Date.now() - 120000 },
                { name: "Bob", answer: "Music", timestamp: Date.now() - 60000 },
                { name: "Charlie", answer: "Reading", timestamp: Date.now() - 30000 }
            ],
            "What's your ideal weekend?": [
                { name: "Alice", answer: "Outdoors", timestamp: Date.now() - 10000 },
                { name: "Bob", answer: "Indoors", timestamp: Date.now() - 5000 },
                { name: "Charlie", answer: "Outdoors", timestamp: Date.now() - 1000 }
            ],
            "Which do you prefer?": [
                { name: "Alice", answer: "Board Games", timestamp: Date.now() - 8000 },
                { name: "Bob", answer: "Video Games", timestamp: Date.now() - 4000 },
                { name: "Charlie", answer: "Board Games", timestamp: Date.now() - 2000 }
            ],
            "What's your gaming style?": [
                { name: "Alice", answer: "Cooperative", timestamp: Date.now() - 6000 },
                { name: "Bob", answer: "Competitive", timestamp: Date.now() - 3000 },
                { name: "Charlie", answer: "Cooperative", timestamp: Date.now() - 500 }
            ]
        }
    };
    
    currentPlayers = ["Alice", "Bob", "Charlie"];
    
    // Load questions data and start display
    loadQuestionsData().then(data => {
        if (data) {
            setupDisplayInterface();
            showCurrentQuestion();
            updateDisplayStats();
            
            // Show demo notice
            showDemoNotice();
        }
    });
}

// Show demo notice when using test data
function showDemoNotice() {
    const demoNotice = document.createElement('div');
    demoNotice.className = 'demo-notice';
    demoNotice.innerHTML = `
        <div class="demo-content">
            <strong>🧪 Demo Mode</strong>
            <p>No game data found, showing demo answers for testing. <a href="game.html">Start a real game</a> to see actual results.</p>
        </div>
    `;
    
    // Insert before the header (at the very top)
    const header = document.querySelector('header');
    if (header) {
        header.insertAdjacentElement('beforebegin', demoNotice);
    }
}

// Function to show the current question and answers
function showCurrentQuestion() {
    console.log(`Showing question ${currentIndex + 1}/${getTotalQuestions()}`);
    
    const questionElement = document.getElementById('currentQuestion');
    const answersElement = document.getElementById('playerAnswers');
    const counterElement = document.getElementById('questionCounter');

    if (!questionElement || !answersElement) {
        console.error('Required display elements not found');
        return;
    }

    const sessionQuestions = currentSessionData.questions || [];
    if (currentIndex >= sessionQuestions.length) {
        console.log('No more questions to display');
        questionElement.textContent = 'No more questions available.';
        answersElement.innerHTML = '';
        return;
    }

    const currentQuestionData = sessionQuestions[currentIndex];
    const currentQuestionText = currentQuestionData.prompt || 'Question not available';
    
    // Display the question with options if available
    if (currentQuestionData.option1 && currentQuestionData.option2) {
        questionElement.innerHTML = `
            ${currentQuestionText}
            <div class="question-options">
                <span class="option-badge option1">${currentQuestionData.option1}</span>
                <span class="vs-divider">vs</span>
                <span class="option-badge option2">${currentQuestionData.option2}</span>
            </div>
        `;
    } else {
        questionElement.textContent = currentQuestionText;
    }
    
    // Update question counter
    if (counterElement) {
        counterElement.textContent = `Question ${currentIndex + 1} of ${sessionQuestions.length}`;
    }

    // Display all player answers for this question
    answersElement.innerHTML = '';
    
    // Get submissions for this specific question
    const questionSubmissions = currentSessionData.submissionsByQuestion[currentQuestionText] || [];
    
    if (questionSubmissions.length === 0) {
        answersElement.innerHTML = '<div class="no-answers">No answers submitted for this question.</div>';
        return;
    }
    
    // Add vote summary for choice questions
    const questionData = currentSessionData.questions[currentIndex];
    if (questionData.option1 && questionData.option2) {
        const voteSummary = createVoteSummary(questionSubmissions, questionData);
        answersElement.appendChild(voteSummary);
    }
    
    // Display each player's answer
    questionSubmissions.forEach((submission, index) => {
        const answerDiv = document.createElement('div');
        answerDiv.className = 'answer-item';
        
        const answerHeader = document.createElement('div');
        answerHeader.className = 'answer-header';
        
        const playerLabel = document.createElement('strong');
        playerLabel.className = 'player-answer';
        playerLabel.textContent = submission.name;
        
        const timeLabel = document.createElement('span');
        timeLabel.className = 'answer-time';
        timeLabel.textContent = formatTimeAgo(submission.timestamp);
        
        answerHeader.appendChild(playerLabel);
        answerHeader.appendChild(timeLabel);
        
        const answerText = document.createElement('div');
        answerText.className = 'answer-entry';
        
        // Check if this is a choice-based answer and style accordingly
        const questionData = currentSessionData.questions[currentIndex];
        if (questionData.option1 && questionData.option2) {
            // This is a choice question - style the answer as a choice badge
            const choiceBadge = document.createElement('span');
            choiceBadge.className = 'choice-badge';
            
            if (submission.answer === questionData.option1) {
                choiceBadge.classList.add('option1-choice');
            } else if (submission.answer === questionData.option2) {
                choiceBadge.classList.add('option2-choice');
            }
            
            choiceBadge.textContent = submission.answer;
            answerText.appendChild(choiceBadge);
        } else {
            // Regular text answer
            answerText.textContent = submission.answer;
        }
        
        answerDiv.appendChild(answerHeader);
        answerDiv.appendChild(answerText);
        answersElement.appendChild(answerDiv);
    });

    console.log('Question displayed successfully');
    updateNavigationButtons();
}

// Format timestamp to human readable time
function formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
}

// Create vote summary for choice questions
function createVoteSummary(submissions, questionData) {
    const option1Count = submissions.filter(s => s.answer === questionData.option1).length;
    const option2Count = submissions.filter(s => s.answer === questionData.option2).length;
    const totalVotes = option1Count + option2Count;
    
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'vote-summary';
    
    const option1Percentage = totalVotes > 0 ? Math.round((option1Count / totalVotes) * 100) : 0;
    const option2Percentage = totalVotes > 0 ? Math.round((option2Count / totalVotes) * 100) : 0;
    
    summaryDiv.innerHTML = `
        <h3>Vote Results</h3>
        <div class="vote-bars">
            <div class="vote-bar">
                <div class="vote-label">
                    <span class="option-name">${questionData.option1}</span>
                    <span class="vote-count">${option1Count} vote${option1Count !== 1 ? 's' : ''} (${option1Percentage}%)</span>
                </div>
                <div class="vote-progress">
                    <div class="vote-fill option1-fill" style="width: ${option1Percentage}%"></div>
                </div>
            </div>
            <div class="vote-bar">
                <div class="vote-label">
                    <span class="option-name">${questionData.option2}</span>
                    <span class="vote-count">${option2Count} vote${option2Count !== 1 ? 's' : ''} (${option2Percentage}%)</span>
                </div>
                <div class="vote-progress">
                    <div class="vote-fill option2-fill" style="width: ${option2Percentage}%"></div>
                </div>
            </div>
        </div>
    `;
    
    return summaryDiv;
}

// Update display statistics
function updateDisplayStats() {
    const totalQuestionsEl = document.getElementById('totalQuestions');
    const totalPlayersEl = document.getElementById('totalPlayers');
    const currentPositionEl = document.getElementById('currentPosition');
    
    if (totalQuestionsEl) {
        totalQuestionsEl.textContent = getTotalQuestions();
    }
    
    if (totalPlayersEl) {
        totalPlayersEl.textContent = currentPlayers.length;
    }
    
    if (currentPositionEl) {
        currentPositionEl.textContent = currentIndex + 1;
    }
}

// Function to update navigation button states
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const totalQuestions = getTotalQuestions();

    if (prevBtn) {
        prevBtn.disabled = currentIndex === 0;
        prevBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
    }

    if (nextBtn) {
        nextBtn.disabled = currentIndex >= totalQuestions - 1;
        nextBtn.style.opacity = currentIndex >= totalQuestions - 1 ? '0.5' : '1';
    }
}

// === SETUP CONFIGURATION DISPLAY ===
// Function to display configuration summary (if available)
function displayConfigurationSummary() {
    const configSummary = localStorage.getItem('gameConfiguration');
    if (!configSummary) return;

    try {
        const config = JSON.parse(configSummary);
        const summaryElement = document.createElement('div');
        summaryElement.className = 'config-summary';
        summaryElement.innerHTML = `
            <h3>Game Configuration</h3>
            <div class="config-details">
                <p><strong>Timer:</strong> ${config.timer ? 'Enabled' : 'Disabled'}</p>
                <p><strong>Difficulty:</strong> ${config.difficulty || 'Normal'}</p>
                <p><strong>Theme:</strong> ${config.theme || 'Default'}</p>
                <p><strong>Categories:</strong> ${config.categories ? config.categories.join(', ') : 'All'}</p>
            </div>
        `;
        
        // Insert at the top of the main content
        const mainContent = document.querySelector('.display-container') || document.body;
        mainContent.insertBefore(summaryElement, mainContent.firstChild);
    } catch (error) {
        console.error('Error displaying configuration summary:', error);
    }
}

// === INITIALIZATION ===
// Initialize display when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Display page loaded');
    displayData();
    displayConfigurationSummary();
});

// Export functions for use in other modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        displayData,
        loadQuestionsData,
        showCurrentQuestion,
        updateNavigationButtons
    };
}