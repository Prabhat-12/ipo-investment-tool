# Wrapper for details scraper
from scraper import scrape_ipo_details

if __name__ == "__main__":
    # Test details parsing on mock fallback
    details = scrape_ipo_details("", "Unicommerce eSolutions Limited")
    print(f"Details Scraper (Mock Mode):")
    print(f" - Fresh Issue: ₹{details['fresh_issue_cr']} Cr")
    print(f" - OFS Size: ₹{details['ofs_cr']} Cr")
    print(f" - Market Cap: ₹{details['market_cap_cr']} Cr")
    print(f" - Promoter Stake: {details['post_ipo_promoter_holding_pct']}%")
