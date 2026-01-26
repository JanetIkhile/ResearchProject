'use strict';
import { supabase } from "../client/supabaseClient.js";

let participantId = null;
let sessionId = null;
let trialNumber = 0;
const TASK_TYPE = "drag";

// async setup
(async function initContext() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        window.location.href = "/auth/login.html";
        return;
    }

    participantId = user.id;

    sessionId = sessionStorage.getItem("session_id");
    if (!sessionId) {
        window.location.href = "/index.html";
        return;
    }

    console.log("Drag task started");
    console.log("Participant:", participantId);
    console.log("Session:", sessionId);
})();



let startTime = 0;
let totalTime = 0;
let touchStartX, touchStartY;
let touchEndX, touchEndY;
let finalSpeed = 0;
let lastSpeed = 0;
let peakSpeed = 0;
let timeToPeakSpeed = 0;
let previousSpeed = 0;
let previousTime = 0;
let isDragging = false;
let lastAcceleration = 0;
let averageAcceleration = 0;
let initialX = 0;
let initialY = 0;
let previousChangeInSpeed = 0;
let modalContent = document.getElementById('modalBodyContent');
let results = null;
let reachedTarget = false;
let totalDistanceTraveled = 0;
let isModalOpen = false;
let speedSamples = [];
let trialReadyTime = 0;
let akineticDelay = 0;
let pauseCount = 0;
let pauseDurations = [];
let pauseStartTime = null;
let TRIAL_LIMIT = 3;
let trajectoryLog = [];



// Hypokinesia tracking
let trialData = [];
let trialCount = 0;

// Get DOM elements
const startPoint = document.getElementById('startInnerDot');
const targetPoint = document.getElementById('targetInnerDot');

// ---------------- CANVAS SETUP ----------------
const canvas = document.getElementById('pathCanvas');
const ctx = canvas.getContext('2d');

// Fullscreen adaptive canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// API setup
const apiUrl = 'https://motor-performance.vercel.app' || 'http://localhost:3001';

// ---------------- TOUCH START ----------------
document.addEventListener("touchstart", e => {
    if (window.isModalOpen || e.target.id === "nextTaskButton") return;

    const touch = e.changedTouches[0];
    touchStartX = touch.pageX;
    touchStartY = touch.pageY;
    startTime = Date.now();
    trialNumber += 1;
    trajectoryLog = [];

    if (window.trialReadyTime && window.trialReadyTime > 0) {
        akineticDelay = Date.now() - window.trialReadyTime;
    } else {
        akineticDelay = 0;
    }

    // create visual pointer
    const pointer = document.createElement("div");
    pointer.classList.add("dot");
    pointer.style.top = `${touchStartY}px`;
    pointer.style.left = `${touchStartX}px`;
    pointer.id = touch.identifier;
    document.body.append(pointer);

    previousTime = startTime;
    initialX = touchStartX;
    initialY = touchStartY;
    totalDistanceTraveled = 0;
    speedSamples = [];
    // --- Reset pause tracking for this new trial ---
    pauseCount = 0;
    pauseDurations = [];
    pauseStartTime = null;
});

// ---------------- TOUCH MOVE ----------------
document.addEventListener("touchmove", e => {
    if (window.isModalOpen || e.target.id === "nextTaskButton") return;
    e.preventDefault();
    isDragging = true;

    const touch = e.changedTouches[0];
    let currentX = touch.pageX;
    let currentY = touch.pageY;
    let currentTime = Date.now();
    trajectoryLog.push({
        x: currentX,
        y: currentY,
        t: currentTime
    });


    const pointer = document.getElementById(touch.identifier);
    pointer.style.top = `${touch.pageY}px`;
    pointer.style.left = `${touch.pageX}px`;

    // Calculate distance increment
    let changeInDistance = calculateDistance(initialX, currentX, initialY, currentY);
    totalDistanceTraveled += changeInDistance;

    // Draw small segment (blue)
    ctx.strokeStyle = 'rgba(0, 128, 255, 0.8)'; // blue path
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(initialX, initialY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    let changeInTime = currentTime - previousTime;
    let changeInSpeed = changeInDistance / changeInTime;
    let instantaneousAcceleration = (changeInSpeed - previousChangeInSpeed) / changeInTime;
    lastAcceleration = instantaneousAcceleration;

    let totalTimeTakenForTouchMove = currentTime - startTime;
    finalSpeed = totalDistanceTraveled / totalTimeTakenForTouchMove;
    lastSpeed = finalSpeed;

    if (finalSpeed > peakSpeed) {
        peakSpeed = finalSpeed;
        timeToPeakSpeed = currentTime - startTime;
    }
    if (!isNaN(changeInSpeed) && isFinite(changeInSpeed)) {
        speedSamples.push(changeInSpeed);
    }

    // Detect pauses (speed near zero)
    const speedThreshold = 0.005; // px/ms — we can adjust this threshold

    if (changeInSpeed < speedThreshold) {
        // If speed is low and we haven't started a pause yet
        if (pauseStartTime === null) {
            pauseStartTime = currentTime;
        }
    } else {
        // If speed recovers and we were in a pause
        if (pauseStartTime !== null) {
            const pauseDuration = currentTime - pauseStartTime;
            if (pauseDuration > 100) { // Only count pauses lasting >100 ms
                pauseDurations.push(pauseDuration);
                pauseCount++;
            }
            pauseStartTime = null;
        }
    }

    previousSpeed = finalSpeed;
    previousTime = currentTime;
    initialX = currentX;
    initialY = currentY;
    previousChangeInSpeed = changeInSpeed;
});

// ---------------- TOUCH END ----------------
document.addEventListener("touchend", async e => {
    if (window.isModalOpen || e.target.id === "nextTaskButton") return;
    const touch = e.changedTouches[0];
    touchEndX = touch.pageX;
    touchEndY = touch.pageY;

    const pointer = document.getElementById(touch.identifier);
    if (pointer) pointer.remove();

    // Draw green straight-line path
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(touchStartX, touchStartY);
    ctx.lineTo(touchEndX, touchEndY);
    ctx.stroke();

    // Straight-line distance
    const straightLineDistance = calculateDistance(touchStartX, touchEndX, touchStartY, touchEndY);

    // Total time
    if (startTime !== 0) {
        totalTime = calculateTotalTime(startTime);
    }

    // Average drag speed
    const averageDragSpeed = calculateDragSpeed(totalDistanceTraveled, totalTime);
    let averageAcceleration = (finalSpeed - 0) / totalTime;
    let tapDuration = isDragging ? null : totalTime;
    let tapAreaSize = Math.abs(touchStartX - touchEndX) * Math.abs(touchStartY - touchEndY);

    // Shortest path distance between start and target
    let startRect = startPoint.getBoundingClientRect();
    let targetRect = targetPoint.getBoundingClientRect();
    let startX = startRect.left + startRect.width / 2;
    let startY = startRect.top + startRect.height / 2;
    let targetX = targetRect.left + targetRect.width / 2;
    let targetY = targetRect.top + targetRect.height / 2;
    let shortestPathDistance = calculateDistance(startX, targetX, startY, targetY);

    // ---------------- HYPOKINESIA (REDUCED MOVEMENT SIZE) ----------------
    let amplitudeRatio = straightLineDistance / shortestPathDistance;
    // Path efficiency is about how closely the movement stayed to the intended spatial path
    let pathEfficiency = straightLineDistance / totalDistanceTraveled;

    // Interpret the amplitude ratio
    let amplitudeInterpretation = '';
    if (amplitudeRatio >= 0.95 && amplitudeRatio <= 1.05) {
        amplitudeInterpretation = '(Normal amplitude)';
    } else if (amplitudeRatio < 0.95) {
        amplitudeInterpretation = '(Reduced amplitude / Hypokinesia)';
    } else if (amplitudeRatio > 1.05) {
        amplitudeInterpretation = '(Overshoot / Hypermetria)';
    }
    //---------------- BRADYKINESIA (SLOWNESS) ----------------
    let bradykinesiaSlowness = totalTime / totalDistanceTraveled;

    // Interpret it qualitatively
    let bradykinesiaInterpretation = '';
    if (bradykinesiaSlowness < 3) {
        bradykinesiaInterpretation = '(Normal speed)';
    } else if (bradykinesiaSlowness >= 4 && bradykinesiaSlowness <= 6) {
        bradykinesiaInterpretation = '(Mild slowness)';
    } else {
        bradykinesiaInterpretation = '(Severe slowness)';
    }

    // ---------------- ARRHYTHMICITY (is about whether the speed stays steady over time) ----------------
    let arrhythmicityIndex = 0;
    let arrhythmicityInterpretation = '';

    if (speedSamples.length > 1) {
        let meanSpeed = speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length;
        let variance = speedSamples.reduce((sum, s) => sum + Math.pow(s - meanSpeed, 2), 0) / speedSamples.length;
        let stdDev = Math.sqrt(variance);
        arrhythmicityIndex = stdDev / meanSpeed; // Coefficient of Variation (CV)
    }

    // Interpret it qualitatively
    if (arrhythmicityIndex < 1.5) {
        arrhythmicityInterpretation = '(Smooth / Regular rhythm)';
    } else if (arrhythmicityIndex < 2) {
        arrhythmicityInterpretation = '(Moderate irregularity)';
    } else {
        arrhythmicityInterpretation = '(Highly irregular / Arrhythmic)';
    }

    let akineticInterpretation = '';
    if (akineticDelay < 1000) {
        akineticInterpretation = '(Normal initiation)';
    } else if (akineticDelay >= 1000 && akineticDelay < 2000) {
        akineticInterpretation = '(Mild delay)';
    } else {
        akineticInterpretation = '(Severe delay)';
    }
    // Finalize any ongoing pause at the end
    if (pauseStartTime !== null) {
        const pauseDuration = Date.now() - pauseStartTime;
        if (pauseDuration > 100) {
            pauseDurations.push(pauseDuration);
            pauseCount++;
        }
        pauseStartTime = null;
    }

    // Compute pause metrics
    const totalPauseTime = pauseDurations.reduce((sum, d) => sum + d, 0);
    const meanPauseDuration = pauseCount > 0 ? (totalPauseTime / pauseCount) : 0;
    const pauseRatio = totalPauseTime / totalTime; // fraction of trial spent paused

    let pauseInterpretation = '';
    if (pauseCount === 0) pauseInterpretation = '(Smooth movement)';
    else if (pauseCount <= 2 && pauseRatio < 0.1) pauseInterpretation = '(Few short hesitations)';
    else pauseInterpretation = '(Frequent or prolonged hesitations / halts)';


    // ---------------- SAVE TRIAL DATA ----------------
    // Save for averaging
    trialData.push({
        trial: ++trialCount,
        akineticDelay,
        straightLineDistance,
        totalDistanceTraveled,
        pathEfficiency,
        amplitudeRatio,
        amplitudeInterpretation,
        bradykinesiaSlowness,
        bradykinesiaInterpretation,
        arrhythmicityIndex,
        arrhythmicityInterpretation,
        averageDragSpeed,
        pauseCount,
        meanPauseDuration,
        pauseInterpretation

    });

    //print out trial data to console
    console.log(`trialData: `, trialData);

    // --- SEQUENCE EFFECT (Across-trial Decrement) ---
    const { seqAmp, seqAmpInterpret, seqSpeed, seqSpeedInterpret } = computeSequenceEffect(trialData);

    // Display results
    results = `Trial: ${trialCount}
Akinetic Delay (Initiation Time): ${akineticDelay} ms ${akineticInterpretation}
Hypokinesia (Reduced Movement Size): ${amplitudeRatio.toFixed(3)} ${amplitudeInterpretation}
Bradykinesia (Reduced Movement Speed ): ${bradykinesiaSlowness.toFixed(3)} ms/px ${bradykinesiaInterpretation}
Irregular Rhythm (Speed Variability): ${arrhythmicityIndex.toFixed(3)} ${arrhythmicityInterpretation}
Irregular Rhythm (Pauses): ${pauseCount} pauses, avg ${meanPauseDuration.toFixed(1)} ms ${pauseInterpretation}
Path Efficiency (Movement Smoothness): ${pathEfficiency.toFixed(3)}
Sequence Effect (Amplitude Decrement): ${seqAmp.toFixed(3)} ${seqAmpInterpret}
Sequence Effect (Speed Decrement): ${seqSpeed.toFixed(3)} ${seqSpeedInterpret}
`;
    modalContent.innerText = results;
    window.showModal();

    //    results = `Trial: ${trialCount}
    // Straight line drag distance: ${straightLineDistance.toFixed(2)} px
    // Shortest path distance: ${shortestPathDistance.toFixed(2)} px
    // Amplitude Ratio (Hypokinesia): ${amplitudeRatio.toFixed(3)} ${amplitudeInterpretation}
    // Total Drag distance: ${totalDistanceTraveled.toFixed(2)} px
    // Path Efficiency: ${pathEfficiency.toFixed(3)}
    // Total Execution Time: ${totalTime} ms
    // Average drag speed: ${averageDragSpeed.toFixed(2)} px/ms
    // Peak speed: ${peakSpeed.toFixed(2)} px/ms
    // Time to peak speed: ${timeToPeakSpeed} ms`;

    // Send + fetch data
    const measureResults = {
        tapDuration,
        akineticDelay,
        straightLineDistance,
        totalDistanceTraveled,
        shortestPathDistance,
        amplitudeRatio,
        amplitudeInterpretation,
        bradykinesiaSlowness,
        bradykinesiaInterpretation,
        arrhythmicityIndex,
        arrhythmicityInterpretation,
        pathEfficiency,
        totalTime,
        averageDragSpeed,
        lastSpeed,
        peakSpeed,
        timeToPeakSpeed,
        lastAcceleration,
        averageAcceleration,
        tapAreaSize
    };

    sendDataToServer(measureResults);
    fetchDataFromServer();

    const trialPayload = {
        // ---- independent variables ----
        participant_id: participantId,
        session_id: sessionId,
        task_type: TASK_TYPE,
        trial_number: trialNumber,
        timestamp: new Date().toISOString(),

        // ---- context ----
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        device_pixel_ratio: window.devicePixelRatio,

        // ---- dependent variables ----
        akinetic_delay_ms: akineticDelay,
        total_time_ms: totalTime,
        total_distance_px: totalDistanceTraveled,
        straight_line_distance_px: straightLineDistance,
        shortest_path_distance_px: shortestPathDistance,
        path_efficiency: pathEfficiency,
        amplitude_ratio: amplitudeRatio,
        mean_speed_px_per_ms: averageDragSpeed,
        peak_speed_px_per_ms: peakSpeed,
        time_to_peak_speed_ms: timeToPeakSpeed,
        arrhythmicity_cv: arrhythmicityIndex,
        pause_count: pauseCount,
        mean_pause_duration_ms: meanPauseDuration,

        // ---- raw ----
        trajectory: trajectoryLog
    };

    const { error } = await supabase
        .from("trial_results")
        .insert(trialPayload);

    if (error) {
        console.error("Failed to save trial:", error);
    } else {
        console.log("Trial saved:", trialNumber);
    }

    // After each trial, check if limit reached
    if (trialCount >= TRIAL_LIMIT) {
        const nextButton = document.getElementById('nextTaskButton');
        if (nextButton) nextButton.style.display = 'block';
    }

    // Clear canvas for next trial after short delay
    setTimeout(() => ctx.clearRect(0, 0, canvas.width, canvas.height), 3000);

    // Reset for next trial
    isDragging = false;
    reachedTarget = false;
});

// ---------------- FUNCTIONS ----------------
function calculateDistance(x1, x2, y1, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

function calculateTotalTime(startTime) {
    const endTime = Date.now();
    return (endTime - startTime);
}

function calculateDragSpeed(distance, duration) {
    return (distance / duration);
}

function computeSequenceEffect(trialData, N = 3) {
    if (trialData.length < N * 2) {
        return {
            seqAmp: 0,
            seqAmpInterpret: "(Not enough trials)",
            seqSpeed: 0,
            seqSpeedInterpret: "(Not enough trials)"
        };
    }

    // Split trials into early and late sets
    const firstN = trialData.slice(0, N);
    const lastN = trialData.slice(-N);

    // Compute mean amplitude and mean speed
    const meanAmpFirst = firstN.reduce((sum, t) => sum + t.amplitudeRatio, 0) / N;
    const meanAmpLast = lastN.reduce((sum, t) => sum + t.amplitudeRatio, 0) / N;

    const meanSpeedFirst = firstN.reduce((sum, t) => sum + (t.averageDragSpeed || 0), 0) / N;
    const meanSpeedLast = lastN.reduce((sum, t) => sum + (t.averageDragSpeed || 0), 0) / N;

    // Compute sequence effects
    const seqAmp = 1 - (meanAmpLast / meanAmpFirst);
    const seqSpeed = 1 - (meanSpeedLast / meanSpeedFirst);

    // Interpret both
    let seqAmpInterpret = '';
    if (seqAmp < 0.05) seqAmpInterpret = '(Stable amplitude)';
    else if (seqAmp < 0.15) seqAmpInterpret = '(Mild amplitude decrement)';
    else seqAmpInterpret = '(Strong amplitude decrement)';

    let seqSpeedInterpret = '';
    if (seqSpeed < -0.05) {
        seqSpeedInterpret = '(Improving / increasing speed)';
    } else if (seqSpeed >= -0.05 && seqSpeed < 0.05) {
        seqSpeedInterpret = '(Stable speed)';
    } else if (seqSpeed < 0.15) {
        seqSpeedInterpret = '(Mild speed decrement)';
    } else {
        seqSpeedInterpret = '(Strong speed decrement)';
    }

    return { seqAmp, seqAmpInterpret, seqSpeed, seqSpeedInterpret };
}

// function computeAverageHypokinesia() {
//     if (trialData.length === 0) return;
//     const avgEff = trialData.reduce((sum, t) => sum + t.pathEfficiency, 0) / trialData.length;
//     console.log(`Average Hypokinesia Index (Path Efficiency): ${avgEff.toFixed(3)}`);
// }

// ---------------- SERVER COMMUNICATION ----------------
async function sendDataToServer(measures) {
    try {
        const response = await fetch(`${apiUrl}/api/measures/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(measures)
        });
        if (response.ok) {
            console.log(response.status);
        } else {
            console.error('Error sending data');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function fetchDataFromServer() {
    try {
        const response = await fetch(`${apiUrl}/api/measures`);
        const data = await response.json();
        console.log('Data retrieved:', data);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}


