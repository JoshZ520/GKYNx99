// Save selected player count to sessionStorage so the main page can enforce submission limits
window.addEventListener('DOMContentLoaded', function () {
    const select = document.getElementById('player_count');
    if (!select) return;

    // When the selection changes, store the value as an integer in sessionStorage
    select.addEventListener('change', function (e) {
        const val = parseInt(e.target.value, 10);
        if (!Number.isNaN(val) && val > 0) {
            sessionStorage.setItem('playerCount', String(val));
        } else {
            sessionStorage.removeItem('playerCount');
        }
    });

    // If the user navigates to this page and then back, pre-select the stored value
    const stored = parseInt(sessionStorage.getItem('playerCount'), 10);
    if (!Number.isNaN(stored) && stored > 0) {
        const opt = Array.from(select.options).find(o => parseInt(o.value, 10) === stored);
        if (opt) select.value = String(stored);
    }
});
