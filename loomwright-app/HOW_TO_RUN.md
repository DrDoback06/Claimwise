# How to Open and Run Claimwise Omniscience

## Prerequisites

1. **Node.js** - Make sure you have Node.js installed (version 14 or higher)
   - Download from: https://nodejs.org/
   - To check if you have it: Open Command Prompt/PowerShell and type `node --version`

2. **npm** - Comes with Node.js
   - To check: Type `npm --version`

## Step-by-Step Instructions

### 1. Open Terminal/Command Prompt

- **Windows**: Press `Win + R`, type `cmd` or `powershell`, press Enter
- Or right-click in the `claimwise-omniscience` folder and select "Open in Terminal"

### 2. Navigate to the Project Folder

```bash
cd "D:\Grimguff tracker app\claimwise-omniscience"
```

### 3. Install Dependencies (First Time Only)

If you haven't installed dependencies yet, run:

```bash
npm install
```

This will install all required packages (React, Tailwind CSS, Lucide icons, etc.)

### 4. Start the Development Server

```bash
npm start
```

This will:
- Start the React development server
- Automatically open your browser to `http://localhost:3000`
- Show the app in your browser

### 5. Using the App

Once the browser opens:
- The app should load automatically
- If it doesn't, manually navigate to: `http://localhost:3000`
- You'll see the Claimwise Omniscience interface

## Troubleshooting

### If `npm start` doesn't work:

1. **Check Node.js is installed:**
   ```bash
   node --version
   ```
   If this doesn't work, install Node.js first.

2. **Reinstall dependencies:**
   ```bash
   npm install
   ```

3. **Clear cache and reinstall:**
   ```bash
   npm cache clean --force
   npm install
   ```

### If the app doesn't load:

1. Check the terminal for error messages
2. Make sure port 3000 isn't being used by another app
3. Try stopping the server (Ctrl+C) and restarting

### If you see import errors:

The components should all be in the correct location. If you see import errors, make sure all files are in:
- `claimwise-omniscience/src/src/components/`

## Quick Start Checklist

- [ ] Node.js installed
- [ ] Navigated to project folder
- [ ] Ran `npm install` (first time only)
- [ ] Ran `npm start`
- [ ] Browser opened to http://localhost:3000
- [ ] App is visible and working

## Next Steps After Opening

1. **Set up API keys** in Settings tab (bottom of navigation)
2. **Explore the Personnel tab** to see existing actors
3. **Try creating an item** in the Item Vault
4. **Save a snapshot** for an actor

## Stopping the Server

To stop the development server:
- Press `Ctrl + C` in the terminal
- Or close the terminal window

## Building for Production

If you want to create a production build:

```bash
npm run build
```

This creates an optimized build in the `build` folder that you can deploy.

