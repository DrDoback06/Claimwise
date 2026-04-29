# 📱 How to Install Claimwise Omniscience on Your Phone

This guide will walk you through installing the app on your iPhone or Android device.

## 🚀 Quick Start (PWA - Easiest Method)

### For iPhone (iOS):

1. **Open Safari** (not Chrome - Safari is required for iOS PWA installation)
2. **Navigate to your app URL** (the web address where you've deployed the app)
   - If testing locally, you'll need to use your computer's IP address
   - Example: `http://192.168.1.100:3000` (replace with your actual IP)
3. **Tap the Share button** (square with arrow pointing up) at the bottom
4. **Scroll down and tap "Add to Home Screen"**
5. **Edit the name** if desired (default: "Claimwise Omniscience")
6. **Tap "Add"** in the top right
7. **Done!** The app icon will appear on your home screen

### For Android:

1. **Open Chrome** (or any Chromium-based browser)
2. **Navigate to your app URL**
3. **Look for the install prompt** at the bottom of the screen, OR:
   - Tap the **menu** (three dots) in the top right
   - Select **"Add to Home screen"** or **"Install app"**
4. **Tap "Install"** or **"Add"**
5. **Done!** The app icon will appear on your home screen

## 🔧 Local Development Setup (For Testing)

If you want to test on your phone before deploying:

### Step 1: Find Your Computer's IP Address

**Windows:**
```powershell
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually starts with 192.168.x.x)

**Mac/Linux:**
```bash
ifconfig | grep "inet "
```
Look for the address starting with 192.168.x.x

### Step 2: Start the Development Server

```bash
cd claimwise-omniscience
npm start
```

The app will start on `http://localhost:3000`

### Step 3: Access from Your Phone

1. Make sure your phone and computer are on the **same Wi-Fi network**
2. On your phone's browser, go to: `http://YOUR_IP_ADDRESS:3000`
   - Example: `http://192.168.1.100:3000`
3. The app should load on your phone!

### Step 4: Install as PWA

Follow the iOS or Android instructions above to add it to your home screen.

## 📦 Production Deployment

For a permanent installation, you'll need to deploy the app to a web server:

### Option 1: Free Hosting Services

**Netlify:**
1. Build the app: `npm run build`
2. Drag and drop the `build/` folder to [netlify.com/drop](https://app.netlify.com/drop)
3. Get your URL (e.g., `https://your-app.netlify.app`)
4. Follow PWA installation steps above

**Vercel:**
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel` in the project folder
3. Follow the prompts
4. Get your URL and install as PWA

**GitHub Pages:**
1. Build: `npm run build`
2. Push `build/` folder to a `gh-pages` branch
3. Enable GitHub Pages in repository settings
4. Access via `https://yourusername.github.io/repo-name`

### Option 2: Your Own Server

1. Build the app: `npm run build`
2. Upload the `build/` folder to your web server
3. Configure HTTPS (required for service workers)
4. Access via your domain
5. Install as PWA

## ✅ After Installation

Once installed:

- **The app works offline** (after first load)
- **Offline AI model** will download on first use (~300-400MB)
- **All your data** is stored locally on your device
- **No internet needed** after initial setup (except for AI API fallbacks)

## 🐛 Troubleshooting

### "Add to Home Screen" option not showing?

**iOS:**
- Make sure you're using Safari (not Chrome)
- The site must be served over HTTPS (or localhost for development)
- Try refreshing the page

**Android:**
- Make sure you're using Chrome or a Chromium-based browser
- The site must have a valid manifest.json
- Try the menu → "Add to Home screen" option

### App not loading on phone?

- Check that both devices are on the same Wi-Fi network
- Verify the IP address is correct
- Make sure the development server is running
- Check firewall settings on your computer

### Service Worker not working?

- The app must be served over HTTPS (or localhost)
- Clear browser cache and reload
- Check browser console for errors

### Offline AI not loading?

- Ensure you have enough storage space (~500MB free)
- Check browser console for errors
- Make sure WebAssembly is supported (all modern browsers)
- The model downloads on first use - be patient!

## 📝 Notes

- **PWA installation** is the easiest method - no app store needed!
- **Data persists** even if you close the app
- **Works offline** once installed
- **Free AI** (Groq, Hugging Face) used as fallback when offline AI unavailable
- **All features** work the same as desktop version

## 🎉 You're All Set!

Once installed, you can:
- Track your story elements on the go
- Extract entities from manuscripts
- Use AI features (offline or online)
- Access all your data anywhere

Enjoy your mobile story tracking app! 📚✨
