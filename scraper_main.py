# Wrapper for main list scraper
from scraper import scrape_main_list

if __name__ == "__main__":
    ipos = scrape_main_list()
    print(f"Main List Scraper: Retrieved {len(ipos)} records.")
    for idx, ipo in enumerate(ipos[:3]):
        print(f" {idx+1}. {ipo['name']} (Status: {ipo['status']})")
