export async function loadOfflineHtmlElements() {
    try {
        if (document.getElementById('offlinePlayerIndicator')) return;
        const res = await fetch('../offline/offline.html');
        const html = await res.text();
        const container = document.createElement('div');
        container.innerHTML = html;
        const main = document.querySelector('main');
        if (!main) return;
        Array.from(container.children).forEach(child => main.insertBefore(child, main.firstChild));
    } catch (err) { console.error('Failed to load offline HTML elements:', err); }
}

export async function loadOfflineIndexHtmlElements() {
    try {
        const res = await fetch('../offline/offline.html');
        const html = await res.text();
        const container = document.createElement('div');
        container.innerHTML = html;
        const offlineSetupSection = container.querySelector('#offline-setup-section');
        if (offlineSetupSection) {
            const main = document.querySelector('main') || document.body;
            main.insertBefore(offlineSetupSection, main.firstChild);
        }
    } catch (err) { console.error('Failed to load offline setup section:', err); }
}

export function initOfflineAutoLoad() {
    if (sessionStorage.getItem('gameMode') !== 'offline') return;
    window.addEventListener('DOMContentLoaded', () => {
        const path = window.location.pathname || '';
        if (path.includes('game.html')) loadOfflineHtmlElements();
        else if (path.includes('index.html')) loadOfflineIndexHtmlElements();
    });
}
