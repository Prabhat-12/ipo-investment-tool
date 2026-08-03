import os
import json
import db_client

def dump():
    if not db_client.IS_CLOUD_MODE:
        print("Not in cloud mode, nothing to dump.")
        return
    
    print("Dumping Supabase tables to local JSON...")
    
    tables = [
        "ipos",
        "subscriptions",
        "gmp_history",
        "peers",
        "financials",
        "anchor_investors",
        "family_groups",
        "family_members",
        "user_accounts",
        "user_applications"
    ]
    
    db = {}
    for table in tables:
        try:
            res = db_client.supabase_client.table(table).select("*").execute()
            db[table] = res.data
            print(f"Fetched {len(res.data)} records from '{table}'")
        except Exception as e:
            print(f"Error fetching table {table}: {e}")
            db[table] = []
            
    # Write to local path
    local_path = os.path.join(os.path.dirname(__file__), "src", "data", "db_local.json")
    with open(local_path, "w") as f:
        json.dump(db, f, indent=4)
        
    print(f"Successfully dumped data to {local_path}")

if __name__ == "__main__":
    dump()
