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
| Tapping Frequency (Hz) | Tap | 1.00 | 1.00 | 0.99 | -2.00 | N/A | 5.50 | N/A |
| Mean Intertap Interval (ms) | Tap | -1.00 | -1.00 | 0.99 | 2.00 | N/A | 186.53 | N/A |
| Drag Mean Speed (px/s) | Drag | -1.00 | -1.00 | 0.75 | 2.00 | N/A | 918.87 | N/A |
| Drag Median Speed (px/s) | Drag | 1.00 | 1.00 | -0.11 | -2.00 | N/A | 749.15 | N/A |
| Drag Peak Speed (px/s) | Drag | -1.00 | -1.00 | 0.96 | 2.00 | N/A | 2319.27 | N/A |
| Drag Movement Time (ms) | Drag | 1.00 | 1.00 | 0.46 | -2.00 | N/A | 932.25 | N/A |
| Drag Fitts Throughput (bits/s) | Drag | -1.00 | -1.00 | 0.47 | 2.00 | N/A | 5.03 | N/A |

## Hypokinesia
*Reduction in spatial range of motion or target undershooting. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Median Tapping Amplitude (mm) | Tap | -1.00 | -1.00 | 1.00 | 2.00 | N/A | 2.72 | N/A |
| Tapping Spatial Spread (px) | Tap | -1.00 | -1.00 | -0.38 | 2.00 | N/A | 7.19 | N/A |
| Drag Terminal Overshoot/Undershoot (px) | Drag | -1.00 | -1.00 | -0.03 | 2.00 | N/A | 7.98 | N/A |
| Drag Target Reached Rate | Drag | N/A | N/A | 0.00 | 0.00 | N/A | 1.00 | N/A |

## Sequence effect
*Progressive decay/decrement of speed or amplitude as movement repeats. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Tapping Amplitude Decrement Ratio | Tap | -1.00 | -1.00 | 0.11 | 2.00 | N/A | 0.64 | N/A |
| Tapping Amplitude Slope (mm/tap) | Tap | -1.00 | -1.00 | -0.20 | 2.00 | N/A | 0.00 | N/A |
| Drag Across-Trial Within-Trial Deviation Decay Ratio | Drag | -1.00 | -1.00 | N/A | 2.00 | N/A | 0.16 | N/A |
| Drag Across-Trial Within-Trial Speed Decay Slope | Drag | -1.00 | -1.00 | N/A | 2.00 | N/A | -0.04 | N/A |
| Drag Across-Trial Within-Trial Speed Decay Ratio | Drag | 1.00 | 1.00 | N/A | -2.00 | N/A | 0.32 | N/A |
| Drag Across-Trial Path Deviation Slope | Drag | -1.00 | -1.00 | N/A | 2.00 | N/A | -0.28 | N/A |
| Drag Across-Trial Path Deviation Decrement Ratio | Drag | -1.00 | -1.00 | N/A | 2.00 | N/A | 0.47 | N/A |
| Drag Across-Trial Amplitude Slope | Drag | -1.00 | -1.00 | N/A | 2.00 | N/A | -1.36 | N/A |
| Drag Across-Trial Amplitude Decrement Ratio | Drag | -1.00 | -1.00 | N/A | 2.00 | N/A | 0.95 | N/A |
| Drag Across-Trial Speed Slope | Drag | 1.00 | 1.00 | N/A | -2.00 | N/A | -14.46 | N/A |
| Drag Across-Trial Speed Decrement Ratio | Drag | 1.00 | 1.00 | N/A | -2.00 | N/A | 0.85 | N/A |
| Drag Speed Slope (px/s per step) | Drag | 1.00 | 1.00 | 0.69 | -2.00 | N/A | -16.86 | N/A |
| Drag Speed Decrement Ratio | Drag | 1.00 | 1.00 | 0.31 | -2.00 | N/A | 0.42 | N/A |
| Drag Path Deviation Slope | Drag | 1.00 | 1.00 | -0.11 | -2.00 | N/A | 0.03 | N/A |
| Drag Path Deviation Decrement Ratio | Drag | 1.00 | 1.00 | -0.11 | -2.00 | N/A | 1.30 | N/A |
| Tapping Speed Slope (ms/tap) | Tap | -1.00 | -1.00 | 0.23 | 2.00 | N/A | 0.26 | N/A |
| Tapping Speed Decrement Ratio | Tap | -1.00 | -1.00 | -0.50 | 2.00 | N/A | 1.14 | N/A |
| Drag Across-Trial Within-Trial Deviation Decay Slope | Drag | -1.00 | -1.00 | N/A | 2.00 | N/A | -0.12 | N/A |

## Hesitations halts
*Rhythm arhythmicity, pauses, freezes, or transient blocks in coordination. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Tapping Hesitations Count | Tap | 1.00 | 1.00 | 0.30 | -2.00 | N/A | 0.50 | N/A |
| Tapping Hesitations Duration (ms) | Tap | 1.00 | 1.00 | 0.31 | -2.00 | N/A | 157.50 | N/A |
| Tapping Rhythm CV | Tap | 1.00 | 1.00 | 0.17 | -2.00 | N/A | 0.11 | N/A |
| Drag Hesitations Duration (ms) | Drag | 1.00 | 1.00 | -0.11 | -2.00 | N/A | 141.50 | N/A |
| Drag Speed CV | Drag | -1.00 | -1.00 | 0.86 | 2.00 | N/A | 0.73 | N/A |
| Drag Across-Trial Hesitations Slope | Drag | -1.00 | -1.00 | N/A | 2.00 | N/A | 0.00 | N/A |
| Tapping Halts Count | Tap | N/A | N/A | -0.00 | 0.00 | N/A | 0.00 | N/A |
| Tapping Halts Duration (ms) | Tap | N/A | N/A | 0.00 | 0.00 | N/A | 0.00 | N/A |
| Tapping Double Taps Count | Tap | N/A | N/A | 0.00 | 0.00 | N/A | 0.00 | N/A |
| Tapping Interruptions Count | Tap | N/A | N/A | -0.00 | 0.00 | N/A | 0.00 | N/A |
| Drag Hesitations Count | Drag | N/A | N/A | -0.10 | 0.00 | N/A | 1.00 | N/A |
| Drag Halts Count | Drag | N/A | N/A | 0.00 | 0.00 | N/A | 0.00 | N/A |
| Drag Halts Duration (ms) | Drag | N/A | N/A | 0.00 | 0.00 | N/A | 0.00 | N/A |
| Drag Pause Count | Drag | N/A | N/A | -0.11 | 0.00 | N/A | 0.00 | N/A |
| Drag Longest Pause (ms) | Drag | N/A | N/A | 0.11 | 0.00 | N/A | 0.00 | N/A |
| Drag Across-Trial Hesitations Decrement Ratio | Drag | N/A | N/A | N/A | N/A | N/A | 2.00 | N/A |

## Akinesia
*Initiation lag or reaction delay to lift/start the motor sequence. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Tapping Initiation Delay (ms) | Tap | -1.00 | -1.00 | 0.56 | 2.00 | N/A | 3823.00 | N/A |
| Drag Initiation Delay (ms) | Drag | 1.00 | 1.00 | 0.46 | -2.00 | N/A | 622.25 | N/A |
| Hold Initiation Delay (ms) | Hold | 1.00 | 1.00 | -0.06 | -2.00 | N/A | 2071.50 | N/A |
| Hold Target Contact Delay (ms) | Hold | 1.00 | 1.00 | 0.59 | -2.00 | N/A | 490.50 | N/A |

## Postural tremor
*Involuntary rhythmic oscillations while holding posture statically on a target. Correlated with Tremor Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Hold Peak Tremor Amplitude (cm) | Hold | 1.00 | 1.00 | 0.76 | -2.00 | N/A | 0.52 | N/A |
| Hold Tremor Spectral Power | Hold | -1.00 | -1.00 | 0.01 | 2.00 | N/A | 0.03 | N/A |
| Hold Average Tremor Amplitude | Hold | 1.00 | 1.00 | 0.12 | -2.00 | N/A | 0.17 | N/A |
| Hold Spatial Spread (px) | Hold | -1.00 | -1.00 | 0.08 | 2.00 | N/A | 2.53 | N/A |

## Kinetic tremor
*Involuntary rhythmic oscillations transverse to active voluntary path trajectories. Correlated with Tremor Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Drag Peak Tremor Amplitude (cm) | Drag | -1.00 | -1.00 | 0.62 | 2.00 | N/A | 2.06 | N/A |
| Drag Tremor Spectral Power | Drag | -1.00 | -1.00 | 0.08 | 2.00 | N/A | 1.39 | N/A |
| Drag Average Tremor Amplitude | Drag | -1.00 | -1.00 | 0.39 | 2.00 | N/A | 1.33 | N/A |
| Drag Path Efficiency | Drag | 1.00 | 1.00 | 0.86 | -2.00 | N/A | 0.95 | N/A |
| Tapping Average Tremor Amplitude | Tap | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Tapping Peak Tremor Amplitude (mm) | Tap | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Tapping Tremor Spectral Power | Tap | N/A | N/A | N/A | N/A | N/A | N/A | N/A |