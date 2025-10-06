# Web Interface Guide

## 🌟 Overview

The AI Worker web interface provides a modern, browser-based UI for your complete business development workflow:

1. **Search** - Find companies using Google Custom Search
2. **Extract Contacts** - Get contact information from company websites
3. **Generate Emails** - Create personalized sales emails using AI

## 🚀 Getting Started

### 1. Start the Web Server

```bash
npm run server
```

The server will start on `http://localhost:3000`

### 2. Open in Browser

Navigate to `http://localhost:3000` in your web browser.

## 📝 How to Use

### Step 1: Search for Companies

1. **Enter Search Keyword**: Type what you're looking for (e.g., "software companies", "restaurants", "law firms")

2. **Enter Region**: Specify the location (e.g., "San Francisco", "New York", "London")

3. **Save to Google Sheets**: Check this box if you want to save results to your Google Spreadsheet (recommended for using Steps 2 & 3)

4. Click **"Start Search"** button

The system will:
- Search Google for up to 30 results
- Display the number of results found
- Save them to your Google Sheet (if checked)
- Automatically advance to Step 2

### Step 2: Extract Contact Information

After searching, you'll be taken to the contact extraction step.

1. **View Total Records**: See how many records are available in your sheet

2. **Select Range**: 
   - **From Entry**: Starting record number (e.g., 1)
   - **To Entry**: Ending record number (e.g., 10)

3. Click **"Extract Contacts"** button

The system will:
- Visit each company website
- Extract company name, phone number, and email
- Update your Google Sheet with the contact info
- Automatically advance to Step 3

**Note**: This process can take several minutes depending on the number of records.

**Skip Option**: If you already have extracted contacts, click "Skip to Email Generation" to go directly to Step 3.

### Step 3: Generate Sales Emails

Final step - generate personalized emails!

1. **View Total Records**: See how many records are available

2. **Select Range**:
   - **From Entry**: Starting record number (e.g., 1)
   - **To Entry**: Ending record number (e.g., 10)

3. Click **"Generate Emails"** button

The system will:
- Read each company's website content
- Use AI to find something specific to admire about the company
- Generate a personalized sales email
- Save the email to column I in your Google Sheet

**Note**: This process can take several minutes. Each email is uniquely crafted based on the company's actual content.

## 📊 Viewing Results

After each step, you'll see:
- ✅ Success count
- ❌ Failed count
- 🔗 Link to view your Google Sheet

Click the Google Sheet link to see all your data in one place:
- Column A-E: Search results and metadata
- Column F-H: Extracted contact information
- Column I: Generated sales emails

## ⚙️ Requirements

Make sure you have configured these in your `.env` file:

```env
# Google Search API
GOOGLE_API_KEY=your_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id

# Google Sheets
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id
# Either use .google-credentials.json file OR these env vars:
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email
GOOGLE_PRIVATE_KEY=your_private_key

# Firecrawl (for contact extraction)
FIRECRAWL_API_KEY=your_firecrawl_api_key

# OpenRouter (for email generation)
OPENROUTER_API_KEY=your_openrouter_api_key
```

## 🎨 Features

- **Beautiful Modern UI**: Clean, gradient-based design with smooth animations
- **Step-by-Step Process**: Clear visual indicators of your progress
- **Real-time Feedback**: Loading spinners and result messages
- **Mobile Responsive**: Works on desktop, tablet, and mobile devices
- **Error Handling**: Clear error messages if something goes wrong
- **Flexible Range Selection**: Process any range of records you want
- **Skip Options**: Jump between steps if needed

## 🔄 Starting Over

After completing all steps, you can:
- Click **"Start New Search"** to begin a fresh search
- Use your browser's back button
- Manually navigate to Step 2 or 3 if you want to reprocess data

## 💡 Tips

1. **Test First**: Start with a small range (1-3) to test the workflow
2. **Batch Processing**: Process records in batches to monitor progress
3. **Check Results**: Review your Google Sheet after each step
4. **API Limits**: Be aware of API rate limits (especially Google Search: 100 queries/day on free tier)
5. **Time Estimates**:
   - Search: ~10-30 seconds
   - Contact Extraction: ~20-30 seconds per record
   - Email Generation: ~5-10 seconds per record

## 🐛 Troubleshooting

**Server won't start:**
- Make sure port 3000 is not already in use
- Check that all npm packages are installed: `npm install`

**Search fails:**
- Verify Google API credentials in `.env`
- Check that you haven't exceeded API quota

**Extraction/Email generation fails:**
- Verify Firecrawl and OpenRouter API keys
- Check that Google Sheets is properly configured
- Make sure the spreadsheet has data from Step 1

**Can't access Google Sheet:**
- Verify the service account has access to the spreadsheet
- Check GOOGLE_SPREADSHEET_ID in `.env`

## 📱 Browser Compatibility

Tested and working on:
- Chrome/Edge (Recommended)
- Firefox
- Safari
- Opera

## 🔐 Security Notes

- The server runs locally on your machine (localhost)
- Your API keys never leave your computer
- All data is stored in your own Google Sheet
- No data is sent to third parties except the API services you've configured

## 📦 Alternative: Command Line Interface

If you prefer the command line, the original scripts still work:

```bash
# Search
npm start

# Extract contacts
npm run extract

# Generate emails
npm run email
```

The web interface and CLI both work with the same Google Sheet, so you can mix and match!

---

Enjoy your automated business development workflow! 🎉

