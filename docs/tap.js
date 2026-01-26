// 'use strict';

// let tapTimes = [];
// let tapCount = 0;
// let taskStartTime = 0;
// let taskDuration = 10000; // 10 seconds
// let isTaskActive = false;
// let modalContent = null;
// let timer = null;

// document.addEventListener('DOMContentLoaded', () => {
//     const tapTarget = document.getElementById('tapTarget');
//     modalContent = document.getElementById('modalBodyContent');

//     tapTarget.addEventListener('touchstart', handleTap);
//     tapTarget.addEventListener('mousedown', handleTap);
// });

// function handleTap() {
//     const now = Date.now();

//     // Start task on first tap
//     if (!isTaskActive) {
//         isTaskActive = true;
//         taskStartTime = now;
//         tapTimes = [];
//         tapCount = 0;
//         timer = setTimeout(endTask, taskDuration);
//     }

//     // Record tap
//     tapTimes.push(now);
//     tapCount++;

//     // Animate
//     const target = document.getElementById('tapTarget');
//     target.style.transform = 'scale(0.9)';
//     setTimeout(() => (target.style.transform = 'scale(1)'), 100);
// }

// function endTask() {
//     isTaskActive = false;
//     clearTimeout(timer);

//     if (tapTimes.length < 2) {
//         modalContent.innerText = 'Not enough taps recorded.';
//         showModal();
//         return;
//     }

//     // Compute intervals (ms between taps)
//     const intervals = [];
//     for (let i = 1; i < tapTimes.length; i++) {
//         intervals.push(tapTimes[i] - tapTimes[i - 1]);
//     }

//     // Core metrics
//     const meanInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
//     const tapRate = 1000 / meanInterval; // taps per second

//     // Bradykinesia (slowness)
//     const bradykinesiaIndex = meanInterval;
//     const bradyInterpret = bradykinesiaIndex > 500 ? '(Slow tapping)' : '(Normal speed)';

//     // Arrhythmicity (variability in intervals)
//     const mean = meanInterval;
//     const variance = intervals.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / intervals.length;
//     const stdDev = Math.sqrt(variance);
//     const arrhythmiaIndex = stdDev / mean;
//     const arrhythmiaInterpret =
//         arrhythmiaIndex < 0.15 ? '(Regular rhythm)' :
//             arrhythmiaIndex < 0.3 ? '(Moderate irregularity)' :
//                 '(Highly irregular)';

//     // Hesitations / halts (pauses)
//     const pauseThreshold = 1.5 * meanInterval;
//     const pauseCount = intervals.filter(i => i > pauseThreshold).length;
//     const pauseInterpret = pauseCount > 0 ? '(Pauses detected)' : '(Smooth tapping)';

//     // Sequence effect (fatigue)
//     const firstHalf = intervals.slice(0, Math.floor(intervals.length / 2));
//     const lastHalf = intervals.slice(Math.floor(intervals.length / 2));
//     const meanFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
//     const meanLast = lastHalf.reduce((a, b) => a + b, 0) / lastHalf.length;
//     const seqEffect = 1 - meanFirst / meanLast;
//     const seqInterpret = seqEffect > 0.1 ? '(Fatigue / decrement)' : '(Stable tapping)';

//     // Results
//     const results = `
// Taps: ${tapCount}
// Mean tap interval: ${meanInterval.toFixed(1)} ms
// Tap rate: ${tapRate.toFixed(2)} taps/s
// Bradykinesia (Slowness): ${bradykinesiaIndex.toFixed(1)} ms ${bradyInterpret}
// Arrhythmicity (Speed Variability): ${arrhythmiaIndex.toFixed(3)} ${arrhythmiaInterpret}
// Hesitations / Halts (Pauses): ${pauseCount} ${pauseInterpret}
// Sequence Effect (Speed Decrement): ${seqEffect.toFixed(3)} ${seqInterpret}
// `;

//     modalContent.innerText = results;
//     showModal();
// }

// function showModal() {
//     const modal = document.getElementById('resultsModal');
//     modal.style.display = 'block';
// }

// function closeModal() {
//     const modal = document.getElementById('resultsModal');
//     modal.style.display = 'none';
// }
