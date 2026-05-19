import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings('ignore') # Clean up plotting logs
from scipy.signal import savgol_filter, welch
from scipy.interpolate import interp1d

def smooth_coordinates(coords, window_length=5, polyorder=2):
    """Smooth coordinate array using Savitzky-Golay filter."""
    if len(coords) < window_length:
        return coords
    if window_length % 2 == 0:
        window_length += 1
    x_smooth = savgol_filter(coords[:, 0], window_length, polyorder)
    y_smooth = savgol_filter(coords[:, 1], window_length, polyorder)
    return np.column_stack([x_smooth, y_smooth])

def calculate_derivatives(times, coords):
    """Calculates velocity, acceleration, and jerk given time (ms) and coordinate arrays."""
    if len(times) < 2:
        return np.array([]), np.array([]), np.array([])
    
    dt = np.diff(times) / 1000.0  # Convert to seconds
    dt[dt == 0] = 0.001  # Prevent division by zero
    
    dp = np.diff(coords, axis=0)
    dist = np.linalg.norm(dp, axis=1)
    
    vel = dist / dt
    
    
    if len(vel) < 2:
        return vel, np.array([]), np.array([])
        
    acc = np.diff(vel) / dt[1:]
    
    if len(acc) < 2:
        return vel, acc, np.array([])
        
    jerk = np.diff(acc) / dt[2:]
    return vel, acc, jerk

def extract_tremor(times, coords):
    """
    Interpolates touch coordinates into a uniform timestamp geometry and applies Welch's PSD 
    to robustly calculate physiological tremor characteristics inside a 3-8 Hz target band.
    """
    # Use 2-3 seconds as minimum duration threshold (2000 ms)
    if len(times) < 10 or (times[-1] - times[0]) < 2000:
        return np.nan, np.nan, np.nan
        
    # Target uniform grid: 100 Hz (10ms steps). 
    # We hardcode 100 Hz because it satisfies the Nyquist theorem for frequencies up to 50 Hz, 
    # which easily covers and safely oversamples our target tremor band of 3-8 Hz.
    target_fs = 100.0
    uniform_times = np.arange(times[0], times[-1], 10.0)
    
    # Calculate euclidean magnitude from center immediately
    centroid = np.mean(coords, axis=0)
    deviations = np.linalg.norm(coords - centroid, axis=1)
    
    # Interpolate non-uniform touch events onto stable baseline 
    f_interp = interp1d(times, deviations, kind='linear', fill_value='extrapolate')
    uniform_deviations = f_interp(uniform_times)
    
    # Remove DC offset (zero mean)
    uniform_deviations -= np.mean(uniform_deviations)
    
    # Calculate PSD using Welch's method
    f, Pxx = welch(uniform_deviations, fs=target_fs, nperseg=min(len(uniform_deviations), int(target_fs * 1.5)))
    
    # Isolate clinical Tremor Band (Postural + Resting Action typically 3-8 Hz)
    band_mask = (f >= 3.0) & (f <= 8.0)
    
    if not np.any(band_mask):
        return np.nan, np.nan, np.nan
        
    f_band = f[band_mask]
    Pxx_band = Pxx[band_mask]
    
    # Frequency corresponding to peak spectral power
    peak_idx = np.argmax(Pxx_band)
    tremor_freq = f_band[peak_idx]
    
    # Power Spectral Density (peak power) inside the clinical band
    tremor_power = Pxx_band[peak_idx]
    
    # Clinical amplitude is best estimated as the RMS amplitude in the tremor band.
    # This is calculated as the square root of the total area under the PSD curve (total band power).
    total_band_power = np.trapz(Pxx_band, f_band)
    tremor_amp = np.sqrt(total_band_power)
    
    return tremor_freq, tremor_power, tremor_amp

def extract_kinetic_tremor(times, deviations):
    """
    Interpolates orthogonal deviations into a uniform timestamp geometry and applies Welch's PSD 
    to robustly calculate physiological kinetic tremor characteristics inside a 3-8 Hz target band.
    """
    # Use 1 second as minimum duration threshold (1000 ms) for drag movements
    if len(times) < 10 or (times[-1] - times[0]) < 1000:
        return np.nan, np.nan, np.nan
        
    target_fs = 100.0
    uniform_times = np.arange(times[0], times[-1], 10.0)
    
    # Interpolate non-uniform touch events onto stable baseline 
    f_interp = interp1d(times, deviations, kind='linear', fill_value='extrapolate')
    uniform_deviations = f_interp(uniform_times)
    
    # Remove DC offset (zero mean)
    uniform_deviations -= np.mean(uniform_deviations)
    
    # Calculate PSD using Welch's method
    f, Pxx = welch(uniform_deviations, fs=target_fs, nperseg=min(len(uniform_deviations), int(target_fs * 1.5)))
    
    # Isolate clinical Tremor Band (Postural + Resting Action typically 3-8 Hz)
    band_mask = (f >= 3.0) & (f <= 8.0)
    
    if not np.any(band_mask):
        return np.nan, np.nan, np.nan
        
    f_band = f[band_mask]
    Pxx_band = Pxx[band_mask]
    
    # Frequency corresponding to peak spectral power
    peak_idx = np.argmax(Pxx_band)
    tremor_freq = f_band[peak_idx]
    
    # Power Spectral Density (peak power) inside the clinical band
    tremor_power = Pxx_band[peak_idx]
    
    # Clinical amplitude is best estimated as the RMS amplitude in the tremor band.
    total_band_power = np.trapz(Pxx_band, f_band)
    tremor_amp = np.sqrt(total_band_power)
    
    return tremor_freq, tremor_power, tremor_amp

def extract_features_from_trial(row):
    """
    Tier 1: Parses high-fidelity raw events JSON and extracts ALL continuous features.
    Delegates based on task_type.
    """
    task = row['task_type']
    
    if task == 'drag':
        traj = row.get('trajectory', [])
        if not isinstance(traj, list) or len(traj) < 2:
            return pd.Series(dtype=float)
            
        times = np.array([pt['t'] for pt in traj])
        coords = np.array([[pt['x'], pt['y']] for pt in traj])
        coords = smooth_coordinates(coords)
        
        vel, acc, jerk = calculate_derivatives(times, coords)
        
        # Distance and Path
        dp = np.diff(coords, axis=0)
        total_dist = np.sum(np.linalg.norm(dp, axis=1))
        straight_dist = np.linalg.norm(coords[-1] - coords[0])
        path_eff = (straight_dist / total_dist) if total_dist > 0 else np.nan
        
        # Extract fixed DB targets for unified physical task axis
        t_x = row.get('target_x')
        t_y = row.get('target_y')
        s_x = row.get('start_x')
        s_y = row.get('start_y')
        
        # Initial Targeting Error (Where they actually started vs Geometric center)
        if pd.notna(s_x) and pd.notna(s_y) and len(coords) > 0:
            ui_start_center = np.array([s_x, s_y])
            initial_targeting_error = np.linalg.norm(coords[0] - ui_start_center)
        else:
            initial_targeting_error = np.nan
        
        # Movement Variability (Orthogonal deviation from the unified ideal task axis)
        if pd.notna(t_x) and pd.notna(t_y) and len(coords) > 2:
            start_pt = coords[0]
            target_pt = np.array([t_x, t_y])
            task_axis_dist = np.linalg.norm(target_pt - start_pt)
            
            if task_axis_dist > 0:
                # Calculates perpendicular distance of every tapped pixel from the UNIFIED geometric task line
                signed_cross = (target_pt[0] - start_pt[0]) * (start_pt[1] - coords[:, 1]) - (start_pt[0] - coords[:, 0]) * (target_pt[1] - start_pt[1])
                cross_out = np.abs(signed_cross)
                orthogonal_dists = cross_out / task_axis_dist
                movement_variability = np.std(orthogonal_dists)
                max_deviation = np.max(orthogonal_dists)
                movement_error = np.mean(orthogonal_dists)
                
                signs = np.sign(signed_cross)
                signs = signs[signs != 0] # Remove zeros
                task_axis_crossings_count = np.sum(np.diff(signs) != 0) if len(signs) > 0 else 0
                
                # Extract kinetic tremor from signed orthogonal deviations
                signed_dists = signed_cross / task_axis_dist
                k_freq, k_power, k_amp = extract_kinetic_tremor(times, signed_dists)
            else:
                movement_variability = np.nan
                max_deviation = np.nan
                movement_error = np.nan
                task_axis_crossings_count = np.nan
                k_freq = np.nan
                k_power = np.nan
                k_amp = np.nan
        else:
            movement_variability = np.nan
            max_deviation = np.nan
            movement_error = np.nan
            task_axis_crossings_count = np.nan
            k_freq = np.nan
            k_power = np.nan
            k_amp = np.nan
            
        # Velocity / Pauses
        mean_speed = np.mean(vel) if len(vel) > 0 else np.nan
        median_speed = np.median(vel) if len(vel) > 0 else np.nan
        peak_speed = np.max(vel) if len(vel) > 0 else np.nan
        
        pause_threshold = 10.0 # arbitrary px/s threshold for halt
        pauses = vel < pause_threshold
        pause_count = np.sum(np.diff(pauses.astype(int)) == 1)
        
        longest_pause_duration = 0.0
        if len(vel) > 0:
            padded = np.concatenate(([False], pauses, [False]))
            diffs = np.diff(padded.astype(int))
            starts = np.where(diffs == 1)[0]
            ends = np.where(diffs == -1)[0]
            for s, e in zip(starts, ends):
                p_duration = times[e] - times[s]
                if p_duration >= 100:
                    longest_pause_duration = max(longest_pause_duration, p_duration)

        mean_accel = np.mean(acc) if len(acc) > 0 else np.nan
        mean_abs_jerk = np.mean(np.abs(jerk)) if len(jerk) > 0 else np.nan
        peak_jerk = np.max(np.abs(jerk)) if len(jerk) > 0 else np.nan
        
        # Undershoot / Overshoot (Terminal Error)
        if pd.notna(t_x) and pd.notna(t_y) and len(coords) > 0:
            end_pt = coords[-1]
            target_pt = np.array([t_x, t_y])
            start_center = coords[0]  # Clinically updated to use physical touch anchor!
            
            endpoint_deviation_error = np.linalg.norm(end_pt - target_pt)
            
            task_axis = target_pt - start_center
            task_mag = np.linalg.norm(task_axis)
            if task_mag > 0:
                user_axis = end_pt - start_center
                projection = np.dot(user_axis, task_axis) / task_mag
                endpoint_abs_deviation_error = projection - task_mag  # + is Overshoot, - is Undershoot
            else:
                endpoint_abs_deviation_error = np.nan
        else:
            endpoint_deviation_error = np.nan
            endpoint_abs_deviation_error = np.nan

        return pd.Series({
            'total_distance': total_dist,
            'straight_line_distance': straight_dist,
            'path_efficiency': path_eff,
            'movement_variability': movement_variability,
            'max_deviation': max_deviation,
            'movement_error': movement_error,
            'task_axis_crossings_count': task_axis_crossings_count,
            'kinetic_tremor_frequency_hz': k_freq,
            'kinetic_tremor_power': k_power,
            'kinetic_tremor_amplitude': k_amp,
            'initial_targeting_error': initial_targeting_error,
            'endpoint_deviation_error': endpoint_deviation_error,
            'endpoint_abs_deviation_error': endpoint_abs_deviation_error,
            'mean_speed': mean_speed,
            'median_speed': median_speed,
            'peak_speed_ms': peak_speed,
            'mean_acceleration': mean_accel,
            'mean_abs_jerk': mean_abs_jerk,
            'peak_jerk': peak_jerk,
            'pause_count': pause_count,
            'longest_pause_duration': longest_pause_duration,
            'initiation_delay': row.get('initiation_delay_ms')
        })
        
    elif task == 'tap':
        taps = row.get('taps', [])
        if not isinstance(taps, list) or len(taps) == 0:
            return pd.Series({'tap_count': 0})
            
        times = np.array([pt['t'] for pt in taps])
        coords = np.array([[pt['x'], pt['y']] for pt in taps])
        coords = smooth_coordinates(coords)
        
        tap_count = len(taps)
        duration_ms = times[-1] - times[0] if len(times) > 1 else 0
        freq = (tap_count / (duration_ms / 1000.0)) if duration_ms > 0 else np.nan
        
        intertap = np.diff(times)
        mean_intertap = np.mean(intertap) if len(intertap) > 0 else np.nan
        cv_intertap = (np.std(intertap) / mean_intertap) if mean_intertap > 0 else np.nan
        
        # Spatial SD (spread of taps)
        if len(coords) > 2:
            centroid = np.mean(coords, axis=0)
            dists = np.linalg.norm(coords - centroid, axis=1)
            spatial_sd = np.std(dists)
        else:
            spatial_sd = np.nan
            
        return pd.Series({
            'tap_count': tap_count,
            'tap_frequency': freq,
            'mean_intertap_interval_ms': mean_intertap,
            'cv_intertap_interval': cv_intertap,
            'tap_spatial_sd': spatial_sd,
            'initiation_delay': row.get('initiation_delay_ms')
        })
        
    elif task == 'hold':
        events = row.get('hold_events', [])
        if not isinstance(events, list) or len(events) < 2:
            return pd.Series(dtype=float)
            
        times = np.array([pt['t'] for pt in events if 'x' in pt])
        coords = np.array([[pt['x'], pt['y']] for pt in events if 'x' in pt])
        coords = smooth_coordinates(coords)
        
        if len(coords) < 2:
             return pd.Series(dtype=float)
             
        vel, acc, jerk = calculate_derivatives(times, coords)
        
        # Drift Distance
        total_drift = np.sum(np.linalg.norm(np.diff(coords, axis=0), axis=1))
        
        centroid = np.mean(coords, axis=0)
        spatial_sd = np.std(np.linalg.norm(coords - centroid, axis=1))
        
        # Spectral Extraction
        tremor_freq, tremor_power, tremor_amp = extract_tremor(times, coords)
        
        # Pressure (Force) Extraction
        forces = [pt.get('force') for pt in events if 'force' in pt and pt.get('force') is not None]
        forces = np.array(forces) if len(forces) > 0 else np.array([])
        
        force_valid = 1.0 if (len(forces) > 0 and np.max(forces) > 0) else 0.0
        
        return pd.Series({
            'hold_duration_ms': row.get('total_hold_time_ms'),
            'hold_drift_distance': total_drift,
            'hold_spatial_sd': spatial_sd,
            'hold_mean_speed': np.mean(vel) if len(vel) > 0 else np.nan,
            'hold_mean_abs_jerk': np.mean(np.abs(jerk)) if len(jerk) > 0 else np.nan,
            'hold_tremor_frequency_hz': tremor_freq,
            'hold_tremor_power': tremor_power,
            'hold_tremor_amplitude': tremor_amp,
            'hold_mean_force': np.mean(forces) if force_valid else np.nan,
            'hold_max_force': np.max(forces) if force_valid else np.nan,
            'hold_force_variability': np.std(forces) if force_valid else np.nan,
            'hold_force_range': (np.max(forces) - np.min(forces)) if force_valid else np.nan,
            'hold_force_median': np.median(forces) if force_valid else np.nan,
            'hold_force_valid': force_valid,
            'akinetic_delay_hold_ms': row.get('akinetic_delay_hold_ms'),
            'initiation_delay': row.get('initiation_delay_ms')
        })
        
    return pd.Series(dtype=float)

def extract_all_features(trials_df):
    """Applies extraction row by row then aggregates mathematically using continuous descriptive stats."""
    # 1. Component parsing
    feature_df = trials_df.apply(extract_features_from_trial, axis=1)
    
    feature_cols = feature_df.columns.tolist()
    combined = feature_df.copy()
    combined['participant_id'] = trials_df['participant_id']
    combined['task_type'] = trials_df['task_type']
    
    # Map trial_number to blocks (1-3: Block1, 4-6: Block2, 7-10: Block3)
    def assign_block(x):
        if pd.isna(x): return 'Unknown'
        if x <= 3: return 'Block1'
        if x <= 6: return 'Block2'
        return 'Block3'
    
    combined['block_id'] = trials_df['trial_number'].apply(assign_block)
    
    # 2. Aggregation Level (Min, Max, Mean, Median, Std per Participant per Task per Block)
    agg_dict = {col: ['min', 'max', 'mean', 'median', 'std'] for col in feature_cols}
    
    # Aggregate over blocks
    grouped_blocks = combined.groupby(['participant_id', 'task_type', 'block_id']).agg(agg_dict)
    grouped_blocks.columns = [f"{c[0]}_{c[1]}" for c in grouped_blocks.columns.values]
    grouped_blocks = grouped_blocks.reset_index()
    
    # Aggregate globally (Overall)
    grouped_global = combined.groupby(['participant_id', 'task_type']).agg(agg_dict)
    grouped_global.columns = [f"{c[0]}_{c[1]}" for c in grouped_global.columns.values]
    grouped_global['block_id'] = 'Overall'
    grouped_global = grouped_global.reset_index()
    
    # Aggregate BlockMedian (Median of the Block summaries)
    grouped_block_median = grouped_blocks.groupby(['participant_id', 'task_type']).median(numeric_only=True)
    grouped_block_median['block_id'] = 'BlockMedian'
    grouped_block_median = grouped_block_median.reset_index()
    
    return pd.concat([grouped_blocks, grouped_global, grouped_block_median], ignore_index=True)

def calculate_composite_scores(master_df):
    """
    Calculates Bradykinesia Composite Score relative to Healthy Controls baseline.
    """
    hc_mask = master_df['diagnosis'] != 'parkinsons'
    features = []
    
    # (Feature, direction: -1 if lower means worse bradykinesia, 1 if higher means worse)
    if 'drag_Overall_mean_speed_mean' in master_df.columns:
        features.append(('drag_Overall_mean_speed_median', -1))
    if 'tap_Overall_tap_frequency_mean' in master_df.columns:
        features.append(('tap_Overall_tap_frequency_median', -1))
    if 'drag_Overall_initiation_delay_mean' in master_df.columns:
        features.append(('drag_Overall_initiation_delay_median', 1))
        
    if not features:
        master_df['bradykinesia_composite'] = np.nan
        return master_df
        
    z_scores = []
    for f_name, direction in features:
        if hc_mask.sum() > 0:
            hc_mean = master_df.loc[hc_mask, f_name].mean()
            hc_std = master_df.loc[hc_mask, f_name].std()
        else:
            hc_mean = master_df[f_name].mean()
            hc_std = master_df[f_name].std()
            
        if hc_std == 0 or pd.isna(hc_std):
            hc_std = 1.0
                
        z = (master_df[f_name] - hc_mean) / hc_std
        z_scores.append(z * direction)
        
    master_df['bradykinesia_composite'] = np.nanmean(z_scores, axis=0)
    return master_df

def analyze_all(trials_df, participants_df):
    """
    Tier 2 Strategy
    """
    grouped_df = extract_all_features(trials_df)
    
    grouped_df['task_block'] = grouped_df['task_type'] + "_" + grouped_df['block_id']
    pivot_df = grouped_df.drop(columns=['task_type', 'block_id']).pivot(index='participant_id', columns='task_block')
    # Collapse multi-index
    pivot_df.columns = [f"{col[1]}_{col[0]}" if col[1] else col[0] for col in pivot_df.columns]
    pivot_df = pivot_df.reset_index()
    
    master = participants_df[['id', 'participant_code', 'participant_group', 'dominant_arm']].copy()
    master = master.rename(columns={'id': 'participant_id', 'participant_group': 'diagnosis'})
    master = master.merge(pivot_df, on='participant_id', how='left')
    
    # Drop artificial cross-pollinated columns (e.g. drag_akinetic_delay) that are entirely NaN
    master = master.dropna(axis=1, how='all')
    
    # Temporarily disconnecting to allow feature sweep to take priority
    # master = calculate_composite_scores(master)
    
    return master
