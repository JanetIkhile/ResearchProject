import pandas as pd
from supabase import create_client, Client
import json
import os

def deduplicate_trials(trials_df):
    """
    If a participant refreshes the task page, duplicate trial numbers are saved 
    for the same session. We sort by timestamp and keep only the latest trial 
    for each (participant, session, task, trial_number).
    """
    if trials_df.empty or 'timestamp' not in trials_df.columns:
        return trials_df
    
    # Convert timestamp column to datetime to sort accurately
    trials_df['timestamp_dt'] = pd.to_datetime(trials_df['timestamp'], format='mixed')
    trials_df = trials_df.sort_values(by='timestamp_dt')
    
    initial_count = len(trials_df)
    # Drop duplicates, keeping the latest one
    trials_df = trials_df.drop_duplicates(
        subset=['participant_id', 'session_id', 'task_type', 'trial_number'],
        keep='last'
    )
    # Clean up temp column
    trials_df = trials_df.drop(columns=['timestamp_dt'])
    
    final_count = len(trials_df)
    if initial_count != final_count:
        print(f"Deduplicated trials: removed {initial_count - final_count} stale trials (from page refreshes).")
        
    return trials_df

def load_from_csv(data_dir="data"):
    """Loads pilot study data directly from local CSV payload dumps."""
    trials_path = os.path.join(data_dir, "trial_results.csv")
    sessions_path = os.path.join(data_dir, "sessions.csv")
    participants_path = os.path.join(data_dir, "participants.csv")
    
    trials_df = pd.read_csv(trials_path)
    sessions_df = pd.read_csv(sessions_path)
    participants_df = pd.read_csv(participants_path)
    
    # Deduplicate before parsing JSON
    trials_df = deduplicate_trials(trials_df)
    
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
    
    # Deduplicate trials
    trials_df = deduplicate_trials(trials_df)
    
    return trials_df, sessions_df, participants_df

