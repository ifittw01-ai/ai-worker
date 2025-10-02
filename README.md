# Google Custom Search API - Node.js Script

This Node.js script fetches the first 30 Google search results for the keyword "Interior Design Company" in Malaysia using Google's Custom Search JSON API.

## Prerequisites

1. **Google API Key**: You need a Google Cloud API key with Custom Search API enabled
2. **Custom Search Engine ID**: You need to create a Programmable Search Engine

## Setup Instructions

### Step 1: Get Google API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Custom Search API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Custom Search API"
   - Click "Enable"
4. Create an API Key:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key

### Step 2: Create Custom Search Engine

1. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Click "Add" or "Create" to create a new search engine
3. Configure your search engine:
   - **Sites to search**: Select "Search the entire web"
   - Give it a name (e.g., "My Search Engine")
4. After creating, click on your search engine
5. Go to "Setup" > "Basic" and find your **Search engine ID** (cx parameter)
6. Copy the Search Engine ID

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```
   GOOGLE_API_KEY=your_actual_api_key
   SEARCH_ENGINE_ID=your_actual_search_engine_id
   ```

### Step 5: Run the Script

```bash
npm start
```

Or:

```bash
node search.js
```

## Features

- ✅ Fetches 30 search results (3 API requests of 10 results each)
- ✅ Targets Malaysia as the search location
- ✅ Displays formatted results in the console
- ✅ Saves results to `search_results.json` file
- ✅ Includes error handling and validation
- ✅ Rate limiting protection with delays between requests

## Output

The script will:
1. Log search progress to the console
2. Display formatted search results with:
   - Title
   - URL
   - Snippet
   - Description (if available)
3. Save raw results to `search_results.json`

## API Limits

- **Free tier**: 100 queries per day
- **Results per query**: Maximum 10 results per API call
- To get 30 results, the script makes 3 API calls

## Notes

- The Custom Search JSON API is limited to 100 free queries per day
- For more queries, you'll need to enable billing in Google Cloud Console
- The script includes a 500ms delay between requests to avoid rate limiting
- Results are restricted to Malaysia using `gl=my` and `cr=countryMY` parameters

## Troubleshooting

### "API Error: Daily Limit Exceeded"
You've exceeded the 100 free queries per day. Wait until the next day or enable billing.

### "Invalid API Key"
Make sure you've copied the correct API key from Google Cloud Console and enabled the Custom Search API.

### "Invalid Search Engine ID"
Double-check your Search Engine ID from the Programmable Search Engine console.

### "No results found"
The search might be too specific or restricted. Try adjusting the search parameters in the script.

## License

ISC
