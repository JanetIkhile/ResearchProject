import os
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt


def normalize_participant_codes(func):
    import functools
    import inspect
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        sig = inspect.signature(func)
        bound = sig.bind(*args, **kwargs)
        bound.apply_defaults()
        codes = bound.arguments.get('participant_codes')
        if codes is not None:
            bound.arguments['participant_codes'] = [
                'P' + c[2:] if isinstance(c, str) and c.startswith('P0') and len(c) > 2 else c
                for c in codes
            ]
        return func(*bound.args, **bound.kwargs)
    return wrapper

def resolve_data(trials_df=None, sessions_df=None, participants_df=None,
                 csv_dir=None, trials_path=None, sessions_path=None, participants_path=None,
                 supabase_url=None, supabase_key=None):
    tdf, sdf, pdf = _resolve_data_raw(
        trials_df, sessions_df, participants_df,
        csv_dir, trials_path, sessions_path, participants_path,
        supabase_url, supabase_key
    )
    if pdf is not None and 'participant_code' in pdf.columns:
        pdf = pdf.copy()
        pdf['participant_code'] = pdf['participant_code'].map(
            lambda x: 'P' + x[2:] if isinstance(x, str) and x.startswith('P0') and len(x) > 2 else x
        )
    return tdf, sdf, pdf


def _resolve_data_raw(trials_df=None, sessions_df=None, participants_df=None,
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
        'P01': '#2563EB', 'P1': '#2563EB', # Blue
        'P02': '#EA580C', 'P2': '#EA580C', # Orange
        'P03': '#0D9488', 'P3': '#0D9488', # Teal
        'P04': '#7C3AED', 'P4': '#7C3AED', # Purple
        'P05': '#EC4899', 'P5': '#EC4899', # Pink
        'P06': '#10B981', 'P6': '#10B981', # Green
    }
    if code in colors:
        return colors[code]
    palette = ['#2563EB', '#EA580C', '#0D9488', '#7C3AED', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6']
    return palette[index % len(palette)]


def get_radar_colors(p_code, idx):
    """Returns line and fill colors for the radar fingerprints chart."""
    colors = {
        'P01': '#0D9488', 'P1': '#0D9488',
        'P02': '#EA580C', 'P2': '#EA580C',
        'P03': '#2563EB', 'P3': '#2563EB',
        'P04': '#7C3AED', 'P4': '#7C3AED'
    }
    fill_colors = {
        'P01': '#CCFBF1', 'P1': '#CCFBF1',
        'P02': '#FFEDD5', 'P2': '#FFEDD5',
        'P03': '#DBEAFE', 'P3': '#DBEAFE',
        'P04': '#F3E8FF', 'P4': '#F3E8FF'
    }
    if p_code in colors:
        return colors[p_code], fill_colors[p_code]
    
    palette_colors = ['#0D9488', '#EA580C', '#2563EB', '#7C3AED', '#EC4899', '#10B981', '#F59E0B']
    palette_fills = ['#CCFBF1', '#FFEDD5', '#DBEAFE', '#F3E8FF', '#FCE7F3', '#D1FAE5', '#FEF3C7']
    return palette_colors[idx % len(palette_colors)], palette_fills[idx % len(palette_fills)]


@normalize_participant_codes
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

    # Collect coordinates and targets to compute global limits across all participants
    local_limits = []
    for p_code in participant_codes:
        p_rows = pdf[pdf['participant_code'] == p_code]
        if p_rows.empty:
            continue
        p_id = p_rows['id'].values[0]
        
        t_data = main_trials[
            (main_trials['participant_id'] == p_id) & 
            (main_trials['task_type'] == 'tap') & 
            (main_trials['trial_number'] == trial_number)
        ]
        if t_data.empty:
            continue
            
        trial_row = t_data.iloc[0]
        tx = trial_row['target_x']
        ty = trial_row['target_y']
        tr = trial_row['target_radius']
        taps = trial_row['taps']
        if not taps or not isinstance(taps, list):
            continue
            
        xs = [t['x'] for t in taps if 'x' in t]
        ys = [t['y'] for t in taps if 'y' in t]
        
        margin = tr * 1.5
        ty_top = ty + 220.0
        x_min = min(tx - margin, min(xs) - 30 if xs else tx - margin)
        x_max = max(tx + margin, max(xs) + 30 if xs else tx + margin)
        y_min = min(ty - margin, min(ys) - 30 if ys else ty - margin)
        y_max = max(ty_top + margin, max(ys) + 30 if ys else ty_top + margin)
        local_limits.append((x_min, x_max, y_min, y_max))

    if local_limits:
        global_x_min = min(lim[0] for lim in local_limits)
        global_x_max = max(lim[1] for lim in local_limits)
        global_y_min = min(lim[2] for lim in local_limits)
        global_y_max = max(lim[3] for lim in local_limits)
    else:
        global_x_min, global_x_max, global_y_min, global_y_max = 200, 600, 300, 920

    legend_handles = []
    legend_labels = []

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

        # Bottom target
        target_circle = plt.Circle((tx, ty), tr, fill=True, facecolor='#E0F2FE', alpha=0.5, edgecolor='#0284C7', linewidth=2, label='Target Area')
        ax.add_patch(target_circle)
        center_line, = ax.plot(tx, ty, marker='+', color='#0284C7', markersize=15, markeredgewidth=2, label='Target Center')
        
        # Top target
        top_target_circle = plt.Circle((tx, ty + 220.0), tr, fill=True, facecolor='#E0F2FE', alpha=0.5, edgecolor='#0284C7', linewidth=2)
        ax.add_patch(top_target_circle)
        ax.plot(tx, ty + 220.0, marker='+', color='#0284C7', markersize=15, markeredgewidth=2)
        
        xs_hit = []
        ys_hit = []
        xs_miss_outside = []
        ys_miss_outside = []
        xs_miss_inactive = []
        ys_miss_inactive = []
        
        for t in taps:
            x = t.get('x')
            y = t.get('y')
            if x is None or y is None:
                continue
            is_hit = t.get('is_inside_target', True)
            if is_hit:
                xs_hit.append(x)
                ys_hit.append(y)
            else:
                expected = t.get('expected_target')
                if expected is not None:
                    if expected == 'top':
                        dist_inactive = np.hypot(x - tx, y - (ty + 220.0))
                    else:
                        dist_inactive = np.hypot(x - tx, y - ty)
                    
                    if dist_inactive <= tr:
                        xs_miss_inactive.append(x)
                        ys_miss_inactive.append(y)
                    else:
                        xs_miss_outside.append(x)
                        ys_miss_outside.append(y)
                else:
                    xs_miss_outside.append(x)
                    ys_miss_outside.append(y)
                    
        sc_hit = ax.scatter(xs_hit, ys_hit, color='#0D9488', alpha=0.8, edgecolors='black', s=60, zorder=3, label='Hit (Inside)')
        
        if xs_miss_outside:
            ax.scatter(xs_miss_outside, ys_miss_outside, color='#DC2626', alpha=0.9, edgecolors='black', s=80, zorder=4, label='Miss (Outside)')
        else:
            ax.scatter([], [], color='#DC2626', alpha=0.9, edgecolors='black', s=80, label='Miss (Outside)')
            
        if xs_miss_inactive:
            ax.scatter(xs_miss_inactive, ys_miss_inactive, color='#F97316', alpha=0.9, edgecolors='black', s=80, zorder=4, label='Incorrect Tap')
        else:
            ax.scatter([], [], color='#F97316', alpha=0.9, edgecolors='black', s=80, label='Incorrect Tap')
            
        hand = p_rows['dominant_arm'].values[0] if 'dominant_arm' in p_rows.columns else 'Unknown'
        hand_str = str(hand).capitalize()
        ax.set_title(f"{p_code}, Dominant arm - {hand_str}\nTrial {int(trial_row['trial_number'])} ({len(taps)} total taps)", fontsize=12, weight='bold', pad=10)
        ax.set_xlabel("X Coordinate (pixels)", fontsize=11)
        ax.set_ylabel("Y Coordinate (pixels)", fontsize=11)
        ax.set_aspect('equal', 'box')
        
        # Center square bounding box around both targets
        y_half_span = 110.0 + 1.5 * tr
        ax.set_xlim(tx - y_half_span, tx + y_half_span)
        ax.set_ylim(ty + 110.0 - y_half_span, ty + 110.0 + y_half_span)
        
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.grid(True, linestyle='--', alpha=0.3)
        ax.legend(loc='lower left', fontsize=10, frameon=True, facecolor='white', edgecolor='lightgray')

    # Hide unused axes
    for idx in range(num_participants, rows * cols):
        r = idx // cols
        c = idx % cols
        fig.delaxes(axes[r, c])

    title_suffix = " vs ".join(participant_codes) if len(participant_codes) <= 4 else f"{len(participant_codes)} Participants"
    plt.suptitle(f"Raw Tap Spatial Distribution Comparison: {title_suffix}", fontsize=15, weight='bold', y=0.96)
    plt.tight_layout(rect=[0, 0, 1, 0.94])
    plt.show()


@normalize_participant_codes
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
        
        start_c = plt.Circle((sx, sy), sr, fill=True, facecolor='#DCFCE7', alpha=0.5, edgecolor='#15803D', linewidth=2)
        ax.add_patch(start_c)
        
        target_c = plt.Circle((tx, ty), tr, fill=True, facecolor='#FEE2E2', alpha=0.5, edgecolor='#DC2626', linewidth=2)
        ax.add_patch(target_c)
        
        ax.plot([sx, tx], [sy, ty], color='black', linestyle='--', linewidth=2.0)
        
        path_color = get_participant_color(idx, p_code)
        ax.plot(pxs, pys, color=path_color, linewidth=2.5, zorder=3)
        ax.scatter(pxs[0], pys[0], color='#7C3AED', s=60, zorder=4)
        ax.scatter(pxs[-1], pys[-1], color='#DC2626', s=60, zorder=4)
        
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
        ax.invert_yaxis()
        
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.grid(True, linestyle='--', alpha=0.3)
        
        import matplotlib.lines as mlines
        start_area_handle = mlines.Line2D([], [], color='none', marker='o', markerfacecolor='#DCFCE7', markeredgecolor='#15803D', markeredgewidth=2, markersize=10, alpha=0.5, label='Start Area')
        target_area_handle = mlines.Line2D([], [], color='none', marker='o', markerfacecolor='#FEE2E2', markeredgecolor='#DC2626', markeredgewidth=2, markersize=10, alpha=0.5, label='Target Area')
        ideal_axis_handle = mlines.Line2D([], [], color='black', linestyle='--', linewidth=2.0, label='Ideal Axis')
        drag_path_handle = mlines.Line2D([], [], color=path_color, linewidth=2.5, label='Actual Drag Path')
        touch_init_handle = mlines.Line2D([], [], color='none', marker='o', markerfacecolor='#7C3AED', markeredgecolor='#7C3AED', markersize=8, label='Touch Initiated')
        touch_rel_handle = mlines.Line2D([], [], color='none', marker='o', markerfacecolor='#DC2626', markeredgecolor='#DC2626', markersize=8, label='Touch Released')
        
        ax.legend(handles=[start_area_handle, target_area_handle, ideal_axis_handle, drag_path_handle, touch_init_handle, touch_rel_handle], loc='lower left', fontsize=9)

    # Hide unused axes
    for idx in range(num_participants, rows * cols):
        r = idx // cols
        c = idx % cols
        fig.delaxes(axes[r, c])

    title_suffix = " vs ".join(participant_codes) if len(participant_codes) <= 4 else f"{len(participant_codes)} Participants"
    plt.suptitle(f"Raw Drag Trajectory Comparison: {title_suffix} (Equivalent Trial {trial_number})", fontsize=16, weight='bold', y=0.98)
    plt.tight_layout()
    plt.show()


@normalize_participant_codes
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
    fig, axes = plt.subplots(rows, cols, figsize=(8.5 * cols, 7 * rows), squeeze=False)

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

        target_c = plt.Circle((tx, ty), tr, fill=True, facecolor='#E0F2FE', alpha=0.15, edgecolor='#0284C7', linewidth=2.5, label='Target Boundary')
        ax.add_patch(target_c)
        ax.plot(tx, ty, marker='+', color='#0284C7', markersize=15, markeredgewidth=2, label='Target Center')
        
        path_color = get_participant_color(idx, p_code)
        ax.plot(hxs, hys, color=path_color, linewidth=1.5, alpha=0.8, label='Hold Drift Trace')
        
        ax.scatter(hxs[0], hys[0], color='#7C3AED', s=40, zorder=4, label='Hold Start')
        ax.scatter(hxs[-1], hys[-1], color='#DC2626', s=40, zorder=4, label='Hold End')
        
        hand = p_rows['dominant_arm'].values[0] if 'dominant_arm' in p_rows.columns else 'Unknown'
        hand_str = str(hand).capitalize()
        ax.set_title(f"{p_code}, Dominant arm - {hand_str}\nTrial {trial_number} ({len(hxs)} points logged)", fontsize=12, weight='bold', pad=10)
        ax.set_xlabel("X Coordinate (pixels)", fontsize=11)
        ax.set_ylabel("Y Coordinate (pixels)", fontsize=11)
        ax.set_aspect('equal', 'box')
        
        margin = tr * 1.1
        ax.set_xlim(tx - margin, tx + margin)
        ax.set_ylim(ty - margin, ty + margin)
        
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.grid(True, linestyle='--', alpha=0.3)
        
        import matplotlib.lines as mlines
        target_boundary_handle = mlines.Line2D(
            [], [], 
            color='#0284C7', 
            marker='o', 
            markerfacecolor='#E0F2FE', 
            markersize=10, 
            markeredgecolor='#0284C7', 
            markeredgewidth=1.5, 
            linestyle='None', 
            label='Target Boundary'
        )
        
        handles, labels = ax.get_legend_handles_labels()
        for i, label in enumerate(labels):
            if label == 'Target Boundary':
                handles[i] = target_boundary_handle
        ax.legend(handles=handles, labels=labels, loc='lower right', fontsize=9)

    # Hide unused axes
    for idx in range(num_participants, rows * cols):
        r = idx // cols
        c = idx % cols
        fig.delaxes(axes[r, c])

    title_suffix = " vs ".join(participant_codes) if len(participant_codes) <= 4 else f"{len(participant_codes)} Participants"
    plt.suptitle(f"Raw Hold Postural Drift Comparison: {title_suffix} (Equivalent Trial {trial_number})", fontsize=15, weight='bold', y=0.95)
    plt.tight_layout(rect=[0, 0, 1, 0.95])
    plt.show()


@normalize_participant_codes
def plot_pinch_trajectory(
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
    Plots raw 2D coordinate paths of the index finger and thumb side-by-side for a representative Pinch trial.
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
            (main_trials['task_type'] == 'pinch') & 
            (main_trials['trial_number'] == trial_number)
        ]
        
        if t_data.empty:
            ax.text(0.5, 0.5, f"No pinch trial {trial_number} for {p_code}", ha='center', va='center')
            continue
            
        trial_row = t_data.iloc[0]
        traj = trial_row.get('trajectory', [])
        if isinstance(traj, str):
            traj = json.loads(traj)
            
        if not traj or not isinstance(traj, list):
            ax.text(0.5, 0.5, f"No trajectory recorded for {p_code}", ha='center', va='center')
            continue

        px_idx = [pt['x_index'] for pt in traj if pt.get('touches_count') == 2 and pt.get('x_index') is not None]
        py_idx = [pt['y_index'] for pt in traj if pt.get('touches_count') == 2 and pt.get('y_index') is not None]
        px_thb = [pt['x_thumb'] for pt in traj if pt.get('touches_count') == 2 and pt.get('x_thumb') is not None]
        py_thb = [pt['y_thumb'] for pt in traj if pt.get('touches_count') == 2 and pt.get('y_thumb') is not None]

        if not px_idx or not px_thb:
            ax.text(0.5, 0.5, f"No two-finger coordinates logged for {p_code}", ha='center', va='center')
            continue

        # Plot continuous paths
        ax.plot(px_idx, py_idx, color='#0D9488', linewidth=2.5, zorder=3, label='Index Finger Path')
        ax.plot(px_thb, py_thb, color='#7C3AED', linewidth=2.5, zorder=3, label='Thumb Path')

        # Start and End points
        ax.scatter(px_idx[0], py_idx[0], color='#10B981', edgecolors='black', s=80, zorder=4, label='Start Point')
        ax.scatter(px_thb[0], py_thb[0], color='#10B981', edgecolors='black', s=80, zorder=4)
        ax.scatter(px_idx[-1], py_idx[-1], color='#DC2626', edgecolors='black', s=80, zorder=4, label='End Point')
        ax.scatter(px_thb[-1], py_thb[-1], color='#DC2626', edgecolors='black', s=80, zorder=4)

        hand = p_rows['dominant_arm'].values[0] if 'dominant_arm' in p_rows.columns else 'Unknown'
        hand_str = str(hand).capitalize()
        ax.set_title(f"{p_code}, Dominant arm - {hand_str}\nPinch Trial {trial_number} ({len(traj)} frames logged)", fontsize=12, weight='bold', pad=10)
        ax.set_xlabel("X Coordinate (pixels)", fontsize=11)
        ax.set_ylabel("Y Coordinate (pixels)", fontsize=11)
        ax.set_aspect('equal', 'box')

        # Compute tight square box bounding both finger trajectories
        all_x = px_idx + px_thb
        all_y = py_idx + py_thb
        min_x, max_x = min(all_x), max(all_x)
        min_y, max_y = min(all_y), max(all_y)
        cx = (min_x + max_x) / 2
        cy = (min_y + max_y) / 2
        span = max(max_x - min_x, max_y - min_y) * 1.3
        
        ax.set_xlim(cx - span/2, cx + span/2)
        ax.set_ylim(cy - span/2, cy + span/2)
        ax.invert_yaxis()

        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.grid(True, linestyle='--', alpha=0.3)

        import matplotlib.lines as mlines
        idx_handle = mlines.Line2D([], [], color='#0D9488', linewidth=2.5, label='Index Finger Path')
        thb_handle = mlines.Line2D([], [], color='#7C3AED', linewidth=2.5, label='Thumb Path')
        start_handle = mlines.Line2D([], [], color='none', marker='o', markerfacecolor='#10B981', markeredgecolor='black', markersize=8, label='Start Point')
        end_handle = mlines.Line2D([], [], color='none', marker='o', markerfacecolor='#DC2626', markeredgecolor='black', markersize=8, label='End Point')
        ax.legend(handles=[idx_handle, thb_handle, start_handle, end_handle], loc='lower left', fontsize=10, frameon=True, facecolor='white', edgecolor='lightgray')

    # Hide unused axes
    for idx in range(num_participants, rows * cols):
        r = idx // cols
        c = idx % cols
        fig.delaxes(axes[r, c])

    title_suffix = " vs ".join(participant_codes) if len(participant_codes) <= 4 else f"{len(participant_codes)} Participants"
    plt.suptitle(f"Raw Pinch Trajectory Comparison: {title_suffix} (Trial {trial_number})", fontsize=15, weight='bold', y=0.96)
    plt.tight_layout(rect=[0, 0, 1, 0.94])
    plt.show()


@normalize_participant_codes
def plot_aggregate_pinch_trajectory(
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
    Plots overlaid 2D coordinate paths of the index finger and thumb across all pinch trials side-by-side.
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
            (main_trials['task_type'] == 'pinch')
        ].sort_values(by='trial_number')
        
        if trials.empty:
            ax.text(0.5, 0.5, f"No pinch trials for {p_code}", ha='center', va='center')
            continue

        linestyles = ['-', '--', ':', '-.']
        all_x = []
        all_y = []

        for t_idx, (_, trial_row) in enumerate(trials.iterrows()):
            traj = trial_row.get('trajectory', [])
            if isinstance(traj, str):
                traj = json.loads(traj)
                
            if not traj or not isinstance(traj, list):
                continue

            px_idx = [pt['x_index'] for pt in traj if pt.get('touches_count') == 2 and pt.get('x_index') is not None]
            py_idx = [pt['y_index'] for pt in traj if pt.get('touches_count') == 2 and pt.get('y_index') is not None]
            px_thb = [pt['x_thumb'] for pt in traj if pt.get('touches_count') == 2 and pt.get('x_thumb') is not None]
            py_thb = [pt['y_thumb'] for pt in traj if pt.get('touches_count') == 2 and pt.get('y_thumb') is not None]

            if not px_idx or not px_thb:
                continue

            all_x.extend(px_idx + px_thb)
            all_y.extend(py_idx + py_thb)

            t_num = trial_row['trial_number']
            style = linestyles[t_idx % len(linestyles)]

            # Plot paths
            ax.plot(px_idx, py_idx, color='#0D9488', linestyle=style, linewidth=2.0, alpha=0.75, zorder=3)
            ax.plot(px_thb, py_thb, color='#7C3AED', linestyle=style, linewidth=2.0, alpha=0.75, zorder=3)

            # Start and End points
            ax.scatter(px_idx[0], py_idx[0], color='#10B981', edgecolors='black', s=50, alpha=0.8, zorder=4)
            ax.scatter(px_thb[0], py_thb[0], color='#10B981', edgecolors='black', s=50, alpha=0.8, zorder=4)
            ax.scatter(px_idx[-1], py_idx[-1], color='#DC2626', edgecolors='black', s=50, alpha=0.8, zorder=4)
            ax.scatter(px_thb[-1], py_thb[-1], color='#DC2626', edgecolors='black', s=50, alpha=0.8, zorder=4)

        if not all_x or not all_y:
            ax.text(0.5, 0.5, f"No pinch trajectories logged for {p_code}", ha='center', va='center')
            continue

        hand = p_rows['dominant_arm'].values[0] if 'dominant_arm' in p_rows.columns else 'Unknown'
        hand_str = str(hand).capitalize()
        ax.set_title(f"All Pinch Trajectories Overlaid - {p_code} ({hand_str})\n(Total trials: {len(trials)})", fontsize=12, weight='bold', pad=10)
        ax.set_xlabel("X Coordinate (pixels)", fontsize=11)
        ax.set_ylabel("Y Coordinate (pixels)", fontsize=11)
        ax.set_aspect('equal', 'box')

        # Compute tight square box bounding all trajectories
        min_x, max_x = min(all_x), max(all_x)
        min_y, max_y = min(all_y), max(all_y)
        cx = (min_x + max_x) / 2
        cy = (min_y + max_y) / 2
        span = max(max_x - min_x, max_y - min_y) * 1.3
        
        ax.set_xlim(cx - span/2, cx + span/2)
        ax.set_ylim(cy - span/2, cy + span/2)
        ax.invert_yaxis()

        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.grid(True, linestyle='--', alpha=0.3)

        import matplotlib.lines as mlines
        idx_handle = mlines.Line2D([], [], color='#0D9488', linewidth=2.0, label='Index Finger Path')
        thb_handle = mlines.Line2D([], [], color='#7C3AED', linewidth=2.0, label='Thumb Path')
        
        t_handles = []
        for t_idx, trial_row in enumerate(trials.iterrows()):
            t_num = trial_row[1]['trial_number']
            style = linestyles[t_idx % len(linestyles)]
            label_suffix = " (Solid)" if style == '-' else " (Dashed)" if style == '--' else " (Dotted)" if style == ':' else " (Dash-dot)"
            t_handles.append(mlines.Line2D([], [], color='gray', linestyle=style, linewidth=1.5, label=f'Trial {int(t_num)}{label_suffix}'))
            
        start_handle = mlines.Line2D([], [], color='none', marker='o', markerfacecolor='#10B981', markeredgecolor='black', markersize=8, label='Start Point')
        end_handle = mlines.Line2D([], [], color='none', marker='o', markerfacecolor='#DC2626', markeredgecolor='black', markersize=8, label='End Point')
        
        ax.legend(handles=[idx_handle, thb_handle] + t_handles + [start_handle, end_handle], loc='lower left', fontsize=8, ncol=2, frameon=True, facecolor='white', edgecolor='lightgray')

    # Hide unused axes
    for idx in range(num_participants, rows * cols):
        r = idx // cols
        c = idx % cols
        fig.delaxes(axes[r, c])

    title_suffix = " vs ".join(participant_codes) if len(participant_codes) <= 4 else f"{len(participant_codes)} Participants"
    plt.suptitle(f"Aggregate Pinch Trajectory: {title_suffix} (All Trials Overlaid)", fontsize=15, weight='bold', y=0.96)
    plt.tight_layout(rect=[0, 0, 1, 0.94])
    plt.show()


@normalize_participant_codes
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
        
        start_c = plt.Circle((sx, sy), sr, fill=True, facecolor='#DCFCE7', alpha=0.6, edgecolor='#15803D', linewidth=2, zorder=1)
        ax.add_patch(start_c)
        
        target_c = plt.Circle((tx, ty), tr, fill=True, facecolor='#FEE2E2', alpha=0.6, edgecolor='#DC2626', linewidth=2, zorder=1)
        ax.add_patch(target_c)
        
        ax.plot([sx, tx], [sy, ty], color='black', linestyle='--', linewidth=2, zorder=2)
        
        path_color = get_participant_color(idx, p_code)
        
        for t_idx, (_, trial_row) in enumerate(trials.iterrows()):
            traj = trial_row.get('trajectory', [])
            if not traj or not isinstance(traj, list):
                continue
            pxs = [pt['x'] for pt in traj if 'x' in pt]
            pys = [pt['y'] for pt in traj if 'y' in pt]
            
            ax.plot(pxs, pys, color=path_color, linewidth=1.5, alpha=0.75)
            ax.scatter(pxs[0], pys[0], color='#7C3AED', s=30, alpha=0.6, zorder=4)
            ax.scatter(pxs[-1], pys[-1], color='#DC2626', s=30, alpha=0.6, zorder=4)
            
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
        ax.invert_yaxis()
        
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.grid(True, linestyle='--', alpha=0.3)
        import matplotlib.lines as mlines
        start_area_handle = mlines.Line2D([], [], color='none', marker='o', markerfacecolor='#DCFCE7', markeredgecolor='#15803D', markeredgewidth=2, markersize=10, alpha=0.6, label='Start Area')
        target_area_handle = mlines.Line2D([], [], color='none', marker='o', markerfacecolor='#FEE2E2', markeredgecolor='#DC2626', markeredgewidth=2, markersize=10, alpha=0.6, label='Target Area')
        ideal_axis_handle = mlines.Line2D([], [], color='black', linestyle='--', linewidth=2.0, label='Ideal Axis')
        drag_path_handle = mlines.Line2D([], [], color=path_color, linewidth=1.5, alpha=0.75, label='Drag Trials')
        touch_init_handle = mlines.Line2D([], [], color='none', marker='o', markerfacecolor='#7C3AED', markeredgecolor='#7C3AED', markersize=8, label='Touch Initiated')
        touch_rel_handle = mlines.Line2D([], [], color='none', marker='o', markerfacecolor='#DC2626', markeredgecolor='#DC2626', markersize=8, label='Touch Released')
        ax.legend(handles=[start_area_handle, target_area_handle, ideal_axis_handle, drag_path_handle, touch_init_handle, touch_rel_handle], loc='lower left', fontsize=10)

    # Hide unused axes
    for idx in range(num_participants, rows * cols):
        r = idx // cols
        c = idx % cols
        fig.delaxes(axes[r, c])

    title_suffix = " vs ".join(participant_codes) if len(participant_codes) <= 4 else f"{len(participant_codes)} Participants"
    plt.suptitle(f"Aggregate Drag Trajectory Comparison: {title_suffix} (All Trials Overlaid)", fontsize=18, weight='bold', y=0.98)
    plt.tight_layout()
    plt.show()


@normalize_participant_codes
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

    # Collect coordinates and targets to compute global limits across all participants
    # (Leaving unused global limits for backward compatibility, but we will override local limits locally for a clean square aspect ratio)

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
        
        # Bottom target
        target_circle = plt.Circle((tx, ty), tr, fill=True, facecolor='#E0F2FE', alpha=0.5, edgecolor='#0284C7', linewidth=2, label='Target Area')
        ax.add_patch(target_circle)
        ax.plot(tx, ty, marker='+', color='#0284C7', markersize=15, markeredgewidth=2, label='Target Center')
        
        # Top target
        top_target_circle = plt.Circle((tx, ty + 220.0), tr, fill=True, facecolor='#E0F2FE', alpha=0.5, edgecolor='#0284C7', linewidth=2)
        ax.add_patch(top_target_circle)
        ax.plot(tx, ty + 220.0, marker='+', color='#0284C7', markersize=15, markeredgewidth=2)
        
        # Dummy point for Incorrect Tap so it's always in the legend
        ax.scatter([], [], color='#F97316', alpha=0.9, edgecolors='black', s=70, label='Incorrect Tap')
        
        colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4']
        
        # Check if there are any misses across all trials for this participant
        has_any_miss = False
        for _, trial_row in trials.iterrows():
            taps = trial_row.get('taps', [])
            if taps and isinstance(taps, list):
                hits = [t.get('is_inside_target', True) for t in taps]
                if not all(hits):
                    has_any_miss = True
                    break
        
        if not has_any_miss:
            # Draw dummy invisible point for the legend
            ax.scatter([], [], color='#DC2626', alpha=0.9, edgecolors='black', s=70, label='Trial Misses')
            
        for t_idx, (_, trial_row) in enumerate(trials.iterrows()):
            taps = trial_row.get('taps', [])
            if not taps or not isinstance(taps, list):
                continue
                
            xs_hit = []
            ys_hit = []
            xs_miss_outside = []
            ys_miss_outside = []
            xs_miss_inactive = []
            ys_miss_inactive = []
            
            for t in taps:
                x = t.get('x')
                y = t.get('y')
                if x is None or y is None:
                    continue
                is_hit = t.get('is_inside_target', True)
                if is_hit:
                    xs_hit.append(x)
                    ys_hit.append(y)
                else:
                    expected = t.get('expected_target')
                    if expected is not None:
                        if expected == 'top':
                            dist_inactive = np.hypot(x - tx, y - (ty + 220.0))
                        else:
                            dist_inactive = np.hypot(x - tx, y - ty)
                        
                        if dist_inactive <= tr:
                            xs_miss_inactive.append(x)
                            ys_miss_inactive.append(y)
                        else:
                            xs_miss_outside.append(x)
                            ys_miss_outside.append(y)
                    else:
                        xs_miss_outside.append(x)
                        ys_miss_outside.append(y)
            
            t_num = trial_row['trial_number']
            color = colors[t_idx % len(colors)]
            ax.scatter(xs_hit, ys_hit, color=color, alpha=0.7, edgecolors='black', s=50, zorder=3, label=f'Trial {int(t_num)} Taps')
            
            if xs_miss_outside:
                ax.scatter(xs_miss_outside, ys_miss_outside, color='#DC2626', alpha=0.9, edgecolors='black', s=70, zorder=4, label=f'Trial {int(t_num)} Misses')
            if xs_miss_inactive:
                ax.scatter(xs_miss_inactive, ys_miss_inactive, color='#F97316', alpha=0.9, edgecolors='black', s=70, zorder=4)
                
        hand = p_rows['dominant_arm'].values[0] if 'dominant_arm' in p_rows.columns else 'Unknown'
        hand_str = str(hand).capitalize()
        ax.set_title(f"{p_code}, Dominant arm - {hand_str}\n(Total trials: {len(trials)})", fontsize=12, weight='bold', pad=10)
        ax.set_xlabel("X Coordinate (pixels)", fontsize=11)
        ax.set_ylabel("Y Coordinate (pixels)", fontsize=11)
        ax.set_aspect('equal', 'box')
        
        # Center square bounding box around both targets
        y_half_span = 110.0 + 1.5 * tr
        ax.set_xlim(tx - y_half_span, tx + y_half_span)
        ax.set_ylim(ty + 110.0 - y_half_span, ty + 110.0 + y_half_span)
        
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.grid(True, linestyle='--', alpha=0.3)
        ax.legend(loc='lower left', fontsize=8, ncol=2, frameon=True, facecolor='white', edgecolor='lightgray')

    # Hide unused axes
    for idx in range(num_participants, rows * cols):
        r = idx // cols
        c = idx % cols
        fig.delaxes(axes[r, c])

    title_suffix = " vs ".join(participant_codes) if len(participant_codes) <= 4 else f"{len(participant_codes)} Participants"
    plt.suptitle(f"Aggregate Tap Distribution: {title_suffix} (All Trials Overlaid)", fontsize=15, weight='bold', y=0.96)
    plt.tight_layout(rect=[0, 0, 1, 0.94])
    plt.show()


@normalize_participant_codes
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
    fig, axes = plt.subplots(rows, cols, figsize=(8.5 * cols, 7 * rows), squeeze=False)

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
        
        target_c = plt.Circle((tx, ty), tr, fill=True, facecolor='#E0F2FE', alpha=0.15, edgecolor='#0284C7', linewidth=2.5, label='Target Boundary')
        ax.add_patch(target_c)
        ax.plot(tx, ty, marker='+', color='#0284C7', markersize=15, markeredgewidth=2, label='Target Center')
        
        # Color gradients per participant (Blue gradients for P1, Orange gradients for P2)
        if p_code in ['P01', 'P1']:
            colors = ['#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD']
        elif p_code in ['P02', 'P2']:
            colors = ['#C2410C', '#EA580C', '#F97316', '#FB923C', '#FDBA74']
        else:
            colors = ['#1D4ED8', '#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE']
            
        all_xs = []
        all_ys = []
        
        has_labelled_start_end = False
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
            if not has_labelled_start_end:
                ax.scatter(hxs[0], hys[0], color='#7C3AED', s=30, zorder=4, label='Hold Start')
                ax.scatter(hxs[-1], hys[-1], color='#DC2626', s=30, zorder=4, label='Hold End')
                has_labelled_start_end = True
            else:
                ax.scatter(hxs[0], hys[0], color='#7C3AED', s=30, zorder=4)
                ax.scatter(hxs[-1], hys[-1], color='#DC2626', s=30, zorder=4)
            
        if not all_xs:
            ax.text(0.5, 0.5, f"No valid hold coordinate points for {p_code}", ha='center', va='center')
            continue
            
        hand = p_rows['dominant_arm'].values[0] if 'dominant_arm' in p_rows.columns else 'Unknown'
        hand_str = str(hand).capitalize()
        ax.set_title(f"{p_code}, Dominant arm - {hand_str}\n(Total trials: {len(trials)})", fontsize=12, weight='bold', pad=10)
        ax.set_xlabel("X Coordinate (pixels)", fontsize=11)
        ax.set_ylabel("Y Coordinate (pixels)", fontsize=11)
        ax.set_aspect('equal', 'box')
        
        margin = tr * 1.1
        ax.set_xlim(tx - margin, tx + margin)
        ax.set_ylim(ty - margin, ty + margin)
        
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.grid(True, linestyle='--', alpha=0.3)
        
        import matplotlib.lines as mlines
        target_boundary_handle = mlines.Line2D(
            [], [], 
            color='#0284C7', 
            marker='o', 
            markerfacecolor='#E0F2FE', 
            markersize=10, 
            markeredgecolor='#0284C7', 
            markeredgewidth=1.5, 
            linestyle='None', 
            label='Target Boundary'
        )
        
        handles, labels = ax.get_legend_handles_labels()
        for i, label in enumerate(labels):
            if label == 'Target Boundary':
                handles[i] = target_boundary_handle
        ax.legend(handles=handles, labels=labels, loc='lower right', fontsize=8, ncol=2)

    # Hide unused axes
    for idx in range(num_participants, rows * cols):
        r = idx // cols
        c = idx % cols
        fig.delaxes(axes[r, c])

    title_suffix = " vs ".join(participant_codes) if len(participant_codes) <= 4 else f"{len(participant_codes)} Participants"
    plt.suptitle(f"Aggregate Hold Postural Drift: {title_suffix} (All Trials Overlaid)", fontsize=15, weight='bold', y=0.95)
    plt.tight_layout(rect=[0, 0, 1, 0.95])
    plt.show()


@normalize_participant_codes
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
        
        speed = row.get('tap_Overall_tap_frequency_median', 0)
        cv = row.get('tap_Overall_cv_intertap_interval_median', 0)
        acc = row.get('tap_Overall_tap_accuracy_median', 0)
        drift = row.get('hold_Overall_hold_drift_distance_median', 0)
        drag_eff = row.get('drag_Overall_path_efficiency_median', 0)
        
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


@normalize_participant_codes
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
    import pandas as pd
    import numpy as np
    import matplotlib.pyplot as plt
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

    # Define the custom metrics grouped by task type as requested
    comparison_metrics = {
        'Tap Task (Legacy Tapping)': {
            'tap_Overall_tap_frequency_median': ('Speed (Hz)', 'Higher is faster'),
            'tap_Overall_median_amplitude_mm_median': ('Median Amplitude (mm)', 'Lower is more precise (less spatial drift)'),
            'tap_Overall_hesitations_count_median': ('Hesitations Count', 'Lower is more stable'),
            'tap_Overall_halts_count_median': ('Halts (Freezes) Count', 'Lower is healthier'),
            'tap_Overall_amplitude_decrement_ratio_median': ('Amplitude Decrement Ratio', 'Near 1.0 is stable, lower shows fatiguing')
        },
        'Drag Task (Kinematic)': {
            'drag_Overall_mean_speed_median': ('Speed (px/s)', 'Higher is faster'),
            'drag_Overall_kinetic_tremor_amplitude_median': ('Tremor Amplitude (px)', 'Lower is smoother'),
            'drag_Overall_kinetic_tremor_frequency_hz_median': ('Tremor Frequency (Hz)', 'Typical tremor is 4-6 Hz'),
            'drag_Overall_drag_hesitations_count_median': ('Hesitations Count', 'Lower is more stable'),
            'drag_Overall_drag_halts_count_median': ('Halts (Freezes) Count', 'Lower is healthier'),
            'drag_Overall_drag_amplitude_decrement_ratio_median': ('Amplitude Decrement Ratio', 'Near 1.0 is stable, lower shows fatiguing')
        },
        'Hold Task (Postural)': {
            'hold_Overall_hold_drift_distance_median': ('Postural Drift (px)', 'Lower is more stable'),
            'hold_Overall_hold_tremor_amplitude_median': ('Postural Tremor (px)', 'Lower is more stable')
        }
    }

    # Build the multi-index summary table grouped by Task and Metric
    rows = []
    for task_name, metrics_dict in comparison_metrics.items():
        for col, (label, _) in metrics_dict.items():
            if col in master_df.columns:
                row_data = {'Task': task_name, 'Metric': label}
                for p in participant_codes:
                    p_row = master_df[master_df['participant_code'] == p]
                    val = p_row[col].values[0] if not p_row.empty else np.nan
                    row_data[p] = val
                rows.append(row_data)
                
    comp_df = pd.DataFrame(rows)
    if not comp_df.empty:
        comp_df = comp_df.set_index(['Task', 'Metric'])
        print("=== Summary Table: Participant Key Metrics ===")
        from IPython.display import display
        display(comp_df)
    else:
        print("None of the specified comparison columns found in master_df.")
        return

    # Plot barcharts segmented by task type in separate figures
    task_groups = list(comparison_metrics.keys())
    colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'] # blue, red, green, orange
    width = 0.5
    
    for task_name in task_groups:
        metrics_dict = comparison_metrics[task_name]
        metric_keys = list(metrics_dict.keys())
        n_metrics = len(metric_keys)
        
        # Dynamically scale width based on the number of metrics
        fig, axes = plt.subplots(1, n_metrics, figsize=(3.8 * n_metrics, 4), squeeze=False)
        axes_flat = axes.ravel()
        
        for col_idx, col in enumerate(metric_keys):
            ax = axes_flat[col_idx]
            label, desc = metrics_dict[col]
            
            if col not in master_df.columns:
                ax.text(0.5, 0.5, "Metric missing", ha='center', va='center')
                continue
                
            # Extract values for plotting
            vals = []
            for p in participant_codes:
                p_row = master_df[master_df['participant_code'] == p]
                val = p_row[col].values[0] if not p_row.empty else 0.0
                vals.append(val)
                
            x_pos = np.arange(len(participant_codes))
            ax.bar(x_pos, vals, width, color=colors[:len(participant_codes)], edgecolor='black', alpha=0.8)
            ax.set_title(f"{label}\n({desc})", fontsize=10, fontweight='bold', pad=8)
            ax.set_xticks(x_pos)
            ax.set_xticklabels(participant_codes, fontsize=9)
            ax.yaxis.grid(True, linestyle='--', alpha=0.3)
            ax.spines['top'].set_visible(False)
            ax.spines['right'].set_visible(False)
            
            # Add value labels on top of the bars
            for i, val in enumerate(vals):
                if pd.notna(val):
                    ax.text(i, val + (max(vals)*0.015 if max(vals) > 0 else 0.05), f"{val:.3f}", ha='center', va='bottom', fontsize=8.5, fontweight='bold')
                    
        plt.suptitle(f"{task_name}: Comparison of Key Digital Measures ({' vs '.join(participant_codes)})", fontsize=13, fontweight='bold', y=1.05)
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


@normalize_participant_codes
def simulate_tap_target_diameters(
    trials_df=None,
    participants_df=None,
    sessions_df=None,
    session_type='main',
    csv_dir=None,
    supabase_url=None,
    supabase_key=None
):
    """
    Simulates tap containment rates for 12mm, 16mm, 20mm, optimized 120px (31.8mm), and original 300px (79.4mm) target diameters
    for each participant and returns a summary DataFrame, while plotting a single continuous cohort containment curve.
    """
    tdf, sdf, pdf = resolve_data(
        trials_df=trials_df,
        sessions_df=sessions_df,
        participants_df=participants_df,
        csv_dir=csv_dir,
        supabase_url=supabase_url,
        supabase_key=supabase_key
    )

    if session_type and sdf is not None:
        main_session_ids = sdf[sdf['session_type'] == session_type]['id']
        tap_trials = tdf[(tdf['task_type'] == 'tap') & (tdf['session_id'].isin(main_session_ids))]
    else:
        tap_trials = tdf[tdf['task_type'] == 'tap']
    
    configs = [
        {"name": "16.0mm Diameter", "radius_px": 8.0 * 96.0 / 25.4, "diameter_mm": 16.0},
        {"name": "20.0mm Diameter", "radius_px": 10.0 * 96.0 / 25.4, "diameter_mm": 20.0},
        {"name": "25.0mm Diameter", "radius_px": 12.5 * 96.0 / 25.4, "diameter_mm": 25.0},
        {"name": "26.0mm Diameter", "radius_px": 13.0 * 96.0 / 25.4, "diameter_mm": 26.0},
        {"name": "28.0mm Diameter", "radius_px": 14.0 * 96.0 / 25.4, "diameter_mm": 28.0},
        {"name": "31.8mm Diameter", "radius_px": 60.0, "diameter_mm": 60.0 * 2.0 * 25.4 / 96.0},
        {"name": "79.4mm Diameter", "radius_px": 150.0, "diameter_mm": 150.0 * 2.0 * 25.4 / 96.0}
    ]
    
    participants = sorted(pdf['participant_code'].unique().tolist()) if 'participant_code' in pdf.columns else []
    
    rows = []
    
    for p_code in participants:
        p_ids = pdf[pdf['participant_code'] == p_code]['id'].values if 'participant_code' in pdf.columns else []
        p_trials = tap_trials[tap_trials['participant_id'].isin(p_ids)]
        
        for cfg in configs:
            hits = 0
            misses = 0
            total = 0
            
            for _, row in p_trials.iterrows():
                taps = row.get('taps', [])
                if isinstance(taps, str):
                    taps = json.loads(taps)
                if not taps or not isinstance(taps, list):
                    continue
                for t in taps:
                    if 'x' in t and 'y' in t:
                        tx_curr = t.get('target_x')
                        ty_curr = t.get('target_y')
                        if pd.isna(tx_curr) or pd.isna(ty_curr):
                            tx_curr = row.get('target_x')
                            ty_curr = row.get('target_y')
                            
                        if pd.isna(tx_curr) or pd.isna(ty_curr):
                            continue
                            
                        dist = np.sqrt((t['x'] - tx_curr)**2 + (t['y'] - ty_curr)**2)
                        total += 1
                        if dist <= cfg['radius_px']:
                            hits += 1
                        else:
                            misses += 1
            
            rate = (hits / total * 100) if total > 0 else 0
            
            rows.append({
                "Participant": p_code,
                "Target Size": cfg['name'],
                "Radius (px)": round(cfg['radius_px'], 1),
                "Diameter (mm)": round(cfg['diameter_mm'], 1),
                "Total Taps": total,
                "Hits": hits,
                "Misses": misses,
                "Success Rate (%)": f"{rate:.1f}%"
            })
            
    df_res = pd.DataFrame(rows)
    return df_res


def plot_clinical_metrics_dashboard(master_df, trials_df=None, participants_df=None, sessions_df=None, save_dir=None):
    """
    Generates a series of clinical dashboards for Finger Tapping, Drag, and Hold tasks
    to visualize speed, amplitude, freezes (hesitations/halts), and tremors as assessed by clinicians.
    """
    import numpy as np
    import os
    import pandas as pd

    # Try resolving/loading raw data if missing (needed for raw tap amplitude decrement slopes)
    if trials_df is None or participants_df is None or sessions_df is None:
        try:
            import data_loader
            tdf_loc, sdf_loc, pdf_loc = data_loader.load_from_csv("/Users/janetikhile/Documents/ResearchProject/analysis/data")
            if trials_df is None: trials_df = tdf_loc
            if sessions_df is None: sessions_df = sdf_loc
            if participants_df is None: participants_df = pdf_loc
        except Exception as e:
            print(f"Clinician dashboard automatic raw data loading failed: {e}")

    participant_codes = sorted(master_df['participant_code'].unique().tolist())
    n_participants = len(participant_codes)
    
    # -------------------------------------------------------------
    # 1. Finger Tapping Dashboard
    # -------------------------------------------------------------
    fig = plt.figure(figsize=(14, 12))
    fig.suptitle("Finger Tapping Task - Clinician Assessment Dashboard", fontsize=16, weight='bold', y=0.98)
    
    # Colors
    colors = ['#2563EB', '#0D9488', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4']
    x = np.arange(n_participants)
    width = 0.35
    
    # Define Subplots using GridSpec to prevent overlap and accommodate large bottom plot
    gs = fig.add_gridspec(3, 2, hspace=0.4, wspace=0.3)
    
    ax_speed = fig.add_subplot(gs[0, 0])
    ax_amp = fig.add_subplot(gs[0, 1])
    ax_hes = fig.add_subplot(gs[1, 0])
    ax_halt = fig.add_subplot(gs[1, 1])
    ax_trend = fig.add_subplot(gs[2, 0])
    ax_grade = fig.add_subplot(gs[2, 1])
    
    # Subplot 1: Speed (Frequency)
    freqs = [master_df[master_df['participant_code'] == p]['tap_Overall_tap_frequency_median'].values[0] for p in participant_codes]
    ax_speed.bar(x, freqs, width, color=colors[:n_participants], edgecolor='black', alpha=0.8)
    ax_speed.set_title("Tapping Speed (Frequency)", fontsize=12, fontweight='bold', pad=10)
    ax_speed.set_ylabel("Frequency (Hz)", fontsize=11)
    ax_speed.set_xticks(x)
    ax_speed.set_xticklabels(participant_codes)
    ax_speed.set_ylim(0, max(freqs) * 1.25 if freqs else 10)
    ax_speed.yaxis.grid(True, linestyle='--', alpha=0.3)
    ax_speed.spines['top'].set_visible(False)
    ax_speed.spines['right'].set_visible(False)
    for i, val in enumerate(freqs):
        if pd.notna(val):
            ax_speed.text(i, val + 0.1, f"{val:.2f} Hz", ha='center', va='bottom', fontweight='bold')

    # Subplot 2: Amplitude (Median Amplitude in mm)
    amps_px = [master_df[master_df['participant_code'] == p]['tap_Overall_median_amplitude_px_median'].values[0] for p in participant_codes]
    amps_mm = [val * (25.4 / 96.0) for val in amps_px] # Convert px to mm
    ax_amp.bar(x, amps_mm, width, color=colors[:n_participants], edgecolor='black', alpha=0.8)
    ax_amp.set_title("Tapping Movement Amplitude", fontsize=12, fontweight='bold', pad=10)
    ax_amp.set_ylabel("Median Amplitude (mm)", fontsize=11)
    ax_amp.set_xticks(x)
    ax_amp.set_xticklabels(participant_codes)
    ax_amp.set_ylim(0, max(amps_mm) * 1.25 if amps_mm else 60)
    ax_amp.yaxis.grid(True, linestyle='--', alpha=0.3)
    ax_amp.spines['top'].set_visible(False)
    ax_amp.spines['right'].set_visible(False)
    for i, val in enumerate(amps_mm):
        if pd.notna(val):
            ax_amp.text(i, val + 0.5, f"{val:.1f} mm", ha='center', va='bottom', fontweight='bold')

    # Subplot 3: Hesitations
    counts = [master_df[master_df['participant_code'] == p]['tap_Overall_hesitations_count_median'].values[0] for p in participant_codes]
    durs = [master_df[master_df['participant_code'] == p]['tap_Overall_hesitations_duration_ms_median'].values[0] / 1000.0 for p in participant_codes]
    
    ax_hes.bar(x - width/2, counts, width, label='Count', color='#2563EB', edgecolor='black', alpha=0.8)
    ax_hes2 = ax_hes.twinx()
    ax_hes2.bar(x + width/2, durs, width, label='Duration (s)', color='#F59E0B', edgecolor='black', alpha=0.8)
    
    ax_hes.set_title("Tapping Hesitations (Slowdowns)", fontsize=12, fontweight='bold', pad=10)
    ax_hes.set_ylabel("Hesitations Count", color='#2563EB', fontsize=11)
    ax_hes2.set_ylabel("Total Duration (seconds)", color='#F59E0B', fontsize=11)
    ax_hes.set_xticks(x)
    ax_hes.set_xticklabels(participant_codes)
    ax_hes.set_ylim(0, max(counts) * 1.4 if max(counts) > 0 else 5)
    ax_hes2.set_ylim(0, max(durs) * 1.4 if max(durs) > 0 else 5)
    ax_hes.yaxis.grid(True, linestyle='--', alpha=0.3)
    ax_hes.spines['top'].set_visible(False)
    ax_hes2.spines['top'].set_visible(False)
    
    lines, labels = ax_hes.get_legend_handles_labels()
    lines2, labels2 = ax_hes2.get_legend_handles_labels()
    ax_hes.legend(lines + lines2, labels + labels2, loc='upper left', frameon=True, facecolor='white', framealpha=0.9)
    
    for i, val in enumerate(counts):
        if pd.notna(val):
            ax_hes.text(i - width/2, val + 0.1, f"{int(val)}", ha='center', va='bottom', fontweight='bold', color='#2563EB')
    for i, val in enumerate(durs):
        if pd.notna(val):
            ax_hes2.text(i + width/2, val + 0.1, f"{val:.1f}s", ha='center', va='bottom', fontweight='bold', color='#F59E0B')

    # Subplot 4: Halts
    counts_h = [master_df[master_df['participant_code'] == p]['tap_Overall_halts_count_median'].values[0] for p in participant_codes]
    durs_h = [master_df[master_df['participant_code'] == p]['tap_Overall_halts_duration_ms_median'].values[0] / 1000.0 for p in participant_codes]
    
    ax_halt.bar(x - width/2, counts_h, width, label='Count', color='#0D9488', edgecolor='black', alpha=0.8)
    ax_halt2 = ax_halt.twinx()
    ax_halt2.bar(x + width/2, durs_h, width, label='Duration (s)', color='#EC4899', edgecolor='black', alpha=0.8)
    
    ax_halt.set_title("Tapping Halts (Complete Freezes)", fontsize=12, fontweight='bold', pad=10)
    ax_halt.set_ylabel("Halts Count", color='#0D9488', fontsize=11)
    ax_halt2.set_ylabel("Total Duration (seconds)", color='#EC4899', fontsize=11)
    ax_halt.set_xticks(x)
    ax_halt.set_xticklabels(participant_codes)
    ax_halt.set_ylim(0, max(counts_h) * 1.4 if max(counts_h) > 0 else 5)
    ax_halt2.set_ylim(0, max(durs_h) * 1.4 if max(durs_h) > 0 else 5)
    ax_halt.yaxis.grid(True, linestyle='--', alpha=0.3)
    ax_halt.spines['top'].set_visible(False)
    ax_halt2.spines['top'].set_visible(False)
    
    lines, labels = ax_halt.get_legend_handles_labels()
    lines2, labels2 = ax_halt2.get_legend_handles_labels()
    ax_halt.legend(lines + lines2, labels + labels2, loc='upper left', frameon=True, facecolor='white', framealpha=0.9)
    
    for i, val in enumerate(counts_h):
        if pd.notna(val):
            ax_halt.text(i - width/2, val + 0.1, f"{int(val)}", ha='center', va='bottom', fontweight='bold', color='#0D9488')
    for i, val in enumerate(durs_h):
        if pd.notna(val):
            ax_halt2.text(i + width/2, val + 0.1, f"{val:.1f}s", ha='center', va='bottom', fontweight='bold', color='#EC4899')

    # Subplot 5: Amplitude Decrement Slope (Tap-by-Tap Profile)
    if trials_df is not None and participants_df is not None and sessions_df is not None:
        main_session_ids = sessions_df[sessions_df['session_type'] == 'main']['id']
        tap_trials = trials_df[(trials_df['task_type'] == 'tap') & (trials_df['session_id'].isin(main_session_ids))]
        
        for idx, p_code in enumerate(participant_codes):
            p_ids = participants_df[participants_df['participant_code'] == p_code]['id'].values
            if len(p_ids) > 0:
                p_id = p_ids[0]
                p_trials = tap_trials[tap_trials['participant_id'] == p_id]
                
                all_indices = []
                all_amplitudes_mm = []
                
                for _, trial_row in p_trials.iterrows():
                    taps = trial_row.get('taps', [])
                    amplitudes = []
                    for i in range(1, len(taps)):
                        t_curr = taps[i]
                        t_prev = taps[i-1]
                        if 'amplitude' in t_curr and t_curr['amplitude'] is not None:
                            amplitudes.append(t_curr['amplitude'])
                        elif 'y' in t_curr and 'y' in t_prev:
                            amplitudes.append(abs(t_curr['y'] - t_prev['y']))
                        else:
                            x_diff = t_curr.get('x', 0) - t_prev.get('x', 0)
                            y_diff = t_curr.get('y', 0) - t_prev.get('y', 0)
                            amplitudes.append(np.sqrt(x_diff**2 + y_diff**2))
                    
                    for tap_idx, amp_px in enumerate(amplitudes):
                        amp_mm = amp_px * (25.4 / 96.0)
                        all_indices.append(tap_idx)
                        all_amplitudes_mm.append(amp_mm)
                        
                if all_indices:
                    color = colors[idx % len(colors)]
                    ax_trend.scatter(all_indices, all_amplitudes_mm, alpha=0.15, color=color, s=25, label=f"{p_code} Raw Taps")
                    
                    # Fit linear regression
                    slope, intercept = np.polyfit(all_indices, all_amplitudes_mm, 1)
                    x_fit = np.unique(all_indices)
                    y_fit = slope * x_fit + intercept
                    ax_trend.plot(x_fit, y_fit, color=color, linewidth=2.5, label=f"{p_code} Trend (Slope: {slope:.3f} mm/tap)")
                    
        ax_trend.set_title("Amplitude Decrement Profile (Tapping Fatigue)", fontsize=12, fontweight='bold', pad=10)
        ax_trend.set_xlabel("Tap Index", fontsize=11)
        ax_trend.set_ylabel("Tap Amplitude (mm)", fontsize=11)
        ax_trend.spines['top'].set_visible(False)
        ax_trend.spines['right'].set_visible(False)
        ax_trend.yaxis.grid(True, linestyle='--', alpha=0.3)
        ax_trend.xaxis.grid(True, linestyle='--', alpha=0.3)
        ax_trend.legend(loc='lower left', frameon=True, facecolor='white', framealpha=0.9)
    else:
        ax_trend.text(0.5, 0.5, "Raw trials data missing - cannot plot decrement slope", ha='center', va='center')
        
    # Subplot 6: MDS-UPDRS Estimated Impairment Grade
    if 'tap_Overall_tap_clinical_impairment_grade_median' in master_df.columns:
        grades = [master_df[master_df['participant_code'] == p]['tap_Overall_tap_clinical_impairment_grade_median'].values[0] for p in participant_codes]
    else:
        grades = [0.0] * n_participants
        
    ax_grade.bar(x, grades, width, color='#EC4899', edgecolor='black', alpha=0.8)
    ax_grade.set_title("Estimated Clinical Severity\n(MDS-UPDRS Item 3.4 Finger Tapping)", fontsize=11, fontweight='bold', pad=10)
    ax_grade.set_ylabel("Estimated Severity Grade (0-4)", fontsize=11)
    ax_grade.set_xticks(x)
    ax_grade.set_xticklabels(participant_codes)
    ax_grade.set_ylim(0, 4.5)
    ax_grade.yaxis.grid(True, linestyle='--', alpha=0.3)
    ax_grade.spines['top'].set_visible(False)
    ax_grade.spines['right'].set_visible(False)
    for i, val in enumerate(grades):
        if pd.notna(val):
            ax_grade.text(i, val + 0.1, f"Grade {val:.1f}", ha='center', va='bottom', fontweight='bold', color='#EC4899')
            
    plt.subplots_adjust(hspace=0.4, wspace=0.3)
    if save_dir is not None:
        plt.savefig(os.path.join(save_dir, "finger_tapping_dashboard.png"), dpi=300, bbox_inches='tight')
        plt.close()
    else:
        plt.show()

    # -------------------------------------------------------------
    # 2. Drag Task Dashboard
    # -------------------------------------------------------------
    fig, axes = plt.subplots(4, 2, figsize=(14, 18))
    fig.suptitle("Drag Task - Clinician Assessment Dashboard", fontsize=16, weight='bold', y=0.98)
    
    # Subplot 1: Speed
    ax = axes[0, 0]
    drag_speeds = [master_df[master_df['participant_code'] == p]['drag_Overall_mean_speed_median'].values[0] for p in participant_codes]
    ax.bar(x, drag_speeds, width, color=colors[:n_participants])
    ax.set_title("Drag Movement Speed", fontsize=12, fontweight='bold')
    ax.set_ylabel("Mean Speed (px/s)", fontsize=11)
    ax.set_xticks(x)
    ax.set_xticklabels(participant_codes)
    ax.yaxis.grid(True, linestyle='--', alpha=0.3)
    for i, val in enumerate(drag_speeds):
        if pd.notna(val):
            ax.text(i, val + 10, f"{val:.1f} px/s", ha='center', va='bottom', fontweight='bold')

    # Subplot 2: Amplitude Decrement
    ax = axes[0, 1]
    drag_dec = [master_df[master_df['participant_code'] == p]['drag_Overall_drag_amplitude_decrement_ratio_median'].values[0] for p in participant_codes]
    ax.bar(x, drag_dec, width, color=colors[:n_participants])
    ax.axhline(y=1.0, color='red', linestyle='--', alpha=0.5, label='No Decrement')
    ax.set_title("Path Deviation Amplitude Decrement Ratio\n(2nd Half Deviation / 1st Half Deviation)", fontsize=12, fontweight='bold')
    ax.set_ylabel("Ratio (< 1.0 indicates decrement)", fontsize=11)
    ax.set_xticks(x)
    ax.set_xticklabels(participant_codes)
    ax.set_ylim(0, 1.5)
    ax.yaxis.grid(True, linestyle='--', alpha=0.3)
    ax.legend(loc='lower left')
    for i, val in enumerate(drag_dec):
        if pd.notna(val):
            ax.text(i, val + 0.02, f"{val:.2f}", ha='center', va='bottom', fontweight='bold')

    # Subplot 3: Hesitations
    ax = axes[1, 0]
    drag_hes_c = [master_df[master_df['participant_code'] == p]['drag_Overall_drag_hesitations_count_median'].values[0] for p in participant_codes]
    drag_hes_d = [master_df[master_df['participant_code'] == p]['drag_Overall_drag_hesitations_duration_ms_median'].values[0] / 1000.0 for p in participant_codes]
    
    ax.bar(x - width/2, drag_hes_c, width, label='Count', color='#2563EB')
    ax2 = ax.twinx()
    ax2.bar(x + width/2, drag_hes_d, width, label='Duration (s)', color='#F59E0B')
    
    ax.set_title("Drag Hesitations (Slowdowns)", fontsize=12, fontweight='bold')
    ax.set_ylabel("Hesitations Count", color='#2563EB', fontsize=11)
    ax2.set_ylabel("Total Duration (seconds)", color='#F59E0B', fontsize=11)
    ax.set_xticks(x)
    ax.set_xticklabels(participant_codes)
    ax.yaxis.grid(True, linestyle='--', alpha=0.3)
    lines, labels = ax.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax.legend(lines + lines2, labels + labels2, loc='upper right')
    for i, val in enumerate(drag_hes_c):
        if pd.notna(val):
            ax.text(i - width/2, val + 0.1, f"{int(val)}", ha='center', va='bottom', fontweight='bold', color='#2563EB')
    for i, val in enumerate(drag_hes_d):
        if pd.notna(val):
            ax2.text(i + width/2, val + 0.02, f"{val:.1f}s", ha='center', va='bottom', fontweight='bold', color='#F59E0B')

    # Subplot 4: Halts
    ax = axes[1, 1]
    drag_hlt_c = [master_df[master_df['participant_code'] == p]['drag_Overall_drag_halts_count_median'].values[0] for p in participant_codes]
    drag_hlt_d = [master_df[master_df['participant_code'] == p]['drag_Overall_drag_halts_duration_ms_median'].values[0] / 1000.0 for p in participant_codes]
    
    ax.bar(x - width/2, drag_hlt_c, width, label='Count', color='#0D9488')
    ax2 = ax.twinx()
    ax2.bar(x + width/2, drag_hlt_d, width, label='Duration (s)', color='#EC4899')
    
    ax.set_title("Drag Halts (Complete Stops)", fontsize=12, fontweight='bold')
    ax.set_ylabel("Halts Count", color='#0D9488', fontsize=11)
    ax2.set_ylabel("Total Duration (seconds)", color='#EC4899', fontsize=11)
    ax.set_xticks(x)
    ax.set_xticklabels(participant_codes)
    ax.yaxis.grid(True, linestyle='--', alpha=0.3)
    lines, labels = ax.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax.legend(lines + lines2, labels + labels2, loc='upper right')
    for i, val in enumerate(drag_hlt_c):
        if pd.notna(val):
            ax.text(i - width/2, val + 0.1, f"{int(val)}", ha='center', va='bottom', fontweight='bold', color='#0D9488')
    for i, val in enumerate(drag_hlt_d):
        if pd.notna(val):
            ax2.text(i + width/2, val + 0.02, f"{val:.1f}s", ha='center', va='bottom', fontweight='bold', color='#EC4899')

    # Subplot 5: Kinetic Tremor Amplitude & Clinical Grade
    ax = axes[2, 0]
    trem_amp = [master_df[master_df['participant_code'] == p]['drag_Overall_drag_tremor_amplitude_peak_cm_median'].values[0] for p in participant_codes]
    trem_grade = [master_df[master_df['participant_code'] == p]['drag_Overall_drag_tremor_clinical_grade_median'].values[0] for p in participant_codes]
    
    ax.bar(x - width/2, trem_amp, width, label='Amp (cm)', color='#8B5CF6')
    ax2 = ax.twinx()
    ax2.bar(x + width/2, trem_grade, width, label='Estimated Clinical Severity', color='#EC4899')
    
    ax.set_title("Estimated Clinical Severity\n(MDS-UPDRS Item 3.16 Kinetic Tremor)", fontsize=11, fontweight='bold')
    ax.set_ylabel("Peak-to-Peak Amplitude (cm)", color='#8B5CF6', fontsize=11)
    ax2.set_ylabel("Estimated Severity Grade (0-4)", color='#EC4899', fontsize=11)
    ax2.set_ylim(0, 4.2)
    ax.set_xticks(x)
    ax.set_xticklabels(participant_codes)
    ax.yaxis.grid(True, linestyle='--', alpha=0.3)
    lines, labels = ax.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax.legend(lines + lines2, labels + labels2, loc='upper left')
    for i, val in enumerate(trem_amp):
        if pd.notna(val):
            ax.text(i - width/2, val + 0.02, f"{val:.2f} cm", ha='center', va='bottom', fontweight='bold', color='#8B5CF6')
    for i, val in enumerate(trem_grade):
        if pd.notna(val):
            ax2.text(i + width/2, val + 0.1, f"Grade {val:.1f}", ha='center', va='bottom', fontweight='bold', color='#EC4899')

    # Subplot 6: Kinetic Tremor Frequency
    ax = axes[2, 1]
    trem_freq = [master_df[master_df['participant_code'] == p]['drag_Overall_kinetic_tremor_frequency_hz_median'].values[0] for p in participant_codes]
    ax.bar(x, trem_freq, width, color='#06B6D4')
    ax.set_title("Kinetic Tremor Frequency", fontsize=12, fontweight='bold')
    ax.set_ylabel("Frequency (Hz)", fontsize=11)
    ax.set_ylim(0, 10.0)
    ax.set_xticks(x)
    ax.set_xticklabels(participant_codes)
    ax.yaxis.grid(True, linestyle='--', alpha=0.3)
    for i, val in enumerate(trem_freq):
        if pd.notna(val):
            ax.text(i, val + 0.2, f"{val:.2f} Hz", ha='center', va='bottom', fontweight='bold')
            
    # Subplot 7: MDS-UPDRS Item 3.5 Hand Movements Grade
    ax = axes[3, 0]
    if 'drag_Overall_drag_clinical_impairment_grade_median' in master_df.columns:
        grades = [master_df[master_df['participant_code'] == p]['drag_Overall_drag_clinical_impairment_grade_median'].values[0] for p in participant_codes]
    else:
        grades = [0.0] * n_participants
        
    ax.bar(x, grades, width, color='#EC4899', edgecolor='black', alpha=0.8)
    ax.set_title("Estimated Clinical Severity\n(MDS-UPDRS Item 3.5 Hand Movements)", fontsize=11, fontweight='bold')
    ax.set_ylabel("Estimated Severity Grade (0-4)", fontsize=11)
    ax.set_xticks(x)
    ax.set_xticklabels(participant_codes)
    ax.set_ylim(0, 4.5)
    ax.yaxis.grid(True, linestyle='--', alpha=0.3)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    for i, val in enumerate(grades):
        if pd.notna(val):
            ax.text(i, val + 0.1, f"Grade {val:.1f}", ha='center', va='bottom', fontweight='bold', color='#EC4899')

    # Subplot 8: Fitts' Law Throughput
    ax = axes[3, 1]
    if 'drag_Overall_fitts_law_throughput_median' in master_df.columns:
        throughput = [master_df[master_df['participant_code'] == p]['drag_Overall_fitts_law_throughput_median'].values[0] for p in participant_codes]
    else:
        throughput = [0.0] * n_participants
    ax.bar(x, throughput, width, color='#F59E0B', edgecolor='black', alpha=0.8)
    ax.set_title("Fitts' Law Throughput (Precision Bandwidth)", fontsize=12, fontweight='bold')
    ax.set_ylabel("Throughput (bits/s)", fontsize=11)
    ax.set_xticks(x)
    ax.set_xticklabels(participant_codes)
    ax.yaxis.grid(True, linestyle='--', alpha=0.3)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    for i, val in enumerate(throughput):
        if pd.notna(val):
            ax.text(i, val + 0.05, f"{val:.2f} bps", ha='center', va='bottom', fontweight='bold', color='#F59E0B')
            
    plt.tight_layout()
    if save_dir is not None:
        plt.savefig(os.path.join(save_dir, "drag_task_dashboard.png"), dpi=300)
        plt.close()
    else:
        plt.show()

    # -------------------------------------------------------------
    # 3. Hold Task Postural Tremor Dashboard
    # -------------------------------------------------------------
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))
    fig.suptitle("Hold Task - MDS-UPDRS Item 3.15 Postural Tremor Dashboard", fontsize=16, weight='bold', y=1.02)
    
    # Subplot 1: Postural Tremor Amplitude
    ax = axes[0]
    hold_amp = [master_df[master_df['participant_code'] == p]['hold_Overall_hold_tremor_amplitude_peak_cm_median'].values[0] for p in participant_codes]
    ax.bar(x, hold_amp, width, color='#8B5CF6')
    ax.set_title("Postural Tremor Peak-to-Peak Amplitude", fontsize=12, fontweight='bold')
    ax.set_ylabel("Amplitude (cm)", fontsize=11)
    ax.set_xticks(x)
    ax.set_xticklabels(participant_codes)
    ax.yaxis.grid(True, linestyle='--', alpha=0.3)
    for i, val in enumerate(hold_amp):
        if pd.notna(val):
            ax.text(i, val + 0.05, f"{val:.3f} cm", ha='center', va='bottom', fontweight='bold')

    # Subplot 2: Postural Tremor Frequency
    ax = axes[1]
    hold_freq = [master_df[master_df['participant_code'] == p]['hold_Overall_hold_tremor_frequency_hz_median'].values[0] for p in participant_codes]
    ax.bar(x, hold_freq, width, color='#06B6D4')
    ax.set_title("Postural Tremor Peak Frequency", fontsize=12, fontweight='bold')
    ax.set_ylabel("Frequency (Hz)", fontsize=11)
    ax.set_ylim(0, 10.0)
    ax.set_xticks(x)
    ax.set_xticklabels(participant_codes)
    ax.yaxis.grid(True, linestyle='--', alpha=0.3)
    for i, val in enumerate(hold_freq):
        if pd.notna(val):
            ax.text(i, val + 0.2, f"{val:.2f} Hz", ha='center', va='bottom', fontweight='bold')

    # Subplot 3: MDS-UPDRS Item 3.15 Postural Tremor Grade
    ax = axes[2]
    hold_grade = [master_df[master_df['participant_code'] == p]['hold_Overall_hold_tremor_clinical_grade_median'].values[0] for p in participant_codes]
    ax.bar(x, hold_grade, width, color='#EC4899')
    ax.set_title("Estimated Clinical Severity\n(MDS-UPDRS Item 3.15 Postural Tremor)", fontsize=11, fontweight='bold')
    ax.set_ylabel("Estimated Severity Grade (0-4)", fontsize=11)
    ax.set_ylim(0, 4.2)
    ax.set_xticks(x)
    ax.set_xticklabels(participant_codes)
    ax.yaxis.grid(True, linestyle='--', alpha=0.3)
    for i, val in enumerate(hold_grade):
        if pd.notna(val):
            ax.text(i, val + 0.1, f"Grade {val:.1f}", ha='center', va='bottom', fontweight='bold')
            
    plt.tight_layout()
    if save_dir is not None:
        plt.savefig(os.path.join(save_dir, "hold_task_dashboard.png"), dpi=300)
        plt.close()
    else:
        plt.show()

    # -------------------------------------------------------------
    # 4. Pinch Task Clinician Dashboard
    # -------------------------------------------------------------
    has_pinch = any(col.startswith('pinch_Overall_') for col in master_df.columns)
    if has_pinch:
        fig = plt.figure(figsize=(14, 12))
        fig.suptitle("Pinch Tapping Task - Clinician Assessment Dashboard", fontsize=16, weight='bold', y=0.98)
        
        # GridSpec for clean, non-overlapping layouts
        gs = fig.add_gridspec(3, 2, hspace=0.4, wspace=0.3)
        
        ax_speed = fig.add_subplot(gs[0, 0])
        ax_amp = fig.add_subplot(gs[0, 1])
        ax_hes = fig.add_subplot(gs[1, 0])
        ax_halt = fig.add_subplot(gs[1, 1])
        ax_trend = fig.add_subplot(gs[2, 0])
        ax_grade = fig.add_subplot(gs[2, 1])
        
        # Subplot 1: Pinch Speed (Frequency)
        freqs = [master_df[master_df['participant_code'] == p]['pinch_Overall_pinch_frequency_median'].values[0] for p in participant_codes]
        ax_speed.bar(x, freqs, width, color=colors[:n_participants], edgecolor='black', alpha=0.8)
        ax_speed.set_title("Pinch Speed (Frequency)", fontsize=12, fontweight='bold', pad=10)
        ax_speed.set_ylabel("Frequency (Hz)", fontsize=11)
        ax_speed.set_xticks(x)
        ax_speed.set_xticklabels(participant_codes)
        ax_speed.set_ylim(0, max(freqs) * 1.25 if any(pd.notna(f) for f in freqs) else 5)
        ax_speed.yaxis.grid(True, linestyle='--', alpha=0.3)
        ax_speed.spines['top'].set_visible(False)
        ax_speed.spines['right'].set_visible(False)
        for i, val in enumerate(freqs):
            if pd.notna(val):
                ax_speed.text(i, val + 0.05, f"{val:.2f} Hz", ha='center', va='bottom', fontweight='bold')
                
        # Subplot 2: Pinch Amplitude (Median Amplitude in mm)
        amps_px = [master_df[master_df['participant_code'] == p]['pinch_Overall_median_pinch_amplitude_px_median'].values[0] for p in participant_codes]
        amps_mm = [val * (25.4 / 96.0) for val in amps_px]
        ax_amp.bar(x, amps_mm, width, color=colors[:n_participants], edgecolor='black', alpha=0.8)
        ax_amp.set_title("Pinch Movement Amplitude", fontsize=12, fontweight='bold', pad=10)
        ax_amp.set_ylabel("Median Amplitude (mm)", fontsize=11)
        ax_amp.set_xticks(x)
        ax_amp.set_xticklabels(participant_codes)
        ax_amp.set_ylim(0, max(amps_mm) * 1.25 if any(pd.notna(a) for a in amps_mm) else 100)
        ax_amp.yaxis.grid(True, linestyle='--', alpha=0.3)
        ax_amp.spines['top'].set_visible(False)
        ax_amp.spines['right'].set_visible(False)
        for i, val in enumerate(amps_mm):
            if pd.notna(val):
                ax_amp.text(i, val + 1.0, f"{val:.1f} mm", ha='center', va='bottom', fontweight='bold')
                
        # Subplot 3: Pinch Hesitations
        counts = [master_df[master_df['participant_code'] == p]['pinch_Overall_pinch_hesitations_count_median'].values[0] for p in participant_codes]
        durs = [master_df[master_df['participant_code'] == p]['pinch_Overall_pinch_hesitations_duration_ms_median'].values[0] / 1000.0 for p in participant_codes]
        
        ax_hes.bar(x - width/2, counts, width, label='Count', color='#2563EB', edgecolor='black', alpha=0.8)
        ax_hes2 = ax_hes.twinx()
        ax_hes2.bar(x + width/2, durs, width, label='Duration (s)', color='#F59E0B', edgecolor='black', alpha=0.8)
        
        ax_hes.set_title("Pinch Hesitations (Slowdowns)", fontsize=12, fontweight='bold', pad=10)
        ax_hes.set_ylabel("Hesitations Count", color='#2563EB', fontsize=11)
        ax_hes2.set_ylabel("Total Duration (seconds)", color='#F59E0B', fontsize=11)
        ax_hes.set_xticks(x)
        ax_hes.set_xticklabels(participant_codes)
        ax_hes.set_ylim(0, max(counts) * 1.4 if max(counts) > 0 else 5)
        ax_hes2.set_ylim(0, max(durs) * 1.4 if max(durs) > 0 else 5)
        ax_hes.yaxis.grid(True, linestyle='--', alpha=0.3)
        ax_hes.spines['top'].set_visible(False)
        ax_hes2.spines['top'].set_visible(False)
        
        lines, labels = ax_hes.get_legend_handles_labels()
        lines2, labels2 = ax_hes2.get_legend_handles_labels()
        ax_hes.legend(lines + lines2, labels + labels2, loc='upper left', frameon=True, facecolor='white', framealpha=0.9)
        
        for i, val in enumerate(counts):
            if pd.notna(val):
                ax_hes.text(i - width/2, val + 0.1, f"{int(val)}", ha='center', va='bottom', fontweight='bold', color='#2563EB')
        for i, val in enumerate(durs):
            if pd.notna(val):
                ax_hes2.text(i + width/2, val + 0.1, f"{val:.1f}s", ha='center', va='bottom', fontweight='bold', color='#F59E0B')
                
        # Subplot 4: Pinch Halts
        counts_h = [master_df[master_df['participant_code'] == p]['pinch_Overall_pinch_halts_count_median'].values[0] for p in participant_codes]
        durs_h = [master_df[master_df['participant_code'] == p]['pinch_Overall_pinch_halts_duration_ms_median'].values[0] / 1000.0 for p in participant_codes]
        
        ax_halt.bar(x - width/2, counts_h, width, label='Count', color='#0D9488', edgecolor='black', alpha=0.8)
        ax_halt2 = ax_halt.twinx()
        ax_halt2.bar(x + width/2, durs_h, width, label='Duration (s)', color='#EC4899', edgecolor='black', alpha=0.8)
        
        ax_halt.set_title("Pinch Halts (Complete Freezes)", fontsize=12, fontweight='bold', pad=10)
        ax_halt.set_ylabel("Halts Count", color='#0D9488', fontsize=11)
        ax_halt2.set_ylabel("Total Duration (seconds)", color='#EC4899', fontsize=11)
        ax_halt.set_xticks(x)
        ax_halt.set_xticklabels(participant_codes)
        ax_halt.set_ylim(0, max(counts_h) * 1.4 if max(counts_h) > 0 else 5)
        ax_halt2.set_ylim(0, max(durs_h) * 1.4 if max(durs_h) > 0 else 5)
        ax_halt.yaxis.grid(True, linestyle='--', alpha=0.3)
        ax_halt.spines['top'].set_visible(False)
        ax_halt2.spines['top'].set_visible(False)
        
        lines, labels = ax_halt.get_legend_handles_labels()
        lines2, labels2 = ax_halt2.get_legend_handles_labels()
        ax_halt.legend(lines + lines2, labels + labels2, loc='upper left', frameon=True, facecolor='white', framealpha=0.9)
        
        for i, val in enumerate(counts_h):
            if pd.notna(val):
                ax_halt.text(i - width/2, val + 0.1, f"{int(val)}", ha='center', va='bottom', fontweight='bold', color='#0D9488')
        for i, val in enumerate(durs_h):
            if pd.notna(val):
                ax_halt2.text(i + width/2, val + 0.1, f"{val:.1f}s", ha='center', va='bottom', fontweight='bold', color='#EC4899')
                
        # Subplot 5: Pinch Amplitude Decrement Slope (Pinch-by-Pinch Profile)
        if trials_df is not None and participants_df is not None and sessions_df is not None:
            from scipy.signal import find_peaks, savgol_filter
            main_session_ids = sessions_df[sessions_df['session_type'] == 'main']['id']
            pinch_trials = trials_df[(trials_df['task_type'] == 'pinch') & (trials_df['session_id'].isin(main_session_ids))]
            
            for idx, p_code in enumerate(participant_codes):
                p_ids = participants_df[participants_df['participant_code'] == p_code]['id'].values
                if len(p_ids) > 0:
                    p_id = p_ids[0]
                    p_trials = pinch_trials[pinch_trials['participant_id'] == p_id]
                    
                    all_indices = []
                    all_amplitudes_mm = []
                    
                    for _, trial_row in p_trials.iterrows():
                        traj_list = trial_row.get('trajectory', [])
                        if not isinstance(traj_list, list) or len(traj_list) < 2:
                            continue
                        
                        times_t = np.array([pt['t'] for pt in traj_list if 't' in pt])
                        dists_t = np.array([pt.get('distance', 0) for pt in traj_list if 't' in pt])
                        if len(dists_t) < 5:
                            continue
                        dists_smooth = savgol_filter(dists_t, 5, 2)
                        
                        # Find cycles
                        sig_range_t = np.max(dists_smooth) - np.min(dists_smooth)
                        prominence_t = max(10.0, 0.1 * sig_range_t) if sig_range_t > 0 else 10.0
                        
                        peaks_t, _ = find_peaks(dists_smooth, prominence=prominence_t, distance=10)
                        valleys_t, _ = find_peaks(-dists_smooth, prominence=prominence_t, distance=10)
                        
                        events_t = []
                        for p in peaks_t: events_t.append((times_t[p], 'peak', dists_smooth[p]))
                        for v in valleys_t: events_t.append((times_t[v], 'valley', dists_smooth[v]))
                        events_t.sort(key=lambda x: x[0])
                        
                        trial_amps = []
                        for i in range(len(events_t) - 1):
                            e_curr = events_t[i]
                            e_next = events_t[i+1]
                            if (e_curr[1] == 'peak' and e_next[1] == 'valley') or (e_curr[1] == 'valley' and e_next[1] == 'peak'):
                                trial_amps.append(abs(e_curr[2] - e_next[2]))
                                
                        for cycle_idx, amp_px in enumerate(trial_amps):
                            all_indices.append(cycle_idx)
                            all_amplitudes_mm.append(amp_px * (25.4 / 96.0))
                            
                    if all_indices:
                        color = colors[idx % len(colors)]
                        ax_trend.scatter(all_indices, all_amplitudes_mm, alpha=0.15, color=color, s=25, label=f"{p_code} Raw Pinches")
                        
                        # Fit linear regression
                        slope, intercept = np.polyfit(all_indices, all_amplitudes_mm, 1)
                        x_fit = np.unique(all_indices)
                        y_fit = slope * x_fit + intercept
                        ax_trend.plot(x_fit, y_fit, color=color, linewidth=2.5, label=f"{p_code} Trend (Slope: {slope:.3f} mm/pinch)")
                        
            ax_trend.set_title("Amplitude Decrement Profile (Pinch Fatigue)", fontsize=12, fontweight='bold', pad=10)
            ax_trend.set_xlabel("Pinch Cycle Index", fontsize=11)
            ax_trend.set_ylabel("Pinch Amplitude (mm)", fontsize=11)
            ax_trend.spines['top'].set_visible(False)
            ax_trend.spines['right'].set_visible(False)
            ax_trend.yaxis.grid(True, linestyle='--', alpha=0.3)
            ax_trend.xaxis.grid(True, linestyle='--', alpha=0.3)
            ax_trend.legend(loc='lower left', frameon=True, facecolor='white', framealpha=0.9)
        else:
            ax_trend.text(0.5, 0.5, "Raw trials data missing - cannot plot decrement slope", ha='center', va='center')
            
        # Subplot 6: MDS-UPDRS Estimated Impairment Grade
        if 'pinch_Overall_pinch_clinical_impairment_grade_median' in master_df.columns:
            grades = [master_df[master_df['participant_code'] == p]['pinch_Overall_pinch_clinical_impairment_grade_median'].values[0] for p in participant_codes]
        else:
            grades = [0.0] * n_participants
            
        ax_grade.bar(x, grades, width, color='#EC4899', edgecolor='black', alpha=0.8)
        ax_grade.set_title("Estimated Clinical Severity\n(MDS-UPDRS Item 3.4 Pinch Variant)", fontsize=10, fontweight='bold', pad=10)
        ax_grade.set_ylabel("Estimated Severity Grade (0-4)", fontsize=11)
        ax_grade.set_xticks(x)
        ax_grade.set_xticklabels(participant_codes)
        ax_grade.set_ylim(0, 4.5)
        ax_grade.yaxis.grid(True, linestyle='--', alpha=0.3)
        ax_grade.spines['top'].set_visible(False)
        ax_grade.spines['right'].set_visible(False)
        for i, val in enumerate(grades):
            if pd.notna(val):
                ax_grade.text(i, val + 0.1, f"Grade {val:.1f}", ha='center', va='bottom', fontweight='bold', color='#EC4899')
                
        plt.subplots_adjust(hspace=0.4, wspace=0.3)
        if save_dir is not None:
            plt.savefig(os.path.join(save_dir, "pinch_task_dashboard.png"), dpi=300, bbox_inches='tight')
            plt.close()
        else:
            plt.show()


@normalize_participant_codes
def plot_known_groups_validity_boxplots(
    trials_df=None,
    participants_df=None,
    csv_dir=None,
    supabase_url=None,
    supabase_key=None,
    save_path=None
):
    """
    Generates known-groups validity boxplots comparing the two participants (P01 vs P02)
    in the pilot study across trial-level tapping metrics: Speed, Amplitude, Hesitations,
    Halts, and Amplitude Decrement.
    """
    import pandas as pd
    import numpy as np
    import seaborn as sns
    import matplotlib.pyplot as plt
    import os
    import json
    import clinical_metrics
    
    tdf, sdf, pdf = resolve_data(
        trials_df=trials_df,
        participants_df=participants_df,
        csv_dir=csv_dir,
        supabase_url=supabase_url,
        supabase_key=supabase_key
    )
    
    # Map participant ID to code and diagnosis
    p_map = pdf.set_index('id')[['participant_code', 'participant_group']].rename(columns={'participant_group': 'diagnosis'}).to_dict('index')
    
    # Filter to tapping trials
    tap_trials = tdf[tdf['task_type'] == 'tap'].copy()
    if tap_trials.empty:
        print("No tap trials found in the dataset.")
        return
        
    # Extract trial-level features
    trial_features = tap_trials.apply(clinical_metrics.extract_features_from_trial, axis=1)
    trial_features['participant_code'] = tap_trials['participant_id'].map(lambda x: p_map.get(x, {}).get('participant_code', 'Unknown'))
    trial_features['diagnosis'] = tap_trials['participant_id'].map(lambda x: p_map.get(x, {}).get('diagnosis', 'Unknown'))
    
    # Standardize diagnosis strings
    trial_features['diagnosis'] = trial_features['diagnosis'].replace({
        'caregiver': 'Healthy Control', 'Caregiver': 'Healthy Control',
        'other': 'Healthy Control', 'Other': 'Healthy Control',
        'control': 'Healthy Control', 'Control': 'Healthy Control',
        'parkinsons': "Parkinson's", 'Parkinsons': "Parkinson's"
    })
    
    # Sort by participant code to ensure consistent plotting order
    trial_features = trial_features.sort_values(by='participant_code')
    
    # Metrics to compare
    metrics = [
        ('tap_frequency', 'Speed (Frequency in Hz)', 'Speed (Hz)', 'Higher is faster'),
        ('median_amplitude_mm', 'Tapping Amplitude (mm)', 'Median Amplitude (mm)', 'Lower is more precise (less spatial drift)'),
        ('hesitations_count', 'Hesitations Count', 'Count', 'Lower is more stable'),
        ('halts_count', 'Halts (Freezes) Count', 'Count', 'Lower is healthier'),
        ('amplitude_decrement_ratio', 'Amplitude Decrement Ratio', 'Ratio (Last 3 / First 3)', 'Near 1.0 is stable, lower shows fatiguing')
    ]
    
    fig, axes = plt.subplots(2, 3, figsize=(16, 10))
    axes = axes.flatten()
    
    # Participant mapping for coloring and labeling
    colors = ['#3B82F6', '#EF4444'] # Blue vs Red
    
    for i, (col, title, ylabel, desc) in enumerate(metrics):
        ax = axes[i]
        
        # Check if the column is present
        if col not in trial_features.columns:
            ax.text(0.5, 0.5, f"Metric {col} not found", ha='center', va='center')
            continue
            
        # Plot Boxplot
        sns.boxplot(
            x='participant_code', 
            y=col, 
            data=trial_features, 
            ax=ax, 
            palette=colors, 
            width=0.4, 
            showfliers=False,
            boxprops=dict(alpha=0.7, edgecolor='black', linewidth=1.5),
            whiskerprops=dict(linewidth=1.5),
            capprops=dict(linewidth=1.5),
            medianprops=dict(color='black', linewidth=2)
        )
        
        # Overlay trial points
        sns.stripplot(
            x='participant_code', 
            y=col, 
            data=trial_features, 
            ax=ax, 
            color='#1F2937', 
            size=8, 
            jitter=0.08, 
            alpha=0.9, 
            linewidth=1, 
            edgecolor='white'
        )
        
        ax.set_title(title, fontsize=12, fontweight='bold', pad=10)
        ax.set_xlabel('Participant Code', fontsize=10)
        ax.set_ylabel(ylabel, fontsize=10)
        ax.yaxis.grid(True, linestyle='--', alpha=0.3)
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        
        # Add descriptive helper subtitle/text inside axis
        ax.text(0.5, 0.95, desc, transform=ax.transAxes, fontsize=9, style='italic', ha='center', color='#555')
        
    # Subplot 6: Text summary box
    ax_text = axes[5]
    ax_text.axis('off')
    
    summary_lines = [
        "Known-Groups Pilot Comparison Summary\n",
        "Participant Codes: P1 vs P2",
        "(Both diagnosed with Parkinson's Disease)\n",
        "Key Differences observed across trials:",
        "----------------------------------------"
    ]
    
    for col, title, _, _ in metrics:
        if col in trial_features.columns:
            medians = trial_features.groupby('participant_code')[col].median()
            val_p01 = medians.get('P1', medians.get('P01', np.nan))
            val_p02 = medians.get('P2', medians.get('P02', np.nan))
            summary_lines.append(f"• {title}:")
            summary_lines.append(f"  - P1 Median: {val_p01:.3f}")
            summary_lines.append(f"  - P2 Median: {val_p02:.3f}")
            
    summary_text = "\n".join(summary_lines)
    ax_text.text(0.05, 0.95, summary_text, transform=ax_text.transAxes, fontsize=9.5,
                 verticalalignment='top', bbox=dict(boxstyle='round,pad=0.8', facecolor='#F3F4F6', edgecolor='#E5E7EB'))
                 
    plt.suptitle("Known-Groups Validity Tapping Metrics: Pilot Study P1 vs P2", fontsize=15, fontweight='bold', y=0.96)
    plt.subplots_adjust(hspace=0.35, wspace=0.3)
    
    if save_path is not None:
        dir_name = os.path.dirname(save_path)
        if dir_name:
            os.makedirs(dir_name, exist_ok=True)
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"Saved validity comparison plot to: {save_path}")
    else:
        plt.show()


@normalize_participant_codes
def plot_drag_variability_analysis(
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
    Computes and plots trial-to-trial trajectory variability (pairwise distance between trials),
    start point spatial variability, and endpoint spatial variability for P01 and P02.
    """
    import json
    import numpy as np
    import pandas as pd
    import matplotlib.pyplot as plt
    import seaborn as sns
    from IPython.display import display
    
    tdf, sdf, pdf = resolve_data(
        trials_df=trials_df,
        sessions_df=sessions_df,
        participants_df=participants_df,
        csv_dir=csv_dir,
        supabase_url=supabase_url,
        supabase_key=supabase_key
    )
    
    if participant_codes is None:
        participant_codes = ['P1', 'P2']
        
    if session_type and sdf is not None:
        main_session_ids = sdf[sdf['session_type'] == session_type]['id']
        main_trials = tdf[tdf['session_id'].isin(main_session_ids)]
    else:
        main_trials = tdf

    summary_data = []
    pairwise_records = []
    
    for p_code in participant_codes:
        p_rows = pdf[pdf['participant_code'] == p_code]
        if p_rows.empty:
            continue
        p_id = p_rows['id'].values[0]
        
        p_trials = main_trials[
            (main_trials['participant_id'] == p_id) & 
            (main_trials['task_type'] == 'drag')
        ].copy()
        
        standard_paths = []
        start_points = []
        end_points = []
        
        for idx, row in p_trials.iterrows():
            traj = row['trajectory']
            if isinstance(traj, str):
                traj = json.loads(traj)
            if not traj or not isinstance(traj, list):
                continue
                
            coords = np.array([[pt['x'], pt['y']] for pt in traj if 'x' in pt])
            if len(coords) < 3:
                continue
                
            start_pt = coords[0]
            end_pt = coords[-1]
            start_points.append(start_pt)
            end_points.append(end_pt)
            
            # Calculate cumulative distance along path for interpolation
            diffs = np.diff(coords, axis=0)
            segment_lengths = np.linalg.norm(diffs, axis=1)
            cum_dist = np.insert(np.cumsum(segment_lengths), 0, 0.0)
            
            if cum_dist[-1] > 0:
                norm_dist = cum_dist / cum_dist[-1]
                target_s = np.linspace(0, 1, 100)
                xs = np.interp(target_s, norm_dist, coords[:, 0])
                ys = np.interp(target_s, norm_dist, coords[:, 1])
                standard_paths.append(np.column_stack((xs, ys)))
                
        start_points = np.array(start_points)
        end_points = np.array(end_points)
        
        # Calculate start point spatial SD
        start_var = np.nan
        if len(start_points) > 1:
            start_centroid = np.mean(start_points, axis=0)
            start_var = np.std(np.linalg.norm(start_points - start_centroid, axis=1))
            
        # Calculate endpoint spatial SD
        end_var = np.nan
        if len(end_points) > 1:
            end_centroid = np.mean(end_points, axis=0)
            end_var = np.std(np.linalg.norm(end_points - end_centroid, axis=1))
            
        # Calculate pairwise trajectory distances
        n_paths = len(standard_paths)
        p_dists = []
        for i in range(n_paths):
            for j in range(i + 1, n_paths):
                p_a = standard_paths[i]
                p_b = standard_paths[j]
                avg_dist = np.mean(np.linalg.norm(p_a - p_b, axis=1))
                p_dists.append(avg_dist)
                pairwise_records.append({
                    'participant_code': p_code,
                    'pairwise_distance': avg_dist
                })
                
        p_dists = np.array(p_dists) if len(p_dists) > 0 else np.array([])
        
        median_traj_var = np.median(p_dists) if len(p_dists) > 0 else np.nan
        q75, q25 = np.percentile(p_dists, [75, 25]) if len(p_dists) > 0 else (np.nan, np.nan)
        iqr_traj_var = q75 - q25 if pd.notna(q75) else np.nan
        
        summary_data.append({
            'Participant': p_code,
            'Median Trajectory Variability (px)': median_traj_var,
            'IQR Trajectory Variability (px)': iqr_traj_var,
            'Start Point Variability (px)': start_var,
            'Endpoint Variability (px)': end_var,
            'Trials Count': len(p_trials)
        })
        
    summary_df = pd.DataFrame(summary_data).set_index('Participant')
    print("=== Drag Task Trial-to-Trial Variability Summary ===")
    display(summary_df)
    
    # Single Plot: Pairwise Trajectory Distance (Inter-trial variability)
    pairwise_df = pd.DataFrame(pairwise_records)
    
    fig, ax = plt.subplots(1, 1, figsize=(6, 5))
    colors = ['#3B82F6', '#EA580C']
    
    sns.boxplot(
        x='participant_code',
        y='pairwise_distance',
        data=pairwise_df,
        ax=ax,
        palette=colors,
        hue='participant_code',
        legend=False,
        width=0.4,
        showfliers=False,
        boxprops=dict(alpha=0.85, edgecolor='black', linewidth=1.5),
        whiskerprops=dict(color='black', linewidth=1.5),
        capprops=dict(color='black', linewidth=1.5),
        medianprops=dict(color='black', linewidth=2.0)
    )
    sns.stripplot(
        x='participant_code',
        y='pairwise_distance',
        data=pairwise_df,
        color='black',
        size=6,
        alpha=0.6,
        jitter=0.1,
        ax=ax
    )
    ax.set_title("Trial-to-Trial Trajectory Variability", fontsize=12, fontweight='bold', pad=12)
    ax.set_xlabel("Participant", fontsize=11)
    ax.set_ylabel("Pairwise Path Distance (px)", fontsize=11)
    ax.yaxis.grid(True, linestyle='--', alpha=0.3)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    plt.tight_layout()
    plt.show()
