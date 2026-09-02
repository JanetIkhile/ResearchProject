# Quantitative Clinical Concept Feature Evaluation Report

This report aggregates digital motor features across the **Tapping, Drag, Pinch, and Hold** tasks, grouping them by clinical concepts to select the strongest candidate measures based on clinical scores.

## Clinical Cohort Profile

| Participant | MDS-UPDRS Total | Bradykinesia Subscore | Tremor Subscore | Clinical Subtype |
| :--- | :---: | :---: | :---: | :--- |

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
| Tap Frequency (Hz) | Tap | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Mean Intertap Interval (ms) | Tap | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Drag Mean Speed (px/s) | Drag | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Drag Median Speed (px/s) | Drag | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Drag Peak Speed (px/s) | Drag | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Drag Movement Time (ms) | Drag | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Pinch Cycle Frequency (Hz) | Pinch | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Mean Pinch Interval (ms) | Pinch | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Pinch Mean Opening Speed (mm/s) | Pinch | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Pinch Median Opening Speed (mm/s) | Pinch | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Pinch Max Opening Velocity (mm/s) | Pinch | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Tap Initiation Delay (ms) | Tap | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Drag Initiation Delay (ms) | Drag | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Pinch Initiation Delay (ms) | Pinch | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Hold Initiation Delay (ms) | Hold | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

## Hypokinesia
*Reduction in spatial range of motion or target undershooting. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Drag Terminal Undershoot (px) | Drag | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Drag Movement Amplitude (px) | Drag | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Drag Signed Target Deviation (px) | Drag | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Drag Undershoot Proportion | Drag | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Pinch Max Opening Distance (mm) | Pinch | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Pinch Median Opening Distance (mm) | Pinch | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

## Sequence effect
*Progressive decay/decrement of speed or amplitude as movement repeats. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Tap Interval Decrement Ratio | Tap | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Tap Frequency Decrement Ratio | Tap | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Tap Interval Slope (ms/tap) | Tap | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Tap Frequency Slope (Hz/tap) | Tap | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Drag Speed Decrement Ratio | Drag | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Drag Speed Slope | Drag | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Drag Amplitude Decrement Ratio | Drag | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Drag Amplitude Slope | Drag | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Drag Duration Slope | Drag | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Pinch Opening Distance Decrement Ratio | Pinch | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Pinch Opening Distance Slope (mm/cycle) | Pinch | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Pinch Cycle Duration Decrement Ratio | Pinch | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Pinch Cycle Speed Decrement Ratio | Pinch | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Pinch Cycle Duration Slope (ms/cycle) | Pinch | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Pinch Cycle Speed Slope (Hz/cycle) | Pinch | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

## Hesitations halts
*Rhythm arhythmicity, pauses, freezes, or transient blocks in coordination. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Tap Total Hesitation/Halt Count | Tap | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Tap Total Hesitation/Halt Duration (ms) | Tap | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Tap Longest Hesitation/Halt Duration (ms) | Tap | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Pinch Total Hesitation/Halt Count | Pinch | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Pinch Total Hesitation/Halt Duration (ms) | Pinch | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Pinch Longest Hesitation/Halt Duration (ms) | Pinch | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Drag Total Hesitation/Halt Count | Drag | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Drag Total Hesitation/Halt Duration (ms) | Drag | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Drag Longest Hesitation/Halt Duration (ms) | Drag | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

## Akinesia
*Initiation lag or reaction delay to lift/start the motor sequence. Correlated with Bradykinesia Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Tap Initiation Delay (ms) | Tap | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Drag Initiation Delay (ms) | Drag | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Pinch Initiation Delay (ms) | Pinch | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Hold Initiation Delay (ms) | Hold | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Hold Target Contact Delay (ms) | Hold | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Hold Release Delay (ms) | Hold | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

## Postural tremor
*Involuntary rhythmic oscillations while holding posture statically on a target. Correlated with Tremor Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Hold Peak Tremor Amplitude (cm) | Hold | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Hold Tremor Spectral Power | Hold | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Hold Average Tremor Amplitude (cm) | Hold | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Hold Spatial Spread (px) | Hold | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

## Kinetic tremor
*Involuntary rhythmic oscillations transverse to active voluntary path trajectories. Correlated with Tremor Subscore.*

| Feature | Task | Spearman $\rho$ | Pearson $r$ | ICC (3,1) | Cohen's $d$ (Mild-Sev) | Kruskal H-stat | Mean (AR) | Mean (TD) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Drag Peak Tremor Amplitude (cm) | Drag | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Drag Tremor Spectral Power | Drag | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Drag Average Tremor Amplitude (cm) | Drag | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Drag Path Efficiency | Drag | N/A | N/A | N/A | N/A | N/A | N/A | N/A |