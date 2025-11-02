// game.js - Consolidated game page functionality with multiplayer support
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
}

function switchToNextQuestion() {
if (appQuestions.length === 0) return;

const questionElem = document.getElementById('question');
if (!questionElem) return;

const currentIndex = parseInt(questionElem.getAttribute('data-index')) || 0;
const nextIndex = (currentIndex + 1) % appQuestions.length;
const nextQuestion = appQuestions[nextIndex];

// Update the question display
if (typeof nextQuestion === 'string') {
questionElem.textContent = nextQuestion;
hidePreferenceContainer();
} else if (nextQuestion && nextQuestion.prompt) {
questionElem.textContent = nextQuestion.prompt;
displayQuestionOptions(nextQuestion);
} else {
questionElem.textContent = 'No question available';
hidePreferenceContainer();
}

questionElem.setAttribute('data-index', nextIndex);

// Broadcast new question to multiplayer players if active
if (window.hostMultiplayer && window.hostMultiplayer.isActive()) {
window.hostMultiplayer.broadcastQuestion(nextQuestion);
}

// Ensure submit button is visible for the new question
const submitBtn = document.getElementById('submitButton');
if (submitBtn) {
submitBtn.style.display = 'block';
}

// Clear any previous submissions/answers
clearPreviousAnswers();
updateSubmissionState();
}

function switchToPreviousQuestion() {
if (appQuestions.length === 0) return;

const questionElem = document.getElementById('question');
if (!questionElem) return;

const currentIndex = parseInt(questionElem.getAttribute('data-index')) || 0;
const prevIndex = currentIndex === 0 ? appQuestions.length - 1 : currentIndex - 1;
const prevQuestion = appQuestions[prevIndex];

// Update the question display
if (typeof prevQuestion === 'string') {
questionElem.textContent = prevQuestion;
hidePreferenceContainer();
} else if (prevQuestion && prevQuestion.prompt) {
questionElem.textContent = prevQuestion.prompt;
displayQuestionOptions(prevQuestion);
} else {
questionElem.textContent = 'No question available';
hidePreferenceContainer();
}

questionElem.setAttribute('data-index', prevIndex);

// Broadcast new question to multiplayer players if active
if (window.hostMultiplayer && window.hostMultiplayer.isActive()) {
window.hostMultiplayer.broadcastQuestion(prevQuestion);
}

// Clear any previous submissions/answers
clearPreviousAnswers();
updateSubmissionState();
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
name: key.charAt(0).toUpperCase() + key.slice(1),
value: key
}));

console.log('Available topics:', availableTopics);

// Initialize the grid with topics
renderTopicGrid();

// Set up event listeners for pagination
const prevBtn = document.getElementById('prevPageBtn');
const nextBtn = document.getElementById('nextPageBtn');

if (prevBtn) {
prevBtn.addEventListener('click', () => changePage('prev'));
}
if (nextBtn) {
nextBtn.addEventListener('click', () => changePage('next'));
}
})
.catch(err => {
console.error('Failed to load topics:', err);
availableTopics = [];
});
}

// === PREFERENCE SYSTEM ===
function displayQuestionOptions(question) {
// Show preference UI (all questions now have option1 and option2)
const preferenceContainer = document.getElementById('preferenceContainer');
if (preferenceContainer) {
preferenceContainer.classList.remove('hidden');
preferenceContainer.classList.add('visible');

// Update option labels and images
const option1Label = document.getElementById('option1Label');
const option2Label = document.getElementById('option2Label');
const option1Image = document.getElementById('option1Image');
const option2Image = document.getElementById('option2Image');

if (option1Label && question.option1) {
option1Label.textContent = question.option1;
}
if (option2Label && question.option2) {
option2Label.textContent = question.option2;
}

// Handle image loading for options
loadOptionImages(question, option1Image, option2Image);
}

// Clear any previous selection
document.getElementById('selectedPreference').value = '';

// Update selection highlights
document.querySelectorAll('.preference-option').forEach(opt => {
opt.classList.remove('selected');
});
}

function selectPreference(choice) {
// Clear previous selections
document.querySelectorAll('.preference-option').forEach(opt => {
opt.classList.remove('selected');
});

// Highlight selected option
const selectedOption = document.getElementById(choice);
if (selectedOption) {
selectedOption.classList.add('selected');
}

// Get the actual text value instead of the option key
let actualAnswer = choice; // fallback to choice if we can't find the text

if (choice === 'option1') {
const option1Label = document.getElementById('option1Label');
if (option1Label) {
actualAnswer = option1Label.textContent;
}
} else if (choice === 'option2') {
const option2Label = document.getElementById('option2Label');
if (option2Label) {
actualAnswer = option2Label.textContent;
}
}

// Store the actual answer text, not the option key
document.getElementById('selectedPreference').value = actualAnswer;

console.log('Selected preference:', choice, '→ actual answer:', actualAnswer);
}

function submitAnswer() {
const selectedPreference = document.getElementById('selectedPreference').value;

if (!selectedPreference) {
alert('Please select an option before submitting.');
return;
}

const currentPlayerName = getCurrentPlayerName();
const questionElement = document.getElementById('question');
const currentQuestionText = questionElement ? questionElement.textContent : 'Unknown Question';

// Record this answer
recordPlayerAnswer(currentPlayerName, currentQuestionText, selectedPreference);

console.log(`${currentPlayerName} submitted: ${selectedPreference} for "${currentQuestionText}"`);

// MULTIPLAYER INTEGRATION: Advance to next player if in multiplayer mode
if (window.hostMultiplayer && window.hostMultiplayer.isActive()) {
// Let multiplayer manager handle player advancement
// This will be handled by the multiplayer system
} else {
// Single player mode - proceed normally
advanceToNextPlayer();
}

// Update UI
updateSubmissionState();
}

function handleFinalSubmit() {
console.log('Final submit clicked - preparing results');

// Create chronological list of questions in the order they were answered
const questionOrder = Object.keys(submissionsByQuestion).map(question => ({
question: question,
timestamp: submissionsByQuestion[question].timestamp || Date.now()
})).sort((a, b) => a.timestamp - b.timestamp);

// Pass chronological data to display page
sessionStorage.setItem('questionsInOrder', JSON.stringify(questionOrder));
sessionStorage.setItem('submissionsByQuestion', JSON.stringify(submissionsByQuestion));

// MULTIPLAYER INTEGRATION: Reveal answers to multiplayer players if active
if (window.hostMultiplayer && window.hostMultiplayer.isActive()) {
window.hostMultiplayer.revealAnswers();
}

// Save final session state before finishing
if (window.gameSessionManager) {
gameSessionManager.saveCurrentSession();
console.log('Final session state saved before transitioning to results');
}

// Navigate to results page - check if offline mode
const isOffline = sessionStorage.getItem('offlineMode') === 'true';
if (isOffline) {
window.location.href = 'fallback/display.html';
} else {
// For online mode, we might need to create a main display page or redirect appropriately
window.location.href = 'fallback/display.html'; // Temporary - use fallback for now
}
}

// === PLAYER TURN MANAGEMENT ===
let submissionsByQuestion = {};

function getCurrentPlayerName() {
if (playerNames.length === 0) return 'Player';
return playerNames[currentPlayerIndex] || 'Unknown Player';
}

function advanceToNextPlayer() {
if (playerNames.length === 0) return;

currentPlayerIndex = (currentPlayerIndex + 1) % playerNames.length;
updatePlayerTurnIndicator();

// Clear the selection for the next player
clearCurrentSelection();
}

function updatePlayerTurnIndicator() {
const indicator = document.getElementById('playerTurnIndicator');
const playerNameElement = document.getElementById('currentPlayerName');

if (indicator && playerNameElement && playerNames.length > 1) {
const currentPlayer = getCurrentPlayerName();
playerNameElement.textContent = currentPlayer;
indicator.classList.remove('hidden');

// Add animation class for new turn
indicator.classList.add('new-turn');
setTimeout(() => indicator.classList.remove('new-turn'), 600);
} else if (indicator) {
indicator.classList.add('hidden');
}
}

function recordPlayerAnswer(playerName, question, answer) {
// Initialize question entry if it doesn't exist
if (!submissionsByQuestion[question]) {
submissionsByQuestion[question] = {
answers: {},
timestamp: Date.now()
};
}

// Record the player's answer
submissionsByQuestion[question].answers[playerName] = answer;

console.log('Recorded answer:', { playerName, question, answer });
console.log('Current submissions:', submissionsByQuestion);
}

function updateSubmissionState() {
const questionElement = document.getElementById('question');
const currentQuestionText = questionElement ? questionElement.textContent : '';

if (!currentQuestionText || currentQuestionText === 'No question available') {
return;
}

const currentQuestionData = submissionsByQuestion[currentQuestionText];
const answersReceived = currentQuestionData ? Object.keys(currentQuestionData.answers).length : 0;
const totalPlayers = playerNames.length;

const submitBtn = document.getElementById('submitButton');
const finBtn = document.getElementById('final_submit');

// Update submit button text and state
if (submitBtn) {
const currentPlayer = getCurrentPlayerName();
const hasCurrentPlayerAnswered = currentQuestionData && currentQuestionData.answers[currentPlayer];

if (hasCurrentPlayerAnswered) {
submitBtn.textContent = ` ${currentPlayer} Already Answered`;
submitBtn.style.opacity = '0.6';
submitBtn.disabled = true;
} else {
submitBtn.textContent = 'Submit Answer';
submitBtn.style.opacity = '1';
submitBtn.disabled = false;
}
}

// Show final submit button when all players have answered
if (finBtn) {
if (answersReceived >= totalPlayers && totalPlayers > 0) {
finBtn.classList.remove('hide');
finBtn.textContent = `All ${totalPlayers} Players Answered - See Results!`;
} else {
finBtn.classList.add('hide');
}
}
}

// === UTILITY FUNCTIONS ===
function clearCurrentSelection() {
// Clear selection
document.getElementById('selectedPreference').value = '';

// Remove visual selection highlights
document.querySelectorAll('.preference-option').forEach(opt => {
opt.classList.remove('selected');
});
}

function clearPreviousAnswers() {
clearCurrentSelection();

// Reset submit button state
const submitBtn = document.getElementById('submitButton');
if (submitBtn) {
submitBtn.textContent = 'Submit Answer';
submitBtn.style.opacity = '1';
submitBtn.disabled = false;
}

// Hide final submit button for new question
const finBtn = document.getElementById('final_submit');
if (finBtn) {
finBtn.classList.add('hide');
}
}

function hidePreferenceContainer() {
const preferenceContainer = document.getElementById('preferenceContainer');
if (preferenceContainer) {
preferenceContainer.classList.add('hidden');
preferenceContainer.classList.remove('visible');
}
}

// === IMAGE LOADING ===
function loadOptionImages(question, option1Image, option2Image) {
// Handle image loading for preference options
if (question.images) {
if (option1Image && question.images.option1) {
option1Image.innerHTML = `<img src="${question.images.option1}" alt="${question.option1}" loading="lazy">`;
}
if (option2Image && question.images.option2) {
option2Image.innerHTML = `<img src="${question.images.option2}" alt="${question.option2}" loading="lazy">`;
}
} else {
// Clear images if none specified
if (option1Image) option1Image.innerHTML = '';
if (option2Image) option2Image.innerHTML = '';
}
}

// === TOPIC GRID AND PAGINATION ===
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
closeTopicsPanel();
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

if (panel && toggle) {
if (panel.classList.contains('hidden')) {
panel.classList.remove('hidden');
panel.classList.add('visible');
toggle.textContent = 'Topics ▲';
} else {
closeTopicsPanel();
}
}
}

function closeTopicsPanel() {
const panel = document.getElementById('topicsPanel');
const toggle = document.getElementById('topicsToggle');

if (panel && toggle) {
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

function getRandomQuestion() {
if (!selectedTopic) {
// If no topic selected, pick a random topic first
pickRandomTopic();
return;
}

// Get questions for current topic
const currentTopicQuestions = getQuestionsForTopic(selectedTopic);

if (!currentTopicQuestions || currentTopicQuestions.length === 0) {
alert('No questions available for the current topic.');
return;
}

// Pick a random question
const randomIndex = Math.floor(Math.random() * currentTopicQuestions.length);
currentQuestionIndex = randomIndex;

console.log(`Random question selected: index ${currentQuestionIndex}`);

// Display the question
displayCurrentQuestion();
updatePlayerTurnIndicator();
clearPreviousAnswers();
}

// === EVENT LISTENERS AND INITIALIZATION ===
function initializeGamePage() {
console.log('Initializing game page...');

// Initialize topic selection system
initializeTopicSelection();

// Load player names from session
const sessionPlayerNames = JSON.parse(sessionStorage.getItem('playerNames') || '[]');
if (sessionPlayerNames.length > 0) {
playerNames = sessionPlayerNames;
currentPlayerIndex = 0;
updatePlayerTurnIndicator();
console.log('Loaded players:', playerNames);
}

// Load saved submissions if any
const savedSubmissions = sessionStorage.getItem('submissionsByQuestion');
if (savedSubmissions) {
try {
submissionsByQuestion = JSON.parse(savedSubmissions);
console.log('Loaded previous submissions:', submissionsByQuestion);
} catch (e) {
console.error('Error parsing saved submissions:', e);
submissionsByQuestion = {};
}
}

// Set up event listeners
setupEventListeners();

// Load current topic and apply questions
const currentTopic = localStorage.getItem('currentTopic') || 'default';
setTopic(currentTopic);

// Update initial submission state
updateSubmissionState();
}

function setupEventListeners() {
// Question navigation buttons
const switchBtn = document.getElementById('switchQuestion');
const nextBtn = document.getElementById('nextQuestionBtn');
const prevBtn = document.getElementById('prevQuestionBtn');
const skipBtn = document.getElementById('skipQuestionBtn');
const randomTopicBtn = document.getElementById('randomTopicBtn');

if (switchBtn) {
switchBtn.addEventListener('click', switchToNextQuestion);
}

if (nextBtn) {
nextBtn.addEventListener('click', switchToNextQuestion);
}

if (prevBtn) {
prevBtn.addEventListener('click', switchToPreviousQuestion);
}

if (skipBtn) {
skipBtn.addEventListener('click', switchToNextQuestion);
}

if (randomTopicBtn) {
randomTopicBtn.addEventListener('click', pickRandomTopic);
}

// Topic selection
const topicsToggle = document.getElementById('topicsToggle');
if (topicsToggle) {
topicsToggle.addEventListener('click', toggleTopicsPanel);
}

// Preference selection
const option1 = document.getElementById('option1');
const option2 = document.getElementById('option2');

if (option1) {
option1.addEventListener('click', () => selectPreference('option1'));
}

if (option2) {
option2.addEventListener('click', () => selectPreference('option2'));
}

// Submit buttons
const submitBtn = document.getElementById('submitButton');
const finalBtn = document.getElementById('final_submit');

if (submitBtn) {
submitBtn.addEventListener('click', submitAnswer);
}

if (finalBtn) {
finalBtn.addEventListener('click', handleFinalSubmit);
}
}

// Check for offline mode and show appropriate UI
function checkOfflineMode() {
const isOffline = sessionStorage.getItem('offlineMode') === 'true';
const offlineNotice = document.getElementById('offlineModeNotice');
const multiplayerInfo = document.getElementById('multiplayerInfo');

if (isOffline && offlineNotice) {
offlineNotice.classList.remove('hidden');
if (multiplayerInfo) multiplayerInfo.classList.add('hidden');
console.log('Offline mode detected - showing single-device instructions');
}
}

// Make functions available globally for conditional script loading and remote control
window.checkOfflineMode = checkOfflineMode;
window.nextQuestion = switchToNextQuestion;
window.previousQuestion = switchToPreviousQuestion;
window.toggleTopicsPanel = toggleTopicsPanel;
window.pickRandomTopic = pickRandomTopic;
window.getRandomQuestion = getRandomQuestion;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
checkOfflineMode();
initializeGamePage();
});