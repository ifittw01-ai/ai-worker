const axios = require('axios');
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

// Function to perform Google Custom Search
async function googleSearch(query, location) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey || !searchEngineId) {
      console.error('Error: Please set GOOGLE_API_KEY and GOOGLE_SEARCH_ENGINE_ID in .env file');
      return null;
    }

    // Combine query with location
    const searchQuery = `${query} ${location}`;
    
    console.log(`\nSearching for: "${searchQuery}"...\n`);

    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: apiKey,
        cx: searchEngineId,
        q: searchQuery,
        num: 10 // Number of results to return
      }
    });

    return response.data;
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

      // Ask if user wants to save results
      const saveChoice = await question('Do you want to save the results to a file? (yes/no): ');
      
      if (saveChoice.toLowerCase() === 'yes' || saveChoice.toLowerCase() === 'y') {
        await saveResults(results, keyword, location);
      }

      // Ask if user wants to search again
      const continueChoice = await question('Do you want to perform another search? (yes/no): ');
      
      if (continueChoice.toLowerCase() === 'yes' || continueChoice.toLowerCase() === 'y') {
        rl.close();
        // Restart the readline interface
        const newRl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        Object.assign(rl, newRl);
        await main();
      } else {
        console.log('Thank you for using the search tool!');
        rl.close();
      }
    } else {
      console.log('Search failed. Please try again.');
      rl.close();
    }
  } catch (error) {
    console.error('An error occurred:', error.message);
    rl.close();
  }
}

// Run the program
main();

