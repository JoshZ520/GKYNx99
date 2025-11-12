// src/transport/multiplayer-results-display.js
// Handles results visualization and navigation

// === RESULTS BAR DISPLAY ===
export function displayResultsBar(results, question) {
    const resultsBar = document.getElementById('questionResultsBar');
    const resultsContent = document.getElementById('resultsBarContent');
    
    if (!resultsBar || !resultsContent) return;
    
    // Count votes for each option
    const voteCounts = {};
    results.forEach(result => {
        const answer = result.answer.text || result.answer.value || result.answer;
        voteCounts[answer] = (voteCounts[answer] || 0) + 1;
    });
    
    const totalVotes = results.length;
    
    // Build status bars HTML with better styling
    let html = '';
    Object.entries(voteCounts).forEach(([option, count]) => {
        const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        html += `
            <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="font-weight: 600; margin-bottom: 8px; color: #333;">${option}</div>
                <div style="background: #e9ecef; border-radius: 20px; height: 24px; position: relative; overflow: hidden;">
                    <div style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 100%; width: ${percentage}%; border-radius: 20px; transition: width 0.3s ease;"></div>
                    <span style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 14px; font-weight: 600; color: ${percentage > 50 ? 'white' : '#333'};">${count} vote${count !== 1 ? 's' : ''} (${percentage}%)</span>
                </div>
            </div>
        `;
    });
    
    resultsContent.innerHTML = html;
    resultsBar.style.display = 'block'; // Show the results bar
    return html; // Return HTML for reuse in all results display
}

// === ALL RESULTS MODAL ===
export function showAllResults(gameState) {
    if (gameState.allQuestionResults.length === 0) {
        alert('No questions have been answered yet!');
        return;
    }
    
    const allResultsDisplay = document.getElementById('allResultsDisplay');
    const allResultsContent = document.getElementById('allResultsContent');
    const resultCounter = document.getElementById('resultCounter');
    
    if (!allResultsDisplay || !allResultsContent) return;
    
    // Clamp lastViewedQuestionIndex to valid range
    let lastSeen = Math.max(0, Math.min(gameState.lastViewedQuestionIndex, gameState.allQuestionResults.length - 1));
    // If new questions have been added since last view, start at the first new one
    let currentQuestionIndex = lastSeen;
    if (gameState.allQuestionResults.length > lastSeen + 1) {
        currentQuestionIndex = lastSeen + 1;
    }
    
    function displayQuestion(index) {
        const questionData = gameState.allQuestionResults[index];
        const question = questionData.question;
        const results = questionData.results;
        
        // Update last viewed index
        gameState.lastViewedQuestionIndex = index;
        
        // Count votes for each option
        const voteCounts = {};
        results.forEach(result => {
            const answer = result.answer.text || result.answer.value || result.answer;
            voteCounts[answer] = (voteCounts[answer] || 0) + 1;
        });
        
        const totalVotes = results.length;
        
        // Build display HTML
        let html = `
            <div class="question-result-card">
                <h3 class="result-question">${question.text || question.prompt || question}</h3>
        `;
        
        Object.entries(voteCounts).forEach(([option, count]) => {
            const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            html += `
                <div class="result-option">
                    <div class="option-label">${option}</div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${percentage}%"></div>
                        <span class="vote-count">${count} vote${count !== 1 ? 's' : ''} (${percentage}%)</span>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        allResultsContent.innerHTML = html;
        
        // Update counter
        resultCounter.textContent = `Question ${index + 1} of ${gameState.allQuestionResults.length}`;
        
        // Update navigation buttons
        document.getElementById('prevResultBtn').disabled = index === 0;
        document.getElementById('nextResultBtn').disabled = index === gameState.allQuestionResults.length - 1;
    }
    
    // Navigation handlers
    document.getElementById('prevResultBtn').onclick = () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayQuestion(currentQuestionIndex);
        }
    };
    
    document.getElementById('nextResultBtn').onclick = () => {
        if (currentQuestionIndex < gameState.allQuestionResults.length - 1) {
            currentQuestionIndex++;
            displayQuestion(currentQuestionIndex);
        }
    };
    
    document.getElementById('closeResultsBtn').onclick = () => {
        allResultsDisplay.classList.add('hidden');
        // Clamp lastViewedQuestionIndex to valid range on close
        gameState.lastViewedQuestionIndex = Math.max(0, Math.min(currentQuestionIndex, gameState.allQuestionResults.length - 1));
    };
    
    // Show modal and display first question
    allResultsDisplay.classList.remove('hidden');
    displayQuestion(currentQuestionIndex);
}
