// Dev tools visibility controller
// Shows dev-only UI elements when running in development environment

(function() {
    let isDevelopment = false;
    let fakePlayerSockets = [];
    
    fetch('/api/env')
        .then(res => res.json())
        .then(data => {
            isDevelopment = data.isDev;
            if (data.isDev) {
                const devTools = document.getElementById('devTools');
                if (devTools) {
                    devTools.classList.remove('hidden');
                    initializeDevTools(devTools);
                }
            }
        })
        .catch(err => console.log('Environment check failed:', err));
    
    function initializeDevTools(devToolsElement) {
        // Only add fake players button on game page (has roomCodeDisplay)
        if (document.getElementById('roomCodeDisplay')) {
            addFakePlayersButton(devToolsElement);
        }
    }
    
    function addFakePlayersButton(devToolsElement) {
        const button = document.createElement('button');
        button.textContent = '+ Add 1 Fake Player';
        button.className = 'dev-btn';
        button.style.cssText = `
            display: block;
            margin: 0.5rem auto 0;
            padding: 0.4rem 0.8rem;
            background: rgba(76, 175, 80, 0.2);
            color: #4CAF50;
            border: 1px solid #4CAF50;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85rem;
            transition: all 0.3s ease;
        `;
        
        button.onmouseover = () => button.style.background = 'rgba(76, 175, 80, 0.3)';
        button.onmouseout = () => button.style.background = 'rgba(76, 175, 80, 0.2)';
        button.onclick = () => addFakePlayers(1);
        
        devToolsElement.appendChild(button);
    }
    
    function addFakePlayers(count) {
        const roomCodeDisplay = document.getElementById('roomCodeDisplay');
        if (!roomCodeDisplay) return;
        
        const roomCode = roomCodeDisplay.textContent.trim();
        if (!roomCode || roomCode === '----') {
            alert('Please create a room first!');
            return;
        }
        
        const fakeNames = [
            'Alice Test', 'Bob Test', 'Charlie Test', 'Diana Test', 'Eve Test',
            'Frank Test', 'Grace Test', 'Henry Test', 'Iris Test', 'Jack Test'
        ];
        
        for (let i = 0; i < count; i++) {
            const playerName = fakeNames[fakePlayerSockets.length % fakeNames.length];
            createFakePlayer(roomCode, playerName);
        }
    }
    
    function createFakePlayer(roomCode, playerName) {
        // Check if Socket.io is available
        if (typeof io === 'undefined') {
            console.error('[DEV] Socket.io not loaded. Make sure you are in multiplayer mode.');
            alert('Socket.io not available. Please use multiplayer mode to add fake players.');
            return;
        }
        
        // Create a new Socket.io connection
        const fakeSocket = io();
        
        fakeSocket.on('connect', () => {
            console.log(`[DEV] Fake player ${playerName} connecting...`);
            
            // Join the room
            fakeSocket.emit('join-room', {
                roomCode: roomCode,
                playerName: playerName
            });
        });
        
        fakeSocket.on('joined-room', (data) => {
            console.log(`[DEV] Fake player ${playerName} joined room ${data.roomCode}`);
        });
        
        fakeSocket.on('join-error', (error) => {
            console.error(`[DEV] Fake player ${playerName} failed to join:`, error.message);
            fakeSocket.disconnect();
        });
        
        // Auto-answer questions
        fakeSocket.on('new-question', (data) => {
            console.log(`[DEV] Fake player ${playerName} received question`);
            
            setTimeout(() => {
                if (data.question.options?.length > 0) {
                    const randomIndex = Math.floor(Math.random() * data.question.options.length);
                    const selectedOption = data.question.options[randomIndex];
                    
                    fakeSocket.emit('submit-answer', {
                        roomCode,
                        answer: {
                            text: selectedOption.text || selectedOption,
                            value: selectedOption.value || selectedOption.text || selectedOption,
                            index: randomIndex
                        }
                    });
                    
                    console.log(`[DEV] Fake player ${playerName} submitted answer`);
                }
            }, 1000 + Math.random() * 2000);
        });
        
        fakeSocket.on('your-answer-revealed', (data) => {
            console.log(`[DEV] Fake player ${playerName} matched with: ${data.playerName}`);
        });
        
        fakeSocket.on('disconnect', () => {
            console.log(`[DEV] Fake player ${playerName} disconnected`);
            const index = fakePlayerSockets.indexOf(fakeSocket);
            if (index > -1) fakePlayerSockets.splice(index, 1);
        });
        
        fakePlayerSockets.push(fakeSocket);
    }
    
    // Clean up fake players on page unload
    window.addEventListener('beforeunload', () => {
        fakePlayerSockets.forEach(socket => {
            socket.disconnect();
        });
    });
})();
