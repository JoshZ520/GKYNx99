// src/core/question/question-display.js
// Handles question display: showing/hiding questions, topic selection, UI updates

import { GAME_CONFIG, CONFIG_UTILS } from '../game-config.js';
import { setAppQuestions, appQuestions, questionCounter, maxSubmissions } from './question-state.js';
import { clearPreviousAnswers, hidePreferenceContainer } from './question-navigation.js';

// Track asked question indices to prevent repeats within a topic
let askedQuestionIndices = [];

// === QUESTION DISPLAY ===
export function showQuestionArea() {
    const questionElem = CONFIG_UTILS.getElementById('QUESTION');
    const preferenceContainer = CONFIG_UTILS.getElementById('PREFERENCE_CONTAINER');
    const submitButton = CONFIG_UTILS.getElementById('SUBMIT_BUTTON');
    const remoteControl = document.querySelector('.remote-control');
    
    if (questionElem) CONFIG_UTILS.show(questionElem);
    if (preferenceContainer) CONFIG_UTILS.show(preferenceContainer);
    if (submitButton) CONFIG_UTILS.show(submitButton);
    if (remoteControl) CONFIG_UTILS.show(remoteControl);
}

export function hideQuestionArea() {
    const questionElem = CONFIG_UTILS.getElementById('QUESTION');
    const preferenceContainer = CONFIG_UTILS.getElementById('PREFERENCE_CONTAINER');
    const submitButton = CONFIG_UTILS.getElementById('SUBMIT_BUTTON');
    const remoteControl = document.querySelector('.remote-control');
    const topicNameElement = CONFIG_UTILS.getElement('currentTopicName');
    
    if (questionElem) {
        CONFIG_UTILS.hide(questionElem);
        CONFIG_UTILS.setText(questionElem, 'Please select a topic to begin');
    }
    if (preferenceContainer) CONFIG_UTILS.hide(preferenceContainer);
    if (submitButton) CONFIG_UTILS.hide(submitButton);
    if (remoteControl) CONFIG_UTILS.hide(remoteControl);
    if (topicNameElement) CONFIG_UTILS.setText(topicNameElement, 'No topic selected');
}

// === QUESTION LIMIT PANEL ===
const questionLimitReachedElement = CONFIG_UTILS.getElement('askCon');

export function showQuestionLimitReachedPanel() {
    if (questionLimitReachedElement) {
        // Update the count display
        const countElement = document.getElementById('questionsAnsweredCount');
        if (countElement) {
            countElement.textContent = questionCounter;
        }
        
        CONFIG_UTILS.show(questionLimitReachedElement);
        hideQuestionArea(); 
    }
}

export function hideQuestionLimitReachedPanel() {
    if (questionLimitReachedElement) {
        CONFIG_UTILS.hide(questionLimitReachedElement);
    }
}

// === TOPIC MANAGEMENT ===
export function applyQuestionsForTopic(topic) {
    const topics = window.getTopics ? window.getTopics() : {};
    const topicData = topics[topic] || {};
    let list = topicData.questions || [];
    
    setAppQuestions(list);
    
    const questionElem = CONFIG_UTILS.getElementById('QUESTION');
    if (questionElem) {
        // Get indices of questions not yet asked
        const availableIndices = [];
        for (let i = 0; i < appQuestions.length; i++) {
            if (!askedQuestionIndices.includes(i)) {
                availableIndices.push(i);
            }
        }
        
        // If all questions asked, show message to switch topics
        if (availableIndices.length === 0) {
            alert('You\'ve asked all questions in this topic! Please select a different topic to continue.');
            return;
        }
        
        // Select random from available questions
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        askedQuestionIndices.push(randomIndex);
        questionElem.setAttribute('data-index', randomIndex);
        
        // Handle both old string format and new object format
        const currentQuestion = appQuestions[randomIndex];
        if (typeof currentQuestion === 'string') {
            questionElem.textContent = currentQuestion;
        } else if (currentQuestion && currentQuestion.prompt) {
            questionElem.textContent = currentQuestion.prompt;
            // Display the options as well
            if (window.gameUI) {
                window.gameUI.displayQuestionOptions(currentQuestion);
            }
        } else {
            questionElem.textContent = '';
        }
        
        // Broadcast random question to players if in multiplayer mode
        if (currentQuestion && window.transport && window.transport.isMultiplayer()) {
            window.transport.broadcastQuestion(currentQuestion);
        }
    }
    
    // Show question area now that topic is selected
    showQuestionArea();
}

// === TRACKER HELPER FUNCTIONS ===
export function getAskedQuestionIndices() {
    return askedQuestionIndices;
}

export function addAskedQuestionIndex(index) {
    if (!askedQuestionIndices.includes(index)) {
        askedQuestionIndices.push(index);
    }
}

export function clearAskedQuestions() {
    askedQuestionIndices = [];
}

export function setTopic(topic) {
    window.currentTopic = topic;
    // Clear tracker when changing topics
    clearAskedQuestions();
    applyQuestionsForTopic(topic);
    // Topic is stored in memory only - no localStorage needed
    
    // Update topic display
    const topicNameElement = CONFIG_UTILS.getElement('currentTopicName');
    if (topicNameElement) {
        // Simple display name without needing availableTopics
        const displayName = topic.charAt(0).toUpperCase() + topic.slice(1);
        CONFIG_UTILS.setText(topicNameElement, displayName);
    }
    
    // Broadcast first question to players if in multiplayer mode
    if (window.transport && window.transport.isMultiplayer() && appQuestions.length > 0) {
        const firstQuestion = appQuestions[0];
        window.transport.broadcastQuestion(firstQuestion);
    }
    
    // Update UI state after topic change (with small delay to ensure DOM is updated)
    setTimeout(() => {
        if (typeof updateSubmissionState === 'function') {
            updateSubmissionState();
        } else if (window.gamePlayer && typeof window.gamePlayer.updateSubmissionState === 'function') {
            window.gamePlayer.updateSubmissionState();
        }
    }, GAME_CONFIG.ANIMATIONS.UI_UPDATE_DELAY);
    
    // Save session after topic change
    if (window.gameSessionManager) {
        setTimeout(() => {
            gameSessionManager.saveCurrentSession();
        }, 100);
    }
}

// === GAME END HANDLER ===
export function handleEndGame() {
    // Show game summary popup instead of going directly to results
    if (window.showGameSummary) {
        window.showGameSummary();
    } else {
        // Fallback: show full results if summary not available
        if (window.gameState && window.gameState.allQuestionResults && window.gameState.allQuestionResults.length > 0) {
            const submissionsByQuestion = {};
            const playerNames = window.gameState.playerNames || [];
            const questionsOrder = [];
            
            // Convert multiplayer results to display format
                window.gameState.allQuestionResults.forEach(questionResult => {
                    const questionText = questionResult.question.text || questionResult.question.prompt || questionResult.question;
                    const questionObj = { question: questionText };
                    questionsOrder.push(questionObj);
                    
                    // Create submissions object with answers by player
                    submissionsByQuestion[questionText] = {
                        answers: {},
                        timestamp: questionResult.timestamp || Date.now()
                    };
                    
                    // Map results to player answers
                    questionResult.results.forEach(result => {
                        const playerName = result.playerName || result.name;
                        const answer = result.answer.text || result.answer.value || result.answer;
                        submissionsByQuestion[questionText].answers[playerName] = answer;
                    });
                });
                
                window.transport?.showResults({ submissionsByQuestion, playerNames, questionsOrder });
            } else {
                console.error('No multiplayer results available to display');
            }
    }
}

// === UI REFRESH ===
export function refreshCurrentQuestion() {
    // Refresh the current question display and update UI state
    if (window.gamePlayer && window.gamePlayer.updateSubmissionState) {
        window.gamePlayer.updateSubmissionState();
    }
    if (window.gameUI && window.gameUI.updateQuestionUI) {
        window.gameUI.updateQuestionUI();
    }
}
