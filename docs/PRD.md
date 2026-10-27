# Product Requirement Document (PRD): Divergen — IPO Investment Platform

---

## 1. Executive Summary & Project Vision

### 1.1 Project Origin
**Divergen** began as a personal investment experiment. The project creator, a product designer transitioning into a product engineer/builder, set a goal: **experiment by bidding on 100 Mainboard IPOs in India over a 6 to 8 month timeframe, utilizing a total capital pool of ₹1 Lakh (100,000 INR)**. 

To maximize capital efficiency and achieve profitability, the creator designed this tool to act as a programmatic investment assistant (agent). It ingests data from both a paid financial API and targeted HTML scraping, evaluates IPOs against 8 strict quantitative metrics, and delivers a clear **YES/NO** decision on the final bidding day.

### 1.2 Brand Identity
- **Name:** Divergen
- **Logo:** D + Infinity mark — symbolizes continuous capital rotation and growth through repeated investment cycles.
- **Brand Principle:** *Find the signal. Take a different path. Keep the capital moving.*
- **Design System:** Geist Variable typography, neutral slate palette, premium glassmorphism cards. See [DESIGN.md](../DESIGN.md) and [BRAND_CONCEPT.md](BRAND_CONCEPT.md).

### 1.3 Target Audience
*   **Retail Investors:** Small-scale investors seeking listing gains without diving into 400-page RHP filings.
*   **Systematic Capital Rotators:** Investors utilizing India's banking block system (ASBA) to reuse a small capital pool repeatedly.
*   **Product Builders:** Designers and engineers looking for clean, open-source, easily hosted dashboards with automated data collection.

---

## 2. Problem Statement & Market Impact

### 2.1 The Problem
In the Indian stock market, IPO investing is plagued by two extremes:
1.  **Emotional Speculation:** Retail investors bid on IPOs based on social media hype or friends' advice, often suffering losses on listing morning (e.g., Paytm, LIC, Hyundai).
2.  **Information Overload:** Analyzing an IPO requires checking Red Herring Prospectuses (RHPs) for Offer for Sale (OFS) percentages, comparing P/E ratios against multiple peers, reviewing 3 years of Profit After Tax (PAT) margins, auditing anchor investor quality, and tracking live subscription bidding speeds.

Furthermore, retail capital is limited. Bidding requires blocking funds (ASBA), which limits the number of active applications an investor can place simultaneously.

### 2.2 The Solution & Impact
Divergen mitigates these issues through:
*   **Objective Decision Rules:** Strips emotion by enforcing a data-driven 8-metric filter.
*   **Expected Value Backtesting:** Proves the viability of the filters using historical data before risking real money.
*   **Capital Rotation Simulation:** Visualizes exactly when funds are blocked and when they are refunded, optimizing a ₹1 Lakh budget to fit up to 6 simultaneous applications.
*   **Systematic Listing Gain Harvesting:** Focuses strictly on short-term listing gains (selling 100% on the listing morning), allowing rapid capital recycling.

---

## 3. Product Features & System Flow

The product operates through a four-stage pipeline:

```
[Hybrid Ingestion: IPO Guru API + Chittorgarh Parser]
         │
         ▼
[Cloud Database (Supabase)] ◄──── [Offline Mirror (db_local.json)]
         │
         ▼
[Decision Engine (8-Metric Scoring)]
         │
         ├──► [Responsive Dashboard (React + Vite)]
         └──► [Telegram Bot / macOS Alerts]
```

### 3.1 Data Ingestion — Hybrid Dual-Engine Architecture
*   **Tier 1 — IPO Guru Developer API (`ipoguru_client.py`):** Authoritative master data for mainboard IPO calendar discovery, price bands, issue size, live Grey Market Premium (GMP), 3-year audited financials, and promoter holding.
*   **Tier 2 — Chittorgarh Deep HTML Parser (`scraper.py`):** Targeted scraping for data points absent from the API Basic plan — Fresh Issue vs OFS breakdown, listed peer competitor P/E ratios (true mathematical median), and live subscription multiples during bidding windows.
*   **Rate Limit Protection:** Client-side request throttling, 5-minute memory cache, and automatic exponential backoff on HTTP 429 to respect the Basic plan's 10 req/min limit.
*   **Offline Resilience:** Real-time data synced to Supabase Cloud is automatically mirrored to `src/data/db_local.json`, allowing the dashboard to operate seamlessly offline with real data.

### 3.2 Evaluation & Decision Engine (The 8 Rules)
The system calculates a score from 0 to 8. A **YES** recommendation is only triggered if the overall score is **>= 5** AND the two **mandatory listing gain drivers** pass. Upcoming IPOs receive a **PENDING** status with pre-bidding analysis notes.

1.  **Real-Time Demand (Mandatory):** Total subscription multiple $\ge$ 30x OR QIB multiple $\ge$ 50x on the final day.
2.  **Sentiment Anchor (Mandatory):** Implied GMP premium $\ge$ 20% of the upper price band.
3.  **Capital Structure:** Offer For Sale (OFS) constitutes less than 50% of the total issue size.
4.  **Valuation Buffer:** IPO P/E ratio is at least 15% lower than the median P/E of listed peers.
5.  **Institutional Backing:** The anchor book contains blue-chip domestic mutual funds or tier-1 sovereign wealth funds.
6.  **Fundamental Reality:** Positive and rising Profit After Tax (PAT) margins over the last 3 consecutive fiscal years.
7.  **Issue Size Cap:** Total issue size is under ₹3,000 Crore (smaller float size allows listing day surges).
8.  **Skin in the Game:** Promoters retain at least 50% post-IPO stake.

### 3.3 Dashboard UI (React + Vite)
*   **Active Tracker Panel:** Card grid of ongoing IPOs showing GMP, subscription, price band, and final YES/NO/PENDING signal.
*   **Capital Rotator Panel:** Simulated wallet representing your ₹1 Lakh pool. Shows liquid funds vs blocked ASBA cash, allotment calendar, and realized listing gains log. Supports family group accounts with multiple PAN cards.
*   **Backtest Playground Panel:** A simulation playground loaded with 21 historical IPOs. Features interactive sliders for GMP and Subscription thresholds that recalculate portfolio yield in real-time.
*   **Rule Guide Panel:** Educational descriptions of all metrics.
*   **Mobile-First Design:** Responsive layout with dedicated `MobileDataCard` component, bottom-sheet modals, safe-area support, and iOS Safari auto-zoom prevention.

### 3.4 Automated Alerts (Notifier)
*   **Telegram Push Notifications:** Sends push alerts to a Telegram Channel via a bot. Works on both Mac and Android.
*   **macOS Desktop Notifications:** Local fallback system banners run via AppleScript.
*   **GitHub Actions Cron:** Cloud-based 3-hour scheduled scraping and sync workflow.

---

## 4. Current Implementation Status

All core modules have been coded and validated:

| Module | File Path | Status | Details |
| :--- | :--- | :--- | :--- |
| **Design System** | `DESIGN.md` + `src/index.css` | **Completed** | Geist typography, neutral slate palette, WCAG 2.1 AA accessible. |
| **Supabase Client** | `src/supabaseClient.js` | **Completed** | Client-side database initialization with auth state management. |
| **DB Python Adapter** | `db_client.py` | **Completed** | Supabase Cloud + Local JSON Offline modes with auto-mirroring. |
| **IPO Guru API Client** | `ipoguru_client.py` | **Completed** | REST client with rate-limiting, caching, and HTTP 429 backoff. |
| **Hybrid Scraper** | `scraper.py` | **Completed** | Dual-engine: IPO Guru API (Tier 1) + Chittorgarh DRHP parser (Tier 2). |
| **Decision Logic** | `decision_engine.py` | **Completed** | 8-metric scoring with PENDING status for upcoming IPOs. |
| **Backtester** | `backtest_simulator.py` | **Completed** | EV yields over 21 historical records. |
| **Notifier** | `notifier.py` | **Completed** | Telegram Bot API + macOS AppleScript fallback. |
| **Automation** | `.github/workflows/scraper.yml` | **Completed** | 3-hourly GitHub Actions cron with auto-commit of local JSON cache. |
| **Database Seeder** | `seed_historical_data.py` | **Completed** | Seeds historical JSON to Supabase database. |
| **Brand Identity** | `DivergenLogo.jsx` + assets | **Completed** | Responsive D+Infinity logo for all viewport sizes. |
| **Frontend UI** | `src/App.jsx` | **Completed** | Full React dashboard with auth, guest mode, family accounts, and bid management. |

---

## 5. Technical Design Decisions & Learning Logs

### 5.1 SQLite vs. Supabase (PostgreSQL)
*   *Decision:* Upgraded from local SQLite file-base to cloud-hosted Supabase.
*   *Rationale:* SQLite stores the database in a local file on your Mac, preventing other devices from reading it. Supabase hosts a PostgreSQL relational database in the cloud, exposing secure API endpoints. This allows the website to be hosted online so that multiple users can view the same live data on their phones.

### 5.2 Hybrid API + Scraping Architecture
*   *Decision:* Transitioned from pure Chittorgarh scraping to a hybrid IPO Guru API + targeted Chittorgarh DRHP parsing.
*   *Rationale:* Chittorgarh shifted to Next.js client-side hydration, making traditional `requests + BeautifulSoup` unreliable. The IPO Guru Developer API provides authoritative structured data for most metrics, while Chittorgarh is used surgically for the specific data points absent from the Basic plan (OFS breakdown, peer P/E table, live subscription multiples). This eliminated mock data dependencies entirely.

### 5.3 Deterministic Expected Value Modeling in Backtesting
*   *Decision:* Used mathematical expected value for backtester calculations instead of pure random allotment lottery.
*   *Rationale:* Since retail allotment is a lottery, simulating returns using random variables creates jittery yields on every refresh. Instead, we use expected value: `Expected Profit = Lot Cost * (1 / Retail Subscription) * Listing Gain %`. This represents the mathematical expected return of the capital rotated over time, yielding stable, scientific stats.

### 5.4 Family Group Capital Strategy
*   *Decision:* Implemented multi-account family group system with invite codes.
*   *Rationale:* SEBI's retail allotment rule prioritizes giving exactly 1 lot to as many unique applicants (PAN accounts) as possible. Applying for 5 lots from a single PAN does NOT increase odds. The optimal strategy is to apply for 1 lot across multiple family accounts with different PAN cards.

---

## 6. Future Roadmap & Scaling Ideas

1.  **Broker API Integration (Automated Execution):**
    *   Integrate with brokers like **Zerodha KiteConnect** or **AngelOne API** to automatically place retail bids when the tool triggers a "YES" signal on the closing day (between 2 PM and 3 PM).
2.  **GMP Velocity & Acceleration Tracking:**
    *   Check the direction of the GMP premium in the 24 hours before bidding closes — a falling GMP is a stronger negative signal than a static low GMP.
3.  **Hold-vs-Sell Evaluation (Fundamental Hold Signal):**
    *   Add an option for "Long Term Hold" recommendation alongside listing gains, evaluating the debt-to-equity ratio, ROCE trend, and industry moat.
4.  **Telegram Inline Buttons:**
    *   Add inline keyboard buttons to Telegram alerts (`[ I Bid 1 Lot ]`, `[ Skip ]`, `[ View Stats ]`) with webhook integration to record bids without opening the dashboard.
5.  **App.jsx Decomposition:**
    *   Extract the monolithic 4,400-line App.jsx into route-level page components and shared hooks to improve maintainability and error isolation.
