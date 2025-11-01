// front-offline.js - Simple offline player setup
// Fallback version for when multiplayer is unavailable

console.log('🔄 Offline mode initialized');

// Simple player count handler
window.addEventListener('DOMContentLoaded', function () {
    const select = document.getElementById('player_count');
    if (!select) return;

    // When the selection changes, store the value
    select.addEventListener('change', function (e) {
        const val = parseInt(e.target.value, 10);
        if (!Number.isNaN(val) && val > 0) {
            sessionStorage.setItem('playerCount', String(val));
            sessionStorage.setItem('offlineMode', 'true');
            console.log(`🎮 Offline game set for ${val} players`);
        } else {
            sessionStorage.removeItem('playerCount');
            sessionStorage.removeItem('offlineMode');
        }
    });

    // Pre-select stored value if available
    const stored = parseInt(sessionStorage.getItem('playerCount'), 10);
    if (!Number.isNaN(stored) && stored > 0) {
        const opt = Array.from(select.options).find(o => parseInt(o.value, 10) === stored);
        if (opt) select.value = String(stored);
    }

    // Mark as offline mode
    sessionStorage.setItem('offlineMode', 'true');
    sessionStorage.removeItem('multiplayerMode');
});

console.log('📱 Fallback mode ready - single device gameplay');