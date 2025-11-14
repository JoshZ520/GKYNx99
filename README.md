# Table Talk - Interactive Conversation Game
A web-based multiplayer conversation starter game that helps people get to know each other through preference-based questions and engaging discussions.
https://table-talk.onrender.com
## **Quick Start**
1. **Setup**: Enter 2-20 player names
2. **Play**: Choose topics, answer questions, take turns
3. **Discuss**: View results and spark conversations
4. **Save**: Resume games anytime with session management
## **Key Features**
- **Multi-player**: 2-20 players with turn management
- **12+ Topics**: Food, Travel, Tech, Fantasy, and more
- **Save & Resume**: Auto-save with manual save options
- **Responsive**: Works on desktop, tablet, and mobile
- **Visual**: Image-based preference selection
- **Themes**: Dynamic color schemes per topic
## **Getting Started**
### **Local Development**
```bash
# Clone or download the project
git clone [repository-url]
# Start local server (required for file loading)
python -m http.server 8000
# Open in browser
http://localhost:8000
```
### **No Installation Required**
- Works in any modern web browser
- No dependencies or build process
- Pure HTML, CSS, and JavaScript
## **Project Structure**
```
Table-Talk/
├── index.html              # Main setup page (host interface)
├── game.html               # Game interface (host controls)
├── player/                 # Mobile player interface
│   ├── index.html          # Player join/game page
│   ├── scripts/player.js   # Player-side functionality
│   └── stylesheets/        # Player-specific styles
├── scripts/                # Host-side JavaScript
│   ├── multiplayer-manager.js  # Multiplayer functionality
│   └── index.js            # Offline functionality
├── stylesheets/           # Shared CSS styling
├── server/                # Node.js Socket.IO server
├── fallback/              # Offline mode files
└── images/               # Visual assets
```

## **Multiplayer Architecture**

### **Host Interface** (`index.html`, `game.html`)
- Create room with 4-character codes
- Manage connected players
- Broadcast questions to all players
- View aggregated results

### **Player Interface** (`/player`)
- Mobile-optimized design
- Join rooms with room codes
- Receive questions in real-time
- Submit answers instantly

### **Server** (`server/`)
- Node.js + Socket.IO for real-time communication
- Room management and player tracking
- Question broadcasting and answer collection
- Automatic cleanup on disconnect

## **How to Play**
1. **Setup Phase**
   - Enter number of players (2-20)
   - Input all player names
   - Start the game
2. **Topic Selection**
   - Choose from available topics
   - Or click "Random" for surprise topics
   - Each topic has unique questions and colors
3. **Gameplay**
   - Players take turns answering questions
   - Choose between two preference options
   - Visual indicators show whose turn it is
4. **Results & Discussion**
   - View all answers organized by question
   - See how players' preferences compare
   - Use results to spark deeper conversations
## **Customization**
### **Add New Topics**
1. Create `files/topics/your-topic.json`
2. Add entry to `files/topics/index.json`
3. Optionally add images to `images/preferences/your-topic/`
### **Custom Colors**
- Edit `files/color-schemes.json`
- Create new themes or modify existing ones
- Automatically applied based on topic selection
## **Session Management**
- **Auto-Save**: Progress saved every 2 minutes
- **Manual Save**: Click save button anytime during gameplay
- **Resume Games**: Continue interrupted sessions from main menu
- **Session History**: View and manage multiple saved games
- **Smart Cleanup**: Automatically removes sessions older than 7 days
## **Deployment**
Works with any static file hosting:
- **GitHub Pages**: Enable in repository settings
- **Netlify**: Drag and drop deployment
- **Vercel**: Connect repository for auto-deployment
- **Traditional Hosting**: Upload files via FTP
**Requirements**: Web server (not file:// protocol) for JSON loading
## **Full Documentation**
For comprehensive documentation including:
- Technical architecture details
- API reference and customization guide
- Development guidelines and troubleshooting
- Deployment best practices
**→ [View Complete Documentation](DOCUMENTATION.md)**
## **Contributing**
1. Fork the repository
2. Create a feature branch
3. Test your changes thoroughly  
4. Submit a pull request
## **Support**
- Check browser console for error messages
- Ensure using proper web server (not file:// protocol)
- Verify all files are accessible
- Test with fresh browser session if issues persist
---
**Live Demo**: https://joshz520.github.io/GKYNx99
**Table Talk** - *Bringing people together through conversation*
[Documentation](DOCUMENTATION.md) • [Report Issues](https://github.com/JoshZ520/GKYNx99/issues)
