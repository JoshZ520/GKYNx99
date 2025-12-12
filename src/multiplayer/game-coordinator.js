import { CONFIG_UTILS } from '../core/game-config.js';

let hostTimerInterval = null;

export function updateAnswerProgress(answeredCount, totalPlayers) {
    CONFIG_UTILS.setText('answerProgress', `${answeredCount}/${totalPlayers} players answered`);
}

export function broadcastQuestionToPlayers(question, socket, gameState) {
    if (gameState.currentPage !== 'game' || !gameState.isHost || !socket || !gameState.isConnected) return;
    
    // Set start time on first question
    if (!gameState.startTime) {
        gameState.startTime = Date.now();
    }
    
    // Clear any running timer from previous question
    if (hostTimerInterval) {
        clearInterval(hostTimerInterval);
        hostTimerInterval = null;
    }
    CONFIG_UTILS.hide('hostTimerContainer');
    CONFIG_UTILS.hideDisplay('end_game_btn');
    
    gameState.currentQuestion = question;
    gameState.waitingForAnswers = true;
    gameState.collectedAnswers = new Map();
    CONFIG_UTILS.show('answerProgressContainer');
    const totalPlayers = gameState.players?.length || 0;
    updateAnswerProgress(0, totalPlayers);
    
    const revealBtn = CONFIG_UTILS.getElement('revealAnswersBtn');
    if (revealBtn && gameState.isHost) {
        CONFIG_UTILS.setDisplay(revealBtn, 'inline-block');
        if (!revealBtn.hasAttribute('data-wired')) {
            revealBtn.addEventListener('click', () => revealAnswers(socket, gameState));
            revealBtn.setAttribute('data-wired', 'true');
        }
    }
    
    let questionText = '';
    if (typeof question === 'string') questionText = question;
    else if (question.prompt) questionText = question.prompt;
    else if (question.text) questionText = typeof question.text === 'string' ? question.text : question.text.prompt;
    
    let options = [];
    if (question.options && Array.isArray(question.options)) {
        options = question.options.map((opt, index) => {
            if (typeof opt === 'object' && opt.text) return { text: opt.text, value: opt.value || `option${index + 1}`, image: opt.image || null };
            return { text: typeof opt === 'string' ? opt : (opt.label || String(opt)), value: `option${index + 1}`, image: null };
        });
    } else if (question.option1 && question.option2) {
        options = [
            { text: question.option1, value: 'option1', image: question.images?.option1 },
            { text: question.option2, value: 'option2', image: question.images?.option2 }
        ];
    } else if (question.option1 || question.option2) {
        if (question.option1) options.push({ text: question.option1, value: 'option1', image: question.images?.option1 });
        if (question.option2) options.push({ text: question.option2, value: 'option2', image: question.images?.option2 });
    }
    
    const multiplayerQuestion = {
        text: questionText,
        options: options,
        followUpQuestion: question.followUpQuestion || question.followUp || null,
        groupFollowUpQuestion: question.groupFollowUpQuestion || null
    };
    
    socket.emit('broadcast-question', {
        roomCode: gameState.roomCode,
        question: multiplayerQuestion
    });
}

export function revealAnswers(socket, gameState) {
    if (!gameState.isHost || !socket || !gameState.isConnected) return;
    
    // Count this reveal for question limit tracking
    if (window.gameCore && window.gameCore.recordAnsweredQuestion) {
        const limitReached = window.gameCore.recordAnsweredQuestion();
        // Note: Continue even if limit reached to show final discussion question
    }
    
    // Check if timer is enabled
    const timerEnabled = document.querySelector('input[name="need-timer"]:checked')?.value === 'true';
    const timerDuration = timerEnabled ? (document.getElementById('timer-duration')?.value || 1) : 0;
    
    // Check if follow-up questions are enabled
    const followUpEnabled = document.querySelector('input[name="follow-up-option"]:checked')?.value === 'true';
    
    // Get discussion mode (one-on-one or group)
    const discussionMode = document.querySelector('input[name="follow-up-question"]:checked')?.value || 'one-on-one';
    console.log('Sending discussionMode:', discussionMode, 'followUpEnabled:', followUpEnabled);
    
    const revealData = { roomCode: gameState.roomCode, timerDuration: parseInt(timerDuration) * 60, followUpEnabled, discussionMode };
    const selectedPref = document.getElementById('selectedPreference');
    const hostAnswer = selectedPref?.value;
    if (hostAnswer) {
        const option1Label = document.getElementById('option1Label');
        const option2Label = document.getElementById('option2Label');
        const index = option1Label?.textContent === hostAnswer ? 0 : (option2Label?.textContent === hostAnswer ? 1 : null);
        if (index !== null) revealData.hostAnswer = { text: hostAnswer, value: hostAnswer, index };
    }
    socket.emit('reveal-answers', revealData);
}

export function handleAnswerReceived(data, gameState, revealAnswersCallback) {
    updateAnswerProgress(data.answeredCount, data.totalPlayers);
    const notification = CONFIG_UTILS.setText('playerAnsweredNotification', `${data.playerName} answered!`);
    if (notification) { CONFIG_UTILS.setDisplay(notification, 'block'); setTimeout(() => CONFIG_UTILS.hideDisplay(notification), 2000); }
}

export function handleAnswersRevealed(data, gameState) {
    gameState.allQuestionResults.push({ question: data.question, results: data.results, timestamp: Date.now() });
    CONFIG_UTILS.hideDisplay('revealAnswersBtn');
    CONFIG_UTILS.setDisplay('end_game_btn', 'block');
    updateAnswerProgress(0, gameState.playerNames?.length || 0);
    if (data.timerDuration && data.timerDuration > 0) { startHostTimer(data.timerDuration); }
    
    // Check if question limit has been reached
    if (window.gameCore && window.gameCore.isQuestionLimitReached && window.gameCore.isQuestionLimitReached()) {
        // Show the "add more questions" popup
        if (window.gameCore.showQuestionLimitReachedPanel) {
            window.gameCore.showQuestionLimitReachedPanel();
        }
    }
}
function startHostTimer(durationInSeconds) {
    if (hostTimerInterval) clearInterval(hostTimerInterval);
    const timerContainer = CONFIG_UTILS.getElement('hostTimerContainer');
    const timerDisplay = CONFIG_UTILS.getElement('hostTimer');
    if (!timerDisplay || !timerContainer) return;
    CONFIG_UTILS.show('hostTimerContainer');
    let remainingSeconds = durationInSeconds;
    updateHostTimer(remainingSeconds);
    hostTimerInterval = setInterval(() => {
        remainingSeconds--;
        updateHostTimer(remainingSeconds);
        if (remainingSeconds <= 0) {
            clearInterval(hostTimerInterval);
            hostTimerInterval = null;
            CONFIG_UTILS.setText('hostTimer', "Time's up!");
        }
    }, 1000);
}
function updateHostTimer(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    CONFIG_UTILS.setText('hostTimer', `${minutes}:${secs.toString().padStart(2, '0')}`);
}

export function getCurrentQuestionOptions() {
    const option1Label = CONFIG_UTILS.getElement('option1Label');
    const option2Label = CONFIG_UTILS.getElement('option2Label');
    if (option1Label && option2Label) return [{ text: option1Label.textContent, value: 'option1' }, { text: option2Label.textContent, value: 'option2' }];
    return [];
}
