import os
import json
import numpy as np
import pandas as pd
from scipy.stats import spearmanr, pearsonr, kruskal

# Pre-defined mapping registry of candidate digital features per clinical concept.
REGISTRY = {
    'bradykinesia': [
        {'col': 'tap_tap_frequency', 'display_name': 'Tapping Frequency (Hz)'},
        {'col': 'tap_mean_intertap_interval_ms', 'display_name': 'Mean Intertap Interval (ms)'},
        {'col': 'drag_mean_speed', 'display_name': 'Drag Mean Speed (px/s)'},
        {'col': 'drag_median_speed', 'display_name': 'Drag Median Speed (px/s)'},
        {'col': 'drag_peak_speed_ms', 'display_name': 'Drag Peak Speed (px/s)'},
        {'col': 'drag_movement_time_ms', 'display_name': 'Drag Movement Time (ms)'},
        {'col': 'drag_fitts_law_throughput', 'display_name': 'Drag Fitts Throughput (bits/s)'},
        {'col': 'pinch_pinch_frequency', 'display_name': 'Pinch Cycle Frequency (Hz)'},
        {'col': 'pinch_mean_pinch_interval_ms', 'display_name': 'Mean Pinch Interval (ms)'}
    ],
    'hypokinesia': [
        {'col': 'tap_median_amplitude_mm', 'display_name': 'Median Tapping Amplitude (mm)'},
        {'col': 'tap_tap_spatial_sd', 'display_name': 'Tapping Spatial Spread (px)'},
        {'col': 'drag_endpoint_abs_deviation_error', 'display_name': 'Drag Terminal Overshoot/Undershoot (px)'},
        {'col': 'drag_target_reached', 'display_name': 'Drag Target Reached Rate'},
        {'col': 'pinch_median_pinch_amplitude_mm', 'display_name': 'Median Pinch Amplitude (mm)'}
    ],
    'sequence_effect': [
        {'col': 'tap_amplitude_decrement_ratio', 'display_name': 'Tapping Amplitude Decrement Ratio'},
        {'col': 'tap_amplitude_slope_mm', 'display_name': 'Tapping Amplitude Slope (mm/tap)'},
        {'col': 'tap_tap_speed_decrement_ratio', 'display_name': 'Tapping Speed Decrement Ratio'},
        {'col': 'tap_tap_speed_slope', 'display_name': 'Tapping Speed Slope (ms/tap)'},
        {'col': 'drag_drag_deviation_decrement_ratio', 'display_name': 'Drag Path Deviation Decrement Ratio'},
        {'col': 'drag_drag_deviation_slope', 'display_name': 'Drag Path Deviation Slope'},
        {'col': 'drag_drag_speed_decrement_ratio', 'display_name': 'Drag Speed Decrement Ratio'},
        {'col': 'drag_drag_speed_slope', 'display_name': 'Drag Speed Slope (px/s per step)'},
        {'col': 'drag_across_trial_speed_decrement_ratio', 'display_name': 'Drag Across-Trial Speed Decrement Ratio'},
        {'col': 'drag_across_trial_speed_slope', 'display_name': 'Drag Across-Trial Speed Slope'},
        {'col': 'drag_across_trial_amplitude_decrement_ratio', 'display_name': 'Drag Across-Trial Amplitude Decrement Ratio'},
        {'col': 'drag_across_trial_amplitude_slope', 'display_name': 'Drag Across-Trial Amplitude Slope'},
        {'col': 'drag_across_trial_deviation_decrement_ratio', 'display_name': 'Drag Across-Trial Path Deviation Decrement Ratio'},
        {'col': 'drag_across_trial_deviation_slope', 'display_name': 'Drag Across-Trial Path Deviation Slope'},
        {'col': 'drag_across_trial_within_speed_decay_decrement_ratio', 'display_name': 'Drag Across-Trial Within-Trial Speed Decay Ratio'},
        {'col': 'drag_across_trial_within_speed_decay_slope', 'display_name': 'Drag Across-Trial Within-Trial Speed Decay Slope'},
        {'col': 'drag_across_trial_within_deviation_decay_decrement_ratio', 'display_name': 'Drag Across-Trial Within-Trial Deviation Decay Ratio'},
        {'col': 'drag_across_trial_within_deviation_decay_slope', 'display_name': 'Drag Across-Trial Within-Trial Deviation Decay Slope'},
        {'col': 'pinch_pinch_amplitude_decrement_ratio', 'display_name': 'Pinch Amplitude Decrement Ratio'},
        {'col': 'pinch_pinch_amplitude_slope_mm', 'display_name': 'Pinch Amplitude Slope (mm/cycle)'},
        {'col': 'pinch_pinch_speed_decrement_ratio', 'display_name': 'Pinch Speed Decrement Ratio'},
        {'col': 'pinch_pinch_speed_slope', 'display_name': 'Pinch Speed Slope (ms/cycle)'}
    ],
    'hesitations_halts': [
        {'col': 'tap_hesitations_count', 'display_name': 'Tapping Hesitations Count'},
        {'col': 'tap_hesitations_duration_ms', 'display_name': 'Tapping Hesitations Duration (ms)'},
        {'col': 'tap_halts_count', 'display_name': 'Tapping Halts Count'},
        {'col': 'tap_halts_duration_ms', 'display_name': 'Tapping Halts Duration (ms)'},
        {'col': 'tap_cv_intertap_interval', 'display_name': 'Tapping Rhythm CV'},
        {'col': 'tap_double_taps_count', 'display_name': 'Tapping Double Taps Count'},
        {'col': 'tap_interruptions_count', 'display_name': 'Tapping Interruptions Count'},
        {'col': 'drag_drag_hesitations_count', 'display_name': 'Drag Hesitations Count'},
        {'col': 'drag_drag_hesitations_duration_ms', 'display_name': 'Drag Hesitations Duration (ms)'},
        {'col': 'drag_drag_halts_count', 'display_name': 'Drag Halts Count'},
        {'col': 'drag_drag_halts_duration_ms', 'display_name': 'Drag Halts Duration (ms)'},
        {'col': 'drag_drag_speed_cv', 'display_name': 'Drag Speed CV'},
        {'col': 'drag_pause_count', 'display_name': 'Drag Pause Count'},
        {'col': 'drag_longest_pause_duration', 'display_name': 'Drag Longest Pause (ms)'},
        {'col': 'drag_across_trial_hesitations_decrement_ratio', 'display_name': 'Drag Across-Trial Hesitations Decrement Ratio'},
        {'col': 'drag_across_trial_hesitations_slope', 'display_name': 'Drag Across-Trial Hesitations Slope'},
        {'col': 'pinch_pinch_hesitations_count', 'display_name': 'Pinch Hesitations Count'},
        {'col': 'pinch_pinch_hesitations_duration_ms', 'display_name': 'Pinch Hesitations Duration (ms)'},
        {'col': 'pinch_pinch_halts_count', 'display_name': 'Pinch Halts Count'},
        {'col': 'pinch_pinch_halts_duration_ms', 'display_name': 'Pinch Halts Duration (ms)'},
        {'col': 'pinch_cv_pinch_interval', 'display_name': 'Pinch Rhythm CV'},
        {'col': 'pinch_pinch_lifts_count', 'display_name': 'Pinch Screen Lifts Count'},
        {'col': 'pinch_pinch_lifts_duration_ms', 'display_name': 'Pinch Screen Lifts Duration (ms)'},
        {'col': 'pinch_pinch_mean_lift_duration_ms', 'display_name': 'Pinch Mean Lift Duration (ms)'},
        {'col': 'pinch_pinch_mean_orientation_deviation', 'display_name': 'Pinch Mean Orientation Deviation (deg)'},
        {'col': 'pinch_pinch_orientation_drift_sd', 'display_name': 'Pinch Orientation Drift SD (deg)'}
    ],
    'akinesia': [
        {'col': 'tap_initiation_delay', 'display_name': 'Tapping Initiation Delay (ms)'},
        {'col': 'drag_initiation_delay', 'display_name': 'Drag Initiation Delay (ms)'},
        {'col': 'pinch_initiation_delay', 'display_name': 'Pinch Initiation Delay (ms)'},
        {'col': 'hold_initiation_delay', 'display_name': 'Hold Initiation Delay (ms)'},
        {'col': 'hold_akinetic_delay_hold', 'display_name': 'Hold Target Contact Delay (ms)'}
    ],
    'postural_tremor': [
        {'col': 'hold_hold_tremor_amplitude_peak_cm', 'display_name': 'Hold Peak Tremor Amplitude (cm)'},
        {'col': 'hold_hold_tremor_power', 'display_name': 'Hold Tremor Spectral Power'},
        {'col': 'hold_hold_tremor_amplitude', 'display_name': 'Hold Average Tremor Amplitude'},
        {'col': 'hold_hold_spatial_sd', 'display_name': 'Hold Spatial Spread (px)'}
    ],
    'kinetic_tremor': [
        {'col': 'drag_drag_tremor_amplitude_peak_cm', 'display_name': 'Drag Peak Tremor Amplitude (cm)'},
        {'col': 'drag_kinetic_tremor_power', 'display_name': 'Drag Tremor Spectral Power'},
        {'col': 'drag_kinetic_tremor_amplitude', 'display_name': 'Drag Average Tremor Amplitude'},
        {'col': 'drag_path_efficiency', 'display_name': 'Drag Path Efficiency'},
        {'col': 'tap_tap_tremor_amplitude', 'display_name': 'Tapping Average Tremor Amplitude'},
        {'col': 'tap_tap_tremor_amplitude_peak_mm', 'display_name': 'Tapping Peak Tremor Amplitude (mm)'},
        {'col': 'tap_tap_tremor_power', 'display_name': 'Tapping Tremor Spectral Power'}
    ]
}

def calculate_icc_3_1(df, subject_col, trial_col, value_col):
    """
    Computes ICC(3,1) - Two-way mixed consistency model for single measurements.
    """
    sub_df = df[[subject_col, trial_col, value_col]].dropna()
    try:
        pivot_df = sub_df.pivot(index=subject_col, columns=trial_col, values=value_col).dropna()
    except Exception:
        return np.nan

    data = pivot_df.values
    n, k = data.shape
    if n < 2 or k < 2:
        return np.nan

    grand_mean = np.mean(data)
    
    # Between-subjects Mean Square (MSB)
    SST = np.sum((np.mean(data, axis=1) - grand_mean)**2) * k
    MSB = SST / (n - 1)
    
    # Within-subjects Sum of Squares (SSW)
    SSW = np.sum((data - np.mean(data, axis=1)[:, np.newaxis])**2)
    
    # Between-trials Mean Square (MSJ)
    SSJ = np.sum((np.mean(data, axis=0) - grand_mean)**2) * n
    
    # Error Mean Square (MSE)
    SSE = SSW - SSJ
    MSE = SSE / ((n - 1) * (k - 1))
    
    denom = MSB + (k - 1) * MSE
    if denom == 0:
        return 0.0
        
    icc = (MSB - MSE) / denom
    return max(-1.0, min(1.0, icc))

def calculate_cohens_d(g1, g2, global_std=None):
    """Calculates Cohen's d between two groups of values, falling back to global standard deviation if group sizes are 1."""
    n1, n2 = len(g1), len(g2)
    if n1 < 1 or n2 < 1:
        return np.nan
    m1, m2 = np.mean(g1), np.mean(g2)
    
    if n1 > 1 and n2 > 1:
        v1, v2 = np.var(g1, ddof=1), np.var(g2, ddof=1)
        pooled_std = np.sqrt(((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2))
    else:
        pooled_std = global_std if global_std is not None else np.std(np.concatenate([g1, g2]), ddof=0)
        
    if pooled_std == 0 or pd.isna(pooled_std):
        return 0.0
    return (m1 - m2) / pooled_std

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
        print("Filtering trials for 'main' session type to isolate analysis session trials...")
        main_session_ids = sessions_df[sessions_df['session_type'] == 'main']['id'] if 'session_type' in sessions_df.columns else sessions_df['id']
        trials_df = trials_df[trials_df['session_id'].isin(main_session_ids)]

    print("Extracting features from all trials...")
    feature_df = trials_df.apply(extract_features_from_trial, axis=1)
    feature_df['participant_id'] = trials_df['participant_id']
    feature_df['task_type'] = trials_df['task_type']
    feature_df['trial_number'] = trials_df['trial_number']

    # Map participant codes
    merged = feature_df.merge(participants_df[['id', 'participant_code']], left_on='participant_id', right_on='id')

    # 1. Calculate trial-level repeatability (ICC 3,1) for each feature.
    reliability_dict = {}
    raw_feature_cols = [c for c in feature_df.columns if c not in ['participant_id', 'task_type', 'trial_number', 'id']]
    
    for task in ['tap', 'drag', 'pinch', 'hold']:
        task_df = merged[merged['task_type'] == task]
        if task_df.empty:
            continue
        for col in raw_feature_cols:
            if col in task_df.columns and task_df[col].notna().sum() > 0:
                prefixed_name = f"{task}_{col}"
                reliability_dict[prefixed_name] = calculate_icc_3_1(task_df, 'participant_code', 'trial_number', col)

    # 2. Pivot task features to a single flat row per participant (taking the median across trials)
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

    # 2.5 Compute Across-Trial Drag sequence effect metrics
    drag_across_metrics = []
    for participant in flat_subject_df['participant_code']:
        p_drag = merged[(merged['participant_code'] == participant) & (merged['task_type'] == 'drag')].sort_values(by='trial_number')
        
        metrics = {'participant_code': participant}
        
        vectors = {
            'drag_across_trial_speed': p_drag['median_speed'].dropna().values,
            'drag_across_trial_amplitude': p_drag['drag_amplitude'].dropna().values,
            'drag_across_trial_deviation': p_drag['drag_median_deviation'].dropna().values,
            'drag_across_trial_within_speed_decay': p_drag['drag_speed_decrement_ratio'].dropna().values,
            'drag_across_trial_within_deviation_decay': p_drag['drag_deviation_decrement_ratio'].dropna().values,
            'drag_across_trial_hesitations': p_drag['drag_hesitations_count'].dropna().values
        }
        
        for prefix, v in vectors.items():
            if len(v) >= 2:
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

    # Add clinical scores
    flat_subject_df['MDS_UPDRS_total'] = flat_subject_df['participant_code'].map(lambda x: clinical_scores.get(x, {}).get('MDS_UPDRS_total', np.nan))
    flat_subject_df['bradykinesia'] = flat_subject_df['participant_code'].map(lambda x: clinical_scores.get(x, {}).get('bradykinesia', np.nan))
    flat_subject_df['tremor'] = flat_subject_df['participant_code'].map(lambda x: clinical_scores.get(x, {}).get('tremor', np.nan))

    # Determine severity groups (Mild, Moderate, Severe) based on clinical scores
    def split_groups(df, score_col):
        valid_df = df[df[score_col].notna()].sort_values(by=score_col)
        if len(valid_df) == 0:
            return {}, None
            
        unique_vals = sorted(valid_df[score_col].unique())
        if len(unique_vals) == 2:
            return {
                'Mild': valid_df[valid_df[score_col] == unique_vals[0]],
                'Moderate': pd.DataFrame(),
                'Severe': valid_df[valid_df[score_col] == unique_vals[1]]
            }, 'binary'
        elif len(unique_vals) == 1:
            return {
                'Mild': valid_df,
                'Moderate': pd.DataFrame(),
                'Severe': pd.DataFrame()
            }, 'single'
        else:
            q13 = np.percentile(valid_df[score_col], 33.3)
            q23 = np.percentile(valid_df[score_col], 66.7)
            return {
                'Mild': valid_df[valid_df[score_col] <= q13],
                'Moderate': valid_df[(valid_df[score_col] > q13) & (valid_df[score_col] <= q23)],
                'Severe': valid_df[valid_df[score_col] > q23]
            }, 'tercile'

    # Define subtype classification (TD vs. AR)
    subtypes = {}
    for p_code, scores in clinical_scores.items():
        t_val = scores.get('tremor')
        b_val = scores.get('bradykinesia')
        if pd.notna(t_val) and pd.notna(b_val) and b_val > 0:
            ratio = t_val / b_val
            if ratio >= 1.5:
                subtypes[p_code] = 'TD'
            elif ratio <= 1.0:
                subtypes[p_code] = 'AR'
            else:
                subtypes[p_code] = 'Indeterminate'
        else:
            subtypes[p_code] = 'Unknown'
            
    flat_subject_df['subtype'] = flat_subject_df['participant_code'].map(subtypes)

    # 3. Perform Concept evaluation (no composite scores)
    results_by_concept = {}
    
    for concept, features in REGISTRY.items():
        is_tremor_concept = concept in ['postural_tremor', 'kinetic_tremor']
        clinical_col = 'tremor' if is_tremor_concept else 'bradykinesia'
        
        if flat_subject_df[clinical_col].isna().all():
            clinical_col = 'MDS_UPDRS_total'

        groups, split_type = split_groups(flat_subject_df, clinical_col)

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
            if len(f_valid) >= 2:
                sp_rho, _ = spearmanr(f_valid, c_valid)
                pe_r, _ = pearsonr(f_valid, c_valid)
            else:
                sp_rho, _ = np.nan, np.nan
                pe_r, _ = np.nan, np.nan

            # Reliability (ICC)
            icc_val = reliability_dict.get(col_name, np.nan)

            # Global Standard Deviation fallback for Cohen's d
            g_std = np.std(flat_subject_df[col_name].dropna(), ddof=0) if col_name in flat_subject_df.columns else None

            # Pairwise Cohen's d Effect Sizes
            d_mild_mod = np.nan
            d_mod_sev = np.nan
            d_mild_sev = np.nan
            kw_stat = np.nan

            if split_type == 'tercile':
                g_mild = groups['Mild'][col_name].dropna().values
                g_mod = groups['Moderate'][col_name].dropna().values
                g_sev = groups['Severe'][col_name].dropna().values
                
                d_mild_mod = calculate_cohens_d(g_mild, g_mod, g_std)
                d_mod_sev = calculate_cohens_d(g_mod, g_sev, g_std)
                d_mild_sev = calculate_cohens_d(g_mild, g_sev, g_std)
                
                if len(g_mild) >= 2 and len(g_mod) >= 2 and len(g_sev) >= 2:
                    try:
                        kw_stat, _ = kruskal(g_mild, g_mod, g_sev)
                    except ValueError:
                        pass
            elif split_type == 'binary':
                g_mild = groups['Mild'][col_name].dropna().values
                g_sev = groups['Severe'][col_name].dropna().values
                d_mild_sev = calculate_cohens_d(g_mild, g_sev, g_std)

            # Subtype Group Means
            td_vals = flat_subject_df[flat_subject_df['subtype'] == 'TD'][col_name].dropna().values
            ar_vals = flat_subject_df[flat_subject_df['subtype'] == 'AR'][col_name].dropna().values
            
            mean_td = np.mean(td_vals) if len(td_vals) > 0 else np.nan
            mean_ar = np.mean(ar_vals) if len(ar_vals) > 0 else np.nan

            # Sort by absolute Spearman correlation to help clinicians find top patterns
            sort_metric = abs(sp_rho) if pd.notna(sp_rho) else -1.0

            concept_rows.append({
                'Feature': col_name,
                'Display Name': disp_name,
                'Task': col_name.split('_')[0].capitalize(),
                'Spearman rho': sp_rho,
                'Pearson r': pe_r,
                'ICC (3,1)': icc_val,
                'd (Mild-Mod)': d_mild_mod,
                'd (Mod-Sev)': d_mod_sev,
                'd (Mild-Sev)': d_mild_sev,
                'K-W H-stat': kw_stat,
                'Mean (AR)': mean_ar,
                'Mean (TD)': mean_td,
                '_sort_key': sort_metric
            })
            
        if concept_rows:
            # Sort by sorting key (absolute correlation strength)
            concept_df = pd.DataFrame(concept_rows).sort_values(by='_sort_key', ascending=False).reset_index(drop=True)
            concept_df.drop(columns=['_sort_key'], inplace=True)
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
    subtypes = flat_subject_df[['participant_code', 'MDS_UPDRS_total', 'bradykinesia', 'tremor', 'subtype']].dropna(subset=['MDS_UPDRS_total'])
    md_content.append("\n| Participant | MDS-UPDRS Total | Bradykinesia Subscore | Tremor Subscore | Clinical Subtype |")
    md_content.append("| :--- | :---: | :---: | :---: | :--- |")
    for _, r in subtypes.iterrows():
        md_content.append(f"| **{r['participant_code']}** | {int(r['MDS_UPDRS_total'])} | {int(r['bradykinesia'])} | {int(r['tremor'])} | {r['subtype']} |")

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

        md_content.append("\n| Feature | Task | Spearman $\\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |")
        md_content.append("| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |")
        
        for _, row in concept_df.iterrows():
            rho_str = f"{row['Spearman rho']:.2f}" if pd.notna(row['Spearman rho']) else "N/A"
            r_str = f"{row['Pearson r']:.2f}" if pd.notna(row['Pearson r']) else "N/A"
            icc_str = f"{row['ICC (3,1)']:.2f}" if pd.notna(row['ICC (3,1)']) else "N/A"
            d_str = f"{row['d (Mild-Sev)']:.2f}" if pd.notna(row['d (Mild-Sev)']) else "N/A"
            kw_str = f"{row['K-W H-stat']:.2f}" if pd.notna(row['K-W H-stat']) else "N/A"
            ar_str = f"{row['Mean (AR)']:.2f}" if pd.notna(row['Mean (AR)']) else "N/A"
            td_str = f"{row['Mean (TD)']:.2f}" if pd.notna(row['Mean (TD)']) else "N/A"
            
            md_content.append(f"| {row['Display Name']} | {row['Task']} | {rho_str} | {r_str} | {icc_str} | {d_str} | {kw_str} | {ar_str} | {td_str} |")

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(md_content))
        
    print("Markdown report written successfully to:", output_path)
    return results
