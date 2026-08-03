import db_client

def inspect():
    if not db_client.IS_CLOUD_MODE:
        print("Not connected to Cloud Supabase.")
        return
        
    try:
        # Query pg_policies to list all active policies
        query = """
        SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check 
        FROM pg_policies 
        WHERE tablename IN ('family_members', 'family_groups')
        """
        res = db_client.supabase_client.rpc("get_policies").execute()
        print("RPC Policies result:", res.data)
    except Exception as e:
        # Fallback to direct SQL query if RPC isn't defined, or let's inspect via standard catalog endpoint if possible.
        print("RPC get_policies not defined. Let's list policies via raw catalog SELECT:")
        try:
            # We can use postgrest to query pg_catalog if exposed, but usually pg_catalog isn't exposed via REST.
            # Instead of catalog queries which might be blocked, let's write a python script that connects via psycopg2 if possible.
            print("Postgrest API does not support raw SQL by default. Let's try to query public schemas or try standard queries.")
        except Exception as err:
            print("Error:", err)

if __name__ == "__main__":
    inspect()
