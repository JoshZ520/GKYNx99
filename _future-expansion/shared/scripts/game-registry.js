// Game Registry - Central configuration for all games
const GAME_REGISTRY = {
    "table-talk": {
        name: "Table Talk",
        description: "Conversation starter with preference choices",
        icon: "💬",
        entryPoint: "/games/table-talk/index.html",
        multiplayer: true,
        minPlayers: 2,
        maxPlayers: 8,
        status: "available",
        version: "1.0.0"
    },
    "quick-draw": {
        name: "Quick Draw",
        description: "Drawing and guessing game",
        icon: "🎯",
        entryPoint: "/games/quick-draw/index.html",
        multiplayer: true,
        minPlayers: 3,
        maxPlayers: 10,
        status: "development",
        version: "0.1.0"
    },
    "mind-meld": {
        name: "Mind Meld",
        description: "Think alike challenge",
        icon: "🧠",
        entryPoint: "/games/mind-meld/index.html",
        multiplayer: true,
        minPlayers: 4,
        maxPlayers: 12,
        status: "planned",
        version: "0.0.1"
    },
    "beat-match": {
        name: "Beat Match",
        description: "Music trivia and rhythm",
        icon: "🎵",
        entryPoint: "/games/beat-match/index.html",
        multiplayer: true,
        minPlayers: 2,
        maxPlayers: 6,
        status: "planned",
        version: "0.0.1"
    }
};

// Game Management Functions
class GameManager {
    static getAvailableGames() {
        return Object.entries(GAME_REGISTRY)
            .filter(([id, game]) => game.status === 'available')
            .map(([id, game]) => ({id, ...game}));
    }
    
    static getGameById(gameId) {
        return GAME_REGISTRY[gameId];
    }
    
    static getAllGames() {
        return Object.entries(GAME_REGISTRY)
            .map(([id, game]) => ({id, ...game}));
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GAME_REGISTRY, GameManager };
}

// Make available globally in browser
window.GameManager = GameManager;
window.GAME_REGISTRY = GAME_REGISTRY;