# Table Talk - Test Version 🧪

This is a **test environment** for demonstrating the enhanced Table Talk game with setup configuration features. This version is designed for team evaluation to decide which features to keep and implement in the main version.

## 🆕 New Features in This Test

### 1. **Setup Configuration System**
- **Configuration Questions**: 6 setup questions that customize game behavior
- **Answer Mapping**: Each setup answer maps to specific game configuration variables
- **Persistent Settings**: Game configuration is saved and applied throughout the session
- **Visual Feedback**: Players see immediate feedback when making setup choices

### 2. **Enhanced Timer System**
- **Optional Timers**: Can be enabled/disabled through setup configuration
- **Visual Timer Display**: Shows countdown with color-coded warnings
- **Progress Bar**: Visual representation of remaining time
- **Quick Response Mode**: Encourages faster thinking and spontaneous answers

### 3. **Improved User Interface**
- **Configuration Status Panel**: Shows active game settings
- **Instruction Panels**: Dynamic instructions based on current game state
- **Answer Statistics**: Real-time tracking of submission progress
- **Enhanced Navigation**: Better movement between questions and results

### 4. **Better Results Display**
- **Navigation Controls**: Previous/Next buttons to review all answered questions
- **Configuration Summary**: Shows what settings were used during the game
- **Enhanced Layout**: Better organization of player answers
- **Statistics Panel**: Game metrics and player information

## 📁 File Structure

```
test/
├── index.html          # Enhanced start page with feature highlights
├── game.html           # Main game with setup configuration system
├── display.html        # Enhanced results display with navigation
├── scripts/
│   ├── main.js         # Enhanced game logic with SETUP_CONFIG_MAP
│   ├── ui.js           # UI components with configuration support
│   └── display.js      # Display logic with navigation features
├── stylesheets/        # All CSS files with test enhancements
├── files/
│   └── questions.json  # Simplified question set (3 categories)
└── images/            # Essential image assets
```

## 🎮 How the Setup Configuration Works

### Configuration Mapping System
The game uses a `SETUP_CONFIG_MAP` object that maps setup question answers to game behavior variables:

```javascript
// Example configuration mapping
"Do you prefer quick rounds or detailed discussions?": {
    "Quick rounds": { timer: true, timeLimit: 30 },
    "Detailed discussions": { timer: false, encourageElaboration: true }
}
```

### Configuration Variables Available
- **Timer settings**: Enable/disable timers, set time limits
- **Difficulty levels**: Adjust question complexity
- **Theme preferences**: Visual styling options
- **Interaction modes**: Individual vs. group response styles
- **Content filtering**: Question category preferences
- **Feedback systems**: Response validation and encouragement

### Game Flow
1. **Setup Phase**: Players answer 6 configuration questions
2. **Configuration Application**: System applies settings based on answers
3. **Game Phase**: Regular gameplay with applied configurations
4. **Results Phase**: Enhanced display with configuration summary

## 🔧 Technical Enhancements

### JavaScript Improvements
- **Modular Architecture**: Clean separation of concerns
- **Configuration Management**: Persistent storage and retrieval
- **Enhanced Error Handling**: Better user feedback for issues
- **Performance Optimizations**: Faster loading and response times

### CSS Enhancements
- **Responsive Design**: Better mobile and tablet support
- **Animation System**: Smooth transitions and feedback
- **Theme Integration**: Consistent color schemes
- **Accessibility**: Improved contrast and readability

### Data Structure
- **Simplified Questions**: Focused on 3 categories for testing
- **Enhanced Metadata**: Additional question properties for configuration
- **Color Scheme Integration**: Theme data embedded in question structure

## 🚀 Getting Started

1. **Open `index.html`** to start the test game
2. **Select number of players** and click "Start Test Game"
3. **Complete setup questions** (these will configure the game)
4. **Play the game** and notice the applied configurations
5. **Review results** with enhanced display features

## 💭 For Team Evaluation

### Questions to Consider:
1. **Setup System**: Is the configuration system intuitive and valuable?
2. **Timer Feature**: Does the optional timer enhance or distract from gameplay?
3. **UI Enhancements**: Are the visual improvements worth the added complexity?
4. **Navigation**: Is the enhanced results display helpful?
5. **Performance**: Does the added functionality impact game flow?

### Decision Points:
- Which features should be kept in the main version?
- What modifications or simplifications are needed?
- Are there additional configuration options that would be valuable?
- How can we maintain simplicity while adding functionality?

## 📊 Test Data

This test version uses a simplified question set with:
- **Setup Category**: 6 configuration questions
- **Personal Category**: 8 sample questions  
- **Games Category**: 5 sample questions

The full version would include all original categories with enhanced configuration support.

---

**Note**: This is a demonstration version. All features are functional but may need refinement based on team feedback and user testing results.