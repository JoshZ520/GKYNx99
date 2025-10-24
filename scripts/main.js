// initialize global topic and appQuestions so they are available everywhere in this script
window.currentTopic = window.currentTopic || 'default';

// topics and color schemes will be loaded from modular files structure
let topics = {};
let colorSchemes = {};
let appQuestions = [];

function loadQuestions() {
    // Load color schemes and topic index first
    return Promise.all([
        fetch('files/color-schemes.json').then(res => {
            if (!res.ok) throw new Error('Failed to load color-schemes.json');
            return res.json();
        }),
        fetch('files/topics/index.json').then(res => {
            if (!res.ok) throw new Error('Failed to load topics/index.json');
            return res.json();
        })
    ])
    .then(([colorSchemesData, topicsIndex]) => {
        // Store color schemes
        colorSchemes = colorSchemesData || {};
        
        // Load individual topic files
        const topicPromises = Object.keys(topicsIndex).map(topicName => {
            const topicInfo = topicsIndex[topicName];
            return fetch(`files/topics/${topicInfo.file}`)
                .then(res => {
                    if (!res.ok) throw new Error(`Failed to load ${topicInfo.file}`);
                    return res.json();
                })
                .then(topicData => {
                    // Create topic structure with color scheme reference
                    topics[topicName] = {
                        questions: topicData.questions || [],
                        colorScheme: topicInfo.colorScheme || "light"
                    };
                });
        });
        
        return Promise.all(topicPromises);
    })
    .then(() => {
        // Ensure default exists with proper structure
        if (!topics.default) {
            topics.default = {
                questions: [],
                colorScheme: "light"
            };
        }
        
        // Ensure light color scheme exists as fallback
        if (!colorSchemes.light) {
            colorSchemes.light = {
                background: "#f8f9fa",
                headerBackground: "#ffffff",
                headerBorder: "#6c757d",
                primaryButton: "#4169E1",
                secondaryButton: "#28a745",
                accent: "#17a2b8",
                focusColor: "#4169E1",
                textColor: "#212529",
                headerTextColor: "#212529",
                svgColor: "#495057",
                svgHoverColor: "#6c757d"
            };
        }
        
        return { topics, colorSchemes };
    })
    .catch(err => {
        console.error('Error loading questions from modular files:', err);
        // Final fallback with empty data
        topics = { 
            default: {
                questions: [],
                colorScheme: "light"
            }
        };
        colorSchemes = {
            light: {
                background: "#f8f9fa",
                headerBackground: "#ffffff",
                headerBorder: "#6c757d",
                primaryButton: "#4169E1",
                secondaryButton: "#28a745",
                accent: "#17a2b8",
                focusColor: "#4169E1",
                textColor: "#212529",
                headerTextColor: "#212529",
                svgColor: "#495057",
                svgHoverColor: "#6c757d"
            }
        };
        return { topics, colorSchemes };
    });
}
// helpers to change topic and questions
function applyQuestionsForTopic(topic) {
    const topicData = (topics && topics[topic]) || topics['default'] || {};
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
    if (topicData.colorScheme) {
        // Handle both string reference and direct object
        let colorScheme;
        if (typeof topicData.colorScheme === 'string') {
            // Resolve color scheme reference
            colorScheme = colorSchemes[topicData.colorScheme] || colorSchemes['light'] || {};
        } else {
            // Direct color scheme object (fallback for old format)
            colorScheme = topicData.colorScheme;
        }
        applyColorScheme(colorScheme);
    }
}

function setTopic(topic) {
    window.currentTopic = topic;
    applyQuestionsForTopic(topic);
    localStorage.setItem('currentTopic', topic);
    // Update UI state after topic change (with small delay to ensure DOM is updated)
    setTimeout(() => updateSubmissionState(), 0);
}

// Utility: count how many answers have been submitted for the current question
function getSubmittedCountForCurrentQuestion() {
    const questionElem = document.getElementById('question');
    const currentQuestion = questionElem?.textContent || '';
    const submissions = JSON.parse(localStorage.getItem('chronologicalSubmissions')) || [];
    const filteredSubmissions = submissions.filter(sub => sub.question === currentQuestion);
    return filteredSubmissions.length;
}

// Update buttons and inputs according to the selected player count and current submission progress
function updateSubmissionState() {
    const playerCountString = sessionStorage.getItem('playerCount');
    const playerCount = parseInt(playerCountString) || null;
    const submitBtn = document.getElementById('submitButton');
    const finalBtn = document.getElementById('final_submit');
    const answerInput = document.getElementById('answer');
    const nameInput = document.getElementById('name');
    if (!submitBtn || !finalBtn) return;

    if (playerCount && playerCount > 0) {
        const submitted = getSubmittedCountForCurrentQuestion();
        if (submitted >= playerCount) {
            // hide/disable submit, show final only
            submitBtn.style.display = 'none';
            finalBtn.style.display = '';
            if (answerInput) answerInput.disabled = true;
            if (nameInput) nameInput.disabled = true;
            return;
        }

        // not yet reached count: show submit and hide final
        submitBtn.style.display = '';
        finalBtn.style.display = 'none';
        if (answerInput) answerInput.disabled = false;
        if (nameInput) nameInput.disabled = false;
    } else {
        // no playerCount set -> default behavior (both visible)
        submitBtn.style.display = '';
        finalBtn.style.display = '';
        if (answerInput) answerInput.disabled = false;
        if (nameInput) nameInput.disabled = false;
    }
}
// Pick a random topic (excluding the 'default' fallback and any non-topic keys)
function pickRandomTopic() {
    const select = document.getElementById('topicSelect');
    if (!select) {
        console.warn('Topic select dropdown not found');
        return 'default';
    }
    
    // Get all topic options except 'default' and 'random'
    const topicOptions = Array.from(select.options).filter(option => 
        option.value !== 'default' && option.value !== 'random'
    );
    
    if (topicOptions.length === 0) {
        // Fall back to default if no topics available
        select.value = 'default';
        setTopic('default');
        return 'default';
    }
    
    // Choose a random topic option
    const randomOption = topicOptions[Math.floor(Math.random() * topicOptions.length)];
    const choice = randomOption.value;
    
    // Update the dropdown to show the selected topic
    select.value = choice;
    
    // Apply the topic
    setTopic(choice);
    return choice;
}

// safe attach: only add listeners if elements exist
const submitBtn = document.getElementById('submitButton');
if (submitBtn) submitBtn.addEventListener('click', submitAnswer);
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
    updateSubmissionState();
});

// wire the topic dropdown and restore persisted topic after loading questions
window.addEventListener('DOMContentLoaded', function () {
    // Handle front page functionality (player count selection)
    handleFrontPageFunctionality();
    
    loadQuestions().then(() => {
        // Always start with the default topic (instructions) on page load
        window.currentTopic = 'default';
        applyQuestionsForTopic('default');
        const select = document.getElementById('topicSelect');
        if (select) {
            select.value = 'default';
            
            select.addEventListener('change', function (e) {
                const val = e.target.value;
                if (val === 'random') {
                    // pick and apply a random topic, which will update the dropdown
                    pickRandomTopic();
                } else {
                    setTopic(val);
                }
            });

            // If the dropdown's current value is the built-in 'random' selection on load,
            // immediately pick a random topic so the UI shows a real question set.
            if (select.value === 'random') {
                pickRandomTopic();
            }
        }

        // Ensure submission state reflects any configured player count on initial load
        updateSubmissionState();
        
        // Load front page instruction if we're on the front page
        loadFrontPageInstruction();
    });
});
function submitAnswer() {
    // Get answer from preference selection
    const answer = document.getElementById('selectedPreference').value;
    const name = document.getElementById('preferenceName').value;
    
    const questionElem = document.getElementById('question');
    const currentQuestion = questionElem?.textContent || '';

    if (!answer.trim() || !name.trim() || !currentQuestion.trim()) {
        alert('Please make a selection and enter your name before submitting.');
        return; // Don't submit empty answers
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

    // Save chronological submissions
    localStorage.setItem('chronologicalSubmissions', JSON.stringify(submissions));

    // Clear the preference system for the next player
    document.getElementById('selectedPreference').value = '';
    document.getElementById('preferenceName').value = '';
    // Remove visual selection
    const option1 = document.getElementById('option1');
    const option2 = document.getElementById('option2');
    if (option1) option1.classList.remove('selected');
    if (option2) option2.classList.remove('selected');

    // Display all answers on the page
    displayAnswers();

    // Update UI state in case we've reached the player count
    updateSubmissionState();
}

const finalBtn = document.getElementById('final_submit');
if (finalBtn) finalBtn.addEventListener('click', function() {
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
    // Redirect to the display/results page

    // Clear stored submissions so the next run starts fresh, but keep other persisted settings (like currentTopic)
    try {
        localStorage.removeItem('chronologicalSubmissions');
    } catch (e) {
        console.warn('Could not remove chronologicalSubmissions from localStorage', e);
    }

    // Redirect to the display/results page
    window.location.href = 'display.html';
});

 const dropdownBtn = document.querySelector('#open_page');
 const directions = document.querySelector('#directions');

 function dropdown(){
     directions.classList.toggle('hide');
 }

 if (dropdownBtn) dropdownBtn.addEventListener('click', dropdown);

// === FRONT PAGE FUNCTIONALITY ===
// Handle player count selection and storage
function handleFrontPageFunctionality() {
    const select = document.getElementById('player_count');
    if (!select) return; // Not on front page
    
    // When the selection changes, store the value as an integer in sessionStorage
    select.addEventListener('change', function (e) {
        const rawValue = e.target.value;
        const val = parseInt(rawValue, 10);
        if (!Number.isNaN(val) && val > 0) {
            sessionStorage.setItem('playerCount', String(val));
        } else {
            sessionStorage.removeItem('playerCount');
        }
    });

    // If the user navigates to this page and then back, pre-select the stored value
    const stored = parseInt(sessionStorage.getItem('playerCount'), 10);
    if (!Number.isNaN(stored) && stored > 0) {
        const opt = Array.from(select.options).find(o => parseInt(o.value, 10) === stored);
        if (opt) select.value = String(stored);
    }
}

// Function to load and display the front page instruction
function loadFrontPageInstruction() {
    const instructionElement = document.getElementById('front-instruction');
    if (!instructionElement) return; // Not on front page
    
    fetch('files/topics/default.json')
        .then(res => {
            if (!res.ok) throw new Error('Failed to load default.json');
            return res.json();
        })
        .then(data => {
            if (data.questions && data.questions.length > 0) {
                // Use the first question as the front page instruction
                const frontInstruction = data.questions[0];
                instructionElement.textContent = frontInstruction;
            }
        })
        .catch(err => {
            console.warn('Could not load front page instruction:', err);
        });
}