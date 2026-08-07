import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env file
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Check if we should run in Cloud Mode (Supabase) or Offline Mode (Local JSON)
IS_CLOUD_MODE = False
supabase_client: Client = None

if SUPABASE_URL and SUPABASE_KEY:
    # Verify it's not the default placeholder from .env.example
    if "your-project-id" not in SUPABASE_URL and "your-supabase-anon" not in SUPABASE_KEY:
        try:
            supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
            IS_CLOUD_MODE = True
            print("Database Status: ONLINE (Supabase Cloud Connected)")
        except Exception as e:
            print(f"Database Connection Error: {e}. Falling back to OFFLINE Mode.")
            IS_CLOUD_MODE = False

if not IS_CLOUD_MODE:
    print("Database Status: OFFLINE (Local JSON Mock Mode Active)")
    LOCAL_DB_PATH = os.path.join(os.path.dirname(__file__), "src", "data", "db_local.json")
    os.makedirs(os.path.dirname(LOCAL_DB_PATH), exist_ok=True)
    if not os.path.exists(LOCAL_DB_PATH):
        # Create empty database structures
        with open(LOCAL_DB_PATH, "w") as f:
            json.dump({
                "ipos": [],
                "subscriptions": [],
                "gmp_history": [],
                "peers": [],
                "financials": [],
                "anchor_investors": [],
                "user_profiles": [],
                "family_groups": [],
                "family_members": [],
                "user_accounts": [],
                "user_applications": []
            }, f, indent=4)


# Helper functions to load/save in offline local JSON mode
def _load_local_db():
    LOCAL_DB_PATH = os.path.join(os.path.dirname(__file__), "src", "data", "db_local.json")
    try:
        with open(LOCAL_DB_PATH, "r") as f:
            data = json.load(f)
            # Ensure new keys exist if loading an older JSON file
            for key in ["user_profiles", "family_groups", "family_members", "user_accounts", "user_applications"]:
                if key not in data:
                    data[key] = []
            return data
    except Exception:
        return {
            "ipos": [], "subscriptions": [], "gmp_history": [], "peers": [], "financials": [], "anchor_investors": [],
            "user_profiles": [], "family_groups": [], "family_members": [], "user_accounts": [], "user_applications": []
        }

def _save_local_db(db):
    LOCAL_DB_PATH = os.path.join(os.path.dirname(__file__), "src", "data", "db_local.json")
    with open(LOCAL_DB_PATH, "w") as f:
        json.dump(db, f, indent=4)


import re

def normalize_company_name(name):
    if not name:
        return ""
    n = name.lower()
    # Remove common suffixes from the end of the name
    n = re.sub(r'\s+(limited|ltd|ipo|details)\b', '', n, flags=re.IGNORECASE)
    n = re.sub(r'\s+(limited|ltd|ipo|details)\b', '', n, flags=re.IGNORECASE)
    return re.sub(r'\s+', ' ', n).strip()

# Unified Database Methods
def upsert_ipo(ipo_data):
    """
    Inserts or updates an IPO record. 
    ipo_data should be a dictionary with keys matching SQL columns.
    """
    if IS_CLOUD_MODE:
        try:
            # Fetch existing IPOs to do a normalized name comparison
            res = supabase_client.table("ipos").select("id, name").execute()
            existing_id = None
            existing_name = None
            norm_target = normalize_company_name(ipo_data.get("name", ""))
            
            for existing in res.data:
                if normalize_company_name(existing["name"]) == norm_target:
                    existing_id = existing["id"]
                    existing_name = existing["name"]
                    break
            
            if existing_id:
                # Update existing (but keep cleaner/longer name if target has "IPO" suffix and existing doesn't)
                ipo_data_copy = ipo_data.copy()
                if "name" in ipo_data_copy:
                    if "ipo" in ipo_data["name"].lower() and "ipo" not in existing_name.lower():
                        ipo_data_copy["name"] = existing_name
                
                supabase_client.table("ipos").update(ipo_data_copy).eq("id", existing_id).execute()
                return existing_id
            else:
                # Insert new
                res = supabase_client.table("ipos").insert(ipo_data).execute()
                return res.data[0]["id"]
        except Exception as e:
            print(f"Cloud DB Error in upsert_ipo: {e}")
            return None
    else:
        # Offline mode
        db = _load_local_db()
        norm_target = normalize_company_name(ipo_data.get("name", ""))
        existing = next((x for x in db["ipos"] if normalize_company_name(x["name"]) == norm_target), None)
        if existing:
            # Update values (but keep cleaner/longer name if target has "IPO" suffix and existing doesn't)
            existing_name = existing["name"]
            ipo_data_copy = ipo_data.copy()
            if "name" in ipo_data_copy:
                if "ipo" in ipo_data["name"].lower() and "ipo" not in existing_name.lower():
                    ipo_data_copy["name"] = existing_name
            existing.update(ipo_data_copy)
            _save_local_db(db)
            return existing["id"]
        else:
            # Insert new
            new_id = len(db["ipos"]) + 1
            ipo_copy = ipo_data.copy()
            ipo_copy["id"] = new_id
            db["ipos"].append(ipo_copy)
            _save_local_db(db)
            return new_id


def upsert_subscription(sub_data):
    """
    sub_data: dict with keys (ipo_id, date, qib, nii, retail, total)
    """
    if IS_CLOUD_MODE:
        try:
            # Query if it exists for this ipo_id and date
            res = supabase_client.table("subscriptions").select("id").eq("ipo_id", sub_data["ipo_id"]).eq("date", sub_data["date"]).execute()
            if res.data:
                supabase_client.table("subscriptions").update(sub_data).eq("id", res.data[0]["id"]).execute()
            else:
                supabase_client.table("subscriptions").insert(sub_data).execute()
        except Exception as e:
            print(f"Cloud DB Error in upsert_subscription: {e}")
    else:
        db = _load_local_db()
        existing = next((x for x in db["subscriptions"] if x["ipo_id"] == sub_data["ipo_id"] and x["date"] == sub_data["date"]), None)
        if existing:
            existing.update(sub_data)
        else:
            sub_copy = sub_data.copy()
            sub_copy["id"] = len(db["subscriptions"]) + 1
            db["subscriptions"].append(sub_copy)
        _save_local_db(db)


def upsert_gmp(gmp_data):
    """
    gmp_data: dict with keys (ipo_id, date, gmp_rs, estimated_listing, implied_gain_pct)
    """
    if IS_CLOUD_MODE:
        try:
            res = supabase_client.table("gmp_history").select("id").eq("ipo_id", gmp_data["ipo_id"]).eq("date", gmp_data["date"]).execute()
            if res.data:
                supabase_client.table("gmp_history").update(gmp_data).eq("id", res.data[0]["id"]).execute()
            else:
                supabase_client.table("gmp_history").insert(gmp_data).execute()
        except Exception as e:
            print(f"Cloud DB Error in upsert_gmp: {e}")
    else:
        db = _load_local_db()
        existing = next((x for x in db["gmp_history"] if x["ipo_id"] == gmp_data["ipo_id"] and x["date"] == gmp_data["date"]), None)
        if existing:
            existing.update(gmp_data)
        else:
            gmp_copy = gmp_data.copy()
            gmp_copy["id"] = len(db["gmp_history"]) + 1
            db["gmp_history"].append(gmp_copy)
        _save_local_db(db)


def save_peers(ipo_id, peers_list):
    """
    peers_list: list of dicts with keys (peer_name, peer_pe, ipo_pe)
    """
    if IS_CLOUD_MODE:
        try:
            # Delete old peers for this ipo first
            supabase_client.table("peers").delete().eq("ipo_id", ipo_id).execute()
            for peer in peers_list:
                peer_copy = peer.copy()
                peer_copy["ipo_id"] = ipo_id
                supabase_client.table("peers").insert(peer_copy).execute()
        except Exception as e:
            print(f"Cloud DB Error in save_peers: {e}")
    else:
        db = _load_local_db()
        # Filter out old peers
        db["peers"] = [x for x in db["peers"] if x["ipo_id"] != ipo_id]
        for idx, peer in enumerate(peers_list):
            peer_copy = peer.copy()
            peer_copy["id"] = len(db["peers"]) + idx + 1
            peer_copy["ipo_id"] = ipo_id
            db["peers"].append(peer_copy)
        _save_local_db(db)


def save_financials(ipo_id, fin_list):
    """
    fin_list: list of dicts with keys (fiscal_year, revenue_cr, pat_cr, pat_margin_pct)
    """
    if IS_CLOUD_MODE:
        try:
            # Delete old financials for this ipo first
            supabase_client.table("financials").delete().eq("ipo_id", ipo_id).execute()
            for fin in fin_list:
                fin_copy = fin.copy()
                if "year" in fin_copy:
                    fin_copy["fiscal_year"] = fin_copy.pop("year")
                fin_copy["ipo_id"] = ipo_id
                supabase_client.table("financials").insert(fin_copy).execute()
        except Exception as e:
            print(f"Cloud DB Error in save_financials: {e}")
    else:
        db = _load_local_db()
        db["financials"] = [x for x in db["financials"] if x["ipo_id"] != ipo_id]
        for idx, fin in enumerate(fin_list):
            fin_copy = fin.copy()
            if "year" in fin_copy:
                fin_copy["fiscal_year"] = fin_copy.pop("year")
            fin_copy["id"] = len(db["financials"]) + idx + 1
            fin_copy["ipo_id"] = ipo_id
            db["financials"].append(fin_copy)
        _save_local_db(db)


def save_anchors(ipo_id, anchors_list):
    """
    anchors_list: list of dicts with keys (investor_name, shares_allocated, amount_allocated_cr, is_marquee)
    """
    if IS_CLOUD_MODE:
        try:
            # Delete old anchors for this ipo first
            supabase_client.table("anchor_investors").delete().eq("ipo_id", ipo_id).execute()
            for anchor in anchors_list:
                anchor_copy = anchor.copy()
                anchor_copy["ipo_id"] = ipo_id
                supabase_client.table("anchor_investors").insert(anchor_copy).execute()
        except Exception as e:
            print(f"Cloud DB Error in save_anchors: {e}")
    else:
        db = _load_local_db()
        db["anchor_investors"] = [x for x in db["anchor_investors"] if x["ipo_id"] != ipo_id]
        for idx, anchor in enumerate(anchors_list):
            anchor_copy = anchor.copy()
            anchor_copy["id"] = len(db["anchor_investors"]) + idx + 1
            anchor_copy["ipo_id"] = ipo_id
            db["anchor_investors"].append(anchor_copy)
        _save_local_db(db)


# Debug print
if __name__ == "__main__":
    print(f"db_client initialization test: IS_CLOUD_MODE = {IS_CLOUD_MODE}")
