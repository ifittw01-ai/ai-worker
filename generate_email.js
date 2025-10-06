const OpenAI = require('openai');
const axios = require('axios');
const cheerio = require('cheerio');
const { google } = require('googleapis');
const readline = require('readline');
require('dotenv').config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user for input
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

// Initialize OpenRouter client
const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Function to authenticate with Google Sheets
async function getGoogleSheetsClient() {
  try {
    const fs = require('fs');
    let auth;

    // Try to load credentials from JSON file first
    if (fs.existsSync('.google-credentials.json')) {
      const credentials = JSON.parse(fs.readFileSync('.google-credentials.json', 'utf8'));
      
      auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } else if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      // Fallback to .env file
      auth = new google.auth.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } else {
      console.error('Error: Missing Google Sheets credentials');
      return null;
    }

    const sheets = google.sheets({ version: 'v4', auth });
    
    return sheets;
  } catch (error) {
    console.error('Error authenticating with Google Sheets:', error.message);
    return null;
  }
}

// Function to read data from Google Sheets
async function readSheetData() {
  try {
    const sheets = await getGoogleSheetsClient();
    
    if (!sheets) {
      console.error('Failed to authenticate with Google Sheets');
      return null;
    }

    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      console.error('Error: Please set GOOGLE_SPREADSHEET_ID in .env file');
      return null;
    }

    // Get the first sheet name dynamically
    let sheetName = 'Sheet1';
    try {
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId,
      });
      
      if (spreadsheet.data.sheets && spreadsheet.data.sheets.length > 0) {
        sheetName = spreadsheet.data.sheets[0].properties.title;
      }
    } catch (error) {
      console.log('Using default sheet name: Sheet1');
    }

    console.log(`Reading data from sheet: ${sheetName}\n`);

    // Read all data from the sheet (columns A to J)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:J`,
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      console.log('No data found in the sheet.');
      return { sheets, spreadsheetId, sheetName, results: [] };
    }

    // Skip header row and extract data
    const results = rows.slice(1).map((row, index) => ({
      rowIndex: index + 2, // +2 because: +1 for array index, +1 for header row
      timestamp: row[0] || '',
      searchQuery: row[1] || '',
      title: row[2] || '',
      link: row[3] || '',
      snippet: row[4] || '',
      companyName: row[5] || '',
      telephone: row[6] || '',
      contactEmail: row[7] || '',
      salesEmail: row[8] || '', // Existing sales email if any
      hasExistingSalesEmail: !!(row[8]) // Check if sales email already exists
    }));

    console.log(`Found ${results.length} records in the sheet.\n`);

    return { sheets, spreadsheetId, sheetName, results };

  } catch (error) {
    console.error('Error reading from Google Sheets:', error.message);
    return null;
  }
}

// Function to ensure Sales Email header exists
async function ensureSalesEmailHeader(sheets, spreadsheetId, sheetName) {
  try {
    // Check if header exists in column I
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!I1`
    });

    const header = response.data.values?.[0]?.[0];
    
    // If header is missing, add it
    if (!header || header !== 'Sales Email') {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!I1`,
        valueInputOption: 'RAW',
        resource: {
          values: [['Sales Email']]
        }
      });
      console.log('✅ Added "Sales Email" header to column I\n');
    }
  } catch (error) {
    console.log('Note: Could not verify header');
  }
}

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

// Function to update Google Sheets with sales email
async function updateSalesEmail(sheets, spreadsheetId, sheetName, rowIndex, salesEmail) {
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!I${rowIndex}`,
      valueInputOption: 'RAW',
      resource: {
        values: [[salesEmail]]
      }
    });
    return true;
  } catch (error) {
    console.error(`Error updating row ${rowIndex}:`, error.message);
    return false;
  }
}

// Function to generate admiration sentence and email using OpenRouter with retry
async function generateEmailWithRetry(companyName, webContent, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 Generating email for ${companyName}... (Attempt ${attempt}/${maxRetries})`);

      // Choose a model (free options available)
      // Free models: 'meta-llama/llama-3.2-3b-instruct:free', 'google/gemma-2-9b-it:free'
      // Quality models: 'deepseek/deepseek-chat' (very cheap ~$0.0001/email), 'openai/gpt-4o' (best)
      // Recommended: Use paid DeepSeek (extremely cheap) to avoid rate limits
      const model = 'deepseek/deepseek-chat';
      
      console.log(`   Model: ${model}`);

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
      console.error(`❌ Error on attempt ${attempt}: ${error.message}`);
      
      // If this was the last attempt, return null
      if (attempt === maxRetries) {
        console.log(`  ⏭️  Max retries reached, skipping...\n`);
        return null;
      }

      // Wait before retrying (longer delay for rate limit errors)
      const waitTime = error.message.includes('429') || error.message.includes('Rate limit') ? 10000 : 3000;
      console.log(`  🔄 Retrying in ${waitTime/1000} seconds...\n`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  return null;
}

// Function to format email with proper line spacing
function formatEmail(companyName, admiration) {
  return `Hi ${companyName},


I've long admired your company. ${admiration}

I am Jordan. We specialize in providing enterprise AI services for companies or individuals in need of AI transformation. We have assisted many businesses in using AI to streamline operations, double their performance, perfectly create brand characteristics, and enhance customer engagement. I wonder if you would be interested in having a brief conversation to see how we can assist your company? Looking forward to your reply!


Best regards,
Jordan`;
}

// Function to process a batch of records
async function processBatch(sheets, spreadsheetId, sheetName, results, startIndex, count) {
  // Validate and adjust indices
  const totalResults = results.length;
  const actualStart = Math.max(1, Math.min(startIndex, totalResults));
  const actualCount = Math.min(count, totalResults - actualStart + 1);
  
  if (actualStart > totalResults) {
    console.log(`⚠️  Starting index ${startIndex} is beyond the total ${totalResults} results.`);
    return { success: false };
  }

  // Get the batch to process
  const batchResults = results.slice(actualStart - 1, actualStart - 1 + actualCount);
  
  console.log(`\n📧 Processing batch: Records ${actualStart} to ${actualStart + actualCount - 1} (${actualCount} records)\n`);
  console.log(`⚙️  Settings: 3 retry attempts per email\n`);
  
  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;
  let skippedExistingEmail = 0;

  const startTime = Date.now();

  for (let i = 0; i < batchResults.length; i++) {
    const result = batchResults[i];
    const globalIndex = actualStart + i;
    
    // Skip if already has sales email
    if (result.hasExistingSalesEmail) {
      console.log(`⏭️  [${globalIndex}/${totalResults}] Row ${result.rowIndex}: Already has sales email, skipping...`);
      console.log(`  Company: ${result.companyName}`);
      console.log(`  Email preview: "${result.salesEmail.substring(0, 80)}..."\n`);
      skippedExistingEmail++;
      continue;
    }
    
    // Skip if no link or no company name
    if (!result.link) {
      console.log(`⏭️  [${globalIndex}/${totalResults}] Row ${result.rowIndex}: No link found, skipping...\n`);
      skippedCount++;
      continue;
    }

    if (!result.companyName) {
      console.log(`⏭️  [${globalIndex}/${totalResults}] Row ${result.rowIndex}: No company name, skipping...\n`);
      skippedCount++;
      continue;
    }

    console.log(`[${globalIndex}/${totalResults}] Processing row ${result.rowIndex}:`);
    console.log(`  Company: ${result.companyName}`);
    console.log(`  URL: ${result.link}`);

    const rowStartTime = Date.now();

    // Step 1: Fetch web content
    const webContent = await fetchWebContent(result.link);
    
    if (!webContent) {
      console.log(`  ❌ Failed to fetch web content, skipping...\n`);
      failCount++;
      continue;
    }

    // Step 2: Generate email with retry
    const emailResult = await generateEmailWithRetry(result.companyName, webContent, 3);
    
    if (!emailResult) {
      console.log(`  ❌ Failed to generate email after retries, skipping...\n`);
      failCount++;
      continue;
    }

    // Step 3: Format email
    const formattedEmail = formatEmail(result.companyName, emailResult.admiration);

    // Step 4: Update Google Sheets immediately
    const updated = await updateSalesEmail(sheets, spreadsheetId, sheetName, result.rowIndex, formattedEmail);

    const rowDuration = ((Date.now() - rowStartTime) / 1000).toFixed(1);
    console.log(`  ⏱️  Processing time: ${rowDuration}s`);

    if (updated) {
      console.log(`  💾 Updated row ${result.rowIndex} with sales email`);
      console.log(`  📧 Email preview (first 100 chars):`);
      console.log(`     "${formattedEmail.substring(0, 100)}..."\n`);
      successCount++;
    } else {
      console.log(`  ❌ Failed to update row ${result.rowIndex} in sheet\n`);
      failCount++;
    }

    // Add a delay to avoid rate limiting
    // Increase delay if using free models to avoid 429 errors
    if (i < batchResults.length - 1) {
      console.log(`  ⏸️  Waiting 5 seconds before next...\n`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  const totalDuration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  // Batch Summary
  console.log('========================================');
  console.log('📊 Batch Generation Summary:');
  console.log('========================================');
  console.log(`  📍 Processed records: ${actualStart} to ${actualStart + actualCount - 1}`);
  console.log(`  ✅ Successfully generated: ${successCount}`);
  console.log(`  ❌ Failed: ${failCount}`);
  console.log(`  ⏭️  Skipped (no link/name): ${skippedCount}`);
  console.log(`  📧 Skipped (already has email): ${skippedExistingEmail}`);
  console.log(`  📝 Batch total: ${batchResults.length}`);
  console.log(`  ⏰ Batch time: ${totalDuration} minutes`);
  console.log('========================================\n');
  
  if (successCount > 0) {
    console.log(`✅ Success rate: ${((successCount / batchResults.length) * 100).toFixed(1)}%`);
  }
  console.log('');

  return {
    success: true,
    successCount,
    failCount,
    skippedCount,
    skippedExistingEmail,
    totalProcessed: batchResults.length
  };
}

// Main function
async function main() {
  console.log('===========================================');
  console.log('   AI Sales Email Generator');
  console.log('   (Reading from Google Sheets)');
  console.log('===========================================\n');

  // Check if API keys are set
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ Error: OPENROUTER_API_KEY not found in .env file');
    console.error('Please add: OPENROUTER_API_KEY=your-key to your .env file');
    rl.close();
    process.exit(1);
  }

  if (!process.env.GOOGLE_SPREADSHEET_ID) {
    console.error('❌ Error: GOOGLE_SPREADSHEET_ID not found in .env file');
    console.error('Please make sure your .env file has the spreadsheet ID');
    rl.close();
    process.exit(1);
  }

  // Step 1: Read data from Google Sheets
  console.log('📊 Step 1: Reading data from Google Sheets...\n');
  const sheetData = await readSheetData();
  
  if (!sheetData || !sheetData.results || sheetData.results.length === 0) {
    console.log('No data found in the sheet. Please run search.js and extract_contacts.js first.');
    rl.close();
    process.exit(0);
  }

  const { sheets, spreadsheetId, sheetName, results } = sheetData;

  // Step 2: Ensure Sales Email header exists
  await ensureSalesEmailHeader(sheets, spreadsheetId, sheetName);

  console.log(`📋 Total records available: ${results.length}\n`);

  // Interactive batch processing loop
  let continueProcessing = true;

  while (continueProcessing) {
    try {
      // Ask for starting index
      const startAnswer = await question(`從第幾筆開始？(1-${results.length}): `);
      const startIndex = parseInt(startAnswer);

      if (isNaN(startIndex) || startIndex < 1) {
        console.log('⚠️  請輸入有效的數字\n');
        continue;
      }

      if (startIndex > results.length) {
        console.log(`⚠️  起始位置超過總數量 (${results.length})\n`);
        continue;
      }

      // Ask for count
      const maxCount = results.length - startIndex + 1;
      const countAnswer = await question(`要處理幾筆？(1-${maxCount}): `);
      const count = parseInt(countAnswer);

      if (isNaN(count) || count < 1) {
        console.log('⚠️  請輸入有效的數字\n');
        continue;
      }

      // Process the batch
      const batchResult = await processBatch(sheets, spreadsheetId, sheetName, results, startIndex, count);

      if (!batchResult.success) {
        console.log('❌ 批次處理失敗\n');
      }

      // Ask if user wants to continue
      const continueAnswer = await question('還要繼續處理嗎？(yes/no): ');
      
      if (continueAnswer.toLowerCase() === 'yes' || continueAnswer.toLowerCase() === 'y') {
        console.log('\n' + '='.repeat(50) + '\n');
        continueProcessing = true;
      } else {
        console.log('\n🎉 處理完成！感謝使用！\n');
        continueProcessing = false;
        rl.close();
      }

    } catch (error) {
      console.error('發生錯誤:', error.message);
      rl.close();
      continueProcessing = false;
    }
  }
}

// Run the script
main().catch(error => {
  console.error('Script failed:', error.message);
  process.exit(1);
});

