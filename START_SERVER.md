# 🚀 How to Start the Development Server

## Quick Start

1. **Open PowerShell** (as Administrator if possible)

2. **Navigate to project folder**:
   ```powershell
   cd "d:\Grimguff tracker app\claimwise-omniscience"
   ```

3. **Start the server**:
   ```powershell
   npm start
   ```

4. **Wait for compilation** - You'll see:
   ```
   Compiled successfully!
   ```

5. **Access from phone**: `http://192.168.1.89:3000`

## If Connection Refused Error

### Fix 1: Check if Server is Running
- Look for a terminal window showing "Compiled successfully!"
- If not running, start it with `npm start`

### Fix 2: Allow Through Firewall
When you run `npm start`, Windows will ask to allow Node.js through firewall:
- **Click "Allow access"** when prompted
- Or manually: Windows Security → Firewall → Allow an app → Node.js

### Fix 3: Check Port 3000
If port 3000 is blocked, use a different port:
```powershell
$env:PORT=8080; npm start
```
Then use: `http://192.168.1.89:8080`

### Fix 4: Verify IP Address
```powershell
ipconfig
```
Look for "IPv4 Address" - should be `192.168.1.89`

### Fix 5: Check Wi-Fi
- Both phone and computer must be on **same Wi-Fi network**
- Check phone's Wi-Fi settings

## Troubleshooting

**Still can't connect?**
1. Temporarily disable Windows Firewall to test
2. Make sure no antivirus is blocking Node.js
3. Try accessing from computer first: `http://localhost:3000`
4. If localhost works but IP doesn't, it's a firewall issue

---

**Once server is running**, you'll see the app at `http://192.168.1.89:3000` on your phone! 📱
