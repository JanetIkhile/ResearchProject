# Quantitative Clinical Concept Feature Evaluation Report

This report aggregates digital motor features across the **Tapping, Drag, Pinch, and Hold** tasks, grouping them by clinical concepts to select the strongest candidate measures based on clinical scores.

## Clinical Cohort Profile

| Participant | MDS-UPDRS Total | Bradykinesia Subscore | Tremor Subscore | Clinical Subtype |
| :--- | :---: | :---: | :---: | :--- |
| **P01** | 34 | 17 | 0 | AR |
| **P03** | 21 | 8 | 5 | AR |
| **P04** | 44 | 15 | 15 | AR |
| **P05** | 31 | 13 | 6 | AR |
| **P06** | 20 | 10 | 0 | AR |

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
  * Pinch Peak Opening Speed (mm/s) (Pinch Task)

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
| Drag Mean Speed (px/s) | Drag | -0.80 | -0.57 | 0.45 | 1.67 | N/A | 1202.17 | N/A |
| Drag Peak Speed (px/s) | Drag | -0.80 | -0.50 | -0.02 | 1.23 | N/A | 1948.26 | N/A |
| Tap Frequency (Hz) | Tap | -0.70 | -0.66 | 0.74 | 2.85 | N/A | 3.22 | N/A |
| Mean Intertap Interval (ms) | Tap | 0.70 | 0.73 | 0.64 | -2.28 | N/A | 331.70 | N/A |
| Drag Median Speed (px/s) | Drag | -0.60 | -0.49 | 0.42 | 1.41 | N/A | 1220.84 | N/A |
| Drag Movement Time (ms) | Drag | 0.30 | 0.48 | 0.29 | -0.66 | N/A | 974.10 | N/A |
| Pinch Cycle Frequency (Hz) | Pinch | 0.20 | -0.03 | 0.77 | 0.47 | N/A | 0.74 | N/A |
| Mean Pinch Interval (ms) | Pinch | -0.20 | -0.07 | 0.80 | -0.25 | N/A | 1351.37 | N/A |
| Pinch Mean Opening Speed (mm/s) | Pinch | -0.20 | -0.29 | 0.90 | 0.84 | N/A | 226.90 | N/A |
| Pinch Median Opening Speed (mm/s) | Pinch | -0.20 | -0.32 | 0.87 | 0.88 | N/A | 232.69 | N/A |
| Pinch Peak Opening Speed (mm/s) | Pinch | -0.20 | -0.44 | 0.70 | 1.28 | N/A | 8992.71 | N/A |

## Hypokinesia
*Reduction in spatial range of motion or target undershooting. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Drag Movement Amplitude (px) | Drag | -0.50 | -0.53 | 0.20 | 2.06 | N/A | 748.54 | N/A |
| Drag Terminal Undershoot (px) | Drag | 0.30 | 0.60 | 0.21 | -0.77 | N/A | 20.59 | N/A |
| Drag Signed Target Deviation (px) | Drag | -0.30 | -0.60 | 0.21 | 0.77 | N/A | -20.59 | N/A |
| Drag Undershoot Proportion | Drag | 0.29 | 0.28 | N/A | 0.00 | N/A | 0.96 | N/A |
| Pinch Max Opening Distance (mm) | Pinch | -0.20 | -0.34 | 0.83 | 1.01 | N/A | 174.56 | N/A |
| Pinch Median Opening Distance (mm) | Pinch | -0.20 | -0.36 | 0.76 | 1.07 | N/A | 166.51 | N/A |

## Sequence effect
*Progressive decay/decrement of speed or amplitude as movement repeats. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Drag Speed Slope | Drag | -0.80 | -0.52 | N/A | 1.51 | N/A | 5.82 | N/A |
| Drag Speed Decrement Ratio | Drag | -0.60 | -0.57 | N/A | 1.86 | N/A | 1.02 | N/A |
| Pinch Cycle Speed Slope (Hz/cycle) | Pinch | -0.60 | -0.50 | -0.37 | 0.37 | N/A | 0.01 | N/A |
| Pinch Cycle Duration Decrement Ratio | Pinch | 0.50 | 0.41 | -0.39 | -0.32 | N/A | 0.94 | N/A |
| Pinch Cycle Speed Decrement Ratio | Pinch | -0.50 | -0.41 | -0.38 | 0.31 | N/A | 1.06 | N/A |
| Drag Amplitude Decrement Ratio | Drag | 0.30 | -0.35 | N/A | 0.96 | N/A | 0.80 | N/A |
| Drag Amplitude Slope | Drag | 0.30 | -0.32 | N/A | 0.90 | N/A | -12.17 | N/A |
| Pinch Opening Distance Decrement Ratio | Pinch | -0.30 | -0.28 | 0.34 | 0.53 | N/A | 0.02 | N/A |
| Tap Interval Decrement Ratio | Tap | -0.10 | 0.14 | 0.19 | -0.30 | N/A | 0.96 | N/A |
| Tap Frequency Decrement Ratio | Tap | 0.10 | -0.12 | 0.09 | 0.26 | N/A | 1.05 | N/A |
| Drag Duration Slope | Drag | -0.10 | -0.09 | N/A | -0.12 | N/A | -14.64 | N/A |
| Pinch Cycle Duration Slope (ms/cycle) | Pinch | 0.10 | 0.31 | -0.19 | -0.06 | N/A | -25.80 | N/A |
| Tap Interval Slope (ms/tap) | Tap | 0.00 | 0.13 | 0.09 | -0.42 | N/A | -0.95 | N/A |
| Tap Frequency Slope (Hz/tap) | Tap | 0.00 | -0.28 | -0.11 | 0.65 | N/A | 0.00 | N/A |
| Pinch Opening Distance Slope (mm/cycle) | Pinch | 0.00 | -0.17 | 0.48 | 0.05 | N/A | 0.18 | N/A |

## Hesitations halts
*Rhythm arhythmicity, pauses, freezes, or transient blocks in coordination. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Drag Total Hesitation/Halt Count | Drag | -0.58 | -0.62 | 0.03 | 1.34 | N/A | 1.40 | N/A |
| Drag Total Hesitation/Halt Duration (ms) | Drag | -0.41 | -0.57 | 0.03 | 1.10 | N/A | 241.60 | N/A |
| Drag Longest Hesitation/Halt Duration (ms) | Drag | -0.41 | -0.51 | 0.03 | 0.77 | N/A | 120.00 | N/A |
| Tap Total Hesitation/Halt Count | Tap | -0.37 | -0.45 | 0.18 | 1.34 | N/A | 1.00 | N/A |
| Tap Total Hesitation/Halt Duration (ms) | Tap | -0.15 | -0.24 | 0.10 | 0.82 | N/A | 548.60 | N/A |
| Tap Longest Hesitation/Halt Duration (ms) | Tap | 0.15 | 0.05 | -0.01 | 0.14 | N/A | 360.20 | N/A |
| Pinch Total Hesitation/Halt Count | Pinch | N/A | N/A | 0.00 | 0.00 | N/A | 0.00 | N/A |
| Pinch Total Hesitation/Halt Duration (ms) | Pinch | N/A | N/A | 0.00 | 0.00 | N/A | 0.00 | N/A |
| Pinch Longest Hesitation/Halt Duration (ms) | Pinch | N/A | N/A | 0.00 | 0.00 | N/A | 0.00 | N/A |

## Akinesia
*Initiation lag or reaction delay to lift/start the motor sequence. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Hold Release Delay (ms) | Hold | -0.70 | -0.78 | 0.57 | 1.02 | N/A | 560.80 | N/A |
| Drag Initiation Delay (ms) | Drag | 0.60 | 0.71 | 1.00 | -1.06 | N/A | 1789340451727.50 | N/A |
| Pinch Initiation Delay (ms) | Pinch | -0.50 | -0.46 | 0.28 | 0.49 | N/A | 254.60 | N/A |
| Hold Initiation Delay (ms) | Hold | -0.30 | -0.27 | 0.45 | 0.18 | N/A | 793.20 | N/A |
| Hold Target Contact Delay (ms) | Hold | -0.30 | -0.27 | 0.45 | 0.18 | N/A | 793.20 | N/A |
| Tap Initiation Delay (ms) | Tap | 0.20 | -0.19 | 0.61 | 0.70 | N/A | 416.60 | N/A |

## Postural tremor
*Involuntary rhythmic oscillations while holding posture statically on a target. Correlated with Tremor Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Hold Tremor Spectral Power | Hold | 0.72 | 0.36 | 0.47 | -1.46 | N/A | 0.00 | N/A |
| Hold Average Tremor Amplitude (cm) | Hold | 0.72 | 0.61 | 0.62 | -1.59 | N/A | 0.02 | N/A |
| Hold Peak Tremor Amplitude (cm) | Hold | 0.67 | 0.19 | 0.40 | -1.27 | N/A | 0.40 | N/A |
| Hold Spatial Spread (px) | Hold | 0.21 | -0.32 | 0.91 | 0.74 | N/A | 2.36 | N/A |

## Kinetic tremor
*Involuntary rhythmic oscillations transverse to active voluntary path trajectories. Correlated with Tremor Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Drag Tremor Spectral Power | Drag | -0.87 | -0.64 | 0.07 | 2.91 | N/A | 1.36 | N/A |
| Drag Average Tremor Amplitude (cm) | Drag | -0.87 | -0.62 | 0.09 | 3.43 | N/A | 0.37 | N/A |
| Drag Path Efficiency | Drag | -0.36 | -0.38 | 0.11 | -0.14 | N/A | 0.99 | N/A |
| Drag Peak Tremor Amplitude (cm) | Drag | -0.15 | -0.16 | 0.35 | 0.85 | N/A | 1.79 | N/A |