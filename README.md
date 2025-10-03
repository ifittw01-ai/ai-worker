# Google Custom Search API Tool

A Node.js application that performs Google Custom Search with dynamic user input for search keywords and locations.

## Features

- Interactive command-line interface
- Dynamic search keyword and location input
- Display search results in a formatted way
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

4. Update the `.env` file with your credentials:
   ```
   GOOGLE_API_KEY=your_actual_api_key
   GOOGLE_SEARCH_ENGINE_ID=your_actual_search_engine_id
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
4. Optionally save the results to `search_results.json`
5. Optionally perform another search

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

Do you want to save the results to a file? (yes/no): yes
Results saved to search_results.json

Do you want to perform another search? (yes/no): no
Thank you for using the search tool!
```

## Notes

- The free tier of Google Custom Search API allows 100 queries per day
- Results are limited to 10 per search (configurable in the code)
- Make sure to keep your `.env` file private and never commit it to version control

