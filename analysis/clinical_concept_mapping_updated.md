# Quantitative Clinical Concept Feature Evaluation Report

This report aggregates digital motor features across the **Tapping, Drag, Pinch, and Hold** tasks, grouping them by clinical concepts to select the strongest candidate measures based on clinical scores.

## Clinical Cohort Profile

| Participant | MDS-UPDRS Total | Bradykinesia Subscore | Tremor Subscore | Clinical Subtype |
| :--- | :---: | :---: | :---: | :--- |
| **P01** | 34 | 17 | 0 | AR |
| **P02** | 26 | 17 | 0 | AR |
| **P03** | 21 | 8 | 5 | AR |

---

# Stage 1: Clinical Concept Mapping Registry
Below are the pre-defined clinical concepts and all candidate digital features mapped under each concept across the 4 tasks:

* **Bradykinesia**:
  * Tap Frequency (Hz) (Tap Task)
  * Mean Intertap Interval (ms) (Tap Task)
  * Drag Mean Speed (px/s) (Drag Task)
  * Drag Median Speed (px/s) (Drag Task)
  * Drag Peak Speed (px/s) (Drag Task)
  * Drag Movement Time (ms) (Drag Task)
  * Pinch Cycle Frequency (Hz) (Pinch Task)
  * Mean Pinch Interval (ms) (Pinch Task)
  * Pinch Mean Opening Speed (mm/s) (Pinch Task)
  * Pinch Median Opening Speed (mm/s) (Pinch Task)
  * Pinch Max Opening Velocity (mm/s) (Pinch Task)
  * Tap Initiation Delay (ms) (Tap Task)
  * Drag Initiation Delay (ms) (Drag Task)
  * Pinch Initiation Delay (ms) (Pinch Task)
  * Hold Initiation Delay (ms) (Hold Task)

* **Hypokinesia**:
  * Drag Terminal Undershoot (px) (Drag Task)
  * Drag Movement Amplitude (px) (Drag Task)
  * Drag Signed Target Deviation (px) (Drag Task)
  * Drag Undershoot Proportion (Drag Task)
  * Pinch Max Opening Distance (mm) (Pinch Task)
  * Pinch Median Opening Distance (mm) (Pinch Task)

* **Sequence effect**:
  * Tap Interval Decrement Ratio (Tap Task)
  * Tap Frequency Decrement Ratio (Tap Task)
  * Tap Interval Slope (ms/tap) (Tap Task)
  * Tap Frequency Slope (Hz/tap) (Tap Task)
  * Drag Speed Decrement Ratio (Drag Task)
  * Drag Speed Slope (Drag Task)
  * Drag Amplitude Decrement Ratio (Drag Task)
  * Drag Amplitude Slope (Drag Task)
  * Drag Duration Slope (Drag Task)
  * Pinch Opening Distance Decrement Ratio (Pinch Task)
  * Pinch Opening Distance Slope (mm/cycle) (Pinch Task)
  * Pinch Cycle Duration Decrement Ratio (Pinch Task)
  * Pinch Cycle Speed Decrement Ratio (Pinch Task)
  * Pinch Cycle Duration Slope (ms/cycle) (Pinch Task)
  * Pinch Cycle Speed Slope (Hz/cycle) (Pinch Task)

* **Hesitations halts**:
  * Tap Total Hesitation/Halt Count (Tap Task)
  * Tap Total Hesitation/Halt Duration (ms) (Tap Task)
  * Tap Longest Hesitation/Halt Duration (ms) (Tap Task)
  * Pinch Total Hesitation/Halt Count (Pinch Task)
  * Pinch Total Hesitation/Halt Duration (ms) (Pinch Task)
  * Pinch Longest Hesitation/Halt Duration (ms) (Pinch Task)
  * Drag Total Hesitation/Halt Count (Drag Task)
  * Drag Total Hesitation/Halt Duration (ms) (Drag Task)
  * Drag Longest Hesitation/Halt Duration (ms) (Drag Task)

* **Akinesia**:
  * Tap Initiation Delay (ms) (Tap Task)
  * Drag Initiation Delay (ms) (Drag Task)
  * Pinch Initiation Delay (ms) (Pinch Task)
  * Hold Initiation Delay (ms) (Hold Task)
  * Hold Target Contact Delay (ms) (Hold Task)
  * Hold Release Delay (ms) (Hold Task)

* **Postural tremor**:
  * Hold Peak Tremor Amplitude (cm) (Hold Task)
  * Hold Tremor Spectral Power (Hold Task)
  * Hold Average Tremor Amplitude (cm) (Hold Task)
  * Hold Spatial Spread (px) (Hold Task)

* **Kinetic tremor**:
  * Drag Peak Tremor Amplitude (cm) (Drag Task)
  * Drag Tremor Spectral Power (Drag Task)
  * Drag Average Tremor Amplitude (cm) (Drag Task)
  * Drag Path Efficiency (Drag Task)

---

# Stage 2: Transparent Statistical Matrices
Below are the calculated raw statistical tables for each clinical concept. Metrics are sorted by the absolute strength of their correlation with the corresponding MDS-UPDRS subscore.

## Bradykinesia
*Slowness of active voluntary movement execution (decay of velocity/frequency). Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Tap Frequency (Hz) | Tap | -0.87 | -0.74 | 0.54 | 1.58 | N/A | 2.82 | N/A |
| Mean Intertap Interval (ms) | Tap | 0.87 | 0.65 | 0.15 | -1.39 | N/A | 393.97 | N/A |
| Drag Movement Time (ms) | Drag | -0.87 | -0.99 | -0.08 | 2.11 | N/A | 999.00 | N/A |
| Pinch Cycle Frequency (Hz) | Pinch | 0.87 | 0.85 | 0.43 | -1.80 | N/A | 0.67 | N/A |
| Mean Pinch Interval (ms) | Pinch | -0.87 | -0.93 | 0.69 | 1.96 | N/A | 1406.53 | N/A |
| Pinch Mean Opening Speed (mm/s) | Pinch | 0.87 | 0.75 | 0.54 | -1.59 | N/A | 241.35 | N/A |
| Pinch Median Opening Speed (mm/s) | Pinch | 0.87 | 0.83 | 0.66 | -1.77 | N/A | 247.19 | N/A |
| Drag Initiation Delay (ms) | Drag | -0.87 | -0.99 | 1.00 | 2.11 | N/A | 1788629516608.17 | N/A |
| Drag Mean Speed (px/s) | Drag | 0.00 | -0.14 | 0.33 | 0.31 | N/A | 1170.84 | N/A |
| Drag Median Speed (px/s) | Drag | 0.00 | 0.23 | 0.36 | -0.48 | N/A | 1193.98 | N/A |
| Drag Peak Speed (px/s) | Drag | 0.00 | 0.40 | -0.02 | -0.85 | N/A | 1858.45 | N/A |
| Pinch Max Opening Velocity (mm/s) | Pinch | 0.00 | -0.33 | 0.31 | 0.70 | N/A | 8988.07 | N/A |
| Tap Initiation Delay (ms) | Tap | 0.00 | 0.47 | 0.26 | -0.99 | N/A | 768.33 | N/A |
| Pinch Initiation Delay (ms) | Pinch | 0.00 | 0.41 | 0.96 | -0.86 | N/A | 664.67 | N/A |
| Hold Initiation Delay (ms) | Hold | 0.00 | 0.35 | 0.80 | -0.74 | N/A | 1149.00 | N/A |

## Hypokinesia
*Reduction in spatial range of motion or target undershooting. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Drag Terminal Undershoot (px) | Drag | 0.00 | -0.37 | 0.42 | 0.79 | N/A | 14.04 | N/A |
| Drag Movement Amplitude (px) | Drag | 0.00 | 0.41 | 0.55 | -0.87 | N/A | 763.99 | N/A |
| Drag Signed Target Deviation (px) | Drag | 0.00 | 0.39 | 0.43 | -0.82 | N/A | -13.10 | N/A |
| Drag Undershoot Proportion | Drag | 0.00 | -0.36 | N/A | 0.76 | N/A | 0.77 | N/A |
| Pinch Max Opening Distance (mm) | Pinch | 0.00 | -0.17 | 0.94 | 0.35 | N/A | 159.10 | N/A |
| Pinch Median Opening Distance (mm) | Pinch | 0.00 | -0.34 | 0.95 | 0.73 | N/A | 144.65 | N/A |

## Sequence effect
*Progressive decay/decrement of speed or amplitude as movement repeats. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Drag Speed Decrement Ratio | Drag | -0.87 | -0.61 | N/A | 1.29 | N/A | 1.00 | N/A |
| Drag Amplitude Decrement Ratio | Drag | 0.87 | 0.95 | N/A | -2.01 | N/A | 1.02 | N/A |
| Drag Amplitude Slope | Drag | 0.87 | 1.00 | N/A | -2.11 | N/A | -0.35 | N/A |
| Drag Duration Slope | Drag | -0.87 | -0.64 | N/A | 1.36 | N/A | -18.95 | N/A |
| Pinch Opening Distance Decrement Ratio | Pinch | 0.87 | 0.64 | -0.38 | -1.36 | N/A | 0.02 | N/A |
| Pinch Opening Distance Slope (mm/cycle) | Pinch | -0.87 | -0.95 | -0.12 | 2.01 | N/A | 0.06 | N/A |
| Pinch Cycle Duration Decrement Ratio | Pinch | -0.87 | -0.58 | 0.06 | 1.23 | N/A | 0.89 | N/A |
| Pinch Cycle Speed Decrement Ratio | Pinch | 0.87 | 0.57 | 0.03 | -1.21 | N/A | 1.13 | N/A |
| Tap Interval Decrement Ratio | Tap | 0.00 | -0.49 | -0.50 | 1.03 | N/A | 0.80 | N/A |
| Tap Frequency Decrement Ratio | Tap | 0.00 | 0.49 | -0.04 | -1.04 | N/A | 1.29 | N/A |
| Tap Interval Slope (ms/tap) | Tap | 0.00 | -0.43 | 0.02 | 0.91 | N/A | -9.05 | N/A |
| Tap Frequency Slope (Hz/tap) | Tap | 0.00 | 0.27 | 0.07 | -0.58 | N/A | 0.02 | N/A |
| Drag Speed Slope | Drag | 0.00 | -0.43 | N/A | 0.92 | N/A | 5.65 | N/A |
| Pinch Cycle Duration Slope (ms/cycle) | Pinch | 0.00 | 0.50 | -0.01 | -1.05 | N/A | -28.38 | N/A |
| Pinch Cycle Speed Slope (Hz/cycle) | Pinch | 0.00 | -0.26 | -0.30 | 0.54 | N/A | 0.01 | N/A |

## Hesitations halts
*Rhythm arhythmicity, pauses, freezes, or transient blocks in coordination. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Tap Total Hesitation/Halt Duration (ms) | Tap | 0.87 | 0.50 | 0.68 | -1.07 | N/A | 5464.33 | N/A |
| Tap Longest Hesitation/Halt Duration (ms) | Tap | 0.87 | 0.52 | 0.40 | -1.10 | N/A | 1786.33 | N/A |
| Tap Total Hesitation/Halt Count | Tap | 0.50 | 0.50 | 0.73 | -1.06 | N/A | 4.00 | N/A |
| Pinch Total Hesitation/Halt Count | Pinch | 0.50 | 0.50 | -0.00 | -1.06 | N/A | 0.67 | N/A |
| Pinch Total Hesitation/Halt Duration (ms) | Pinch | 0.50 | 0.50 | -0.00 | -1.06 | N/A | 1083.33 | N/A |
| Pinch Longest Hesitation/Halt Duration (ms) | Pinch | 0.50 | 0.50 | 0.00 | -1.06 | N/A | 578.00 | N/A |
| Drag Total Hesitation/Halt Count | Drag | 0.50 | 0.50 | -0.06 | -1.06 | N/A | 2.67 | N/A |
| Drag Total Hesitation/Halt Duration (ms) | Drag | 0.00 | 0.32 | -0.01 | -0.67 | N/A | 423.67 | N/A |
| Drag Longest Hesitation/Halt Duration (ms) | Drag | 0.00 | 0.15 | -0.07 | -0.32 | N/A | 184.33 | N/A |

## Akinesia
*Initiation lag or reaction delay to lift/start the motor sequence. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Drag Initiation Delay (ms) | Drag | -0.87 | -0.99 | 1.00 | 2.11 | N/A | 1788629516608.17 | N/A |
| Tap Initiation Delay (ms) | Tap | 0.00 | 0.47 | 0.26 | -0.99 | N/A | 768.33 | N/A |
| Pinch Initiation Delay (ms) | Pinch | 0.00 | 0.41 | 0.96 | -0.86 | N/A | 664.67 | N/A |
| Hold Initiation Delay (ms) | Hold | 0.00 | 0.35 | 0.80 | -0.74 | N/A | 1149.00 | N/A |
| Hold Target Contact Delay (ms) | Hold | 0.00 | 0.35 | 0.80 | -0.74 | N/A | 1149.00 | N/A |
| Hold Release Delay (ms) | Hold | 0.00 | 0.36 | 0.25 | -0.76 | N/A | 850.50 | N/A |

## Postural tremor
*Involuntary rhythmic oscillations while holding posture statically on a target. Correlated with Tremor Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Hold Tremor Spectral Power | Hold | -0.87 | -0.62 | 0.53 | 1.32 | N/A | 0.01 | N/A |
| Hold Average Tremor Amplitude (cm) | Hold | -0.87 | -0.77 | 0.55 | 1.63 | N/A | 0.04 | N/A |
| Hold Spatial Spread (px) | Hold | -0.87 | -0.81 | 0.08 | 1.72 | N/A | 2.51 | N/A |
| Hold Peak Tremor Amplitude (cm) | Hold | 0.00 | -0.01 | -0.44 | 0.02 | N/A | 0.42 | N/A |

## Kinetic tremor
*Involuntary rhythmic oscillations transverse to active voluntary path trajectories. Correlated with Tremor Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Drag Tremor Spectral Power | Drag | -0.87 | -0.92 | 0.08 | 1.94 | N/A | 2.12 | N/A |
| Drag Average Tremor Amplitude (cm) | Drag | -0.87 | -0.94 | 0.02 | 2.00 | N/A | 0.41 | N/A |
| Drag Peak Tremor Amplitude (cm) | Drag | 0.00 | 0.27 | -0.03 | -0.56 | N/A | 1.61 | N/A |
| Drag Path Efficiency | Drag | 0.00 | 0.00 | 0.40 | -0.00 | N/A | 0.99 | N/A |