# Wrapper for GMP scraper
from scraper import scrape_gmp

if __name__ == "__main__":
    gmp_pct = scrape_gmp("FirstCry (Brainbees Solutions) Limited")
    print(f"GMP Scraper (Mock Mode):")
    print(f" - GMP Premium Pct: {gmp_pct}%")
