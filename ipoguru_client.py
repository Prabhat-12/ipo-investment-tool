import os
import re
import requests
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "https://www.ipoguru.in/api/v2"
API_KEY = os.getenv("IPOGURU_API_KEY", "ipo_7HkoCwHQZlskYDXW95CczOKEHBbH5zzGIUpXFvnK")

HEADERS = {
    "X-API-KEY": API_KEY,
    "Accept": "application/json",
    "User-Agent": "IPOInvestmentTool/2.0"
}

import time

# Simple in-memory cache to save API quota
_CACHE = {}
_LAST_REQUEST_TIME = 0.0

def _get_api(url, params=None):
    """
    HTTP GET wrapper with rate-limit protection (10 req/min basic plan limit),
    in-memory caching, and automatic retry on HTTP 429.
    """
    global _LAST_REQUEST_TIME
    cache_key = f"{url}:{str(params)}"
    now = time.time()
    
    if cache_key in _CACHE:
        cached_time, cached_val = _CACHE[cache_key]
        if now - cached_time < 300: # 5 minute cache
            return cached_val

    # Throttle to max 1 request every 1.2 seconds to stay under 10/min burst limit safely
    elapsed = now - _LAST_REQUEST_TIME
    if elapsed < 1.2:
        time.sleep(1.2 - elapsed)

    try:
        resp = requests.get(url, headers=HEADERS, params=params, timeout=15)
        _LAST_REQUEST_TIME = time.time()
        
        if resp.status_code == 200:
            data = resp.json()
            _CACHE[cache_key] = (time.time(), data)
            return data
            
        elif resp.status_code == 429:
            # Rate limited
            err_json = {}
            try: err_json = resp.json()
            except Exception: pass
            retry_after = err_json.get("retry_after", 5)
            print(f"IPO Guru rate limited (429). Backing off for {retry_after}s...")
            time.sleep(retry_after + 1)
            
            # Retry once
            resp2 = requests.get(url, headers=HEADERS, params=params, timeout=15)
            _LAST_REQUEST_TIME = time.time()
            if resp2.status_code == 200:
                data2 = resp2.json()
                _CACHE[cache_key] = (time.time(), data2)
                return data2
            print(f"IPO Guru retry failed ({resp2.status_code}): {resp2.text}")
            return None
        else:
            print(f"IPO Guru error ({resp.status_code}) on {url}: {resp.text}")
            return None
    except Exception as e:
        print(f"IPO Guru connection error on {url}: {e}")
        return None

def get_account_status():
    """
    Checks plan, limits, and quota remaining for the IPO Guru API key.
    """
    res = _get_api(f"{BASE_URL}/me")
    return res

def fetch_active_ipos(ipo_type="mainboard", limit=15):
    """
    Fetches the latest IPO list from IPO Guru API.
    Returns a list of IPO summaries.
    """
    params = {"limit": limit}
    if ipo_type:
        params["type"] = ipo_type
    res = _get_api(f"{BASE_URL}/ipos", params=params)
    return res.get("data", []) if res else []

def fetch_ipo_detail(slug):
    """
    Fetches the complete IPO detail document for a single issue.
    Includes issue terms, timeline, GMP, financials, and promoter holding.
    """
    if not slug:
        return None
    res = _get_api(f"{BASE_URL}/ipos/{slug}")
    return res.get("data", {}) if res else None

def fetch_live_gmp():
    """
    Fetches current GMP for all open and upcoming IPOs in a single call.
    """
    res = _get_api(f"{BASE_URL}/gmp")
    if res:
        return {item["slug"]: item.get("gmp", {}) for item in res.get("data", [])}
    return {}

def parse_percentage(val):
    if val is None:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    match = re.search(r'([\d\.]+)', str(val).replace(',', ''))
    return float(match.group(1)) if match else 0.0

def parse_number(val):
    if val is None:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    match = re.search(r'([\d\.,]+)', str(val))
    if match:
        try:
            return float(match.group(1).replace(',', ''))
        except ValueError:
            return 0.0
    return 0.0

def normalize_ipoguru_record(detail):
    """
    Normalizes the rich JSON payload from IPO Guru into the canonical
    database schema matching the 8 decision metrics.
    """
    if not detail:
        return None

    issue = detail.get("issue", {})
    timeline = detail.get("timeline", {})
    gmp = detail.get("gmp", {})
    company = detail.get("company", {})

    name = detail.get("name") or detail.get("display_name", "Unknown IPO")
    slug = detail.get("slug", "")

    # Price Band
    price_min = issue.get("price_min") or detail.get("price_min")
    price_max = issue.get("price_max") or detail.get("price_max")
    if price_min is None or price_max is None:
        pb = issue.get("price_band") or detail.get("price_band") or ""
        nums = re.findall(r'\d+', pb)
        if len(nums) >= 2:
            price_min = float(nums[0])
            price_max = float(nums[1])
        elif len(nums) == 1:
            price_min = price_max = float(nums[0])
        else:
            price_min = price_max = parse_number(issue.get("issue_price") or detail.get("issue_price", 0))

    lot_size = issue.get("lot_size") or detail.get("lot_size") or 1
    issue_size_cr = parse_number(issue.get("issue_size") or detail.get("issue_size", 0.0))
    retail_lot_cost = issue.get("min_investment") or detail.get("min_investment") or (lot_size * (price_max or 0.0))

    # Dates
    open_date = timeline.get("open_date") or detail.get("open_date")
    close_date = timeline.get("close_date") or detail.get("close_date")
    listing_date = timeline.get("listing_date") or detail.get("listing_date")

    # GMP (Metric 4)
    gmp_pct = parse_percentage(gmp.get("percentage", 0.0))
    gmp_rs = parse_number(gmp.get("price", 0.0))
    est_listing = parse_number(gmp.get("estimated_listing_price", 0.0))

    # Promoter Post-Holding (Metric 8)
    post_holding_str = company.get("post_holding")
    post_holding_pct = parse_percentage(post_holding_str) if post_holding_str else 0.0

    # Valuation - IPO P/E (Metric 3 Part 1)
    ipo_pe = 0.0
    kpis = company.get("kpis") or []
    for kpi in kpis:
        if kpi.get("key") == "pe" or "p/e" in str(kpi.get("label", "")).lower():
            ipo_pe = parse_number(kpi.get("value"))
            break

    # Financials (Metric 6)
    fin_data = []
    fin_block = company.get("financials") or {}
    headers = fin_block.get("headers") or []
    rows = fin_block.get("rows") or []

    rev_row = next((r for r in rows if any(k in r.get("metric", "").lower() for k in ["total income", "revenue"])), None)
    pat_row = next((r for r in rows if "profit after tax" in r.get("metric", "").lower() or "pat" in r.get("metric", "").lower()), None)

    if headers and pat_row and rev_row:
        # Match year by column index
        for idx, year in enumerate(headers):
            if idx < len(rev_row.get("data", [])) and idx < len(pat_row.get("data", [])):
                r_val = parse_number(rev_row["data"][idx])
                p_val = parse_number(pat_row["data"][idx])
                margin = (p_val / r_val * 100.0) if r_val > 0 else 0.0
                fin_data.append({
                    "fiscal_year": year,
                    "revenue_cr": r_val,
                    "pat_cr": p_val,
                    "pat_margin_pct": round(margin, 2)
                })

    # Status
    status = detail.get("status", "upcoming").lower()

    return {
        "slug": slug,
        "name": name,
        "symbol": issue.get("nse_symbol") or issue.get("bse_scrip_code") or slug[:10].upper().replace("-", ""),
        "price_band_low": float(price_min or 0.0),
        "price_band_high": float(price_max or 0.0),
        "issue_size_cr": float(issue_size_cr),
        "lot_size": int(lot_size),
        "retail_lot_cost": float(retail_lot_cost),
        "open_date": open_date,
        "close_date": close_date,
        "listing_date": listing_date,
        "status": status,
        "gmp_pct": gmp_pct,
        "gmp_rs": gmp_rs,
        "estimated_listing": est_listing,
        "post_ipo_promoter_holding_pct": post_holding_pct,
        "ipo_pe": ipo_pe,
        "financials": fin_data,
        "logo": (detail.get("images") or {}).get("logo") or detail.get("logo"),
        "web_url": detail.get("web_url", "")
    }

if __name__ == "__main__":
    print("Testing IPO Guru Client...")
    acc = get_account_status()
    print("Account:", acc.get("data", {}).get("name") if acc else "Failed")
    ipos = fetch_active_ipos()
    print(f"Fetched {len(ipos)} IPOs from calendar")
    if ipos:
        slug = ipos[0]["slug"]
        detail = fetch_ipo_detail(slug)
        norm = normalize_ipoguru_record(detail)
        print(f"Normalized first IPO ({norm['name']}):")
        print(f"  P/E: {norm['ipo_pe']}x | Promoter Holding: {norm['post_ipo_promoter_holding_pct']}% | GMP: {norm['gmp_pct']}%")
