# AI Email Generator

An intelligent tool that generates personalized outreach emails by analyzing company websites using AI. **Now integrated with Google Sheets** for seamless batch processing!

## 🎯 Features

- **Google Sheets Integration**: Automatically reads company names and URLs from your spreadsheet
- **Web Scraping**: Fetches content from company websites
- **AI-Powered Analysis**: Uses DeepSeek (free model) via OpenRouter to understand each company
- **Personalized Content**: Generates specific admiration based on company's actual offerings
- **Professional Template**: Creates properly formatted business outreach emails
- **Immediate Updates**: Saves each email back to Google Sheets right after generation
- **Smart Retry**: 3 automatic retry attempts if generation fails
- **Interactive Batch Processing**: Choose which records to process and when
- **Structured Output**: Uses JSON schema for consistent, reliable results

## 🚀 Setup

### Prerequisites

The required packages are already installed:
- `openai` - For OpenRouter API
- `axios` - For fetching web content  
- `cheerio` - For parsing HTML
- `googleapis` - For Google Sheets integration

### Environment Variables

Make sure your `.env` file has:

```env
# OpenRouter API (for AI email generation)
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# Google Sheets API (for reading/writing data)
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**OR** use `.google-credentials.json` file (recommended) - see [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md)

## 📝 Usage

### Basic Usage

```bash
npm run email
```

or

```bash
node generate_email.js
```

### Interactive Workflow

The tool will ask you:

1. **從第幾筆開始？(1-30):** 
   - Enter the starting record number (e.g., `1`)

2. **要處理幾筆？(1-30):**
   - Enter how many records to process (e.g., `5`)

3. After processing, it will ask:
   **還要繼續處理嗎？(yes/no):**
   - Enter `yes` or `y` to process another batch
   - Enter `no` or `n` to exit

### Example Session

```
===========================================
   AI Sales Email Generator
   (Reading from Google Sheets)
===========================================

📊 Step 1: Reading data from Google Sheets...

Reading data from sheet: Sheet1

Found 30 records in the sheet.

✅ Added "Sales Email" header to column I

📋 Total records available: 30

🔗 View spreadsheet: https://docs.google.com/spreadsheets/d/1jkwf...

從第幾筆開始？(1-30): 1
要處理幾筆？(1-30): 3

📧 Processing batch: Records 1 to 3 (3 records)

⚙️  Settings: 3 retry attempts per email

[1/30] Processing row 2:
  Company: Firecrawl
  URL: https://firecrawl.dev
  📄 Fetching content from: https://firecrawl.dev
  ✅ Content fetched: 2847 characters

🤖 Generating email for Firecrawl... (Attempt 1/3)
   Model: deepseek/deepseek-chat-v3.1:free
✅ Email generated successfully!

  ⏱️  Processing time: 8.3s
  💾 Updated row 2 with sales email
  📧 Email preview (first 100 chars):
     "Hi Firecrawl,


I've long admired your company. Your innovative approach to web scraping and AI-powe..."

  ⏸️  Waiting 2 seconds before next...

[2/30] Processing row 3:
  Company: Mendable
  URL: https://mendable.ai
  ...

========================================
📊 Batch Generation Summary:
========================================
  📍 Processed records: 1 to 3
  ✅ Successfully generated: 3
  ❌ Failed: 0
  ⏭️  Skipped (no link/name): 0
  📝 Batch total: 3
  ⏰ Batch time: 0.4 minutes
========================================

✅ Success rate: 100.0%

還要繼續處理嗎？(yes/no): yes

從第幾筆開始？(1-30): 4
要處理幾筆？(1-27): 5
...
```

## 📧 Generated Email Format

The generated email follows this structure:

```
Hi [COMPANY_NAME],


I've long admired your company. [SPECIFIC_ADMIRATION]

I am Jordan. We specialize in providing enterprise AI services for companies or individuals in need of AI transformation. We have assisted many businesses in using AI to streamline operations, double their performance, perfectly create brand characteristics, and enhance customer engagement. I wonder if you would be interested in having a brief conversation to see how we can assist your company? Looking forward to your reply!


Best regards,
Jordan
```

### Line Spacing

- ✅ 2 blank lines after header (Hi [Company])
- ✅ 1 blank line between paragraphs
- ✅ 2 blank lines before footer (Best regards)

## 🎨 How It Works

1. **Read from Google Sheets**
   - Connects to your spreadsheet using service account
   - Reads company names from column F (Company Name)
   - Reads website URLs from column D (Link)
   - Checks which records need emails generated

2. **Fetch Website Content**
   - Downloads the HTML from each URL
   - Extracts text content using Cheerio
   - Removes scripts, styles, navigation
   - Limits to 3000 characters for efficiency

3. **AI Analysis**
   - Sends content to DeepSeek model via OpenRouter
   - Uses structured output (JSON) for reliability
   - AI finds specific, genuine things to admire about each company
   - Generates personalized admiration sentence

4. **Email Generation**
   - Formats email with proper spacing
   - Inserts company name and admiration
   - Creates professional outreach email

5. **Update Google Sheets**
   - **Immediately** writes email to column I (Sales Email)
   - Updates happen before processing next record
   - Safe even if script stops mid-processing

6. **Retry on Failure**
   - If generation fails, automatically retries (up to 3 attempts)
   - Waits 3 seconds between retry attempts
   - Skips record if all attempts fail

## 📊 Google Sheet Structure

Your Google Sheet should have these columns (created automatically by previous steps):

| Column | Name          | Description                              | Filled By           |
|--------|---------------|------------------------------------------|---------------------|
| A      | Timestamp     | When search was performed                | search.js           |
| B      | Search Query  | Original search query                    | search.js           |
| C      | Title         | Website title                            | search.js           |
| D      | Link          | Website URL                              | search.js           |
| E      | Snippet       | Search result snippet                    | search.js           |
| F      | Company Name  | Extracted company name                   | extract_contacts.js |
| G      | Telephone     | Extracted phone number                   | extract_contacts.js |
| H      | Contact Email | Extracted contact email                  | extract_contacts.js |
| I      | Sales Email   | AI-generated personalized email          | **generate_email.js** |

## 🔧 Customization

### Change the AI Model

Edit `generate_email.js` around line 229:

```javascript
const model = 'deepseek/deepseek-chat-v3.1:free';  // Current model (free)
```

Other options:
- `'openai/gpt-4o'` - Very creative, costs ~$0.01 per email
- `'anthropic/claude-3-5-sonnet'` - Excellent quality, costs ~$0.015 per email
- `'google/gemini-pro'` - Good quality, costs money
- `'deepseek/deepseek-chat'` - Paid version, very cheap (~$0.0001 per email)

See [OpenRouter Models](https://openrouter.ai/models) for all options.

### Modify Email Template

Edit the `formatEmail` function in `generate_email.js` (around line 305):

```javascript
function formatEmail(companyName, admiration) {
  return `Hi ${companyName},


I've long admired your company. ${admiration}

[YOUR CUSTOM CONTENT HERE]


Best regards,
[YOUR NAME]`;
}
```

### Change Sender Name

Replace "Jordan" in the template with your name.

### Adjust Retry Settings

Edit `processBatch` function call in `generate_email.js` (line 374):

```javascript
const emailResult = await generateEmailWithRetry(result.companyName, webContent, 3);
//                                                                               ^ Change this number
```

### Change Processing Delay

Edit the delay between records (line 403):

```javascript
await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds, change as needed
```

## 💰 Cost

### Using Free Model (Default)

- **DeepSeek Free Model**: $0 per request ✅
- No credit card required
- Rate limits apply (but generous)

### Using Paid Models

- **DeepSeek Paid**: ~$0.0001 per email (extremely cheap)
- **GPT-4o**: ~$0.01 per email
- **Claude 3.5**: ~$0.015 per email

**Example for 100 emails:**
- DeepSeek Free: **$0**
- DeepSeek Paid: **$0.01**
- GPT-4o: **$1.00**
- Claude 3.5: **$1.50**

## ⚠️ Troubleshooting

### Error: OPENROUTER_API_KEY not found

Your `.env` file needs:
```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Get your API key at https://openrouter.ai

### Error: GOOGLE_SPREADSHEET_ID not found

Make sure your `.env` has:
```env
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id
```

Or create `.google-credentials.json` - see [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md)

### Error: No data found in the sheet

You need to run the previous steps first:
1. `npm start` - Search for websites
2. `npm run extract` - Extract contact information
3. Then run `npm run email`

### Error: Failed to fetch web content

- Check if the URL is accessible
- Some websites block scrapers - the script will skip these
- Make sure the URL includes `http://` or `https://`

### Generic admiration sentences

- Try processing records with more detailed websites
- The homepage might not have enough specific information
- Consider using a paid AI model (GPT-4o, Claude) for better quality
- Check if the website has sufficient text content

### "Failed to generate email after retries"

- Check your OpenRouter API key is valid
- Check if you have rate limit issues (wait and try again)
- Verify your internet connection
- Try a different AI model

## 🎯 Best Practices

1. **Process in small batches**:
   - ✅ Start with 5-10 emails
   - ✅ Review quality before processing more
   - ✅ Avoid hitting API rate limits

2. **Review before sending**:
   - Always read generated emails in the spreadsheet
   - Verify the admiration makes sense
   - Check for any issues or generic content

3. **Resume anytime**:
   - If interrupted, just run again and start from where you left off
   - Each email is saved immediately, so no data is lost

4. **Monitor your usage**:
   - Check [OpenRouter Dashboard](https://openrouter.ai/activity) for API usage
   - Free tier has rate limits but is generous
   - Consider upgrading if you need to process hundreds of emails

5. **Choose good websites**:
   - Records with clear company websites work best
   - About pages and product pages have good content
   - Avoid login pages, empty sites, or redirects

## 📚 Examples of Good Admiration Sentences

✅ **Good** (Specific):
- "Your innovative approach to web scraping and AI-powered data extraction truly stands out in the industry"
- "The way you've simplified API integration with your unified endpoint is impressive"
- "Your commitment to making complex data accessible to developers of all skill levels is admirable"

❌ **Bad** (Generic):
- "your great products"
- "your innovative company"
- "your excellent service"

The AI is trained to be specific! If you get generic results:
- Try records with more informative websites
- Consider using a better AI model (GPT-4o, Claude)
- Make sure the website has sufficient content

## 🚀 Advanced: Command Line Arguments (Legacy)

You can still use the old method if needed:

```bash
node generate_email.js https://example.com "Company Name"
```

But the interactive Google Sheets method is recommended for batch processing!

## 💡 Tips for Success

1. **Start small**: Process 3-5 emails first to test quality
2. **Check the sheet**: Review generated emails before sending
3. **Adjust as needed**: Customize the template for your use case
4. **Track results**: Note which emails get responses
5. **Iterate**: Improve your template based on what works

## 📊 Success Metrics

After processing your batch, you'll see:

```
========================================
📊 Batch Generation Summary:
========================================
  📍 Processed records: 1 to 10
  ✅ Successfully generated: 8
  ❌ Failed: 1
  ⏭️  Skipped (no link/name): 1
  📝 Batch total: 10
  ⏰ Batch time: 1.2 minutes
========================================

✅ Success rate: 80.0%
```

Good success rates are typically 80-95%, depending on website quality.

## 🎉 Complete Workflow Summary

```
1. npm start          → Search and save to Google Sheets
2. npm run extract    → Extract contact info, update sheets
3. npm run email      → Generate sales emails, update sheets
                        ↓
         Ready to send personalized emails! 📧
```

Happy emailing! 📧

