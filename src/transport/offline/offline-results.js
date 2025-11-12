// src/transport/offline/offline-results.js - Results display with progress bars

/**
 * Populate results section with offline game data
 * @param {Object} resultsData - Contains submissionsByQuestion, playerNames, questionsOrder
 */
export function populateResults(resultsData) {
    const { submissionsByQuestion, playerNames, questionsOrder } = resultsData;

    // Populate game stats
    const totalQuestions = Object.keys(submissionsByQuestion).length;
    const totalPlayers = playerNames.length;
    
    const totalQuestionsEl = document.getElementById('totalQuestions');
    const totalPlayersEl = document.getElementById('totalPlayers');
    
    if (totalQuestionsEl) totalQuestionsEl.textContent = totalQuestions;
    if (totalPlayersEl) totalPlayersEl.textContent = totalPlayers;
    
    // Get all topics for color lookup
    const topics = window.getTopics ? window.getTopics() : {};
    
    // Populate questions and answers
    const questionsList = document.getElementById('questionsList');
    if (!questionsList) return;
    
    questionsList.innerHTML = '';
    
    questionsOrder.forEach(questionData => {
        const questionText = questionData.question;
        const submissions = submissionsByQuestion[questionText];
        
        // Get colors from the topic this question was asked in
        const questionTopic = questionData.topic || localStorage.getItem('currentTopic');
        const topicData = topics[questionTopic] || {};
        const topicColors = topicData.colors || { option1: '#3b82f6', option2: '#10b981' }; // Default colors if not set
        
        if (submissions) {
            const questionItem = document.createElement('div');
            questionItem.className = 'question-item';
            
            const questionTextDiv = document.createElement('div');
            questionTextDiv.className = 'question-text';
            questionTextDiv.textContent = questionText;
            
            const answersDiv = document.createElement('div');
            answersDiv.className = 'question-answers';
            
            // Group answers by preference
            const answerGroups = {};
            Object.entries(submissions.answers).forEach(([player, answer]) => {
                if (!answerGroups[answer]) {
                    answerGroups[answer] = [];
                }
                answerGroups[answer].push(player);
            });
            
            // Answer colors from topic JSON
            const answerColors = [topicColors.option1, topicColors.option2];
            
            // Player colors palette
            const playerColors = ['#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
            
            // Create player color map
            const playerColorMap = {};
            playerNames.forEach((name, index) => {
                playerColorMap[name] = playerColors[index % playerColors.length];
            });
            
            const totalAnswers = Object.keys(submissions.answers).length;
            
            // Create progress bars for each answer
            Object.entries(answerGroups).forEach(([answer, players], index) => {
                const percentage = totalAnswers > 0 ? Math.round((players.length / totalAnswers) * 100) : 0;
                const answerColor = answerColors[index % answerColors.length];
                
                // Answer option container
                const answerOption = document.createElement('div');
                answerOption.className = 'answer-option';
                
                // Answer label with count
                const answerLabel = document.createElement('div');
                answerLabel.className = 'answer-label';
                answerLabel.style.color = answerColor;
                answerLabel.style.fontWeight = 'bold';
                answerLabel.textContent = `${answer} (${players.length})`;
                
                // Progress bar container
                const progressContainer = document.createElement('div');
                progressContainer.className = 'progress-bar-container';
                progressContainer.style.cssText = 'background: #e5e7eb; border-radius: 8px; height: 24px; overflow: hidden; margin: 8px 0;';
                
                // Progress bar fill
                const progressBar = document.createElement('div');
                progressBar.className = 'progress-bar-fill';
                progressBar.style.cssText = `background: ${answerColor}; height: 100%; width: ${percentage}%; transition: width 0.3s ease; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; color: white; font-weight: bold; font-size: 12px;`;
                progressBar.textContent = `${percentage}%`;
                
                progressContainer.appendChild(progressBar);
                
                // Players list
                const playersDiv = document.createElement('div');
                playersDiv.className = 'answer-players';
                playersDiv.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;';
                
                players.forEach(playerName => {
                    const playerChip = document.createElement('span');
                    playerChip.className = 'player-chip';
                    playerChip.style.cssText = `background: ${playerColorMap[playerName]}; color: white; padding: 4px 12px; border-radius: 16px; font-size: 14px; font-weight: 500;`;
                    playerChip.textContent = playerName;
                    playersDiv.appendChild(playerChip);
                });
                
                answerOption.appendChild(answerLabel);
                answerOption.appendChild(progressContainer);
                answerOption.appendChild(playersDiv);
                answersDiv.appendChild(answerOption);
            });
            
            questionItem.appendChild(questionTextDiv);
            questionItem.appendChild(answersDiv);
            questionsList.appendChild(questionItem);
        }
    });
    
    // Set up action buttons (call player-manager's setupResultsButtons if available)
    if (window.gamePlayer && window.gamePlayer.setupResultsButtons) {
        window.gamePlayer.setupResultsButtons();
    }
}
