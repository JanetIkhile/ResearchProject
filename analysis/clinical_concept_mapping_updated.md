# Quantitative Clinical Concept Feature Evaluation Report

This report aggregates digital motor features across the **Tapping, Drag, Pinch, and Hold** tasks, grouping them by clinical concepts to select the strongest candidate measures based on clinical scores.

## Clinical Cohort Profile

| Participant | MDS-UPDRS Total | Bradykinesia Subscore | Tremor Subscore | Clinical Subtype |
| :--- | :---: | :---: | :---: | :--- |
| **P03** | 17 | 6 | 5 | AR |
| **P04** | 28 | 8 | 9 | Indeterminate |

---

# Stage 1: Clinical Concept Mapping Registry
Below are the pre-defined clinical concepts and all candidate digital features mapped under each concept across the 4 tasks:

* **Bradykinesia**:
  * Tapping Frequency (Hz) (Tap Task)
  * Mean Intertap Interval (ms) (Tap Task)
  * Drag Mean Speed (px/s) (Drag Task)
  * Drag Median Speed (px/s) (Drag Task)
  * Drag Peak Speed (px/s) (Drag Task)
  * Drag Movement Time (ms) (Drag Task)
  * Drag Fitts Throughput (bits/s) (Drag Task)
  * Pinch Cycle Frequency (Hz) (Pinch Task)
  * Mean Pinch Interval (ms) (Pinch Task)
  * Pinch Mean Opening Speed (mm/s) (Pinch Task)
  * Pinch Median Opening Speed (mm/s) (Pinch Task)
  * Pinch Max Opening Velocity (mm/s) (Pinch Task)

* **Hypokinesia**:
  * Median Tapping Amplitude (mm) (Tap Task)
  * Tapping Spatial Spread (px) (Tap Task)
  * Drag Terminal Overshoot/Undershoot (px) (Drag Task)
  * Drag Target Reached Rate (Drag Task)
  * Median Pinch Amplitude (mm) (Pinch Task)

* **Sequence effect**:
  * Tapping Amplitude Decrement Ratio (Tap Task)
  * Tapping Amplitude Slope (mm/tap) (Tap Task)
  * Tapping Speed Decrement Ratio (Tap Task)
  * Tapping Speed Slope (ms/tap) (Tap Task)
  * Drag Path Deviation Decrement Ratio (Drag Task)
  * Drag Path Deviation Slope (Drag Task)
  * Drag Speed Decrement Ratio (Drag Task)
  * Drag Speed Slope (px/s per step) (Drag Task)
  * Drag Across-Trial Speed Decrement Ratio (Drag Task)
  * Drag Across-Trial Speed Slope (Drag Task)
  * Drag Across-Trial Amplitude Decrement Ratio (Drag Task)
  * Drag Across-Trial Amplitude Slope (Drag Task)
  * Drag Across-Trial Path Deviation Decrement Ratio (Drag Task)
  * Drag Across-Trial Path Deviation Slope (Drag Task)
  * Drag Across-Trial Within-Trial Speed Decay Ratio (Drag Task)
  * Drag Across-Trial Within-Trial Speed Decay Slope (Drag Task)
  * Drag Across-Trial Within-Trial Deviation Decay Ratio (Drag Task)
  * Drag Across-Trial Within-Trial Deviation Decay Slope (Drag Task)
  * Pinch Amplitude Decrement Ratio (Pinch Task)
  * Pinch Amplitude Slope (mm/cycle) (Pinch Task)
  * Pinch Speed Decrement Ratio (Pinch Task)
  * Pinch Speed Slope (ms/cycle) (Pinch Task)

* **Hesitations halts**:
  * Tapping Hesitations Count (Tap Task)
  * Tapping Hesitations Duration (ms) (Tap Task)
  * Tapping Halts Count (Tap Task)
  * Tapping Halts Duration (ms) (Tap Task)
  * Tapping Rhythm CV (Tap Task)
  * Tapping Double Taps Count (Tap Task)
  * Tapping Interruptions Count (Tap Task)
  * Drag Hesitations Count (Drag Task)
  * Drag Hesitations Duration (ms) (Drag Task)
  * Drag Halts Count (Drag Task)
  * Drag Halts Duration (ms) (Drag Task)
  * Drag Speed CV (Drag Task)
  * Drag Pause Count (Drag Task)
  * Drag Longest Pause (ms) (Drag Task)
  * Drag Across-Trial Hesitations Decrement Ratio (Drag Task)
  * Drag Across-Trial Hesitations Slope (Drag Task)
  * Pinch Hesitations Count (Pinch Task)
  * Pinch Hesitations Duration (ms) (Pinch Task)
  * Pinch Halts Count (Pinch Task)
  * Pinch Halts Duration (ms) (Pinch Task)
  * Pinch Rhythm CV (Pinch Task)
  * Pinch Screen Lifts Count (Pinch Task)
  * Pinch Screen Lifts Duration (ms) (Pinch Task)
  * Pinch Mean Lift Duration (ms) (Pinch Task)
  * Pinch Mean Orientation Deviation (deg) (Pinch Task)
  * Pinch Orientation Drift SD (deg) (Pinch Task)

* **Akinesia**:
  * Tapping Initiation Delay (ms) (Tap Task)
  * Drag Initiation Delay (ms) (Drag Task)
  * Pinch Initiation Delay (ms) (Pinch Task)
  * Hold Initiation Delay (ms) (Hold Task)
  * Hold Target Contact Delay (ms) (Hold Task)

* **Postural tremor**:
  * Hold Peak Tremor Amplitude (cm) (Hold Task)
  * Hold Tremor Spectral Power (Hold Task)
  * Hold Average Tremor Amplitude (Hold Task)
  * Hold Spatial Spread (px) (Hold Task)

* **Kinetic tremor**:
  * Drag Peak Tremor Amplitude (cm) (Drag Task)
  * Drag Tremor Spectral Power (Drag Task)
  * Drag Average Tremor Amplitude (Drag Task)
  * Drag Path Efficiency (Drag Task)
  * Tapping Average Tremor Amplitude (Tap Task)
  * Tapping Peak Tremor Amplitude (mm) (Tap Task)
  * Tapping Tremor Spectral Power (Tap Task)

---

# Stage 2: Transparent Statistical Matrices
Below are the calculated raw statistical tables for each clinical concept. Metrics are sorted by the absolute strength of their correlation with the corresponding MDS-UPDRS subscore.

## Bradykinesia
*Slowness of active voluntary movement execution (decay of velocity/frequency). Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Tapping Frequency (Hz) | Tap | 1.00 | 1.00 | 0.24 | -2.00 | N/A | 5.17 | N/A |
| Mean Intertap Interval (ms) | Tap | -1.00 | -1.00 | 0.24 | 2.00 | N/A | 197.28 | N/A |
| Drag Mean Speed (px/s) | Drag | -1.00 | -1.00 | 0.67 | 2.00 | N/A | 1188.17 | N/A |
| Drag Median Speed (px/s) | Drag | -1.00 | -1.00 | 0.49 | 2.00 | N/A | 1352.95 | N/A |
| Drag Peak Speed (px/s) | Drag | -1.00 | -1.00 | -0.04 | 2.00 | N/A | 2144.07 | N/A |
| Drag Movement Time (ms) | Drag | 1.00 | 1.00 | 0.36 | -2.00 | N/A | 671.50 | N/A |
| Drag Fitts Throughput (bits/s) | Drag | -1.00 | -1.00 | -0.11 | 2.00 | N/A | 6.91 | N/A |
| Pinch Cycle Frequency (Hz) | Pinch | -1.00 | -1.00 | 0.91 | 2.00 | N/A | 1.22 | N/A |
| Mean Pinch Interval (ms) | Pinch | 1.00 | 1.00 | 0.88 | -2.00 | N/A | 810.45 | N/A |
| Pinch Mean Opening Speed (mm/s) | Pinch | -1.00 | -1.00 | 0.96 | 2.00 | N/A | 280.06 | N/A |
| Pinch Median Opening Speed (mm/s) | Pinch | -1.00 | -1.00 | 0.98 | 2.00 | N/A | 284.84 | N/A |
| Pinch Max Opening Velocity (mm/s) | Pinch | -1.00 | -1.00 | 0.43 | 2.00 | N/A | 10149.87 | N/A |

## Hypokinesia
*Reduction in spatial range of motion or target undershooting. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Median Tapping Amplitude (mm) | Tap | 1.00 | 1.00 | 1.00 | -2.00 | N/A | 57.15 | N/A |
| Tapping Spatial Spread (px) | Tap | 1.00 | 1.00 | 0.91 | -2.00 | N/A | 40.62 | N/A |
| Drag Terminal Overshoot/Undershoot (px) | Drag | 1.00 | 1.00 | -0.07 | -2.00 | N/A | 4.98 | N/A |
| Drag Target Reached Rate | Drag | -1.00 | -1.00 | 0.67 | 2.00 | N/A | 1.00 | N/A |
| Median Pinch Amplitude (mm) | Pinch | -1.00 | -1.00 | 0.32 | 2.00 | N/A | 116.45 | N/A |

## Sequence effect
*Progressive decay/decrement of speed or amplitude as movement repeats. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Tapping Amplitude Decrement Ratio | Tap | 1.00 | 1.00 | 0.17 | -2.00 | N/A | 1.08 | N/A |
| Tapping Amplitude Slope (mm/tap) | Tap | 1.00 | 1.00 | 0.89 | -2.00 | N/A | -0.14 | N/A |
| Pinch Speed Decrement Ratio | Pinch | 1.00 | 1.00 | 0.66 | -2.00 | N/A | 0.67 | N/A |
| Pinch Amplitude Slope (mm/cycle) | Pinch | -1.00 | -1.00 | -0.36 | 2.00 | N/A | -0.61 | N/A |
| Pinch Amplitude Decrement Ratio | Pinch | 1.00 | 1.00 | -0.49 | -2.00 | N/A | 0.91 | N/A |
| Drag Across-Trial Within-Trial Deviation Decay Slope | Drag | 1.00 | 1.00 | N/A | -2.00 | N/A | -0.06 | N/A |
| Drag Across-Trial Within-Trial Deviation Decay Ratio | Drag | 1.00 | 1.00 | N/A | -2.00 | N/A | 0.33 | N/A |
| Drag Across-Trial Within-Trial Speed Decay Slope | Drag | -1.00 | -1.00 | N/A | 2.00 | N/A | 0.02 | N/A |
| Drag Across-Trial Within-Trial Speed Decay Ratio | Drag | -1.00 | -1.00 | N/A | 2.00 | N/A | 2.76 | N/A |
| Drag Across-Trial Path Deviation Slope | Drag | -1.00 | -1.00 | N/A | 2.00 | N/A | 0.93 | N/A |
| Drag Across-Trial Path Deviation Decrement Ratio | Drag | -1.00 | -1.00 | N/A | 2.00 | N/A | 4.95 | N/A |
| Drag Across-Trial Amplitude Slope | Drag | -1.00 | -1.00 | N/A | 2.00 | N/A | -0.98 | N/A |
| Drag Across-Trial Amplitude Decrement Ratio | Drag | -1.00 | -1.00 | N/A | 2.00 | N/A | 1.00 | N/A |
| Drag Across-Trial Speed Slope | Drag | -1.00 | -1.00 | N/A | 2.00 | N/A | 55.09 | N/A |
| Drag Across-Trial Speed Decrement Ratio | Drag | -1.00 | -1.00 | N/A | 2.00 | N/A | 1.74 | N/A |
| Drag Speed Slope (px/s per step) | Drag | 1.00 | 1.00 | 0.08 | -2.00 | N/A | -22.70 | N/A |
| Drag Speed Decrement Ratio | Drag | -1.00 | -1.00 | 0.10 | 2.00 | N/A | 0.59 | N/A |
| Drag Path Deviation Slope | Drag | 1.00 | 1.00 | 0.35 | -2.00 | N/A | 0.06 | N/A |
| Drag Path Deviation Decrement Ratio | Drag | 1.00 | 1.00 | 0.18 | -2.00 | N/A | 0.92 | N/A |
| Tapping Speed Slope (ms/tap) | Tap | -1.00 | -1.00 | 0.51 | 2.00 | N/A | -0.25 | N/A |
| Tapping Speed Decrement Ratio | Tap | -1.00 | -1.00 | 0.99 | 2.00 | N/A | 1.01 | N/A |
| Pinch Speed Slope (ms/cycle) | Pinch | 1.00 | 1.00 | 0.34 | -2.00 | N/A | -29.65 | N/A |

## Hesitations halts
*Rhythm arhythmicity, pauses, freezes, or transient blocks in coordination. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Tapping Hesitations Count | Tap | 1.00 | 1.00 | 0.50 | -2.00 | N/A | 0.00 | N/A |
| Drag Speed CV | Drag | -1.00 | -1.00 | -0.05 | 2.00 | N/A | 0.57 | N/A |
| Pinch Mean Orientation Deviation (deg) | Pinch | 1.00 | 1.00 | 0.73 | -2.00 | N/A | 3.94 | N/A |
| Pinch Mean Lift Duration (ms) | Pinch | 1.00 | 1.00 | 0.55 | -2.00 | N/A | 367.29 | N/A |
| Pinch Screen Lifts Duration (ms) | Pinch | 1.00 | 1.00 | 0.70 | -2.00 | N/A | 2571.00 | N/A |
| Pinch Rhythm CV | Pinch | -1.00 | -1.00 | 0.30 | 2.00 | N/A | 0.24 | N/A |
| Drag Across-Trial Hesitations Slope | Drag | 1.00 | 1.00 | N/A | -2.00 | N/A | -0.14 | N/A |
| Tapping Hesitations Duration (ms) | Tap | 1.00 | 1.00 | 0.37 | -2.00 | N/A | 0.00 | N/A |
| Pinch Orientation Drift SD (deg) | Pinch | -1.00 | -1.00 | -0.50 | 2.00 | N/A | 7.37 | N/A |
| Drag Hesitations Duration (ms) | Drag | -1.00 | -1.00 | -0.07 | 2.00 | N/A | 50.00 | N/A |
| Tapping Halts Count | Tap | 1.00 | 1.00 | 0.99 | -2.00 | N/A | 0.00 | N/A |
| Drag Hesitations Count | Drag | -1.00 | -1.00 | -0.04 | 2.00 | N/A | 0.50 | N/A |
| Tapping Halts Duration (ms) | Tap | 1.00 | 1.00 | 1.00 | -2.00 | N/A | 0.00 | N/A |
| Tapping Interruptions Count | Tap | 1.00 | 1.00 | 0.23 | -2.00 | N/A | 27.00 | N/A |
| Tapping Rhythm CV | Tap | 1.00 | 1.00 | 0.99 | -2.00 | N/A | 0.15 | N/A |
| Tapping Double Taps Count | Tap | -1.00 | -1.00 | -0.17 | 2.00 | N/A | 27.00 | N/A |
| Drag Halts Count | Drag | N/A | N/A | 0.00 | 0.00 | N/A | 0.00 | N/A |
| Pinch Halts Duration (ms) | Pinch | N/A | N/A | -0.00 | 0.00 | N/A | 0.00 | N/A |
| Pinch Screen Lifts Count | Pinch | N/A | N/A | 0.09 | 0.00 | N/A | 7.00 | N/A |
| Pinch Hesitations Duration (ms) | Pinch | N/A | N/A | -0.00 | 0.00 | N/A | 0.00 | N/A |
| Pinch Halts Count | Pinch | N/A | N/A | -0.00 | 0.00 | N/A | 0.00 | N/A |
| Drag Halts Duration (ms) | Drag | N/A | N/A | 0.00 | 0.00 | N/A | 0.00 | N/A |
| Pinch Hesitations Count | Pinch | N/A | N/A | -0.00 | 0.00 | N/A | 0.00 | N/A |
| Drag Across-Trial Hesitations Decrement Ratio | Drag | N/A | N/A | N/A | 0.00 | N/A | 0.00 | N/A |
| Drag Pause Count | Drag | N/A | N/A | 0.00 | 0.00 | N/A | 0.00 | N/A |
| Drag Longest Pause (ms) | Drag | N/A | N/A | 0.00 | 0.00 | N/A | 0.00 | N/A |

## Akinesia
*Initiation lag or reaction delay to lift/start the motor sequence. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Tapping Initiation Delay (ms) | Tap | 1.00 | 1.00 | -0.45 | -2.00 | N/A | 6076.00 | N/A |
| Drag Initiation Delay (ms) | Drag | -1.00 | -1.00 | 0.02 | 2.00 | N/A | 562.00 | N/A |
| Pinch Initiation Delay (ms) | Pinch | 1.00 | 1.00 | -0.11 | -2.00 | N/A | 2246.00 | N/A |
| Hold Initiation Delay (ms) | Hold | -1.00 | -1.00 | -0.50 | 2.00 | N/A | 2288.00 | N/A |
| Hold Target Contact Delay (ms) | Hold | 1.00 | 1.00 | 0.99 | -2.00 | N/A | 250.00 | N/A |

## Postural tremor
*Involuntary rhythmic oscillations while holding posture statically on a target. Correlated with Tremor Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Hold Peak Tremor Amplitude (cm) | Hold | 1.00 | 1.00 | 0.39 | -2.00 | N/A | 0.31 | N/A |
| Hold Tremor Spectral Power | Hold | 1.00 | 1.00 | 0.23 | -2.00 | N/A | 0.01 | N/A |
| Hold Average Tremor Amplitude | Hold | 1.00 | 1.00 | 0.58 | -2.00 | N/A | 0.11 | N/A |
| Hold Spatial Spread (px) | Hold | 1.00 | 1.00 | -0.02 | -2.00 | N/A | 1.17 | N/A |

## Kinetic tremor
*Involuntary rhythmic oscillations transverse to active voluntary path trajectories. Correlated with Tremor Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Drag Peak Tremor Amplitude (cm) | Drag | -1.00 | -1.00 | N/A | 2.00 | N/A | 2.56 | N/A |
| Drag Tremor Spectral Power | Drag | 1.00 | 1.00 | N/A | -2.00 | N/A | 2.04 | N/A |
| Drag Average Tremor Amplitude | Drag | 1.00 | 1.00 | N/A | -2.00 | N/A | 1.75 | N/A |
| Drag Path Efficiency | Drag | -1.00 | -1.00 | 0.07 | 2.00 | N/A | 0.98 | N/A |
| Tapping Average Tremor Amplitude | Tap | 1.00 | 1.00 | 0.97 | -2.00 | N/A | 13.77 | N/A |
| Tapping Peak Tremor Amplitude (mm) | Tap | 1.00 | 1.00 | 0.98 | -2.00 | N/A | 53.98 | N/A |
| Tapping Tremor Spectral Power | Tap | 1.00 | 1.00 | 0.79 | -2.00 | N/A | 93.63 | N/A |