// session-manager.js - Game session persistence and management
// Handles saving/loading game sessions to localStorage with session IDs

// === SESSION MANAGEMENT ===
class GameSessionManager {
    constructor() {
        this.STORAGE_KEY = 'gameSessions';
        this.CURRENT_SESSION_KEY = 'currentSessionId';
    }

    // === SESSION CREATION ===
    createNewSession() {
        const sessionId = this.generateSessionId();
        const sessionData = {
            sessionId: sessionId,
            createdAt: new Date().toISOString(),
            playerCount: null,
            playerNames: [],
            currentTopic: 'default',
            currentQuestionIndex: 0,
            currentPlayerIndex: 0,
            chronologicalSubmissions: [],
            lastUpdated: new Date().toISOString()
        };

        // Set as current session in sessionStorage
        sessionStorage.setItem(this.CURRENT_SESSION_KEY, sessionId);
        
        // Save to localStorage
        this.saveSessionData(sessionId, sessionData);
        
        console.log(`Created new game session: ${sessionId}`);
        return sessionId;
    }

    // === SESSION PERSISTENCE ===
    saveCurrentSession() {
        const currentSessionId = this.getCurrentSessionId();
        if (!currentSessionId) {
            console.warn('No current session to save');
            return;
        }

        // Gather current game state from sessionStorage
        const sessionData = {
            sessionId: currentSessionId,
            createdAt: this.getSessionData(currentSessionId)?.createdAt || new Date().toISOString(),
            playerCount: parseInt(sessionStorage.getItem('playerCount')) || null,
            playerNames: JSON.parse(sessionStorage.getItem('playerNames')) || [],
            currentTopic: localStorage.getItem('currentTopic') || 'default',
            currentQuestionIndex: this.getCurrentQuestionIndex(),
            currentPlayerIndex: this.getCurrentPlayerIndex(),
            chronologicalSubmissions: JSON.parse(sessionStorage.getItem('chronologicalSubmissions')) || [],
            lastUpdated: new Date().toISOString()
        };

        this.saveSessionData(currentSessionId, sessionData);
        console.log(`Saved session: ${currentSessionId}`);
    }

    saveSessionData(sessionId, sessionData) {
        const allSessions = this.getAllSessions();
        allSessions[sessionId] = sessionData;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allSessions));
    }

    // === SESSION LOADING ===
    loadSession(sessionId) {
        const sessionData = this.getSessionData(sessionId);
        if (!sessionData) {
            console.error(`Session not found: ${sessionId}`);
            return false;
        }

        // Set as current session
        sessionStorage.setItem(this.CURRENT_SESSION_KEY, sessionId);

        // Load data into sessionStorage/localStorage
        if (sessionData.playerCount) {
            sessionStorage.setItem('playerCount', sessionData.playerCount.toString());
        }
        if (sessionData.playerNames && sessionData.playerNames.length > 0) {
            sessionStorage.setItem('playerNames', JSON.stringify(sessionData.playerNames));
        }
        if (sessionData.currentTopic) {
            localStorage.setItem('currentTopic', sessionData.currentTopic);
        }
        if (sessionData.chronologicalSubmissions) {
            sessionStorage.setItem('chronologicalSubmissions', JSON.stringify(sessionData.chronologicalSubmissions));
        }

        // Set current question and player indexes (these might need special handling depending on game structure)
        if (typeof sessionData.currentQuestionIndex !== 'undefined') {
            this.setCurrentQuestionIndex(sessionData.currentQuestionIndex);
        }
        if (typeof sessionData.currentPlayerIndex !== 'undefined') {
            this.setCurrentPlayerIndex(sessionData.currentPlayerIndex);
        }

        console.log(`Loaded session: ${sessionId}`);
        return true;
    }

    // === SESSION RETRIEVAL ===
    getCurrentSessionId() {
        return sessionStorage.getItem(this.CURRENT_SESSION_KEY);
    }

    getSessionData(sessionId) {
        const allSessions = this.getAllSessions();
        return allSessions[sessionId] || null;
    }

    getAllSessions() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    }

    listAvailableSessions() {
        const allSessions = this.getAllSessions();
        return Object.values(allSessions)
            .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)); // Most recent first
    }

    // === SESSION CLEANUP ===
    deleteSession(sessionId) {
        const allSessions = this.getAllSessions();
        if (allSessions[sessionId]) {
            delete allSessions[sessionId];
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allSessions));
            console.log(`Deleted session: ${sessionId}`);
            return true;
        }
        return false;
    }

    cleanupOldSessions(maxAge = 7 * 24 * 60 * 60 * 1000) { // Default: 7 days
        const allSessions = this.getAllSessions();
        const cutoffTime = new Date(Date.now() - maxAge);
        let cleaned = 0;

        Object.keys(allSessions).forEach(sessionId => {
            const session = allSessions[sessionId];
            if (new Date(session.lastUpdated) < cutoffTime) {
                delete allSessions[sessionId];
                cleaned++;
            }
        });

        if (cleaned > 0) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allSessions));
            console.log(`Cleaned up ${cleaned} old sessions`);
        }
        return cleaned;
    }

    // === UTILITIES ===
    generateSessionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `session_${timestamp}_${random}`;
    }

    getCurrentQuestionIndex() {
        const questionElem = document.getElementById('question');
        return questionElem ? parseInt(questionElem.getAttribute('data-index')) || 0 : 0;
    }

    setCurrentQuestionIndex(index) {
        const questionElem = document.getElementById('question');
        if (questionElem) {
            questionElem.setAttribute('data-index', index.toString());
        }
    }

    getCurrentPlayerIndex() {
        // This would need to be integrated with your current player system
        // For now, return 0 as a placeholder
        return 0;
    }

    setCurrentPlayerIndex(index) {
        // This would need to be integrated with your current player system
        // Placeholder for now
    }

    // === SESSION INFO ===
    getSessionSummary(sessionId) {
        const session = this.getSessionData(sessionId);
        if (!session) return null;

        const totalAnswers = session.chronologicalSubmissions ? session.chronologicalSubmissions.length : 0;
        const questionsAnswered = new Set(
            (session.chronologicalSubmissions || []).map(sub => sub.question)
        ).size;

        return {
            sessionId: session.sessionId,
            createdAt: session.createdAt,
            lastUpdated: session.lastUpdated,
            playerCount: session.playerCount,
            currentTopic: session.currentTopic,
            totalAnswers: totalAnswers,
            questionsAnswered: questionsAnswered,
            playerNames: session.playerNames || []
        };
    }

    // === AUTO-SAVE ===
    enableAutoSave(intervalMinutes = 2) {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        this.autoSaveInterval = setInterval(() => {
            if (this.getCurrentSessionId()) {
                this.saveCurrentSession();
            }
        }, intervalMinutes * 60 * 1000);

        console.log(`Auto-save enabled (every ${intervalMinutes} minutes)`);
    }

    disableAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
            console.log('Auto-save disabled');
        }
    }
}

// === GLOBAL INSTANCE ===
// Create a global instance that can be used across all pages
window.gameSessionManager = new GameSessionManager();

// === INITIALIZATION ===
// Auto-cleanup old sessions on load
window.addEventListener('DOMContentLoaded', () => {
    window.gameSessionManager.cleanupOldSessions();
});

// Save session when leaving the page
window.addEventListener('beforeunload', () => {
    if (window.gameSessionManager.getCurrentSessionId()) {
        window.gameSessionManager.saveCurrentSession();
    }
});

// === EXPORTS ===
// Make the class available for direct instantiation if needed
window.GameSessionManager = GameSessionManager;