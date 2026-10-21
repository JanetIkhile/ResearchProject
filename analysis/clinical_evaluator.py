import os
import json
import numpy as np
import pandas as pd
from scipy.stats import spearmanr, pearsonr, kruskal, mannwhitneyu, rankdata
from statsmodels.stats.multitest import multipletests

# Primary Registry (Focused Core Clinical Measures)
PRIMARY_REGISTRY = {
    'bradykinesia': [
        {
            'col': 'drag_mean_speed',
            'display_name': 'Drag Mean Speed (px/s)'
        },
        {
            'col': 'tap_tap_frequency',
            'display_name': 'Tap Frequency (Hz)'
        },
        {
            'col': 'pinch_pinch_mean_opening_speed_mm_s',
            'display_name': 'Pinch Mean Opening Speed (mm/s)'
        }
    ],
    'hypokinesia': [
        {
            'col': 'pinch_pinch_median_opening_distance_px',
            'display_name': 'Pinch Median Opening Distance (px)'
        },
        {
            'col': 'drag_drag_terminal_undershoot_px',
            'display_name': 'Drag Terminal Undershoot (px)'
        }
    ],
    'sequence_effect': [
        {
            'col': 'drag_across_trial_speed_slope',
            'display_name': 'Drag Speed Slope'
        },
        {
            'col': 'tap_tap_frequency_slope',
            'display_name': 'Tap Frequency Slope (Hz/tap)'
        },
        {
            'col': 'pinch_pinch_opening_distance_slope_mm',
            'display_name': 'Pinch Opening Distance Slope (mm/cycle)'
        }
    ],
    'hesitations_halts': [
        {
            'col': 'drag_pause_count',
            'display_name': 'Drag Pause Count'
        },
        {
            'col': 'tap_pause_count',
            'display_name': 'Tap Pause Count'
        },
        {
            'col': 'pinch_longest_pause_duration_ms',
            'display_name': 'Pinch Longest Pause Duration (ms)'
        }
    ],
    'postural_tremor': [
        {
            'col': 'hold_hold_tremor_amplitude',
            'display_name': 'Hold Tremor Amplitude (px)'
        },
        {
            'col': 'hold_hold_tremor_power',
            'display_name': 'Hold Tremor Power'
        }
    ],
    'kinetic_tremor': [
        {
            'col': 'drag_drag_tremor_amplitude_peak_px',
            'display_name': 'Drag Peak Tremor Amplitude (px)'
        }
    ]
}

# Full Exploratory Registry (Comprehensive Candidate Evaluation)
REGISTRY = {
    'bradykinesia': [
        {'col': 'tap_tap_frequency', 'display_name': 'Tap Frequency (Hz)'},
        {'col': 'tap_mean_intertap_interval_ms', 'display_name': 'Mean Intertap Interval (ms)'},
        {'col': 'drag_mean_speed', 'display_name': 'Drag Mean Speed (px/s)'},
        {'col': 'drag_median_speed', 'display_name': 'Drag Median Speed (px/s)'},
        {'col': 'drag_peak_speed_ms', 'display_name': 'Drag Peak Speed (px/s)'},
        {'col': 'drag_movement_time_ms', 'display_name': 'Drag Movement Time (ms)'},
        {'col': 'pinch_pinch_frequency', 'display_name': 'Pinch Cycle Frequency (Hz)'},
        {'col': 'pinch_mean_pinch_interval_ms', 'display_name': 'Mean Pinch Interval (ms)'},
        {'col': 'pinch_pinch_mean_opening_speed_mm_s', 'display_name': 'Pinch Mean Opening Speed (mm/s)'},
        {'col': 'pinch_pinch_median_opening_speed_mm_s', 'display_name': 'Pinch Median Opening Speed (mm/s)'},
        {'col': 'pinch_pinch_max_opening_velocity_mm_s', 'display_name': 'Pinch Peak Opening Speed (mm/s)'}
    ],
    'hypokinesia': [
        {'col': 'drag_drag_terminal_undershoot_px', 'display_name': 'Drag Terminal Undershoot (px)'},
        {'col': 'drag_straight_line_distance', 'display_name': 'Drag Movement Amplitude (px)'},
        {'col': 'drag_endpoint_abs_deviation_error', 'display_name': 'Drag Signed Target Deviation (px)'},
        {'col': 'drag_undershoot_proportion', 'display_name': 'Drag Undershoot Proportion'},
        {'col': 'pinch_pinch_max_opening_distance_px', 'display_name': 'Pinch Max Opening Distance (px)'},
        {'col': 'pinch_pinch_median_opening_distance_px', 'display_name': 'Pinch Median Opening Distance (px)'},
        {'col': 'pinch_pinch_mean_opening_distance_px', 'display_name': 'Pinch Mean Opening Distance (px)'}
    ],
    'sequence_effect': [
        {'col': 'tap_tap_interval_decrement_ratio', 'display_name': 'Tap Interval Decrement Ratio'},
        {'col': 'tap_tap_frequency_decrement_ratio', 'display_name': 'Tap Frequency Decrement Ratio'},
        {'col': 'tap_tap_interval_slope', 'display_name': 'Tap Interval Slope (ms/tap)'},
        {'col': 'tap_tap_frequency_slope', 'display_name': 'Tap Frequency Slope (Hz/tap)'},
        {'col': 'drag_across_trial_speed_decrement_ratio', 'display_name': 'Drag Speed Decrement Ratio'},
        {'col': 'drag_across_trial_speed_slope', 'display_name': 'Drag Speed Slope'},
        {'col': 'drag_across_trial_amplitude_decrement_ratio', 'display_name': 'Drag Amplitude Decrement Ratio'},
        {'col': 'drag_across_trial_amplitude_slope', 'display_name': 'Drag Amplitude Slope'},
        {'col': 'drag_across_trial_duration_slope', 'display_name': 'Drag Duration Slope'},
        {'col': 'pinch_pinch_opening_distance_decrement_ratio', 'display_name': 'Pinch Opening Distance Decrement Ratio'},
        {'col': 'pinch_pinch_opening_distance_slope_mm', 'display_name': 'Pinch Opening Distance Slope (mm/cycle)'},
        {'col': 'pinch_pinch_speed_decrement_ratio', 'display_name': 'Pinch Cycle Duration Decrement Ratio'},
        {'col': 'pinch_pinch_cycle_speed_decrement_ratio', 'display_name': 'Pinch Cycle Speed Decrement Ratio'},
        {'col': 'pinch_pinch_speed_slope', 'display_name': 'Pinch Cycle Duration Slope (ms/cycle)'},
        {'col': 'pinch_pinch_cycle_speed_slope', 'display_name': 'Pinch Cycle Speed Slope (Hz/cycle)'}
    ],
    'hesitations_halts': [
        {'col': 'drag_pause_count', 'display_name': 'Drag Pause Count'},
        {'col': 'drag_longest_pause_duration_ms', 'display_name': 'Drag Longest Pause Duration (ms)'},
        {'col': 'tap_pause_count', 'display_name': 'Tap Pause Count'},
        {'col': 'tap_pause_ratio', 'display_name': 'Tap Pause Ratio (Normalized)'},
        {'col': 'tap_longest_pause_duration_ms', 'display_name': 'Tap Longest Pause Duration (ms)'},
        {'col': 'pinch_pause_count', 'display_name': 'Pinch Pause Count'},
        {'col': 'pinch_pause_ratio', 'display_name': 'Pinch Pause Ratio (Normalized)'},
        {'col': 'pinch_longest_pause_duration_ms', 'display_name': 'Pinch Longest Pause Duration (ms)'},
        {'col': 'pinch_amplitude_disruption_count', 'display_name': 'Pinch Amplitude Disruption Count'}
    ],
    'akinesia': [
        {'col': 'tap_initiation_delay', 'display_name': 'Tap Initiation Delay (ms)'},
        {'col': 'drag_initiation_delay', 'display_name': 'Drag Initiation Delay (ms)'},
        {'col': 'pinch_initiation_delay', 'display_name': 'Pinch Initiation Delay (ms)'},
        {'col': 'hold_initiation_delay', 'display_name': 'Hold Initiation Delay (ms)'},
        {'col': 'hold_release_delay_ms', 'display_name': 'Hold Release Delay (ms)'}
    ],
    'postural_tremor': [
        {'col': 'hold_hold_tremor_amplitude_peak_px', 'display_name': 'Hold Peak Tremor Amplitude (px)'},
        {'col': 'hold_hold_tremor_power', 'display_name': 'Hold Tremor Power'},
        {'col': 'hold_hold_tremor_amplitude', 'display_name': 'Hold Tremor Amplitude (px)'},
        {'col': 'hold_hold_spatial_sd', 'display_name': 'Hold Spatial Spread (px)'}
    ],
    'kinetic_tremor': [
        {'col': 'drag_drag_tremor_amplitude_peak_px', 'display_name': 'Drag Peak Tremor Amplitude (px)'},
        {'col': 'drag_kinetic_tremor_power', 'display_name': 'Drag Tremor Power'},
        {'col': 'drag_kinetic_tremor_amplitude', 'display_name': 'Drag Tremor Amplitude (px)'},
        {'col': 'drag_path_efficiency', 'display_name': 'Drag Path Efficiency'}
    ]
}





def compute_bootstrap_ci(x, y, method='spearman', n_boot=1000, alpha=0.05, random_state=42):
    """
    Computes two-sided (1 - alpha)% percentile bootstrap confidence interval for correlation.
    """
    x = np.asarray(x, dtype=float)
    y = np.asarray(y, dtype=float)
    mask = np.isfinite(x) & np.isfinite(y)
    x, y = x[mask], y[mask]
    n = len(x)
    if n < 4:
        return np.nan, np.nan
        
    rng = np.random.default_rng(random_state)
    idx_matrix = rng.choice(n, size=(n_boot, n), replace=True)
    boot_stats = []
    
    if method == 'spearman':
        for row in idx_matrix:
            xi = x[row]
            yi = y[row]
            if len(np.unique(xi)) > 1 and len(np.unique(yi)) > 1:
                rx = rankdata(xi)
                ry = rankdata(yi)
                dx = rx - rx.mean()
                dy = ry - ry.mean()
                denom = np.sqrt(np.sum(dx**2) * np.sum(dy**2))
                if denom > 0:
                    val = np.sum(dx * dy) / denom
                    if np.isfinite(val):
                        boot_stats.append(val)
    else:
        for row in idx_matrix:
            xi = x[row]
            yi = y[row]
            if len(np.unique(xi)) > 1 and len(np.unique(yi)) > 1:
                dx = xi - xi.mean()
                dy = yi - yi.mean()
                denom = np.sqrt(np.sum(dx**2) * np.sum(dy**2))
                if denom > 0:
                    val = np.sum(dx * dy) / denom
                    if np.isfinite(val):
                        boot_stats.append(val)
                        
    if len(boot_stats) < 100:
        return np.nan, np.nan
        
    low = np.percentile(boot_stats, 100 * (alpha / 2))
    high = np.percentile(boot_stats, 100 * (1 - alpha / 2))
    return float(low), float(high)

def calculate_icc_absolute(df, subject_col, trial_col, value_col, expected_k=None):
    """
    Computes ICC(A,1) [single trial] and ICC(A,k) [average of repeated trials]
    under the two-way mixed-effects / random-effects absolute agreement model.
    """
    sub_df = df[[subject_col, trial_col, value_col]].dropna().copy()
    sub_df[value_col] = pd.to_numeric(sub_df[value_col], errors='coerce')
    sub_df = sub_df.dropna()
    
    # Explicit check for duplicate observations before pivot
    dup_mask = sub_df.duplicated(subset=[subject_col, trial_col], keep=False)
    if dup_mask.any():
        sub_df = sub_df.drop_duplicates(subset=[subject_col, trial_col], keep='last')

    try:
        pivot_df = sub_df.pivot(index=subject_col, columns=trial_col, values=value_col).dropna()
    except Exception:
        return np.nan, np.nan

    # Validate that pivot dataframe contains the exact expected trial numbers 1..expected_k
    if expected_k is not None:
        expected_trials = set(range(1, expected_k + 1))
        actual_trials = set(pivot_df.columns)
        if actual_trials != expected_trials:
            return np.nan, np.nan

    try:
        data = pivot_df.values.astype(float)
    except Exception:
        return np.nan, np.nan
    n, k = data.shape
    if n < 2 or k < 2:
        return np.nan, np.nan

    grand_mean = np.mean(data)
    msb = np.sum((np.mean(data, axis=1) - grand_mean)**2) * k / (n - 1)
    msr = np.sum((np.mean(data, axis=0) - grand_mean)**2) * n / (k - 1)
    ssw = np.sum((data - np.mean(data, axis=1)[:, np.newaxis])**2)
    sse = ssw - (k - 1) * msr
    mse = sse / ((n - 1) * (k - 1))

    denom_a1 = msb + (k - 1) * mse + (k / n) * (msr - mse)
    icc_a1 = (msb - mse) / denom_a1 if (denom_a1 != 0 and not pd.isna(denom_a1)) else np.nan

    denom_ak = msb + (msr - mse) / n
    icc_ak = (msb - mse) / denom_ak if (denom_ak != 0 and not pd.isna(denom_ak)) else np.nan

    # Return raw unclipped estimates (no hard [-1.0, 1.0] clipping)
    return icc_a1, icc_ak

def evaluate_feature_reliability(trials_df, participants_df, sessions_df=None):
    """
    Computes trial-to-trial repeatability for single trial ICC(A,1) and mean of repeated trials ICC(A,k) 
    (ICC(A,10) for Drag, ICC(A,3) for Tap/Pinch/Hold) under two-way absolute agreement model.
    """
    from clinical_metrics import extract_features_from_trial

    if sessions_df is not None and not sessions_df.empty:
        main_mask = (sessions_df['session_type'] == 'main') if 'session_type' in sessions_df.columns else pd.Series(True, index=sessions_df.index)
        if 'completed' in sessions_df.columns:
            main_mask = main_mask & (sessions_df['completed'] == True)
        main_session_ids = sessions_df[main_mask]['id']
        trials_df = trials_df[trials_df['session_id'].isin(main_session_ids)]

    feature_df = trials_df.apply(extract_features_from_trial, axis=1)
    feature_df['participant_id'] = trials_df['participant_id']
    feature_df['task_type'] = trials_df['task_type']
    feature_df['trial_number'] = trials_df['trial_number']

    p_code_map = dict(zip(participants_df['id'], participants_df['participant_code'])) if 'participant_code' in participants_df.columns else {}
    p_group_map = dict(zip(participants_df['id'], participants_df['participant_group'])) if 'participant_group' in participants_df.columns else {}

    feature_df['participant_code'] = feature_df['participant_id'].map(p_code_map).fillna(feature_df['participant_id'])
    feature_df['participant_group'] = feature_df['participant_id'].map(p_group_map).fillna('unknown')

    # Partition into PD and Normative cohorts using participant_group ('parkinsons' vs 'caregiver'/'other')
    pd_mask = feature_df['participant_group'].astype(str).str.lower().isin(['parkinsons', 'pd'])
    pd_feature_df = feature_df[pd_mask].copy()
    ctrl_feature_df = feature_df[~pd_mask].copy()

    pd_dict = {}
    ctrl_dict = {}
    raw_feature_cols = [c for c in feature_df.columns if c not in ['participant_id', 'participant_code', 'task_type', 'trial_number', 'id']]
    
    for task in ['tap', 'drag', 'pinch', 'hold']:
        pd_task_df = pd_feature_df[pd_feature_df['task_type'] == task]
        ctrl_task_df = ctrl_feature_df[ctrl_feature_df['task_type'] == task]
        expected_k_val = 10 if task == 'drag' else 3
        
        for col in raw_feature_cols:
            if col in pd_feature_df.columns and pd_feature_df[col].notna().sum() > 0:
                prefixed_name = f"{task}_{col}"
                pd_a1, pd_ak = calculate_icc_absolute(pd_task_df, 'participant_code', 'trial_number', col, expected_k=expected_k_val) if not pd_task_df.empty else (np.nan, np.nan)
                ctrl_a1, ctrl_ak = calculate_icc_absolute(ctrl_task_df, 'participant_code', 'trial_number', col, expected_k=expected_k_val) if not ctrl_task_df.empty else (np.nan, np.nan)
                pd_dict[prefixed_name] = {'icc_a1': pd_a1, 'icc_ak': pd_ak}
                ctrl_dict[prefixed_name] = {'icc_a1': ctrl_a1, 'icc_ak': ctrl_ak}

    def get_grade(icc_val):
        if pd.isna(icc_val):
            return 'N/A'
        elif icc_val > 0.90:
            return 'Excellent (> 0.90)'
        elif icc_val >= 0.75:
            return 'Good (0.75–0.90)'
        elif icc_val >= 0.50:
            return 'Moderate (0.50–0.75)'
        else:
            return 'Poor (< 0.50)'

    rows = []
    for concept, features in REGISTRY.items():
        concept_domain = 'Tremor-Related' if concept in ['postural_tremor', 'kinetic_tremor'] else 'Bradykinesia-Related'
        motor_char = concept.replace('_', ' ').title()
        if motor_char == 'Hesitations Halts':
            motor_char = 'Hesitations & Halts'

        for feat in features:
            col_name = feat['col']
            disp_name = feat['display_name']
            
            pd_info = pd_dict.get(col_name, {'icc_a1': np.nan, 'icc_ak': np.nan})
            ctrl_info = ctrl_dict.get(col_name, {'icc_a1': np.nan, 'icc_ak': np.nan})
            
            task_short = col_name.split('_')[0].capitalize()
            k_val = 10 if task_short.lower() == 'drag' else 3

            rows.append({
                'Clinical Concept': concept_domain,
                'Motor Characteristic': motor_char,
                'Feature': disp_name,
                'Task': task_short,
                'PD ICC (A,1)': round(pd_info['icc_a1'], 3) if pd.notna(pd_info['icc_a1']) else np.nan,
                'PD Grade (A,1)': get_grade(pd_info['icc_a1']),
                f'PD ICC (A,{k_val})': round(pd_info['icc_ak'], 3) if pd.notna(pd_info['icc_ak']) else np.nan,
                f'PD Grade (A,{k_val})': get_grade(pd_info['icc_ak']),
                'Normative ICC (A,1)': round(ctrl_info['icc_a1'], 3) if pd.notna(ctrl_info['icc_a1']) else np.nan,
                'Normative Grade (A,1)': get_grade(ctrl_info['icc_a1']),
                f'Normative ICC (A,{k_val})': round(ctrl_info['icc_ak'], 3) if pd.notna(ctrl_info['icc_ak']) else np.nan,
                f'Normative Grade (A,{k_val})': get_grade(ctrl_info['icc_ak'])
            })

    res_df = pd.DataFrame(rows).sort_values(by=['PD ICC (A,1)'], ascending=False, na_position='last').reset_index(drop=True)
    return res_df

def analyze_feature_reliability(trials_df, participants_df, sessions_df=None):
    """
    Displays and returns the trial-to-trial repeatability (ICC A,1 and ICC A,k) reliability evaluation matrix.
    """
    from IPython.display import display
    rel_df = evaluate_feature_reliability(trials_df, participants_df, sessions_df=sessions_df)
    display(rel_df)
    return rel_df

EXPLORATORY_REGISTRY = REGISTRY

_FLAT_SUBJECT_CACHE = {}

def get_flat_subject_df(trials_df, participants_df, clinical_scores, sessions_df=None):
    """
    Computes and caches flat_subject_df (one row per participant, median across trials for each task).
    Caches result in memory to prevent expensive re-computation across multiple calls.
    """
    cache_key = (
        len(trials_df),
        len(participants_df),
        len(sessions_df) if sessions_df is not None and not sessions_df.empty else 0,
        tuple(sorted(clinical_scores.keys())) if isinstance(clinical_scores, dict) else 0
    )
    if cache_key in _FLAT_SUBJECT_CACHE:
        return _FLAT_SUBJECT_CACHE[cache_key].copy()

    from clinical_metrics import extract_features_from_trial

    # Filter trials for main session type if sessions_df is provided and not empty
    if sessions_df is not None and not sessions_df.empty:
        main_mask = (sessions_df['session_type'] == 'main') if 'session_type' in sessions_df.columns else pd.Series(True, index=sessions_df.index)
        if 'completed' in sessions_df.columns:
            main_mask = main_mask & (sessions_df['completed'] == True)
        main_session_ids = sessions_df[main_mask]['id']
        trials_df = trials_df[trials_df['session_id'].isin(main_session_ids)]

    feature_df = trials_df.apply(extract_features_from_trial, axis=1)
    feature_df['participant_id'] = trials_df['participant_id']
    feature_df['task_type'] = trials_df['task_type']
    feature_df['trial_number'] = trials_df['trial_number']

    # Map participant codes
    merged = feature_df.merge(participants_df[['id', 'participant_code']], left_on='participant_id', right_on='id')

    # 2. Pivot task features to a single flat row per participant (taking the median across trials)
    raw_feature_cols = [c for c in feature_df.columns if c not in ['participant_id', 'participant_code', 'task_type', 'trial_number', 'id', 'session_id']]
    subject_avg = merged.groupby(['participant_code', 'task_type']).median(numeric_only=True).reset_index()
    
    # Pivot tasks into columns
    flat_subject_df = pd.DataFrame({'participant_code': subject_avg['participant_code'].unique()})
    for task in ['tap', 'drag', 'pinch', 'hold']:
        task_df = subject_avg[subject_avg['task_type'] == task]
        if task_df.empty:
            continue
        rename_dict = {col: f"{task}_{col}" for col in raw_feature_cols if col in task_df.columns}
        task_piv = task_df[['participant_code'] + list(rename_dict.keys())].rename(columns=rename_dict)
        flat_subject_df = flat_subject_df.merge(task_piv, on='participant_code', how='left')

    # 2.3 Compute custom halt metrics (since median is not robust to intermittent halts)
    halt_metrics = []
    for participant in flat_subject_df['participant_code']:
        p_metrics = {'participant_code': participant, 'tap_min_halt_ratio': np.nan}
        for task in ['tap', 'drag', 'pinch']:
            if task == 'tap':
                count_col = 'halts_count'
                dur_col = 'halts_duration_ms'
            elif task == 'drag':
                count_col = 'drag_halts_count'
                dur_col = 'drag_halts_duration_ms'
            elif task == 'pinch':
                count_col = 'pinch_halts_count'
                dur_col = 'pinch_halts_duration_ms'
            else:
                continue

            p_trials = merged[(merged['participant_code'] == participant) & (merged['task_type'] == task)]
            if p_trials.empty or count_col not in p_trials.columns or dur_col not in p_trials.columns:
                p_metrics[f"{task}_total_halts_count"] = np.nan
                p_metrics[f"{task}_total_halts_duration_ms"] = np.nan
                p_metrics[f"{task}_mean_halt_duration_ms"] = np.nan
                continue

            counts = pd.to_numeric(p_trials[count_col], errors='coerce').dropna().values
            durations = pd.to_numeric(p_trials[dur_col], errors='coerce').dropna().values

            if len(counts) > 0 and len(durations) > 0:
                tot_count = np.sum(counts)
                tot_dur = np.sum(durations)
                mean_dur = tot_dur / tot_count if tot_count > 0 else 0.0
            else:
                tot_count = np.nan
                tot_dur = np.nan
                mean_dur = np.nan

            p_metrics[f"{task}_total_halts_count"] = tot_count
            p_metrics[f"{task}_total_halts_duration_ms"] = tot_dur
            p_metrics[f"{task}_mean_halt_duration_ms"] = mean_dur
            
            if task == 'tap' and 'tap_halt_ratio' in p_trials.columns:
                ratios = pd.to_numeric(p_trials['tap_halt_ratio'], errors='coerce').dropna().values
                p_metrics['tap_min_halt_ratio'] = np.min(ratios) if len(ratios) > 0 else np.nan

        halt_metrics.append(p_metrics)

    if halt_metrics:
        halt_df = pd.DataFrame(halt_metrics)
        flat_subject_df = flat_subject_df.merge(halt_df, on='participant_code', how='left')

    # Custom Hesitations/Halts Aggregation (Sum counts/durations, Max longest duration across all trials/attempts)
    for task in ['tap', 'pinch', 'drag']:
        if task == 'tap':
            count_key = 'hesitations_halts_count'
            duration_key = 'hesitations_halts_duration_ms'
            longest_key = 'longest_hesitation_halt_duration_ms'
        elif task == 'pinch':
            count_key = 'pinch_hesitations_halts_count'
            duration_key = 'pinch_hesitations_halts_duration_ms'
            longest_key = 'pinch_longest_hesitation_halt_duration_ms'
        elif task == 'drag':
            count_key = 'drag_hesitations_halts_count'
            duration_key = 'drag_hesitations_halts_duration_ms'
            longest_key = 'longest_hesitation_halt_duration'

        target_count = f"{task}_{count_key}"
        target_duration = f"{task}_{duration_key}"
        target_longest = f"{task}_{longest_key}"
        target_pause_count = f"{task}_pause_count"
        target_longest_pause = f"{task}_longest_pause_duration_ms"
        target_pause_ratio = f"{task}_pause_ratio"

        for participant in flat_subject_df['participant_code']:
            p_trials = merged[(merged['participant_code'] == participant) & (merged['task_type'] == task)]
            if not p_trials.empty:
                if count_key in p_trials.columns:
                    flat_subject_df.loc[
                        flat_subject_df['participant_code'] == participant,
                        target_count
                    ] = pd.to_numeric(p_trials[count_key], errors='coerce').sum()
                if duration_key in p_trials.columns:
                    flat_subject_df.loc[
                        flat_subject_df['participant_code'] == participant,
                        target_duration
                    ] = pd.to_numeric(p_trials[duration_key], errors='coerce').sum()
                if longest_key in p_trials.columns:
                    flat_subject_df.loc[
                        flat_subject_df['participant_code'] == participant,
                        target_longest
                    ] = pd.to_numeric(p_trials[longest_key], errors='coerce').max()
                if 'pause_count' in p_trials.columns:
                    flat_subject_df.loc[
                        flat_subject_df['participant_code'] == participant,
                        target_pause_count
                    ] = pd.to_numeric(p_trials['pause_count'], errors='coerce').sum()
                if 'longest_pause_duration_ms' in p_trials.columns:
                    flat_subject_df.loc[
                        flat_subject_df['participant_code'] == participant,
                        target_longest_pause
                    ] = pd.to_numeric(p_trials['longest_pause_duration_ms'], errors='coerce').max()
                if 'pause_ratio' in p_trials.columns:
                    interval_col = 'num_intertap_intervals' if task == 'tap' else ('num_cycle_intervals' if task == 'pinch' else None)
                    if interval_col and interval_col in p_trials.columns and pd.to_numeric(p_trials[interval_col], errors='coerce').sum() > 0:
                        pooled_ratio = float(pd.to_numeric(p_trials['pause_count'], errors='coerce').sum() / pd.to_numeric(p_trials[interval_col], errors='coerce').sum())
                    else:
                        pooled_ratio = float(pd.to_numeric(p_trials['pause_ratio'], errors='coerce').mean())
                    flat_subject_df.loc[
                        flat_subject_df['participant_code'] == participant,
                        target_pause_ratio
                    ] = pooled_ratio
                if task == 'pinch' and 'pinch_amplitude_disruption_count' in p_trials.columns:
                    flat_subject_df.loc[
                        flat_subject_df['participant_code'] == participant,
                        'pinch_amplitude_disruption_count'
                    ] = pd.to_numeric(p_trials['pinch_amplitude_disruption_count'], errors='coerce').sum()

    # 2.4 Compute Drag Undershoot Proportion
    undershoot_proportions = []
    for participant in flat_subject_df['participant_code']:
        p_drag = merged[(merged['participant_code'] == participant) & (merged['task_type'] == 'drag')]
        if not p_drag.empty and 'endpoint_abs_deviation_error' in p_drag.columns:
            errors = pd.to_numeric(p_drag['endpoint_abs_deviation_error'], errors='coerce').dropna().values
            prop = np.mean(errors < 0) if len(errors) > 0 else np.nan
        else:
            prop = np.nan
        undershoot_proportions.append({
            'participant_code': participant,
            'drag_undershoot_proportion': prop
        })
    undershoot_df = pd.DataFrame(undershoot_proportions)
    flat_subject_df = flat_subject_df.merge(undershoot_df, on='participant_code', how='left')

    # 2.5 Compute Across-Trial Drag sequence effect metrics
    drag_across_metrics = []
    for participant in flat_subject_df['participant_code']:
        p_drag = merged[(merged['participant_code'] == participant) & (merged['task_type'] == 'drag')].sort_values(by='trial_number')
        
        metrics = {'participant_code': participant}
        
        vectors = {
            'drag_across_trial_speed': p_drag['median_speed'].dropna().values,
            'drag_across_trial_amplitude': p_drag['drag_amplitude'].dropna().values,
            'drag_across_trial_deviation': p_drag['drag_median_deviation'].dropna().values,
            'drag_across_trial_duration': p_drag['movement_time_ms'].dropna().values,
            'drag_across_trial_within_speed_decay': p_drag['drag_speed_decrement_ratio'].dropna().values,
            'drag_across_trial_within_deviation_decay': p_drag['drag_deviation_decrement_ratio'].dropna().values,
            'drag_across_trial_hesitations': p_drag['drag_hesitations_count'].dropna().values
        }
        
        for prefix, v in vectors.items():
            if len(v) >= 6:
                first = np.median(v[:3])
                last = np.median(v[-3:])
                ratio = (last / first) if first > 0 else np.nan
                slope = np.polyfit(np.arange(len(v)), v, 1)[0]
            elif len(v) >= 2:
                first = v[0]
                last = v[-1]
                ratio = (last / first) if first > 0 else np.nan
                slope = np.polyfit(np.arange(len(v)), v, 1)[0]
            else:
                ratio = np.nan
                slope = np.nan
            
            metrics[f"{prefix}_decrement_ratio"] = ratio
            metrics[f"{prefix}_slope"] = slope
            
        drag_across_metrics.append(metrics)
        
    if drag_across_metrics:
        drag_across_df = pd.DataFrame(drag_across_metrics)
        flat_subject_df = flat_subject_df.merge(drag_across_df, on='participant_code', how='left')

    # Add participant_group and clinical scores
    if 'participant_group' in participants_df.columns:
        group_map = dict(zip(participants_df['participant_code'], participants_df['participant_group']))
        flat_subject_df['participant_group'] = flat_subject_df['participant_code'].map(group_map)

    scores_dict = clinical_scores if (clinical_scores and isinstance(clinical_scores, dict)) else {}
    flat_subject_df['MDS_UPDRS_total'] = flat_subject_df['participant_code'].map(lambda x: scores_dict.get(x, {}).get('MDS_UPDRS_total', np.nan))
    flat_subject_df['bradykinesia'] = flat_subject_df['participant_code'].map(lambda x: scores_dict.get(x, {}).get('bradykinesia', np.nan))
    flat_subject_df['tremor'] = flat_subject_df['participant_code'].map(lambda x: scores_dict.get(x, {}).get('tremor', np.nan))

    _FLAT_SUBJECT_CACHE[cache_key] = flat_subject_df.copy()
    return flat_subject_df

def evaluate_clinical_concepts(trials_df, participants_df, clinical_scores, sessions_df=None):
    """
    Executes the transparent clinical concept feature evaluation framework.
    Returns:
      - subject_metrics_df: Flat DataFrame with average feature values and clinical scores per participant
      - results_by_concept: Dict of DataFrames representing the candidate evaluation matrix per concept
    """
    flat_subject_df = get_flat_subject_df(trials_df, participants_df, clinical_scores, sessions_df=sessions_df)

    # 3. Perform Concept evaluation (no composite scores)
    results_by_concept = {}
    
    for concept, features in REGISTRY.items():
        is_tremor_concept = concept in ['postural_tremor', 'kinetic_tremor']
        clinical_col = 'tremor' if is_tremor_concept else 'bradykinesia'
        
        if flat_subject_df[clinical_col].isna().all():
            clinical_col = 'MDS_UPDRS_total'

        concept_rows = []
        for feat in features:
            col_name = feat['col']
            disp_name = feat['display_name']

            if col_name not in flat_subject_df.columns:
                continue

            feature_vals = flat_subject_df[col_name].values
            clinical_vals = flat_subject_df[clinical_col].values

            # Filter valid pairs
            mask = np.isfinite(feature_vals) & np.isfinite(clinical_vals)
            f_valid = feature_vals[mask]
            c_valid = clinical_vals[mask]

            # Correlation
            if len(f_valid) >= 3:
                sp_rho, sp_p = spearmanr(f_valid, c_valid)
                pe_r, pe_p = pearsonr(f_valid, c_valid)
                sp_ci_low, sp_ci_high = compute_bootstrap_ci(f_valid, c_valid, method='spearman')
                pe_ci_low, pe_ci_high = compute_bootstrap_ci(f_valid, c_valid, method='pearson')
                sp_ci_str = f"[{sp_ci_low:.2f}, {sp_ci_high:.2f}]" if np.isfinite(sp_ci_low) else "N/A"
                pe_ci_str = f"[{pe_ci_low:.2f}, {pe_ci_high:.2f}]" if np.isfinite(pe_ci_low) else "N/A"
            else:
                sp_rho, sp_p, sp_ci_str = np.nan, np.nan, "N/A"
                pe_r, pe_p, pe_ci_str = np.nan, np.nan, "N/A"

            # Sort by absolute Spearman correlation to help clinicians find top patterns
            sort_metric = abs(sp_rho) if pd.notna(sp_rho) else -1.0

            concept_rows.append({
                'Feature': col_name,
                'Display Name': disp_name,
                'Task': col_name.split('_')[0].capitalize(),
                'Clinical Domain': 'Tremor' if is_tremor_concept else 'Bradykinesia',
                'Clinical Score': 'Tremor Subscore' if is_tremor_concept else 'Bradykinesia Subscore',
                'Spearman rho': sp_rho,
                'Spearman 95% CI': sp_ci_str,
                'Spearman p (raw)': sp_p,
                'Pearson r': pe_r,
                'Pearson 95% CI': pe_ci_str,
                'Pearson p (raw)': pe_p,
                '_sort_key': sort_metric
            })
            
        if concept_rows:
            # Sort by sorting key (absolute correlation strength)
            concept_df = pd.DataFrame(concept_rows).sort_values(by='_sort_key', ascending=False).reset_index(drop=True)
            concept_df.drop(columns=['_sort_key'], inplace=True)
            
            # Apply Benjamini-Hochberg FDR correction across candidate features per concept
            valid_p_mask = concept_df['Spearman p (raw)'].notna()
            concept_df['Spearman p (FDR)'] = np.nan
            if valid_p_mask.sum() > 0:
                _, p_adj, _, _ = multipletests(concept_df.loc[valid_p_mask, 'Spearman p (raw)'], method='fdr_bh')
                concept_df.loc[valid_p_mask, 'Spearman p (FDR)'] = p_adj

            col_order = [
                'Feature', 'Display Name', 'Task', 'Clinical Domain', 'Clinical Score',
                'Spearman rho', 'Spearman 95% CI', 'Spearman p (raw)', 'Spearman p (FDR)',
                'Pearson r', 'Pearson 95% CI', 'Pearson p (raw)'
            ]
            concept_df = concept_df[[c for c in col_order if c in concept_df.columns]]
                
            results_by_concept[concept] = concept_df

    return flat_subject_df, results_by_concept

def generate_concept_report(trials_df, participants_df, clinical_scores, output_path, sessions_df=None):
    """
    Executes transparent evaluation and writes Stage 1 (Listing) and Stage 2 (Raw data tables) to a markdown report on disk.
    """
    flat_subject_df, results = evaluate_clinical_concepts(trials_df, participants_df, clinical_scores, sessions_df=sessions_df)

    md_content = []
    md_content.append("# Quantitative Clinical Concept Feature Evaluation Report")
    md_content.append("\nThis report aggregates digital motor features across the **Tapping, Drag, Pinch, and Hold** tasks, grouping them by clinical concepts to select the strongest candidate measures based on clinical scores.")
    
    md_content.append("\n## Clinical Cohort Profile")
    subtypes = flat_subject_df[['participant_code', 'MDS_UPDRS_total', 'bradykinesia', 'tremor']].dropna(subset=['MDS_UPDRS_total'])
    md_content.append("\n| Participant | MDS-UPDRS Total | Bradykinesia Subscore | Tremor Subscore |")
    md_content.append("| :--- | :---: | :---: | :---: |")
    for _, r in subtypes.iterrows():
        md_content.append(f"| **{r['participant_code']}** | {int(r['MDS_UPDRS_total'])} | {int(r['bradykinesia'])} | {int(r['tremor'])} |")

    md_content.append("\n---")
    
    # Stage 1: Clinical Concept Mapping Registry
    md_content.append("\n# Stage 1: Clinical Concept Mapping Registry")
    md_content.append("Below are the pre-defined clinical concepts and all candidate digital features mapped under each concept across the 4 tasks:")
    
    for concept, features in REGISTRY.items():
        concept_name = concept.replace('_', ' ').capitalize()
        md_content.append(f"\n* **{concept_name}**:")
        for feat in features:
            task_name = feat['col'].split('_')[0].capitalize()
            md_content.append(f"  * {feat['display_name']} ({task_name} Task)")

    md_content.append("\n---")

    # Stage 2: Transparent Statistical Matrices
    md_content.append("\n# Stage 2: Transparent Statistical Matrices")
    md_content.append("Below are the calculated raw statistical tables for each clinical concept. Metrics are sorted by the absolute strength of their correlation with the corresponding MDS-UPDRS subscore.")

    concept_explanations = {
        'bradykinesia': "Slowness of active voluntary movement execution (decay of velocity/frequency). Correlated with Bradykinesia Subscore.",
        'hypokinesia': "Reduction in spatial range of motion or target undershooting. Correlated with Bradykinesia Subscore.",
        'sequence_effect': "Progressive decay/decrement of speed or amplitude as movement repeats. Correlated with Bradykinesia Subscore.",
        'hesitations_halts': "Rhythm arhythmicity, pauses, freezes, or transient blocks in coordination. Correlated with Bradykinesia Subscore.",
        'akinesia': "Initiation lag or reaction delay to lift/start the motor sequence. Correlated with Bradykinesia Subscore.",
        'postural_tremor': "Involuntary rhythmic oscillations while holding posture statically on a target. Correlated with Tremor Subscore.",
        'kinetic_tremor': "Involuntary rhythmic oscillations transverse to active voluntary path trajectories. Correlated with Tremor Subscore."
    }

    for concept in REGISTRY.keys():
        concept_df = results.get(concept)
        concept_name = concept.replace('_', ' ').capitalize()
        
        md_content.append(f"\n## {concept_name}")
        md_content.append(f"*{concept_explanations[concept]}*")
        
        if concept_df is None or concept_df.empty:
            md_content.append("\nNo computed digital features available for this concept.")
            continue

        md_content.append("\n| Feature | Task | Clinical Domain | Correlated Score | Spearman $\\rho$ | 95% Bootstrap CI | Spearman $p$ (raw) | Spearman $p$ (FDR) | Pearson $r$ |")
        md_content.append("| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |")
        
        for _, row in concept_df.iterrows():
            rho_str = f"{row['Spearman rho']:.2f}" if pd.notna(row['Spearman rho']) else "N/A"
            sp_ci_str = row.get('Spearman 95% CI', 'N/A')
            raw_p_str = f"{row['Spearman p (raw)']:.3f}" if pd.notna(row['Spearman p (raw)']) else "N/A"
            fdr_str = f"{row['Spearman p (FDR)']:.3f}" if pd.notna(row['Spearman p (FDR)']) else "N/A"
            r_str = f"{row['Pearson r']:.2f}" if pd.notna(row['Pearson r']) else "N/A"
            dom_str = row.get('Clinical Domain', 'Tremor' if concept in ['postural_tremor', 'kinetic_tremor'] else 'Bradykinesia')
            score_str = row.get('Clinical Score', 'Tremor Subscore' if concept in ['postural_tremor', 'kinetic_tremor'] else 'Bradykinesia Subscore')
            
            md_content.append(f"| {row['Display Name']} | {row['Task']} | {dom_str} | {score_str} | {rho_str} | {sp_ci_str} | {raw_p_str} | {fdr_str} | {r_str} |")

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(md_content))
        
    print("Markdown report written successfully to:", output_path)
    return results


def plot_concept_highest_correlation_validation(concept_name, trials_df, participants_df, sessions_df, clinical_scores):
    import numpy as np
    import pandas as pd
    import seaborn as sns
    import matplotlib.pyplot as plt
    from scipy.stats import spearmanr

    concept_scores = {
        'bradykinesia': 'bradykinesia',
        'hypokinesia': 'bradykinesia',
        'sequence_effect': 'bradykinesia',
        'hesitations_halts': 'bradykinesia',
        'akinesia': 'bradykinesia',
        'postural_tremor': 'tremor',
        'kinetic_tremor': 'tremor'
    }

    concept_item_mapping = {
        'bradykinesia': ('hand_movements', 'Hand Movements (Item 3.4)'),
        'hypokinesia': ('hand_movements', 'Hand Movements (Item 3.4)'),
        'sequence_effect': ('hand_movements', 'Hand Movements (Item 3.4)'),
        'hesitations_halts': ('finger_tapping', 'Finger Tapping (Item 3.3)'),
        'akinesia': ('hand_movements', 'Hand Movements (Item 3.4)'),
        'postural_tremor': ('postural_tremor', 'Postural Tremor (Item 3.15)'),
        'kinetic_tremor': ('kinetic_tremor', 'Kinetic Tremor (Item 3.16)')
    }

    concept_display_names = {
        'bradykinesia': 'Bradykinesia',
        'hypokinesia': 'Hypokinesia',
        'sequence_effect': 'Sequence Effect',
        'hesitations_halts': 'Hesitations & Halts',
        'akinesia': 'Akinesia',
        'postural_tremor': 'Postural Tremor',
        'kinetic_tremor': 'Kinetic Tremor'
    }

    flat_subject_df = get_flat_subject_df(
        trials_df=trials_df,
        participants_df=participants_df,
        clinical_scores=clinical_scores,
        sessions_df=sessions_df
    )

    target_scores = ['MDS_UPDRS_total', 'bradykinesia', 'tremor', 'finger_tapping', 'hand_movements', 'postural_tremor', 'kinetic_tremor']
    for score in target_scores:
        flat_subject_df[score] = flat_subject_df['participant_code'].map(
            lambda x: clinical_scores.get(x, {}).get(score, np.nan)
        )

    features = PRIMARY_REGISTRY.get(concept_name, REGISTRY.get(concept_name, []))
    primary_score = concept_scores[concept_name]

    corrs = []
    for feat in features:
        col = feat['col']
        disp = feat['display_name']
        task = feat.get('task', '')
        if col in flat_subject_df.columns:
            f_vals = pd.to_numeric(flat_subject_df[col], errors='coerce').values
            s_vals = pd.to_numeric(flat_subject_df[primary_score], errors='coerce').values
            mask = np.isfinite(f_vals) & np.isfinite(s_vals)
            if mask.sum() >= 3:
                rho, p = spearmanr(f_vals[mask], s_vals[mask])
                corrs.append({
                    'col': col,
                    'display_name': disp,
                    'task': task,
                    'rho': rho,
                    'p': p,
                    'abs_rho': abs(rho) if pd.notna(rho) else -1
                })

    if not corrs:
        print(f'No valid candidate features found for concept {concept_name}')
        return

    corrs.sort(key=lambda x: x['abs_rho'], reverse=True)
    top_feat = corrs[0]
    col_name = top_feat['col']
    disp_name = top_feat['display_name']
    concept_title = concept_display_names[concept_name]

    # Dynamically determine task-specific clinical item
    task = top_feat.get('task', '')
    if task == 'tap':
        item_score, item_label = ('finger_tapping', 'Finger Tapping (Item 3.3)')
    elif concept_name == 'postural_tremor':
        item_score, item_label = ('postural_tremor', 'Postural Tremor (Item 3.15)')
    elif concept_name == 'kinetic_tremor':
        item_score, item_label = ('kinetic_tremor', 'Kinetic Tremor (Item 3.16)')
    else:
        item_score, item_label = ('hand_movements', 'Hand Movements (Item 3.4)')

    palette = {
        'P01': '#0D9488',
        'P02': '#C026D3',
        'P03': '#2563EB',
        'P04': '#7C3AED',
        'P05': '#D97706',
        'P06': '#0284C7',
        'P07': '#E11D48',
        'P08': '#059669',
        'P09': '#DC2626',
        'P11': '#4F46E5'
    }
    label_offsets = {
        'P01': (8, 6),
        'P02': (8, 6),
        'P03': (8, 6),
        'P04': (8, 6),
        'P05': (8, 6),
        'P06': (0, -16),
        'P07': (8, 6),
        'P08': (8, 6),
        'P09': (8, 6),
        'P11': (8, 6)
    }

    fig, axes = plt.subplots(1, 3, figsize=(18, 5.2))

    x_variables = [
        ('MDS_UPDRS_total', 'Overall Motor Exam (MDS-UPDRS Part III Total)'),
        (primary_score, f'Motor Domain ({primary_score.replace("_", " ").title()} Subscore)'),
        (item_score, f'Task-Specific Item ({item_label})')
    ]

    for col_idx, (x_col, x_label) in enumerate(x_variables):
        ax = axes[col_idx]
        plot_df = flat_subject_df[['participant_code', col_name, x_col]].dropna()
        plot_df[col_name] = pd.to_numeric(plot_df[col_name])
        plot_df[x_col] = pd.to_numeric(plot_df[x_col])

        if len(plot_df) >= 3:
            rho, p = spearmanr(plot_df[x_col], plot_df[col_name])
            sns.regplot(
                data=plot_df,
                x=x_col,
                y=col_name,
                ax=ax,
                ci=None,
                color='#1E293B',
                scatter_kws={'s': 0},
                line_kws={'color': '#64748B', 'linewidth': 2.0, 'linestyle': '--'}
            )
            for _, row in plot_df.iterrows():
                p_code = row['participant_code']
                color = palette.get(p_code, '#2563EB')
                offset = label_offsets.get(p_code, (8, 6))
                ax.scatter(row[x_col], row[col_name], color=color, s=140, edgecolors='black', linewidth=1.5, zorder=5)
                ax.annotate(
                    f"{p_code}",
                    (row[x_col], row[col_name]),
                    xytext=offset,
                    textcoords='offset points',
                    fontsize=11,
                    fontweight='bold',
                    color=color,
                    ha='center' if p_code == 'P06' and x_col in ['MDS_UPDRS_total', primary_score] else 'left'
                )

            title_str = f"{concept_title} Primary Feature: {disp_name}\nSpearman ρ = {rho:+.3f} (p = {p:.4f})"
            ax.set_title(title_str, fontsize=11, fontweight='bold', pad=12, color='#0F172A')

        ax.set_xlabel(x_label, fontsize=10, fontweight='semibold', labelpad=8)
        ax.set_ylabel(disp_name, fontsize=10, fontweight='semibold', labelpad=8)
        ax.xaxis.set_major_locator(plt.MaxNLocator(integer=True))
        ax.grid(True, linestyle='--', alpha=0.3)
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)

    plt.tight_layout()
    plt.show()

def evaluate_known_groups_validity(flat_subject_df):
    """
    Evaluates Known-Groups Validity (Parkinson's Disease vs. Healthy Controls).
    Answers: Can digital motor features statistically differentiate PD participants vs. Controls?
    
    Uses:
      - Non-parametric Mann-Whitney U test
      - Rank-biserial correlation effect size (r)
      - Benjamini-Hochberg FDR p-value correction across candidate features
    
    Returns:
      pd.DataFrame: Standalone summary matrix for Known-Groups Validity
    """
    if flat_subject_df is None or flat_subject_df.empty:
        return pd.DataFrame()

    # Determine PD vs Control assignment using participant_group ('parkinsons' vs 'other'/'caregiver')
    if 'participant_group' in flat_subject_df.columns and flat_subject_df['participant_group'].notna().any():
        pd_mask = flat_subject_df['participant_group'].astype(str).str.lower().str.contains('parkinson|pd', na=False)
        ctrl_mask = flat_subject_df['participant_group'].astype(str).str.lower().str.contains('control|caregiver|healthy|hc|other|normative', na=False)
    else:
        pd_mask = flat_subject_df['participant_code'].astype(str).str.startswith('P')
        ctrl_mask = flat_subject_df['participant_code'].astype(str).str.startswith('C')

    pd_sub = flat_subject_df[pd_mask]
    ctrl_sub = flat_subject_df[ctrl_mask]

    n_pd = len(pd_sub)
    n_ctrl = len(ctrl_sub)
    print(f"Known-Groups Cohort Size: {n_pd} PD participant(s), {n_ctrl} Control participant(s).")

    results = []

    for concept, features in REGISTRY.items():
        for feat in features:
            col_name = feat['col']
            disp_name = feat['display_name']

            if col_name not in flat_subject_df.columns:
                continue

            pd_vals = pd.to_numeric(pd_sub[col_name], errors='coerce').dropna().values
            ctrl_vals = pd.to_numeric(ctrl_sub[col_name], errors='coerce').dropna().values

            if len(pd_vals) == 0 and len(ctrl_vals) == 0:
                continue

            med_pd = np.median(pd_vals) if len(pd_vals) > 0 else np.nan
            iqr_pd = np.percentile(pd_vals, 75) - np.percentile(pd_vals, 25) if len(pd_vals) >= 2 else (0.0 if len(pd_vals) == 1 else np.nan)

            med_ctrl = np.median(ctrl_vals) if len(ctrl_vals) > 0 else np.nan
            iqr_ctrl = np.percentile(ctrl_vals, 75) - np.percentile(ctrl_vals, 25) if len(ctrl_vals) >= 2 else (0.0 if len(ctrl_vals) == 1 else np.nan)

            if len(pd_vals) >= 1 and len(ctrl_vals) >= 1:
                try:
                    mwu_res = mannwhitneyu(pd_vals, ctrl_vals, alternative='two-sided')
                    u_stat = mwu_res.statistic
                    p_val = mwu_res.pvalue
                    n1, n2 = len(pd_vals), len(ctrl_vals)
                    r_effect = 1.0 - (2.0 * u_stat / (n1 * n2)) if (n1 * n2) > 0 else np.nan
                except Exception:
                    u_stat, p_val, r_effect = np.nan, np.nan, np.nan
            else:
                u_stat, p_val, r_effect = np.nan, np.nan, np.nan

            pd_str = f"{med_pd:.2f} ({iqr_pd:.2f})" if pd.notna(med_pd) else "N/A"
            ctrl_str = f"{med_ctrl:.2f} ({iqr_ctrl:.2f})" if pd.notna(med_ctrl) else "N/A"

            concept_domain = 'Tremor-Related' if concept in ['postural_tremor', 'kinetic_tremor'] else 'Bradykinesia-Related'
            motor_char = concept.replace('_', ' ').title()
            if motor_char == 'Hesitations Halts':
                motor_char = 'Hesitations & Halts'

            results.append({
                'Clinical Concept': concept_domain,
                'Motor Characteristic': motor_char,
                'Feature': disp_name,
                'Task': col_name.split('_')[0].capitalize(),
                'PD Median (IQR)': pd_str,
                'Normative Median (IQR)': ctrl_str,
                'Mann-Whitney U': u_stat,
                'Rank-Biserial r': r_effect,
                'p-value (raw)': p_val
            })

    if not results:
        return pd.DataFrame()

    res_df = pd.DataFrame(results)

    valid_p_mask = res_df['p-value (raw)'].notna()
    res_df['p-value (FDR)'] = np.nan
    if valid_p_mask.sum() > 0:
        _, p_adj, _, _ = multipletests(res_df.loc[valid_p_mask, 'p-value (raw)'], method='fdr_bh')
        res_df.loc[valid_p_mask, 'p-value (FDR)'] = p_adj

    res_df = res_df.sort_values(by=['p-value (raw)', 'Rank-Biserial r'], ascending=[True, False], na_position='last').reset_index(drop=True)
    return res_df

# Mapping of clinically relevant target scores per clinical concept domain
CONCEPT_DOMAIN_TARGETS = {
    'bradykinesia': ['MDS_UPDRS_total', 'bradykinesia', 'finger_tapping', 'hand_movements'],
    'hypokinesia': ['MDS_UPDRS_total', 'bradykinesia', 'finger_tapping', 'hand_movements'],
    'sequence_effect': ['MDS_UPDRS_total', 'bradykinesia', 'finger_tapping', 'hand_movements'],
    'hesitations_halts': ['MDS_UPDRS_total', 'bradykinesia', 'finger_tapping', 'hand_movements'],
    'akinesia': ['MDS_UPDRS_total', 'bradykinesia', 'finger_tapping', 'hand_movements'],
    'postural_tremor': ['MDS_UPDRS_total', 'tremor', 'postural_tremor', 'rest_tremor'],
    'kinetic_tremor': ['MDS_UPDRS_total', 'tremor', 'kinetic_tremor']
}

def analyze_clinical_correlations(
    trials_df,
    participants_df,
    sessions_df,
    clinical_scores,
    concept='bradykinesia',
    target_scores=None
):
    """
    Dynamically computes clinical concept correlations for relevant domains only.
    - Bradykinesia concepts (bradykinesia, hypokinesia, sequence_effect, hesitations_halts, akinesia)
      are strictly correlated with bradykinesia domain scores (Total, Bradykinesia, Finger Tapping, Hand Movements).
      Tremor scores are excluded.
    - Tremor concepts (postural_tremor, kinetic_tremor) are strictly correlated with tremor domain scores
      (Total, Tremor, Postural Tremor / Kinetic Tremor). Bradykinesia scores are excluded.
    """
    from IPython.display import display

    # 1. Fetch precomputed/cached flat per-subject DataFrame
    flat_subject_df = get_flat_subject_df(
        trials_df=trials_df,
        participants_df=participants_df,
        clinical_scores=clinical_scores,
        sessions_df=sessions_df
    )

    # 2. Restrict to domain-relevant clinical scores
    allowed_scores = CONCEPT_DOMAIN_TARGETS.get(concept, ['MDS_UPDRS_total', 'bradykinesia'])
    if target_scores is not None:
        active_scores = [s for s in target_scores if s in allowed_scores]
        if not active_scores:
            active_scores = allowed_scores
    else:
        active_scores = allowed_scores

    # 3. Dynamically map relevant target subscores from clinical_scores input
    for score in active_scores:
        flat_subject_df[score] = flat_subject_df['participant_code'].map(
            lambda x: clinical_scores.get(x, {}).get(score, np.nan)
        )

    # Filter out controls - keep only PD participants who have clinical scores
    flat_subject_df = flat_subject_df[
        flat_subject_df['participant_code'].isin(clinical_scores.keys())
        if (clinical_scores and isinstance(clinical_scores, dict))
        else flat_subject_df['MDS_UPDRS_total'].notna()
    ].copy()

    # 4. Fetch candidate digital features for the selected clinical concept
    registry_features = REGISTRY.get(concept, [])
    if not registry_features:
        print(f"Error: Concept '{concept}' not found in registry.")
        return pd.DataFrame()

    domain_label = "Tremor Domain" if concept in ['postural_tremor', 'kinetic_tremor'] else "Bradykinesia Domain"
    print("=========================================================================")
    print(f"  DYNAMIC CLINICAL CORRELATION: {concept.upper()} ({domain_label})")
    print(f"  Relevant Target Scores: {', '.join(active_scores)}")
    print("=========================================================================")

    n_subj = len(flat_subject_df.dropna(subset=['MDS_UPDRS_total']))
    print(f"Cohort size: {len(flat_subject_df)} participant(s) mapped, {n_subj} with clinical scores.")

    # 5. Pre-compute statistics, bootstrap CIs, and FDR-adjusted p-values across candidate features per active score
    score_stats = {}
    for score in active_scores:
        rhos = []
        p_rhos = []
        cis_rho = []
        rs = []
        p_rs = []
        cis_r = []

        for feat in registry_features:
            col_name = feat['col']
            feat_vals = pd.to_numeric(flat_subject_df[col_name], errors='coerce').values
            score_vals = pd.to_numeric(flat_subject_df[score], errors='coerce').values
            mask = np.isfinite(feat_vals) & np.isfinite(score_vals)
            f_v = feat_vals[mask]
            s_v = score_vals[mask]

            if len(f_v) >= 3:
                rho, p_rho = spearmanr(f_v, s_v)
                r, p_r = pearsonr(f_v, s_v)
                ci_low_rho, ci_high_rho = compute_bootstrap_ci(f_v, s_v, method='spearman')
                ci_low_r, ci_high_r = compute_bootstrap_ci(f_v, s_v, method='pearson')

                rhos.append(rho)
                p_rhos.append(p_rho)
                cis_rho.append((ci_low_rho, ci_high_rho))
                rs.append(r)
                p_rs.append(p_r)
                cis_r.append((ci_low_r, ci_high_r))
            else:
                rhos.append(np.nan)
                p_rhos.append(np.nan)
                cis_rho.append((np.nan, np.nan))
                rs.append(np.nan)
                p_rs.append(np.nan)
                cis_r.append((np.nan, np.nan))

        # FDR correction across candidate features for this score
        valid_rho_mask = [pd.notna(p) for p in p_rhos]
        fdr_rhos = [np.nan] * len(p_rhos)
        if any(valid_rho_mask):
            valid_p = [p for p in p_rhos if pd.notna(p)]
            _, p_adj, _, _ = multipletests(valid_p, method='fdr_bh')
            adj_idx = 0
            for idx, is_valid in enumerate(valid_rho_mask):
                if is_valid:
                    fdr_rhos[idx] = p_adj[adj_idx]
                    adj_idx += 1

        valid_r_mask = [pd.notna(p) for p in p_rs]
        fdr_rs = [np.nan] * len(p_rs)
        if any(valid_r_mask):
            valid_p_r = [p for p in p_rs if pd.notna(p)]
            _, p_adj_r, _, _ = multipletests(valid_p_r, method='fdr_bh')
            adj_idx = 0
            for idx, is_valid in enumerate(valid_r_mask):
                if is_valid:
                    fdr_rs[idx] = p_adj_r[adj_idx]
                    adj_idx += 1

        score_stats[score] = {
            'rho': rhos,
            'p_rho': p_rhos,
            'ci_rho': cis_rho,
            'fdr_rho': fdr_rhos,
            'r': rs,
            'p_r': p_rs,
            'ci_r': cis_r,
            'fdr_r': fdr_rs
        }

    rows = []
    for i, feat in enumerate(registry_features):
        col_name = feat['col']
        disp_name = feat['display_name']
        task_name = col_name.split('_')[0].capitalize()

        row_dict = {
            'Feature': disp_name,
            'Task': task_name
        }

        # Append raw digital values for each participant side-by-side
        for _, p_row in flat_subject_df.iterrows():
            p_code = p_row['participant_code']
            val = p_row.get(col_name, np.nan)
            row_dict[f"{p_code} Metric"] = round(val, 3) if pd.notna(val) else "N/A"

        # Format correlation statistics: Coefficient, 95% Bootstrap CI, raw p-value, and FDR p-value
        for score in active_scores:
            rho = score_stats[score]['rho'][i]
            p_rho = score_stats[score]['p_rho'][i]
            ci_low_rho, ci_high_rho = score_stats[score]['ci_rho'][i]
            p_fdr_rho = score_stats[score]['fdr_rho'][i]

            if pd.notna(rho) and pd.notna(p_rho):
                ci_str = f"[{ci_low_rho:.2f}, {ci_high_rho:.2f}]" if (pd.notna(ci_low_rho) and pd.notna(ci_high_rho)) else "[N/A]"
                fdr_str = f"{p_fdr_rho:.3f}" if pd.notna(p_fdr_rho) else "N/A"
                row_dict[f"Spearman ({score})"] = f"{rho:.3f} {ci_str}, p={p_rho:.3f} (FDR={fdr_str})"
            else:
                row_dict[f"Spearman ({score})"] = "N/A"

            r = score_stats[score]['r'][i]
            p_r = score_stats[score]['p_r'][i]
            ci_low_r, ci_high_r = score_stats[score]['ci_r'][i]
            p_fdr_r = score_stats[score]['fdr_r'][i]

            if pd.notna(r) and pd.notna(p_r):
                r_ci_str = f"[{ci_low_r:.2f}, {ci_high_r:.2f}]" if (pd.notna(ci_low_r) and pd.notna(ci_high_r)) else "[N/A]"
                r_fdr_str = f"{p_fdr_r:.3f}" if pd.notna(p_fdr_r) else "N/A"
                row_dict[f"Pearson ({score})"] = f"{r:.3f} {r_ci_str}, p={p_r:.3f} (FDR={r_fdr_str})"
            else:
                row_dict[f"Pearson ({score})"] = "N/A"

        rows.append(row_dict)

    res_df = pd.DataFrame(rows)

    # Sort dynamically by correlation strength of primary motor domain subscore
    primary_domain_score = 'tremor' if concept in ['postural_tremor', 'kinetic_tremor'] else 'bradykinesia'
    sort_col = f"Spearman ({primary_domain_score})" if f"Spearman ({primary_domain_score})" in res_df.columns else f"Spearman ({active_scores[0]})"
    if sort_col in res_df.columns:
        def get_coeff_val(val_str):
            try:
                s = str(val_str).strip()
                if '[' in s:
                    return abs(float(s.split('[')[0].strip()))
                elif ',' in s:
                    return abs(float(s.split(',')[0].strip()))
                elif s != 'N/A':
                    return abs(float(s))
            except:
                pass
            return -1.0
        res_df['abs_sort'] = res_df[sort_col].apply(get_coeff_val)
        res_df = res_df.sort_values(by='abs_sort', ascending=False).drop(columns=['abs_sort']).reset_index(drop=True)

    # Ensure all columns are visible in Jupyter notebook output without duplicating display
    pd.set_option('display.max_columns', None)
    pd.set_option('display.expand_frame_repr', False)

    return res_df

def analyze_primary_clinical_correlations(
    trials_df,
    participants_df,
    sessions_df,
    clinical_scores,
    concept='bradykinesia',
    target_score=None
):
    """
    Computes Spearman correlations for the primary clinical registry against the specific motor subdomain score
    (e.g., Bradykinesia Subscore for bradykinesia, Postural Tremor for postural_tremor).
    Returns a clean DataFrame formatted as:
    ['Motor characteristic', 'Task', 'Measure', 'Correlated Score', 'N', 'Spearman ρ', '95% CI', 'FDR p']
    """
    flat_subject_df = get_flat_subject_df(
        trials_df=trials_df,
        participants_df=participants_df,
        clinical_scores=clinical_scores,
        sessions_df=sessions_df
    )

    subdomain_scores = {
        'bradykinesia': 'bradykinesia',
        'hypokinesia': 'bradykinesia',
        'sequence_effect': 'bradykinesia',
        'hesitations_halts': 'bradykinesia',
        'akinesia': 'bradykinesia',
        'postural_tremor': 'postural_tremor',
        'kinetic_tremor': 'kinetic_tremor'
    }
    
    if target_score is None:
        target_score = subdomain_scores.get(concept, 'bradykinesia')
        first_entry = next(iter(clinical_scores.values()), {}) if clinical_scores else {}
        if target_score not in first_entry and 'tremor' in first_entry and concept in ['postural_tremor', 'kinetic_tremor']:
            target_score = 'tremor'
            
    target_score_list = target_score if isinstance(target_score, (list, tuple)) else [target_score]
    
    for score in target_score_list:
        flat_subject_df[score] = flat_subject_df['participant_code'].map(
            lambda x: clinical_scores.get(x, {}).get(score, np.nan)
        )
    pd_df = flat_subject_df[flat_subject_df['participant_code'].isin(clinical_scores.keys())].copy()

    primary_features = PRIMARY_REGISTRY.get(concept, [])
    if not primary_features:
        print(f"No primary features defined for concept '{concept}'.")
        return pd.DataFrame()

    motor_char = concept.replace('_', ' ').title()
    if motor_char == 'Hesitations Halts':
        motor_char = 'Hesitations & Halts'

    all_rows = []
    for cur_score in target_score_list:
        rhos = []
        p_raws = []
        cis = []
        tasks = []
        measures = []
        ns = []

        for feat in primary_features:
            col_name = feat['col']
            disp_name = feat['display_name']
            task_name = col_name.split('_')[0].capitalize()

            f_vals = pd.to_numeric(pd_df[col_name], errors='coerce').values
            s_vals = pd.to_numeric(pd_df[cur_score], errors='coerce').values
            mask = np.isfinite(f_vals) & np.isfinite(s_vals)
            f_v = f_vals[mask]
            s_v = s_vals[mask]

            n_obs = len(f_v)
            ns.append(n_obs)

            if n_obs >= 3:
                rho, p_raw = spearmanr(f_v, s_v)
                ci_low, ci_high = compute_bootstrap_ci(f_v, s_v, method='spearman')
            else:
                rho, p_raw, ci_low, ci_high = np.nan, np.nan, np.nan, np.nan

            rhos.append(rho)
            p_raws.append(p_raw)
            ci_str = f"[{ci_low:.2f}, {ci_high:.2f}]" if (pd.notna(ci_low) and pd.notna(ci_high)) else "N/A"
            cis.append(ci_str)
            tasks.append(task_name)
            measures.append(disp_name)

        # Benjamini-Hochberg FDR correction across the primary features for this target score
        valid_p_mask = [pd.notna(p) for p in p_raws]
        fdr_p_vals = [np.nan] * len(p_raws)
        if any(valid_p_mask):
            valid_p = [p for p in p_raws if pd.notna(p)]
            _, p_adj, _, _ = multipletests(valid_p, method='fdr_bh')
            adj_idx = 0
            for idx, is_v in enumerate(valid_p_mask):
                if is_v:
                    fdr_p_vals[idx] = p_adj[adj_idx]
                    adj_idx += 1

        for i in range(len(primary_features)):
            row_dict = {
                'Motor characteristic': motor_char,
                'Task': tasks[i],
                'Measure': measures[i]
            }
            if len(target_score_list) > 1 or concept in ['postural_tremor', 'kinetic_tremor']:
                row_dict['Correlated Score'] = cur_score
            row_dict.update({
                'N': ns[i],
                'Spearman ρ': round(rhos[i], 3) if pd.notna(rhos[i]) else np.nan,
                '95% CI': cis[i],
                'Raw p': round(p_raws[i], 3) if pd.notna(p_raws[i]) else np.nan,
                'FDR p': round(fdr_p_vals[i], 3) if pd.notna(fdr_p_vals[i]) else np.nan
            })
            all_rows.append(row_dict)

    res_df = pd.DataFrame(all_rows)
    # Sort by absolute strength of Spearman correlation (|ρ|) descending
    res_df['abs_rho'] = res_df['Spearman ρ'].abs()
    res_df = res_df.sort_values(by='abs_rho', ascending=False).drop(columns=['abs_rho']).reset_index(drop=True)
    return res_df




