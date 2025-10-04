# Firecrawl Contact Extraction Tool

An automated tool that reads website links from Google Sheets (from search results) and extracts contact information using Firecrawl's Extract API.

## 📋 Features

- **Reads from Google Sheets**: Automatically processes all search results from `search.js`
- **Extracts contact info**: Company names, telephone numbers, and email addresses
- **Updates Google Sheets**: Adds extracted data directly to the same spreadsheet
- **Progress tracking**: Real-time console output with progress indicators
- **Smart retry mechanism**: Automatically retries failed requests (2 attempts per URL)
- **Timeout protection**: Skips websites that take longer than 20 seconds
- **Error handling**: Continues processing even if some websites fail or timeout
- **Detailed statistics**: Shows success rate, timeouts, and failures

## 🚀 Setup

### 1. Get Your Firecrawl API Key

1. Sign up at [Firecrawl](https://firecrawl.dev)
2. Go to your dashboard
3. Copy your API key (starts with `fc-`)

### 2. Update .env File

Open your `.env` file and update the Firecrawl API key:

```env
FIRECRAWL_API_KEY=fc-YOUR-ACTUAL-API-KEY
```

Replace `fc-YOUR-ACTUAL-API-KEY` with your real API key.

### 3. Install Dependencies (Already Done)

The Firecrawl package is already installed:
```bash
npm install
```

## 📝 Usage

### Workflow

**Step 1: Run Google Search (if not already done)**

```bash
npm start
```

This will search Google and save results to your Google Spreadsheet with columns:
- Timestamp
- Search Query
- Title
- Link
- Snippet
- Company Name (empty)
- Telephone (empty)
- Contact Email (empty)

**Step 2: Extract Contact Information (Interactive)**

```bash
npm run extract
```

The tool will then ask you:

1. **從第幾筆開始？** (Which record to start from?)
   - Enter a number between 1 and total records
   - Example: Enter `1` to start from the first record
   - Example: Enter `11` to start from the 11th record

2. **要處理幾筆？** (How many records to process?)
   - Enter the number of records you want to process
   - Example: Enter `10` to process 10 records
   - The maximum is automatically calculated based on your start position

3. After processing, it asks: **還要繼續處理嗎？** (Continue processing?)
   - Enter `yes` or `y` to process another batch
   - Enter `no` or `n` to stop

Or run directly:

```bash
node extract_contacts.js
```

### Interactive Workflow Example

```
📋 Total records available: 30

從第幾筆開始？(1-30): 1
要處理幾筆？(1-30): 10

[Processing 1-10...]

還要繼續處理嗎？(yes/no): yes

從第幾筆開始？(1-30): 11
要處理幾筆？(1-20): 10

[Processing 11-20...]

還要繼續處理嗎？(yes/no): no

🎉 處理完成！感謝使用！
```

### Benefits

- **Flexible processing**: Choose which records to process
- **Resume capability**: Process in batches and take breaks
- **Cost control**: Process only what you need
- **Error recovery**: If something fails, restart from where you left off

## 📊 Output Example

```
===========================================
   Firecrawl Contact Extraction Tool
   (Reading from Google Sheets)
===========================================

📊 Step 1: Reading search results from Google Sheets...

Reading data from sheet: Sheet1

Found 30 search results in the sheet.

✅ Added headers to columns F, G, H

🔍 Step 2: Extracting contact information from 30 websites...

⚙️  Settings: 20 second timeout, 2 retry attempts per URL

[1/30] Processing row 2:
  Title: Best Interior Design Company - Malaysia
  URL: https://example-design.com
  Extracting from: https://example-design.com (Attempt 1/2)
  ✅ Success on attempt 1
  ⏱️  Processing time: 3.2s
  📋 Results:
     Company: Example Design Studio
     Telephone: +60 3-1234 5678
     Email: info@example-design.com
  💾 Updated row 2 with data

  ⏸️  Waiting 1 second before next...

[2/30] Processing row 3:
  Title: Slow Website
  URL: https://slow-site.com
  Extracting from: https://slow-site.com (Attempt 1/2)
  ⏱️  Timeout (>20s) on attempt 1
  🔄 Retrying in 2 seconds...
  Extracting from: https://slow-site.com (Attempt 2/2)
  ⏱️  Timeout (>20s) on attempt 2
  ⏭️  Max retries reached, skipping to next...
  ⏱️  Processing time: 42.1s
  ⚠️  No data extracted (timeout or error)
  💾 Updated row 3 (marked as processed, no data)

  ⏸️  Waiting 1 second before next...

[3/30] Processing row 4:
  ...

========================================
📊 Extraction Summary:
========================================
  ✅ Successfully extracted: 25
  ⏱️  Timed out (>20s): 3
  ❌ Failed (errors): 1
  ⏭️  Skipped (no link): 1
  📝 Total processed: 30
  ⏰ Total time: 12.5 minutes
========================================

🎉 All done! Check your Google Sheet:
   https://docs.google.com/spreadsheets/d/${spreadsheetId}

⚠️  Note: 3 website(s) timed out after 20 seconds and were skipped.
⚠️  Note: 1 website(s) failed to extract data due to errors.
✅ Success rate: 83.3%
```

## 🔧 Customization

### Adjust Timeout and Retry Settings

You can modify the timeout and retry behavior in `extract_contacts.js`:

```javascript
// In the main function, change these parameters:
const contactInfo = await extractContactFromWebsite(
  result.link, 
  2,   // maxRetries - number of retry attempts (default: 2)
  20   // timeoutSeconds - timeout in seconds (default: 20)
);
```

**Examples:**
- More aggressive: `extractContactFromWebsite(url, 3, 30)` - 3 retries, 30 second timeout
- Faster: `extractContactFromWebsite(url, 1, 10)` - 1 retry, 10 second timeout
- Patient: `extractContactFromWebsite(url, 2, 60)` - 2 retries, 60 second timeout

### Change the Schema

You can modify the schema to extract different information:

```javascript
const schema = {
  type: 'object',
  properties: {
    company_name: {
      type: 'string',
      description: 'The name of the company'
    },
    contact_email: {
      type: 'string',
      description: 'The contact email address'
    },
    phone_number: {  // Add new field
      type: 'string',
      description: 'The contact phone number'
    }
  },
  required: ['company_name', 'contact_email']
};
```

### Change the Prompt

Modify the prompt to extract different information:

```javascript
const result = await firecrawl.extract({
  urls: websites,
  prompt: 'Extract the contact email, company name, and phone number',
  schema: schema
});
```

## 💰 Pricing

Firecrawl Extract is billed separately from scraping:
- Check [Firecrawl Pricing](https://firecrawl.dev/pricing) for details
- Monitor usage in your Firecrawl dashboard

## 🔍 Advanced Features

### Enable Web Search

To get better results by following links:

```javascript
const result = await firecrawl.extract({
  urls: websites,
  prompt: 'Extract the contact email and company name',
  schema: schema,
  enableWebSearch: true  // Enable web search
});
```

### Extract Without Specific URLs

Let Firecrawl find the website for you:

```javascript
const result = await firecrawl.extract({
  urls: [],  // Empty array
  prompt: 'Extract contact information from Firecrawl\'s website',
  schema: schema
});
```

## ❓ Troubleshooting

### Error: FIRECRAWL_API_KEY not found

Make sure you:
1. Created a `.env` file in the project root
2. Added `FIRECRAWL_API_KEY=fc-YOUR-KEY`
3. Saved the file

### No data returned

- Check that the websites have contact information
- Try enabling `enableWebSearch: true`
- Verify your API key is valid
- Check your Firecrawl dashboard for usage limits

### API Error 401

Your API key is invalid or expired. Get a new one from your Firecrawl dashboard.

## 📚 Resources

- [Firecrawl Documentation](https://docs.firecrawl.dev)
- [Extract API Reference](https://docs.firecrawl.dev/features/extract)
- [Firecrawl Dashboard](https://firecrawl.dev/dashboard)

## 📧 Support

For issues with Firecrawl API: help@firecrawl.com

