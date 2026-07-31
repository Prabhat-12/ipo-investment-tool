import os
import json
from dotenv import load_dotenv

# Import database clients and engine
import db_client
from decision_engine import evaluate_ipo

def seed_data():
    """
    Reads historical IPOs from JSON and seeds them into the Supabase database.
    This enables you to see your 21 historical backtest records directly in the Supabase Cloud.
    """
    load_dotenv()
    
    if not db_client.IS_CLOUD_MODE:
        print("Error: Supabase environment variables not configured in .env.")
        print("Please configure SUPABASE_URL and SUPABASE_KEY in your .env file to enable cloud sync.")
        return
        
    print("--- Starting Supabase Database Seeding (Cloud Sync) ---")
    
    # Read historical JSON file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    historical_path = os.path.join(current_dir, "db", "historical_ipos.json")
    
    if not os.path.exists(historical_path):
        print(f"Error: Historical records file not found at {historical_path}")
        return
        
    with open(historical_path, "r") as f:
        ipos = json.load(f)
        
    print(f"Loaded {len(ipos)} historical records to upload...")
    
    for idx, ipo in enumerate(ipos):
        print(f"Uploading [{idx+1}/{len(ipos)}]: {ipo['name']} ({ipo.get('symbol')})")
        
        # Run evaluation to compute YES/NO decisions to store
        eval_res = evaluate_ipo(ipo)
        
        # 1. Upsert IPO master data
        ipo_id = db_client.upsert_ipo({
            "name": ipo["name"],
            "symbol": ipo.get("symbol", ipo["name"][:10].upper()),
            "price_band_low": ipo.get("price_band_high", 500) * 0.9, # approximate low band
            "price_band_high": ipo["price_band_high"],
            "issue_size_cr": ipo["issue_size_cr"],
            "fresh_issue_cr": ipo["fresh_issue_cr"],
            "ofs_cr": ipo["ofs_cr"],
            "lot_size": ipo["lot_size"],
            "retail_lot_cost": ipo["retail_lot_cost"],
            "open_date": ipo["open_date"],
            "close_date": ipo["close_date"],
            "listing_date": ipo["listing_date"],
            "status": ipo["status"],
            "market_cap_cr": ipo["market_cap_cr"],
            "post_ipo_promoter_holding_pct": ipo["post_ipo_promoter_holding_pct"],
            "decision": eval_res["decision"],
            "decision_notes": eval_res["notes"]
        })
        
        if ipo_id:
            # 2. Upload subscription record
            db_client.upsert_subscription({
                "ipo_id": ipo_id,
                "date": ipo["open_date"], # use opening date as historical timestamp
                "qib": ipo["qib_sub"],
                "nii": ipo["nii_sub"],
                "retail": ipo["retail_sub"],
                "total": ipo["total_sub"]
            })
            
            # 3. Upload GMP record
            gmp_rs = ipo["price_band_high"] * (ipo["gmp_pct"] / 100.0)
            db_client.upsert_gmp({
                "ipo_id": ipo_id,
                "date": ipo["open_date"],
                "gmp_rs": gmp_rs,
                "estimated_listing": ipo["price_band_high"] + gmp_rs,
                "implied_gain_pct": ipo["gmp_pct"]
            })
            
            # 4. Upload peers
            if ipo.get("peers_median_pe"):
                peers_list = [
                    {"peer_name": "Industry Peers (Median)", "peer_pe": ipo["peers_median_pe"], "ipo_pe": ipo["pe_ratio"]}
                ]
                db_client.save_peers(ipo_id, peers_list)
                
            # 5. Upload financials
            if ipo.get("financials"):
                db_client.save_financials(ipo_id, ipo["financials"])
                
            # 6. Upload mock anchors
            anchors_list = [
                {"investor_name": "Marquee Mutual Funds (Anchor)", "shares_allocated": 100000, "amount_allocated_cr": 5.0, "is_marquee": True}
            ]
            db_client.save_anchors(ipo_id, anchors_list)

    print("Success! Supabase seeding completed successfully.")

if __name__ == "__main__":
    seed_data()
