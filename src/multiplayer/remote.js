// remote.js - Game remote control functionality for offline mode
// Provides comprehensive game controls: next/prev question, random question/topic, skip question

// === REMOTE CONTROL STATE ===
let remoteControlsEnabled = false;

// === INITIALIZATION ===
function initializeRemoteControls() {
    remoteControlsEnabled = true;
    
    // Setup event listeners for existing remote control buttons
    setupRemoteEventListeners();
}



// === EVENT LISTENERS ===
function setupRemoteEventListeners() {
    // Question controls
    setupQuestionControls();
    
    // Topic controls  
    setupTopicControls();
}

function setupQuestionControls() {
    // Next question - your existing button
    const nextBtn = document.getElementById('nextQuestionBtn');
    if (nextBtn && !nextBtn.hasAttribute('data-remote-enhanced')) {
        nextBtn.addEventListener('click', () => {
            if (window.nextQuestion) {
                window.nextQuestion();
                showRemoteFeedback('Next question loaded');
            } else {
                showRemoteFeedback('Next question function not available', 'error');
            }
        });
        nextBtn.setAttribute('data-remote-enhanced', 'true');
    }
    
    // Previous question - your existing button
    const prevBtn = document.getElementById('prevQuestionBtn');
    if (prevBtn && !prevBtn.hasAttribute('data-remote-enhanced')) {
        prevBtn.addEventListener('click', () => {
            if (window.previousQuestion) {
                window.previousQuestion();
                showRemoteFeedback('Previous question loaded');
            } else {
                showRemoteFeedback('Previous question function not available', 'error');
            }
        });
        prevBtn.setAttribute('data-remote-enhanced', 'true');
    }
    
    // Random question - your existing switchQuestion button
    const switchBtn = document.getElementById('switchQuestion');
    if (switchBtn && !switchBtn.hasAttribute('data-remote-enhanced')) {
        switchBtn.addEventListener('click', () => {
            if (window.getRandomQuestion) {
                window.getRandomQuestion();
                showRemoteFeedback('Random question selected');
            } else {
                showRemoteFeedback('Random question function not available', 'error');
            }
        });
        switchBtn.setAttribute('data-remote-enhanced', 'true');
    }
    
    // Skip question - your existing button  
    const skipBtn = document.getElementById('skipQuestionBtn');
    if (skipBtn && !skipBtn.hasAttribute('data-remote-enhanced')) {
        skipBtn.addEventListener('click', () => {
            if (confirm('Skip this question and move to the next one?')) {
                if (window.nextQuestion) {
                    window.nextQuestion();
                    showRemoteFeedback('Question skipped');
                } else {
                    showRemoteFeedback('Skip function not available', 'error');
                }
            }
        });
        skipBtn.setAttribute('data-remote-enhanced', 'true');
    }
}

function setupTopicControls() {
    // Random topic - your existing button
    const randomTopicBtn = document.getElementById('randomTopicBtn');
    if (randomTopicBtn && !randomTopicBtn.hasAttribute('data-remote-enhanced')) {
        randomTopicBtn.addEventListener('click', () => {
            if (window.pickRandomTopic) {
                window.pickRandomTopic();
                showRemoteFeedback('Random topic selected');
            } else {
                showRemoteFeedback('Random topic function not available', 'error');
            }
        });
        randomTopicBtn.setAttribute('data-remote-enhanced', 'true');
    }
}



// === FEEDBACK SYSTEM ===
function showRemoteFeedback(message, type = 'success') {
    // Remove existing feedback
    const existing = document.getElementById('remoteFeedback');
    if (existing) {
        existing.remove();
    }
    
    // Create feedback element
    const feedback = document.createElement('div');
    feedback.id = 'remoteFeedback';
    feedback.className = `remote-feedback ${type}`;
    feedback.textContent = message;
    
    // Styles are now in remote.css
    
    document.body.appendChild(feedback);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => feedback.remove(), 300);
        }
    }, 3000);
}

// === UTILITY FUNCTIONS ===
function enableRemoteControls() {
    remoteControlsEnabled = true;
}

function disableRemoteControls() {
    remoteControlsEnabled = false;
}

// === AUTO-INITIALIZATION ===
// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeRemoteControls);
} else {
    initializeRemoteControls();
}

// Make functions available globally
window.remoteControls = {
    enable: enableRemoteControls,
    disable: disableRemoteControls,
    showFeedback: showRemoteFeedback
};