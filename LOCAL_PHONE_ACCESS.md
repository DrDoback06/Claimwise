# 📱 Access App on Phone Using Your IP

Your IP address: **192.168.1.89**

## Quick Steps:

### 1. Start the Development Server

Open PowerShell/Terminal and run:

```powershell
cd "d:\Grimguff tracker app\claimwise-omniscience"
npm start
```

Wait for it to say: "Compiled successfully!" and shows the local URL.

### 2. Make Sure Phone and Computer Are on Same Wi-Fi

- Both devices must be on the **same Wi-Fi network**
- Check your phone's Wi-Fi settings to confirm

### 3. Open on Your Phone

**On your phone's browser** (Safari for iPhone, Chrome for Android), go to:

```
http://192.168.1.89:3000
```

### 4. Install as PWA

Once the app loads on your phone:

**iPhone (Safari):**
1. Tap the Share button (square with arrow)
2. Scroll down → "Add to Home Screen"
3. Tap "Add"

**Android (Chrome):**
1. Tap menu (three dots)
2. "Add to Home screen" or "Install app"
3. Tap "Add" or "Install"

## Troubleshooting

### Can't connect?

1. **Check firewall** - Windows Firewall might be blocking port 3000
   - Go to Windows Security → Firewall
   - Allow Node.js through firewall

2. **Check IP address** - Make sure it's correct:
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" - should be 192.168.1.89

3. **Check Wi-Fi** - Both devices must be on same network

4. **Try disabling firewall temporarily** to test

### Port 3000 blocked?

If port 3000 doesn't work, you can change it:

```powershell
$env:PORT=8080; npm start
```

Then use: `http://192.168.1.89:8080`

## After Installing

- The app will work on your phone
- You can test all features
- Data is stored locally on your phone
- Works offline after first load

## For Production (Permanent URL)

When ready to deploy permanently, use:
- **Netlify Drop**: https://app.netlify.com/drop (drag `build` folder)
- See `QUICK_DEPLOY.md` for details

---

**Your local URL**: `http://192.168.1.89:3000` 📱
