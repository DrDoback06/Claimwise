#!/bin/bash

# Mobile App Build Script
# Builds the web app and syncs to Capacitor platforms

set -e

echo "🚀 Building Claimwise Omniscience Mobile App..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Build React app
echo -e "${YELLOW}📦 Building React app...${NC}"
npm run build

if [ ! -d "build" ]; then
    echo "❌ Build failed - build/ directory not found"
    exit 1
fi

echo -e "${GREEN}✅ React app built successfully${NC}"

# Step 2: Sync to Capacitor
if [ -d "ios" ] || [ -d "android" ]; then
    echo -e "${YELLOW}🔄 Syncing to Capacitor platforms...${NC}"
    npx cap sync
    
    echo -e "${GREEN}✅ Capacitor sync complete${NC}"
    
    # Step 3: Open in IDE (optional)
    if [ "$1" == "--ios" ]; then
        echo -e "${YELLOW}🍎 Opening iOS project in Xcode...${NC}"
        npx cap open ios
    elif [ "$1" == "--android" ]; then
        echo -e "${YELLOW}🤖 Opening Android project in Android Studio...${NC}"
        npx cap open android
    fi
else
    echo -e "${YELLOW}ℹ️  Native platforms not initialized. Run:${NC}"
    echo "   npm run cap:add:ios     # For iOS"
    echo "   npm run cap:add:android # For Android"
fi

echo -e "${GREEN}✨ Build complete!${NC}"
echo ""
echo "Next steps:"
echo "  • PWA: Deploy build/ folder to web server"
echo "  • iOS: Open ios/ in Xcode and build"
echo "  • Android: Open android/ in Android Studio and build"
