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
    
    // Load current session data from localStorage
    const storedData = localStorage.getItem('gameSession');
    if (!storedData) {
        console.log('No game session data found. Redirecting to game page...');
        window.location.href = 'game.html';
        return;
    }

    try {
        currentSessionData = JSON.parse(storedData);
        console.log('Session data loaded:', currentSessionData);
    } catch (error) {
        console.error('Error parsing session data:', error);
        alert('Error loading session data. Please start a new game.');
        window.location.href = 'index.html';
        return;
    }

    // Extract players from session data
    currentPlayers = Object.keys(currentSessionData.answers || {});
    console.log('Players found:', currentPlayers);

    if (currentPlayers.length === 0) {
        console.log('No players found in session data');
        alert('No player data found. Please start a new game.');
        window.location.href = 'index.html';
        return;
    }

    // Load questions data and start display
    loadQuestionsData().then(data => {
        if (data) {
            setupDisplayInterface();
            showCurrentQuestion();
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
    
    // Display the question
    questionElement.textContent = currentQuestionData.prompt || 'Question not available';
    
    // Update question counter
    if (counterElement) {
        counterElement.textContent = `Question ${currentIndex + 1} of ${sessionQuestions.length}`;
    }

    // Display all player answers for this question
    answersElement.innerHTML = '';
    
    currentPlayers.forEach((playerName, playerIndex) => {
        const playerAnswers = currentSessionData.answers[playerName] || [];
        const answer = playerAnswers[currentIndex] || 'No answer provided';
        
        const answerDiv = document.createElement('div');
        answerDiv.className = 'player-answer';
        
        const playerLabel = document.createElement('h3');
        playerLabel.className = 'player-name';
        playerLabel.textContent = playerName;
        
        const answerText = document.createElement('p');
        answerText.className = 'answer-text';
        answerText.textContent = answer;
        
        answerDiv.appendChild(playerLabel);
        answerDiv.appendChild(answerText);
        answersElement.appendChild(answerDiv);
    });

    console.log('Question displayed successfully');
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