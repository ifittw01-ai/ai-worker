# AI Worker - Web Data Extraction Tool

A powerful Node.js application suite for extracting data from the web:
- **Google Custom Search**: Search and collect results from Google
- **Firecrawl Extract**: Extract structured data (contact info, company details) from websites
- **🌐 NEW: Web Interface**: Beautiful browser-based UI for the complete workflow

## 🎨 Two Ways to Use

### Option 1: Web Interface (Recommended) ⭐

Launch a beautiful, modern web interface in your browser:

```bash
npm run server
```

Then open `http://localhost:3000` in your browser.

**Features:**
- 🎯 Step-by-step guided workflow
- 📊 Real-time progress tracking
- 🎨 Beautiful modern UI with animations
- 📱 Mobile responsive design
- ✅ Visual feedback and result summaries

For detailed instructions, see [WEB_INTERFACE_GUIDE.md](WEB_INTERFACE_GUIDE.md)

### Option 2: Command Line Interface

Use the original command-line tools for more control:
- `npm start` - Google Search
- `npm run extract` - Contact Extraction  
- `npm run email` - Email Generation

(Both methods work with the same Google Sheet!)

## Features

### Google Search Tool (`search.js`)
- Interactive command-line interface
- Dynamic search keyword and location input
- Fetches 30 results per search
- **✨ Save results directly to Google Spreadsheet**
- Option to save results to JSON file
- Support for multiple consecutive searches

### Contact Extraction Tool (`extract_contacts.js`)
- **Automatically reads URLs from Google Sheets** (from search results)
- Extracts company names, telephone numbers, and contact emails
- **Updates Google Sheets** with extracted data
- Powered by Firecrawl's AI extraction
- **Smart retry mechanism**: 2 attempts per URL
- **Timeout protection**: Skips websites taking >20 seconds
- Progress tracking with detailed statistics

### AI Email Generator (`generate_email.js`)
- **Automatically reads from Google Sheets** (company names and URLs from previous steps)
- **Analyzes company websites** and generates personalized outreach emails
- **AI-powered admiration**: Finds specific things to praise about each company
- **Updates Google Sheets** with generated emails
- Uses DeepSeek (free model) via OpenRouter
- **Smart retry mechanism**: 3 attempts per email
- **Interactive batch processing**: Choose which records to process
- Professional email template with proper formatting

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Get your Google Custom Search API credentials:
   - **API Key**: Visit [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and create an API key
   - **Search Engine ID**: Visit [Programmable Search Engine](https://programmablesearchengine.google.com/) and create a custom search engine

4. **For Google Sheets Integration** (Optional but recommended):
   - See detailed setup guide: [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md)
   - You'll need to create a service account and get credentials

5. Update the `.env` file with your credentials:
   ```env
   # Google Search API
   GOOGLE_API_KEY=your_actual_api_key
   GOOGLE_SEARCH_ENGINE_ID=your_actual_search_engine_id
   
   # Google Sheets API (required for full workflow)
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GOOGLE_SPREADSHEET_ID=your_spreadsheet_id
   
   # Firecrawl API (for contact extraction)
   FIRECRAWL_API_KEY=fc-YOUR-API-KEY
   
   # OpenRouter API (for AI email generation)
   OPENROUTER_API_KEY=sk-or-v1-YOUR-API-KEY
   ```

## Usage

### Google Search Tool

Run the search program:
```bash
npm start
```

or

```bash
node search.js
```

### Contact Extraction Tool

Run the extraction tool:
```bash
npm run extract
```

or

```bash
node extract_contacts.js
```

For detailed setup and usage, see [EXTRACT_CONTACTS_GUIDE.md](EXTRACT_CONTACTS_GUIDE.md)

### AI Email Generator

Generate personalized outreach emails (reads from Google Sheets):
```bash
npm run email
```

or

```bash
node generate_email.js
```

The tool will interactively ask you:
1. **從第幾筆開始？** (Which record to start from?)
2. **要處理幾筆？** (How many to process?)
3. After completion: **還要繼續處理嗎？** (Continue? yes/no)

**What happens:**
1. 📊 Reads company names and URLs from Google Sheet
2. 📄 Fetches and analyzes each company website
3. 🤖 Uses AI to find something specific to admire about each company
4. ✉️ Generates personalized professional emails
5. 💾 Updates the Google Sheet with generated emails **immediately** (before processing next record)

**Benefits:**
- ✅ Automatic retry (3 attempts per email)
- ✅ Process in batches to control API usage
- ✅ Resume anytime from where you left off
- ✅ Immediate updates to Google Sheets

For detailed guide, see [EMAIL_GENERATOR_GUIDE.md](EMAIL_GENERATOR_GUIDE.md)

## 🔄 Complete Workflow

### Step 1: Search for websites
```bash
npm start
```
The program will prompt you to:
1. Enter a search keyword (e.g., "interior design company")
2. Enter a search location (e.g., "Malaysia")
3. View the search results (30 results)
4. Save the results to Google Sheets ✅ **Say yes to enable Step 2**

Your Google Sheet will now have columns:
- Timestamp | Search Query | Title | Link | Snippet | Company Name | Telephone | Contact Email | Sales Email

(The last 4 columns will be empty initially)

### Step 2: Extract contact information (Interactive)
```bash
npm run extract
```

The tool will interactively ask you:
1. **從第幾筆開始？** (Which record to start from? e.g., 1)
2. **要處理幾筆？** (How many to process? e.g., 10)
3. After completion: **還要繼續處理嗎？** (Continue? yes/no)

**What happens:**
1. 📊 Reads website links from the Google Sheet
2. 🔍 Visits selected websites and extracts contact info using Firecrawl
3. 💾 Updates the Google Sheet with:
   - Company Name
   - Telephone
   - Contact Email

**Benefits:**
- ✅ Process in batches (e.g., 10 records at a time)
- ✅ Resume anytime from where you left off
- ✅ Control API usage and costs
- ✅ Take breaks between batches

**Result**: Your Google Sheet now has complete data including contact information for each search result!

### Step 3: Generate personalized sales emails (Interactive)
```bash
npm run email
```

The tool will interactively ask you:
1. **從第幾筆開始？** (Which record to start from? e.g., 1)
2. **要處理幾筆？** (How many to process? e.g., 5)
3. After completion: **還要繼續處理嗎？** (Continue? yes/no)

**What happens:**
1. 📊 Reads company names and website URLs from Google Sheet
2. 🌐 Fetches content from each website
3. 🤖 AI analyzes and finds something specific to admire about each company
4. ✉️ Generates personalized sales emails
5. 💾 **Immediately** updates the Google Sheet with the email (before processing next record)

**Benefits:**
- ✅ Process in batches (e.g., 5 emails at a time)
- ✅ Resume anytime from where you left off
- ✅ Control API usage and costs
- ✅ Automatic retry (3 attempts) if generation fails
- ✅ Each email is saved immediately (safe even if script stops)

**Result**: Your Google Sheet now has complete data with personalized sales emails ready to send!

### Visual Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: npm start (Search Google)                               │
├─────────────────────────────────────────────────────────────────┤
│ Input:  "interior design company" + "Malaysia"                  │
│ Output: 30 search results                                       │
│         ↓                                                        │
│ Google Sheet columns:                                            │
│ [Timestamp | Query | Title | Link | Snippet | | | | ]         │
│                                       ↑                          │
│                        Empty columns for extracted data         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: npm run extract (Extract Contacts)                      │
├─────────────────────────────────────────────────────────────────┤
│ • Reads website links from Sheet                                │
│ • Visits each website with Firecrawl AI                         │
│ • Extracts: Company Name, Phone, Email                          │
│         ↓                                                        │
│ Updates Google Sheet:                                            │
│ [... | Link | Snippet | CompanyName | Phone | Email | ]        │
│                        ↑─────────────────────────↑              │
│                        Filled automatically                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: npm run email (Generate Sales Emails)                   │
├─────────────────────────────────────────────────────────────────┤
│ • Reads Company Names & Links from Sheet                        │
│ • Fetches website content for each company                      │
│ • AI analyzes and finds something to admire                     │
│ • Generates personalized email for each                         │
│         ↓                                                        │
│ Updates Google Sheet:                                            │
│ [... | CompanyName | Phone | Email | SalesEmail]               │
│                                       ↑──────────↑              │
│                              Personalized email added           │
└─────────────────────────────────────────────────────────────────┘

✅ COMPLETE! Your sheet now has search results + contact info + sales emails
```

## Example

```
===========================================
   Google Custom Search API Tool
===========================================

Enter search keyword: restaurant
Enter search location: New York

Searching for: "restaurant New York"...

========== SEARCH RESULTS (1,234,567 total) ==========

1. Best Restaurants in New York City
   Link: https://example.com/restaurants
   Snippet: Find the best restaurants in New York City...

2. Top 10 NYC Restaurants
   Link: https://example.com/top-restaurants
   Snippet: Explore the top-rated restaurants...

...

======================================

Do you want to save the results to Google Sheets? (yes/no): yes
✅ Results saved to Google Spreadsheet!
   Spreadsheet ID: 1234567890abcdefg
   View at: https://docs.google.com/spreadsheets/d/1234567890abcdefg

Do you want to save the results to a JSON file? (yes/no): no

Do you want to perform another search? (yes/no): no
Thank you for using the search tool!
```

## Notes

- The free tier of Google Custom Search API allows 100 queries per day
- **The tool fetches 30 results per search** (using 3 API requests)
  - This means you can perform ~33 searches per day with the free tier
  - To change the number of results, modify `totalResults` parameter in the code
- Make sure to keep your `.env` file private and never commit it to version control
- **Google Sheets integration is optional** - the tool will still work without it
- For detailed Google Sheets setup instructions, see [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md)

