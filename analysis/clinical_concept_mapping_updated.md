# Quantitative Clinical Concept Feature Evaluation Report

This report aggregates digital motor features across the **Tapping, Drag, Pinch, and Hold** tasks, grouping them by clinical concepts to select the strongest candidate measures based on clinical scores.

## Clinical Cohort Profile

| Participant | MDS-UPDRS Total | Bradykinesia Subscore | Tremor Subscore |
| :--- | :---: | :---: | :---: |
| **P01** | 34 | 13 | 14 |
| **P02** | 29 | 15 | 0 |
| **P03** | 21 | 11 | 4 |
| **P04** | 44 | 15 | 15 |
| **P05** | 31 | 13 | 6 |
| **P06** | 20 | 10 | 0 |
| **P07** | 25 | 14 | 0 |
| **P08** | 26 | 12 | 0 |
| **P09** | 46 | 25 | 10 |
| **P11** | 45 | 17 | 12 |

---

# Stage 1: Clinical Concept Mapping Registry
Below are the pre-defined clinical concepts and all candidate digital features mapped under each concept across the 4 tasks:

* **Bradykinesia**:
  * **Primary Features**:
    * Drag Mean Speed (px/s) (Drag Task)
    * Tap Frequency (Hz) (Tap Task)
    * Pinch Mean Opening Speed (mm/s) (Pinch Task)
  * **Exploratory Candidates**:
    * Mean Intertap Interval (ms) (Tap Task)
    * Drag Median Speed (px/s) (Drag Task)
    * Drag Peak Speed (px/s) (Drag Task)
    * Drag Movement Time (ms) (Drag Task)
    * Pinch Cycle Frequency (Hz) (Pinch Task)
    * Mean Pinch Interval (ms) (Pinch Task)
    * Pinch Median Opening Speed (mm/s) (Pinch Task)
    * Pinch Peak Opening Speed (mm/s) (Pinch Task)

* **Hypokinesia**:
  * **Primary Features**:
    * Pinch Median Opening Distance (px) (Pinch Task)
    * Drag Terminal Undershoot (px) (Drag Task)
  * **Exploratory Candidates**:
    * Pinch Max Opening Distance (px) (Pinch Task)
    * Pinch Mean Opening Distance (px) (Pinch Task)
    * Drag Movement Amplitude (px) (Drag Task)
    * Drag Signed Target Deviation (px) (Drag Task)
    * Drag Undershoot Proportion (Drag Task)

* **Sequence effect**:
  * **Primary Features**:
    * Drag Speed Slope (Drag Task)
    * Tap Frequency Slope (Hz/tap) (Tap Task)
    * Pinch Opening Distance Slope (mm/cycle) (Pinch Task)
  * **Exploratory Candidates**:
    * Tap Interval Slope (ms/tap) (Tap Task)
    * Tap Interval Decrement Ratio (Tap Task)
    * Tap Frequency Decrement Ratio (Tap Task)
    * Drag Speed Decrement Ratio (Drag Task)
    * Drag Amplitude Decrement Ratio (Drag Task)
    * Drag Amplitude Slope (Drag Task)
    * Drag Duration Slope (Drag Task)
    * Pinch Opening Distance Decrement Ratio (Pinch Task)
    * Pinch Cycle Duration Decrement Ratio (Pinch Task)
    * Pinch Cycle Speed Decrement Ratio (Pinch Task)
    * Pinch Cycle Duration Slope (ms/cycle) (Pinch Task)
    * Pinch Cycle Speed Slope (Hz/cycle) (Pinch Task)

* **Hesitations halts**:
  * **Primary Features**:
    * Pinch Longest Pause Duration (ms) (Pinch Task)
    * Drag Pause Count (Drag Task)
    * Tap Pause Count (Tap Task)
  * **Exploratory Candidates**:
    * Pinch Pause Count (Pinch Task)
    * Pinch Pause Ratio (Normalized) (Pinch Task)
    * Tap Longest Pause Duration (ms) (Tap Task)
    * Tap Pause Ratio (Normalized) (Tap Task)
    * Drag Longest Pause Duration (ms) (Drag Task)
    * Pinch Amplitude Disruption Count (Pinch Task)

* **Akinesia**:
  * Tap Initiation Delay (ms) (Tap Task)
  * Drag Initiation Delay (ms) (Drag Task)
  * Pinch Initiation Delay (ms) (Pinch Task)
  * Hold Initiation Delay (ms) (Hold Task)
  * Hold Release Delay (ms) (Hold Task)

* **Postural tremor**:
  * **Primary Features**:
    * Hold Tremor Amplitude (px) (Hold Task)
    * Hold Tremor Power (Hold Task)
  * **Exploratory Candidates**:
    * Hold Peak Tremor Amplitude (px) (Hold Task)
    * Hold Spatial Spread (px) (Hold Task)

* **Kinetic tremor**:
  * **Primary Features**:
    * Drag Peak Tremor Amplitude (px) (Drag Task)
  * **Exploratory Candidates**:
    * Drag Tremor Power (Drag Task)
    * Drag Tremor Amplitude (px) (Drag Task)
    * Drag Path Efficiency (Drag Task)

---

# Stage 2: Transparent Statistical Matrices
Below are the calculated raw statistical tables for each clinical concept. Metrics are sorted by the absolute strength of their correlation with the corresponding MDS-UPDRS subscore.

## Bradykinesia
*Slowness of active voluntary movement execution (decay of velocity/frequency). Correlated with Bradykinesia Subscore.*

| Feature | Task | Clinical Domain | Correlated Score | Spearman $\rho$ | 95% Bootstrap CI | Spearman $p$ (raw) | Spearman $p$ (FDR) | Pearson $r$ |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Pinch Mean Opening Speed (mm/s) | Pinch | Bradykinesia | Bradykinesia Subscore | -0.67 | [-1.00, 0.20] | 0.066 | 0.418 | -0.69 |
| Drag Mean Speed (px/s) | Drag | Bradykinesia | Bradykinesia Subscore | -0.60 | [-1.00, 0.16] | 0.114 | 0.418 | -0.61 |
| Pinch Median Opening Speed (mm/s) | Pinch | Bradykinesia | Bradykinesia Subscore | -0.60 | [-0.97, 0.28] | 0.114 | 0.418 | -0.68 |
| Drag Median Speed (px/s) | Drag | Bradykinesia | Bradykinesia Subscore | -0.54 | [-1.00, 0.25] | 0.165 | 0.454 | -0.56 |
| Pinch Peak Opening Speed (mm/s) | Pinch | Bradykinesia | Bradykinesia Subscore | -0.43 | [-0.93, 0.49] | 0.283 | 0.604 | -0.50 |
| Drag Peak Speed (px/s) | Drag | Bradykinesia | Bradykinesia Subscore | -0.40 | [-0.92, 0.66] | 0.329 | 0.604 | -0.64 |
| Tap Frequency (Hz) | Tap | Bradykinesia | Bradykinesia Subscore | -0.31 | [-0.75, 0.55] | 0.450 | 0.619 | -0.31 |
| Mean Intertap Interval (ms) | Tap | Bradykinesia | Bradykinesia Subscore | 0.31 | [-0.55, 0.75] | 0.450 | 0.619 | 0.30 |
| Drag Movement Time (ms) | Drag | Bradykinesia | Bradykinesia Subscore | 0.23 | [-0.79, 0.84] | 0.586 | 0.716 | 0.22 |
| Pinch Cycle Frequency (Hz) | Pinch | Bradykinesia | Bradykinesia Subscore | -0.14 | [-0.84, 0.64] | 0.733 | 0.733 | -0.20 |
| Mean Pinch Interval (ms) | Pinch | Bradykinesia | Bradykinesia Subscore | 0.14 | [-0.64, 0.84] | 0.733 | 0.733 | 0.15 |

## Hypokinesia
*Reduction in spatial range of motion or target undershooting. Correlated with Bradykinesia Subscore.*

| Feature | Task | Clinical Domain | Correlated Score | Spearman $\rho$ | 95% Bootstrap CI | Spearman $p$ (raw) | Spearman $p$ (FDR) | Pearson $r$ |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Pinch Median Opening Distance (mm) | Pinch | Bradykinesia | Bradykinesia Subscore | -0.33 | [-0.92, 0.62] | 0.432 | 0.788 | -0.40 |
| Drag Terminal Undershoot (px) | Drag | Bradykinesia | Bradykinesia Subscore | 0.23 | [-0.72, 0.85] | 0.586 | 0.788 | 0.25 |
| Drag Signed Target Deviation (px) | Drag | Bradykinesia | Bradykinesia Subscore | -0.23 | [-0.85, 0.72] | 0.586 | 0.788 | -0.25 |
| Pinch Max Opening Distance (mm) | Pinch | Bradykinesia | Bradykinesia Subscore | -0.19 | [-0.88, 0.67] | 0.647 | 0.788 | -0.32 |
| Drag Movement Amplitude (px) | Drag | Bradykinesia | Bradykinesia Subscore | 0.12 | [-0.67, 0.90] | 0.776 | 0.788 | -0.15 |
| Drag Undershoot Proportion | Drag | Bradykinesia | Bradykinesia Subscore | 0.11 | [-0.69, 0.89] | 0.788 | 0.788 | 0.10 |

## Sequence effect
*Progressive decay/decrement of speed or amplitude as movement repeats. Correlated with Bradykinesia Subscore.*

| Feature | Task | Clinical Domain | Correlated Score | Spearman $\rho$ | 95% Bootstrap CI | Spearman $p$ (raw) | Spearman $p$ (FDR) | Pearson $r$ |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Drag Speed Slope | Drag | Bradykinesia | Bradykinesia Subscore | -0.80 | [-1.00, -0.12] | 0.018 | 0.275 | -0.72 |
| Drag Speed Decrement Ratio | Drag | Bradykinesia | Bradykinesia Subscore | -0.53 | [-0.99, 0.34] | 0.177 | 0.771 | -0.54 |
| Tap Frequency Slope (Hz/tap) | Tap | Bradykinesia | Bradykinesia Subscore | -0.52 | [-0.96, 0.20] | 0.188 | 0.771 | -0.58 |
| Tap Interval Slope (ms/tap) | Tap | Bradykinesia | Bradykinesia Subscore | 0.41 | [-0.53, 0.96] | 0.313 | 0.771 | 0.49 |
| Pinch Cycle Duration Decrement Ratio | Pinch | Bradykinesia | Bradykinesia Subscore | 0.41 | [-0.45, 0.92] | 0.313 | 0.771 | 0.43 |
| Pinch Cycle Speed Decrement Ratio | Pinch | Bradykinesia | Bradykinesia Subscore | -0.41 | [-0.92, 0.45] | 0.313 | 0.771 | -0.42 |
| Drag Amplitude Decrement Ratio | Drag | Bradykinesia | Bradykinesia Subscore | -0.35 | [-0.92, 0.63] | 0.396 | 0.771 | -0.47 |
| Pinch Cycle Speed Slope (Hz/cycle) | Pinch | Bradykinesia | Bradykinesia Subscore | -0.33 | [-0.90, 0.58] | 0.432 | 0.771 | -0.38 |
| Tap Interval Decrement Ratio | Tap | Bradykinesia | Bradykinesia Subscore | -0.25 | [-0.97, 0.62] | 0.545 | 0.771 | -0.00 |
| Tap Frequency Decrement Ratio | Tap | Bradykinesia | Bradykinesia Subscore | 0.25 | [-0.62, 0.97] | 0.545 | 0.771 | 0.04 |
| Pinch Cycle Duration Slope (ms/cycle) | Pinch | Bradykinesia | Bradykinesia Subscore | 0.24 | [-0.74, 0.89] | 0.565 | 0.771 | 0.18 |
| Pinch Opening Distance Decrement Ratio | Pinch | Bradykinesia | Bradykinesia Subscore | -0.19 | [-0.89, 0.93] | 0.647 | 0.809 | -0.34 |
| Pinch Opening Distance Slope (mm/cycle) | Pinch | Bradykinesia | Bradykinesia Subscore | 0.12 | [-0.83, 0.88] | 0.776 | 0.879 | 0.11 |
| Drag Amplitude Slope | Drag | Bradykinesia | Bradykinesia Subscore | -0.10 | [-0.96, 0.64] | 0.820 | 0.879 | -0.45 |
| Drag Duration Slope | Drag | Bradykinesia | Bradykinesia Subscore | 0.06 | [-0.73, 0.80] | 0.887 | 0.887 | 0.03 |

## Hesitations halts
*Rhythm arhythmicity, pauses, freezes, or transient blocks in coordination. Correlated with Bradykinesia Subscore.*

### Primary Clinical Measures (Core Candidate Set)
*One primary hesitation/halt measure designated per task:*

| Feature | Task | Correlated Score | Spearman $\rho$ | 95% Bootstrap CI | Spearman $p$ (raw) | Spearman $p$ (FDR) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Pinch Longest Pause Duration (ms)** | Pinch | Bradykinesia Subscore | **0.623** | **[0.08, 0.93]** | **0.073** | **0.219** |
| **Tap Pause Count** | Tap | Bradykinesia Subscore | **-0.435** | **[-0.88, 0.23]** | **0.242** | **0.270** |
| **Drag Pause Count** | Drag | Bradykinesia Subscore | **-0.413** | **[-0.85, -0.11]** | **0.270** | **0.270** |

### Comprehensive Candidate Registry Table

| Feature | Task | Candidate Status | Clinical Domain | Correlated Score | Spearman $\rho$ | 95% Bootstrap CI | Spearman $p$ (raw) | Spearman $p$ (FDR) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Pinch Longest Pause Duration (ms) | Pinch | **Primary** | Bradykinesia | Bradykinesia Subscore | 0.623 | [0.08, 0.93] | 0.073 | 0.331 |
| Pinch Pause Count | Pinch | Exploratory | Bradykinesia | Bradykinesia Subscore | 0.568 | [-0.01, 0.92] | 0.110 | 0.331 |
| Pinch Pause Ratio (Normalized) | Pinch | Exploratory | Bradykinesia | Bradykinesia Subscore | 0.568 | [-0.01, 0.92] | 0.110 | 0.331 |
| Tap Longest Pause Duration (ms) | Tap | Exploratory | Bradykinesia | Bradykinesia Subscore | 0.094 | [-0.71, 0.86] | 0.811 | 0.912 |
| Pinch Amplitude Disruption Count | Pinch | Exploratory | Bradykinesia | Bradykinesia Subscore | -0.010 | [-0.80, 0.76] | 0.980 | 0.980 |
| Tap Pause Count | Tap | **Primary** | Bradykinesia | Bradykinesia Subscore | -0.435 | [-0.88, 0.23] | 0.242 | 0.405 |
| Drag Pause Count | Drag | **Primary** | Bradykinesia | Bradykinesia Subscore | -0.413 | [-0.85, -0.11] | 0.270 | 0.405 |
| Drag Longest Pause Duration (ms) | Drag | Exploratory | Bradykinesia | Bradykinesia Subscore | -0.413 | [-0.85, -0.11] | 0.270 | 0.405 |
| Tap Pause Ratio (Normalized) | Tap | Exploratory | Bradykinesia | Bradykinesia Subscore | -0.281 | [-0.81, 0.46] | 0.464 | 0.597 |

## Akinesia
*Initiation lag or reaction delay to lift/start the motor sequence. Correlated with Bradykinesia Subscore.*

| Feature | Task | Clinical Domain | Correlated Score | Spearman $\rho$ | 95% Bootstrap CI | Spearman $p$ (raw) | Spearman $p$ (FDR) | Pearson $r$ |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Drag Initiation Delay (ms) | Drag | Bradykinesia | Bradykinesia Subscore | 0.29 | [-0.72, 0.91] | 0.487 | 0.809 | 0.29 |
| Tap Initiation Delay (ms) | Tap | Bradykinesia | Bradykinesia Subscore | -0.28 | [-0.88, 0.68] | 0.506 | 0.809 | -0.35 |
| Hold Initiation Delay (ms) | Hold | Bradykinesia | Bradykinesia Subscore | -0.27 | [-1.00, 0.64] | 0.526 | 0.809 | -0.17 |
| Hold Release Delay (ms) | Hold | Bradykinesia | Bradykinesia Subscore | 0.19 | [-0.73, 0.89] | 0.647 | 0.809 | 0.16 |
| Pinch Initiation Delay (ms) | Pinch | Bradykinesia | Bradykinesia Subscore | 0.10 | [-0.60, 0.64] | 0.820 | 0.820 | 0.16 |

## Postural tremor
*Involuntary rhythmic oscillations while holding posture statically on a target. Evaluated against Rest Tremor (MDS-UPDRS Item 3.17), Postural Tremor (MDS-UPDRS Item 3.15), and Tremor Subscore.*

| Feature | Task | Clinical Domain | Correlated Score | Spearman $\rho$ | 95% Bootstrap CI | Spearman $p$ (raw) | Spearman $p$ (FDR) | Pearson $r$ |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Hold Peak Tremor Amplitude (px) | Hold | Tremor | Rest Tremor (Item 3.17) | 0.13 | [-0.61, 0.81] | 0.713 | 0.903 | -0.02 |
| Hold Tremor Power | Hold | Tremor | Rest Tremor (Item 3.17) | 0.04 | [-0.68, 0.78] | 0.903 | 0.903 | -0.02 |
| Hold Tremor Amplitude (px) | Hold | Tremor | Rest Tremor (Item 3.17) | 0.04 | [-0.68, 0.78] | 0.903 | 0.903 | -0.03 |
| Hold Spatial Spread (px) | Hold | Tremor | Rest Tremor (Item 3.17) | -0.12 | [-0.72, 0.59] | 0.740 | 0.903 | -0.21 |
| Hold Peak Tremor Amplitude (px) | Hold | Tremor | Postural Tremor (Item 3.15) | -0.10 | [-0.82, 0.65] | 0.790 | 0.790 | 0.12 |
| Hold Tremor Power | Hold | Tremor | Postural Tremor (Item 3.15) | -0.37 | [-0.90, 0.54] | 0.286 | 0.382 | 0.22 |
| Hold Tremor Amplitude (px) | Hold | Tremor | Postural Tremor (Item 3.15) | -0.37 | [-0.90, 0.54] | 0.286 | 0.382 | 0.14 |
| Hold Spatial Spread (px) | Hold | Tremor | Postural Tremor (Item 3.15) | -0.38 | [-0.85, 0.33] | 0.277 | 0.382 | -0.16 |
| Hold Peak Tremor Amplitude (px) | Hold | Tremor | Tremor Subscore | -0.06 | [-0.70, 0.63] | 0.877 | 0.877 | 0.12 |
| Hold Tremor Power | Hold | Tremor | Tremor Subscore | -0.21 | [-0.82, 0.61] | 0.555 | 0.741 | 0.20 |
| Hold Tremor Amplitude (px) | Hold | Tremor | Tremor Subscore | -0.21 | [-0.82, 0.61] | 0.555 | 0.741 | 0.15 |
| Hold Spatial Spread (px) | Hold | Tremor | Tremor Subscore | -0.24 | [-0.85, 0.42] | 0.497 | 0.741 | -0.17 |

## Kinetic tremor
*Involuntary rhythmic oscillations transverse to active voluntary path trajectories. Evaluated against Kinetic Tremor (MDS-UPDRS Item 3.16) and Tremor Subscore.*

| Feature | Task | Clinical Domain | Correlated Score | Spearman $\rho$ | 95% Bootstrap CI | Spearman $p$ (raw) | Spearman $p$ (FDR) | Pearson $r$ |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Drag Peak Tremor Amplitude (px) | Drag | Tremor | Kinetic Tremor (Item 3.16) | 0.45 | [-0.37, 0.89] | 0.193 | 0.644 | 0.37 |
| Drag Tremor Power | Drag | Tremor | Kinetic Tremor (Item 3.16) | 0.17 | [-0.55, 0.75] | 0.644 | 0.644 | 0.18 |
| Drag Tremor Amplitude (px) | Drag | Tremor | Kinetic Tremor (Item 3.16) | 0.23 | [-0.47, 0.77] | 0.527 | 0.644 | 0.21 |
| Drag Path Efficiency | Drag | Tremor | Kinetic Tremor (Item 3.16) | -0.25 | [-0.87, 0.41] | 0.478 | 0.644 | -0.23 |
| Drag Peak Tremor Amplitude (px) | Drag | Tremor | Tremor Subscore | 0.54 | [-0.12, 0.90] | 0.104 | 0.218 | 0.43 |
| Drag Tremor Power | Drag | Tremor | Tremor Subscore | -0.01 | [-0.72, 0.67] | 0.986 | 0.986 | 0.18 |
| Drag Tremor Amplitude (px) | Drag | Tremor | Tremor Subscore | 0.06 | [-0.66, 0.71] | 0.864 | 0.986 | 0.22 |
| Drag Path Efficiency | Drag | Tremor | Tremor Subscore | -0.54 | [-0.90, 0.08] | 0.109 | 0.218 | -0.31 |