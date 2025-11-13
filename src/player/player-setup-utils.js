export function generatePlayerInputs(container, count, onInput) {
    container.innerHTML = '';
    for (let i = 1; i <= count; i++) {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-input-group';
        const label = document.createElement('label');
        label.textContent = `Player ${i}:`;
        label.htmlFor = `player_${i}`;
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `player_${i}`;
        input.name = `player_${i}`;
        input.placeholder = `Enter name for Player ${i}`;
        input.required = true;
        if (onInput) input.addEventListener('input', onInput);
        playerDiv.appendChild(label);
        playerDiv.appendChild(input);
        container.appendChild(playerDiv);
    }
}

export function validatePlayerNames(names) {
    const allFilled = names.every(name => name.trim() !== '');
    const uniqueNames = new Set(names.map(name => name.trim().toLowerCase()));
    const hasDuplicates = uniqueNames.size !== names.length;
    return { allFilled, hasDuplicates };
}

export function updateStartButtonState(startButton, names) {
    const { allFilled, hasDuplicates } = validatePlayerNames(names);
    if (!allFilled) {
        startButton.disabled = true;
        startButton.textContent = 'Fill all player names to start';
    } else if (hasDuplicates) {
        startButton.disabled = true;
        startButton.textContent = 'Player names must be unique';
    } else {
        startButton.disabled = false;
        startButton.textContent = 'Start Game';
    }
}
