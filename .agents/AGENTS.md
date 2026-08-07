# MAKI Points System - Agent Instructions & Project Overview

Welcome to the **MAKI Points System (MAKI 會議積分統計與兌換系統)** repository. This document serves as the primary guidance for AI coding agents and human developers working on this codebase.

---

## 📌 Project Overview

MAKI Points System is a modern, high-performance web application designed for corporate meeting engagement tracking, point logging, leaderboard analytics, and reward redemptions.

### Key Capabilities:
1. **Meeting Point Logging (`CreateMeetingView.jsx`)**:
   - Live point recording (+30 First Ask/抢答, +10 Follow-up Ask, +3 Answer).
   - Single "+30 First Ask" limit per meeting session.
   - Department-based participant selection cards with "Select All" toggles.
   - Global and per-user score reset buttons with undo capability.
   - Desktop table view + Touch-optimized mobile card view for easy point button access.

2. **Personal Stats Query (`PersonalStatsModal.jsx`)**:
   - Quick lookup of speech statistics (First Ask, Follow-up, Answers).
   - Real-time point breakdown (Total Earned, Total Redeemed, Available Balance).
   - Transaction log history per user.

3. **Analytics & Leaderboard (`StatisticsView.jsx`)**:
   - Dynamic Bar Charts using Chart.js (Department vs. Individual point comparisons).
   - Department filter options (ALL or specific department).
   - Complete rankings table (Rank, Name, Dept, Total Score, Redeemed, Available Balance, Speech breakdown).
   - Collapsible meeting history list with expandable attendee score details and Admin deletion capabilities.

4. **Reward Redemptions (`ExchangeView.jsx`)**:
   - Admin-only reward redemption workflow.
   - Live user balance verification before redemption.
   - Rich prize catalog grid with bilingual titles and descriptions.
   - Transaction history log search and cancellation/refund capability.

5. **Data Architecture & Sync (`api.js` & Google Apps Script)**:
   - Google Sheets backend database via Google Apps Script (GAS) Web App (`doGet` / `doPost`).
   - 10-Minute LocalStorage Cache layer (`maki_points_data_cache_v2`) to eliminate unnecessary network fetch calls.
   - Automatic cache invalidation on write/delete operations.
   - Forced re-sync badge button in Navbar with animated spinning status indicator.

6. **Bilingual i18n Localization (`translations.js` & `AppContext.jsx`)**:
   - Full Traditional Chinese (`zh`) and English (`en`) UI toggle.
   - Preserves backend DB prize string compatibility while localizing UI titles and descriptions.

---

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 + Vite 5
- **Styling**: Vanilla CSS with custom CSS variables, Dark Mode Glassmorphic Design, Keyframe animations, and Mobile RWD Media Queries (`src/index.css`)
- **Icons**: Lucide React
- **Charts**: Chart.js + react-chartjs-2
- **Backend / Database**: Google Apps Script (GAS) + Google Sheets
- **CI/CD Deployment**: GitHub Actions -> GitHub Pages (`.github/workflows/deploy.yml`)

---

## 📁 Key Directory & File Map

```
maki-points/
├── .agents/                    # Workspace agent guidelines & documentation
│   ├── AGENTS.md               # Main AI agent rules & overview
│   └── ARCHITECTURE.md          # Technical specifications & data flow
├── .github/workflows/
│   └── deploy.yml              # GitHub Actions deploy workflow to GitHub Pages
├── apps-script/
│   └── appscript.gs            # Google Apps Script Web App source code
├── src/
│   ├── components/
│   │   ├── Header.jsx          # Top Navigation Bar & Language Switcher
│   │   ├── AdminModal.jsx      # Admin Authentication Modal
│   │   ├── PersonalStatsModal.jsx # User Personal Score Lookup Modal
│   │   ├── ConnectionHelpModal.jsx # API Connection Troubleshooter
│   │   └── Toast.jsx           # Global Notification Toast
│   ├── constants/
│   │   ├── prizeData.js        # Prize Catalog Catalog & Point Values
│   │   └── translations.js     # Traditional Chinese & English Dictionaries
│   ├── context/
│   │   └── AppContext.jsx      # Global React Context Provider & i18n Helper
│   ├── services/
│   │   └── api.js              # GAS Web App API Service & 10-min Cache Manager
│   ├── utils/
│   │   └── formatters.js       # Date & String Formatting Utilities
│   ├── views/
│   │   ├── HomeView.jsx        # Landing Page with Quick Action Cards
│   │   ├── CreateMeetingView.jsx # Meeting Setup & Active Recording Form
│   │   ├── StatisticsView.jsx  # Leaderboard Charts & Meeting History List
│   │   └── ExchangeView.jsx    # Admin Reward Redemption & History Logs
│   ├── App.jsx                 # Main Application Layout & View Router
│   ├── index.css               # Design System, Glassmorphism, RWD Rules
│   └── main.jsx                # Application Entry Point
├── .env                        # Local Environment Variables (VITE_GAS_API_URL)
├── package.json
└── vite.config.js
```

---

## 💡 Important Coding & Conventions Rules

1. **Database String Preservation**:
   - When saving records or redemptions to Google Apps Script (`saveMeetingAndRecords`, `saveRedemptionData`), always preserve original Chinese prize names (`p.name`) so Google Sheet columns remain 100% consistent with legacy data.
   - Only localize UI labels and descriptions (`p.nameEn`, `p.descEn`) using the `t(...)` helper or conditional rendering based on `lang`.

2. **Cache Integrity**:
   - The 10-minute cache helper in `api.js` uses local storage key `maki_points_data_cache_v2`.
   - Any write mutation (`saveMeetingAndRecords`, `deleteMeeting`, `saveRedemptionData`, `deleteRedemptionData`) MUST call `clearCachedData()` to invalidate stale state.

3. **Mobile RWD Rules**:
   - All interactive headers, titles, and toolbars MUST use `flex-wrap: wrap` to prevent vertical text squishing on mobile viewports.
   - Use `.desktop-table-view` for desktop tables and `.mobile-cards-view` for mobile touch-friendly cards.
   - Headings MUST retain `word-break: keep-all` to avoid 1-2 character vertical column breaking.

4. **Error Logs First**:
   - Diagnose any runtime exceptions or API errors strictly by fetching empirical log evidence before making code changes.
