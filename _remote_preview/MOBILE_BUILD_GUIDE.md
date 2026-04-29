# Mobile App Build Guide

This guide explains how to build and deploy the Claimwise Omniscience app as a mobile app for iOS and Android.

## Prerequisites

### For PWA (Progressive Web App)
- Modern web browser (Chrome, Safari, Edge)
- HTTPS hosting (required for service workers)
- No additional tools needed

### For Native Apps (iOS/Android via Capacitor)
- Node.js 18+ and npm
- For iOS: macOS with Xcode 14+
- For Android: Android Studio with Android SDK
- Capacitor CLI (installed via npm)

## Installation

1. **Install dependencies:**
```bash
cd claimwise-omniscience
npm install
```

2. **Build the web app:**
```bash
npm run build
```

## PWA Installation (Easiest Method)

### For Users:
1. Open the app in a mobile browser (Chrome on Android, Safari on iOS)
2. Look for the "Add to Home Screen" prompt, or:
   - **Android (Chrome)**: Menu → "Add to Home Screen"
   - **iOS (Safari)**: Share button → "Add to Home Screen"
3. The app will install and work like a native app

### For Developers:
1. Build the app: `npm run build`
2. Deploy the `build/` folder to any web server with HTTPS
3. The service worker will automatically cache assets for offline use

## Native App Build (iOS)

### Initial Setup (One-time):
```bash
# Add iOS platform
npm run cap:add:ios

# This creates the ios/ folder
```

### Building:
```bash
# Build web app and sync to iOS
npm run cap:build:ios

# Or manually:
npm run build
npm run cap:sync
npm run cap:ios  # Opens Xcode
```

### In Xcode:
1. Select your development team
2. Choose a device or simulator
3. Click Run (▶️)
4. For App Store distribution, use Product → Archive

## Native App Build (Android)

### Initial Setup (One-time):
```bash
# Add Android platform
npm run cap:add:android

# This creates the android/ folder
```

### Building:
```bash
# Build web app and sync to Android
npm run cap:build:android

# Or manually:
npm run build
npm run cap:sync
npm run cap:android  # Opens Android Studio
```

### In Android Studio:
1. Wait for Gradle sync to complete
2. Select a device or emulator
3. Click Run (▶️)
4. For Play Store distribution, use Build → Generate Signed Bundle/APK

## Configuration

### App Details
Edit `capacitor.config.json` to change:
- `appId`: Your app bundle identifier (e.g., `com.yourcompany.omniscience`)
- `appName`: Display name shown on device
- `webDir`: Build output directory (default: `build`)

### Icons and Splash Screens
1. Place app icons in:
   - `ios/App/App/Assets.xcassets/AppIcon.appiconset/` (iOS)
   - `android/app/src/main/res/` (Android - multiple mipmap folders)

2. Recommended sizes:
   - iOS: 1024x1024 (App Store), various sizes for devices
   - Android: 512x512 (Play Store), various mipmap sizes

3. Use tools like:
   - [App Icon Generator](https://www.appicon.co/)
   - [Capacitor Assets](https://github.com/ionic-team/capacitor-assets)

## Offline AI Model

The app includes offline AI capabilities using Transformers.js. On first use:
1. The model (~300-400MB) will download automatically
2. This happens in the background
3. Once downloaded, AI works fully offline
4. Model is cached in browser storage

### Model Location
- Models are cached in browser IndexedDB
- Location varies by browser
- Can be cleared via browser settings

## Troubleshooting

### Service Worker Not Registering
- Ensure you're using HTTPS (or localhost for development)
- Check browser console for errors
- Clear browser cache and reload

### Capacitor Sync Issues
```bash
# Remove and re-add platforms
rm -rf ios android
npm run cap:add:ios
npm run cap:add:android
npm run cap:sync
```

### Build Errors
- Ensure `npm run build` completes successfully first
- Check that `build/` folder exists
- Verify Capacitor config in `capacitor.config.json`

### Offline AI Not Loading
- Check browser console for errors
- Ensure WebAssembly is supported (all modern browsers)
- Check available storage space (model is ~300-400MB)
- Try clearing browser cache and reloading

## Development Workflow

1. **Make code changes**
2. **Test in browser**: `npm start`
3. **Build**: `npm run build`
4. **Sync to native**: `npm run cap:sync`
5. **Test on device**: `npm run cap:ios` or `npm run cap:android`

## Distribution

### iOS App Store
1. Build in Xcode: Product → Archive
2. Upload via Xcode Organizer
3. Complete App Store Connect listing
4. Submit for review

### Google Play Store
1. Build signed APK/AAB in Android Studio
2. Upload to Google Play Console
3. Complete store listing
4. Submit for review

### PWA Distribution
- Deploy `build/` folder to any web server
- Ensure HTTPS is enabled
- Service worker will handle offline caching automatically

## Notes

- The app works as a PWA without any native build steps
- Native builds are optional for app store distribution
- Offline AI requires initial download but works without internet after
- All data is stored locally in IndexedDB
- Free AI APIs (Groq, Hugging Face) are used as fallback when offline AI unavailable
