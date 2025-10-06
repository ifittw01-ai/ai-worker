# Web Interface Visual Preview

## 🎨 What the Interface Looks Like

### Overall Design
- **Background**: Beautiful purple gradient (light purple to deep purple)
- **Main Container**: Clean white card with rounded corners and shadow
- **Typography**: Modern system fonts, easy to read
- **Colors**: Professional purple theme with green for success, red for errors

---

## 📸 Screen 1: Search Step

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║                     🚀 AI Worker                                 ║
║              Business Development Automation Tool                ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Step Progress:                                                  │
│  ●━━━━━━━━━━━━━○━━━━━━━━━━━━━○                                │
│  1. Search      2. Extract     3. Emails                         │
│  (ACTIVE)       Contacts       Generate                          │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Search for Companies                                    │
│                                                                  │
│  Search Keyword                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ e.g., software companies                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Region                                                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ e.g., San Francisco                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Options                                                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ☑ Save results to Google Sheets                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │               START SEARCH                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📸 Screen 2: Loading State

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Step 1: Search for Companies                                    │
│                                                                  │
│  [Form fields filled in, button disabled]                        │
│                                                                  │
│                        ⟳                                         │
│                   (Spinning)                                     │
│                                                                  │
│      Searching for companies... This may take a moment.          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📸 Screen 3: Success Result

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ✅ Search Completed!                                       │ │
│  │                                                            │ │
│  │ Results found: 30                                          │ │
│  │ Saved to: View Google Sheet (clickable link)              │ │
│  │ Click the button below to continue to contact extraction. │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  (Auto-advances to Step 2 after 2 seconds)                       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📸 Screen 4: Extract Contacts Step

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Step Progress:                                                  │
│  ✓━━━━━━━━━━━━━●━━━━━━━━━━━━━○                                │
│  1. Search      2. Extract     3. Emails                         │
│  (COMPLETED)    Contacts       Generate                          │
│                 (ACTIVE)                                         │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 2: Extract Contact Information                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ℹ️ Total records available: 30                             │ │
│  │ Select which entries to process for contact extraction.   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  From Entry              To Entry                                │
│  ┌─────────────────────┐ ┌─────────────────────┐               │
│  │ 1                   │ │ 10                  │               │
│  └─────────────────────┘ └─────────────────────┘               │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │               EXTRACT CONTACTS                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │            SKIP TO EMAIL GENERATION                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📸 Screen 5: Extract Contacts Result

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ✅ Extraction Completed!                                   │ │
│  │                                                            │ │
│  │ Processed: 10 records                                      │ │
│  │ Successfully extracted: 8                                  │ │
│  │ Failed: 2                                                  │ │
│  │ View results: Google Sheet (clickable link)               │ │
│  │ Click the button below to continue to email generation.   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📸 Screen 6: Generate Emails Step

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Step Progress:                                                  │
│  ✓━━━━━━━━━━━━━✓━━━━━━━━━━━━━●                                │
│  1. Search      2. Extract     3. Emails                         │
│  (COMPLETED)    Contacts       Generate                          │
│                 (COMPLETED)    (ACTIVE)                          │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 3: Generate Sales Emails                                   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ℹ️ Total records available: 30                             │ │
│  │ Select which entries to generate personalized emails for. │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  From Entry              To Entry                                │
│  ┌─────────────────────┐ ┌─────────────────────┐               │
│  │ 1                   │ │ 10                  │               │
│  └─────────────────────┘ └─────────────────────┘               │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │               GENERATE EMAILS                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │               START NEW SEARCH                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📸 Screen 7: Final Success

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ✅ Email Generation Completed!                             │ │
│  │                                                            │ │
│  │ Processed: 10 records                                      │ │
│  │ Successfully generated: 9                                  │ │
│  │ Failed: 1                                                  │ │
│  │ View results: Google Sheet (clickable link)               │ │
│  │                                                            │ │
│  │ 🎉 All done! Check your Google Sheet for the generated    │ │
│  │    emails.                                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📸 Error State Example

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ❌ Error                                                   │ │
│  │                                                            │ │
│  │ Search keyword cannot be empty                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Color Palette

- **Background Gradient**: `#667eea` → `#764ba2` (Purple)
- **Card Background**: `#ffffff` (White)
- **Active Step**: `#667eea` (Purple)
- **Completed Step**: `#10b981` (Green)
- **Pending Step**: `#e0e0e0` (Light Gray)
- **Success Messages**: `#10b981` (Green background)
- **Error Messages**: `#ef4444` (Red background)
- **Info Boxes**: `#3b82f6` (Blue)
- **Buttons**: Purple gradient with hover effects

## 📱 Responsive Design

### Desktop (>600px)
- Full width up to 800px max
- Two-column layout for range inputs
- Large, easy-to-read text

### Mobile (<600px)
- Single column layout
- Stacked form fields
- Optimized button sizes for touch
- Smaller step labels
- Full-width containers

## ✨ Animations

1. **Fade In**: New steps fade in smoothly when activated
2. **Spinner**: Rotating loading spinner during operations
3. **Button Hover**: Buttons lift up slightly on hover
4. **Step Transition**: Smooth color transitions in step indicator

## 🎯 Key UX Features

1. **Visual Progress**: Always know where you are in the workflow
2. **Clear Feedback**: Loading states show exactly what's happening
3. **Helpful Messages**: Success/error messages guide next steps
4. **Smart Defaults**: Forms pre-filled with sensible values
5. **One-Click Links**: Direct links to Google Sheets for results
6. **Auto-Advance**: Automatically moves to next step when ready

---

**The result**: A professional, polished interface that makes complex API workflows accessible to everyone! 🎉

