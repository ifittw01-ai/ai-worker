# Google Custom Search API Tool

A Node.js application that performs Google Custom Search with dynamic user input for search keywords and locations.

## Features

- Interactive command-line interface
- Dynamic search keyword and location input
- Display search results in a formatted way
- **✨ Save results directly to Google Spreadsheet**
- Option to save results to JSON file
- Support for multiple consecutive searches

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Get your Google Custom Search API credentials:
   - **API Key**: Visit [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and create an API key
   - **Search Engine ID**: Visit [Programmable Search Engine](https://programmablesearchengine.google.com/) and create a custom search engine

4. **For Google Sheets Integration** (Optional but recommended):
   - See detailed setup guide: [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md)
   - You'll need to create a service account and get credentials

5. Update the `.env` file with your credentials:
   ```env
   # Google Search API
   GOOGLE_API_KEY=your_actual_api_key
   GOOGLE_SEARCH_ENGINE_ID=your_actual_search_engine_id
   
   # Google Sheets API (optional)
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GOOGLE_SPREADSHEET_ID=your_spreadsheet_id
   ```

## Usage

Run the program:
```bash
npm start
```

or

```bash
node search.js
```

The program will prompt you to:
1. Enter a search keyword (e.g., "interior design company")
2. Enter a search location (e.g., "Malaysia")
3. View the search results
4. Optionally save the results to Google Sheets
5. Optionally save the results to `search_results.json`
6. Optionally perform another search

## Example

```
===========================================
   Google Custom Search API Tool
===========================================

Enter search keyword: restaurant
Enter search location: New York

Searching for: "restaurant New York"...

========== SEARCH RESULTS (1,234,567 total) ==========

1. Best Restaurants in New York City
   Link: https://example.com/restaurants
   Snippet: Find the best restaurants in New York City...

2. Top 10 NYC Restaurants
   Link: https://example.com/top-restaurants
   Snippet: Explore the top-rated restaurants...

...

======================================

Do you want to save the results to Google Sheets? (yes/no): yes
✅ Results saved to Google Spreadsheet!
   Spreadsheet ID: 1234567890abcdefg
   View at: https://docs.google.com/spreadsheets/d/1234567890abcdefg

Do you want to save the results to a JSON file? (yes/no): no

Do you want to perform another search? (yes/no): no
Thank you for using the search tool!
```

## Notes

- The free tier of Google Custom Search API allows 100 queries per day
- **The tool fetches 30 results per search** (using 3 API requests)
  - This means you can perform ~33 searches per day with the free tier
  - To change the number of results, modify `totalResults` parameter in the code
- Make sure to keep your `.env` file private and never commit it to version control
- **Google Sheets integration is optional** - the tool will still work without it
- For detailed Google Sheets setup instructions, see [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md)

