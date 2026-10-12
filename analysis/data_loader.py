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

def remap_control_participants(participants_df):
    """
    Automatically remaps control/caregiver group participants to C01, C02, etc.,
    ordered by creation timestamp, even if selected as P07, P08 in app dropdown.
    """
    if participants_df.empty or 'participant_group' not in participants_df.columns:
        return participants_df
        
    df_out = participants_df.copy()
    
    # Check if there are any control/caregiver participants to remap
    control_mask = df_out['participant_group'].astype(str).str.lower().isin(['control', 'caregiver', 'healthy', 'hc', 'other', 'normative'])
    if not control_mask.any():
        return df_out
        
    # Sort control participants by created_at timestamp
    if 'created_at' in df_out.columns:
        df_out['created_dt'] = pd.to_datetime(df_out['created_at'], format='mixed')
        df_out = df_out.sort_values(by='created_dt').reset_index(drop=True)
        
    control_counter = 1
    for idx, row in df_out.iterrows():
        group = str(row.get('participant_group', '')).lower()
        if group in ['control', 'caregiver', 'healthy', 'hc', 'other', 'normative']:
            df_out.at[idx, 'participant_code'] = f"C{control_counter:02d}"
            control_counter += 1
            
    if 'created_dt' in df_out.columns:
        df_out = df_out.drop(columns=['created_dt'])
        
    return df_out

def load_from_csv(data_dir="data", remap_controls=True):
    """Loads pilot study data directly from local CSV payload dumps."""
    trials_path = os.path.join(data_dir, "trial_results.csv")
    sessions_path = os.path.join(data_dir, "sessions.csv")
    participants_path = os.path.join(data_dir, "participants.csv")
    
    trials_df = pd.read_csv(trials_path)
    sessions_df = pd.read_csv(sessions_path)
    participants_df = pd.read_csv(participants_path)
    
    if remap_controls:
        participants_df = remap_control_participants(participants_df)
    
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

def load_from_supabase(url: str, key: str, remap_controls=True):
    """Fetches high-throughput live data directly out of the Supabase architecture."""
    supabase: Client = create_client(url, key)
    
    trials_query = supabase.table("trial_results").select("*").execute()
    sessions_query = supabase.table("sessions").select("*").execute()
    participants_query = supabase.table("participants").select("*").execute()
    
    trials_df = pd.DataFrame(trials_query.data)
    sessions_df = pd.DataFrame(sessions_query.data)
    participants_df = pd.DataFrame(participants_query.data)
    
    if remap_controls:
        participants_df = remap_control_participants(participants_df)
    
    # Deduplicate trials
    trials_df = deduplicate_trials(trials_df)
    
    return trials_df, sessions_df, participants_df

