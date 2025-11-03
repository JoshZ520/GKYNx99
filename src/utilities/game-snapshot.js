// game-snapshot.js - Simple game state persistence
// Saves and loads game snapshots for continuing interrupted games

class GameSnapshot {
    constructor() {
        this.STORAGE_KEY = 'tabletalksnapshot';
    }

    // === SNAPSHOT CREATION ===
    createSnapshot() {
        // Get current question index from DOM
        const questionElement = document.getElementById('question');
        const currentQuestionIndex = questionElement ? 
            parseInt(questionElement.getAttribute('data-index')) || 0 : 0;

        // Get current question text
        const currentQuestionText = questionElement ? 
            questionElement.textContent.trim() : '';

        const snapshot = {
            // Game state
            playerNames: window.gamePlayer ? window.gamePlayer.getPlayerNames() : [],
            submissionsByQuestion: window.gamePlayer ? window.gamePlayer.getSubmissionsByQuestion() : {},
            currentPlayerIndex: window.gamePlayer ? window.gamePlayer.getCurrentPlayerIndex() : 0,
            currentTopic: window.currentTopic || localStorage.getItem('currentTopic') || 'default',
            
            // Question state
            currentQuestionIndex: currentQuestionIndex,
            currentQuestionText: currentQuestionText,
            
            // Metadata
            gameMode: 'offline', // Only supporting offline for now
            timestamp: Date.now(),
            version: '1.0'
        };

        return snapshot;
    }

    // === SNAPSHOT PERSISTENCE ===
    saveSnapshot() {
        try {
            const snapshot = this.createSnapshot();
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(snapshot));
            console.log('Game snapshot saved successfully');
            return true;
        } catch (error) {
            console.error('Failed to save game snapshot:', error);
            return false;
        }
    }

    // === SNAPSHOT LOADING ===
    hasSnapshot() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored !== null;
    }

    loadSnapshot() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (!stored) {
                return null;
            }

            const snapshot = JSON.parse(stored);
            
            // Basic validation
            if (!this.validateSnapshot(snapshot)) {
                console.warn('Invalid snapshot data, removing...');
                this.clearSnapshot();
                return null;
            }

            return snapshot;
        } catch (error) {
            console.error('Failed to load game snapshot:', error);
            this.clearSnapshot(); // Clear corrupted data
            return null;
        }
    }

    // === SNAPSHOT RESTORATION ===
    restoreGameState(snapshot) {
        try {
            // Restore game state through proper module interfaces
            if (window.gamePlayer) {
                window.gamePlayer.setPlayerNames(snapshot.playerNames || []);
                window.gamePlayer.setCurrentPlayerIndex(snapshot.currentPlayerIndex || 0);
            }
            
            // Restore global game variables for modules that still use them
            window.submissionsByQuestion = snapshot.submissionsByQuestion || {};
            window.currentTopic = snapshot.currentTopic || 'default';

            // Restore session storage for game page
            sessionStorage.setItem('playerNames', JSON.stringify(snapshot.playerNames));
            sessionStorage.setItem('submissionsByQuestion', JSON.stringify(snapshot.submissionsByQuestion));
            sessionStorage.setItem('gameMode', 'offline');
            sessionStorage.setItem('offlineMode', 'true');
            
            // Restore topic in localStorage
            localStorage.setItem('currentTopic', snapshot.currentTopic);

            console.log('Game state restored from snapshot');
            return true;
        } catch (error) {
            console.error('Failed to restore game state:', error);
            return false;
        }
    }

    // === SNAPSHOT MANAGEMENT ===
    clearSnapshot() {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('Game snapshot cleared');
    }

    getSnapshotInfo() {
        const snapshot = this.loadSnapshot();
        if (!snapshot) {
            return null;
        }

        const date = new Date(snapshot.timestamp);
        const totalAnswers = Object.keys(snapshot.submissionsByQuestion).length;
        
        return {
            playerCount: snapshot.playerNames.length,
            totalAnswers: totalAnswers,
            currentPlayer: snapshot.playerNames[snapshot.currentPlayerIndex],
            topic: snapshot.currentTopic,
            lastSaved: date.toLocaleString(),
            timestamp: snapshot.timestamp
        };
    }

    // === VALIDATION ===
    validateSnapshot(snapshot) {
        return snapshot &&
               typeof snapshot.timestamp === 'number' &&
               Array.isArray(snapshot.playerNames) &&
               typeof snapshot.submissionsByQuestion === 'object' &&
               typeof snapshot.currentPlayerIndex === 'number' &&
               snapshot.gameMode === 'offline';
    }
}

// === AUTO-SAVE FUNCTIONALITY ===
function setupAutoSave() {
    // Save snapshot when user leaves the page
    window.addEventListener('beforeunload', () => {
        // Only save if we're on the game page and in offline mode
        const isGamePage = window.location.pathname.includes('game.html');
        const isOfflineMode = sessionStorage.getItem('offlineMode') === 'true';
        
        if (isGamePage && isOfflineMode && window.gameSnapshot) {
            window.gameSnapshot.saveSnapshot();
        }
    });
}

// === GLOBAL INITIALIZATION ===
// Create global instance
window.gameSnapshot = new GameSnapshot();

// Set up auto-save when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupAutoSave);
} else {
    setupAutoSave();
}

// Export for manual use
window.GameSnapshot = GameSnapshot;