// question-filter.js - Question filtering and distribution logic
// Handles filtering questions by topics and creating balanced selections

// === FILTERING FUNCTIONS ===
function filterQuestionsByTopics(topics, questionData) {
    // TODO: Filter questions from questionData based on selected topics
    // Returns: { topicName: [questions...] }
    console.log('Filtering questions for topics:', topics);
    
    const filteredByTopic = {};
    
    // Placeholder logic - this will be implemented to:
    // 1. Load questions for each selected topic
    // 2. Remove any excluded questions (if filtering is added)
    // 3. Organize by topic for distribution
    
    return filteredByTopic;
}

function getTopicQuestionCounts(topics) {
    // TODO: Return the number of available questions per topic
    // Returns: { topicName: count }
    console.log('Getting question counts for topics:', topics);
    
    const counts = {};
    topics.forEach(topic => {
        counts[topic] = 0; // Placeholder
    });
    
    return counts;
}

function selectBalancedQuestions(filteredQuestions, questionLimit, gameStyle = 'balanced') {
    // TODO: Create a balanced selection of questions based on the game style
    console.log('Selecting balanced questions...', {
        totalAvailable: Object.keys(filteredQuestions).length,
        limit: questionLimit,
        style: gameStyle
    });
    
    switch (gameStyle) {
        case 'balanced':
            return selectBalancedDistribution(filteredQuestions, questionLimit);
        case 'random':
            return selectRandomDistribution(filteredQuestions, questionLimit);
        case 'progressive':
            return selectProgressiveDistribution(filteredQuestions, questionLimit);
        default:
            return selectBalancedDistribution(filteredQuestions, questionLimit);
    }
}

function selectBalancedDistribution(filteredQuestions, questionLimit) {
    // TODO: Distribute questions evenly across topics
    // If 3 topics and 12 questions → ~4 questions per topic
    console.log('Creating balanced distribution...');
    return [];
}

function selectRandomDistribution(filteredQuestions, questionLimit) {
    // TODO: Randomly select questions from all topics without regard to balance
    console.log('Creating random distribution...');
    return [];
}

function selectProgressiveDistribution(filteredQuestions, questionLimit) {
    // TODO: Start with lighter topics/questions, progress to deeper ones
    // Requires questions to have difficulty/depth ratings
    console.log('Creating progressive distribution...');
    return [];
}

// === VALIDATION FUNCTIONS ===
function validateTopicAvailability(selectedTopics, questionLimit) {
    // TODO: Check if selected topics have enough questions
    // Warn about topics with limited questions
    // Suggest alternatives if needed
    
    const warnings = [];
    const counts = getTopicQuestionCounts(selectedTopics);
    
    Object.entries(counts).forEach(([topic, count]) => {
        if (count === 0) {
            warnings.push(`${topic} has no available questions`);
        } else if (count < 3) {
            warnings.push(`${topic} only has ${count} question(s) available`);
        }
    });
    
    const totalAvailable = Object.values(counts).reduce((sum, count) => sum + count, 0);
    if (totalAvailable < questionLimit) {
        warnings.push(`Only ${totalAvailable} questions available, but ${questionLimit} requested`);
    }
    
    return {
        isValid: warnings.length === 0,
        warnings: warnings,
        totalAvailable: totalAvailable
    };
}

function suggestOptimalDistribution(selectedTopics, questionLimit) {
    // TODO: Suggest the best way to distribute questions
    // Returns recommended questions per topic
    console.log('Suggesting optimal distribution...');
    
    const counts = getTopicQuestionCounts(selectedTopics);
    const topicCount = selectedTopics.length;
    const baseQuestionsPerTopic = Math.floor(questionLimit / topicCount);
    const remainder = questionLimit % topicCount;
    
    const suggestions = {};
    selectedTopics.forEach((topic, index) => {
        suggestions[topic] = baseQuestionsPerTopic + (index < remainder ? 1 : 0);
    });
    
    return suggestions;
}

// === UTILITY FUNCTIONS ===
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function estimateGameTime(questionCount, playerCount = 4) {
    // TODO: Estimate how long the game will take
    // Based on average time per question and number of players
    const minutesPerQuestion = 2; // Base estimate
    const playerMultiplier = Math.max(1, playerCount * 0.5); // More players = more discussion
    
    return Math.round(questionCount * minutesPerQuestion * playerMultiplier);
}

// === EXPORTS ===
window.questionFilter = {
    filterQuestionsByTopics,
    getTopicQuestionCounts,
    selectBalancedQuestions,
    validateTopicAvailability,
    suggestOptimalDistribution,
    shuffleArray,
    estimateGameTime
};