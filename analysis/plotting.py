import os
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

def resolve_data(trials_df=None, sessions_df=None, participants_df=None,
                 csv_dir=None, trials_path=None, sessions_path=None, participants_path=None,
                 supabase_url=None, supabase_key=None):
    """
    Resolves data inputs into pandas DataFrames.
    Can accept:
      - Already loaded DataFrames
      - supabase_url and supabase_key to download live data
      - csv_dir containing participants.csv, sessions.csv, and trial_results.csv
      - Specific csv file paths
      - Fallback search to default data/ folder
    """
    # Case 1: DataFrames already provided
    if trials_df is not None and participants_df is not None:
        return trials_df, sessions_df, participants_df

    # Case 2: Supabase config provided
    if supabase_url is not None and supabase_key is not None:
        import data_loader
        return data_loader.load_from_supabase(supabase_url, supabase_key)

    # Case 3: Specific file paths provided
    if trials_path is not None or sessions_path is not None or participants_path is not None:
        t_path = trials_path or "data/trial_results.csv"
        s_path = sessions_path or "data/sessions.csv"
        p_path = participants_path or "data/participants.csv"
        
        tdf = pd.read_csv(t_path)
        sdf = pd.read_csv(s_path) if os.path.exists(s_path) else None
        pdf = pd.read_csv(p_path)
        
        def safe_json_load(x):
            if pd.notnull(x) and isinstance(x, str):
                try: return json.loads(x)
                except json.JSONDecodeError: return []
            return x
            
        for col in ['trajectory', 'taps', 'hold_events']:
            if col in tdf.columns:
                tdf[col] = tdf[col].apply(safe_json_load)
                
        return tdf, sdf, pdf

    # Case 4: Directory path provided
    if csv_dir is not None:
        import data_loader
        return data_loader.load_from_csv(csv_dir)

    # Case 5: Default fallback (search for data directory)
    default_dirs = ["data", "analysis/data", "../data", "/Users/janetikhile/Documents/ResearchProject/analysis/data"]
    for d in default_dirs:
        if os.path.exists(d):
            try:
                import data_loader
                return data_loader.load_from_csv(d)
            except Exception:
                continue
                
    raise FileNotFoundError("Could not locate data source. Please provide DataFrames, file paths, a directory, or database credentials.")


def get_participant_color(index, code=None):
    """Returns a premium, distinct color from a curated palette."""
    colors = {
        'P01': '#0D9488', # Teal
        'P02': '#EA580C', # Orange
        'P03': '#2563EB', # Blue
        'P04': '#7C3AED', # Purple
        'P05': '#EC4899', # Pink
        'P06': '#10B981', # Green
    }
    if code in colors:
        return colors[code]
    palette = ['#0D9488', '#EA580C', '#2563EB', '#7C3AED', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6']
    return palette[index % len(palette)]


def get_radar_colors(p_code, idx):
    """Returns line and fill colors for the radar fingerprints chart."""
    colors = {
        'P01': '#0D9488',
        'P02': '#EA580C',
        'P03': '#2563EB',
        'P04': '#7C3AED'
    }
    fill_colors = {
        'P01': '#CCFBF1',
        'P02': '#FFEDD5',
        'P03': '#DBEAFE',
        'P04': '#F3E8FF'
    }
    if p_code in colors:
        return colors[p_code], fill_colors[p_code]
    
    palette_colors = ['#0D9488', '#EA580C', '#2563EB', '#7C3AED', '#EC4899', '#10B981', '#F59E0B']
    palette_fills = ['#CCFBF1', '#FFEDD5', '#DBEAFE', '#F3E8FF', '#FCE7F3', '#D1FAE5', '#FEF3C7']
    return palette_colors[idx % len(palette_colors)], palette_fills[idx % len(palette_fills)]


def plot_tap_distribution(
    trials_df=None,
    participants_df=None,
    sessions_df=None,
    participant_codes=None,
    trial_number=2,
    session_type='main',
    csv_dir=None,
    supabase_url=None,
    supabase_key=None
):
    """
    Plots tap coordinates relative to targets side-by-side for given participant codes.
    If participant_codes is None, all participants in the dataset are plotted.
    """
    tdf, sdf, pdf = resolve_data(
        trials_df=trials_df,
        sessions_df=sessions_df,
        participants_df=participants_df,
        csv_dir=csv_dir,
        supabase_url=supabase_url,
        supabase_key=supabase_key
    )

    if participant_codes is None:
        participant_codes = sorted(pdf['participant_code'].unique().tolist()) if 'participant_code' in pdf.columns else []

    # Get trials filtered by session type if sessions are provided
    if session_type and sdf is not None:
        main_session_ids = sdf[sdf['session_type'] == session_type]['id']
        main_trials = tdf[tdf['session_id'].isin(main_session_ids)]
    else:
        main_trials = tdf

    num_participants = len(participant_codes)
    if num_participants == 0:
        print("No participants selected.")
        return

    # Use a grid layout if there are many participants
    cols = min(num_participants, 3)
    rows = (num_participants + cols - 1) // cols
    fig, axes = plt.subplots(rows, cols, figsize=(7 * cols, 7 * rows), squeeze=False)

    for idx, p_code in enumerate(participant_codes):
        r = idx // cols
        c = idx % cols
        ax = axes[r, c]
        
        p_rows = pdf[pdf['participant_code'] == p_code]
        if p_rows.empty:
            ax.text(0.5, 0.5, f"Participant {p_code} not found", ha='center', va='center')
            continue
        p_id = p_rows['id'].values[0]
        
        t_data = main_trials[
            (main_trials['participant_id'] == p_id) & 
            (main_trials['task_type'] == 'tap') & 
            (main_trials['trial_number'] == trial_number)
        ]
        
        if t_data.empty:
            ax.text(0.5, 0.5, f"No tap trial {trial_number} for {p_code}", ha='center', va='center')
            continue
            
        trial_row = t_data.iloc[0]
        tx = trial_row['target_x']
        ty = trial_row['target_y']
        tr = trial_row['target_radius']
        taps = trial_row['taps']
        
        if not taps or not isinstance(taps, list):
            ax.text(0.5, 0.5, f"No taps recorded in trial for {p_code}", ha='center', va='center')
            continue

        xs = [t['x'] for t in taps if 'x' in t]
        ys = [t['y'] for t in taps if 'y' in t]
        hits = [t.get('is_inside_target', True) for t in taps]
        
        target_circle = plt.Circle((tx, ty), tr, fill=True, facecolor='#E0F2FE', alpha=0.5, edgecolor='#0284C7', linewidth=2, label='Target Area')
        ax.add_patch(target_circle)
        ax.plot(tx, ty, marker='+', color='#0284C7', markersize=15, markeredgewidth=2, label='Target Center')
        
        xs_hit = [x for x, h in zip(xs, hits) if h]
        ys_hit = [y for y, h in zip(ys, hits) if h]
        xs_miss = [x for x, h in zip(xs, hits) if not h]
        ys_miss = [y for y, h in zip(ys, hits) if not h]
        
        ax.scatter(xs_hit, ys_hit, color='#0D9488', alpha=0.8, edgecolors='black', s=60, zorder=3, label='Hit (Inside)')
        if xs_miss:
            ax.scatter(xs_miss, ys_miss, color='#DC2626', alpha=0.9, edgecolors='black', s=80, zorder=4, label='Miss (Outside)')
            
        hand = p_rows['dominant_arm'].values[0] if 'dominant_arm' in p_rows.columns else 'Unknown'
        ax.set_title(f"Tapping Spatial Spread - {p_code} ({hand})\nTrial {int(trial_row['trial_number'])} ({len(taps)} total taps)", fontsize=13, weight='bold', pad=12)
        ax.set_xlabel("X Coordinate (pixels)", fontsize=11)
        ax.set_ylabel("Y Coordinate (pixels)", fontsize=11)
        ax.set_aspect('equal', 'box')
        
        margin = tr * 1.5
        ax.set_xlim(tx - margin, tx + margin)
        ax.set_ylim(ty - margin, ty + margin)
        
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.grid(True, linestyle='--', alpha=0.3)
        ax.legend(loc='lower right', fontsize=9)

    # Hide unused axes
    for idx in range(num_participants, rows * cols):
        r = idx // cols
        c = idx % cols
        fig.delaxes(axes[r, c])

    title_suffix = " vs ".join(participant_codes) if len(participant_codes) <= 4 else f"{len(participant_codes)} Participants"
    plt.suptitle(f"Raw Tap Spatial Distribution Comparison: {title_suffix}", fontsize=16, weight='bold', y=0.98)
    plt.tight_layout()
    plt.show()


def plot_drag_trajectory(
    trials_df=None,
    participants_df=None,
    sessions_df=None,
    participant_codes=None,
    trial_number=3,
    session_type='main',
    csv_dir=None,
    supabase_url=None,
    supabase_key=None
):
    """
    Plots a single drag trajectory side-by-side for given participant codes.
    If participant_codes is None, all participants in the dataset are plotted.
    """
    tdf, sdf, pdf = resolve_data(
        trials_df=trials_df,
        sessions_df=sessions_df,
        participants_df=participants_df,
        csv_dir=csv_dir,
        supabase_url=supabase_url,
        supabase_key=supabase_key
    )

    if participant_codes is None:
        participant_codes = sorted(pdf['participant_code'].unique().tolist()) if 'participant_code' in pdf.columns else []

    if session_type and sdf is not None:
        main_session_ids = sdf[sdf['session_type'] == session_type]['id']
        main_trials = tdf[tdf['session_id'].isin(main_session_ids)]
    else:
        main_trials = tdf

    num_participants = len(participant_codes)
    if num_participants == 0:
        print("No participants selected.")
        return

    cols = min(num_participants, 3)
    rows = (num_participants + cols - 1) // cols
    fig, axes = plt.subplots(rows, cols, figsize=(7 * cols, 7 * rows), squeeze=False)

    for idx, p_code in enumerate(participant_codes):
        r = idx // cols
        c = idx % cols
        ax = axes[r, c]
        
        p_rows = pdf[pdf['participant_code'] == p_code]
        if p_rows.empty:
            ax.text(0.5, 0.5, f"Participant {p_code} not found", ha='center', va='center')
            continue
        p_id = p_rows['id'].values[0]
        
        t_data = main_trials[
            (main_trials['participant_id'] == p_id) & 
            (main_trials['task_type'] == 'drag') & 
            (main_trials['trial_number'] == trial_number)
        ]
        
        if t_data.empty:
            ax.text(0.5, 0.5, f"No drag trial {trial_number} for {p_code}", ha='center', va='center')
            continue
            
        trial_row = t_data.iloc[0]
        sx, sy, sr = trial_row['start_x'], trial_row['start_y'], trial_row['start_radius']
        tx, ty, tr = trial_row['target_x'], trial_row['target_y'], trial_row['target_radius']
        traj = trial_row['trajectory']
        
        if not traj or not isinstance(traj, list):
            ax.text(0.5, 0.5, f"No trajectory recorded for {p_code}", ha='center', va='center')
            continue

        pxs = [pt['x'] for pt in traj if 'x' in pt]
        pys = [pt['y'] for pt in traj if 'y' in pt]
        
        start_c = plt.Circle((sx, sy), sr, fill=True, facecolor='#DCFCE7', alpha=0.5, edgecolor='#16A34A', linewidth=2, label='Start Area')
        ax.add_patch(start_c)
        
        target_c = plt.Circle((tx, ty), tr, fill=True, facecolor='#E0F2FE', alpha=0.5, edgecolor='#0284C7', linewidth=2, label='Target Area')
        ax.add_patch(target_c)
        
        ax.plot([sx, tx], [sy, ty], color='#94A3B8', linestyle='--', linewidth=1.5, label='Ideal Axis')
        
        path_color = get_participant_color(idx, p_code)
        ax.plot(pxs, pys, color=path_color, linewidth=2.5, label='Actual Drag Path', zorder=3)
        ax.scatter(pxs[0], pys[0], color='#16A34A', s=60, zorder=4, label='Start Touch')
        ax.scatter(pxs[-1], pys[-1], color='#DC2626', s=60, zorder=4, label='Release Touch')
        
        hand = p_rows['dominant_arm'].values[0] if 'dominant_arm' in p_rows.columns else 'Unknown'
        ax.set_title(f"Drag Trajectory (Trial {trial_number}) - {p_code} ({hand})\n({len(traj)} points logged)", fontsize=13, weight='bold', pad=12)
        ax.set_xlabel("X Coordinate (pixels)", fontsize=11)
        ax.set_ylabel("Y Coordinate (pixels)", fontsize=11)
        ax.set_aspect('equal', 'box')
        
        min_x = min(sx, tx) - 100
        max_x = max(sx, tx) + 100
        min_y = min(sy, ty) - 100
        max_y = max(sy, ty) + 100
        ax.set_xlim(min_x, max_x)
        ax.set_ylim(min_y, max_y)
        
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.grid(True, linestyle='--', alpha=0.3)
        ax.legend(loc='lower right', fontsize=9)

    # Hide unused axes
    for idx in range(num_participants, rows * cols):
        r = idx // cols
        c = idx % cols
        fig.delaxes(axes[r, c])

    title_suffix = " vs ".join(participant_codes) if len(participant_codes) <= 4 else f"{len(participant_codes)} Participants"
    plt.suptitle(f"Raw Drag Trajectory Comparison: {title_suffix} (Equivalent Trial {trial_number})", fontsize=16, weight='bold', y=0.98)
    plt.tight_layout()
    plt.show()


def plot_hold_trajectory(
    trials_df=None,
    participants_df=None,
    sessions_df=None,
    participant_codes=None,
    trial_number=1,
    session_type='main',
    csv_dir=None,
    supabase_url=None,
    supabase_key=None
):
    """
    Plots hold postural drift traces side-by-side for given participant codes.
    If participant_codes is None, all participants in the dataset are plotted.
    """
    tdf, sdf, pdf = resolve_data(
        trials_df=trials_df,
        sessions_df=sessions_df,
        participants_df=participants_df,
        csv_dir=csv_dir,
        supabase_url=supabase_url,
        supabase_key=supabase_key
    )

    if participant_codes is None:
        participant_codes = sorted(pdf['participant_code'].unique().tolist()) if 'participant_code' in pdf.columns else []

    if session_type and sdf is not None:
        main_session_ids = sdf[sdf['session_type'] == session_type]['id']
        main_trials = tdf[tdf['session_id'].isin(main_session_ids)]
    else:
        main_trials = tdf

    num_participants = len(participant_codes)
    if num_participants == 0:
        print("No participants selected.")
        return

    cols = min(num_participants, 3)
    rows = (num_participants + cols - 1) // cols
    fig, axes = plt.subplots(rows, cols, figsize=(7 * cols, 7 * rows), squeeze=False)

    for idx, p_code in enumerate(participant_codes):
        r = idx // cols
        c = idx % cols
        ax = axes[r, c]
        
        p_rows = pdf[pdf['participant_code'] == p_code]
        if p_rows.empty:
            ax.text(0.5, 0.5, f"Participant {p_code} not found", ha='center', va='center')
            continue
        p_id = p_rows['id'].values[0]
        
        t_data = main_trials[
            (main_trials['participant_id'] == p_id) & 
            (main_trials['task_type'] == 'hold') & 
            (main_trials['trial_number'] == trial_number)
        ]
        
        if t_data.empty:
            ax.text(0.5, 0.5, f"No hold trial {trial_number} for {p_code}", ha='center', va='center')
            continue
            
        trial_row = t_data.iloc[0]
        tx, ty, tr = trial_row['target_x'], trial_row['target_y'], trial_row['target_radius']
        events = trial_row['hold_events']
        
        if not events or not isinstance(events, list):
            ax.text(0.5, 0.5, f"No hold events recorded for {p_code}", ha='center', va='center')
            continue

        hxs = [e['x'] for e in events if 'x' in e and 'y' in e]
        hys = [e['y'] for e in events if 'x' in e and 'y' in e]
        
        if not hxs:
            ax.text(0.5, 0.5, f"No valid coordinates in hold events for {p_code}", ha='center', va='center')
            continue

        target_c = plt.Circle((tx, ty), tr, fill=True, facecolor='#E0F2FE', alpha=0.2, edgecolor='#0284C7', linewidth=2, label='Target Boundary')
        ax.add_patch(target_c)
        ax.plot(tx, ty, marker='+', color='#0284C7', markersize=15, markeredgewidth=2, label='Target Center')
        
        path_color = get_participant_color(idx, p_code)
        ax.plot(hxs, hys, color=path_color, linewidth=1.5, alpha=0.8, label='Hold Drift Trace')
        
        cx = np.mean(hxs)
        cy = np.mean(hys)
        
        ax.scatter(hxs[0], hys[0], color='#16A34A', s=40, zorder=4, label='Hold Start')
        ax.scatter(hxs[-1], hys[-1], color='#DC2626', s=40, zorder=4, label='Hold End')
        
        hand = p_rows['dominant_arm'].values[0] if 'dominant_arm' in p_rows.columns else 'Unknown'
        ax.set_title(f"Postural Drift Trace (Trial {trial_number}) - {p_code} ({hand})\n({len(hxs)} points logged)", fontsize=13, weight='bold', pad=12)
        ax.set_xlabel("X Coordinate (pixels)", fontsize=11)
        ax.set_ylabel("Y Coordinate (pixels)", fontsize=11)
        ax.set_aspect('equal', 'box')
        
        ax.set_xlim(cx - 75, cx + 75)
        ax.set_ylim(cy - 75, cy + 75)
        
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.grid(True, linestyle='--', alpha=0.3)
        ax.legend(loc='lower right', fontsize=9)

    # Hide unused axes
    for idx in range(num_participants, rows * cols):
        r = idx // cols
        c = idx % cols
        fig.delaxes(axes[r, c])

    title_suffix = " vs ".join(participant_codes) if len(participant_codes) <= 4 else f"{len(participant_codes)} Participants"
    plt.suptitle(f"Raw Hold Postural Drift Comparison: {title_suffix} (Equivalent Trial {trial_number} - Zoomed In)", fontsize=16, weight='bold', y=0.98)
    plt.tight_layout()
    plt.show()


def plot_aggregate_drag_trajectories(
    trials_df=None,
    participants_df=None,
    sessions_df=None,
    participant_codes=None,
    session_type='main',
    csv_dir=None,
    supabase_url=None,
    supabase_key=None
):
    """
    Plots all drag trajectories overlaid side-by-side for given participant codes.
    If participant_codes is None, all participants in the dataset are plotted.
    """
    tdf, sdf, pdf = resolve_data(
        trials_df=trials_df,
        sessions_df=sessions_df,
        participants_df=participants_df,
        csv_dir=csv_dir,
        supabase_url=supabase_url,
        supabase_key=supabase_key
    )

    if participant_codes is None:
        participant_codes = sorted(pdf['participant_code'].unique().tolist()) if 'participant_code' in pdf.columns else []

    if session_type and sdf is not None:
        main_session_ids = sdf[sdf['session_type'] == session_type]['id']
        main_trials = tdf[tdf['session_id'].isin(main_session_ids)]
    else:
        main_trials = tdf

    num_participants = len(participant_codes)
    if num_participants == 0:
        print("No participants selected.")
        return

    cols = min(num_participants, 3)
    rows = (num_participants + cols - 1) // cols
    fig, axes = plt.subplots(rows, cols, figsize=(7.5 * cols, 8 * rows), squeeze=False)

    for idx, p_code in enumerate(participant_codes):
        r = idx // cols
        c = idx % cols
        ax = axes[r, c]
        
        p_rows = pdf[pdf['participant_code'] == p_code]
        if p_rows.empty:
            ax.text(0.5, 0.5, f"Participant {p_code} not found", ha='center', va='center')
            continue
        p_id = p_rows['id'].values[0]
        
        trials = main_trials[
            (main_trials['participant_id'] == p_id) & 
            (main_trials['task_type'] == 'drag')
        ].sort_values(by='trial_number')
        
        if trials.empty:
            ax.text(0.5, 0.5, f"No drag trials for {p_code}", ha='center', va='center')
            continue
            
        first_trial = trials.iloc[0]
        sx, sy, sr = first_trial['start_x'], first_trial['start_y'], first_trial['start_radius']
        tx, ty, tr = first_trial['target_x'], first_trial['target_y'], first_trial['target_radius']
        
        start_c = plt.Circle((sx, sy), sr, fill=True, facecolor='#DCFCE7', alpha=0.6, edgecolor='#16A34A', linewidth=2, zorder=1)
        ax.add_patch(start_c)
        
        target_c = plt.Circle((tx, ty), tr, fill=True, facecolor='#E0F2FE', alpha=0.6, edgecolor='#0284C7', linewidth=2, zorder=1)
        ax.add_patch(target_c)
        
        ax.plot([sx, tx], [sy, ty], color='#94A3B8', linestyle='--', linewidth=2, label='Ideal Axis', zorder=2)
        
        path_color = get_participant_color(idx, p_code)
        
        for t_idx, (_, trial_row) in enumerate(trials.iterrows()):
            traj = trial_row.get('trajectory', [])
            if not traj or not isinstance(traj, list):
                continue
            pxs = [pt['x'] for pt in traj if 'x' in pt]
            pys = [pt['y'] for pt in traj if 'y' in pt]
            
            ax.plot(pxs, pys, color=path_color, linewidth=1.5, alpha=0.4, label='Drag Trials' if t_idx == 0 else "")
            
        hand = p_rows['dominant_arm'].values[0] if 'dominant_arm' in p_rows.columns else 'Unknown'
        ax.set_title(f"All Drag Trajectories Overlaid - {p_code} ({hand})\n(Total trials: {len(trials)})", fontsize=14, weight='bold', pad=12)
        ax.set_xlabel("X Coordinate (pixels)", fontsize=11)
        ax.set_ylabel("Y Coordinate (pixels)", fontsize=11)
        ax.set_aspect('equal', 'box')
        
        min_x = min(sx, tx) - 100
        max_x = max(sx, tx) + 100
        min_y = min(sy, ty) - 100
        max_y = max(sy, ty) + 100
        ax.set_xlim(min_x, max_x)
        ax.set_ylim(min_y, max_y)
        
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.grid(True, linestyle='--', alpha=0.3)
        ax.legend(loc='lower right', fontsize=10)

    # Hide unused axes
    for idx in range(num_participants, rows * cols):
        r = idx // cols
        c = idx % cols
        fig.delaxes(axes[r, c])

    title_suffix = " vs ".join(participant_codes) if len(participant_codes) <= 4 else f"{len(participant_codes)} Participants"
    plt.suptitle(f"Aggregate Drag Trajectory Comparison: {title_suffix} (All Trials Overlaid)", fontsize=18, weight='bold', y=0.98)
    plt.tight_layout()
    plt.show()


def plot_aggregate_tap_distribution(
    trials_df=None,
    participants_df=None,
    sessions_df=None,
    participant_codes=None,
    session_type='main',
    csv_dir=None,
    supabase_url=None,
    supabase_key=None
):
    """
    Plots overlaid tap coordinate points from all trials side-by-side for given participant codes.
    If participant_codes is None, all participants in the dataset are plotted.
    """
    tdf, sdf, pdf = resolve_data(
        trials_df=trials_df,
        sessions_df=sessions_df,
        participants_df=participants_df,
        csv_dir=csv_dir,
        supabase_url=supabase_url,
        supabase_key=supabase_key
    )

    if participant_codes is None:
        participant_codes = sorted(pdf['participant_code'].unique().tolist()) if 'participant_code' in pdf.columns else []

    if session_type and sdf is not None:
        main_session_ids = sdf[sdf['session_type'] == session_type]['id']
        main_trials = tdf[tdf['session_id'].isin(main_session_ids)]
    else:
        main_trials = tdf

    num_participants = len(participant_codes)
    if num_participants == 0:
        print("No participants selected.")
        return

    cols = min(num_participants, 3)
    rows = (num_participants + cols - 1) // cols
    fig, axes = plt.subplots(rows, cols, figsize=(7 * cols, 7 * rows), squeeze=False)

    for idx, p_code in enumerate(participant_codes):
        r = idx // cols
        c = idx % cols
        ax = axes[r, c]
        
        p_rows = pdf[pdf['participant_code'] == p_code]
        if p_rows.empty:
            ax.text(0.5, 0.5, f"Participant {p_code} not found", ha='center', va='center')
            continue
        p_id = p_rows['id'].values[0]
        
        trials = main_trials[
            (main_trials['participant_id'] == p_id) & 
            (main_trials['task_type'] == 'tap')
        ].sort_values(by='trial_number')
        
        if trials.empty:
            ax.text(0.5, 0.5, f"No tap trials for {p_code}", ha='center', va='center')
            continue
            
        first_trial = trials.iloc[0]
        tx, ty, tr = first_trial['target_x'], first_trial['target_y'], first_trial['target_radius']
        
        target_circle = plt.Circle((tx, ty), tr, fill=True, facecolor='#E0F2FE', alpha=0.5, edgecolor='#0284C7', linewidth=2, label='Target Area')
        ax.add_patch(target_circle)
        ax.plot(tx, ty, marker='+', color='#0284C7', markersize=15, markeredgewidth=2, label='Target Center')
        
        colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4']
        
        for t_idx, (_, trial_row) in enumerate(trials.iterrows()):
            taps = trial_row.get('taps', [])
            if not taps or not isinstance(taps, list):
                continue
            xs = [t['x'] for t in taps if 'x' in t]
            ys = [t['y'] for t in taps if 'y' in t]
            hits = [t.get('is_inside_target', True) for t in taps]
            
            xs_hit = [x for x, h in zip(xs, hits) if h]
            ys_hit = [y for y, h in zip(ys, hits) if h]
            xs_miss = [x for x, h in zip(xs, hits) if not h]
            ys_miss = [y for y, h in zip(ys, hits) if not h]
            
            t_num = trial_row['trial_number']
            color = colors[t_idx % len(colors)]
            ax.scatter(xs_hit, ys_hit, color=color, alpha=0.7, edgecolors='black', s=50, zorder=3, label=f'Trial {int(t_num)} Taps')
            if xs_miss:
                ax.scatter(xs_miss, ys_miss, color='#DC2626', alpha=0.9, edgecolors='black', s=70, zorder=4, label=f'Trial {int(t_num)} Misses')
                
        hand = p_rows['dominant_arm'].values[0] if 'dominant_arm' in p_rows.columns else 'Unknown'
        ax.set_title(f"All Tap Trials Overlaid - {p_code} ({hand})\n(Total trials: {len(trials)})", fontsize=13, weight='bold', pad=12)
        ax.set_xlabel("X Coordinate (pixels)", fontsize=11)
        ax.set_ylabel("Y Coordinate (pixels)", fontsize=11)
        ax.set_aspect('equal', 'box')
        margin = tr * 1.5
        ax.set_xlim(tx - margin, tx + margin)
        ax.set_ylim(ty - margin, ty + margin)
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.grid(True, linestyle='--', alpha=0.3)
        ax.legend(loc='lower right', fontsize=8, ncol=2)

    # Hide unused axes
    for idx in range(num_participants, rows * cols):
        r = idx // cols
        c = idx % cols
        fig.delaxes(axes[r, c])

    title_suffix = " vs ".join(participant_codes) if len(participant_codes) <= 4 else f"{len(participant_codes)} Participants"
    plt.suptitle(f"Aggregate Tap Distribution: {title_suffix} (All Trials Overlaid)", fontsize=16, weight='bold', y=0.98)
    plt.tight_layout()
    plt.show()


def plot_aggregate_hold_drift(
    trials_df=None,
    participants_df=None,
    sessions_df=None,
    participant_codes=None,
    session_type='main',
    csv_dir=None,
    supabase_url=None,
    supabase_key=None
):
    """
    Plots overlaid postural drift lines from all hold trials side-by-side.
    If participant_codes is None, all participants in the dataset are plotted.
    """
    tdf, sdf, pdf = resolve_data(
        trials_df=trials_df,
        sessions_df=sessions_df,
        participants_df=participants_df,
        csv_dir=csv_dir,
        supabase_url=supabase_url,
        supabase_key=supabase_key
    )

    if participant_codes is None:
        participant_codes = sorted(pdf['participant_code'].unique().tolist()) if 'participant_code' in pdf.columns else []

    if session_type and sdf is not None:
        main_session_ids = sdf[sdf['session_type'] == session_type]['id']
        main_trials = tdf[tdf['session_id'].isin(main_session_ids)]
    else:
        main_trials = tdf

    num_participants = len(participant_codes)
    if num_participants == 0:
        print("No participants selected.")
        return

    cols = min(num_participants, 3)
    rows = (num_participants + cols - 1) // cols
    fig, axes = plt.subplots(rows, cols, figsize=(7 * cols, 7 * rows), squeeze=False)

    for idx, p_code in enumerate(participant_codes):
        r = idx // cols
        c = idx % cols
        ax = axes[r, c]
        
        p_rows = pdf[pdf['participant_code'] == p_code]
        if p_rows.empty:
            ax.text(0.5, 0.5, f"Participant {p_code} not found", ha='center', va='center')
            continue
        p_id = p_rows['id'].values[0]
        
        trials = main_trials[
            (main_trials['participant_id'] == p_id) & 
            (main_trials['task_type'] == 'hold')
        ].sort_values(by='trial_number')
        
        if trials.empty:
            ax.text(0.5, 0.5, f"No hold trials for {p_code}", ha='center', va='center')
            continue
            
        first_trial = trials.iloc[0]
        tx, ty, tr = first_trial['target_x'], first_trial['target_y'], first_trial['target_radius']
        
        target_c = plt.Circle((tx, ty), tr, fill=True, facecolor='#E0F2FE', alpha=0.1, edgecolor='#0284C7', linewidth=2, label='Target Boundary')
        ax.add_patch(target_c)
        ax.plot(tx, ty, marker='+', color='#0284C7', markersize=15, markeredgewidth=2, label='Target Center')
        
        # Color gradients per participant
        if p_code == 'P01':
            colors = ['#0F766E', '#0D9488', '#2DD4BF', '#14B8A6', '#64D2EC']
        elif p_code == 'P02':
            colors = ['#EA580C', '#F97316', '#FB923C', '#FDBA74', '#FFEDD5']
        else:
            colors = ['#1D4ED8', '#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE']
            
        all_xs = []
        all_ys = []
        
        for t_idx, (_, trial_row) in enumerate(trials.iterrows()):
            events = trial_row.get('hold_events', [])
            if not events or not isinstance(events, list):
                continue
            hxs = [e['x'] for e in events if 'x' in e and 'y' in e]
            hys = [e['y'] for e in events if 'x' in e and 'y' in e]
            
            if not hxs:
                continue
                
            all_xs.extend(hxs)
            all_ys.extend(hys)
            
            t_num = trial_row['trial_number']
            color = colors[t_idx % len(colors)]
            ax.plot(hxs, hys, color=color, linewidth=1.2, alpha=0.7, label=f'Trial {int(t_num)} Drift')
            ax.scatter(hxs[0], hys[0], color='#16A34A', s=30, zorder=4)
            ax.scatter(hxs[-1], hys[-1], color='#DC2626', s=30, zorder=4)
            
        if not all_xs:
            ax.text(0.5, 0.5, f"No valid hold coordinate points for {p_code}", ha='center', va='center')
            continue
            
        cx = np.mean(all_xs)
        cy = np.mean(all_ys)
        
        hand = p_rows['dominant_arm'].values[0] if 'dominant_arm' in p_rows.columns else 'Unknown'
        ax.set_title(f"All Postural Drift Trials Overlaid - {p_code} ({hand})\n(Total trials: {len(trials)})", fontsize=13, weight='bold', pad=12)
        ax.set_xlabel("X Coordinate (pixels)", fontsize=11)
        ax.set_ylabel("Y Coordinate (pixels)", fontsize=11)
        ax.set_aspect('equal', 'box')
        
        ax.set_xlim(cx - 75, cx + 75)
        ax.set_ylim(cy - 75, cy + 75)
        
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.grid(True, linestyle='--', alpha=0.3)
        ax.legend(loc='lower right', fontsize=8, ncol=2)

    # Hide unused axes
    for idx in range(num_participants, rows * cols):
        r = idx // cols
        c = idx % cols
        fig.delaxes(axes[r, c])

    title_suffix = " vs ".join(participant_codes) if len(participant_codes) <= 4 else f"{len(participant_codes)} Participants"
    plt.suptitle(f"Aggregate Hold Postural Drift: {title_suffix} (All Trials Overlaid - Zoomed In)", fontsize=16, weight='bold', y=0.98)
    plt.tight_layout()
    plt.show()


def plot_motor_profile_fingerprints(
    master_df=None,
    participant_codes=None,
    trials_df=None,
    participants_df=None,
    csv_dir=None,
    supabase_url=None,
    supabase_key=None
):
    """
    Plots the Motor Profile Fingerprints radar chart for specified participant codes.
    If participant_codes is None, all participants in the dataset are plotted.
    """
    import clinical_metrics
    if master_df is None:
        tdf, sdf, pdf = resolve_data(
            trials_df=trials_df,
            participants_df=participants_df,
            csv_dir=csv_dir,
            supabase_url=supabase_url,
            supabase_key=supabase_key
        )
        master_df = clinical_metrics.analyze_all(tdf, pdf)
        
    if participant_codes is None:
        participant_codes = sorted(master_df['participant_code'].unique().tolist()) if 'participant_code' in master_df.columns else []

    profile_data = master_df[master_df['participant_code'].isin(participant_codes)].copy()
    if profile_data.empty:
        print("No matching participant profiles found to plot.")
        return

    categories = ['Tapping Speed', 'Tapping Regularity', 'Tapping Accuracy', 'Hold Stability', 'Drag Path Efficiency']
    N = len(categories)
    angles = [n / float(N) * 2 * np.pi for n in range(N)]
    angles += angles[:1]

    fig, ax = plt.subplots(figsize=(9, 9), subplot_kw=dict(polar=True))
    plt.xticks(angles[:-1], categories, color='grey', size=12)
    ax.set_theta_offset(np.pi / 2)
    ax.set_theta_direction(-1)
    plt.yticks([0.2, 0.4, 0.6, 0.8, 1.0], ["20%", "40%", "60%", "80%", "100%"], color="grey", size=10)
    plt.ylim(0, 1)

    for idx, row in profile_data.reset_index().iterrows():
        p_code = row.get('participant_code', f'P{idx+1:02d}')
        
        speed = row.get('tap_Overall_tap_frequency_mean', 0)
        cv = row.get('tap_Overall_cv_intertap_interval_mean', 0)
        acc = row.get('tap_Overall_tap_accuracy_mean', 0)
        drift = row.get('hold_Overall_hold_drift_distance_median', 0)
        drag_eff = row.get('drag_Overall_path_efficiency_mean', 0)
        
        n_speed = min(1.0, speed / 8.0) if pd.notna(speed) else 0
        n_regularity = max(0.0, 1.0 - cv) if pd.notna(cv) else 0
        n_accuracy = acc if pd.notna(acc) else 0
        n_stability = max(0.0, (100.0 - drift) / 100.0) if pd.notna(drift) else 0
        n_drag = max(0.0, (drag_eff - 0.8) / 0.2) if pd.notna(drag_eff) else 0
        
        values = [n_speed, n_regularity, n_accuracy, n_stability, n_drag]
        values += values[:1]
        
        color, fill_color = get_radar_colors(p_code, idx)
        
        ax.plot(angles, values, color=color, linewidth=2.5, linestyle='solid', label=f"Participant {p_code}")
        ax.fill(angles, values, color=fill_color, alpha=0.4)

    title_suffix = " vs ".join(participant_codes) if len(participant_codes) <= 4 else f"{len(participant_codes)} Participants"
    plt.title(f"Motor Profile Fingerprints: {title_suffix}\n(Metrics normalized to 0-100% scale, higher is better)", size=16, weight='bold', pad=20)
    plt.legend(loc='upper right', bbox_to_anchor=(1.2, 1.15), fontsize=12)
    plt.tight_layout()
    plt.show()


def plot_key_biomarkers_comparison(
    master_df=None,
    participant_codes=None,
    trials_df=None,
    participants_df=None,
    csv_dir=None,
    supabase_url=None,
    supabase_key=None
):
    """
    Plots visual side-by-side comparison for selected metrics across participants dynamically.
    If participant_codes is None, all participants in the dataset are plotted.
    """
    import clinical_metrics
    if master_df is None:
        tdf, sdf, pdf = resolve_data(
            trials_df=trials_df,
            participants_df=participants_df,
            csv_dir=csv_dir,
            supabase_url=supabase_url,
            supabase_key=supabase_key
        )
        master_df = clinical_metrics.analyze_all(tdf, pdf)

    if participant_codes is None:
        participant_codes = sorted(master_df['participant_code'].unique().tolist()) if 'participant_code' in master_df.columns else []

    if not participant_codes:
        print("No participants found to compare.")
        return

    # Select the key metrics for comparison
    key_cols = {
        'tap_Overall_tap_frequency_mean': 'Tapping Speed (Hz)',
        'tap_Overall_cv_intertap_interval_mean': 'Tapping Rhythm CV (Var)',
        'tap_Overall_tap_spatial_sd_mean': 'Tap Spatial SD (px)',
        'hold_Overall_hold_drift_distance_median': 'Hold Drift Distance (px)',
        'drag_Overall_path_efficiency_mean': 'Drag Path Efficiency (0-1)',
        'drag_Overall_kinetic_tremor_amplitude_mean': 'Drag Tremor Amp (px)',
        'drag_Overall_kinetic_tremor_frequency_hz_mean': 'Drag Tremor Freq (Hz)'
    }

    # Filter columns to only those present in master_df
    available_keys = {k: v for k, v in key_cols.items() if k in master_df.columns}
    if not available_keys:
        print("None of the key comparison columns found in master_df.")
        return

    comp_df = master_df[master_df['participant_code'].isin(participant_codes)][['participant_code'] + list(available_keys.keys())].copy()
    comp_df = comp_df.rename(columns=available_keys).set_index('participant_code').T

    print("=== Summary Table: Participant Key Metrics ===")
    from IPython.display import display
    display(comp_df)

    metrics_to_plot = [
        ('Tapping Speed (Hz)', 'Speed (Hz)', 'Higher is faster'),
        ('Tapping Rhythm CV (Var)', 'Coefficient of Var', 'Lower is more regular'),
        ('Hold Drift Distance (px)', 'Distance (px)', 'Lower is more stable'),
        ('Drag Tremor Amp (px)', 'Tremor Amplitude (px)', 'Lower is smoother')
    ]

    # Filter metrics to plot based on availability in the index
    metrics_to_plot = [m for m in metrics_to_plot if m[0] in comp_df.index]

    if not metrics_to_plot:
        print("None of the metrics to plot are available in the data.")
        return

    num_metrics = len(metrics_to_plot)
    cols = min(num_metrics, 2)
    rows = (num_metrics + cols - 1) // cols

    fig, axes = plt.subplots(rows, cols, figsize=(14, 5 * rows), squeeze=False)
    axes_flat = axes.ravel()

    for idx, (metric, ylabel, desc) in enumerate(metrics_to_plot):
        ax = axes_flat[idx]
        
        # Get values dynamically for all available participant codes
        vals = [comp_df.loc[metric, p] if p in comp_df.columns else 0 for p in participant_codes]
        colors = [get_participant_color(i, p) for i, p in enumerate(participant_codes)]
        
        bars = ax.bar(participant_codes, vals, color=colors, width=0.5)
        ax.set_title(f"{metric}\n({desc})", fontsize=14, fontweight='bold', pad=10)
        ax.set_ylabel(ylabel, fontsize=12)
        
        # Add text labels on top of bars
        for bar in bars:
            height = bar.get_height()
            ax.annotate(f'{height:.3f}' if height < 1 else f'{height:.1f}',
                        xy=(bar.get_x() + bar.get_width() / 2, height),
                        xytext=(0, 3),
                        textcoords="offset points",
                        ha='center', va='bottom', fontsize=11, fontweight='bold')
                        
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.yaxis.grid(True, linestyle='--', alpha=0.3)

    # Hide unused axes
    for idx in range(num_metrics, rows * cols):
        fig.delaxes(axes_flat[idx])

    title_suffix = " vs ".join(participant_codes) if len(participant_codes) <= 4 else f"{len(participant_codes)} Participants"
    plt.suptitle(f"Visual Comparison of Key Digital Biomarkers: {title_suffix}", fontsize=16, fontweight='bold', y=0.98)
    plt.tight_layout()
    plt.show()


def plot_tap_dot_size_analysis(
    trials_df=None,
    participants_df=None,
    participant_codes=None,
    csv_dir=None,
    supabase_url=None,
    supabase_key=None
):
    """
    Analyzes tap precision and generates an elbow/knee curve plot based on error distances
    from targets for the selected participants (defaults to all).
    """
    tdf, sdf, pdf = resolve_data(
        trials_df=trials_df,
        sessions_df=sdf if 'sdf' in locals() else None,
        participants_df=participants_df,
        csv_dir=csv_dir,
        supabase_url=supabase_url,
        supabase_key=supabase_key
    )

    if participant_codes is None:
        participant_codes = sorted(pdf['participant_code'].unique().tolist()) if 'participant_code' in pdf.columns else []

    # Get UUIDs for participant codes
    p_ids = pdf[pdf['participant_code'].isin(participant_codes)]['id'].values if 'participant_code' in pdf.columns else []

    # Filter tap trials for selected participants
    tap_trials = tdf[(tdf['task_type'] == 'tap') & (tdf['participant_id'].isin(p_ids))]

    distances = []
    for _, row in tap_trials.iterrows():
        tx = row.get('target_x')
        ty = row.get('target_y')
        taps = row.get('taps', [])
        if not taps or not isinstance(taps, list) or pd.isna(tx) or pd.isna(ty):
            continue
        for t in taps:
            if 'x' in t and 'y' in t:
                dist = np.sqrt((t['x'] - tx)**2 + (t['y'] - ty)**2)
                # If alternating task was used, it may have specific target coords in tap log
                tx_curr = t.get('target_x')
                ty_curr = t.get('target_y')
                if pd.notna(tx_curr) and pd.notna(ty_curr):
                    dist = np.sqrt((t['x'] - tx_curr)**2 + (t['y'] - ty_curr)**2)
                distances.append(dist)

    if not distances:
        print("No tap event coordinates found for the selected participants.")
        return

    distances = np.array(distances)
    sorted_distances = np.sort(distances)

    # Compute knee/elbow point
    n = len(sorted_distances)
    x = np.linspace(0, 1, n)
    y = sorted_distances / sorted_distances.max()

    p1 = np.array([x[0], y[0]])
    p2 = np.array([x[-1], y[-1]])
    line_vec = p2 - p1
    line_vec_norm = line_vec / np.linalg.norm(line_vec)
    vecs = np.column_stack((x - p1[0], y - p1[1]))
    
    # Perpendicular distance projection (handled in 3D to avoid cross-product deprecations)
    dists_to_line = np.abs(np.cross(np.hstack((vecs, np.zeros((n, 1)))), np.hstack((line_vec_norm, 0)))[:, 2])

    knee_idx = np.argmax(dists_to_line)
    knee_distance = sorted_distances[knee_idx]

    p90 = np.percentile(sorted_distances, 90)
    p95 = np.percentile(sorted_distances, 95)

    print(f"--- Tapping Dot Size Optimization Analysis ({' vs '.join(participant_codes)}) ---")
    print(f"Total taps analyzed: {len(distances)}")
    print(f"Mean tap error distance: {np.mean(distances):.2f} px")
    print(f"Median tap error distance: {np.median(distances):.2f} px")
    print(f"Knee/Elbow point distance: {knee_distance:.2f} px")
    print(f"90th percentile distance: {p90:.2f} px")
    print(f"95th percentile distance: {p95:.2f} px")

    # Generate the plot
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.plot(sorted_distances, label="Sorted Tap Error Distances", color='#2563EB', linewidth=2.5)
    ax.axvline(x=knee_idx, color='#DC2626', linestyle='--', label=f"Knee/Elbow Point: {knee_distance:.2f} px", linewidth=2)
    ax.axhline(y=knee_distance, color='#DC2626', linestyle=':', alpha=0.7)

    ax.axhline(y=p90, color='#0D9488', linestyle='--', label=f"90% of Taps inside {p90:.2f} px", alpha=0.8)
    ax.axhline(y=p95, color='#7C3AED', linestyle='--', label=f"95% of Taps inside {p95:.2f} px", alpha=0.8)

    title_suffix = " vs ".join(participant_codes) if len(participant_codes) <= 4 else f"{len(participant_codes)} Participants"
    ax.set_title(f"Elbow/Knee Curve: Tapping Target Precision ({title_suffix})", fontsize=14, weight='bold', pad=15)
    ax.set_xlabel("Sorted Taps Index", fontsize=12)
    ax.set_ylabel("Error Distance from Target Center (pixels)", fontsize=12)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.yaxis.grid(True, linestyle='--', alpha=0.3)
    ax.xaxis.grid(True, linestyle='--', alpha=0.3)
    ax.legend(loc='upper left', fontsize=11)
    plt.tight_layout()
    plt.show()
