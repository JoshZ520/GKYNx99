// remote.js - Game remote control functionality for offline mode
// Provides comprehensive game controls: next/prev question, random question/topic, skip question

console.log('Remote control system loading...');

// === REMOTE CONTROL STATE ===
let remoteControlsEnabled = false;

// === INITIALIZATION ===
function initializeRemoteControls() {
    console.log('Initializing remote controls for existing game buttons');
    remoteControlsEnabled = true;
    
    // Setup event listeners for existing remote control buttons
    setupRemoteEventListeners();
    
    console.log('Remote controls ready');
}



// === EVENT LISTENERS ===
function setupRemoteEventListeners() {
    console.log('Setting up event listeners for existing remote buttons');
    
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
    
    // Add feedback styles
    const feedbackStyle = `
        .remote-feedback {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 1001;
            animation: slideInRight 0.3s ease;
        }
        
        .remote-feedback.success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
        
        .remote-feedback.error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @media (max-width: 768px) {
            .remote-feedback {
                left: 10px;
                right: 10px;
                top: 10px;
            }
        }
    `;
    
    if (!document.getElementById('feedbackStyles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'feedbackStyles';
        styleEl.textContent = feedbackStyle;
        document.head.appendChild(styleEl);
    }
    
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
    console.log('Remote controls enabled');
}

function disableRemoteControls() {
    remoteControlsEnabled = false;
    console.log('Remote controls disabled');
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

console.log('Remote control system loaded');