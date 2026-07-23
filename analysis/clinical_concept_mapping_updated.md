# Quantitative Clinical Concept Feature Evaluation Report

This report aggregates digital motor features across the **Tapping, Drag, Pinch, and Hold** tasks, grouping them by clinical concepts to select the strongest candidate measures based on clinical scores.

## Clinical Cohort Profile

| Participant | MDS-UPDRS Total | Bradykinesia Subscore | Tremor Subscore | Clinical Subtype |
| :--- | :---: | :---: | :---: | :--- |
| **P01** | 38 | 15 | 6 | AR |
| **P02** | 18 | 6 | 2 | AR |

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

* **Hypokinesia**:
  * Median Tapping Amplitude (mm) (Tap Task)
  * Tapping Spatial Spread (px) (Tap Task)
  * Drag Terminal Overshoot/Undershoot (px) (Drag Task)
  * Drag Target Reached Rate (Drag Task)
  * Median Pinch Amplitude (mm) (Pinch Task)

* **Sequence effect**:
  * Tapping Amplitude Decrement Ratio (Tap Task)
  * Tapping Amplitude Slope (mm/tap) (Tap Task)
  * Drag Amplitude Decrement Ratio (Drag Task)
  * Drag Amplitude Slope (px/step) (Drag Task)
  * Pinch Amplitude Decrement Ratio (Pinch Task)
  * Pinch Amplitude Slope (mm/cycle) (Pinch Task)

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
  * Pinch Hesitations Count (Pinch Task)
  * Pinch Hesitations Duration (ms) (Pinch Task)
  * Pinch Halts Count (Pinch Task)
  * Pinch Halts Duration (ms) (Pinch Task)
  * Pinch Rhythm CV (Pinch Task)

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
| Tapping Frequency (Hz) | Tap | -1.00 | -1.00 | 0.89 | 2.00 | N/A | 3.79 | N/A |
| Mean Intertap Interval (ms) | Tap | 1.00 | 1.00 | 0.81 | -2.00 | N/A | 281.19 | N/A |
| Drag Mean Speed (px/s) | Drag | -1.00 | -1.00 | 0.36 | 2.00 | N/A | 1118.79 | N/A |
| Drag Median Speed (px/s) | Drag | -1.00 | -1.00 | 0.20 | 2.00 | N/A | 1243.59 | N/A |
| Drag Peak Speed (px/s) | Drag | -1.00 | -1.00 | 0.03 | 2.00 | N/A | 1895.91 | N/A |
| Drag Movement Time (ms) | Drag | 1.00 | 1.00 | 0.40 | -2.00 | N/A | 695.85 | N/A |
| Drag Fitts Throughput (bits/s) | Drag | -1.00 | -1.00 | 0.52 | 2.00 | N/A | 6.86 | N/A |
| Pinch Cycle Frequency (Hz) | Pinch | -1.00 | -1.00 | -0.00 | 2.00 | N/A | 1.78 | N/A |
| Mean Pinch Interval (ms) | Pinch | 1.00 | 1.00 | -0.06 | -2.00 | N/A | 564.81 | N/A |

## Hypokinesia
*Reduction in spatial range of motion or target undershooting. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Median Tapping Amplitude (mm) | Tap | -1.00 | -1.00 | 0.32 | 2.00 | N/A | 55.81 | N/A |
| Tapping Spatial Spread (px) | Tap | 1.00 | 1.00 | 0.03 | -2.00 | N/A | 14.03 | N/A |
| Drag Terminal Overshoot/Undershoot (px) | Drag | 1.00 | 1.00 | 0.00 | -2.00 | N/A | 16.68 | N/A |
| Drag Target Reached Rate | Drag | -1.00 | -1.00 | -0.09 | 2.00 | N/A | 0.75 | N/A |
| Median Pinch Amplitude (mm) | Pinch | -1.00 | -1.00 | 0.50 | 2.00 | N/A | 117.82 | N/A |

## Sequence effect
*Progressive decay/decrement of speed or amplitude as movement repeats. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Tapping Amplitude Decrement Ratio | Tap | -1.00 | -1.00 | 0.03 | 2.00 | N/A | 1.40 | N/A |
| Tapping Amplitude Slope (mm/tap) | Tap | -1.00 | -1.00 | 0.12 | 2.00 | N/A | 0.06 | N/A |
| Pinch Amplitude Decrement Ratio | Pinch | 1.00 | 1.00 | 0.26 | -2.00 | N/A | 0.89 | N/A |
| Pinch Amplitude Slope (mm/cycle) | Pinch | 1.00 | 1.00 | 0.01 | -2.00 | N/A | -0.34 | N/A |

## Hesitations halts
*Rhythm arhythmicity, pauses, freezes, or transient blocks in coordination. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Tapping Hesitations Count | Tap | -1.00 | -1.00 | 0.83 | 2.00 | N/A | 1.33 | N/A |
| Tapping Hesitations Duration (ms) | Tap | -1.00 | -1.00 | 0.97 | 2.00 | N/A | 592.67 | N/A |
| Pinch Halts Duration (ms) | Pinch | -1.00 | -1.00 | 0.00 | 2.00 | N/A | 194.50 | N/A |
| Pinch Halts Count | Pinch | -1.00 | -1.00 | -0.00 | 2.00 | N/A | 0.17 | N/A |
| Pinch Hesitations Duration (ms) | Pinch | 1.00 | 1.00 | 0.00 | -2.00 | N/A | 177.83 | N/A |
| Pinch Hesitations Count | Pinch | 1.00 | 1.00 | -0.00 | -2.00 | N/A | 0.17 | N/A |
| Drag Pause Count | Drag | 1.00 | 1.00 | 0.00 | -2.00 | N/A | 0.05 | N/A |
| Drag Speed CV | Drag | 1.00 | 1.00 | 0.02 | -2.00 | N/A | 0.51 | N/A |
| Pinch Rhythm CV | Pinch | -1.00 | -1.00 | -0.28 | 2.00 | N/A | 0.15 | N/A |
| Drag Hesitations Duration (ms) | Drag | 1.00 | 1.00 | 0.08 | -2.00 | N/A | 46.05 | N/A |
| Drag Hesitations Count | Drag | 1.00 | 1.00 | 0.19 | -2.00 | N/A | 0.40 | N/A |
| Tapping Interruptions Count | Tap | 1.00 | 1.00 | -0.44 | -2.00 | N/A | 0.83 | N/A |
| Tapping Double Taps Count | Tap | -1.00 | -1.00 | -0.40 | 2.00 | N/A | 0.50 | N/A |
| Tapping Rhythm CV | Tap | 1.00 | 1.00 | 0.07 | -2.00 | N/A | 0.39 | N/A |
| Tapping Halts Duration (ms) | Tap | 1.00 | 1.00 | 0.28 | -2.00 | N/A | 491.50 | N/A |
| Tapping Halts Count | Tap | 1.00 | 1.00 | 0.50 | -2.00 | N/A | 0.33 | N/A |
| Drag Halts Duration (ms) | Drag | N/A | N/A | 0.00 | 0.00 | N/A | 0.00 | N/A |
| Drag Longest Pause (ms) | Drag | N/A | N/A | 0.00 | 0.00 | N/A | 0.00 | N/A |
| Drag Halts Count | Drag | N/A | N/A | 0.00 | 0.00 | N/A | 0.00 | N/A |

## Akinesia
*Initiation lag or reaction delay to lift/start the motor sequence. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Tapping Initiation Delay (ms) | Tap | 1.00 | 1.00 | -0.18 | -2.00 | N/A | 2271.67 | N/A |
| Drag Initiation Delay (ms) | Drag | 1.00 | 1.00 | 0.01 | -2.00 | N/A | 530.40 | N/A |
| Pinch Initiation Delay (ms) | Pinch | 1.00 | 1.00 | 0.45 | -2.00 | N/A | 894.67 | N/A |
| Hold Initiation Delay (ms) | Hold | -1.00 | -1.00 | -0.38 | 2.00 | N/A | 1137.83 | N/A |
| Hold Target Contact Delay (ms) | Hold | 1.00 | 1.00 | -0.04 | -2.00 | N/A | 490.50 | N/A |

## Postural tremor
*Involuntary rhythmic oscillations while holding posture statically on a target. Correlated with Tremor Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Hold Peak Tremor Amplitude (cm) | Hold | 1.00 | 1.00 | -0.09 | -2.00 | N/A | 2.53 | N/A |
| Hold Tremor Spectral Power | Hold | 1.00 | 1.00 | 0.07 | -2.00 | N/A | 0.42 | N/A |
| Hold Average Tremor Amplitude | Hold | 1.00 | 1.00 | 0.04 | -2.00 | N/A | 0.62 | N/A |
| Hold Spatial Spread (px) | Hold | 1.00 | 1.00 | 0.98 | -2.00 | N/A | 7.03 | N/A |

## Kinetic tremor
*Involuntary rhythmic oscillations transverse to active voluntary path trajectories. Correlated with Tremor Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Drag Peak Tremor Amplitude (cm) | Drag | -1.00 | -1.00 | 0.04 | 2.00 | N/A | 1.93 | N/A |
| Drag Tremor Spectral Power | Drag | -1.00 | -1.00 | 0.37 | 2.00 | N/A | 4.52 | N/A |
| Drag Average Tremor Amplitude | Drag | -1.00 | -1.00 | 0.47 | 2.00 | N/A | 1.58 | N/A |
| Drag Path Efficiency | Drag | -1.00 | -1.00 | -0.11 | 2.00 | N/A | 0.99 | N/A |
| Tapping Average Tremor Amplitude | Tap | -1.00 | -1.00 | -0.29 | 2.00 | N/A | 8.35 | N/A |
| Tapping Peak Tremor Amplitude (mm) | Tap | -1.00 | -1.00 | 0.81 | 2.00 | N/A | 14.12 | N/A |
| Tapping Tremor Spectral Power | Tap | 1.00 | 1.00 | -0.50 | -2.00 | N/A | 60.64 | N/A |