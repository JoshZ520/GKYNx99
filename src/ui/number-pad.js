// src/ui/number-pad.js - On-screen number pad component
// Provides touch-friendly numeric input for mobile devices

export class NumberPad {
    constructor(inputElement) {
        this.input = inputElement;
        this.isVisible = false;
        this.padElement = null;
        this.currentValue = '';
        
        this.init();
    }
    
    init() {
        // Create the number pad HTML
        this.createPadHTML();
        
        // Add event listeners
        this.attachEventListeners();
    }
    
    createPadHTML() {
        const padHTML = `
            <div class="number-pad" id="number-pad-${this.input.id}" style="display: none;">
                <div class="number-pad-grid">
                    <button type="button" class="number-pad-btn" data-value="1">1</button>
                    <button type="button" class="number-pad-btn" data-value="2">2</button>
                    <button type="button" class="number-pad-btn" data-value="3">3</button>
                    <button type="button" class="number-pad-btn" data-value="4">4</button>
                    <button type="button" class="number-pad-btn" data-value="5">5</button>
                    <button type="button" class="number-pad-btn" data-value="6">6</button>
                    <button type="button" class="number-pad-btn" data-value="7">7</button>
                    <button type="button" class="number-pad-btn" data-value="8">8</button>
                    <button type="button" class="number-pad-btn" data-value="9">9</button>
                    <button type="button" class="number-pad-btn number-pad-clear" data-action="clear">Clear</button>
                    <button type="button" class="number-pad-btn" data-value="0">0</button>
                    <button type="button" class="number-pad-btn number-pad-backspace" data-action="backspace">⌫</button>
                    <button type="button" class="number-pad-btn number-pad-confirm" data-action="confirm">✓ Confirm</button>
                </div>
            </div>
        `;
        
        // Insert after the input's parent container
        const container = this.input.closest('.number-input-group');
        if (container) {
            container.insertAdjacentHTML('afterend', padHTML);
            this.padElement = document.getElementById(`number-pad-${this.input.id}`);
        }
    }
    
    attachEventListeners() {
        if (!this.padElement) return;
        
        // Number and action buttons
        const buttons = this.padElement.querySelectorAll('.number-pad-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const value = btn.dataset.value;
                const action = btn.dataset.action;
                
                if (value) {
                    this.addDigit(value);
                } else if (action === 'backspace') {
                    this.backspace();
                } else if (action === 'clear') {
                    this.clear();
                } else if (action === 'confirm') {
                    this.confirm();
                }
            });
        });
        
        // Click outside to close
        document.addEventListener('click', (e) => {
            if (this.isVisible && 
                !this.padElement.contains(e.target) && 
                !e.target.classList.contains('number-pad-toggle')) {
                this.hide();
            }
        });
    }
    
    addDigit(digit) {
        // Limit to 3 digits (max 100)
        if (this.currentValue.length < 3) {
            this.currentValue += digit;
        }
    }
    
    backspace() {
        this.currentValue = this.currentValue.slice(0, -1);
    }
    
    clear() {
        this.currentValue = '';
    }
    
    confirm() {
        const value = parseInt(this.currentValue, 10);
        const min = parseInt(this.input.min, 10) || 1;
        const max = parseInt(this.input.max, 10) || 100;
        
        if (value >= min && value <= max) {
            this.input.value = value;
            // Trigger change event
            this.input.dispatchEvent(new Event('change', { bubbles: true }));
            this.hide();
        }
        // Ignore invalid values - just don't apply them
    }
    
    show() {
        if (this.padElement) {
            this.currentValue = this.input.value || '';
            this.padElement.style.display = 'block';
            this.isVisible = true;
        }
    }
    
    hide() {
        if (this.padElement) {
            this.padElement.style.display = 'none';
            this.isVisible = false;
        }
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}

// Export initialization function
export function initializeNumberPad(inputId) {
    const input = document.getElementById(inputId);
    if (input && input.type === 'number') {
        return new NumberPad(input);
    }
    return null;
}
