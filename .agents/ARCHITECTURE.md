# MAKI Points System - Technical Architecture & Specifications

This document provides a detailed technical explanation of the architecture, data schemas, caching layer, state management, and deployment pipelines of the MAKI Points System.

---

## 🏗️ Technical Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                  React Frontend                                   |
|                                                                                   |
|  +-------------------+   +--------------------+   +----------------------------+  |
|  |   Header Component|   |   View Components  |   |    Modals & Toast System   |  |
|  | (Lang, Status, Nav|   | (Home, Meeting,    |   | (PersonalStats, Admin,     |  |
|  |      Badge)       |   |  Stats, Exchange)  |   |    ConnectionHelp, Toast)  |  |
|  +---------+---------+   +---------+----------+   +-------------+--------------+  |
|            |                       |                            |                 |
|            +-----------------------+----------------------------+                 |
|                                    |                                              |
|                                    v                                              |
|                        +-----------------------+                                  |
|                        |   AppContext Provider |                                  |
|                        | (Data, Auth, i18n, t) |                                  |
|                        +-----------+-----------+                                  |
|                                    |                                              |
|                                    v                                              |
|                        +-----------------------+                                  |
|                        |  api.js Service Layer |                                  |
|                        +-----------+-----------+                                  |
|                                    |                                              |
+------------------------------------|----------------------------------------------+
                                     |
           +-------------------------+-------------------------+
           |                                                   |
           v (If cached & < 10 mins)                           v (If cache miss or force refresh)
+----------------------+                            +-----------------------------------+
| LocalStorage Cache   |                            | Google Apps Script (GAS) Web App  |
| (maki_points_data_   |                            | (HTTP GET / POST CORS Endpoints)  |
|      cache_v2)       |                            +-----------------+-----------------+
+----------------------+                                              |
                                                                      v
                                                            +-------------------+
                                                            | Google Sheets DB  |
                                                            | (Users, Meetings, |
                                                            | Records, Prizes)  |
                                                            +-------------------+
```

---

## 💾 1. Data Caching Strategy (`api.js`)

To minimize latency and avoid exceeding Google Apps Script rate quotas, a 10-minute client-side caching layer is implemented in [api.js](file:///c:/Users/Meteor/Desktop/Coding%20Projects/maki-points/src/services/api.js):

- **Cache Key**: `maki_points_data_cache_v2`
- **Time-to-Live (TTL)**: 10 minutes (`10 * 60 * 1000` ms = 600,000 ms)
- **Structure**:
  ```json
  {
    "timestamp": 1786072000000,
    "payload": {
      "users": [...],
      "meetings": [...],
      "records": [...],
      "redemptions": [...]
    }
  }
  ```
- **Read Logic**: `fetchInitialData(forceRefresh = false)` checks `getCachedData()`. If valid and `forceRefresh === false`, it immediately returns cached data without calling the remote endpoint.
- **Invalidation Triggers**:
  - `saveMeetingAndRecords(...)` -> calls `clearCachedData()`
  - `deleteMeeting(...)` -> calls `clearCachedData()`
  - `saveRedemptionData(...)` -> calls `clearCachedData()`
  - `deleteRedemptionData(...)` -> calls `clearCachedData()`
  - Clicking the Header Connection Status Badge -> calls `loadData(true)` to force refresh from GAS.

---

## 🌐 2. Internationalization System (`translations.js` & `AppContext.jsx`)

The i18n engine provides instant bilingual translation without requiring page reloads:

- **State Persistence**: `localStorage.getItem('maki_lang')` (defaults to `'zh'`).
- **Translation Helper**:
  ```js
  const t = (key) => translations[lang]?.[key] || translations['zh']?.[key] || key;
  ```
- **Prize Localization Strategy**:
  - `PRIZE_CATALOG` items in [prizeData.js](file:///c:/Users/Meteor/Desktop/Coding%20Projects/maki-points/src/constants/prizeData.js) contain both `name`/`desc` (Traditional Chinese) and `nameEn`/`descEn` (English).
  - Web UI displays `lang === 'en' ? (p.nameEn || p.name) : p.name`.
  - Payloads sent to Google Sheets always send `p.name` (Chinese) to guarantee exact match with database sheet rules.

---

## 📱 3. Responsive Web Design (Mobile RWD)

To ensure seamless usability across smartphones, tablets, and desktop displays:

1. **Mobile Card Logging View**:
   - In [CreateMeetingView.jsx](file:///c:/Users/Meteor/Desktop/Coding%20Projects/maki-points/src/views/CreateMeetingView.jsx), meetings use `.desktop-table-view` for large screens and `.mobile-cards-view` for mobile viewports (`@media (max-width: 768px)`).
   - Mobile cards convert table rows into touch-friendly cards with high-accessibility score buttons (`+30 搶答`, `+10 發問`, `+3 回答`, `清空`).

2. **Flex Wrapping & Text-Overflow Protection**:
   - All section headers use `flex-wrap: wrap` and `gap` to prevent title squeezing.
   - Headings use `word-break: keep-all` to ensure Chinese characters never break into 1-2 character vertical columns.
   - Form inputs and select dropdowns use `box-sizing: border-box; width: 100%` to prevent horizontal scrolling off-screen.

---

## 📊 4. Core Point Values

Point calculations follow standard company meeting participation guidelines:

| Action | Points | Key in Code | Description |
| :--- | :---: | :--- | :--- |
| **First Ask (搶答/率先發問)** | **+30** | `POINT_VALUES.ASK_FIRST` | Limited to 1 person per meeting session |
| **Follow-up Ask (補充發問)** | **+10** | `POINT_VALUES.ASK` | Unlimited per participant |
| **Answer / Reply (回答/回應)** | **+3** | `POINT_VALUES.REPLY` | Unlimited per participant |

---

## 🚀 5. Deployment & CI/CD Pipeline

The project is hosted on GitHub Pages and automatically deployed via GitHub Actions:

- **Workflow File**: `.github/workflows/deploy.yml`
- **Trigger**: Push to `main` branch or manual `workflow_dispatch`.
- **Environment Injection**:
  `VITE_GAS_API_URL` is passed to `npm run build` from repository secrets or environment variables, with a working fallback Web App URL built into `deploy.yml`.
