# Wrapper for subscription scraper
from scraper import scrape_subscriptions

if __name__ == "__main__":
    subs = scrape_subscriptions("", "Ola Electric Mobility Limited")
    print(f"Subscriptions Scraper (Mock Mode):")
    print(f" - Retail Subscribed: {subs['retail']}x")
    print(f" - QIB Subscribed: {subs['qib']}x")
    print(f" - Total Subscribed: {subs['total']}x")
