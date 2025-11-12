let currentQuestionIndex = 0;
let allQuestionsData = [];

export function populateResults(resultsData) {
    console.log('populateResults called with:', resultsData);
    const { submissionsByQuestion, playerNames, questionsOrder } = resultsData;
    console.log('Extracted data:', { submissionsByQuestion, playerNames, questionsOrder });

    const totalQuestions = Object.keys(submissionsByQuestion).length;
    const totalPlayers = playerNames.length;
    
    const totalQuestionsEl = document.getElementById('totalQuestions');
    const totalPlayersEl = document.getElementById('totalPlayers');
    
    if (totalQuestionsEl) totalQuestionsEl.textContent = totalQuestions;
    if (totalPlayersEl) totalPlayersEl.textContent = totalPlayers;
    
    const topics = window.getTopics ? window.getTopics() : {};
    
    const questionsList = document.getElementById('questionsList');
    if (!questionsList) return;
    
    allQuestionsData = questionsOrder.map(questionData => ({
        questionData,
        submissions: submissionsByQuestion[questionData.question],
        topics,
        playerNames
    }));
    
    if (allQuestionsData.length === 0) {
        questionsList.innerHTML = '<p style="text-align: center; padding: 40px; color: #6b7280;">No questions answered yet.</p>';
        return;
    }
    
    currentQuestionIndex = 0;
    
    setupPaginationControls(questionsList);
    displayQuestion(currentQuestionIndex);
}

function setupPaginationControls(container) {
    console.log('setupPaginationControls called with container:', container);
    const controlsHTML = `
        <div class="results-navigation" style="display: flex; justify-content: space-between; align-items: center; margin: 20px 0; padding: 15px; background: #f3f4f6; border-radius: 8px;">
            <button id="prevResultQuestion" class="nav-btn" style="padding: 10px 20px; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">← Previous</button>
            <span id="resultQuestionCounter" style="font-weight: 600; color: #374151;"></span>
            <button id="nextResultQuestion" class="nav-btn" style="padding: 10px 20px; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Next →</button>
        </div>
        <div id="currentQuestionDisplay"></div>
    `;
    
    console.log('Setting container HTML...');
    container.innerHTML = controlsHTML;
    
    document.getElementById('prevResultQuestion').addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayQuestion(currentQuestionIndex);
        }
    });
    
    document.getElementById('nextResultQuestion').addEventListener('click', () => {
        if (currentQuestionIndex < allQuestionsData.length - 1) {
            currentQuestionIndex++;
            displayQuestion(currentQuestionIndex);
        }
    });
}

function displayQuestion(index) {
    console.log('displayQuestion called with index:', index);
    console.log('allQuestionsData:', allQuestionsData);
    
    if (!allQuestionsData[index]) {
        console.error('No question data at index:', index);
        return;
    }
    
    const { questionData, submissions, topics, playerNames } = allQuestionsData[index];
    const questionText = questionData.question;
    
    const questionTopic = questionData.topic || localStorage.getItem('currentTopic');
    const topicData = topics[questionTopic] || {};
    const topicColors = topicData.colors || { option1: '#3b82f6', option2: '#10b981' };
    
    console.log('Looking for currentQuestionDisplay...');
    const displayContainer = document.getElementById('currentQuestionDisplay');
    console.log('displayContainer found:', displayContainer);
    
    if (!displayContainer) {
        console.error('currentQuestionDisplay container not found');
        return;
    }
    
    displayContainer.innerHTML = '';
    
    if (submissions && submissions.answers) {
        const questionItem = document.createElement('div');
        questionItem.className = 'question-item';
        questionItem.style.cssText = 'animation: fadeIn 0.3s ease-in;';
        
        const questionTextDiv = document.createElement('div');
        questionTextDiv.className = 'question-text';
        questionTextDiv.style.cssText = 'font-size: 24px; font-weight: 700; color: #1f2937; margin-bottom: 24px; padding: 20px; background: #f9fafb; border-radius: 12px; border-left: 4px solid #6366f1;';
        questionTextDiv.textContent = questionText;
        
        const answersDiv = document.createElement('div');
        answersDiv.className = 'question-answers';
        answersDiv.style.cssText = 'margin-top: 20px;';
        
        const answerGroups = {};
        Object.entries(submissions.answers).forEach(([player, answer]) => {
            if (!answerGroups[answer]) {
                answerGroups[answer] = [];
            }
            answerGroups[answer].push(player);
        });
        
        const answerColors = [topicColors.option1, topicColors.option2];
        const playerColors = ['#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
        
        const playerColorMap = {};
        playerNames.forEach((name, index) => {
            playerColorMap[name] = playerColors[index % playerColors.length];
        });
        
        const totalAnswers = Object.keys(submissions.answers).length;
        
        Object.entries(answerGroups).forEach(([answer, players], index) => {
            const percentage = totalAnswers > 0 ? Math.round((players.length / totalAnswers) * 100) : 0;
            const answerColor = answerColors[index % answerColors.length];
            
            const answerOption = document.createElement('div');
            answerOption.className = 'answer-option';
            answerOption.style.cssText = 'margin-bottom: 20px;';
            
            const answerLabel = document.createElement('div');
            answerLabel.className = 'answer-label';
            answerLabel.style.color = answerColor;
            answerLabel.style.fontWeight = 'bold';
            answerLabel.style.fontSize = '18px';
            answerLabel.textContent = `${answer} (${players.length})`;
            
            const progressContainer = document.createElement('div');
            progressContainer.className = 'progress-bar-container';
            progressContainer.style.cssText = 'background: #e5e7eb; border-radius: 8px; height: 32px; overflow: hidden; margin: 12px 0; position: relative;';
            
            const progressBar = document.createElement('div');
            progressBar.className = 'progress-bar-fill';
            progressBar.style.cssText = `background: ${answerColor}; height: 100%; width: ${percentage}%; transition: width 0.5s ease; display: flex; align-items: center; justify-content: flex-end; padding-right: 12px; color: white; font-weight: bold; font-size: 14px;`;
            progressBar.textContent = `${percentage}%`;
            
            progressContainer.appendChild(progressBar);
            
            const playersDiv = document.createElement('div');
            playersDiv.className = 'answer-players';
            playersDiv.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px;';
            
            players.forEach(playerName => {
                const playerChip = document.createElement('span');
                playerChip.className = 'player-chip';
                playerChip.style.cssText = `background: ${playerColorMap[playerName]}; color: white; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);`;
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
        displayContainer.appendChild(questionItem);
    } else {
        const noDataMsg = document.createElement('p');
        noDataMsg.style.cssText = 'text-align: center; padding: 40px; color: #6b7280;';
        noDataMsg.textContent = 'No answers recorded for this question.';
        displayContainer.appendChild(noDataMsg);
    }
    
    updateNavigationButtons();
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevResultQuestion');
    const nextBtn = document.getElementById('nextResultQuestion');
    const counter = document.getElementById('resultQuestionCounter');
    
    if (prevBtn) prevBtn.disabled = currentQuestionIndex === 0;
    if (nextBtn) nextBtn.disabled = currentQuestionIndex === allQuestionsData.length - 1;
    if (counter) counter.textContent = `Question ${currentQuestionIndex + 1} of ${allQuestionsData.length}`;
    
    if (prevBtn) prevBtn.style.opacity = currentQuestionIndex === 0 ? '0.5' : '1';
    if (nextBtn) nextBtn.style.opacity = currentQuestionIndex === allQuestionsData.length - 1 ? '0.5' : '1';
    if (prevBtn) prevBtn.style.cursor = currentQuestionIndex === 0 ? 'not-allowed' : 'pointer';
    if (nextBtn) nextBtn.style.cursor = currentQuestionIndex === allQuestionsData.length - 1 ? 'not-allowed' : 'pointer';
    
    if (window.gamePlayer && window.gamePlayer.setupResultsButtons) {
        window.gamePlayer.setupResultsButtons();
    }
}
