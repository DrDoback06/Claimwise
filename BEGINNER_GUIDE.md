# Claimwise Omniscience - Complete Beginner's Guide

## 🎯 What You Need First

### Step 1: Install Node.js (If You Don't Have It)

1. **Check if you have Node.js:**
   - Open Command Prompt or PowerShell
   - Type: `node --version`
   - If you see a version number (like v18.0.0), you're good! Skip to Step 2.
   - If you see an error, continue below.

2. **Download Node.js:**
   - Go to: https://nodejs.org/
   - Download the **LTS version** (recommended)
   - Run the installer
   - **Important:** Check the box that says "Automatically install necessary tools"
   - Click "Install"
   - Restart your computer after installation

3. **Verify Installation:**
   - Open a NEW Command Prompt/PowerShell window
   - Type: `node --version` (should show a version)
   - Type: `npm --version` (should show a version)
   - If both work, you're ready!

---

## 🚀 Getting the App Running

### Step 2: Open the Project Folder

1. **Open File Explorer**
2. Navigate to: `D:\Grimguff tracker app\claimwise-omniscience`
3. **Right-click** in the folder
4. Select **"Open in Terminal"** or **"Open PowerShell window here"**

### Step 3: Install All Required Packages

In the terminal window that just opened, type this command and press Enter:

```bash
npm install
```

**What this does:** Downloads all the code libraries the app needs to run.

**Wait for it to finish** - This might take 2-5 minutes. You'll see lots of text scrolling by. When it's done, you'll see something like "added 1323 packages".

**If you see errors:**
- Make sure you're in the correct folder (`claimwise-omniscience`)
- Try: `npm cache clean --force` then `npm install` again

### Step 4: Start the App

Once `npm install` is finished, type:

```bash
npm start
```

**What happens:**
- The app will start compiling (this takes 30-60 seconds the first time)
- Your web browser should automatically open to `http://localhost:3000`
- You'll see the Claimwise Omniscience app!

**If the browser doesn't open automatically:**
- Manually go to: `http://localhost:3000` in your browser

---

## 🎨 Using the App for the First Time

### Step 5: First Look at the App

When the app opens, you'll see:

1. **Top Bar:** "CLAIMWISE OMNISCIENCE" with version number
2. **Left Sidebar:** Navigation menu with different sections
3. **Main Area:** The content of whatever section you're viewing

### Step 6: Set Up API Keys (Important!)

Before using AI features, you need to add your API keys:

1. **Scroll down** in the left sidebar
2. Click on **"Settings"** (gear icon at the bottom)
3. You'll see three sections for API keys:
   - **Gemini API Key** (Google)
   - **OpenAI API Key** (ChatGPT)
   - **Anthropic API Key** (Claude)

4. **For each API key you want to use:**
   - Click the eye icon to show/hide the key
   - Paste your API key
   - Click **"SAVE"**
   - You'll see a confirmation message

**Note:** You only need ONE API key to use AI features, but you can add all three if you have them.

**Where to get API keys:**
- **Gemini:** https://makersuite.google.com/app/apikey
- **OpenAI:** https://platform.openai.com/api-keys
- **Anthropic:** https://console.anthropic.com/

### Step 7: Explore the App

#### A. Personnel Tab (Managing Characters)

1. Click **"Personnel"** in the left sidebar
2. You'll see a list of characters on the left
3. Click on a character to see their details:
   - **Stats:** Use sliders to adjust
   - **Skills:** Add/remove skills
   - **Inventory:** Add/remove items
4. **Save Snapshots:**
   - Select a Book and Chapter from the dropdowns at the top
   - Click **"SAVE SNAPSHOT"** to save the character's state for that chapter

#### B. Item Vault (Creating Items)

1. Click **"Item Vault"** in the sidebar
2. Click **"CREATE NEW"** button
3. Choose how to create:
   - **Procedural Sliders:** Adjust sliders to generate random items
   - **Manual Config:** Fill in all details yourself
   - **AI Generation:** Describe what you want, AI creates it
4. Fill in the details and click **"SAVE TO ITEM VAULT"**

#### C. Skill Tree (Creating Skills)

1. Click **"Skill Tree"** in the sidebar
2. Click **"CREATE NEW"**
3. Similar to items - choose your creation method
4. Configure the skill and save

#### D. Writer's Room (Writing Chapters)

1. Click **"Writer's Room"** in the sidebar
2. **Basic Mode:**
   - Select Book and Chapter
   - Choose Active Cast (characters)
   - Add a note
   - Click **"GENERATE"**
3. **Enhanced Mode:**
   - Click **"ENHANCED WRITER'S ROOM"** button
   - More advanced features with chapter selection

#### E. Series Bible (Managing Books)

1. Click **"Series Bible"** in the sidebar
2. See all your books and chapters
3. Click on a book to expand it
4. Click on a chapter to see/edit it
5. Use **"ADD BOOK"** or **"+ ADD CHAPTER"** to create new ones

---

## 📝 Common Tasks - Step by Step

### Task 1: Create a New Character

1. Go to **Personnel** tab
2. Click **"ADD ACTOR"** button
3. Fill in:
   - Name
   - Class (Protagonist, Ally, NPC, Threat)
   - Role (e.g., "The Fallen Knight")
   - Description
4. Click **"SAVE"**
5. The character appears in your list!

### Task 2: Add an Item to a Character

1. Go to **Personnel** tab
2. Select a character
3. In the **Inventory** section, click the **"+"** button
4. A window opens showing all available items
5. Search or browse, then click an item to add it
6. The item is added and stats update automatically!

### Task 3: Save a Character Snapshot

1. Go to **Personnel** tab
2. Select a character
3. Adjust their stats/skills/items as needed
4. At the top, select:
   - **Book:** Choose which book
   - **Chapter:** Choose which chapter
5. Click **"SAVE SNAPSHOT"** button
6. You'll see a confirmation message
7. The character's state is now saved for that specific chapter!

### Task 4: Parse Manuscript Text (Auto-Update Characters)

1. Go to **Writer's Room** tab
2. Click **"PARSE MANUSCRIPT"** button
3. A window opens with two panels:
   - **Left:** Paste your chapter text here
   - **Right:** Shows detected changes
4. Paste your manuscript text in the left panel
5. Click **"PARSE MANUSCRIPT"** button
6. Review the detected changes:
   - Check confidence scores (green = high, yellow = medium, red = low)
   - Edit any changes if needed
   - Check/uncheck which changes to apply
7. Click **"APPLY SELECTED UPDATES"**
8. Characters are automatically updated!

### Task 5: Create an Item with AI

1. Go to **Item Vault** tab
2. Click **"CREATE NEW"**
3. Click the **"AI GENERATION"** tab at the top
4. In the prompt box, describe your item, for example:
   ```
   A cursed clipboard that grants bureaucratic powers but drains sanity
   ```
5. Select the **Rarity** (Common, Uncommon, Rare, Epic, Legendary)
6. Click **"GENERATE WITH AI"**
7. Wait a few seconds - AI creates the item!
8. Review and edit if needed
9. Click **"SAVE TO ITEM VAULT"**

---

## 🛠️ Troubleshooting

### Problem: "npm is not recognized"

**Solution:** Node.js isn't installed or not in your PATH
1. Install Node.js from https://nodejs.org/
2. Restart your computer
3. Open a NEW terminal window
4. Try again

### Problem: "Port 3000 is already in use"

**Solution:** Another app is using port 3000
1. Stop the server (Ctrl+C)
2. Find what's using port 3000 and close it
3. Or use a different port:
   ```bash
   set PORT=3001 && npm start
   ```

### Problem: App shows blank page or errors

**Solution:** 
1. Check the terminal for error messages
2. Stop the server (Ctrl+C)
3. Try: `npm cache clean --force`
4. Then: `npm install`
5. Then: `npm start`

### Problem: "Module not found" errors

**Solution:**
1. Stop the server (Ctrl+C)
2. Delete `node_modules` folder
3. Delete `package-lock.json` file
4. Run: `npm install`
5. Run: `npm start`

### Problem: Tailwind CSS errors

**Solution:** (Should be fixed, but if you see it)
1. Stop the server (Ctrl+C)
2. Run: `npm uninstall tailwindcss @tailwindcss/postcss`
3. Run: `npm install tailwindcss@3.4.1`
4. Run: `npm start`

---

## 🎓 Learning the Features

### Navigation Overview

The left sidebar has these sections (from top to bottom):

1. **Personnel** 👥 - Manage characters/actors
2. **Stat Registry** 📊 - Define what stats exist
3. **Skill Tree** ⚡ - Create and manage skills
4. **Item Vault** 💼 - Create and manage items
5. **Writer's Room** ✍️ - Generate and write chapters
6. **Series Bible** 📖 - Manage books and chapters
7. **Skill Tree Visual** 🌳 - Visual skill tree editor
8. **Wiki Manager** 📚 - Auto-generated wiki entries
9. **Story Map** 🗺️ - Visual chapter connections
10. **Relationships** 🤝 - Track character relationships
11. **Version Control** 📜 - Compare character snapshots
12. **Search & Filter** 🔍 - Find anything quickly
13. **Backup Manager** 💾 - Save/restore your data
14. **Settings** ⚙️ - Configure the app

### Tips for Beginners

1. **Start Simple:** Begin with Personnel and Item Vault tabs
2. **Save Often:** Use snapshots to save character states
3. **Use AI Sparingly at First:** Get familiar with manual creation first
4. **Explore Gradually:** Don't try to learn everything at once
5. **Read Tooltips:** Hover over buttons to see what they do

---

## ✅ Quick Start Checklist

Follow these in order:

- [ ] Node.js installed and verified
- [ ] Opened terminal in project folder
- [ ] Ran `npm install` (completed successfully)
- [ ] Ran `npm start` (app opened in browser)
- [ ] Added at least one API key in Settings
- [ ] Explored Personnel tab
- [ ] Created one test item
- [ ] Saved one snapshot
- [ ] App is working! 🎉

---

## 🆘 Still Having Problems?

If you're still stuck:

1. **Check the terminal** - Error messages are usually there
2. **Take a screenshot** of any error messages
3. **Check these files:**
   - `HOW_TO_RUN.md` - More technical details
   - `RESTART_INSTRUCTIONS.md` - Troubleshooting steps

The app should work now! If you see specific errors, share them and I'll help fix them.

