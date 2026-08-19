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


# ====================================================
# MULTI-USER & FAMILY GROUP HELPER METHODS
# ====================================================

def get_family_members(group_id):
    """
    Fetches all members in a family group.
    """
    if IS_CLOUD_MODE:
        try:
            res = supabase_client.table("family_members").select("*, user_profiles(display_name, email)").eq("group_id", group_id).execute()
            return res.data
        except Exception as e:
            print(f"Cloud DB Error in get_family_members: {e}")
            return []
    else:
        db = _load_local_db()
        members = [x for x in db["family_members"] if str(x.get("group_id")) == str(group_id)]
        for m in members:
            profile = next((p for p in db["user_profiles"] if str(p.get("id")) == str(m.get("user_id"))), None)
            m["user_profiles"] = profile if profile else {"display_name": "Unknown Member", "email": ""}
        return members


def upsert_family_member(member_data):
    """
    Inserts or updates a family member record.
    """
    if IS_CLOUD_MODE:
        try:
            res = supabase_client.table("family_members").select("id").eq("group_id", member_data["group_id"]).eq("user_id", member_data["user_id"]).execute()
            if res.data:
                supabase_client.table("family_members").update(member_data).eq("id", res.data[0]["id"]).execute()
                return res.data[0]["id"]
            else:
                res = supabase_client.table("family_members").insert(member_data).execute()
                return res.data[0]["id"]
        except Exception as e:
            print(f"Cloud DB Error in upsert_family_member: {e}")
            return None
    else:
        db = _load_local_db()
        existing = next((x for x in db["family_members"] if str(x.get("group_id")) == str(member_data["group_id"]) and str(x.get("user_id")) == str(member_data["user_id"])), None)
        if existing:
            existing.update(member_data)
            _save_local_db(db)
            return existing["id"]
        else:
            new_id = len(db["family_members"]) + 1
            copy_data = member_data.copy()
            copy_data["id"] = new_id
            db["family_members"].append(copy_data)
            _save_local_db(db)
            return new_id


def get_user_accounts(group_id=None, user_id=None):
    """
    Fetches user accounts (PAN slots) for a group or user.
    """
    if IS_CLOUD_MODE:
        try:
            query = supabase_client.table("user_accounts").select("*")
            if group_id:
                query = query.eq("group_id", group_id)
            elif user_id:
                query = query.eq("user_id", user_id)
            res = query.execute()
            return res.data
        except Exception as e:
            print(f"Cloud DB Error in get_user_accounts: {e}")
            return []
    else:
        db = _load_local_db()
        accounts = db["user_accounts"]
        if group_id:
            return [x for x in accounts if str(x.get("group_id")) == str(group_id)]
        elif user_id:
            return [x for x in accounts if str(x.get("user_id")) == str(user_id)]
        return accounts


def upsert_user_account(account_data):
    """
    Inserts or updates a user account.
    """
    if IS_CLOUD_MODE:
        try:
            if account_data.get("id"):
                res = supabase_client.table("user_accounts").update(account_data).eq("id", account_data["id"]).execute()
                return res.data[0]["id"]
            else:
                res = supabase_client.table("user_accounts").insert(account_data).execute()
                return res.data[0]["id"]
        except Exception as e:
            print(f"Cloud DB Error in upsert_user_account: {e}")
            return None
    else:
        import uuid
        db = _load_local_db()
        acc_id = account_data.get("id")
        existing = next((x for x in db["user_accounts"] if str(x.get("id")) == str(acc_id)), None) if acc_id else None
        if existing:
            existing.update(account_data)
            _save_local_db(db)
            return existing["id"]
        else:
            copy_data = account_data.copy()
            new_id = str(uuid.uuid4())
            copy_data["id"] = new_id
            db["user_accounts"].append(copy_data)
            _save_local_db(db)
            return new_id


def get_user_applications(group_id=None, user_id=None):
    """
    Fetches applications (bids) for a group or user.
    """
    if IS_CLOUD_MODE:
        try:
            if group_id:
                res = supabase_client.table("user_applications").select("*, user_accounts!inner(group_id, account_holder_name), ipos(name, symbol)").eq("user_accounts.group_id", group_id).execute()
            elif user_id:
                res = supabase_client.table("user_applications").select("*, user_accounts(account_holder_name), ipos(name, symbol)").eq("user_id", user_id).execute()
            else:
                res = supabase_client.table("user_applications").select("*, user_accounts(account_holder_name), ipos(name, symbol)").execute()
            return res.data
        except Exception as e:
            print(f"Cloud DB Error in get_user_applications: {e}")
            return []
    else:
        db = _load_local_db()
        apps = db["user_applications"]
        hydrated_apps = []
        for a in apps:
            acc = next((x for x in db["user_accounts"] if str(x.get("id")) == str(a.get("account_id"))), {})
            ipo = next((x for x in db["ipos"] if str(x.get("id")) == str(a.get("ipo_id"))), {})
            
            if group_id and str(acc.get("group_id")) != str(group_id):
                continue
            if user_id and str(a.get("user_id")) != str(user_id):
                continue
                
            a_copy = a.copy()
            a_copy["user_accounts"] = acc
            a_copy["ipos"] = {"name": ipo.get("name", "Unknown IPO"), "symbol": ipo.get("symbol", "UNK")}
            hydrated_apps.append(a_copy)
        return hydrated_apps


def upsert_user_application(app_data):
    """
    Inserts or updates a user application (bid).
    """
    if IS_CLOUD_MODE:
        try:
            if app_data.get("id"):
                res = supabase_client.table("user_applications").update(app_data).eq("id", app_data["id"]).execute()
                return res.data[0]["id"]
            else:
                res = supabase_client.table("user_applications").insert(app_data).execute()
                return res.data[0]["id"]
        except Exception as e:
            print(f"Cloud DB Error in upsert_user_application: {e}")
            return None
    else:
        import uuid
        db = _load_local_db()
        app_id = app_data.get("id")
        existing = next((x for x in db["user_applications"] if str(x.get("id")) == str(app_id)), None) if app_id else None
        if existing:
            existing.update(app_data)
            _save_local_db(db)
            return existing["id"]
        else:
            copy_data = app_data.copy()
            new_id = str(uuid.uuid4())
            copy_data["id"] = new_id
            db["user_applications"].append(copy_data)
            _save_local_db(db)
            return new_id


# Debug print
if __name__ == "__main__":
    print(f"db_client initialization test: IS_CLOUD_MODE = {IS_CLOUD_MODE}")
