import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings('ignore') # Clean up plotting logs
from scipy.signal import savgol_filter, welch, butter, filtfilt, hilbert
from scipy.interpolate import interp1d

# Define a fallback wrapper for NumPy 2.0+ compatibility (trapz was removed in 2.0+)
np_trapezoid = getattr(np, 'trapezoid', getattr(np, 'trapz', None))

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
    Also extracts peak-to-peak amplitude (px, cm) and maps to MDS-UPDRS clinical grades.
    """
    # Clean input data (remove NaNs, infs, None)
    if times is None or coords is None or len(times) == 0 or len(coords) == 0:
        return np.nan, np.nan, np.nan, np.nan, np.nan, np.nan
        
    times = np.asarray(times)
    coords = np.asarray(coords)
    
    if len(coords.shape) != 2 or coords.shape[0] != len(times):
        return np.nan, np.nan, np.nan, np.nan, np.nan, np.nan
        
    valid_mask = np.isfinite(times) & np.all(np.isfinite(coords), axis=1)
    times = times[valid_mask]
    coords = coords[valid_mask]
    
    # Remove duplicate timestamps
    if len(times) > 0:
        times, unique_indices = np.unique(times, return_index=True)
        coords = coords[unique_indices]

    # Use 2-3 seconds as minimum duration threshold (2000 ms)
    if len(times) < 10 or (times[-1] - times[0]) < 2000:
        return np.nan, np.nan, np.nan, np.nan, np.nan, np.nan
        
    # Target uniform grid: 100 Hz (10ms steps). 
    # We hardcode 100 Hz because it satisfies the Nyquist theorem for frequencies up to 50 Hz, 
    # which easily covers and safely oversamples our target tremor band of 3-8 Hz.
    target_fs = 100.0
    uniform_times = np.arange(times[0], times[-1], 10.0)
    
    # Interpolate X and Y coordinates separately onto the uniform grid for 2D analysis
    f_x = interp1d(times, coords[:, 0], kind='linear', fill_value='extrapolate')
    f_y = interp1d(times, coords[:, 1], kind='linear', fill_value='extrapolate')
    uniform_x = f_x(uniform_times)
    uniform_y = f_y(uniform_times)
    
    # Check that interpolated coordinates contain no NaNs/infs
    if not np.all(np.isfinite(uniform_x)) or not np.all(np.isfinite(uniform_y)):
        return np.nan, np.nan, np.nan, np.nan, np.nan, np.nan
        
    uniform_x_zero = uniform_x - np.mean(uniform_x)
    uniform_y_zero = uniform_y - np.mean(uniform_y)
    
    # Calculate euclidean magnitude from center immediately (legacy compatibility)
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
        return np.nan, np.nan, np.nan, np.nan, np.nan, np.nan
        
    f_band = f[band_mask]
    Pxx_band = Pxx[band_mask]
    
    # Frequency corresponding to peak spectral power
    peak_idx = np.argmax(Pxx_band)
    tremor_freq = f_band[peak_idx]
    
    # Power Spectral Density (peak power) inside the clinical band
    tremor_power = Pxx_band[peak_idx]
    
    # Clinical amplitude is best estimated as the RMS amplitude in the tremor band.
    # This is calculated as the square root of the total area under the PSD curve (total band power).
    total_band_power = np_trapezoid(Pxx_band, f_band)
    tremor_amp_rms = np.sqrt(total_band_power)
    
    # Peak-to-peak amplitude (px) in the 3-8 Hz band via bandpass filtering X and Y coordinate signals
    try:
        if len(uniform_x) > 15:
            nyq = 0.5 * target_fs
            low = 3.0 / nyq
            high = 8.0 / nyq
            b, a = butter(2, [low, high], btype='band')
            filtered_x = filtfilt(b, a, uniform_x_zero)
            filtered_y = filtfilt(b, a, uniform_y_zero)
            
            # Combine 2D filtered signals to calculate the 2D magnitude of the tremor
            filtered_mag = np.sqrt(filtered_x**2 + filtered_y**2)
            
            # Trim the first and last 0.5s of the filtered signal to eliminate edge transients
            trim_boundary = int(target_fs * 0.5)
            if len(filtered_mag) > 2 * trim_boundary:
                trimmed_mag = filtered_mag[trim_boundary:-trim_boundary]
            else:
                trimmed_mag = filtered_mag
            
            # The peak-to-peak amplitude is twice the peak magnitude envelope
            tremor_amp_peak_px = np.max(trimmed_mag) * 2.0
        else:
            tremor_amp_peak_px = tremor_amp_rms * 2.828
    except Exception:
        tremor_amp_peak_px = tremor_amp_rms * 2.828
        
    # Convert pixels to centimeters using standard CSS layout definition: 96 px = 2.54 cm
    # We apply a calibration factor of 10 to represent hand-in-the-air visual equivalent
    tremor_amp_peak_cm = tremor_amp_peak_px * (2.54 / 96.0) * 10.0 if pd.notna(tremor_amp_peak_px) else np.nan
    
    # MDS-UPDRS Postural Tremor clinical grade mapping
    if pd.isna(tremor_amp_peak_cm):
        tremor_clinical_grade = np.nan
    elif tremor_amp_peak_cm == 0 or tremor_amp_peak_px < 1.0: # threshold for no tremor
        tremor_clinical_grade = 0.0
    elif tremor_amp_peak_cm < 1.0:
        tremor_clinical_grade = 1.0  # slight (< 1 cm equivalent)
    elif tremor_amp_peak_cm < 3.0:
        tremor_clinical_grade = 2.0  # mild (1-3 cm equivalent)
    elif tremor_amp_peak_cm < 10.0:
        tremor_clinical_grade = 3.0  # moderate (3-10 cm equivalent)
    else:
        tremor_clinical_grade = 4.0  # severe (>= 10 cm equivalent)
        
    # Incorporate slow postural drift distance
    drift_distance = np.sum(np.linalg.norm(np.diff(coords, axis=0), axis=1)) if len(coords) > 1 else 0.0
    drift_cm = drift_distance * (2.54 / 96.0)
    if pd.notna(drift_cm):
        if drift_cm < 0.5: # < 5 mm
            drift_grade = 0.0
        elif drift_cm < 1.0: # 5-10 mm
            drift_grade = 1.0
        elif drift_cm < 2.0: # 10-20 mm
            drift_grade = 2.0
        elif drift_cm < 4.0: # 20-40 mm
            drift_grade = 3.0
        else:
            drift_grade = 4.0
        tremor_clinical_grade = max(tremor_clinical_grade, drift_grade)
    
    return tremor_freq, tremor_power, tremor_amp_rms, tremor_amp_peak_px, tremor_amp_peak_cm, tremor_clinical_grade

def extract_kinetic_tremor(times, deviations):
    """
    Interpolates orthogonal deviations into a uniform timestamp geometry and applies Welch's PSD 
    to robustly calculate physiological kinetic tremor characteristics inside a 3-8 Hz target band.
    Also extracts peak-to-peak amplitude (px, cm) and maps to MDS-UPDRS clinical severity grades.
    """
    # Clean input data (remove NaNs, infs, None)
    if times is None or deviations is None or len(times) == 0 or len(deviations) == 0:
        return np.nan, np.nan, np.nan, np.nan, np.nan, np.nan
        
    times = np.asarray(times)
    deviations = np.asarray(deviations)
    
    if len(deviations) != len(times):
        return np.nan, np.nan, np.nan, np.nan, np.nan, np.nan
        
    valid_mask = np.isfinite(times) & np.isfinite(deviations)
    times = times[valid_mask]
    deviations = deviations[valid_mask]
    
    # Remove duplicate timestamps
    if len(times) > 0:
        times, unique_indices = np.unique(times, return_index=True)
        deviations = deviations[unique_indices]

    # Use 300 ms as minimum duration threshold for drag movements
    if len(times) < 6 or (times[-1] - times[0]) < 300:
        return np.nan, np.nan, np.nan, np.nan, np.nan, np.nan
        
    target_fs = 100.0
    uniform_times = np.arange(times[0], times[-1], 10.0)
    
    # Interpolate non-uniform touch events onto stable baseline 
    f_interp = interp1d(times, deviations, kind='linear', fill_value='extrapolate')
    uniform_deviations = f_interp(uniform_times)
    
    # Check that interpolated deviations contain no NaNs/infs
    if not np.all(np.isfinite(uniform_deviations)):
        return np.nan, np.nan, np.nan, np.nan, np.nan, np.nan
        
    # Remove DC offset (zero mean)
    uniform_deviations_zero = uniform_deviations - np.mean(uniform_deviations)
    
    # Calculate PSD using Welch's method
    f, Pxx = welch(uniform_deviations_zero, fs=target_fs, nperseg=min(len(uniform_deviations_zero), int(target_fs * 1.5)))
    
    # Isolate clinical Tremor Band (Postural + Resting Action typically 3-8 Hz)
    band_mask = (f >= 3.0) & (f <= 8.0)
    
    if not np.any(band_mask):
        return np.nan, np.nan, np.nan, np.nan, np.nan, np.nan
        
    f_band = f[band_mask]
    Pxx_band = Pxx[band_mask]
    
    # Frequency corresponding to peak spectral power
    peak_idx = np.argmax(Pxx_band)
    tremor_freq = f_band[peak_idx]
    
    # Power Spectral Density (peak power) inside the clinical band
    tremor_power = Pxx_band[peak_idx]
    
    # Clinical amplitude is best estimated as the RMS amplitude in the tremor band.
    total_band_power = np_trapezoid(Pxx_band, f_band)
    tremor_amp_rms = np.sqrt(total_band_power)
    
    # Peak-to-peak amplitude (px) in the 3-8 Hz band via bandpass filtering and Hilbert envelope
    try:
        if len(uniform_deviations_zero) > 15:
            nyq = 0.5 * target_fs
            low = 3.0 / nyq
            high = 8.0 / nyq
            b, a = butter(2, [low, high], btype='band')
            filtered_dev = filtfilt(b, a, uniform_deviations_zero)
            
            # Trim the first and last 0.5s of the filtered signal to eliminate edge transients
            trim_boundary = int(target_fs * 0.5)
            if len(filtered_dev) > 2 * trim_boundary:
                trimmed_dev = filtered_dev[trim_boundary:-trim_boundary]
            else:
                trimmed_dev = filtered_dev
                
            # Hilbert envelope peak
            analytic_sig = hilbert(trimmed_dev)
            env = np.abs(analytic_sig)
            tremor_amp_peak_px = np.max(env) * 2.0
        else:
            tremor_amp_peak_px = tremor_amp_rms * 2.828
    except Exception:
        tremor_amp_peak_px = tremor_amp_rms * 2.828
        
    # Convert pixels to centimeters using standard CSS layout definition: 96 px = 2.54 cm
    # We apply a calibration factor of 10 to represent hand-in-the-air visual equivalent
    tremor_amp_peak_cm = tremor_amp_peak_px * (2.54 / 96.0) * 10.0 if pd.notna(tremor_amp_peak_px) else np.nan
    
    # MDS-UPDRS Kinetic Tremor clinical grade mapping
    if pd.isna(tremor_amp_peak_cm):
        tremor_clinical_grade = np.nan
    elif tremor_amp_peak_cm == 0 or tremor_amp_peak_px < 1.0: # threshold for no tremor
        tremor_clinical_grade = 0.0
    elif tremor_amp_peak_cm < 1.0:
        tremor_clinical_grade = 1.0  # slight (< 1 cm equivalent)
    elif tremor_amp_peak_cm < 3.0:
        tremor_clinical_grade = 2.0  # mild (1-3 cm equivalent)
    elif tremor_amp_peak_cm < 10.0:
        tremor_clinical_grade = 3.0  # moderate (3-10 cm equivalent)
    else:
        tremor_clinical_grade = 4.0  # severe (>= 10 cm equivalent)
        
    return tremor_freq, tremor_power, tremor_amp_rms, tremor_amp_peak_px, tremor_amp_peak_cm, tremor_clinical_grade

def calculate_tapping_impairment_grade(freq, ratio, halts_count, double_taps_count, hesitations_count, mean_amp_mm, is_pinch=False):
    """
    Translates quantitative tapping/pinching metrics into an estimated MDS-UPDRS Item 3.4
    clinical impairment grade (0 to 4) based on slowing, interruptions/halts, and amplitude decrement.
    """
    if pd.isna(freq):
        return np.nan
        
    # 1. Speed (Slowing) Grade
    if freq >= 4.5:
        grade_slowing = 0.0
    elif freq >= 3.5:
        grade_slowing = 1.0  # Slight slowing
    elif freq >= 2.5:
        grade_slowing = 2.0  # Mild slowing
    elif freq >= 1.5:
        grade_slowing = 3.0  # Moderate slowing
    else:
        grade_slowing = 4.0  # Severe slowing
        
    # 2. Rhythm (Interruptions / Freezes) Grade
    total_halts = halts_count if pd.notna(halts_count) else 0
    total_doubles = double_taps_count if pd.notna(double_taps_count) else 0
    total_interruptions = total_halts + total_doubles
    total_hesitations = hesitations_count if pd.notna(hesitations_count) else 0
    
    if total_interruptions == 0 and total_hesitations == 0:
        grade_rhythm = 0.0
    elif (1 <= (total_interruptions + total_hesitations) <= 2):
        grade_rhythm = 1.0  # Slight: 1-2 hesitations or interruptions
    elif 3 <= total_interruptions <= 5:
        grade_rhythm = 2.0  # Mild: 3-5 interruptions
    elif total_interruptions > 5 or total_halts >= 1:
        grade_rhythm = 3.0  # Moderate: > 5 interruptions or at least one freeze
    else:
        grade_rhythm = 0.0
        
    # 3. Amplitude Decrement Grade
    if pd.isna(ratio):
        grade_decrement = 0.0
    elif ratio >= 0.85:
        grade_decrement = 0.0
    elif ratio >= 0.70:
        grade_decrement = 1.0  # Slight: decrements near the end
    elif ratio >= 0.50:
        grade_decrement = 2.0  # Mild: decrements midway
    elif ratio >= 0.30:
        grade_decrement = 3.0  # Moderate: decrements early
    else:
        grade_decrement = 4.0  # Severe: extreme reduction
        
    # Overall MDS-UPDRS Grade is the maximum of any criteria met (the "Any of the following" rule)
    overall_grade = max(grade_slowing, grade_rhythm, grade_decrement)
    
    # 4. Severe Override (barely able to perform task)
    if freq < 1.0 or total_halts >= 3:
        overall_grade = 4.0
    elif is_pinch and (pd.notna(mean_amp_mm) and mean_amp_mm < 8.0):
        overall_grade = 4.0
        
    return overall_grade

def calculate_drag_impairment_grade(mean_speed, ratio, halts_count, hesitations_count, movement_time_ms):
    """
    Translates quantitative drag metrics into an estimated MDS-UPDRS Item 3.5
    clinical impairment grade (0 to 4) based on slowing, interruptions/halts, and amplitude decrement.
    """
    if pd.isna(mean_speed):
        return np.nan
        
    mean_speed_mm = mean_speed * (25.4 / 96.0)
    
    # 1. Speed (Slowing) Grade
    if mean_speed_mm >= 250.0:
        grade_slowing = 0.0
    elif mean_speed_mm >= 200.0:
        grade_slowing = 1.0  # Slight slowing
    elif mean_speed_mm >= 150.0:
        grade_slowing = 2.0  # Mild slowing
    elif mean_speed_mm >= 100.0:
        grade_slowing = 3.0  # Moderate slowing
    else:
        grade_slowing = 4.0  # Severe slowing
        
    # 2. Rhythm (Interruptions / Freezes) Grade
    total_halts = halts_count if pd.notna(halts_count) else 0
    total_hesitations = hesitations_count if pd.notna(hesitations_count) else 0
    total_interruptions = total_halts + total_hesitations
    
    if total_interruptions == 0:
        grade_rhythm = 0.0
    elif 1 <= total_interruptions <= 2:
        grade_rhythm = 1.0  # Slight: 1-2 hesitations or interruptions
    elif 3 <= total_interruptions <= 5:
        grade_rhythm = 2.0  # Mild: 3-5 interruptions
    elif total_interruptions > 5 or total_halts >= 1:
        grade_rhythm = 3.0  # Moderate: > 5 interruptions or at least one freeze
    else:
        grade_rhythm = 0.0
        
    # 3. Amplitude Decrement Grade
    if pd.isna(ratio):
        grade_decrement = 0.0
    elif ratio >= 0.85:
        grade_decrement = 0.0
    elif ratio >= 0.70:
        grade_decrement = 1.0  # Slight decrement
    elif ratio >= 0.50:
        grade_decrement = 2.0  # Mild decrement
    elif ratio >= 0.30:
        grade_decrement = 3.0  # Moderate decrement
    else:
        grade_decrement = 4.0  # Severe decrement
        
    overall_grade = max(grade_slowing, grade_rhythm, grade_decrement)
    
    # 4. Severe Override
    if mean_speed_mm < 50.0 or (pd.notna(movement_time_ms) and movement_time_ms > 10000.0) or total_halts >= 3:
        overall_grade = 4.0
        
    return overall_grade

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
            
        valid_pts = [
            pt for pt in traj 
            if 't' in pt and pt.get('t') is not None and
               'x' in pt and pt.get('x') is not None and
               'y' in pt and pt.get('y') is not None
        ]
        if len(valid_pts) < 2:
            return pd.Series(dtype=float)
            
        times = np.array([pt['t'] for pt in valid_pts], dtype=float)
        coords = np.array([[pt['x'], pt['y']] for pt in valid_pts], dtype=float)
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
        t_r = row.get('target_radius')
        
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
            
            fitts_law_id = np.nan
            fitts_law_throughput = np.nan
            
            if pd.notna(t_r) and t_r > 0 and task_axis_dist > 0:
                # Fitts's Law: ID = log2(2 * D / W)
                w = t_r * 2
                fitts_law_id = np.log2((2 * task_axis_dist) / w)
                
                movement_time_s = row.get('movement_time_ms', 0) / 1000.0
                if movement_time_s > 0:
                    fitts_law_throughput = fitts_law_id / movement_time_s
            
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
                k_freq, k_power, k_amp, k_amp_peak_px, k_amp_peak_cm, k_clinical_grade = extract_kinetic_tremor(times, signed_dists)
                
                # Deviation Decrement of deviations along the task path (using median)
                abs_dists = np.abs(signed_dists)
                if len(abs_dists) > 1:
                    drag_deviation_slope = np.polyfit(np.arange(len(abs_dists)), abs_dists, 1)[0]
                else:
                    drag_deviation_slope = 0.0
                
                drag_median_deviation = np.median(abs_dists) if len(abs_dists) > 0 else np.nan

                # Achieved drag amplitude along the ideal target axis
                if len(coords) > 0 and pd.notna(t_x) and pd.notna(t_y) and task_axis_dist > 0:
                    unit_axis = (target_pt - start_pt) / task_axis_dist
                    projections = [np.dot(pt - start_pt, unit_axis) for pt in coords]
                    drag_amplitude = max(projections) if len(projections) > 0 else np.nan
                else:
                    drag_amplitude = np.nan

                half_len = len(abs_dists) // 2
                if half_len > 0:
                    first_half_med = np.median(abs_dists[:half_len])
                    second_half_med = np.median(abs_dists[half_len:])
                    drag_deviation_decrement_ratio = second_half_med / first_half_med if first_half_med > 0 else np.nan
                else:
                    drag_deviation_decrement_ratio = np.nan

                # Speed Decrement along the task path
                drag_speed_slope = 0.0
                drag_speed_decrement_ratio = np.nan
                if len(vel) > 0:
                    if len(vel) > 1:
                        drag_speed_slope = np.polyfit(np.arange(len(vel)), vel, 1)[0]
                    half_vel = len(vel) // 2
                    if half_vel > 0:
                        first_half_med_v = np.median(vel[:half_vel])
                        second_half_med_v = np.median(vel[half_vel:])
                        drag_speed_decrement_ratio = second_half_med_v / first_half_med_v if first_half_med_v > 0 else np.nan
            else:
                drag_median_deviation = np.nan
                drag_amplitude = np.nan
                movement_variability = np.nan
                max_deviation = np.nan
                movement_error = np.nan
                task_axis_crossings_count = np.nan
                k_freq = np.nan
                k_power = np.nan
                k_amp = np.nan
                k_amp_peak_px = np.nan
                k_amp_peak_cm = np.nan
                k_clinical_grade = np.nan
                drag_deviation_slope = np.nan
                drag_deviation_decrement_ratio = np.nan
        else:
            movement_variability = np.nan
            max_deviation = np.nan
            movement_error = np.nan
            task_axis_crossings_count = np.nan
            k_freq = np.nan
            k_power = np.nan
            k_amp = np.nan
            k_amp_peak_px = np.nan
            k_amp_peak_cm = np.nan
            k_clinical_grade = np.nan
            fitts_law_id = np.nan
            fitts_law_throughput = np.nan
            drag_deviation_slope = np.nan
            drag_deviation_decrement_ratio = np.nan
            drag_amplitude = np.nan
            
        # Velocity / Pauses / Hesitations / Halts
        mean_speed = np.mean(vel) if len(vel) > 0 else np.nan
        median_speed = np.median(vel) if len(vel) > 0 else np.nan
        peak_speed = np.max(vel) if len(vel) > 0 else np.nan
        
        # Hesitations (velocity drops below 30% of median speed for >= 100ms)
        hesitations_count = 0
        hesitations_duration = 0.0
        if len(vel) > 0 and pd.notna(median_speed) and median_speed > 0:
            hes_threshold = 0.3 * median_speed
            hes_mask = vel < hes_threshold
            padded_hes = np.concatenate(([False], hes_mask, [False]))
            diffs_hes = np.diff(padded_hes.astype(int))
            starts_hes = np.where(diffs_hes == 1)[0]
            ends_hes = np.where(diffs_hes == -1)[0]
            for s, e in zip(starts_hes, ends_hes):
                duration = times[e] - times[s]
                if duration >= 100:
                    hesitations_count += 1
                    hesitations_duration += duration
                    
        # Halts (movement stops: velocity drops below 5% of median speed for >= 250ms)
        halts_count = 0
        halts_duration = 0.0
        if len(vel) > 0 and pd.notna(median_speed) and median_speed > 0:
            halt_threshold = 0.05 * median_speed
            halt_mask = vel < halt_threshold
            padded_halt = np.concatenate(([False], halt_mask, [False]))
            diffs_halt = np.diff(padded_halt.astype(int))
            starts_halt = np.where(diffs_halt == 1)[0]
            ends_halt = np.where(diffs_halt == -1)[0]
            for s, e in zip(starts_halt, ends_halt):
                duration = times[e] - times[s]
                if duration >= 250:
                    halts_count += 1
                    halts_duration += duration

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
            
            target_reached = np.nan
            if pd.notna(t_r) and t_r > 0:
                target_reached = 1.0 if endpoint_deviation_error <= t_r else 0.0
            
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
            target_reached = np.nan

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
            'drag_tremor_amplitude_peak_px': k_amp_peak_px,
            'drag_tremor_amplitude_peak_cm': k_amp_peak_cm,
            'drag_tremor_clinical_grade': max(
                k_clinical_grade if pd.notna(k_clinical_grade) else 0.0,
                0.0 if not pd.notna(path_eff) else (
                    0.0 if path_eff >= 0.98 else
                    1.0 if path_eff >= 0.95 else
                    2.0 if path_eff >= 0.90 else
                    3.0 if path_eff >= 0.80 else 4.0
                )
            ),
            'drag_deviation_slope': drag_deviation_slope,
            'drag_deviation_decrement_ratio': drag_deviation_decrement_ratio,
            'drag_speed_slope': drag_speed_slope,
            'drag_speed_decrement_ratio': drag_speed_decrement_ratio,
            'drag_median_deviation': drag_median_deviation,
            'drag_amplitude': drag_amplitude,
            'initial_targeting_error': initial_targeting_error,
            'endpoint_deviation_error': endpoint_deviation_error,
            'endpoint_abs_deviation_error': endpoint_abs_deviation_error,
            'target_reached': target_reached,
            'mean_speed': mean_speed,
            'median_speed': median_speed,
            'peak_speed_ms': peak_speed,
            'drag_speed_cv': np.std(vel) / mean_speed if mean_speed > 0 else np.nan,
            'drag_hesitations_count': hesitations_count,
            'drag_hesitations_duration_ms': hesitations_duration,
            'drag_halts_count': halts_count,
            'drag_halts_duration_ms': halts_duration,
            'mean_acceleration': mean_accel,
            'mean_abs_jerk': mean_abs_jerk,
            'peak_jerk': peak_jerk,
            'pause_count': pause_count,
            'longest_pause_duration': longest_pause_duration,
            'initiation_delay': row.get('initiation_delay'),
            'movement_time_ms': row.get('movement_time_ms'),
            'fitts_law_id': fitts_law_id,
            'fitts_law_throughput': fitts_law_throughput,
            'drag_clinical_impairment_grade': calculate_drag_impairment_grade(mean_speed, drag_deviation_decrement_ratio, halts_count, hesitations_count, row.get('movement_time_ms'))
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
        
        # Accuracy
        if len(taps) > 0 and 'is_inside_target' not in taps[0]:
            # Legacy data: misses were filtered out on the frontend
            tap_accuracy = 1.0
        else:
            hits = sum(1 for pt in taps if pt.get('is_inside_target') is True)
            tap_accuracy = hits / tap_count if tap_count > 0 else np.nan
        
        # Spatial SD (spread of taps)
        if len(coords) > 2:
            centroid = np.mean(coords, axis=0)
            dists = np.linalg.norm(coords - centroid, axis=1)
            spatial_sd = np.std(dists)
        else:
            spatial_sd = np.nan

        # 1. Amplitude (Euclidean distance between successive taps)
        amplitudes = []
        for i in range(1, len(taps)):
            t_curr = taps[i]
            t_prev = taps[i-1]
            if 'amplitude' in t_curr and t_curr['amplitude'] is not None:
                amplitudes.append(t_curr['amplitude'])
            elif 'x' in t_curr and 'x' in t_prev and 'y' in t_curr and 'y' in t_prev:
                dx = t_curr['x'] - t_prev['x']
                dy = t_curr['y'] - t_prev['y']
                amplitudes.append(np.sqrt(dx**2 + dy**2))
            else:
                amplitudes.append(np.linalg.norm(np.array([t_curr.get('x', 0), t_curr.get('y', 0)]) - 
                                                np.array([t_prev.get('x', 0), t_prev.get('y', 0)])))
        
        amplitudes = np.array(amplitudes)
        median_amplitude = np.median(amplitudes) if len(amplitudes) > 0 else np.nan

        # 2. Decrementing Amplitude
        # Amplitude slope (change in amplitude per tap index)
        if len(amplitudes) > 1:
            amplitude_slope = np.polyfit(np.arange(len(amplitudes)), amplitudes, 1)[0]
        else:
            amplitude_slope = 0.0

        # Amplitude decrement ratio (ratio of median of last 3 taps to median of first 3 taps)
        if len(amplitudes) >= 6:
            first_3 = np.median(amplitudes[:3])
            last_3 = np.median(amplitudes[-3:])
            amplitude_decrement_ratio = last_3 / first_3 if first_3 > 0 else np.nan
        elif len(amplitudes) >= 2:
            amplitude_decrement_ratio = amplitudes[-1] / amplitudes[0] if amplitudes[0] > 0 else np.nan
        else:
            amplitude_decrement_ratio = np.nan

        # Speed Decrement (progressive intertap slowing)
        if len(intertap) > 1:
            tap_speed_slope = np.polyfit(np.arange(len(intertap)), intertap, 1)[0]
        else:
            tap_speed_slope = 0.0

        if len(intertap) >= 6:
            first_3_it = np.median(intertap[:3])
            last_3_it = np.median(intertap[-3:])
            tap_speed_decrement_ratio = last_3_it / first_3_it if first_3_it > 0 else np.nan
        elif len(intertap) >= 2:
            tap_speed_decrement_ratio = intertap[-1] / intertap[0] if intertap[0] > 0 else np.nan
        else:
            tap_speed_decrement_ratio = np.nan

        # 3. Hesitations & Halts
        hesitations = 0
        hesitations_duration = 0.0
        halts = 0
        halts_duration = 0.0
        # 3. Hesitations & Halts (Dynamic rhythm-based, relative to subject's own median)
        med_intertap = np.median(intertap) if len(intertap) > 0 else np.nan
        if len(intertap) > 0 and pd.notna(med_intertap) and med_intertap > 0:
            for iti in intertap:
                if iti > 2.0 * med_intertap:
                    halts += 1
                    halts_duration += iti
                elif iti > 1.5 * med_intertap:
                    hesitations += 1
                    hesitations_duration += iti

        # 4. Double Taps (Sequence violations)
        double_taps = 0
        y_coords = [t['y'] for t in taps if 'y' in t]
        if y_coords:
            y_min, y_max = min(y_coords), max(y_coords)
            y_mid = (y_min + y_max) / 2
            if (y_max - y_min) > 100:
                for i in range(1, len(taps)):
                    y1 = taps[i-1]['y']
                    y2 = taps[i]['y']
                    is_top1 = y1 < y_mid
                    is_top2 = y2 < y_mid
                    if is_top1 == is_top2:
                        double_taps += 1

        # 5. Interruptions
        interruptions = halts + double_taps

        # 6. Kinetic Tremor from touch trajectory (reaching and touch phases)
        k_freq = np.nan
        k_power = np.nan
        k_amp = np.nan
        k_amp_peak_px = np.nan
        k_amp_peak_cm = np.nan
        k_clinical_grade = np.nan
        
        traj = row.get('trajectory', [])
        if isinstance(traj, list) and len(traj) >= 10:
            traj_times = np.array([pt['t'] for pt in traj if 't' in pt])
            traj_coords = np.array([[pt['x'], pt['y']] for pt in traj if 'x' in pt and 'y' in pt])
            if len(traj_times) >= 10 and (traj_times[-1] - traj_times[0]) >= 2000:
                k_freq, k_power, k_amp, k_amp_peak_px, k_amp_peak_cm, k_clinical_grade = extract_tremor(traj_times, traj_coords)
            
        return pd.Series({
            'tap_count': tap_count,
            'tap_frequency': freq,
            'mean_intertap_interval_ms': mean_intertap,
            'cv_intertap_interval': cv_intertap,
            'tap_spatial_sd': spatial_sd,
            'tap_accuracy': tap_accuracy,
            'initiation_delay': row.get('initiation_delay'),
            'median_amplitude_px': median_amplitude,
            'median_amplitude_mm': median_amplitude * (25.4 / 96.0) if pd.notna(median_amplitude) else np.nan,
            'amplitude_slope': amplitude_slope,
            'amplitude_slope_mm': amplitude_slope * (25.4 / 96.0) if pd.notna(amplitude_slope) else np.nan,
            'amplitude_decrement_ratio': amplitude_decrement_ratio,
            'tap_speed_slope': tap_speed_slope,
            'tap_speed_decrement_ratio': tap_speed_decrement_ratio,
            'hesitations_count': hesitations,
            'hesitations_duration_ms': hesitations_duration,
            'halts_count': halts,
            'halts_duration_ms': halts_duration,
            'double_taps_count': double_taps,
            'interruptions_count': interruptions,
            'tap_tremor_frequency_hz': k_freq,
            'tap_tremor_power': k_power,
            'tap_tremor_amplitude': k_amp,
            'tap_tremor_amplitude_peak_px': k_amp_peak_px,
            'tap_tremor_amplitude_peak_mm': k_amp_peak_px * (25.4 / 96.0) if pd.notna(k_amp_peak_px) else np.nan,
            'tap_tremor_clinical_grade': k_clinical_grade,
            'tap_clinical_impairment_grade': calculate_tapping_impairment_grade(freq, amplitude_decrement_ratio, halts, double_taps, hesitations, median_amplitude * (25.4 / 96.0) if pd.notna(median_amplitude) else np.nan)
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
        tremor_freq, tremor_power, tremor_amp, tremor_amp_peak_px, tremor_amp_peak_cm, tremor_clinical_grade = extract_tremor(times, coords)
        
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
            'hold_tremor_amplitude_peak_px': tremor_amp_peak_px,
            'hold_tremor_amplitude_peak_cm': tremor_amp_peak_cm,
            'hold_tremor_clinical_grade': tremor_clinical_grade,
            'hold_mean_force': np.mean(forces) if force_valid else np.nan,
            'hold_max_force': np.max(forces) if force_valid else np.nan,
            'hold_force_variability': np.std(forces) if force_valid else np.nan,
            'hold_force_range': (np.max(forces) - np.min(forces)) if force_valid else np.nan,
            'hold_force_median': np.median(forces) if force_valid else np.nan,
            'hold_force_valid': force_valid,
            'akinetic_delay_hold': row.get('akinetic_delay_hold'),
            'initiation_delay': row.get('initiation_delay')
        })
    elif task == 'pinch':
        traj = row.get('trajectory', [])
        if not isinstance(traj, list) or len(traj) < 5:
            return pd.Series(dtype=float)
            
        valid_points = [
            pt for pt in traj 
            if 't' in pt and pt.get('t') is not None and 
               'distance' in pt and pt.get('distance') is not None
        ]
        if len(valid_points) < 5:
            return pd.Series(dtype=float)
            
        times = np.array([pt['t'] for pt in valid_points], dtype=float)
        distances = np.array([pt['distance'] for pt in valid_points], dtype=float)
        
        valid_mask = np.isfinite(times) & np.isfinite(distances)
        times = times[valid_mask]
        distances = distances[valid_mask]
        
        if len(times) < 5:
            return pd.Series(dtype=float)
            
        # Smooth distances
        if len(distances) >= 5:
            distances_smooth = savgol_filter(distances, 5, 2)
        else:
            distances_smooth = distances
            
        from scipy.signal import find_peaks
        
        # Find peaks (spreads) & valleys (pinches)
        sig_range = np.max(distances_smooth) - np.min(distances_smooth)
        prominence = max(10.0, 0.1 * sig_range) if sig_range > 0 else 10.0
        
        peaks, _ = find_peaks(distances_smooth, prominence=prominence, distance=10)
        valleys, _ = find_peaks(-distances_smooth, prominence=prominence, distance=10)
        
        # Chronological matching
        all_events = []
        for p in peaks:
            all_events.append((times[p], 'peak', distances_smooth[p]))
        for v in valleys:
            all_events.append((times[v], 'valley', distances_smooth[v]))
        all_events.sort(key=lambda x: x[0])
        
        cycle_amplitudes = []
        for i in range(len(all_events) - 1):
            e_curr = all_events[i]
            e_next = all_events[i+1]
            if (e_curr[1] == 'peak' and e_next[1] == 'valley') or (e_curr[1] == 'valley' and e_next[1] == 'peak'):
                cycle_amplitudes.append(abs(e_curr[2] - e_next[2]))
                
        cycle_intervals = np.diff(times[peaks]) if len(peaks) > 1 else np.array([])
        
        # Speed & intervals
        cycle_count = len(peaks)
        duration_ms = times[-1] - times[0] if len(times) > 1 else 0
        freq = (cycle_count / (duration_ms / 1000.0)) if duration_ms > 0 else np.nan
        
        mean_interval = np.mean(cycle_intervals) if len(cycle_intervals) > 0 else np.nan
        cv_interval = (np.std(cycle_intervals) / mean_interval) if mean_interval > 0 else np.nan
        median_amplitude = np.median(cycle_amplitudes) if len(cycle_amplitudes) > 0 else np.nan
        
        # Decrement
        if len(cycle_amplitudes) > 1:
            amplitude_slope = np.polyfit(np.arange(len(cycle_amplitudes)), cycle_amplitudes, 1)[0]
        else:
            amplitude_slope = 0.0
            
        if len(cycle_amplitudes) >= 6:
            first_3 = np.median(cycle_amplitudes[:3])
            last_3 = np.median(cycle_amplitudes[-3:])
            amplitude_decrement_ratio = last_3 / first_3 if first_3 > 0 else np.nan
        elif len(cycle_amplitudes) >= 2:
            amplitude_decrement_ratio = cycle_amplitudes[-1] / cycle_amplitudes[0] if cycle_amplitudes[0] > 0 else np.nan
        else:
            amplitude_decrement_ratio = np.nan

        # Speed Decrement (progressive inter-cycle slowing)
        if len(cycle_intervals) > 1:
            pinch_speed_slope = np.polyfit(np.arange(len(cycle_intervals)), cycle_intervals, 1)[0]
        else:
            pinch_speed_slope = 0.0

        if len(cycle_intervals) >= 6:
            first_3_pi = np.median(cycle_intervals[:3])
            last_3_pi = np.median(cycle_intervals[-3:])
            pinch_speed_decrement_ratio = last_3_pi / first_3_pi if first_3_pi > 0 else np.nan
        elif len(cycle_intervals) >= 2:
            pinch_speed_decrement_ratio = cycle_intervals[-1] / cycle_intervals[0] if cycle_intervals[0] > 0 else np.nan
        else:
            pinch_speed_decrement_ratio = np.nan
            
        # Hesitations & Halts (Dynamic rhythm-based, relative to subject's own median)
        med_cycle = np.median(cycle_intervals) if len(cycle_intervals) > 0 else np.nan
        hesitations = 0
        hesitations_duration = 0.0
        halts = 0
        halts_duration = 0.0
        if len(cycle_intervals) > 0 and pd.notna(med_cycle) and med_cycle > 0:
            for iti in cycle_intervals:
                if iti > 2.0 * med_cycle:
                    halts += 1
                    halts_duration += iti
                elif iti > 1.5 * med_cycle:
                    hesitations += 1
                    hesitations_duration += iti

        # Pinch Lift-Offs (touch interruptions)
        pinch_lifts_count = 0
        pinch_lifts_duration_ms = 0.0
        if len(times) > 1:
            gaps = np.diff(times)
            med_dt = np.median(gaps) if len(gaps) > 0 else 16.6
            lift_threshold = 10.0 * med_dt
            
            lift_gaps = gaps[gaps > lift_threshold]
            pinch_lifts_count = len(lift_gaps)
            pinch_lifts_duration_ms = float(np.sum(lift_gaps))
            
        pinch_mean_lift_duration_ms = (pinch_lifts_duration_ms / pinch_lifts_count) if pinch_lifts_count > 0 else 0.0
                    
        return pd.Series({
            'pinch_duration_ms': row.get('total_tap_time_ms', duration_ms),
            'pinch_count': cycle_count,
            'pinch_frequency': freq,
            'mean_pinch_interval_ms': mean_interval,
            'cv_pinch_interval': cv_interval,
            'median_pinch_amplitude_px': median_amplitude,
            'median_pinch_amplitude_mm': median_amplitude * (25.4 / 96.0) if pd.notna(median_amplitude) else np.nan,
            'pinch_amplitude_slope': amplitude_slope,
            'pinch_amplitude_slope_mm': amplitude_slope * (25.4 / 96.0) if pd.notna(amplitude_slope) else np.nan,
            'pinch_amplitude_decrement_ratio': amplitude_decrement_ratio,
            'pinch_speed_slope': pinch_speed_slope,
            'pinch_speed_decrement_ratio': pinch_speed_decrement_ratio,
            'pinch_hesitations_count': hesitations,
            'pinch_hesitations_duration_ms': hesitations_duration,
            'pinch_halts_count': halts,
            'pinch_halts_duration_ms': halts_duration,
            'pinch_lifts_count': pinch_lifts_count,
            'pinch_lifts_duration_ms': pinch_lifts_duration_ms,
            'pinch_mean_lift_duration_ms': pinch_mean_lift_duration_ms,
            'initiation_delay': row.get('initiation_delay', 0),
            'pinch_clinical_impairment_grade': calculate_tapping_impairment_grade(freq, amplitude_decrement_ratio, halts, 0, hesitations, median_amplitude * (25.4 / 96.0) if pd.notna(median_amplitude) else np.nan, is_pinch=True)
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
