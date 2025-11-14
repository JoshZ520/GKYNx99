# Development Guidelines

## Console Logging Policy

### **Keep These Logs Permanently**
- **Initialization**: Module setup and system initialization
- **Connections**: Event listener setup confirmations  
- **State Changes**: Important system state changes (topic changes, etc.)
- **Errors & Warnings**: Always log errors and warnings
- **Success/Completion**: Major process completion messages

### **Don't Keep These Logs**
- **User Actions**: Button clicks, selections, form submissions
- **Routine Operations**: Normal function executions
- **Debugging Output**: Temporary debug information
- **Verbose Details**: Step-by-step operation logs

###  **For Testing/Debugging**
1. Add `console.log()` statements temporarily
2. Use descriptive messages: `console.log('DEBUG: Checking player count:', players.length)`
3. **Remove before committing to repository**
4. Use browser debugger for complex debugging instead

### **Examples**

**Good (Keep):**
```javascript
console.log('Game Core event listeners setup complete!');
console.log('Switch question button connected');
console.error('Failed to load questions:', error);
```

**Bad (Remove):**
```javascript
console.log('User clicked next question');
console.log('Selected option 1');
console.log('Processing answer submission');
```

### **Cleanup Scripts**
- `node scripts/cleanup-emojis.js` - Remove emojis from code
- `node scripts/cleanup-verbose-logs.js` - Remove noisy console logs

## Code Quality
- No emojis in production code
- Meaningful variable and function names
- Clear comments for complex logic
- Consistent indentation and formatting