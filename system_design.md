# IPO Investment Tool — System Design Workflow

A detailed walkthrough of how data moves through the four-stage pipeline, from the moment a new IPO enters the system to the moment a notification lands on your phone. This covers the happy path end-to-end, with scenario detail at each stage and a set of architectural improvements integrated directly into the workflow.

---

## Stage 1: Data Ingestion (`scraper.py`)

### What it's actually doing
Think of this stage as a continuously-refreshing cache of ground truth about every live and upcoming Mainboard IPO. It isn't a single fetch — it's a scheduled job that re-pulls data at different cadences depending on how fast that data moves.

**Sources it needs to hit:**
- **NSE/BSE official IPO portals** for price band, issue size, OFS vs fresh issue split, and the open/close dates.
- **Subscription data feeds** (updated multiple times a day while an IPO is live) for QIB, NII, and Retail multiples.
- **Grey market tracker sites** for GMP, since this isn't available through any official exchange feed.
- **RHP/DRHP filings** for anchor investor allocation and use-of-funds, which feed into your qualitative scoring metrics.

### Scheduling logic — the detail that matters
Not every data point needs the same refresh rate. A sensible design:
- **Static fields** (price band, issue size, dates, OFS ratio) — fetched once when the IPO first appears in the pipeline, then only re-checked daily in case of amendments.
- **Subscription multiples** — these move fast on Day 2 and especially Day 3 (closing day), so during an active IPO's open window, poll every 30–60 minutes. Outside the open window, no need to poll at all.
- **GMP** — fetched daily is usually enough pre-listing, but tighten to every few hours in the 24 hours before closing day since this is one of your two mandatory gate conditions.

> [!TIP]
> **Scraper Efficiency Enhancement: Conditional HTTP Requests**
> To avoid getting rate-limited or blocked by financial portals, the scraper should use **ETags** and **Last-Modified headers** in HTTP requests. If the site returns a `304 Not Modified`, the scraper skips downloading the page body, saving network overhead and avoiding bot detection triggers.

### Happy path scenario
1. A new IPO gets announced. The scraper picks it up from the listing calendar and creates a new record with static fields populated, status = `upcoming`.
2. Three days before open, GMP tracking begins on a daily cadence.
3. Open date arrives — status flips to `active`, and subscription polling kicks in at the tighter interval.
4. Each poll writes a new row (not an overwrite) so you retain a time series — this matters later because "Day 2 momentum" as a concept requires comparing subscription velocity, not just a snapshot.
5. On closing day, polling tightens further in the final hours, and the last poll before 5 PM cutoff is flagged as the "final" data point that `decision_engine.py` will act on.

### Failure handling worth designing for
- **Source is down or rate-limits you:** The scraper should fall back to the last successfully fetched value rather than writing a null, and flag the record as `stale` so the decision engine knows to treat it cautiously.
- **Exchange API Backup:** If Chittorgarh or IPO Watch is down, the scraper should execute a fallback run directly to public JSON endpoints on NSE or BSE India to get official subscription figures.
- **GMP sources disagree:** Pull from two or three grey market trackers and take a median (rather than trusting a single source) to make Rule 2 much more robust.
- **An IPO gets postponed or price band revised:** The scraper needs to detect this as a change event, not just overwrite silently, since a price band revision can invalidate scoring that already happened.

---

## Stage 2: Decision Engine (`decision_engine.py`)

### What it's actually doing
This stage takes whatever the ingestion layer has captured for a given IPO on closing day and runs it through your 8-metric checklist to produce a single YES/NO signal, plus the score and reasoning behind it.

### The gating logic in detail
The two mandatory rules act as hard gates — they're evaluated independently of the 8-point score:
- **Mandatory Rule 1 (demand):** Total subscription $\ge$ 30x OR QIB $\ge$ 50x. This is an "or" condition, which matters — an IPO can pass on QIB strength alone even with modest retail interest, which is often a sign of institutional conviction rather than retail hype.
- **Mandatory Rule 2 (grey market):** GMP premium $\ge$ 20%. This is your proxy for expected listing pop.

Only if both gates pass does the engine check whether the overall score across all 8 metrics is $\ge$ 5. A candidate can have a strong score but still get a NO if either gate fails — that asymmetry is intentional and worth preserving, since it prevents a good-on-paper score from overriding a weak real signal.

> [!NOTE]
> **Decision Enhancement: GMP Velocity & Acceleration**
> Instead of a static 20% GMP check, check the **direction** of the premium in the 24 hours before bidding closes. A GMP that is at 21% but crashed from 50% in the last 12 hours is highly risky (indicating big institutions are offloading privately), whereas a GMP at 21% rising from 10% indicates strong bidding momentum.

### Happy path scenario
1. Closing day, 3:30 PM — the scraper's tightened polling delivers what should be the near-final subscription and GMP numbers.
2. The decision engine pulls this snapshot and evaluates Rule 1 first. If it fails, the engine short-circuits and returns NO immediately — no point computing the remaining 7 metrics.
3. If Rule 1 passes, Rule 2 is checked next. Same short-circuit logic.
4. If both mandatory rules pass, the engine scores the remaining 6 discretionary metrics (OFS-to-fresh ratio, anchor investor quality, post-IPO promoter stake, issue size, etc.).
5. Final score $\ge$ 5/8 $\rightarrow$ signal = YES, with a breakdown of which metrics contributed, so you can see *why* it passed, not just that it did.
6. This YES signal is what triggers Stage 3 and Stage 4 to activate for this IPO.

### Scenario worth designing for: a late data correction
Since the engine acts on the last poll before cutoff, what happens if the scraper's "final" read was actually a stale fallback from a source outage? A robust design re-validates the data freshness flag before treating a NO or YES as final — if the input was flagged `stale`, the engine should either wait for one more poll attempt or surface a warning alongside the signal rather than presenting it with full confidence.

---

## Stage 3: Capital Rotator & Simulator (`backtest_simulator.py`)

### What it's actually doing
This stage exists because IPO application windows overlap. ASBA blocks your funds from the moment you apply until allotment is finalized — roughly a T+2 cycle — and if three IPOs you want to apply for have overlapping closing dates, you can't naively apply full capital to all three without risking a shortfall.

### The core mechanic
- Every time the decision engine produces a YES, the rotator checks current available capital (total pool minus everything currently blocked in pending ASBA applications).
- It calculates how much can safely be allocated to this new candidate without violating the T+2 unblock timeline of existing applications.
- It also computes portfolio EV — expected value based on typical listing-day gains for IPOs that historically passed this same rule set, weighted by how much capital is actually being deployed.

> [!IMPORTANT]
> **India Market Insight: SEBI Retail Allotment Rule**
> In India, if a retail IPO category is oversubscribed, SEBI's allotment system prioritizes giving **exactly 1 lot** to as many unique applicants (PAN accounts) as possible. 
> 
> *Strategy Rule:* Applying for 5 lots (e.g. ₹75,000) from a single PAN account does **NOT** increase your allotment odds in a hot IPO. The optimal strategy to scale under your ₹1 Lakh budget is to **apply for 1 lot (₹15,000) across 5 separate accounts (family accounts with different PAN cards)** rather than bidding for multiple lots on a single account. The Capital Rotator should be designed to track "slots" (PAN accounts) rather than just a raw pool of capital.

### Happy path scenario
1. IPO A gets a YES on Monday, applies ₹15k, funds blocked until Wednesday (T+2).
2. IPO B gets a YES on Tuesday, closing Thursday. The rotator checks: how much of the pool is still blocked from IPO A? Since IPO A unblocks Wednesday, by Thursday full capital is theoretically free again — but if IPO B's own closing overlaps with IPO A's *allotment* uncertainty, the rotator should model this conservatively rather than assuming the unblock happens exactly on schedule.
3. **Bank Latency Buffer:** Add a 24-hour buffer to unblocking. Even if the exchange releases the block on Wednesday, local banks often take up to 24 hours to update your net banking GUI. The rotator should treat funds as liquid on $Allotment\ Date + 1\ Day$.
4. Capital gets allocated to IPO B based on the conservative available balance, not the theoretical maximum.
5. If IPO C also triggers YES that same week with a closing date that doesn't leave enough recycled capital, the rotator flags this as a capital conflict rather than silently under- or over-allocating — this is a good trigger candidate for Stage 4 to surface as an alert.

---

## Stage 4: Dispatch & Notification (`App.jsx` + `notifier.py`)

### What it's actually doing
This is the surface layer — it converts internal state changes into things you actually see and act on, at the moments that matter most.

### Trigger types worth defining explicitly
Rather than one generic "IPO update" notification, a well-designed system separates triggers by what action they demand from you:
- **Open date trigger** — informational (silent). Fires once, when an IPO opens. No action needed yet.
- **Day 2 momentum trigger** — informational. Fires if subscription velocity between Day 1 and Day 2 crosses a meaningful acceleration (say, QIB jumping from 2x to 15x overnight). This flags a potential YES early.
- **Final bidding day, 2 PM trigger** — **Actionable (Loud).** This is your last-call alert, timed deliberately before the 5 PM cutoff so you still have a window to submit the net banking application.
- **Decision engine YES/NO trigger** — fires once the engine has a final signal, carrying the score breakdown.
- **Capital conflict trigger** — fires only when two or more YES signals compete for the same blocked capital window, demanding a manual decision on which IPO gets priority.

> [!TIP]
> **Telegram Bot Interaction: Inline Keyboard Buttons**
> To turn the Telegram Channel into an interactive dashboard, we can configure our Telegram bot to send alerts with **inline buttons** (e.g., `[ I Bid 1 Lot ]`, `[ Skip ]`, `[ View Stats ]`). Clicking a button sends a webhook to your scraper backend, automatically recording your active bids in the database and updating your liquid capital without having to open the React dashboard!

### Happy path scenario — full pipeline trace
1. **Day -3:** IPO enters `upcoming` status. GMP tracking begins. No notification yet — this is below your attention threshold.
2. **Day 1 (open):** Open date trigger fires on Telegram (silent) + PWA card created.
3. **Day 2, midday:** Subscription scraper poll shows QIB jumping sharply. Momentum trigger fires — "worth watching" tone.
4. **Day 3 (closing), 2 PM:** Final bidding day trigger fires with current live numbers — total subscription, QIB, GMP — so you can see if it's tracking toward a likely YES.
5. **Day 3, ~4 PM:** Scraper's tightened final poll runs. Decision engine evaluates. Signal = YES, score 6/8, both mandatory rules passed.
6. **Day 3, immediately after:** Capital rotator checks available pool, confirms no conflict, allocates capital, computes portfolio EV.
7. **Day 3, final notification:** YES trigger fires with the full picture — score breakdown, capital allocated, expected T+2 unblock date — this is the notification that actually asks you to act (submit the ASBA application).
8. **PWA dashboard** updates throughout to reflect current status, so if you open it mid-flow at any point, it matches whatever the last notification said.

---

## Suggestions for improving the workflow

A few things worth considering as you build this out further:
- **Add a confidence/freshness indicator to every YES signal:** Since GMP is unofficial and subscription data can spike from bulk HNI activity near the deadline, a YES that's based on data 10 minutes old is more trustworthy than one based on a 3-hour-old fallback value.
- **Track your own hit rate over time:** Since `backtest_simulator.py` already exists, log actual listing-day outcomes against what the decision engine predicted to calibrate the rules.
- **Consider a "near-miss" log:** IPOs that scored 4/8 or failed a mandatory rule by a small margin (say, GMP at 18% instead of 20%) are useful data to review.
- **Model allotment probability in the capital rotator:** Model expected allotment probability based on subscription multiple to calculate capital lockups more realistically.
