import os
import json
import numpy as np
import pandas as pd
from scipy.stats import spearmanr, pearsonr, kruskal, mannwhitneyu
from statsmodels.stats.multitest import multipletests

# Pre-defined mapping registry of candidate digital features per clinical concept.
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
        {'col': 'pinch_pinch_max_opening_distance_mm', 'display_name': 'Pinch Max Opening Distance (mm)'},
        {'col': 'pinch_pinch_median_opening_distance_mm', 'display_name': 'Pinch Median Opening Distance (mm)'}
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
        {'col': 'tap_hesitations_halts_count', 'display_name': 'Tap Total Hesitation/Halt Count'},
        {'col': 'tap_hesitations_halts_duration_ms', 'display_name': 'Tap Total Hesitation/Halt Duration (ms)'},
        {'col': 'tap_longest_hesitation_halt_duration_ms', 'display_name': 'Tap Longest Hesitation/Halt Duration (ms)'},
        {'col': 'pinch_pinch_hesitations_halts_count', 'display_name': 'Pinch Total Hesitation/Halt Count'},
        {'col': 'pinch_pinch_hesitations_halts_duration_ms', 'display_name': 'Pinch Total Hesitation/Halt Duration (ms)'},
        {'col': 'pinch_pinch_longest_hesitation_halt_duration_ms', 'display_name': 'Pinch Longest Hesitation/Halt Duration (ms)'},
        {'col': 'drag_drag_hesitations_halts_count', 'display_name': 'Drag Total Hesitation/Halt Count'},
        {'col': 'drag_drag_hesitations_halts_duration_ms', 'display_name': 'Drag Total Hesitation/Halt Duration (ms)'},
        {'col': 'drag_longest_hesitation_halt_duration', 'display_name': 'Drag Longest Hesitation/Halt Duration (ms)'}
    ],
    'akinesia': [
        {'col': 'tap_initiation_delay', 'display_name': 'Tap Initiation Delay (ms)'},
        {'col': 'drag_initiation_delay', 'display_name': 'Drag Initiation Delay (ms)'},
        {'col': 'pinch_initiation_delay', 'display_name': 'Pinch Initiation Delay (ms)'},
        {'col': 'hold_initiation_delay', 'display_name': 'Hold Initiation Delay (ms)'},
        {'col': 'hold_akinetic_delay_hold', 'display_name': 'Hold Target Contact Delay (ms)'},
        {'col': 'hold_release_delay_ms', 'display_name': 'Hold Release Delay (ms)'}
    ],
    'postural_tremor': [
        {'col': 'hold_hold_tremor_amplitude_peak_cm', 'display_name': 'Hold Peak Tremor Amplitude (cm)'},
        {'col': 'hold_hold_tremor_power', 'display_name': 'Hold Tremor Spectral Power'},
        {'col': 'hold_hold_tremor_amplitude', 'display_name': 'Hold Average Tremor Amplitude (cm)'},
        {'col': 'hold_hold_spatial_sd', 'display_name': 'Hold Spatial Spread (px)'}
    ],
    'kinetic_tremor': [
        {'col': 'drag_drag_tremor_amplitude_peak_cm', 'display_name': 'Drag Peak Tremor Amplitude (cm)'},
        {'col': 'drag_kinetic_tremor_power', 'display_name': 'Drag Tremor Spectral Power'},
        {'col': 'drag_kinetic_tremor_amplitude', 'display_name': 'Drag Average Tremor Amplitude (cm)'},
        {'col': 'drag_path_efficiency', 'display_name': 'Drag Path Efficiency'}
    ]
}





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

def evaluate_clinical_concepts(trials_df, participants_df, clinical_scores, sessions_df=None):
    """
    Executes the transparent clinical concept feature evaluation framework.
    Returns:
      - subject_metrics_df: Flat DataFrame with average feature values and clinical scores per participant
      - results_by_concept: Dict of DataFrames representing the candidate evaluation matrix per concept
    """
    from clinical_metrics import extract_features_from_trial

    # Filter trials for main session type if sessions_df is provided and not empty
    if sessions_df is not None and not sessions_df.empty:
        print("Filtering trials for completed 'main' sessions to isolate analysis session trials...")
        main_mask = (sessions_df['session_type'] == 'main') if 'session_type' in sessions_df.columns else pd.Series(True, index=sessions_df.index)
        if 'completed' in sessions_df.columns:
            main_mask = main_mask & (sessions_df['completed'] == True)
        main_session_ids = sessions_df[main_mask]['id']
        trials_df = trials_df[trials_df['session_id'].isin(main_session_ids)]

    print("Extracting features from all trials...")
    feature_df = trials_df.apply(extract_features_from_trial, axis=1)
    feature_df['participant_id'] = trials_df['participant_id']
    feature_df['task_type'] = trials_df['task_type']
    feature_df['trial_number'] = trials_df['trial_number']

    # Map participant codes
    merged = feature_df.merge(participants_df[['id', 'participant_code']], left_on='participant_id', right_on='id')

    # 2. Pivot task features to a single flat row per participant (taking the median across trials)
    raw_feature_cols = [c for c in feature_df.columns if c not in ['participant_id', 'task_type', 'trial_number', 'id']]
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
            # Define raw columns for halts count and halts duration
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

    flat_subject_df['MDS_UPDRS_total'] = flat_subject_df['participant_code'].map(lambda x: clinical_scores.get(x, {}).get('MDS_UPDRS_total', np.nan))
    flat_subject_df['bradykinesia'] = flat_subject_df['participant_code'].map(lambda x: clinical_scores.get(x, {}).get('bradykinesia', np.nan))
    flat_subject_df['tremor'] = flat_subject_df['participant_code'].map(lambda x: clinical_scores.get(x, {}).get('tremor', np.nan))

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
            else:
                sp_rho, sp_p = np.nan, np.nan
                pe_r, pe_p = np.nan, np.nan

            # Sort by absolute Spearman correlation to help clinicians find top patterns
            sort_metric = abs(sp_rho) if pd.notna(sp_rho) else -1.0

            concept_rows.append({
                'Feature': col_name,
                'Display Name': disp_name,
                'Task': col_name.split('_')[0].capitalize(),
                'Spearman rho': sp_rho,
                'Spearman p (raw)': sp_p,
                'Pearson r': pe_r,
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

        md_content.append("\n| Feature | Task | Spearman $\\rho$ | Pearson $r$ | Spearman $p$ (FDR) |")
        md_content.append("| :--- | :--- | :---: | :---: | :---: |")
        
        for _, row in concept_df.iterrows():
            rho_str = f"{row['Spearman rho']:.2f}" if pd.notna(row['Spearman rho']) else "N/A"
            r_str = f"{row['Pearson r']:.2f}" if pd.notna(row['Pearson r']) else "N/A"
            fdr_str = f"{row['Spearman p (FDR)']:.3f}" if pd.notna(row['Spearman p (FDR)']) else "N/A"
            
            md_content.append(f"| {row['Display Name']} | {row['Task']} | {rho_str} | {r_str} | {fdr_str} |")

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

    flat_subject_df, _ = evaluate_clinical_concepts(
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

    features = REGISTRY[concept_name]
    primary_score = concept_scores[concept_name]
    item_score, item_label = concept_item_mapping[concept_name]

    corrs = []
    for feat in features:
        col = feat['col']
        disp = feat['display_name']
        if col in flat_subject_df.columns:
            f_vals = pd.to_numeric(flat_subject_df[col], errors='coerce').values
            s_vals = pd.to_numeric(flat_subject_df[primary_score], errors='coerce').values
            mask = np.isfinite(f_vals) & np.isfinite(s_vals)
            if mask.sum() >= 3:
                rho, p = spearmanr(f_vals[mask], s_vals[mask])
                corrs.append({
                    'col': col,
                    'display_name': disp,
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

    palette = {'P01': '#0D9488', 'P02': '#C026D3', 'P03': '#2563EB', 'P04': '#7C3AED', 'P05': '#D97706', 'P06': '#0284C7'}
    label_offsets = {
        'P01': (8, 6),
        'P02': (8, 6),
        'P03': (8, 6),
        'P04': (8, 6),
        'P05': (8, 6),
        'P06': (0, -16)
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

            title_str = f"{concept_title} Top Feature: {disp_name}\nSpearman ρ = {rho:+.3f} (p = {p:.4f})"
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




