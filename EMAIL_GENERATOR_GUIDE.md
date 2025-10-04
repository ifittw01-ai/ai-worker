# AI Email Generator

An intelligent tool that generates personalized outreach emails by analyzing company websites using AI.

## 🎯 Features

- **Web Scraping**: Automatically fetches content from any company website
- **AI-Powered Analysis**: Uses DeepSeek (free model) via OpenRouter to understand the company
- **Personalized Content**: Generates specific admiration based on company's actual offerings
- **Professional Template**: Creates properly formatted business outreach emails
- **Structured Output**: Uses JSON schema for consistent, reliable results

## 🚀 Setup

### Prerequisites

The required packages are already installed:
- `openai` - For OpenRouter API
- `axios` - For fetching web content  
- `cheerio` - For parsing HTML

### Environment Variable

Make sure your `.env` file has:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

This is already set in your `.env` file! ✅

## 📝 Usage

### Basic Usage

```bash
node generate_email.js <URL> <CompanyName>
```

### Examples

**Example 1: Firecrawl**
```bash
node generate_email.js https://firecrawl.dev Firecrawl
```

**Example 2: Mendable**
```bash
node generate_email.js https://mendable.ai Mendable
```

**Example 3: Any Company**
```bash
node generate_email.js https://example-company.com "Example Company"
```

**Note**: If company name has spaces, use quotes!

### Using npm script

```bash
npm run email https://firecrawl.dev Firecrawl
```

## 📊 Output Example

```
===========================================
   AI Email Generator
===========================================

🏢 Company: Firecrawl
🔗 URL: https://firecrawl.dev

📄 Fetching content from: https://firecrawl.dev
✅ Content fetched: 2847 characters

🤖 Generating email for Firecrawl...

✅ Email generated successfully!

========================================
📊 Generated Content:
========================================

💡 Admiration Sentence:
   "how you've simplified web scraping and turned any website into LLM-ready data with just a single API call"

📧 Complete Email:
----------------------------------------
Hi Firecrawl,


I've long admired your company. I really like how you've simplified web scraping and turned any website into LLM-ready data with just a single API call

I am Jordan. We specialize in providing enterprise AI services for companies or individuals in need of AI transformation. We have assisted many businesses in using AI to streamline operations, double their performance, perfectly create brand characteristics, and enhance customer engagement. I wonder if you would be interested in having a brief conversation to see how we can assist your company? Looking forward to your reply!


Best regards,
Jackson
----------------------------------------

💾 Email saved to: email_firecrawl_1738752847291.txt

🎉 Done!
```

## 📧 Email Template

The generated email follows this structure:

```
Hi [COMPANY_NAME],


I've long admired your company. I really like [SPECIFIC_ADMIRATION]

I am Jordan. We specialize in providing enterprise AI services for companies or individuals in need of AI transformation. We have assisted many businesses in using AI to streamline operations, double their performance, perfectly create brand characteristics, and enhance customer engagement. I wonder if you would be interested in having a brief conversation to see how we can assist your company? Looking forward to your reply!


Best regards,
Jackson
```

### Line Spacing

- ✅ 2 blank lines after header (Hi [Company])
- ✅ 1 blank line between paragraphs
- ✅ 2 blank lines before footer (Best regards)

## 🎨 How It Works

1. **Fetch Website Content**
   - Downloads the HTML from the provided URL
   - Extracts text content using Cheerio
   - Removes scripts, styles, navigation
   - Limits to 3000 characters

2. **AI Analysis**
   - Sends content to DeepSeek model via OpenRouter
   - Uses structured output (JSON) for reliability
   - AI finds specific, genuine things to admire
   - Generates personalized admiration sentence

3. **Email Generation**
   - Formats email with proper spacing
   - Inserts company name and admiration
   - Saves to timestamped file

4. **Output**
   - Displays results in console
   - Saves to `.txt` file for easy copying

## 🔧 Customization

### Change the AI Model

Edit `generate_email.js` line 64:

```javascript
model: 'deepseek/deepseek-chat:free',  // Current model (free)
```

Other options:
- `'openai/gpt-4o'` - More creative, costs money
- `'anthropic/claude-3.5-sonnet'` - Very good, costs money
- `'google/gemini-pro'` - Good quality, costs money

### Modify Email Template

Edit the `formatEmail` function in `generate_email.js`:

```javascript
function formatEmail(companyName, admiration) {
  return `Hi ${companyName},


I've long admired your company. I really like ${admiration}

[YOUR CUSTOM CONTENT HERE]


Best regards,
Jackson`;
}
```

### Change Sender Name

Replace "Jordan" and "Jackson" in the template with your name.

## 💰 Cost

- **DeepSeek Free Model**: $0 per request ✅
- **Alternative models**: Check [OpenRouter pricing](https://openrouter.ai/models)

## ⚠️ Troubleshooting

### Error: OPENROUTER_API_KEY not found

Your `.env` file needs:
```env
OPENROUTER_API_KEY=your-key-here
```

Check https://openrouter.ai to get your API key.

### Error fetching content

- Check if the URL is accessible
- Some websites block scrapers - try another URL
- Make sure the URL includes `http://` or `https://`

### Generic admiration sentences

- Try a URL with more detailed content (About page, Product page)
- The homepage might not have enough specific information
- Consider using a different AI model for better quality

## 🎯 Best Practices

1. **Choose informative URLs**: 
   - ✅ About pages, Product pages
   - ❌ Login pages, Empty pages

2. **Company name**:
   - Use the official company name
   - Match the name they use on their website

3. **Review before sending**:
   - Always read the generated email
   - Verify the admiration makes sense
   - Adjust if needed

4. **Batch processing**:
   - You can create a script to process multiple companies
   - Just loop through a list of URLs and names

## 📚 Examples of Good Admiration Sentences

✅ **Good** (Specific):
- "how you've revolutionized web scraping with AI-powered data extraction"
- "your innovative approach to making complex data accessible to developers"
- "the way you've simplified API integration with your unified endpoint"

❌ **Bad** (Generic):
- "your great products"
- "your innovative company"
- "your excellent service"

The AI is trained to be specific! If you get generic results, try:
- A more detailed page URL
- A different AI model
- Adding more context

## 🚀 Next Steps

Want to automate this further? Consider:

1. **Batch Processing**: Process multiple companies from a CSV file
2. **Integration**: Connect with your CRM or email system
3. **A/B Testing**: Generate multiple versions and test which performs better
4. **Follow-up**: Generate follow-up emails based on responses

Happy emailing! 📧

