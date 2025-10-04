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

// Function to perform Google Custom Search
async function googleSearch(query, location, totalResults = 30) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey || !searchEngineId) {
      console.error('Error: Please set GOOGLE_API_KEY and GOOGLE_SEARCH_ENGINE_ID in .env file');
      return null;
    }

    // Combine query with location
    const searchQuery = `${query} ${location}`;
    
    console.log(`\nSearching for: "${searchQuery}"...`);
    console.log(`Fetching ${totalResults} results...\n`);

    // Google Custom Search API allows max 10 results per request
    const maxPerRequest = 10;
    const numRequests = Math.ceil(totalResults / maxPerRequest);
    
    let allItems = [];
    let searchInformation = null;

    // Make multiple requests to get all results
    for (let i = 0; i < numRequests; i++) {
      const startIndex = i * maxPerRequest + 1;
      const numResults = Math.min(maxPerRequest, totalResults - i * maxPerRequest);
      
      console.log(`Fetching results ${startIndex}-${startIndex + numResults - 1}...`);
      
      try {
        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
          params: {
            key: apiKey,
            cx: searchEngineId,
            q: searchQuery,
            num: numResults,
            start: startIndex
          }
        });

        if (response.data.items) {
          allItems = allItems.concat(response.data.items);
        }

        if (!searchInformation) {
          searchInformation = response.data.searchInformation;
        }

        // Small delay to avoid rate limiting
        if (i < numRequests - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        if (error.response?.status === 429) {
          console.error('Rate limit reached. Returning results collected so far.');
          break;
        }
        throw error;
      }
    }

    console.log(`Successfully fetched ${allItems.length} results.\n`);

    return {
      items: allItems,
      searchInformation: searchInformation || { totalResults: allItems.length }
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
    const headerRow = ['Timestamp', 'Search Query', 'Title', 'Link', 'Snippet', 'Company Name', 'Telephone', 'Contact Email'];
    
    // Prepare data rows
    const timestamp = new Date().toISOString();
    const searchQuery = `${query} ${location}`;
    
    const rows = data.items.map(item => [
      timestamp,
      searchQuery,
      item.title || '',
      item.link || '',
      item.snippet || ''
    ]);

    // Try to get existing data to check if we need headers
    let needsHeader = false;
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A1:H1`,
      });
      needsHeader = !response.data.values || response.data.values.length === 0;
    } catch (error) {
      needsHeader = true;
    }

    // Append data (leave columns F, G, H empty for now - will be filled by extract_contacts.js)
    const values = needsHeader ? [headerRow, ...rows] : rows;
    
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:H`,
      valueInputOption: 'RAW',
      resource: {
        values,
      },
    });

    console.log(`✅ Results saved to Google Spreadsheet!`);
    console.log(`   Sheet: ${sheetName}`);
    console.log(`   Spreadsheet ID: ${spreadsheetId}`);
    console.log(`   View at: https://docs.google.com/spreadsheets/d/${spreadsheetId}\n`);
    
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

      // Perform search
      const results = await googleSearch(keyword, location);

      if (results) {
        // Display results
        displayResults(results);

        // Ask if user wants to save results to Google Sheets
        const saveSheetsChoice = await question('Do you want to save the results to Google Sheets? (yes/no): ');
        
        if (saveSheetsChoice.toLowerCase() === 'yes' || saveSheetsChoice.toLowerCase() === 'y') {
          await saveToGoogleSheets(results, keyword, location);
        }

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

