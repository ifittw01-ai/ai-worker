const express = require('express');
const axios = require('axios');
const { google } = require('googleapis');
const Firecrawl = require('@mendable/firecrawl-js').default;
const OpenAI = require('openai');
const cheerio = require('cheerio');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Initialize clients
const firecrawl = new Firecrawl({
  apiKey: process.env.FIRECRAWL_API_KEY
});

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Google Sheets authentication
async function getGoogleSheetsClient() {
  try {
    const fs = require('fs');
    let auth;

    if (fs.existsSync('.google-credentials.json')) {
      const credentials = JSON.parse(fs.readFileSync('.google-credentials.json', 'utf8'));
      auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } else if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      auth = new google.auth.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } else {
      return null;
    }

    return google.sheets({ version: 'v4', auth });
  } catch (error) {
    console.error('Error authenticating with Google Sheets:', error.message);
    return null;
  }
}

// Helper function to get existing links from Google Sheets
async function getExistingLinksFromSheet() {
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
      return new Set();
    }

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!D:D`, // Column D contains Links
      });

      const existingLinks = new Set();
      if (response.data.values) {
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

// API endpoint: Perform search
app.post('/api/search', async (req, res) => {
  try {
    const { keyword, region, saveToSheets, resultCount } = req.body;

    if (!keyword || !region) {
      return res.status(400).json({ error: 'Keyword and region are required' });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey || !searchEngineId) {
      return res.status(500).json({ error: 'Google API credentials not configured' });
    }

    const searchQuery = `${keyword} ${region}`;
    // Use provided result count, default to 30, max 100
    let targetNewRecords = resultCount ? parseInt(resultCount) : 30;
    if (isNaN(targetNewRecords) || targetNewRecords < 1) {
      targetNewRecords = 30;
    } else if (targetNewRecords > 100) {
      targetNewRecords = 100;
    }
    
    // Get existing links to filter duplicates
    console.log('Getting existing links from sheet...');
    const existingLinks = await getExistingLinksFromSheet();
    console.log(`Found ${existingLinks.size} existing links.`);
    
    const maxPerRequest = 10;
    let startIndex = 1;
    let newItems = [];
    let totalFetched = 0;
    let totalSkipped = 0;
    const maxTotalResults = 100; // Google API limit
    let searchInformation = null;

    // Keep searching until we have enough new records
    while (newItems.length < targetNewRecords && startIndex <= maxTotalResults) {
      console.log(`Fetching results from ${startIndex}...`);
      
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
              console.log(`Skipping duplicate: ${item.link}`);
              return false;
            }
            existingLinks.add(item.link);
            return true;
          });

          newItems = newItems.concat(batchNewItems);
          console.log(`Found ${batchNewItems.length} new items. Progress: ${newItems.length}/${targetNewRecords}`);

          // Check if we have enough
          if (newItems.length >= targetNewRecords) {
            newItems = newItems.slice(0, targetNewRecords);
            break;
          }

          // Check if there are more results
          if (!response.data.queries.nextPage) {
            console.log('No more search results available.');
            break;
          }
        } else {
          break;
        }

        if (!searchInformation) {
          searchInformation = response.data.searchInformation;
        }

        startIndex += maxPerRequest;
        
        if (newItems.length < targetNewRecords) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (error) {
        if (error.response?.status === 429) {
          console.error('Rate limit reached.');
          break;
        } else if (error.response?.status === 400) {
          console.error('No more results available.');
          break;
        }
        throw error;
      }
    }

    console.log(`Search complete: ${newItems.length} new items found (${totalSkipped} duplicates skipped)`);

    const results = {
      items: newItems,
      searchInformation: searchInformation || { totalResults: newItems.length }
    };

    // Save to Google Sheets if requested
    let sheetUrl = null;
    
    if (saveToSheets && newItems.length > 0) {
      const sheets = await getGoogleSheetsClient();
      if (sheets) {
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
        
        if (spreadsheetId) {
          let sheetName = 'Sheet1';
          try {
            const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
            if (spreadsheet.data.sheets && spreadsheet.data.sheets.length > 0) {
              sheetName = spreadsheet.data.sheets[0].properties.title;
            }
          } catch (error) {
            console.log('Using default sheet name');
          }

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
          
          // Prepare rows (duplicates already filtered)
          const timestamp = new Date().toISOString();
          const rows = newItems.map(item => [
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

          const values = needsHeader ? [headerRow, ...rows] : rows;
          
          await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${sheetName}!A:J`,
            valueInputOption: 'RAW',
            resource: { values },
          });

          console.log(`Successfully saved ${rows.length} new records to sheet`);
          sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
        }
      }
    }

    res.json({
      success: true,
      totalFetched: totalFetched,
      newRecordsCount: newItems.length,
      skippedDuplicates: totalSkipped,
      results: newItems,
      sheetUrl,
      reachedTarget: newItems.length >= targetNewRecords
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint: Get sheet data count
app.get('/api/sheet-count', async (req, res) => {
  try {
    const sheets = await getGoogleSheetsClient();
    if (!sheets) {
      return res.status(500).json({ error: 'Failed to authenticate with Google Sheets' });
    }

    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    if (!spreadsheetId) {
      return res.status(500).json({ error: 'Spreadsheet ID not configured' });
    }

    let sheetName = 'Sheet1';
    try {
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
      if (spreadsheet.data.sheets && spreadsheet.data.sheets.length > 0) {
        sheetName = spreadsheet.data.sheets[0].properties.title;
      }
    } catch (error) {
      console.log('Using default sheet name');
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:J`,
    });

    const rows = response.data.values;
    const count = rows ? rows.length - 1 : 0; // Subtract header row
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    res.json({ success: true, count, sheetUrl, spreadsheetId });
  } catch (error) {
    console.error('Error getting sheet count:', error);
    res.status(500).json({ error: error.message });
  }
});

// Schema for Firecrawl extraction
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

// Function to extract contact info with timeout
function createTimeout(seconds) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Timeout: Operation took longer than ${seconds} seconds`));
    }, seconds * 1000);
  });
}

async function extractContactFromWebsite(url, maxRetries = 2, timeoutSeconds = 20) {
  const emptyResult = {
    company_name: '',
    telephone: '',
    contact_email: ''
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const extractionPromise = firecrawl.extract({
        urls: [url],
        prompt: 'Extract the company name, contact telephone/phone number, and contact email address',
        schema: schema
      });

      const result = await Promise.race([
        extractionPromise,
        createTimeout(timeoutSeconds)
      ]);

      if (result.success && result.data) {
        const data = Array.isArray(result.data) ? result.data[0] : result.data;
        return {
          company_name: data.company_name || '',
          telephone: data.telephone || '',
          contact_email: data.contact_email || ''
        };
      }

      if (attempt === maxRetries) {
        return emptyResult;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      if (attempt === maxRetries) {
        return emptyResult;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return emptyResult;
}

// API endpoint: Extract contacts
app.post('/api/extract-contacts', async (req, res) => {
  try {
    const { startIndex, endIndex } = req.body;

    if (!startIndex || !endIndex) {
      return res.status(400).json({ error: 'Start and end indices are required' });
    }

    const sheets = await getGoogleSheetsClient();
    if (!sheets) {
      return res.status(500).json({ error: 'Failed to authenticate with Google Sheets' });
    }

    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    if (!spreadsheetId) {
      return res.status(500).json({ error: 'Spreadsheet ID not configured' });
    }

    let sheetName = 'Sheet1';
    try {
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
      if (spreadsheet.data.sheets && spreadsheet.data.sheets.length > 0) {
        sheetName = spreadsheet.data.sheets[0].properties.title;
      }
    } catch (error) {
      console.log('Using default sheet name');
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:J`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'No data found in sheet' });
    }

    const results = rows.slice(1).map((row, index) => ({
      rowIndex: index + 2,
      link: row[3] || '',
      title: row[2] || '',
      companyName: row[5] || '',
      telephone: row[6] || '',
      contactEmail: row[7] || '',
      salesEmail: row[8] || '',
      ifEverExtract: row[9] || 0,
      hasBeenExtracted: (row[9] == 1)
    }));

    const start = parseInt(startIndex);
    const end = parseInt(endIndex);
    const count = end - start + 1;

    const batchResults = results.slice(start - 1, end);
    
    let successCount = 0;
    let failCount = 0;
    let skippedExistingData = 0;

    for (let i = 0; i < batchResults.length; i++) {
      const result = batchResults[i];
      
      if (!result.link) {
        failCount++;
        continue;
      }

      // Skip if already extracted (check 'if ever extract' flag)
      if (result.hasBeenExtracted) {
        console.log(`Skipping row ${result.rowIndex}: Already extracted before (if ever extract = 1)`);
        skippedExistingData++;
        continue;
      }

      const contactInfo = await extractContactFromWebsite(result.link, 2, 20);
      const hasData = contactInfo.company_name || contactInfo.telephone || contactInfo.contact_email;

      // Update contact info (columns F, G, H)
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!F${result.rowIndex}:H${result.rowIndex}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[contactInfo.company_name, contactInfo.telephone, contactInfo.contact_email]]
        }
      });

      // Update 'if ever extract' flag (column J) to 1
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!J${result.rowIndex}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[1]]
        }
      });

      if (hasData) {
        successCount++;
      } else {
        failCount++;
      }

      if (i < batchResults.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    res.json({
      success: true,
      processed: batchResults.length,
      successCount,
      failCount,
      skippedExistingData
    });

  } catch (error) {
    console.error('Extract contacts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Function to fetch web content
async function fetchWebContent(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    $('script, style, nav, footer, header').remove();
    
    let text = $('body').text();
    text = text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
    
    return text.substring(0, 3000);
  } catch (error) {
    return null;
  }
}

// Function to generate email with retry
async function generateEmailWithRetry(companyName, webContent, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const model = 'deepseek/deepseek-chat-v3.1:free';
      
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
      return result;

    } catch (error) {
      if (attempt === maxRetries) {
        return null;
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  return null;
}

function formatEmail(companyName, admiration) {
  return `Hi ${companyName},


I've long admired your company. ${admiration}

I am Jordan. We specialize in providing enterprise AI services for companies or individuals in need of AI transformation. We have assisted many businesses in using AI to streamline operations, double their performance, perfectly create brand characteristics, and enhance customer engagement. I wonder if you would be interested in having a brief conversation to see how we can assist your company? Looking forward to your reply!


Best regards,
Jordan`;
}

// API endpoint: Generate emails
app.post('/api/generate-emails', async (req, res) => {
  try {
    const { startIndex, endIndex } = req.body;

    if (!startIndex || !endIndex) {
      return res.status(400).json({ error: 'Start and end indices are required' });
    }

    const sheets = await getGoogleSheetsClient();
    if (!sheets) {
      return res.status(500).json({ error: 'Failed to authenticate with Google Sheets' });
    }

    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    if (!spreadsheetId) {
      return res.status(500).json({ error: 'Spreadsheet ID not configured' });
    }

    let sheetName = 'Sheet1';
    try {
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
      if (spreadsheet.data.sheets && spreadsheet.data.sheets.length > 0) {
        sheetName = spreadsheet.data.sheets[0].properties.title;
      }
    } catch (error) {
      console.log('Using default sheet name');
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:J`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'No data found in sheet' });
    }

    const results = rows.slice(1).map((row, index) => ({
      rowIndex: index + 2,
      link: row[3] || '',
      companyName: row[5] || '',
      salesEmail: row[8] || '',
      hasExistingSalesEmail: !!(row[8])
    }));

    const start = parseInt(startIndex);
    const end = parseInt(endIndex);

    const batchResults = results.slice(start - 1, end);
    
    let successCount = 0;
    let failCount = 0;
    let skippedExistingEmail = 0;

    for (let i = 0; i < batchResults.length; i++) {
      const result = batchResults[i];
      
      // Skip if already has sales email
      if (result.hasExistingSalesEmail) {
        console.log(`Skipping row ${result.rowIndex}: Already has sales email`);
        skippedExistingEmail++;
        continue;
      }
      
      if (!result.link || !result.companyName) {
        failCount++;
        continue;
      }

      const webContent = await fetchWebContent(result.link);
      if (!webContent) {
        failCount++;
        continue;
      }

      const emailResult = await generateEmailWithRetry(result.companyName, webContent, 3);
      if (!emailResult) {
        failCount++;
        continue;
      }

      const formattedEmail = formatEmail(result.companyName, emailResult.admiration);

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!I${result.rowIndex}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[formattedEmail]]
        }
      });

      successCount++;

      if (i < batchResults.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    res.json({
      success: true,
      processed: batchResults.length,
      successCount,
      failCount,
      skippedExistingEmail
    });

  } catch (error) {
    console.error('Generate emails error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log('🚀 伺服器已啟動！');
  console.log('📊 請開啟瀏覽器使用網頁介面');
});

