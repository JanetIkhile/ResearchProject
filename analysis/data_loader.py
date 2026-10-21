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

def get_trial_counts(trials_df, participants_df=None, sessions_df=None):
    """
    Returns an unstacked DataFrame of distinct trial numbers per participant and task type.
    Useful for quick preprocessing verification.
    """
    df = trials_df.copy()
    if sessions_df is not None and not sessions_df.empty:
        main_mask = (sessions_df['session_type'] == 'main') if 'session_type' in sessions_df.columns else pd.Series(True, index=sessions_df.index)
        if 'completed' in sessions_df.columns:
            main_mask = main_mask & (sessions_df['completed'] == True)
        df = df[df['session_id'].isin(sessions_df[main_mask]['id'])]
        
    if participants_df is not None and 'participant_code' in participants_df.columns:
        p_map = dict(zip(participants_df['id'], participants_df['participant_code']))
        df['participant_code'] = df['participant_id'].map(p_map).fillna(df['participant_id'])
        subj_col = 'participant_code'
    else:
        subj_col = 'participant_id'
        
    return df.groupby([subj_col, 'task_type'])['trial_number'].nunique().unstack(fill_value=0)

def remap_control_participants(participants_df):
    """
    Remaps participant codes and cohorts based on diagnosis and code order (NOT timestamps):
    - Control cohort: Participants with diagnosis in ['control', 'caregiver', 'other', etc.]
      are mapped to C01, C02, etc. in numerical order of their original app codes (P07 -> C01, P08 -> C02, etc.).
    - Parkinson's cohort: Participants with diagnosis 'parkinsons' retain their P-codes (P01-P06),
      and additional PD participants are mapped sequentially in code order (P21 -> P07, etc.).
    """
    if participants_df.empty or 'participant_group' not in participants_df.columns:
        return participants_df
        
    df_out = participants_df.copy()
    
    def extract_code_num(c):
        digits = ''.join(filter(str.isdigit, str(c)))
        return int(digits) if digits else 999

    # 1. Remap controls based on diagnosis and code order (e.g. P07 -> C01, P08 -> C02 ... P20 -> C14)
    control_mask = df_out['participant_group'].astype(str).str.lower().isin(
        ['control', 'caregiver', 'healthy', 'hc', 'other', 'normative']
    )
    if control_mask.any():
        control_indices = sorted(
            df_out[control_mask].index,
            key=lambda idx: extract_code_num(df_out.at[idx, 'participant_code'])
        )
        for counter, idx in enumerate(control_indices, 1):
            df_out.at[idx, 'participant_code'] = f"C{counter:02d}"
            
    # 2. Parkinson's cohort: determined by diagnosis ('parkinsons' / 'pd') and code order
    pd_mask = df_out['participant_group'].astype(str).str.lower().isin(['parkinsons', 'pd'])
    if pd_mask.any():
        existing_pd = {'P01', 'P02', 'P03', 'P04', 'P05', 'P06'}
        extra_pd_indices = [
            idx for idx in df_out[pd_mask].index 
            if str(df_out.at[idx, 'participant_code']).strip() not in existing_pd
        ]
        # Map additional PD participants by app code offset (e.g. P21 -> P07, P24 -> P10, P25 -> P11)
        for idx in extra_pd_indices:
            num = extract_code_num(df_out.at[idx, 'participant_code'])
            mapped_num = (num - 14) if num >= 21 else num
            df_out.at[idx, 'participant_code'] = f"P{mapped_num:02d}"
                
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

