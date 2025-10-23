# Table Talk Express Setup

## What We Just Created

### 1. **Express Server Structure**
- `server.js` - Main Express application
- `package.json` - Dependencies and scripts
- `views/` - EJS templates for dynamic pages
- Your existing `stylesheets/`, `scripts/`, `images/` stay the same

### 2. **New Page Flow**
```
/ (index) → /setup/1 → /setup/2 → ... → /setup/6 → /game → /display
```

### 3. **What's Different**
- **One setup page** that changes content dynamically
- **Server-side state management** (no more localStorage juggling)
- **Cleaner URLs** like `/setup/3` instead of complex parameters
- **Automatic progress tracking**

## How to Run It

### Step 1: Install Dependencies
```bash
cd "c:\Users\joshu\OneDrive\Desktop\Fall 2025\GKYNx99"
npm install
```

### Step 2: Start the Server
```bash
npm start
```

### Step 3: Visit Your Site
Open browser to: `http://localhost:3000`

## Key Benefits You Get

### 1. **Simpler Setup Flow**
- One `/setup/:step` route handles all setup questions
- Progress bar automatically updates
- Previous/Next navigation built in
- Configuration summary shows as you go

### 2. **Better State Management**
- Server remembers everything in `req.session`
- No more localStorage/sessionStorage confusion
- Automatic cleanup with restart button

### 3. **Dynamic Content**
- Questions come from your JSON file
- Easy to add/remove setup steps
- Templates reuse your existing CSS

### 4. **Same JavaScript Skills**
- Server-side JavaScript (Node.js) is very similar to client-side
- Your existing CSS and client-side JS mostly stays the same
- Gradual learning curve

## What You Need to Do Next

### Option A: Try It Out (Recommended)
1. Run `npm install` and `npm start`
2. See how the setup flow works
3. We can then create the game and display templates

### Option B: Keep Current System
If Express feels like too big a change right now, we can stick with your current approach and just add a separate `setup.html` page.

### Option C: Hybrid Approach
We can convert just the setup part to Express and keep game.html/display.html as static files for now.

What would you prefer to try first?

## Notes
- Your existing CSS files work exactly the same
- Most of your JavaScript logic can be reused
- The main change is moving from client-side routing to server-side routing
- Session management becomes much simpler