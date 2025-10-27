# Table Talk - Interactive Conversation Game

A web-based multiplayer conversation starter game that helps people get to know each other through preference-based questions and topic discussions.

## **Table of Contents**
- [Overview](#overview)
- [Features](#features)
- [File Structure](#file-structure)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Game Flow](#game-flow)
- [Technical Implementation](#technical-implementation)
- [Session Management](#session-management)
- [Customization](#customization)
- [Deployment](#deployment)

## **Overview**

Table Talk is a conversation game designed to help groups of 2-20 players get to know each other better. Players take turns answering preference-based questions from various topics, creating opportunities for meaningful discussions and connections.

### **Core Concept**
- Players choose between two options for each question
- Questions are organized by topics (food, travel, tech, etc.)
- Visual preference selection with engaging images
- Turn-based system ensures everyone participates
- Results are displayed for group discussion

## **Features**

### **Game Features**
- **Multi-player Support**: 2-20 players with dynamic name generation
- **Topic Variety**: 12+ categories (Food, Travel, Tech, Fantasy, etc.)
- **Visual Selection**: Image-based preference choices
- **Turn Management**: Automated player turn system with visual indicators
- **Question Switching**: Manual navigation through topic questions
- **Results Display**: Organized answer viewing for discussion

### **Session Management**
- **Auto-save**: Automatic progress saving every 2 minutes
- **Manual Save**: One-click save button during gameplay
- **Resume Games**: Continue interrupted games from main menu
- **Session History**: View and manage multiple saved games
- **Progress Tracking**: Saves player answers, current question, and topic

### **Visual Features**
- **Dynamic Themes**: Color schemes that change with topics
- **Animations**: Flying shapes during turn transitions
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Visual Feedback**: Hover effects, selection highlights, and save confirmations

### **Technical Features**
- **Modular Architecture**: Separate files for each page plus shared utilities
- **Local Storage**: Client-side data persistence
- **Session Storage**: Current game state management
- **Error Handling**: Graceful degradation and fallbacks
- **Performance**: Optimized loading and caching

## **File Structure**

```
Table-Talk/
├── index.html              # Main landing/setup page
├── game.html               # Game play interface
├── display.html            # Results viewing page
├── README.md               # This documentation
├── CNAME                   # Domain configuration
│
├── scripts/                # JavaScript functionality
│   ├── shared.js           # Common utilities and data loading
│   ├── session-manager.js  # Save/load game sessions
│   ├── index.js           # Landing page functionality
│   ├── game.js            # Main game logic
│   └── display.js         # Results page functionality
│
├── stylesheets/           # CSS styling
│   ├── shared.css         # Common styles and animations
│   ├── index.css          # Landing page styles
│   ├── game.css           # Game interface styles
│   ├── display.css        # Results page styles
│   ├── options.css        # Preference selection styles
│   └── images.css         # Image-specific styling
│
├── files/                 # Game data and configuration
│   ├── color-schemes.json # Theme color definitions
│   └── topics/            # Question sets by category
│       ├── index.json     # Topic index and metadata
│       ├── default.json   # General questions
│       ├── food.json      # Food-related questions
│       ├── travel.json    # Travel questions
│       ├── tech.json      # Technology questions
│       └── [...].json     # Additional topic files
│
└── images/               # Visual assets
    ├── chevron-down.svg  # UI icons
    └── preferences/      # Question images by topic
        ├── food/        # Food preference images
        ├── travel/      # Travel images
        ├── tech/        # Technology images
        └── [...]/       # Other topic images
```

## **Architecture & Data Flow**

### **🔄 Data Flow**
1. **Setup** → Player configuration and topic selection
2. **Game Loop** → Question display → Player answers → Turn advancement
3. **Results** → Answer aggregation and display
4. **Session Management** → Save/restore game state throughout

### **📦 Module Structure**

#### **🌐 Shared Module (`shared.js`)**
- **Data Loading**: Fetches topics and color schemes from JSON files
- **Theme System**: Applies dynamic color schemes based on topics
- **Utilities**: Common functions used across all pages
- **Global State**: Manages current topic and loaded data

#### **Session Manager (`session-manager.js`)**
- **Session Creation**: Generates unique session IDs
- **Data Persistence**: Saves/loads complete game state
- **Auto-save**: Periodic automatic saving
- **Session Cleanup**: Removes old sessions automatically

#### **🏠 Index Module (`index.js`)**
- **Player Setup**: Dynamic player name input generation
- **Validation**: Ensures proper player configuration
- **Resume UI**: Lists and manages saved game sessions
- **Navigation**: Handles game start and session loading

#### **Game Module (`game.js`)**
- **Question Management**: Displays and switches questions
- **Player Turns**: Manages turn-based progression
- **Answer Handling**: Processes and stores player responses
- **Topic System**: Handles topic selection and switching
- **UI Updates**: Real-time interface updates

#### **Display Module (`display.js`)**
- **Results Processing**: Organizes answers by question
- **Data Presentation**: Creates readable answer displays
- **Navigation**: Handles result browsing and home return

## **Getting Started**

### **Prerequisites**
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (for file loading) or web hosting
- No additional dependencies required

### **Setup**
1. **Download/Clone** the project files
2. **Start Local Server**:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```
3. **Open Browser** → Navigate to `http://localhost:8000`

### **Quick Start**
1. Enter number of players (2-20)
2. Input player names
3. Click "Start Game"
4. Select a topic or use "Random"
5. Players take turns answering questions
6. View results when ready

## 🎲 **Game Flow**

### **Phase 1: Setup**
```
Landing Page → Player Count → Player Names → Start Game
```
- Players configure group size and participant names
- Option to resume previous games if available
- Validation ensures proper setup before proceeding

### **Phase 2: Topic Selection**
```
Game Page → Topic Choice → Question Loading → Color Theme Applied
```
- Choose from 12+ available topics or random selection
- Each topic has its own color scheme and question set
- Questions include both text and visual elements

### **Phase 3: Gameplay**
```
Question Display → Player Turn → Answer Selection → Next Player → Repeat
```
- Clear turn indicators show current player
- Visual preference selection with engaging images
- Automatic turn advancement with animations
- Manual question switching available

### **Phase 4: Results**
```
All Answers → Final Submit → Results Page → Discussion
```
- Organized display of all answers by question
- Grouped by question for easy discussion
- Navigation between multiple questions

## **Technical Implementation**

### **Styling Architecture**
- **CSS Variables**: Consistent theming across components
- **Modular CSS**: Page-specific stylesheets with shared base
- **Responsive Design**: Mobile-first with desktop enhancements
- **Animations**: Smooth transitions and turn change effects

### **Data Management**
- **localStorage**: Persistent topic preferences and session data
- **sessionStorage**: Current game state and temporary data
- **JSON Files**: Static question content and configuration
- **Dynamic Loading**: Async loading of topic data

### **🔄 State Management**
```javascript
// Current Game State
{
  sessionId: "unique_session_id",
  playerCount: 4,
  playerNames: ["Alice", "Bob", "Charlie", "Diana"],
  currentTopic: "food",
  currentQuestionIndex: 2,
  currentPlayerIndex: 1,
  chronologicalSubmissions: [...answers...]
}
```

### **📡 Event System**
- **DOM Events**: User interactions and form submissions
- **Custom Events**: Turn changes and state updates
- **Async Operations**: Data loading and saving operations
- **Error Handling**: Graceful degradation for failed operations

## **Session Management**

### **🔐 Session Structure**
Each game session contains:
- **Metadata**: Creation time, last updated, session ID
- **Players**: Count, names, current turn
- **Progress**: Topic, question index, all submitted answers
- **State**: Current game phase and UI state

### **💿 Storage Strategy**
- **Local Storage**: Permanent session history across browser restarts
- **Session Storage**: Current active game data (cleared on tab close)
- **Automatic Cleanup**: Removes sessions older than 7 days
- **Compression**: Efficient JSON storage of game state

### **🔄 Auto-Save Features**
- **Periodic Saving**: Every 2 minutes during active gameplay
- **Event-Based Saving**: After answers, topic changes, question switches
- **Manual Saving**: User-triggered save with visual feedback
- **Resume Capability**: Full state restoration from any save point

## **Customization**

### **🎭 Adding New Topics**

1. **Create Topic File** (`files/topics/new-topic.json`):
```json
{
  "questions": [
    {
      "prompt": "Your question here?",
      "option1": "First Option",
      "option2": "Second Option"
    }
  ]
}
```

2. **Update Topic Index** (`files/topics/index.json`):
```json
{
  "new-topic": {
    "colorScheme": "light",
    "file": "new-topic.json"
  }
}
```

3. **Add Images** (optional):
- Create `images/preferences/new-topic/` folder
- Add images matching option names

### **Custom Color Schemes**

Add to `files/color-schemes.json`:
```json
{
  "custom-theme": {
    "background": "#f0f0f0",
    "headerBackground": "#ffffff",
    "textColor": "#333333",
    "primaryButton": "#007bff"
  }
}
```

### **Configuration Options**
- **Player Limits**: Modify min/max in `index.js`
- **Auto-Save Interval**: Change timeout in `game.js`
- **Session Cleanup**: Adjust age limit in `session-manager.js`
- **Animation Speed**: Modify CSS animation durations

## 🌐 **Deployment**

### **📤 Static Hosting**
Works with any static file host:
- **GitHub Pages**: Push to repository with GitHub Pages enabled
- **Netlify**: Drag and drop deployment
- **Vercel**: Connect repository for automatic deployments
- **Traditional Web Hosting**: Upload files via FTP

### **Server Requirements**
- **Web Server**: Any server capable of serving static files
- **HTTPS**: Recommended for modern browser features
- **CORS**: Ensure JSON files are accessible
- **Caching**: Configure appropriate cache headers

### **Production Checklist**
- [ ] Update `CNAME` file with your domain
- [ ] Test all topics load correctly
- [ ] Verify session management works
- [ ] Check responsive design on mobile
- [ ] Validate accessibility features
- [ ] Test with multiple browsers

## **Development Guide**

### **🔄 Making Changes**
1. **Test Locally**: Always test changes with a local server
2. **Validate JSON**: Ensure all JSON files are properly formatted
3. **Check Console**: Monitor browser console for errors
4. **Cross-Browser**: Test in multiple browsers
5. **Mobile Test**: Verify mobile responsiveness

### **🐛 Common Issues**
- **CORS Errors**: Use proper local server, not file:// protocol
- **Session Not Saving**: Check browser storage permissions
- **Images Not Loading**: Verify file paths and extensions
- **Topic Not Loading**: Validate JSON syntax in topic files

### **Performance Optimization**
- **Image Optimization**: Compress images for faster loading
- **JSON Minification**: Remove unnecessary whitespace from data files
- **CSS Optimization**: Combine and minify stylesheets for production
- **Caching Strategy**: Set appropriate cache headers for static assets

## **JavaScript API Reference**

### **Core Functions**

#### **Session Management**
```javascript
// Create new session
gameSessionManager.createNewSession()

// Save current progress
gameSessionManager.saveCurrentSession()

// Load existing session
gameSessionManager.loadSession(sessionId)

// List all sessions
gameSessionManager.listAvailableSessions()
```

#### **Topic Management**
```javascript
// Load all topics and color schemes
loadQuestions()

// Apply specific topic
setTopic(topicName)

// Get available topics
window.getTopics()
```

#### **Game Control**
```javascript
// Switch to next question
switchToNextQuestion()

// Submit player answer
submitAnswer()

// Update UI state
updateSubmissionState()
```

---

## 📝 **Version History**

### **Current Version: 3.0**
- ✅ Modular architecture with separate page scripts
- ✅ Comprehensive session management system
- ✅ Enhanced visual design with animations
- ✅ Resume game functionality
- ✅ Manual save capabilities
- ✅ Responsive mobile design
- ✅ Topic-based color themes

### **Previous Versions**
- **v2.0**: Added topic system and visual preferences
- **v1.0**: Basic question and answer functionality

---

## 🤝 **Contributing**

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Test your changes thoroughly
4. Submit a pull request with clear description

## 📞 **Support**

For questions or issues:
- Check the browser console for error messages
- Verify all files are properly uploaded/accessible
- Ensure you're using a proper web server (not file:// protocol)
- Test with a fresh browser session if session issues occur

---

*Table Talk - Bringing people together through conversation*