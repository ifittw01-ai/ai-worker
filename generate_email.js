const OpenAI = require('openai');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

// Initialize OpenRouter client
const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Function to fetch and extract text content from a URL
async function fetchWebContent(url) {
  try {
    console.log(`📄 Fetching content from: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    // Parse HTML and extract text
    const $ = cheerio.load(response.data);
    
    // Remove script and style elements
    $('script, style, nav, footer, header').remove();
    
    // Get text content
    let text = $('body').text();
    
    // Clean up whitespace
    text = text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
    
    // Limit to first 3000 characters to avoid token limits
    text = text.substring(0, 3000);
    
    console.log(`✅ Content fetched: ${text.length} characters\n`);
    
    return text;
  } catch (error) {
    console.error(`❌ Error fetching content: ${error.message}`);
    return null;
  }
}

// Function to generate admiration sentence and email using OpenRouter
async function generateEmail(companyName, webContent) {
  try {
    console.log(`🤖 Generating email for ${companyName}...\n`);

    // Choose a model (free options available)
    // Free models: 'meta-llama/llama-3.2-3b-instruct:free', 'google/gemma-2-9b-it:free'
    // Quality models: 'deepseek/deepseek-chat' (very cheap), 'openai/gpt-4o' (best)
    const model = 'deepseek/deepseek-chat-v3.1:free';
    
    console.log(`   Model: ${model}\n`);

    // Define the structured output schema
    const completion = await openrouter.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a professional business development specialist. Based on the company website content provided, find ONE specific thing to admire about the company and write a professional outreach email.'
        },
        {
          role: 'user',
          content: `Company Name: ${companyName}

Website Content:
${webContent}

Task:
1. Find ONE specific thing to admire about this company (their product, service, mission, innovation, achievement, etc.)
2. Write it as a single, genuine sentence (not generic, be specific based on their content)
3. Generate a complete professional email using this template:

Hi ${companyName},


I've long admired your company. [YOUR SPECIFIC ADMIRATION HERE]
I am Jordan. We specialize in providing enterprise AI services for companies or individuals in need of AI transformation. We have assisted many businesses in using AI to streamline operations, double their performance, perfectly create brand characteristics, and enhance customer engagement. I wonder if you would be interested in having a brief conversation to see how we can assist your company? Looking forward to your reply!

Best regards,
Jordan

Requirements:
- The admiration sentence must be specific to this company based on the website content
- Keep proper email formatting with blank lines
- Be professional and genuine

Return a JSON object with:
{
  "admiration": "your one sentence admiration",
  "email": "the complete formatted email"
}`
        }
      ],
      response_format: {
        type: 'json_object'
      }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    
    console.log('✅ Email generated successfully!\n');
    
    return result;

  } catch (error) {
    console.error(`❌ Error generating email: ${error.message}`);
    return null;
  }
}

// Function to format email with proper line spacing
function formatEmail(companyName, admiration) {
  return `Hi ${companyName},


I've long admired your company. ${admiration}

I am Jordan. We specialize in providing enterprise AI services for companies or individuals in need of AI transformation. We have assisted many businesses in using AI to streamline operations, double their performance, perfectly create brand characteristics, and enhance customer engagement. I wonder if you would be interested in having a brief conversation to see how we can assist your company? Looking forward to your reply!


Best regards,
Jordan`;
}

// Main function
async function main() {
  // Check if required arguments are provided
  if (process.argv.length < 4) {
    console.log('Usage: node generate_email.js <URL> <CompanyName>');
    console.log('Example: node generate_email.js https://firecrawl.dev Firecrawl');
    process.exit(1);
  }

  const url = process.argv[2];
  const companyName = process.argv[3];

  console.log('===========================================');
  console.log('   AI Email Generator');
  console.log('===========================================\n');
  console.log(`🏢 Company: ${companyName}`);
  console.log(`🔗 URL: ${url}\n`);

  // Check if API key is set
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ Error: OPENROUTER_API_KEY not found in .env file');
    console.error('Please add: OPENROUTER_API_KEY=your-key to your .env file');
    process.exit(1);
  }

  // Step 1: Fetch web content
  const webContent = await fetchWebContent(url);
  
  if (!webContent) {
    console.error('Failed to fetch web content. Exiting.');
    process.exit(1);
  }

  // Step 2: Generate email with AI
  const result = await generateEmail(companyName, webContent);
  
  if (!result) {
    console.error('Failed to generate email. Exiting.');
    process.exit(1);
  }

  // Step 3: Format and display results
  const formattedEmail = formatEmail(companyName, result.admiration);

  console.log('========================================');
  console.log('📊 Generated Content:');
  console.log('========================================\n');
  
  console.log('💡 Admiration Sentence:');
  console.log(`   "${result.admiration}"\n`);
  
  console.log('📧 Complete Email:');
  console.log('----------------------------------------');
  console.log(formattedEmail);
  console.log('----------------------------------------\n');

  // Save to file
  const fs = require('fs');
  const filename = `email_${companyName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.txt`;
  
  fs.writeFileSync(filename, formattedEmail);
  console.log(`💾 Email saved to: ${filename}\n`);

  console.log('🎉 Done!\n');
}

// Run the script
main().catch(error => {
  console.error('Script failed:', error.message);
  process.exit(1);
});

