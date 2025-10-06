# Quick Start Guide 🚀

Get up and running with the AI Worker web interface in 3 simple steps!

## Prerequisites

Make sure you have:
- ✅ Node.js installed
- ✅ All required API keys in your `.env` file
- ✅ Google Sheets properly configured

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Start the Web Server

```bash
npm run server
```

You should see:
```
Server running at http://localhost:3000
```

## Step 3: Open in Browser

Open your web browser and navigate to:

```
http://localhost:3000
```

## 🎉 You're Ready!

You'll see a beautiful interface with 3 steps:

### 1️⃣ Search
- Enter keyword (e.g., "software companies")
- Enter region (e.g., "San Francisco")
- Check "Save to Google Sheets"
- Click "Start Search"

### 2️⃣ Extract Contacts
- Select range (e.g., From: 1, To: 10)
- Click "Extract Contacts"
- Wait for completion

### 3️⃣ Generate Emails
- Select range (e.g., From: 1, To: 10)
- Click "Generate Emails"
- View results in Google Sheet!

## 📊 View Your Results

After each step, click the "View Google Sheet" link to see your data being populated in real-time!

## ⚠️ Troubleshooting

**Port already in use?**
- Close any other applications using port 3000
- Or modify `const port = 3000;` in `server.js` to use a different port

**API errors?**
- Double-check your `.env` file has all required keys
- Verify your Google Sheets is properly shared with the service account

**Need help?**
- See [WEB_INTERFACE_GUIDE.md](WEB_INTERFACE_GUIDE.md) for detailed instructions
- See [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md) for Google Sheets setup

---

Happy automating! 🎊

