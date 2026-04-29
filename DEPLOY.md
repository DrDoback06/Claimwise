# 🚀 Deployment Guide

Your app is ready to deploy! Here are the easiest options:

## Option 1: Netlify Drop (Easiest - No Account Needed)

1. **Build the app** (already done):
   ```bash
   npm run build
   ```

2. **Go to**: https://app.netlify.com/drop

3. **Drag and drop** the `build/` folder onto the page

4. **Get your URL** - Netlify will give you a URL like `https://random-name-123.netlify.app`

5. **Done!** Your app is live and can be installed on phones!

## Option 2: Netlify with Git (Recommended)

1. **Push your code to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Go to**: https://app.netlify.com

3. **Click "Add new site" → "Import an existing project"**

4. **Connect to GitHub** and select your repository

5. **Build settings** (auto-detected):
   - Build command: `npm run build`
   - Publish directory: `build`

6. **Click "Deploy site"**

7. **Your app will be live** at `https://your-app-name.netlify.app`

## Option 3: Vercel (Also Free)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   cd claimwise-omniscience
   vercel
   ```

3. **Follow the prompts** - it will ask:
   - Link to existing project? (No for first time)
   - Project name? (claimwise-omniscience)
   - Directory? (./build)

4. **Your app will be live** at `https://your-app-name.vercel.app`

## Option 4: GitHub Pages

1. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add to package.json scripts**:
   ```json
   "deploy": "npm run build && gh-pages -d build"
   ```

3. **Deploy**:
   ```bash
   npm run deploy
   ```

4. **Enable GitHub Pages** in repository settings → Pages
   - Source: `gh-pages` branch
   - Your app will be at: `https://yourusername.github.io/repo-name`

## After Deployment

Once deployed, you can:

1. **Share the URL** with anyone
2. **Install on phones** using the PWA installation guide
3. **Access from anywhere** - your app is on the internet!

## Custom Domain (Optional)

All services above allow you to add a custom domain:
- **Netlify**: Site settings → Domain management → Add custom domain
- **Vercel**: Project settings → Domains → Add domain
- **GitHub Pages**: Repository settings → Pages → Custom domain

## Important Notes

- **HTTPS is automatic** - all services provide free SSL certificates
- **Service workers work** - offline functionality will work
- **PWA installation works** - users can install on their phones
- **Free tier is generous** - enough for personal use

## Quick Deploy Command (Netlify CLI)

If you want to use Netlify CLI:

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=build
```

This will deploy directly from the build folder!
