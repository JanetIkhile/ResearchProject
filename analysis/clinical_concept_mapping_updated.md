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
| Tap Frequency (Hz) | Tap | -1.00 | -0.74 | 0.85 | 2.68 | N/A | 3.24 | N/A |
| Mean Intertap Interval (ms) | Tap | 1.00 | 0.81 | 0.68 | -2.62 | N/A | 366.70 | N/A |
| Drag Peak Speed (px/s) | Drag | -0.80 | -0.75 | 0.55 | 1.19 | N/A | 1528.12 | N/A |
| Drag Movement Time (ms) | Drag | 0.80 | 0.67 | 0.54 | -0.76 | N/A | 1130.67 | N/A |
| Drag Initiation Delay (ms) | Drag | 0.80 | 0.90 | 0.01 | -1.51 | N/A | 691.67 | N/A |
| Drag Mean Speed (px/s) | Drag | -0.40 | -0.67 | 0.82 | 1.47 | N/A | 1009.08 | N/A |
| Drag Median Speed (px/s) | Drag | -0.40 | -0.70 | 0.70 | 1.49 | N/A | 1047.78 | N/A |
| Pinch Cycle Frequency (Hz) | Pinch | -0.40 | -0.66 | 0.91 | 1.45 | N/A | 0.77 | N/A |
| Mean Pinch Interval (ms) | Pinch | 0.40 | 0.63 | 0.66 | -1.30 | N/A | 1260.36 | N/A |
| Pinch Mean Opening Speed (mm/s) | Pinch | -0.40 | -0.58 | -0.17 | 1.07 | N/A | 188.56 | N/A |
| Pinch Median Opening Speed (mm/s) | Pinch | -0.40 | -0.48 | 0.83 | 0.82 | N/A | 198.03 | N/A |
| Pinch Max Opening Velocity (mm/s) | Pinch | -0.40 | -0.60 | 0.22 | 0.78 | N/A | 7488.57 | N/A |
| Tap Initiation Delay (ms) | Tap | -0.40 | 0.42 | 0.75 | 0.46 | N/A | 7865.33 | N/A |
| Pinch Initiation Delay (ms) | Pinch | 0.40 | 0.52 | 0.02 | -0.14 | N/A | 384.00 | N/A |
| Hold Initiation Delay (ms) | Hold | 0.40 | 0.50 | 0.46 | -0.00 | N/A | 7475.33 | N/A |

## Hypokinesia
*Reduction in spatial range of motion or target undershooting. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Drag Terminal Undershoot (px) | Drag | 0.60 | 0.66 | -0.02 | -0.24 | N/A | 21.74 | N/A |
| Drag Signed Target Deviation (px) | Drag | -0.60 | -0.66 | -0.05 | 0.24 | N/A | -21.74 | N/A |
| Drag Movement Amplitude (px) | Drag | 0.40 | 0.22 | -0.05 | -2.24 | N/A | 672.50 | N/A |
| Pinch Max Opening Distance (mm) | Pinch | -0.40 | -0.34 | 0.56 | 0.17 | N/A | 149.69 | N/A |
| Drag Undershoot Proportion | Drag | 0.26 | 0.49 | N/A | 0.00 | N/A | 1.00 | N/A |
| Pinch Median Opening Distance (mm) | Pinch | 0.20 | -0.21 | 0.46 | -0.33 | N/A | 134.71 | N/A |

## Sequence effect
*Progressive decay/decrement of speed or amplitude as movement repeats. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Tap Interval Slope (ms/tap) | Tap | -0.60 | -0.59 | 0.08 | 0.09 | N/A | -3.57 | N/A |
| Drag Amplitude Decrement Ratio | Drag | 0.60 | 0.53 | N/A | -0.07 | N/A | 1.00 | N/A |
| Pinch Opening Distance Slope (mm/cycle) | Pinch | 0.60 | 0.72 | -0.22 | -0.60 | N/A | 0.01 | N/A |
| Drag Speed Decrement Ratio | Drag | -0.40 | -0.16 | N/A | 1.72 | N/A | 1.13 | N/A |
| Drag Speed Slope | Drag | -0.40 | 0.04 | N/A | 1.58 | N/A | 26.33 | N/A |
| Drag Amplitude Slope | Drag | -0.40 | 0.45 | N/A | 0.14 | N/A | 0.15 | N/A |
| Drag Duration Slope | Drag | 0.40 | -0.35 | N/A | -0.51 | N/A | -71.65 | N/A |
| Pinch Opening Distance Decrement Ratio | Pinch | -0.40 | -0.65 | -0.33 | 0.35 | N/A | 0.03 | N/A |
| Tap Interval Decrement Ratio | Tap | 0.00 | -0.57 | 0.60 | -0.20 | N/A | 0.93 | N/A |
| Tap Frequency Decrement Ratio | Tap | 0.00 | 0.58 | 0.59 | 0.19 | N/A | 1.09 | N/A |
| Tap Frequency Slope (Hz/tap) | Tap | 0.00 | 0.60 | 0.58 | 0.11 | N/A | 0.03 | N/A |
| Pinch Cycle Duration Decrement Ratio | Pinch | 0.00 | -0.21 | 0.50 | -1.22 | N/A | 0.68 | N/A |
| Pinch Cycle Speed Decrement Ratio | Pinch | 0.00 | 0.36 | 0.51 | 0.77 | N/A | 1.70 | N/A |
| Pinch Cycle Duration Slope (ms/cycle) | Pinch | 0.00 | -0.53 | 0.20 | -0.05 | N/A | -248.64 | N/A |
| Pinch Cycle Speed Slope (Hz/cycle) | Pinch | 0.00 | 0.44 | 0.30 | 0.51 | N/A | 0.09 | N/A |

## Hesitations halts
*Rhythm arhythmicity, pauses, freezes, or transient blocks in coordination. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Pinch Total Hesitation/Halt Count | Pinch | -0.80 | -0.54 | 0.36 | 2.60 | N/A | 1.67 | N/A |
| Pinch Total Hesitation/Halt Duration (ms) | Pinch | -0.40 | 0.01 | 0.40 | 1.53 | N/A | 3709.00 | N/A |
| Pinch Longest Hesitation/Halt Duration (ms) | Pinch | -0.20 | 0.07 | 0.37 | 1.03 | N/A | 2044.33 | N/A |
| Tap Total Hesitation/Halt Count | Tap | 0.11 | 0.30 | 0.04 | 0.00 | N/A | 1.33 | N/A |
| Tap Total Hesitation/Halt Duration (ms) | Tap | 0.11 | 0.41 | -0.04 | 0.00 | N/A | 1409.67 | N/A |
| Tap Longest Hesitation/Halt Duration (ms) | Tap | 0.11 | 0.36 | -0.03 | 0.00 | N/A | 538.00 | N/A |
| Drag Total Hesitation/Halt Count | Drag | 0.11 | 0.30 | 0.12 | 0.00 | N/A | 0.67 | N/A |
| Drag Total Hesitation/Halt Duration (ms) | Drag | 0.11 | 0.30 | 0.11 | 0.00 | N/A | 78.33 | N/A |
| Drag Longest Hesitation/Halt Duration (ms) | Drag | 0.11 | 0.04 | 0.10 | 0.00 | N/A | 39.33 | N/A |

## Akinesia
*Initiation lag or reaction delay to lift/start the motor sequence. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Drag Initiation Delay (ms) | Drag | 0.80 | 0.90 | 0.01 | -1.51 | N/A | 691.67 | N/A |
| Hold Release Delay (ms) | Hold | -0.50 | -0.63 | -0.02 | 0.77 | N/A | 394.50 | N/A |
| Tap Initiation Delay (ms) | Tap | -0.40 | 0.42 | 0.75 | 0.46 | N/A | 7865.33 | N/A |
| Pinch Initiation Delay (ms) | Pinch | 0.40 | 0.52 | 0.02 | -0.14 | N/A | 384.00 | N/A |
| Hold Initiation Delay (ms) | Hold | 0.40 | 0.50 | 0.46 | -0.00 | N/A | 7475.33 | N/A |
| Hold Target Contact Delay (ms) | Hold | 0.20 | 0.22 | 0.30 | -1.36 | N/A | 600.00 | N/A |

## Postural tremor
*Involuntary rhythmic oscillations while holding posture statically on a target. Correlated with Tremor Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Hold Peak Tremor Amplitude (cm) | Hold | 1.00 | 0.98 | -0.15 | -2.90 | N/A | 0.26 | N/A |
| Hold Spatial Spread (px) | Hold | 0.60 | 0.44 | -0.04 | -0.12 | N/A | 1.77 | N/A |
| Hold Tremor Spectral Power | Hold | 0.50 | 0.10 | 0.52 | -0.01 | N/A | 0.01 | N/A |
| Hold Average Tremor Amplitude (cm) | Hold | 0.50 | 0.80 | 0.41 | -1.47 | N/A | 0.03 | N/A |

## Kinetic tremor
*Involuntary rhythmic oscillations transverse to active voluntary path trajectories. Correlated with Tremor Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Drag Average Tremor Amplitude (cm) | Drag | 0.80 | 0.84 | 0.53 | -1.91 | N/A | 0.41 | N/A |
| Drag Path Efficiency | Drag | -0.80 | -0.78 | 0.01 | 0.59 | N/A | 0.99 | N/A |
| Drag Tremor Spectral Power | Drag | 0.40 | 0.60 | 0.30 | -1.20 | N/A | 1.74 | N/A |
| Drag Peak Tremor Amplitude (cm) | Drag | 0.00 | 0.20 | 0.52 | -1.00 | N/A | 2.03 | N/A |