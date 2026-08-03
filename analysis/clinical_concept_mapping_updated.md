# Quantitative Clinical Concept Feature Evaluation Report

This report aggregates digital motor features across the **Tapping, Drag, Pinch, and Hold** tasks, grouping them by clinical concepts to select the strongest candidate measures based on clinical scores.

## Clinical Cohort Profile

| Participant | MDS-UPDRS Total | Bradykinesia Subscore | Tremor Subscore | Clinical Subtype |
| :--- | :---: | :---: | :---: | :--- |
| **P03** | 17 | 6 | 5 | AR |
| **P04** | 28 | 8 | 9 | Indeterminate |
| **P05** | 41 | 20 | 8 | AR |
| **P06** | 38 | 21 | 2 | AR |

---

# Stage 1: Clinical Concept Mapping Registry
Below are the pre-defined clinical concepts and all candidate digital features mapped under each concept across the 4 tasks:

* **Bradykinesia**:
  * Tapping Frequency (Hz) (Tap Task)
  * Mean Intertap Interval (ms) (Tap Task)
  * Tapping Rhythm CV (Tap Task)
  * Drag Mean Speed (px/s) (Drag Task)
  * Drag Median Speed (px/s) (Drag Task)
  * Drag Peak Speed (px/s) (Drag Task)
  * Drag Movement Time (ms) (Drag Task)
  * Pinch Cycle Frequency (Hz) (Pinch Task)
  * Mean Pinch Interval (ms) (Pinch Task)
  * Pinch Mean Opening Speed (mm/s) (Pinch Task)
  * Pinch Median Opening Speed (mm/s) (Pinch Task)
  * Pinch Max Opening Velocity (mm/s) (Pinch Task)
  * Tapping Initiation Delay (ms) (Tap Task)
  * Drag Initiation Delay (ms) (Drag Task)
  * Pinch Initiation Delay (ms) (Pinch Task)
  * Hold Initiation Delay (ms) (Hold Task)

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
| Tapping Frequency (Hz) | Tap | -0.80 | -0.99 | 0.82 | 2.11 | N/A | 3.42 | N/A |
| Mean Intertap Interval (ms) | Tap | 0.80 | 0.97 | 0.73 | -2.27 | N/A | 341.66 | N/A |
| Drag Median Speed (px/s) | Drag | -0.80 | -0.82 | 0.73 | 1.66 | N/A | 868.42 | N/A |
| Drag Peak Speed (px/s) | Drag | -0.80 | -0.76 | 0.52 | 1.19 | N/A | 1541.93 | N/A |
| Drag Movement Time (ms) | Drag | 0.80 | 0.67 | 0.61 | -0.71 | N/A | 1130.67 | N/A |
| Drag Initiation Delay (ms) | Drag | 0.80 | 0.90 | 0.02 | -2.31 | N/A | 691.67 | N/A |
| Hold Initiation Delay (ms) | Hold | 0.60 | 0.54 | 0.45 | -0.00 | N/A | 9475.33 | N/A |
| Tapping Rhythm CV | Tap | -0.40 | -0.15 | 0.95 | 0.07 | N/A | 0.33 | N/A |
| Drag Mean Speed (px/s) | Drag | -0.40 | -0.72 | 0.86 | 1.32 | N/A | 828.62 | N/A |
| Pinch Cycle Frequency (Hz) | Pinch | -0.40 | -0.66 | 0.95 | 1.28 | N/A | 0.77 | N/A |
| Mean Pinch Interval (ms) | Pinch | 0.40 | 0.63 | 0.67 | -1.20 | N/A | 1260.36 | N/A |
| Pinch Mean Opening Speed (mm/s) | Pinch | -0.40 | -0.58 | -0.18 | 0.97 | N/A | 188.56 | N/A |
| Pinch Median Opening Speed (mm/s) | Pinch | -0.40 | -0.48 | 0.89 | 0.74 | N/A | 198.03 | N/A |
| Pinch Max Opening Velocity (mm/s) | Pinch | -0.40 | -0.60 | 0.34 | 0.64 | N/A | 7488.57 | N/A |
| Pinch Initiation Delay (ms) | Pinch | 0.40 | -0.32 | -0.40 | -0.61 | N/A | 1734.67 | N/A |
| Tapping Initiation Delay (ms) | Tap | -0.20 | 0.53 | 0.76 | 0.01 | N/A | 9094.00 | N/A |

## Hypokinesia
*Reduction in spatial range of motion or target undershooting. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Drag Target Reached Rate | Drag | 0.26 | 0.49 | 0.29 | 0.00 | N/A | 1.00 | N/A |
| Tapping Spatial Spread (px) | Tap | -0.20 | -0.14 | 0.81 | 0.93 | N/A | 45.69 | N/A |
| Drag Terminal Overshoot/Undershoot (px) | Drag | 0.20 | 0.39 | -0.04 | -1.48 | N/A | 16.41 | N/A |
| Median Pinch Amplitude (mm) | Pinch | 0.20 | -0.31 | 0.59 | -0.42 | N/A | 102.99 | N/A |
| Median Tapping Amplitude (mm) | Tap | 0.00 | -0.50 | 0.68 | -0.01 | N/A | 56.66 | N/A |

## Sequence effect
*Progressive decay/decrement of speed or amplitude as movement repeats. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Drag Path Deviation Decrement Ratio | Drag | 0.80 | 0.54 | 0.13 | -2.65 | N/A | 1.81 | N/A |
| Drag Across-Trial Within-Trial Speed Decay Slope | Drag | -0.80 | -0.43 | N/A | 2.50 | N/A | 0.00 | N/A |
| Drag Speed Decrement Ratio | Drag | -0.80 | -0.43 | -0.01 | 2.47 | N/A | 0.54 | N/A |
| Drag Speed Slope (px/s per step) | Drag | 0.80 | 0.76 | 0.02 | -1.69 | N/A | -12.74 | N/A |
| Drag Across-Trial Within-Trial Speed Decay Ratio | Drag | -0.80 | -0.71 | N/A | 2.16 | N/A | 1.41 | N/A |
| Drag Across-Trial Path Deviation Slope | Drag | -0.80 | -0.55 | N/A | 2.63 | N/A | 0.16 | N/A |
| Drag Across-Trial Path Deviation Decrement Ratio | Drag | -0.80 | -0.48 | N/A | 2.46 | N/A | 2.48 | N/A |
| Tapping Amplitude Decrement Ratio | Tap | -0.60 | -0.62 | 0.19 | 0.16 | N/A | 0.92 | N/A |
| Tapping Amplitude Slope (mm/tap) | Tap | 0.40 | 0.69 | -0.46 | -0.97 | N/A | 0.13 | N/A |
| Pinch Amplitude Decrement Ratio | Pinch | 0.40 | -0.45 | 0.00 | -0.28 | N/A | 0.71 | N/A |
| Drag Across-Trial Within-Trial Deviation Decay Ratio | Drag | 0.40 | 0.52 | N/A | -0.02 | N/A | 2.20 | N/A |
| Drag Across-Trial Amplitude Slope | Drag | 0.40 | 0.51 | N/A | -0.14 | N/A | -0.52 | N/A |
| Drag Across-Trial Amplitude Decrement Ratio | Drag | 0.40 | 0.50 | N/A | -0.09 | N/A | 1.00 | N/A |
| Drag Across-Trial Speed Slope | Drag | -0.40 | -0.07 | N/A | 1.67 | N/A | 17.03 | N/A |
| Tapping Speed Slope (ms/tap) | Tap | -0.40 | -0.46 | 0.03 | 0.59 | N/A | -0.87 | N/A |
| Tapping Speed Decrement Ratio | Tap | 0.40 | 0.45 | 0.76 | -0.07 | N/A | 0.98 | N/A |
| Drag Across-Trial Within-Trial Deviation Decay Slope | Drag | -0.20 | -0.26 | N/A | 1.59 | N/A | -0.09 | N/A |
| Pinch Amplitude Slope (mm/cycle) | Pinch | 0.20 | -0.22 | -0.10 | -0.35 | N/A | -1.37 | N/A |
| Drag Across-Trial Speed Decrement Ratio | Drag | 0.00 | 0.27 | N/A | 1.11 | N/A | 1.63 | N/A |
| Drag Path Deviation Slope | Drag | 0.00 | -0.27 | 0.26 | -1.06 | N/A | 0.08 | N/A |
| Pinch Speed Decrement Ratio | Pinch | 0.00 | -0.21 | 0.51 | -1.23 | N/A | 0.68 | N/A |
| Pinch Speed Slope (ms/cycle) | Pinch | 0.00 | -0.53 | 0.20 | -0.04 | N/A | -248.64 | N/A |

## Hesitations halts
*Rhythm arhythmicity, pauses, freezes, or transient blocks in coordination. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Tapping Double Taps Count | Tap | -0.80 | -0.62 | 0.38 | 2.74 | N/A | 15.33 | N/A |
| Tapping Interruptions Count | Tap | -0.80 | -0.82 | 0.69 | 2.03 | N/A | 15.33 | N/A |
| Drag Hesitations Count | Drag | 0.74 | 0.85 | 0.40 | -1.21 | N/A | 0.83 | N/A |
| Drag Hesitations Duration (ms) | Drag | 0.60 | 0.74 | 0.18 | -0.53 | N/A | 145.00 | N/A |
| Pinch Orientation Drift SD (deg) | Pinch | -0.40 | -0.20 | 0.48 | 1.84 | N/A | 6.58 | N/A |
| Drag Speed CV | Drag | -0.40 | 0.12 | -0.03 | 1.18 | N/A | 0.55 | N/A |
| Pinch Screen Lifts Duration (ms) | Pinch | 0.40 | -0.02 | 0.72 | -1.69 | N/A | 3000.00 | N/A |
| Pinch Rhythm CV | Pinch | -0.40 | 0.10 | 0.30 | 1.51 | N/A | 0.21 | N/A |
| Pinch Mean Orientation Deviation (deg) | Pinch | 0.40 | 0.59 | 0.78 | -0.33 | N/A | 7.03 | N/A |
| Tapping Rhythm CV | Tap | -0.40 | -0.15 | 0.95 | 0.07 | N/A | 0.33 | N/A |
| Pinch Screen Lifts Count | Pinch | 0.32 | -0.28 | 0.03 | -0.67 | N/A | 6.33 | N/A |
| Tapping Halts Duration (ms) | Tap | -0.26 | -0.49 | 0.99 | 0.00 | N/A | 0.00 | N/A |
| Tapping Halts Count | Tap | -0.26 | -0.49 | 0.99 | 0.00 | N/A | 0.00 | N/A |
| Drag Pause Count | Drag | 0.26 | 0.53 | 0.07 | 0.00 | N/A | 0.17 | N/A |
| Drag Across-Trial Hesitations Decrement Ratio | Drag | 0.26 | 0.53 | N/A | 0.00 | N/A | 0.33 | N/A |
| Pinch Hesitations Count | Pinch | 0.26 | 0.53 | -0.00 | 0.00 | N/A | 0.33 | N/A |
| Pinch Hesitations Duration (ms) | Pinch | 0.26 | 0.53 | 0.38 | 0.00 | N/A | 871.33 | N/A |
| Drag Across-Trial Hesitations Slope | Drag | 0.20 | 0.35 | N/A | -1.40 | N/A | -0.07 | N/A |
| Tapping Hesitations Count | Tap | 0.11 | 0.30 | 0.76 | 0.00 | N/A | 0.67 | N/A |
| Tapping Hesitations Duration (ms) | Tap | 0.11 | 0.51 | 0.69 | 0.00 | N/A | 383.67 | N/A |
| Pinch Mean Lift Duration (ms) | Pinch | 0.00 | -0.01 | 0.62 | -1.74 | N/A | 436.63 | N/A |
| Pinch Halts Duration (ms) | Pinch | N/A | N/A | -0.00 | 0.00 | N/A | 0.00 | N/A |
| Pinch Halts Count | Pinch | N/A | N/A | 0.00 | 0.00 | N/A | 0.00 | N/A |
| Drag Halts Duration (ms) | Drag | N/A | N/A | 0.00 | 0.00 | N/A | 0.00 | N/A |
| Drag Halts Count | Drag | N/A | N/A | 0.00 | 0.00 | N/A | 0.00 | N/A |
| Drag Longest Pause (ms) | Drag | N/A | N/A | 0.02 | 0.00 | N/A | 0.00 | N/A |

## Akinesia
*Initiation lag or reaction delay to lift/start the motor sequence. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Drag Initiation Delay (ms) | Drag | 0.80 | 0.90 | 0.02 | -2.31 | N/A | 691.67 | N/A |
| Hold Initiation Delay (ms) | Hold | 0.60 | 0.54 | 0.45 | -0.00 | N/A | 9475.33 | N/A |
| Pinch Initiation Delay (ms) | Pinch | 0.40 | -0.32 | -0.40 | -0.61 | N/A | 1734.67 | N/A |
| Tapping Initiation Delay (ms) | Tap | -0.20 | 0.53 | 0.76 | 0.01 | N/A | 9094.00 | N/A |
| Hold Target Contact Delay (ms) | Hold | 0.20 | 0.22 | 0.23 | -1.35 | N/A | 600.00 | N/A |

## Postural tremor
*Involuntary rhythmic oscillations while holding posture statically on a target. Correlated with Tremor Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Hold Peak Tremor Amplitude (cm) | Hold | 1.00 | 0.98 | 0.21 | -2.36 | N/A | 0.26 | N/A |
| Hold Spatial Spread (px) | Hold | 0.60 | 0.44 | -0.03 | -0.28 | N/A | 1.77 | N/A |
| Hold Tremor Spectral Power | Hold | 0.50 | 0.10 | 0.16 | -0.05 | N/A | 0.01 | N/A |
| Hold Average Tremor Amplitude | Hold | 0.50 | 0.80 | 0.24 | -1.84 | N/A | 0.11 | N/A |

## Kinetic tremor
*Involuntary rhythmic oscillations transverse to active voluntary path trajectories. Correlated with Tremor Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Tapping Average Tremor Amplitude | Tap | 1.00 | 0.92 | 0.96 | -2.71 | N/A | 13.34 | N/A |
| Tapping Peak Tremor Amplitude (mm) | Tap | 1.00 | 0.99 | 0.92 | -2.57 | N/A | 61.53 | N/A |
| Tapping Tremor Spectral Power | Tap | 1.00 | 0.78 | 0.78 | -2.56 | N/A | 87.07 | N/A |
| Drag Tremor Spectral Power | Drag | 0.80 | 0.84 | -0.06 | -2.50 | N/A | 1.55 | N/A |
| Drag Average Tremor Amplitude | Drag | 0.80 | 0.91 | 0.02 | -2.79 | N/A | 1.52 | N/A |
| Drag Path Efficiency | Drag | -0.80 | -0.69 | 0.12 | 0.91 | N/A | 0.98 | N/A |
| Drag Peak Tremor Amplitude (cm) | Drag | 0.40 | 0.67 | 0.30 | -2.36 | N/A | 2.03 | N/A |