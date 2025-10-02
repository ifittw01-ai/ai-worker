require('dotenv').config();
const axios = require('axios');

// Configuration
const API_KEY = process.env.GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID;
const SEARCH_QUERY = 'Interior Design Company';
const SEARCH_LOCATION = 'Malaysia';
const RESULTS_PER_PAGE = 10; // Google's API limit per request
const TOTAL_RESULTS = 30;

/**
 * Fetch Google search results using Custom Search JSON API
 * @param {string} query - Search query
 * @param {number} startIndex - Starting index for results (1-based)
 * @returns {Promise<Object>} - Search results
 */
async function fetchSearchResults(query, startIndex = 1) {
  try {
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: API_KEY,
        cx: SEARCH_ENGINE_ID,
        q: query,
        start: startIndex,
        gl: 'my', // Country code for Malaysia
        cr: 'countryMY', // Restrict results to Malaysia
        num: RESULTS_PER_PAGE
      }
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('API Error:', error.response.data.error);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

/**
 * Get multiple pages of search results
 * @param {string} query - Search query
 * @param {number} totalResults - Total number of results to fetch
 * @returns {Promise<Array>} - Array of all search results
 */
async function getAllSearchResults(query, totalResults) {
  const allResults = [];
  const numberOfRequests = Math.ceil(totalResults / RESULTS_PER_PAGE);

  console.log(`\n${'='.repeat(80)}`);
  console.log(`Searching for: "${query}"`);
  console.log(`Location: ${SEARCH_LOCATION}`);
  console.log(`Fetching ${totalResults} results (${numberOfRequests} API requests)...`);
  console.log(`${'='.repeat(80)}\n`);

  for (let i = 0; i < numberOfRequests; i++) {
    const startIndex = i * RESULTS_PER_PAGE + 1;
    console.log(`Fetching results ${startIndex} to ${Math.min(startIndex + RESULTS_PER_PAGE - 1, totalResults)}...`);

    try {
      const data = await fetchSearchResults(query, startIndex);

      if (data.items && data.items.length > 0) {
        allResults.push(...data.items);
        console.log(`✓ Successfully fetched ${data.items.length} results\n`);
      } else {
        console.log('⚠ No more results available\n');
        break;
      }

      // Add a small delay between requests to avoid rate limiting
      if (i < numberOfRequests - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`Failed to fetch results starting at index ${startIndex}`);
      break;
    }
  }

  return allResults.slice(0, totalResults);
}

/**
 * Display search results in a formatted way
 * @param {Array} results - Array of search results
 */
function displayResults(results) {
  console.log(`${'='.repeat(80)}`);
  console.log(`SEARCH RESULTS (Total: ${results.length})`);
  console.log(`${'='.repeat(80)}\n`);

  results.forEach((item, index) => {
    console.log(`${index + 1}. ${item.title}`);
    console.log(`   URL: ${item.link}`);
    console.log(`   Snippet: ${item.snippet}`);
    if (item.pagemap && item.pagemap.metatags && item.pagemap.metatags[0]) {
      const metatags = item.pagemap.metatags[0];
      if (metatags['og:description']) {
        console.log(`   Description: ${metatags['og:description']}`);
      }
    }
    console.log('');
  });

  console.log(`${'='.repeat(80)}\n`);
}

/**
 * Main function
 */
async function main() {
  // Validate environment variables
  if (!API_KEY) {
    console.error('Error: GOOGLE_API_KEY is not set in .env file');
    console.log('\nPlease follow these steps:');
    console.log('1. Go to https://console.cloud.google.com/');
    console.log('2. Create a new project or select an existing one');
    console.log('3. Enable the Custom Search API');
    console.log('4. Create credentials (API Key)');
    console.log('5. Add the API key to your .env file');
    process.exit(1);
  }

  if (!SEARCH_ENGINE_ID) {
    console.error('Error: SEARCH_ENGINE_ID is not set in .env file');
    console.log('\nPlease follow these steps:');
    console.log('1. Go to https://programmablesearchengine.google.com/');
    console.log('2. Create a new search engine');
    console.log('3. Configure it to search the entire web');
    console.log('4. Copy the Search Engine ID');
    console.log('5. Add the Search Engine ID to your .env file');
    process.exit(1);
  }

  try {
    const results = await getAllSearchResults(SEARCH_QUERY, TOTAL_RESULTS);
    displayResults(results);

    // Optionally save results to a JSON file
    const fs = require('fs');
    const outputFile = 'search_results.json';
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    console.log(`Results saved to ${outputFile}`);
  } catch (error) {
    console.error('Failed to complete search:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
