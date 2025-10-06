# Vercel Environment Variables - Quick Setup

## 📋 Copy-Paste These Variables into Vercel

Go to: **Your Project → Settings → Environment Variables**

Add each of these (replace with your actual values):

---

### 1. Google Custom Search API

**Variable Name:**
```
GOOGLE_API_KEY
```

**Value:**
```
AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

**Variable Name:**
```
GOOGLE_SEARCH_ENGINE_ID
```

**Value:**
```
0123456789abcdef0
```

---

### 2. Google Sheets API

**Variable Name:**
```
GOOGLE_SERVICE_ACCOUNT_EMAIL
```

**Value:**
```
your-service-account@your-project.iam.gserviceaccount.com
```

---

**Variable Name:**
```
GOOGLE_PRIVATE_KEY
```

**Value:** (Copy from your service account JSON file - keep on ONE line)
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n...\n-----END PRIVATE KEY-----\n
```

⚠️ **Important:** 
- Must be on ONE line
- Keep the `\n` characters (they are two characters: backslash + n)
- Include `-----BEGIN PRIVATE KEY-----` at start
- Include `-----END PRIVATE KEY-----` at end

---

**Variable Name:**
```
GOOGLE_SPREADSHEET_ID
```

**Value:** (Get from spreadsheet URL: `https://docs.google.com/spreadsheets/d/[THIS_PART]/edit`)
```
1AbC2dEf3GhI4jKl5MnO6pQr7StU8vWx9YzA0BcD
```

---

### 3. Firecrawl API (for contact extraction)

**Variable Name:**
```
FIRECRAWL_API_KEY
```

**Value:**
```
fc-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Get your API key at: https://www.firecrawl.dev/

---

### 4. OpenRouter API (for email generation)

**Variable Name:**
```
OPENROUTER_API_KEY
```

**Value:**
```
sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Get your API key at: https://openrouter.ai/

---

### 5. Node Environment

**Variable Name:**
```
NODE_ENV
```

**Value:**
```
production
```

---

## ✅ Verification Steps

After adding all variables:

### Step 1: Redeploy
```bash
# Trigger a redeploy from Vercel dashboard
# OR commit a change to your repo
git commit --allow-empty -m "Trigger redeploy"
git push
```

### Step 2: Check Health Endpoint
Visit: `https://your-app.vercel.app/api/health`

You should see:
```json
{
  "status": "running",
  "environment": "production",
  "services": {
    "googleSearch": true,      ← Should be true
    "googleSheets": true,      ← Should be true  
    "firecrawl": true,         ← Should be true
    "openrouter": true         ← Should be true
  }
}
```

### Step 3: Test the App
Visit: `https://your-app.vercel.app/`

The interface should load without 500 errors!

---

## 🔍 How to Get These Values

### Google API Keys
1. **GOOGLE_API_KEY** - From Google Cloud Console → APIs & Services → Credentials
2. **GOOGLE_SEARCH_ENGINE_ID** - From Programmable Search Engine dashboard

### Google Sheets Credentials
1. **Create service account** in Google Cloud Console
2. **Download JSON key file**
3. Extract `client_email` → Use as `GOOGLE_SERVICE_ACCOUNT_EMAIL`
4. Extract `private_key` → Use as `GOOGLE_PRIVATE_KEY` (keep on one line)
5. **Share spreadsheet** with the service account email
6. **Copy spreadsheet ID** from URL

See [GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md) for detailed instructions.

### Firecrawl API Key
1. Sign up at https://www.firecrawl.dev/
2. Go to dashboard → API Keys
3. Copy your API key

### OpenRouter API Key
1. Sign up at https://openrouter.ai/
2. Go to Keys section
3. Create a new API key
4. Copy the key

---

## ⚠️ Common Mistakes

### ❌ GOOGLE_PRIVATE_KEY has actual newlines
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0...    ← WRONG! Multiple lines
...
-----END PRIVATE KEY-----
```

### ✅ GOOGLE_PRIVATE_KEY on one line with \n
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0...\n-----END PRIVATE KEY-----\n
```
All on ONE line with `\n` as two characters ✓

---

### ❌ Missing environment variables
If `/api/health` shows any `false` values, that variable is missing or incorrect.

### ✅ All variables configured
All services show `true` in health check ✓

---

## 🎯 Quick Test Checklist

- [ ] Added all 8 environment variables in Vercel
- [ ] Redeployed the application
- [ ] `/api/health` shows all services as `true`
- [ ] Main page loads without 500 error
- [ ] Can perform a test search
- [ ] Google Sheet receives data

---

## 💡 Pro Tips

1. **Copy private key correctly:** Open the JSON file in a text editor, copy the private_key value (it's already one line with \n characters)

2. **Don't add quotes:** Vercel handles quoting automatically, just paste the raw value

3. **Test incrementally:** Add variables one service at a time and check `/api/health` after each group

4. **Keep credentials safe:** Never commit `.env` files or credentials to git

---

## 🆘 Still Having Issues?

If after setting all variables you still get errors:

1. **Check Vercel Function Logs:**
   - Deployments → Your deployment → Function Logs
   - Look for specific error messages

2. **Verify each variable:**
   - Settings → Environment Variables
   - Click "Edit" on each to verify the value

3. **Test locally first:**
   ```bash
   # Create .env file locally with same values
   npm run server
   # Visit http://localhost:3000/api/health
   ```

4. **Refer to detailed guide:**
   - See [VERCEL_FIX_GUIDE.md](./VERCEL_FIX_GUIDE.md) for troubleshooting

---

**Good luck! 🚀**

