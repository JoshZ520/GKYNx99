const express = require('express');
const session = require('express-session');
const path = require('path');
const sassMiddleware = require('node-sass-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Import questions data
const questionsData = require('./files/questions.json');

// SCSS Middleware - automatically compiles .scss files to .css
app.use('/stylesheets', sassMiddleware({
    src: path.join(__dirname, 'scss'),
    dest: path.join(__dirname, 'stylesheets'),
    indentedSyntax: false, // true = .sass and false = .scss
    sourceMap: true,
    debug: true,
    outputStyle: 'expanded', // or 'compressed' for production
    prefix: '/stylesheets'
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
app.use(session({
    secret: 'table-talk-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Move static files to public directory (we'll do this next)
app.use('/stylesheets', express.static(path.join(__dirname, 'stylesheets')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Routes
app.get('/', (req, res) => {
    res.render('index', {
        title: 'Table Talk - Test Version',
        session: req.session
    });
});

app.get('/setup/:step?', (req, res) => {
    const step = parseInt(req.params.step) || 1;
    const setupQuestions = questionsData.setup.questions;
    
    if (step > setupQuestions.length) {
        // Setup complete, redirect to game
        return res.redirect('/game');
    }
    
    const currentQuestion = setupQuestions[step - 1];
    const progress = Math.round((step / setupQuestions.length) * 100);
    
    res.render('setup', {
        title: 'Game Setup',
        question: currentQuestion,
        step: step,
        totalSteps: setupQuestions.length,
        progress: progress,
        session: req.session
    });
});

app.post('/setup/answer', (req, res) => {
    const { step, answer } = req.body;
    
    // Initialize game config if it doesn't exist
    if (!req.session.gameConfig) {
        req.session.gameConfig = {};
    }
    if (!req.session.setupAnswers) {
        req.session.setupAnswers = {};
    }
    
    // Store the answer
    req.session.setupAnswers[step] = answer;
    
    // Apply configuration based on answer (similar to your existing logic)
    applySetupConfiguration(req.session, parseInt(step), answer);
    
    const nextStep = parseInt(step) + 1;
    const setupQuestions = questionsData.setup.questions;
    
    if (nextStep > setupQuestions.length) {
        // Setup complete
        res.redirect('/game');
    } else {
        res.redirect(`/setup/${nextStep}`);
    }
});

app.get('/game', (req, res) => {
    // Check if setup is complete
    if (!req.session.gameConfig) {
        return res.redirect('/setup/1');
    }
    
    const availableTopics = Object.keys(questionsData).filter(topic => topic !== 'setup');
    
    res.render('game', {
        title: 'Table Talk - Game',
        gameConfig: req.session.gameConfig,
        topics: availableTopics,
        questionsData: questionsData,
        session: req.session
    });
});

app.post('/game/submit', (req, res) => {
    const { question, answer, playerName } = req.body;
    
    // Initialize submissions if they don't exist
    if (!req.session.submissions) {
        req.session.submissions = [];
    }
    
    // Add submission
    req.session.submissions.push({
        question: question,
        answer: answer,
        name: playerName,
        timestamp: Date.now()
    });
    
    res.json({ success: true, totalSubmissions: req.session.submissions.length });
});

app.get('/display', (req, res) => {
    const submissions = req.session.submissions || [];
    
    // Group submissions by question
    const submissionsByQuestion = {};
    const questionsInOrder = [];
    
    submissions.forEach(submission => {
        if (!submissionsByQuestion[submission.question]) {
            submissionsByQuestion[submission.question] = [];
            questionsInOrder.push(submission.question);
        }
        submissionsByQuestion[submission.question].push(submission);
    });
    
    res.render('display', {
        title: 'Results - Test Version',
        questionsInOrder: questionsInOrder,
        submissionsByQuestion: submissionsByQuestion,
        gameConfig: req.session.gameConfig,
        session: req.session
    });
});

app.post('/restart', (req, res) => {
    // Clear all session data
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/');
    });
});

// API endpoints for dynamic functionality
app.get('/api/questions/:topic', (req, res) => {
    const topic = req.params.topic;
    const topicData = questionsData[topic];
    
    if (!topicData) {
        return res.status(404).json({ error: 'Topic not found' });
    }
    
    res.json(topicData);
});

// Configuration mapping (similar to your existing setup)
function applySetupConfiguration(session, questionIndex, answer) {
    const configMap = {
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
    
    if (configMap[questionIndex] && configMap[questionIndex][answer]) {
        Object.assign(session.gameConfig, configMap[questionIndex][answer]);
    }
}

app.listen(PORT, () => {
    console.log(`🎮 Table Talk server running on http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
});