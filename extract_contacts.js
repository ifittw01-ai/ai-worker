const Firecrawl = require('@mendable/firecrawl-js').default;
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

// Initialize Firecrawl with API key from .env
const firecrawl = new Firecrawl({
  apiKey: process.env.FIRECRAWL_API_KEY
});

// Define the schema for extraction
const schema = {
  type: 'object',
  properties: {
    company_name: {
      type: 'string',
      description: 'The name of the company'
    },
    telephone: {
      type: 'string',
      description: 'The contact telephone or phone number'
    },
    contact_email: {
      type: 'string',
      description: 'The contact email address'
    }
  },
  required: ['company_name']
};

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
      console.error('Please provide either:');
      console.error('  1. .google-credentials.json file, OR');
      console.error('  2. GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in .env');
      return null;
    }

    const sheets = google.sheets({ version: 'v4', auth });
    
    return sheets;
  } catch (error) {
    console.error('Error authenticating with Google Sheets:', error.message);
    return null;
  }
}

// Function to read search results from Google Sheets
async function readSearchResults() {
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

    // Read all data from the sheet
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
      companyName: row[5] || '', // Existing data if any
      telephone: row[6] || '',
      contactEmail: row[7] || '',
      salesEmail: row[8] || '',
      ifEverExtract: row[9] || 0, // Column J: if ever extract flag
      hasExistingData: !!(row[5] || row[6] || row[7]), // Check if any contact data exists
      hasBeenExtracted: (row[9] == 1) // Check if already extracted (as string or number)
    }));

    console.log(`Found ${results.length} search results in the sheet.\n`);

    return { sheets, spreadsheetId, sheetName, results };

  } catch (error) {
    console.error('Error reading from Google Sheets:', error.message);
    return null;
  }
}

// Function to create a timeout promise
function createTimeout(seconds) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Timeout: Operation took longer than ${seconds} seconds`));
    }, seconds * 1000);
  });
}

// Function to extract contact information from a single website with retry and timeout
async function extractContactFromWebsite(url, maxRetries = 2, timeoutSeconds = 20) {
  const emptyResult = {
    company_name: '',
    telephone: '',
    contact_email: ''
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`  Extracting from: ${url} (Attempt ${attempt}/${maxRetries})`);

      // Create the extraction promise
      const extractionPromise = firecrawl.extract({
        urls: [url],
        prompt: 'Extract the company name, contact telephone/phone number, and contact email address',
        schema: schema
      });

      // Race between extraction and timeout
      const result = await Promise.race([
        extractionPromise,
        createTimeout(timeoutSeconds)
      ]);

      if (result.success && result.data) {
        const data = Array.isArray(result.data) ? result.data[0] : result.data;
        console.log(`  ✅ Success on attempt ${attempt}`);
        return {
          company_name: data.company_name || '',
          telephone: data.telephone || '',
          contact_email: data.contact_email || ''
        };
      }

      console.log(`  ⚠️  No data returned on attempt ${attempt}`);
      
      // If this was the last attempt, return empty
      if (attempt === maxRetries) {
        console.log(`  ⏭️  Max retries reached, skipping...`);
        return emptyResult;
      }

      // Wait before retrying
      console.log(`  🔄 Retrying in 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      if (error.message.includes('Timeout')) {
        console.error(`  ⏱️  Timeout (>${timeoutSeconds}s) on attempt ${attempt}`);
      } else {
        console.error(`  ❌ Error on attempt ${attempt}: ${error.message}`);
      }

      // If this was the last attempt, return empty and skip
      if (attempt === maxRetries) {
        console.log(`  ⏭️  Max retries reached, skipping to next...`);
        return emptyResult;
      }

      // Wait before retrying
      console.log(`  🔄 Retrying in 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return emptyResult;
}

// Function to update Google Sheets with extracted data
async function updateSheetRow(sheets, spreadsheetId, sheetName, rowIndex, companyName, telephone, contactEmail) {
  try {
    // Update columns F, G, H, J (Company Name, Telephone, Contact Email, if ever extract)
    // Note: Column I (Sales Email) is skipped, will be filled by generate_email.js
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!F${rowIndex}:H${rowIndex}`,
      valueInputOption: 'RAW',
      resource: {
        values: [[companyName, telephone, contactEmail]]
      }
    });
    
    // Update column J (if ever extract) to 1
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!J${rowIndex}`,
      valueInputOption: 'RAW',
      resource: {
        values: [[1]]
      }
    });

    return true;
  } catch (error) {
    console.error(`Error updating row ${rowIndex}:`, error.message);
    return false;
  }
}

// Function to add headers if needed
async function ensureHeaders(sheets, spreadsheetId, sheetName) {
  try {
    // Check if headers exist in columns F, G, H
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!F1:H1`
    });

    const headers = response.data.values?.[0] || [];
    
    // If headers are missing or incomplete, add them
    if (headers.length < 3) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!F1:H1`,
        valueInputOption: 'RAW',
        resource: {
          values: [['Company Name', 'Telephone', 'Contact Email']]
        }
      });
      console.log('✅ Added headers to columns F, G, H\n');
    }
  } catch (error) {
    console.log('Note: Could not verify headers');
  }
}

// Function to process a batch of results
async function processBatch(sheets, spreadsheetId, sheetName, results, startIndex, count) {
  // Validate and adjust indices
  const totalResults = results.length;
  const actualStart = Math.max(1, Math.min(startIndex, totalResults));
  const actualCount = Math.min(count, totalResults - actualStart + 1);
  
  if (actualStart > totalResults) {
    console.log(`⚠️  Starting index ${startIndex} is beyond the total ${totalResults} results.`);
    return { success: false };
  }

  // Get the batch to process (array indices are 0-based, but user input is 1-based)
  const batchResults = results.slice(actualStart - 1, actualStart - 1 + actualCount);
  
  console.log(`\n🔍 Processing batch: Records ${actualStart} to ${actualStart + actualCount - 1} (${actualCount} records)\n`);
  console.log(`⚙️  Settings: 20 second timeout, 2 retry attempts per URL\n`);
  
  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;
  let skippedExistingData = 0;
  let timeoutCount = 0;

  const startTime = Date.now();

  for (let i = 0; i < batchResults.length; i++) {
    const result = batchResults[i];
    const globalIndex = actualStart + i;
    
    // Skip if no link
    if (!result.link) {
      console.log(`⏭️  Row ${result.rowIndex}: No link found, skipping...\n`);
      skippedCount++;
      continue;
    }

    // Skip if already extracted (check 'if ever extract' flag)
    if (result.hasBeenExtracted) {
      console.log(`⏭️  Row ${result.rowIndex}: Already extracted before (if ever extract = 1), skipping...`);
      console.log(`  Title: ${result.title}\n`);
      skippedExistingData++;
      continue;
    }

    console.log(`[${globalIndex}/${totalResults}] Processing row ${result.rowIndex}:`);
    console.log(`  Title: ${result.title}`);
    console.log(`  URL: ${result.link}`);

    const rowStartTime = Date.now();

    // Extract contact information with retry and timeout
    const contactInfo = await extractContactFromWebsite(result.link, 2, 20);

    const rowDuration = ((Date.now() - rowStartTime) / 1000).toFixed(1);
    console.log(`  ⏱️  Processing time: ${rowDuration}s`);

    // Check if extraction was successful
    const hasData = contactInfo.company_name || contactInfo.telephone || contactInfo.contact_email;

    if (hasData) {
      // Display results
      console.log(`  📋 Results:`);
      console.log(`     Company: ${contactInfo.company_name || 'Not found'}`);
      console.log(`     Telephone: ${contactInfo.telephone || 'Not found'}`);
      console.log(`     Email: ${contactInfo.contact_email || 'Not found'}`);
    } else {
      console.log(`  ⚠️  No data extracted (timeout or error)`);
      if (parseFloat(rowDuration) >= 20) {
        timeoutCount++;
      } else {
        failCount++;
      }
    }

    // Update the sheet (even with empty data to mark as processed)
    const updated = await updateSheetRow(
      sheets,
      spreadsheetId,
      sheetName,
      result.rowIndex,
      contactInfo.company_name,
      contactInfo.telephone,
      contactInfo.contact_email
    );

    if (updated) {
      if (hasData) {
        console.log(`  💾 Updated row ${result.rowIndex} with data`);
        successCount++;
      } else {
        console.log(`  💾 Updated row ${result.rowIndex} (marked as processed, no data)`);
      }
    } else {
      console.log(`  ❌ Failed to update row ${result.rowIndex} in sheet`);
    }

    console.log('');

    // Add a small delay to avoid rate limiting
    if (i < batchResults.length - 1) {
      console.log(`  ⏸️  Waiting 1 second before next...\n`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const totalDuration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  // Batch Summary
  console.log('========================================');
  console.log('📊 Batch Extraction Summary:');
  console.log('========================================');
  console.log(`  📍 Processed records: ${actualStart} to ${actualStart + actualCount - 1}`);
  console.log(`  ✅ Successfully extracted: ${successCount}`);
  console.log(`  ⏱️  Timed out (>20s): ${timeoutCount}`);
  console.log(`  ❌ Failed (errors): ${failCount}`);
  console.log(`  ⏭️  Skipped (no link): ${skippedCount}`);
  console.log(`  📋 Skipped (already extracted): ${skippedExistingData}`);
  console.log(`  📝 Batch total: ${batchResults.length}`);
  console.log(`  ⏰ Batch time: ${totalDuration} minutes`);
  console.log('========================================\n');
  
  // Additional info
  if (timeoutCount > 0) {
    console.log(`⚠️  Note: ${timeoutCount} website(s) timed out after 20 seconds and were skipped.`);
  }
  if (failCount > 0) {
    console.log(`⚠️  Note: ${failCount} website(s) failed to extract data due to errors.`);
  }
  if (successCount > 0) {
    console.log(`✅ Success rate: ${((successCount / batchResults.length) * 100).toFixed(1)}%`);
  }
  console.log('');

  return {
    success: true,
    successCount,
    failCount,
    timeoutCount,
    skippedCount,
    skippedExistingData,
    totalProcessed: batchResults.length
  };
}

// Main execution
async function main() {
  console.log('===========================================');
  console.log('   Firecrawl Contact Extraction Tool');
  console.log('   (Reading from Google Sheets)');
  console.log('===========================================\n');

  // Check if API keys are set
  if (!process.env.FIRECRAWL_API_KEY) {
    console.error('Error: FIRECRAWL_API_KEY not found in .env file');
    console.error('Please add: FIRECRAWL_API_KEY=fc-YOUR-API-KEY to your .env file');
    rl.close();
    process.exit(1);
  }

  if (!process.env.GOOGLE_SPREADSHEET_ID) {
    console.error('Error: GOOGLE_SPREADSHEET_ID not found in .env file');
    console.error('Please make sure your .env file has the spreadsheet ID');
    rl.close();
    process.exit(1);
  }

  // Step 1: Read search results from Google Sheets
  console.log('📊 Step 1: Reading search results from Google Sheets...\n');
  const sheetData = await readSearchResults();
  
  if (!sheetData || !sheetData.results || sheetData.results.length === 0) {
    console.log('No search results found in the sheet. Please run search.js first.');
    rl.close();
    process.exit(0);
  }

  const { sheets, spreadsheetId, sheetName, results } = sheetData;

  // Step 2: Ensure headers are present
  await ensureHeaders(sheets, spreadsheetId, sheetName);

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

