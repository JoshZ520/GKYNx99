// initialize global topic and appQuestions so they are available everywhere in this script
window.currentTopic = window.currentTopic || 'default';

// topics will be loaded from files/questions.json
let topics = {};
let appQuestions = [];

function loadQuestions() {
    return fetch('files/questions.json')
        .then(res => {
            if (!res.ok) throw new Error('Failed to load questions.json');
            return res.json();
        })
        .then(data => {
            topics = data || {};
            // ensure default exists with proper structure
            if (!topics.default) {
                topics.default = {
                    questions: [],
                    colorScheme: {
                        background: "#fff7d1",
                        headerBackground: "#FAFAF7",
                        headerBorder: "#59A8D9",
                        primaryButton: "#f0a23b",
                        secondaryButton: "#2EC4B6",
                        accent: "#FFC857",
                        focusColor: "#307eea",
                        textColor: "#333333",
                        headerTextColor: "#333333"
                    }
                };
            }
            return topics;
        })
        .catch(err => {
            console.error('Error loading questions.json:', err);
            topics = { 
                default: {
                    questions: [],
                    colorScheme: {
                        background: "#fff7d1",
                        headerBackground: "#FAFAF7",
                        headerBorder: "#59A8D9",
                        primaryButton: "#f0a23b",
                        secondaryButton: "#2EC4B6",
                        accent: "#FFC857",
                        focusColor: "#307eea",
                        textColor: "#333333",
                        headerTextColor: "#333333"
                    }
                }
            };
            return topics;
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
        applyColorScheme(topicData.colorScheme);
    }
}

// Function to display question options
function displayQuestionOptions(question) {
    if (question.option1 && question.option2) {
        // Show preference UI and hide text input
        const preferenceContainer = document.getElementById('preferenceContainer');
        const textInput = document.getElementById('textInput');
        const answerElem = document.getElementById('answer');
        
        if (preferenceContainer && textInput) {
            preferenceContainer.style.display = 'block';
            textInput.style.display = 'none';
        }
        
        // Update option labels and placeholder images
        const option1Label = document.getElementById('option1Label');
        const option2Label = document.getElementById('option2Label');
        const option1Image = document.getElementById('option1Image');
        const option2Image = document.getElementById('option2Image');
        
        if (option1Label) option1Label.textContent = question.option1;
        if (option2Label) option2Label.textContent = question.option2;
        
        // Add placeholder content to images (contributors can replace with real images)
        if (option1Image) {
            option1Image.textContent = question.option1;
            option1Image.setAttribute('data-option', question.option1.toLowerCase().replace(/\s+/g, '-'));
        }
        if (option2Image) {
            option2Image.textContent = question.option2;
            option2Image.setAttribute('data-option', question.option2.toLowerCase().replace(/\s+/g, '-'));
        }
        
        // Set up click handlers for preferences
        setupPreferenceClickHandlers(question);
    } else {
        // Fallback to text input for backward compatibility
        showTextInput(question);
    }
}

// Function to show text input (fallback)
function showTextInput(question) {
    const preferenceContainer = document.getElementById('preferenceContainer');
    const textInput = document.getElementById('textInput');
    const answerElem = document.getElementById('answer');
    
    if (preferenceContainer) preferenceContainer.style.display = 'none';
    if (textInput) textInput.style.display = 'block';
    
    if (answerElem && question) {
        if (typeof question === 'string') {
            answerElem.placeholder = 'Answer: ';
        } else if (question.option1 && question.option2) {
            answerElem.placeholder = `Choose: ${question.option1} or ${question.option2}`;
        }
    }
}

// Function to apply color scheme to the page
function applyColorScheme(colorScheme) {
    const root = document.documentElement;
    
    // Determine if this is a dark theme based on background color
    const isDarkTheme = colorScheme.textColor === '#ffffff';
    
    // Set CSS custom properties using the new variable names
    if (isDarkTheme) {
        root.style.setProperty('--background-dark', colorScheme.background);
        root.style.setProperty('--background-light', colorScheme.headerBackground);
        root.style.setProperty('--accent-dark', colorScheme.headerBorder);
        root.style.setProperty('--accent-light', colorScheme.accent);
        root.style.setProperty('--text-light', colorScheme.textColor);
        root.style.setProperty('--text-dark', colorScheme.headerTextColor);
        root.style.setProperty('--dark', colorScheme.background);
        root.style.setProperty('--light', colorScheme.headerBackground);
    } else {
        root.style.setProperty('--background-light', colorScheme.background);
        root.style.setProperty('--background-dark', colorScheme.headerBackground);
        root.style.setProperty('--accent-light', colorScheme.accent);
        root.style.setProperty('--accent-dark', colorScheme.headerBorder);
        root.style.setProperty('--text-dark', colorScheme.textColor);
        root.style.setProperty('--text-light', colorScheme.headerTextColor);
        root.style.setProperty('--light', colorScheme.background);
        root.style.setProperty('--dark', colorScheme.textColor);
    }
    
    // Apply colors directly to elements for immediate effect
    document.body.style.backgroundColor = colorScheme.background;
    document.body.style.color = colorScheme.textColor || '#333333';
    
    const header = document.querySelector('header');
    if (header) {
        header.style.backgroundColor = colorScheme.headerBackground;
        header.style.borderColor = colorScheme.headerBorder;
        header.style.color = colorScheme.textColor || '#333333';
    }
    
    // Update all headings
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
        heading.style.color = colorScheme.headerTextColor || '#333333';
    });
    
    // Update all paragraphs and text elements
    const textElements = document.querySelectorAll('p, label, .topic');
    textElements.forEach(element => {
        element.style.color = colorScheme.textColor || '#333333';
    });
    
    const submitBtn = document.querySelector('.submit');
    if (submitBtn) {
        submitBtn.style.backgroundColor = colorScheme.primaryButton;
        submitBtn.style.color = colorScheme.headerTextColor || '#ffffff';
    }
    
    const finBtn = document.querySelector('.fin');
    if (finBtn) {
        finBtn.style.backgroundColor = colorScheme.secondaryButton;
        finBtn.style.color = colorScheme.headerTextColor || '#ffffff';
    }
    
    const footer = document.querySelector('footer');
    if (footer) {
        footer.style.backgroundColor = colorScheme.accent;
        footer.style.color = colorScheme.headerTextColor || '#ffffff';
    }
    
    // Update switch button background to match body
    const switchBtn = document.querySelector('.switch_button');
    if (switchBtn) {
        switchBtn.style.backgroundColor = colorScheme.background;
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
    return submissions.filter(sub => sub.question === currentQuestion).length;
}

// Update buttons and inputs according to the selected player count and current submission progress
function updateSubmissionState() {
    const playerCount = parseInt(sessionStorage.getItem('playerCount')) || null;
    const submitBtn = document.getElementById('submitButton');
    const finalBtn = document.getElementById('final_submit');
    const answerInput = document.getElementById('answer');
    const nameInput = document.getElementById('name');
    if (!submitBtn || !finalBtn) return;

    if (playerCount && playerCount > 0) {
        const submitted = getSubmittedCountForCurrentQuestion();
        console.log('updateSubmissionState:', { playerCount, submitted }); // Debug
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
    const keys = Object.keys(topics || {}).filter(k => k && k !== 'default');
    if (!keys || keys.length === 0) {
        // Fall back to default if nothing else
        setTopic('default');
        return 'default';
    }
    // Choose a random topic key
    const choice = keys[Math.floor(Math.random() * keys.length)];
    setTopic(choice);
    return choice;
}

// Function to set up click handlers for preference options
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

// Function to handle preference selection
function selectPreference(choice) {
    // Visual feedback - highlight selected option
    const option1 = document.getElementById('option1');
    const option2 = document.getElementById('option2');
    
    if (option1) option1.classList.remove('selected');
    if (option2) option2.classList.remove('selected');
    
    const selectedOption = choice === document.getElementById('option1Label')?.textContent 
        ? option1 : option2;
    
    if (selectedOption) selectedOption.classList.add('selected');
    
    // Store the choice in the hidden answer field for submission
    const answerElem = document.getElementById('answer');
    if (answerElem) {
        answerElem.value = choice;
    }
    
    console.log('Selected preference:', choice);
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
                    // pick and apply a random topic
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
    });
});
function submitAnswer() {
    const answer = document.getElementById('answer').value;
    const name = document.getElementById('name').value;
    const questionElem = document.getElementById('question');
    const currentQuestion = questionElem?.textContent || '';

    console.log('submitAnswer called:', { answer, name, currentQuestion }); // Debug

    if (!answer.trim() || !name.trim() || !currentQuestion.trim()) {
        console.log('Submission blocked: empty fields'); // Debug
        return; // Don't submit empty answers
    }

    // Get chronological submissions list
    const submissions = JSON.parse(localStorage.getItem('chronologicalSubmissions')) || [];
    
    // Check if this question already has enough answers (if player count is set)
    const playerCount = parseInt(sessionStorage.getItem('playerCount')) || null;
    if (playerCount) {
        const answersForThisQuestion = submissions.filter(sub => sub.question === currentQuestion).length;
        console.log('Player count check:', { playerCount, answersForThisQuestion }); // Debug
        if (answersForThisQuestion >= playerCount) {
            console.log('Submission blocked: player count reached'); // Debug
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

    // Clear the input boxes for the next player
    document.getElementById('answer').value = '';
    document.getElementById('name').value = '';

    // Display all answers on the page
    displayAnswers();

    // Update UI state in case we've reached the player count
    updateSubmissionState();
}

// displayAnswers is implemented in scripts/answers.js and will be available globally

// displayAnswers will register itself on DOMContentLoaded from scripts/answers.js
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

 dropdownBtn.addEventListener('click', dropdown);