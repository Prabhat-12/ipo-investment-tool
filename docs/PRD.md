# Product Requirement Document (PRD): Antigravity IPO Investment Tracker

---

## 1. Executive Summary & Project Vision

### 1.1 Project Origin
The **Antigravity IPO Tracker** began as a personal investment experiment. The project creator, a product designer transitioning into a product engineer/builder, set a goal: **experiment by bidding on 100 Mainboard IPOs in India over a 6 to 8 month timeframe, utilizing a total capital pool of ₹1 Lakh (100,000 INR)**. 

To maximize capital efficiency and achieve profitability, the creator designed this tool to act as a programmatic investment assistant (agent). It scrapes data from financial aggregators, evaluates IPOs against 8 strict quantitative metrics, and delivers a clear **YES/NO** decision on the final bidding day.

### 1.2 Target Audience
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
The Antigravity IPO Tracker mitigates these issues through:
*   **Objective Decision Rules:** Strips emotion by enforcing a data-driven 8-metric filter.
*   **Expected Value Backtesting:** Proves the viability of the filters using historical data before risking real money.
*   **Capital Rotation Simulation:** Visualizes exactly when funds are blocked and when they are refunded, optimizing a ₹1 Lakh budget to fit up to 6 simultaneous applications.
*   **Systematic Listing Gain Harvesting:** Focuses strictly on short-term listing gains (selling 100% on the listing morning), allowing rapid capital recycling.

---

## 3. Product Features & System Flow

The product operates in three sequential phases:

```
[Background Scraper (Python)] ──> [Cloud Database (Supabase)] ──> [Responsive Dashboard (React)]
            │                                                               │
            └──> [Telegram Bot / macOS Alerts] ──> [Push Notification] ──────┘
```

### 3.1 Scraping & Data Ingestion (Python)
*   **Mainboard List Crawler:** Aggregates upcoming, active, and past mainboard IPO lists.
*   **Details Scraper:** Gathers specific company financial details (Fresh Issue vs. OFS splits, Market Cap, post-IPO promoter stakes).
*   **Financial & Peer Extractor:** Parses PE ratios, competitor metrics, and 3-year PAT margins from details tables.
*   **Bidding Speed tracker:** Scrapes live Qualified Institutional Buyer (QIB), Non-Institutional Investor (NII), and Retail subscription multiples daily.
*   **GMP Sentinel:** Tracks informal wholesale Grey Market Premium (GMP) premiums.

### 3.2 Evaluation & Decision Engine (The 8 Rules)
The system calculates a score from 0 to 8. A **YES** recommendation is only triggered if the overall score is **>= 5** AND the two **mandatory listing gain drivers** pass:

1.  **Real-Time Demand (Mandatory):** Total subscription multiple $\ge$ 30x OR QIB multiple $\ge$ 50x on the final day.
2.  **Sentiment Anchor (Mandatory):** Implied GMP premium $\ge$ 20% of the upper price band.
3.  **Capital Structure:** Offer For Sale (OFS) constitutes less than 50% of the total issue size.
4.  **Valuation Buffer:** IPO P/E ratio is at least 15% lower than the median P/E of listed peers.
5.  **Institutional Backing:** The anchor book contains blue-chip domestic mutual funds or tier-1 sovereign wealth funds.
6.  **Fundamental Reality:** Positive and rising Profit After Tax (PAT) margins over the last 3 consecutive fiscal years.
7.  **Issue Size Cap:** Total issue size is under ₹3,000 Crore (smaller float size allows listing day surges).
8.  **Skin in the Game:** Promoters retain at least 50% post-IPO stake.

### 3.3 Dashboard UI (React + Vite)
*   **Active Tracker Panel:** Card grid of ongoing IPOs showing GMP, subscription, price band, and final YES/NO signal.
*   **Capital Rotator Panel:** Simulated wallet representing your ₹1 Lakh pool. Shows liquid funds vs blocked ASBA cash, allotment calendar, and realized listing gains log.
*   **Backtest Playground Panel:** A simulation playground loaded with 21 historical IPOs. Features interactive sliders for GMP and Subscription thresholds that recalculate portfolio yield in real-time.
*   **Rule Guide Panel:** Educational descriptions of all metrics.

### 3.4 Automated Alerts (Notifier)
*   **Telegram Push Notifications:** Sends push alerts to a Telegram Channel via a bot. Works on both Mac and Android.
*   **macOS Desktop Notifications:** Local fallback system banners run via AppleScript.
*   **Launchd Scheduler:** Run scripts in the background on your Mac every 6 hours automatically.

---

## 4. Current Implementation Status

All core modules have been coded and validated:

| Module | File Path | Status | Details |
| :--- | :--- | :--- | :--- |
| **Styles** | [src/index.css](file:///Users/prabhat/IPO%20Investment%20Tool/src/index.css) | **Completed** | Emerald Green theme configuration. |
| **Supabase Client** | [src/supabaseClient.js](file:///Users/prabhat/IPO%20Investment%20Tool/src/supabaseClient.js) | **Completed** | Client-side database initialization. |
| **DB Python Adapter**| [db_client.py](file:///Users/prabhat/IPO%20Investment%20Tool/db_client.py) | **Completed** | Supports Supabase Cloud & Local JSON Offline modes. |
| **Scraper** | [scraper.py](file:///Users/prabhat/IPO%20Investment%20Tool/scraper.py) | **Completed** | Crawls Chittorgarh with resilient mock data fallbacks. |
| **Decision Logic** | [decision_engine.py](file:///Users/prabhat/IPO%20Investment%20Tool/decision_engine.py) | **Completed** | Code implementation of the 8 rules. |
| **Backtester** | [backtest_simulator.py](file:///Users/prabhat/IPO%20Investment%20Tool/backtest_simulator.py) | **Completed** | Run EV yields over 21 historical records. |
| **Notifier** | [notifier.py](file:///Users/prabhat/IPO%20Investment%20Tool/notifier.py) | **Completed** | AppleScript macOS banners & Telegram Bot API. |
| **Automation Daemon**| [setup_automation.sh](file:///Users/prabhat/IPO%20Investment%20Tool/setup_automation.sh) | **Completed** | Installs macOS launchd background job. |
| **Database Seeder** | [seed_historical_data.py](file:///Users/prabhat/IPO%20Investment%20Tool/seed_historical_data.py) | **Completed** | Seeds historical JSON to Supabase database. |
| **Frontend UI** | [src/App.jsx](file:///Users/prabhat/IPO%20Investment%20Tool/src/App.jsx) | **Completed** | Full React dashboard application. |

---

## 5. Technical Design Decisions & Learning Logs

### 5.1 SQLite vs. Supabase (PostgreSQL)
*   *Decision:* Upgraded from local SQLite file-base to cloud-hosted Supabase.
*   *Jargon Recap:* SQLite stores the database in a local file on your Mac, preventing other devices from reading it. Supabase hosts a PostgreSQL relational database in the cloud, exposing secure API endpoints. This allows you to host your website online so that you and your friends can view the same live data on your phones.

### 5.2 Resilient Data Ingestion with Graceful Mock Fallbacks
*   *Decision:* Scrapers automatically switch to mock fallbacks if blocked or offline.
*   *Jargon Recap:* Scraping third-party sites is prone to network failure or layout changes. Instead of throwing a critical crash that renders the website blank, the scraper catches exceptions, loads realistic placeholder upcoming IPO records (Ola Electric, FirstCry, Unicommerce), and alerts the logs. This ensures the frontend dashboard is always functional and interactive.

### 5.3 Deterministic Expected Value Modeling in Backtesting
*   *Decision:* Used mathematical expected value for backtester calculations instead of pure random allotment lottery.
*   *Jargon Recap:* Since retail allotment is a lottery, simulating returns using random variables creates jittery yields on every refresh. Instead, we use expected value: `Expected Profit = Lot Cost * (1 / Retail Subscription) * Listing Gain %`. This represents the mathematical expected return of the capital rotated over time, yielding stable, scientific stats.

---

## 6. Future Roadmap & Scaling Ideas

1.  **Broker API Integration (Automated Execution):**
    *   Integrate with brokers like **Zerodha KiteConnect** or **AngelOne API** to automatically place retail bids when the tool triggers a "YES" signal on the closing day (between 2 PM and 3 PM).
2.  **Alternative Data Sentiment Tracking (Social Listening):**
    *   Build an NLP scraper checking Reddit (`r/IndiaInvestments`) and Twitter tags to monitor sentiment momentum, factoring social retail interest alongside GMP.
3.  **Hold-vs-Sell Evaluation (Fundamental Hold Signal):**
    *   Add an option for "Long Term Hold" recommendation alongside listing gains, evaluating the debt-to-equity ratio, ROCE trend, and industry moat.
4.  **Multi-user Portfolio Tracker:**
    *   Implement user authentication on Supabase so friends can log in, create their own capital rotation wallets (e.g. ₹50k or ₹2L), log actual allotments, and track individual experiment yields side-by-side.
