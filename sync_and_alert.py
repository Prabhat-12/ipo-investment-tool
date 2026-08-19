from datetime import datetime, timedelta
import json
import os

from scraper import sync_active_ipos
from decision_engine import evaluate_ipo
from notifier import send_alert
import db_client

def process_sync_and_alerts():
    print(f"--- Running Automated Sync and Alert Check: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ---")
    
    # 1. Trigger scraper sync
    sync_active_ipos()
    
    # 2. Query database for active bidding or recently closed IPOs (to re-evaluate decisions with final day data)
    today_str = datetime.now().strftime("%Y-%m-%d")
    today = datetime.now().date()
    
    if db_client.IS_CLOUD_MODE:
        try:
            # Query active and closed IPOs in cloud mode
            res = db_client.supabase_client.table("ipos").select("*").in_("status", ["bidding", "closed"]).execute()
            bidding_ipos = res.data
        except Exception as e:
            print(f"Error querying Cloud DB: {e}")
            bidding_ipos = []
    else:
        # Offline mode
        db = db_client._load_local_db()
        bidding_ipos = [x for x in db["ipos"] if x["status"] in ["bidding", "closed"]]
        
    print(f"Detected {len(bidding_ipos)} active bidding or closed IPOs today.")
    
    for ipo in bidding_ipos:
        close_date_str = ipo.get("close_date")
        if not close_date_str:
            continue
            
        close_date = datetime.strptime(close_date_str, "%Y-%m-%d").date()
        
        # Check if today is the final bidding day or the day after closing (to capture absolute final figures)
        # In a real environment, we'd trigger a notification on the final day, typically around 1 PM - 3 PM
        if today == close_date or today == (close_date + timedelta(days=1)):
            # Reconstruct details to run through decision engine
            if db_client.IS_CLOUD_MODE:
                # Fetch related tables
                sub_res = db_client.supabase_client.table("subscriptions").select("*").eq("ipo_id", ipo["id"]).order("date", desc=True).limit(1).execute()
                gmp_res = db_client.supabase_client.table("gmp_history").select("*").eq("ipo_id", ipo["id"]).order("date", desc=True).limit(1).execute()
                fin_res = db_client.supabase_client.table("financials").select("*").eq("ipo_id", ipo["id"]).execute()
                peer_res = db_client.supabase_client.table("peers").select("*").eq("ipo_id", ipo["id"]).execute()
                
                sub_data = sub_res.data[0] if sub_res.data else {}
                gmp_data = gmp_res.data[0] if gmp_res.data else {}
                
                ipo_eval_data = {
                    **ipo,
                    "total_sub": float(sub_data.get("total", 0.0)),
                    "qib_sub": float(sub_data.get("qib", 0.0)),
                    "retail_sub": float(sub_data.get("retail", 0.0)),
                    "gmp_pct": float(gmp_data.get("implied_gain_pct", 0.0)),
                    "pe_ratio": float(ipo.get("price_band_high", 500) / 2.0), # dummy PE
                    "peers_median_pe": float(peer_res.data[0].get("peer_pe", 35.0)) if peer_res.data else 35.0,
                    "financials": fin_res.data
                }
            else:
                db = db_client._load_local_db()
                sub_list = db["subscriptions"]
                gmp_list = db["gmp_history"]
                
                sub_list_filtered = [x for x in sub_list if x["ipo_id"] == ipo["id"]]
                gmp_list_filtered = [x for x in gmp_list if x["ipo_id"] == ipo["id"]]
                
                sub_data = sorted(sub_list_filtered, key=lambda x: x["date"])[-1] if sub_list_filtered else {}
                gmp_data = sorted(gmp_list_filtered, key=lambda x: x["date"])[-1] if gmp_list_filtered else {}
                fin_data = [x for x in db["financials"] if x["ipo_id"] == ipo["id"]]
                peer_data = [x for x in db["peers"] if x["ipo_id"] == ipo["id"]]
                
                ipo_eval_data = {
                    **ipo,
                    "total_sub": float(sub_data.get("total", 0.0)),
                    "qib_sub": float(sub_data.get("qib", 0.0)),
                    "retail_sub": float(sub_data.get("retail", 0.0)),
                    "gmp_pct": float(gmp_data.get("implied_gain_pct", 0.0)),
                    "pe_ratio": float(ipo.get("price_band_high", 500) / 2.0),
                    "peers_median_pe": float(peer_data[0].get("peer_pe", 35.0)) if peer_data else 35.0,
                    "financials": fin_data
                }
                
            # Run through decision engine
            eval_res = evaluate_ipo(ipo_eval_data)
            decision = eval_res["decision"]
            score = eval_res["score"]
            notes = eval_res["notes"]
            
            # Send Push Notification Alert
            alert_title = f"🚨 FINAL DAY ALERT: {ipo['name']} ({ipo['symbol']})"
            alert_message = (
                f"Subscription: {ipo_eval_data['total_sub']}x (QIB: {ipo_eval_data['qib_sub']}x)\n"
                f"GMP Implied Premium: {ipo_eval_data['gmp_pct']}%\n"
                f"Passed Metrics: {score}/8\n\n"
                f"📢 FINAL SIGNAL: **{decision}**\n"
                f"Reasoning: {notes}\n"
            )
            
            # Write decision back to database
            ipo["decision"] = decision
            ipo["decision_notes"] = notes
            db_client.upsert_ipo(ipo)
            
            # Send alert
            send_alert(alert_title, alert_message)
            
        else:
            # Send a general upcoming alert if opening today
            open_date = datetime.strptime(ipo.get("open_date"), "%Y-%m-%d").date()
            if today == open_date:
                alert_title = f"🚀 IPO OPENING TODAY: {ipo['name']}"
                alert_message = (
                    f"Price Band: ₹{ipo['price_band_low']} - ₹{ipo['price_band_high']}\n"
                    f"Issue Size: ₹{ipo['issue_size_cr']} Cr\n"
                    f"Lot Cost: ₹{ipo['retail_lot_cost']:.2f}\n"
                    f"Closes on: {close_date_str}"
                )
                send_alert(alert_title, alert_message)

    print("--- Automation Job Finished ---")

if __name__ == "__main__":
    process_sync_and_alerts()
