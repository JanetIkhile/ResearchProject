# Quantitative Clinical Concept Feature Evaluation Report

This report aggregates digital motor features across the **Tapping, Drag, Pinch, and Hold** tasks, grouping them by clinical concepts to select the strongest candidate measures based on clinical scores.

## Clinical Cohort Profile

| Participant | MDS-UPDRS Total | Bradykinesia Subscore | Tremor Subscore | Clinical Subtype |
| :--- | :---: | :---: | :---: | :--- |
| **P01** | 34 | 17 | 0 | AR |
| **P02** | 26 | 17 | 0 | AR |
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
| Tap Frequency (Hz) | Tap | -0.72 | -0.59 | 0.74 | 1.56 | 2.00 | 3.22 | N/A |
| Mean Intertap Interval (ms) | Tap | 0.72 | 0.61 | 0.63 | -1.39 | 2.00 | 330.35 | N/A |
| Drag Peak Speed (px/s) | Drag | -0.38 | -0.48 | -0.01 | 1.14 | 2.00 | 1926.66 | N/A |
| Drag Mean Speed (px/s) | Drag | -0.35 | -0.42 | 0.44 | 0.90 | 2.57 | 1220.13 | N/A |
| Pinch Cycle Frequency (Hz) | Pinch | 0.32 | 0.14 | 0.79 | -0.23 | 0.86 | 0.77 | N/A |
| Mean Pinch Interval (ms) | Pinch | -0.32 | -0.24 | 0.83 | 0.39 | 0.86 | 1303.56 | N/A |
| Drag Median Speed (px/s) | Drag | -0.23 | -0.33 | 0.41 | 0.64 | 1.14 | 1246.01 | N/A |
| Pinch Peak Opening Speed (mm/s) | Pinch | -0.20 | -0.39 | 0.44 | 0.97 | 3.71 | 8982.08 | N/A |
| Pinch Mean Opening Speed (mm/s) | Pinch | -0.12 | -0.33 | 0.90 | 0.69 | 0.29 | 219.16 | N/A |
| Pinch Median Opening Speed (mm/s) | Pinch | -0.12 | -0.36 | 0.86 | 0.75 | 0.29 | 224.66 | N/A |
| Drag Movement Time (ms) | Drag | 0.09 | 0.25 | 0.29 | -0.66 | 0.29 | 952.83 | N/A |

## Hypokinesia
*Reduction in spatial range of motion or target undershooting. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Drag Terminal Undershoot (px) | Drag | 0.43 | 0.56 | 0.21 | -2.19 | 2.00 | 20.65 | N/A |
| Drag Signed Target Deviation (px) | Drag | -0.43 | -0.56 | 0.21 | 2.19 | 2.00 | -20.65 | N/A |
| Drag Undershoot Proportion | Drag | 0.42 | 0.38 | N/A | -1.00 | 1.25 | 0.97 | N/A |
| Pinch Median Opening Distance (mm) | Pinch | -0.20 | -0.42 | 0.77 | 0.96 | 3.71 | 164.07 | N/A |
| Pinch Max Opening Distance (mm) | Pinch | 0.06 | -0.28 | 0.81 | 0.61 | 3.43 | 174.98 | N/A |
| Drag Movement Amplitude (px) | Drag | 0.03 | -0.19 | 0.20 | 0.07 | 0.29 | 749.92 | N/A |

## Sequence effect
*Progressive decay/decrement of speed or amplitude as movement repeats. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Drag Speed Slope | Drag | -0.75 | -0.54 | N/A | 1.96 | 3.43 | 1.31 | N/A |
| Pinch Cycle Speed Slope (Hz/cycle) | Pinch | -0.75 | -0.65 | -0.36 | 1.61 | 3.43 | 0.01 | N/A |
| Pinch Cycle Duration Decrement Ratio | Pinch | 0.67 | 0.60 | -0.37 | -1.66 | 2.57 | 0.95 | N/A |
| Pinch Cycle Speed Decrement Ratio | Pinch | -0.67 | -0.60 | -0.35 | 1.69 | 2.57 | 1.05 | N/A |
| Drag Speed Decrement Ratio | Drag | -0.64 | -0.56 | N/A | 1.87 | 2.00 | 1.00 | N/A |
| Drag Amplitude Slope | Drag | 0.58 | -0.16 | N/A | -1.49 | 3.71 | -10.14 | N/A |
| Pinch Opening Distance Decrement Ratio | Pinch | -0.58 | -0.52 | 0.19 | 1.60 | 3.43 | -0.01 | N/A |
| Tap Interval Decrement Ratio | Tap | -0.46 | -0.11 | 0.19 | 1.20 | 3.71 | 0.94 | N/A |
| Tap Frequency Decrement Ratio | Tap | 0.46 | 0.14 | 0.08 | -1.22 | 3.71 | 1.06 | N/A |
| Pinch Cycle Duration Slope (ms/cycle) | Pinch | 0.41 | 0.47 | -0.17 | -1.08 | 0.86 | -20.61 | N/A |
| Drag Amplitude Decrement Ratio | Drag | 0.38 | -0.20 | N/A | -0.97 | 2.57 | 0.83 | N/A |
| Tap Interval Slope (ms/tap) | Tap | 0.20 | 0.23 | 0.10 | -0.11 | 2.00 | -0.82 | N/A |
| Pinch Opening Distance Slope (mm/cycle) | Pinch | 0.12 | 0.08 | 0.35 | -0.47 | 1.14 | 0.68 | N/A |
| Tap Frequency Slope (Hz/tap) | Tap | -0.06 | -0.30 | -0.11 | 0.29 | 3.43 | 0.00 | N/A |
| Drag Duration Slope | Drag | 0.06 | 0.09 | N/A | -0.44 | 2.00 | -12.14 | N/A |

## Hesitations halts
*Rhythm arhythmicity, pauses, freezes, or transient blocks in coordination. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Drag Total Hesitation/Halt Count | Drag | -0.69 | -0.70 | 0.06 | 5.00 | 3.58 | 1.17 | N/A |
| Drag Total Hesitation/Halt Duration (ms) | Drag | -0.59 | -0.65 | 0.05 | 4.18 | 2.90 | 201.33 | N/A |
| Drag Longest Hesitation/Halt Duration (ms) | Drag | -0.59 | -0.61 | 0.05 | 7.86 | 2.90 | 100.00 | N/A |
| Tap Total Hesitation/Halt Count | Tap | -0.45 | -0.54 | 0.21 | 1.34 | 3.58 | 0.83 | N/A |
| Tap Total Hesitation/Halt Duration (ms) | Tap | -0.31 | -0.38 | 0.13 | 0.82 | 2.90 | 457.17 | N/A |
| Tap Longest Hesitation/Halt Duration (ms) | Tap | -0.09 | -0.16 | 0.03 | 0.14 | 2.26 | 300.17 | N/A |
| Pinch Total Hesitation/Halt Count | Pinch | N/A | N/A | 0.00 | 0.00 | N/A | 0.00 | N/A |
| Pinch Total Hesitation/Halt Duration (ms) | Pinch | N/A | N/A | 0.00 | 0.00 | N/A | 0.00 | N/A |
| Pinch Longest Hesitation/Halt Duration (ms) | Pinch | N/A | N/A | 0.00 | 0.00 | N/A | 0.00 | N/A |

## Akinesia
*Initiation lag or reaction delay to lift/start the motor sequence. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Drag Initiation Delay (ms) | Drag | 0.75 | 0.76 | 1.00 | -4.53 | 3.43 | 1789581771919.33 | N/A |
| Pinch Initiation Delay (ms) | Pinch | -0.70 | -0.52 | 0.29 | 1.54 | 3.71 | 247.67 | N/A |
| Hold Initiation Delay (ms) | Hold | -0.58 | -0.45 | 0.51 | 5.12 | 3.43 | 727.33 | N/A |
| Hold Target Contact Delay (ms) | Hold | -0.58 | -0.45 | 0.51 | 5.12 | 3.43 | 727.33 | N/A |
| Hold Release Delay (ms) | Hold | -0.38 | -0.42 | 0.59 | 0.61 | 0.86 | 579.00 | N/A |
| Tap Initiation Delay (ms) | Tap | 0.06 | -0.27 | 0.64 | 0.66 | 3.43 | 408.33 | N/A |

## Postural tremor
*Involuntary rhythmic oscillations while holding posture statically on a target. Correlated with Tremor Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Hold Peak Tremor Amplitude (cm) | Hold | 0.76 | 0.32 | 0.02 | -1.66 | N/A | 0.35 | N/A |
| Hold Tremor Spectral Power | Hold | 0.76 | 0.45 | -0.12 | -1.92 | N/A | 0.00 | N/A |
| Hold Average Tremor Amplitude (cm) | Hold | 0.76 | 0.66 | -0.06 | -2.06 | N/A | 0.02 | N/A |
| Hold Spatial Spread (px) | Hold | -0.15 | -0.28 | 0.83 | 0.63 | N/A | 2.32 | N/A |

## Kinetic tremor
*Involuntary rhythmic oscillations transverse to active voluntary path trajectories. Correlated with Tremor Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Drag Tremor Spectral Power | Drag | -0.88 | -0.66 | 0.08 | 2.46 | N/A | 1.61 | N/A |
| Drag Average Tremor Amplitude (cm) | Drag | -0.88 | -0.61 | 0.20 | 2.12 | N/A | 0.41 | N/A |
| Drag Peak Tremor Amplitude (cm) | Drag | -0.39 | -0.20 | 0.32 | 0.96 | N/A | 1.82 | N/A |
| Drag Path Efficiency | Drag | -0.33 | -0.49 | 0.18 | 0.24 | N/A | 1.00 | N/A |