# 🚀 Vercel Deployment Guide

## ✅ What I Fixed

Your server was crashing on Vercel because it was configured as a traditional Node.js server. I've converted it to work with **Vercel Serverless Functions**.

### Changes Made:
1. ✅ Created `vercel.json` - Vercel configuration
2. ✅ Updated `server.js` - Export app for serverless
3. ✅ Created `.vercelignore` - Exclude unnecessary files

---

## 📋 Deployment Steps

### Step 1: Configure Environment Variables in Vercel

Before deploying, you MUST add these environment variables in your Vercel dashboard:

1. Go to your Vercel project
2. Click **Settings** → **Environment Variables**
3. Add ALL of these variables:

```
GOOGLE_API_KEY=your_google_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email
GOOGLE_PRIVATE_KEY=your_private_key_with_\n_preserved
FIRECRAWL_API_KEY=your_firecrawl_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

⚠️ **IMPORTANT for GOOGLE_PRIVATE_KEY:**
- Keep the `\n` characters in the private key
- In Vercel, paste it exactly as it appears in your `.env` file
- Example: `-----BEGIN PRIVATE KEY-----\nMIIEvQI...\n-----END PRIVATE KEY-----\n`

### Step 2: Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Option B: Using GitHub (Automatic)
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Vercel will auto-deploy

---

## 🔧 Testing Locally

Test before deploying:

```bash
# Set environment variable
$env:NODE_ENV="development"

# Run server
node server.js
```

Open: http://localhost:3000

---

## 🐛 Common Issues & Solutions

### Issue 1: 500 INTERNAL_SERVER_ERROR
**Cause:** Missing environment variables
**Solution:** Double-check all env vars in Vercel dashboard

### Issue 2: Google Sheets Authentication Failed
**Cause:** GOOGLE_PRIVATE_KEY formatting issue
**Solution:** 
- Make sure `\n` characters are preserved
- Try wrapping the key in quotes in Vercel
- Verify the service account has access to your sheet

### Issue 3: API Endpoints Not Working
**Cause:** Vercel routing issue
**Solution:** Already fixed in `vercel.json`

### Issue 4: Timeout Errors
**Cause:** Vercel free tier has 10-second timeout
**Solution:** 
- Use Vercel Pro for 60-second timeout
- Or reduce batch sizes in API calls

---

## 📝 Vercel Configuration Explained

### `vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",        // Entry point
      "use": "@vercel/node"       // Node.js runtime
    }
  ],
  "routes": [
    {
      "src": "/(.*)",             // All routes
      "dest": "server.js"         // Go to server.js
    }
  ]
}
```

### `server.js` Changes
```javascript
// Before (doesn't work on Vercel):
app.listen(3000, () => {...});

// After (works on Vercel):
if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => {...});  // Local only
}
module.exports = app;             // Export for Vercel
```

---

## 🎯 What Works on Vercel

✅ All API endpoints:
- `/api/search` - Google search
- `/api/sheet-count` - Get sheet data count
- `/api/extract-contacts` - Extract contact info
- `/api/generate-emails` - Generate sales emails

✅ Static files:
- `public/index.html` - Web interface

✅ Google Sheets integration
✅ Firecrawl API
✅ OpenRouter API

---

## ⚡ Performance Tips

1. **Batch Size:** Keep batches small (5-10 records max) to avoid timeouts
2. **Rate Limits:** Increased delays are in place to prevent 429 errors
3. **Timeout:** Be aware of Vercel's 10-second limit on free tier

---

## 📞 Need Help?

If you still get errors:
1. Check Vercel logs: `vercel logs [deployment-url]`
2. Verify all environment variables are set
3. Test API endpoints one by one
4. Check if Google service account has sheet access

---

## 🎉 Success Indicators

After deployment, you should see:
- ✅ Deployment successful message
- ✅ Can access your app at `your-project.vercel.app`
- ✅ Web interface loads
- ✅ API calls work (test search first)

Good luck with your deployment! 🚀

