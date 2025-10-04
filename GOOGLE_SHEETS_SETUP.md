# Google Sheets Integration Setup Guide

## 📋 Overview
This guide will help you set up Google Sheets API to automatically save your search results to a Google Spreadsheet.

## 🔧 Setup Steps

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Give it a name (e.g., "AI Worker Search Tool")
4. Click **"Create"**

### Step 2: Enable Google Sheets API

1. In your project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google Sheets API"**
3. Click on it and press **"Enable"**

### Step 3: Create a Service Account

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"Service Account"**
3. Fill in the details:
   - **Service account name**: `search-tool-service`
   - **Service account ID**: (auto-generated)
   - Click **"Create and Continue"**
4. Skip the optional steps and click **"Done"**

### Step 4: Create and Download Service Account Key

1. Click on the service account you just created
2. Go to the **"Keys"** tab
3. Click **"Add Key"** → **"Create new key"**
4. Select **JSON** format
5. Click **"Create"**
6. A JSON file will be downloaded - **keep this safe!**

### Step 5: Create a Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```
4. **Important**: Share the spreadsheet with your service account email
   - Click the **"Share"** button
   - Paste the service account email (found in the JSON file: `client_email`)
   - Give it **"Editor"** permissions
   - Click **"Send"**

### Step 6: Update Your .env File

Open the JSON key file you downloaded and find these values:

```json
{
  "type": "service_account",
  "project_id": "...",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "search-tool-service@....iam.gserviceaccount.com",
  ...
}
```

Add these to your `.env` file:

```env
# Google Search API (existing)
GOOGLE_API_KEY=your_search_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id

# Google Sheets API (new)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id
```

**Important Notes:**
- For `GOOGLE_PRIVATE_KEY`: Copy the entire private key value including the quotes and newline characters (`\n`)
- Keep the private key on a single line in the .env file
- Make sure to use double quotes around the private key

### Step 7: Test the Setup

Run your application:
```bash
npm start
```

When prompted to save results to Google Sheets, answer "yes" to test the integration!

## 📊 Spreadsheet Format

The tool will automatically create headers and save data in this format:

| Timestamp | Search Query | Title | Link | Snippet |
|-----------|--------------|-------|------|---------|
| 2025-10-04T12:00:00Z | restaurant New York | Best Restaurants... | https://... | Find the best... |

## 🔒 Security Tips

1. **Never commit your .env file** - It's already in `.gitignore`
2. **Keep your service account key JSON file secure**
3. **Only share your spreadsheet with the service account email**
4. **Rotate your keys periodically for security**

## ❓ Troubleshooting

### Error: "Failed to authenticate with Google Sheets"
- Check that your service account email and private key are correct in `.env`
- Make sure the private key includes the BEGIN/END markers
- Verify newline characters (`\n`) are preserved in the private key

### Error: "The caller does not have permission"
- Make sure you shared the spreadsheet with the service account email
- Give the service account "Editor" permissions

### Error: "Requested entity was not found"
- Check that your GOOGLE_SPREADSHEET_ID is correct
- Make sure the spreadsheet exists and is accessible

## 📚 Additional Resources

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Service Account Authentication](https://cloud.google.com/iam/docs/service-accounts)
- [Google Cloud Console](https://console.cloud.google.com/)

