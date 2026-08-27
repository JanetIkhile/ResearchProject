# Project-Scoped Rules and Future Design Directions

## Sequence Effects Custom Aggregation Strategy
- **Context**: Currently, sequence effects and speed/duration metrics aggregate across trials using the median of trial-level metrics.
- **Future Direction**: Once more participant data is collected (specifically, after obtaining 7-10 more participant datasets), if tap cycle, pinch cycle, drag duration, or amplitude features do not show high clinical correlation or useful information:
  - **CRITICAL**: Do NOT modify the pipeline automatically. Always get explicit user confirmation/permission before applying this change.
  - Modify the pipeline to compute the **mean within each trial** instead of the median (e.g. mean cycle duration, speed, or amplitude within a trial).
  - Then, aggregate these trial-level means by taking the **median of the means across all trials** for each participant.

## Hesitation and Halt Threshold Sensitivity Analysis
- **Context**: Tapping hesitations and halts currently use static thresholds of $> 1.5 \times$ and $> 2.0 \times$ the median inter-tap interval (ITI) respectively.
- **Future Direction**: Run sensitivity analyses with nearby thresholds (e.g. 1.3x, 1.4x, 1.6x, 1.8x, 2.2x, etc.) to evaluate which thresholds generate features that show the highest clinical correlation with MDS-UPDRS motor severity.

