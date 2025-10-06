# Vercel Deployment Fix Guide

## 🔧 Problem Solved

Your serverless function was crashing because:
1. ❌ **dotenv was trying to load `.env` file** in production (doesn't exist on Vercel)
2. ❌ **File system operations** trying to read `.google-credentials.json` (Vercel is read-only)
3. ❌ **Missing environment variables** in Vercel dashboard
4. ❌ **No error handling** for uninitialized API clients

## ✅ What I Fixed

1. **Made dotenv conditional** - Only loads in development, not production
2. **Removed file system dependency** - Now uses environment variables directly in production
3. **Added graceful error handling** - Proper initialization checks for all API clients
4. **Added health check endpoint** - `/api/health` to diagnose issues
5. **Better error messages** - Clear feedback when environment variables are missing

## 🚀 How to Deploy to Vercel

### Step 1: Set Environment Variables in Vercel

Go to your Vercel dashboard:
1. Navigate to your project
2. Click **Settings** → **Environment Variables**
3. Add the following variables:

#### Required for Google Search:
```
GOOGLE_API_KEY=your_google_search_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
```

#### Required for Google Sheets:
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id
```

**⚠️ Important for GOOGLE_PRIVATE_KEY:**
- Copy the ENTIRE private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Keep the `\n` characters (they represent newlines)
- Paste it as a single line in Vercel

#### Required for Contact Extraction:
```
FIRECRAWL_API_KEY=your_firecrawl_api_key
```

#### Required for Email Generation:
```
OPENROUTER_API_KEY=your_openrouter_api_key
```

#### System Variable:
```
NODE_ENV=production
```

### Step 2: Redeploy

After adding all environment variables:
1. Go to **Deployments** tab
2. Click **⋯** (three dots) on the latest deployment
3. Click **Redeploy**

Or simply push a new commit to trigger a deployment.

### Step 3: Test Your Deployment

#### Check Health Status:
Visit: `https://your-deployment-url.vercel.app/api/health`

This will show:
```json
{
  "status": "running",
  "timestamp": "2025-10-06T...",
  "environment": "production",
  "services": {
    "googleSearch": true,
    "googleSheets": true,
    "firecrawl": true,
    "openrouter": true
  }
}
```

If any service shows `false`, that environment variable is missing or incorrect.

#### Test the Interface:
Visit: `https://your-deployment-url.vercel.app/`

You should see the web interface without any 500 errors.

## 📋 Environment Variables Checklist

Make sure you have ALL of these in Vercel:

- [ ] `GOOGLE_API_KEY` - For Google Custom Search
- [ ] `GOOGLE_SEARCH_ENGINE_ID` - For Google Custom Search
- [ ] `GOOGLE_SERVICE_ACCOUNT_EMAIL` - For Google Sheets access
- [ ] `GOOGLE_PRIVATE_KEY` - For Google Sheets authentication (with \n preserved)
- [ ] `GOOGLE_SPREADSHEET_ID` - Target spreadsheet to write to
- [ ] `FIRECRAWL_API_KEY` - For contact extraction
- [ ] `OPENROUTER_API_KEY` - For AI email generation
- [ ] `NODE_ENV=production` - To ensure production mode

## 🔍 Troubleshooting

### Still getting 500 errors?

1. **Check Vercel logs:**
   - Go to **Deployments** → Click on your deployment → **Function Logs**
   - Look for error messages

2. **Verify environment variables:**
   - Visit `/api/health` endpoint
   - All services should show `true`

3. **Common issues:**

   **Issue:** `googleSheets: false`
   - **Solution:** Check that `GOOGLE_PRIVATE_KEY` is correctly formatted
   - Make sure it includes `\n` characters (not actual newlines)
   - Verify `GOOGLE_SERVICE_ACCOUNT_EMAIL` is correct

   **Issue:** `googleSearch: false`
   - **Solution:** Add `GOOGLE_API_KEY` and `GOOGLE_SEARCH_ENGINE_ID`

   **Issue:** `firecrawl: false`
   - **Solution:** Add `FIRECRAWL_API_KEY`

   **Issue:** `openrouter: false`
   - **Solution:** Add `OPENROUTER_API_KEY`

### Getting "Failed to authenticate with Google Sheets"?

This means the Google credentials are incorrect:
1. Verify `GOOGLE_SERVICE_ACCOUNT_EMAIL` matches your service account
2. Check `GOOGLE_PRIVATE_KEY` is the complete key with BEGIN/END markers
3. Ensure your spreadsheet is shared with the service account email
4. The `\n` characters must be preserved (they represent newlines)

### Example of correct GOOGLE_PRIVATE_KEY format:

```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n...\n-----END PRIVATE KEY-----\n
```

(All on one line, with `\n` as two characters, not actual newlines)

## 🎉 Success!

Once all environment variables are set correctly:
- ✅ The app should load without errors
- ✅ `/api/health` should show all services as `true`
- ✅ You can perform searches, extract contacts, and generate emails
- ✅ All data will be saved to your Google Spreadsheet

## 📚 Additional Resources

- [Vercel Environment Variables Docs](https://vercel.com/docs/projects/environment-variables)
- [Google Sheets API Setup](./GOOGLE_SHEETS_SETUP.md)
- [Full Project Documentation](./README.md)

## 🆘 Need More Help?

If you're still having issues:
1. Check the `/api/health` endpoint output
2. Review Vercel function logs
3. Verify all environment variables are set
4. Make sure your Google Spreadsheet is shared with the service account

The error should be much clearer now with the improved error messages!

