# 📱 Serve Build Files Locally on Your Phone

This guide shows you how to serve the **production build** (the `build` folder) locally so you can access it from your phone.

## Quick Method (Using `serve` package) - RECOMMENDED

### Step 1: Install Dependencies (if not already done)

Open PowerShell and run:

```powershell
cd "d:\Grimguff tracker app\claimwise-omniscience"
npm install
```

This installs `serve` as a dev dependency (no need for global install).

### Step 2: Build the App (if not already built)

```powershell
npm run build
```

Wait for it to finish - you'll see "Compiled successfully!"

### Step 3: Serve the Build Folder

**Option A: Using npm script (easiest)**
```powershell
npm run serve
```

**Option B: Build and serve in one command**
```powershell
npm run serve:build
```

**Option C: Manual serve command**
```powershell
npx serve -s build -l 3000
```

This will:
- Serve the `build` folder
- Make it accessible on port 3000
- Show you the local and network URLs

You'll see something like:
```
   ┌─────────────────────────────────────────────────┐
   │                                                 │
   │   Serving!                                      │
   │                                                 │
   │   - Local:    http://localhost:3000            │
   │   - Network:  http://192.168.1.89:3000        │
   │                                                 │
   └─────────────────────────────────────────────────┘
```

### Step 4: Access from Your Phone

1. **Make sure your phone and computer are on the same Wi-Fi network**

2. **On your phone's browser**, go to:
   ```
   http://192.168.1.89:3000
   ```
   (Replace `192.168.1.89` with your actual IP if different)

3. **The app should load!** This is the production build with all optimizations.

### Step 5: Install as PWA on Phone

**iPhone (Safari):**
1. Tap the Share button (square with arrow)
2. Scroll down → "Add to Home Screen"
3. Tap "Add"

**Android (Chrome):**
1. Tap menu (three dots)
2. "Add to Home screen" or "Install app"
3. Tap "Add" or "Install"

## Alternative Method (Using Python - if you have it)

If you have Python installed, you can use its built-in server:

### Step 1: Build the App
```powershell
npm run build
```

### Step 2: Navigate to Build Folder
```powershell
cd build
```

### Step 3: Start Python Server
```powershell
# Python 3
python -m http.server 3000

# Or Python 2 (if you have it)
python -m SimpleHTTPServer 3000
```

### Step 4: Access from Phone
Same as above - use `http://192.168.1.89:3000`

## Alternative Method (Using Node.js `http-server`)

### Step 1: Install http-server
```powershell
npm install -g http-server
```

### Step 2: Build the App
```powershell
npm run build
```

### Step 3: Serve Build Folder
```powershell
cd build
http-server -p 3000 -a 0.0.0.0
```

The `-a 0.0.0.0` makes it accessible from your network (not just localhost).

### Step 4: Access from Phone
Use `http://192.168.1.89:3000` on your phone.

## Troubleshooting

### "Connection Refused" Error

1. **Check Firewall**: Windows Firewall might be blocking port 3000
   - When you run `serve` or `http-server`, Windows may ask to allow it
   - Click "Allow access"
   - Or manually: Windows Security → Firewall → Allow an app → Node.js

2. **Verify IP Address**:
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" - should be `192.168.1.89` (or similar)

3. **Check Wi-Fi**: Both devices must be on the same network

4. **Try Different Port**: If 3000 is blocked, use 8080:
   ```powershell
   serve -s build -l 8080
   ```
   Then use: `http://192.168.1.89:8080`

### Can't Install `serve`?

If `npm install -g serve` fails, try:
```powershell
npm install -g serve --force
```

Or use one of the alternative methods above (Python or http-server).

### Build Folder Not Found?

Make sure you've run:
```powershell
npm run build
```

The `build` folder should be in:
```
d:\Grimguff tracker app\claimwise-omniscience\build
```

## Differences: Development vs Production Build

**Development Server (`npm start`):**
- Hot reloading (auto-refreshes on changes)
- Slower, unoptimized
- Good for development
- URL: `http://192.168.1.89:3000`

**Production Build (`serve build`):**
- Optimized and minified
- Faster performance
- Production-ready
- Same URL: `http://192.168.1.89:3000`

Both work the same way for accessing from your phone!

## Keep Server Running

- **Keep the PowerShell window open** while using the app
- To stop the server, press `Ctrl+C` in the PowerShell window
- To restart, just run the serve command again

---

**Your local production URL**: `http://192.168.1.89:3000` 📱
