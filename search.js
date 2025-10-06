const axios = require('axios');
const readline = require('readline');
const { google } = require('googleapis');
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

// Function to get existing links from Google Sheets
async function getExistingLinks() {
  try {
    const sheets = await getGoogleSheetsClient();
    if (!sheets) return new Set();

    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    if (!spreadsheetId) return new Set();

    let sheetName = 'Sheet1';
    try {
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
      if (spreadsheet.data.sheets && spreadsheet.data.sheets.length > 0) {
        sheetName = spreadsheet.data.sheets[0].properties.title;
      }
    } catch (error) {
      // Sheet doesn't exist yet
      return new Set();
    }

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!D:D`, // Column D contains Links
      });

      const existingLinks = new Set();
      if (response.data.values) {
        // Skip header row
        for (let i = 1; i < response.data.values.length; i++) {
          if (response.data.values[i][0]) {
            existingLinks.add(response.data.values[i][0]);
          }
        }
      }
      return existingLinks;
    } catch (error) {
      return new Set();
    }
  } catch (error) {
    console.error('Error getting existing links:', error.message);
    return new Set();
  }
}

// Function to perform Google Custom Search with duplicate filtering
async function googleSearchWithDuplicateFilter(query, location, targetNewRecords) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey || !searchEngineId) {
      console.error('Error: Please set GOOGLE_API_KEY and GOOGLE_SEARCH_ENGINE_ID in .env file');
      return null;
    }

    // Combine query with location
    const searchQuery = `${query} ${location}`;
    
    console.log(`\n🎯 目標：找到 ${targetNewRecords} 筆新記錄（不重複）`);
    console.log(`搜尋關鍵字: "${searchQuery}"\n`);

    // Get existing links
    console.log('📋 讀取已存在的記錄...');
    const existingLinks = await getExistingLinks();
    console.log(`   已有 ${existingLinks.size} 筆記錄\n`);

    // Google Custom Search API allows max 10 results per request
    const maxPerRequest = 10;
    let startIndex = 1;
    let newItems = [];
    let totalFetched = 0;
    let totalSkipped = 0;
    const maxTotalResults = 100; // Google Custom Search API limit

    console.log('🔍 開始搜尋...\n');

    // Keep searching until we have enough new records
    while (newItems.length < targetNewRecords && startIndex <= maxTotalResults) {
      console.log(`📥 正在獲取第 ${startIndex}-${startIndex + maxPerRequest - 1} 筆搜尋結果...`);
      
      try {
        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
          params: {
            key: apiKey,
            cx: searchEngineId,
            q: searchQuery,
            num: maxPerRequest,
            start: startIndex
          }
        });

        if (response.data.items) {
          totalFetched += response.data.items.length;
          
          // Filter out duplicates
          const batchNewItems = response.data.items.filter(item => {
            if (existingLinks.has(item.link)) {
              totalSkipped++;
              console.log(`   ⏭️  跳過重複: ${item.title}`);
              return false;
            }
            // Also add to existingLinks to avoid duplicates within this search session
            existingLinks.add(item.link);
            return true;
          });

          newItems = newItems.concat(batchNewItems);
          
          if (batchNewItems.length > 0) {
            console.log(`   ✅ 找到 ${batchNewItems.length} 筆新記錄`);
          }
          
          console.log(`   📊 進度: ${newItems.length}/${targetNewRecords} 筆新記錄\n`);

          // Check if we have enough
          if (newItems.length >= targetNewRecords) {
            newItems = newItems.slice(0, targetNewRecords);
            break;
          }

          // Check if there are more results available
          if (!response.data.queries.nextPage) {
            console.log('⚠️  已到達搜尋結果的末尾\n');
            break;
          }
        } else {
          console.log('   ℹ️  此批次無結果\n');
          break;
        }

        // Move to next page
        startIndex += maxPerRequest;

        // Small delay to avoid rate limiting
        if (newItems.length < targetNewRecords) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }

      } catch (error) {
        if (error.response?.status === 429) {
          console.error('⚠️  達到API速率限制，停止搜尋\n');
          break;
        } else if (error.response?.status === 400) {
          console.error('⚠️  無更多搜尋結果\n');
          break;
        }
        throw error;
      }
    }

    console.log('=' .repeat(50));
    console.log('📊 搜尋完成統計:');
    console.log('=' .repeat(50));
    console.log(`   總共獲取: ${totalFetched} 筆搜尋結果`);
    console.log(`   跳過重複: ${totalSkipped} 筆`);
    console.log(`   新增記錄: ${newItems.length} 筆`);
    
    if (newItems.length < targetNewRecords) {
      console.log(`\n⚠️  注意: 只找到 ${newItems.length} 筆新記錄，未達目標 ${targetNewRecords} 筆`);
      console.log(`   建議: 更換搜尋關鍵字或地區以獲得更多結果`);
    } else {
      console.log(`\n✅ 成功找到目標數量的新記錄！`);
    }
    console.log('=' .repeat(50) + '\n');

    return {
      items: newItems,
      searchInformation: {
        totalResults: newItems.length,
        totalFetched: totalFetched,
        totalSkipped: totalSkipped
      }
    };
  } catch (error) {
    console.error('Error performing search:', error.response?.data?.error?.message || error.message);
    return null;
  }
}

// Function to display search results
function displayResults(data) {
  if (!data || !data.items || data.items.length === 0) {
    console.log('No results found.');
    return;
  }

  console.log(`\n========== SEARCH RESULTS (${data.searchInformation.totalResults} total) ==========\n`);

  data.items.forEach((item, index) => {
    console.log(`${index + 1}. ${item.title}`);
    console.log(`   Link: ${item.link}`);
    console.log(`   Snippet: ${item.snippet}`);
    console.log('');
  });

  console.log('======================================\n');
}

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

// Function to save results to Google Sheets
async function saveToGoogleSheets(data, query, location) {
  try {
    const sheets = await getGoogleSheetsClient();
    
    if (!sheets) {
      console.error('Failed to authenticate with Google Sheets');
      return false;
    }

    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      console.error('Error: Please set GOOGLE_SPREADSHEET_ID in .env file');
      return false;
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

    // Prepare header row (only if sheet is empty)
    const headerRow = ['Timestamp', 'Search Query', 'Title', 'Link', 'Snippet', 'Company Name', 'Telephone', 'Contact Email', 'Sales Email', 'if ever extract'];
    
    // Check if we need headers
    let needsHeader = false;
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A1:I1`,
      });
      needsHeader = !response.data.values || response.data.values.length === 0;
    } catch (error) {
      needsHeader = true;
    }
    
    // Prepare data rows (duplicates already filtered during search)
    const timestamp = new Date().toISOString();
    const searchQuery = `${query} ${location}`;
    
    const rows = data.items.map(item => [
      timestamp,
      searchQuery,
      item.title || '',
      item.link || '',
      item.snippet || '',
      '', // Company Name (empty, to be filled by extract)
      '', // Telephone (empty, to be filled by extract)
      '', // Contact Email (empty, to be filled by extract)
      '', // Sales Email (empty, to be filled by generate_email)
      0   // if ever extract (default 0)
    ]);

    if (rows.length === 0) {
      console.log(`ℹ️  No results to save.`);
      return true;
    }

    console.log(`\n💾 正在寫入 Google 試算表...`);

    // Append data (leave columns F, G, H, I, J for extract_contacts.js and generate_email.js)
    const values = needsHeader ? [headerRow, ...rows] : rows;
    
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:J`,
      valueInputOption: 'RAW',
      resource: {
        values,
      },
    });

    console.log(`✅ 成功寫入 ${rows.length} 筆新記錄！`);
    console.log(`   試算表: ${sheetName}`);
    console.log(`   ID: ${spreadsheetId}`);
    console.log(`   連結: https://docs.google.com/spreadsheets/d/${spreadsheetId}\n`);
    
    return true;
  } catch (error) {
    console.error('Error saving to Google Sheets:', error.message);
    return false;
  }
}

// Function to save results to file
async function saveResults(data, query, location) {
  const fs = require('fs');
  const filename = 'search_results.json';
  
  const saveData = {
    searchQuery: `${query} ${location}`,
    timestamp: new Date().toISOString(),
    results: data.items || []
  };

  fs.writeFileSync(filename, JSON.stringify(saveData, null, 2));
  console.log(`Results saved to ${filename}\n`);
}

// Main function
async function main() {
  console.log('===========================================');
  console.log('   Google Custom Search API Tool');
  console.log('===========================================\n');

  let continueSearching = true;

  while (continueSearching) {
    try {
      // Ask for search keyword
      const keyword = await question('Enter search keyword: ');
      
      if (!keyword.trim()) {
        console.log('Search keyword cannot be empty!');
        rl.close();
        return;
      }

      // Ask for search location
      const location = await question('Enter search location: ');
      
      if (!location.trim()) {
        console.log('Search location cannot be empty!');
        rl.close();
        return;
      }

      // Ask for number of NEW records to find
      const resultCountInput = await question('要找到幾筆新資料寫入試算表？(目標新增的記錄數量, 預設 30): ');
      let targetNewRecords = 30; // default value
      
      if (resultCountInput.trim()) {
        const parsed = parseInt(resultCountInput);
        if (isNaN(parsed) || parsed < 1) {
          console.log('⚠️  無效的數字，使用預設值 30 筆。');
          targetNewRecords = 30;
        } else if (parsed > 100) {
          console.log('⚠️  最多 100 筆，使用 100。');
          targetNewRecords = 100;
        } else {
          targetNewRecords = parsed;
        }
      }

      // Perform search with duplicate filtering
      const results = await googleSearchWithDuplicateFilter(keyword, location, targetNewRecords);

      if (results) {
        // Display results
        displayResults(results);

        // Always save to Google Sheets
        console.log('Saving results to Google Sheets...');
        await saveToGoogleSheets(results, keyword, location);

        // Ask if user wants to save results to JSON file
        const saveFileChoice = await question('Do you want to save the results to a JSON file? (yes/no): ');
        
        if (saveFileChoice.toLowerCase() === 'yes' || saveFileChoice.toLowerCase() === 'y') {
          await saveResults(results, keyword, location);
        }

        // Ask if user wants to search again
        const continueChoice = await question('Do you want to perform another search? (yes/no): ');
        
        if (continueChoice.toLowerCase() === 'yes' || continueChoice.toLowerCase() === 'y') {
          console.log('\n' + '='.repeat(43) + '\n');
          continueSearching = true;
        } else {
          console.log('Thank you for using the search tool!');
          continueSearching = false;
          rl.close();
        }
      } else {
        console.log('Search failed. Please try again.');
        rl.close();
        continueSearching = false;
      }
    } catch (error) {
      console.error('An error occurred:', error.message);
      rl.close();
      continueSearching = false;
    }
  }
}

// Run the program
main();

