import pandas as pd
from supabase import create_client, Client
import json
import os

def load_from_csv(data_dir="data"):
    """Loads pilot study data directly from local CSV payload dumps."""
    trials_path = os.path.join(data_dir, "trial_results.csv")
    sessions_path = os.path.join(data_dir, "sessions.csv")
    participants_path = os.path.join(data_dir, "participants.csv")
    
    trials_df = pd.read_csv(trials_path)
    sessions_df = pd.read_csv(sessions_path)
    participants_df = pd.read_csv(participants_path)
    
    # Securely unpack JSON structure back into native python dictionaries for kinematic analysis
    def safe_json_load(x):
        if pd.notnull(x) and isinstance(x, str):
            try: return json.loads(x)
            except json.JSONDecodeError: return []
        return x
        
    for col in ['trajectory', 'taps', 'hold_events']:
        if col in trials_df.columns:
            trials_df[col] = trials_df[col].apply(safe_json_load)
        
    return trials_df, sessions_df, participants_df

def load_from_supabase(url: str, key: str):
    """Fetches high-throughput live data directly out of the Supabase architecture."""
    supabase: Client = create_client(url, key)
    
    trials_query = supabase.table("trial_results").select("*").execute()
    sessions_query = supabase.table("sessions").select("*").execute()
    participants_query = supabase.table("participants").select("*").execute()
    
    trials_df = pd.DataFrame(trials_query.data)
    sessions_df = pd.DataFrame(sessions_query.data)
    participants_df = pd.DataFrame(participants_query.data)
    
    return trials_df, sessions_df, participants_df
