import { CONFIG_UTILS } from '../../config/game-config.js';

export function broadcastQuestionToPlayers(question, socket, gameState) {
    if (gameState.currentPage !== 'game' || !gameState.isHost || !socket || !gameState.isConnected) {
        return;
    }
    
    gameState.currentQuestion = question;
    gameState.waitingForAnswers = true;
    gameState.collectedAnswers = new Map();
    
    CONFIG_UTILS.show('answerProgressContainer');
    
    const revealBtn = CONFIG_UTILS.getElement('revealAnswersBtn');
    if (revealBtn && gameState.isHost) {
        CONFIG_UTILS.setDisplay(revealBtn, 'inline-block');
        // Wire up the reveal button if not already done
        if (!revealBtn.hasAttribute('data-wired')) {
            revealBtn.addEventListener('click', () => {
                revealAnswers(socket, gameState);
            });
            revealBtn.setAttribute('data-wired', 'true');
        }
    }
    
    // Convert question to multiplayer format - handle different question formats
    let questionText = '';
    if (typeof question === 'string') {
        questionText = question;
    } else if (question.prompt) {
        questionText = question.prompt;
    } else if (question.text) {
        questionText = typeof question.text === 'string' ? question.text : question.text.prompt;
    }
    
    // Extract options from different formats
    let options = [];
    if (question.options && Array.isArray(question.options)) {
        // If options array exists, ensure each option has proper structure
        options = question.options.map((opt, index) => {
            // Handle if option is already an object with text property
            if (typeof opt === 'object' && opt.text) {
                return {
                    text: opt.text,
                    value: opt.value || `option${index + 1}`,
                    image: opt.image || null
                };
            }
            // Handle if option is a string
            return {
                text: typeof opt === 'string' ? opt : (opt.label || String(opt)),
                value: `option${index + 1}`,
                image: null
            };
        });
    } else if (question.option1 && question.option2) {
        // Convert option1/option2 format to array
        options = [
            { text: question.option1, value: 'option1', image: question.images?.option1 },
            { text: question.option2, value: 'option2', image: question.images?.option2 }
        ];
    } else if (question.option1 || question.option2) {
        // Handle edge case where only one option exists
        if (question.option1) {
            options.push({ text: question.option1, value: 'option1', image: question.images?.option1 });
        }
        if (question.option2) {
            options.push({ text: question.option2, value: 'option2', image: question.images?.option2 });
        }
    }
    
    const multiplayerQuestion = {
        text: questionText,
        options: options
    };
    
    socket.emit('broadcast-question', {
        roomCode: gameState.roomCode,
        question: multiplayerQuestion
    });
}

export function revealAnswers(socket, gameState) {
    if (!gameState.isHost || !socket || !gameState.isConnected) {
        return;
    }
    
    socket.emit('reveal-answers', {
        roomCode: gameState.roomCode
    });
}

export function updateAnswerProgress(answeredCount, totalPlayers) {
    CONFIG_UTILS.setText('answerProgress', `${answeredCount}/${totalPlayers} players answered`);
}

export function handleAnswerReceived(data, gameState, revealAnswersCallback) {
    updateAnswerProgress(data.answeredCount, data.totalPlayers);
    
    const notification = CONFIG_UTILS.setText('playerAnsweredNotification', `${data.playerName} answered!`);
    if (notification) {
        CONFIG_UTILS.setDisplay(notification, 'block');
        setTimeout(() => {
            CONFIG_UTILS.hideDisplay(notification);
        }, 2000);
    }
    
    // Auto-capture answers when all players have submitted
    if (data.answeredCount === data.totalPlayers && data.totalPlayers > 0) {
        setTimeout(() => {
            revealAnswersCallback(); // This will capture results without displaying them
        }, 500);
    }
}

export function handleAnswersRevealed(data, gameState) {
    gameState.allQuestionResults.push({
        question: data.question,
        results: data.results,
        timestamp: Date.now()
    });
    
    // Store results but don't display them automatically
    // Results will be shown when user clicks "End Game" button
    
    // Hide the reveal button after answers are captured
    CONFIG_UTILS.hideDisplay('revealAnswersBtn');
    
    // Show the "End Game" button after first question is answered
    CONFIG_UTILS.setDisplay('end_game_btn', 'block');
    
    updateAnswerProgress(0, gameState.playerNames?.length || 0);
}

export function getCurrentQuestionOptions() {
    const option1Label = CONFIG_UTILS.getElement('option1Label');
    const option2Label = CONFIG_UTILS.getElement('option2Label');
    
    if (option1Label && option2Label) {
        return [
            { text: option1Label.textContent, value: 'option1' },
            { text: option2Label.textContent, value: 'option2' }
        ];
    }
    
    return [];
}
