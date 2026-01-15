'use strict';

const startPoint = document.getElementById('startPoint');
const targetPoint = document.getElementById('targetPoint');
const modalContent = document.getElementById('modalBodyContent');

const REST_DELAY = 2000;
const TRIAL_LIMIT = 5;

let trialCount = 0;
let trialReadyTime = null;
let akineticDelay = null;
let isPaused = false;
let fingerDown = false;
let movementStartTime = null;
let results = [];
let hasMovedAfterCue = false;

// Initialize
window.addEventListener('load', () => {
    startPoint.style.backgroundColor = 'green';
    targetPoint.style.backgroundColor = 'red';
    console.log('Continuous adaptive drag initialized');
});

document.addEventListener('touchstart', e => {
    if (window.isModalOpen) return;

    const touch = e.changedTouches[0];
    fingerDown = true;

    // Mark first start time
    if (!movementStartTime) {
        movementStartTime = Date.now();
        akineticDelay = 0;
    }

    // If we’re waiting for next move
    if (trialReadyTime) {
        akineticDelay = Date.now() - trialReadyTime;
        console.log(`Akinetic delay for next move: ${akineticDelay} ms`);
    }
});

document.addEventListener('touchmove', e => {
    if (!fingerDown || window.isModalOpen || isPaused) return;

    const touch = e.changedTouches[0];
    const targetRect = targetPoint.getBoundingClientRect();

    if (trialReadyTime && !hasMovedAfterCue) {
        akineticDelay = Date.now() - trialReadyTime;
        hasMovedAfterCue = true;
        console.log(`Akinetic delay measured: ${akineticDelay} ms`);
    }

    const insideTarget =
        touch.pageX >= targetRect.left &&
        touch.pageX <= targetRect.right &&
        touch.pageY >= targetRect.top &&
        touch.pageY <= targetRect.bottom;

    // When user reaches target
    if (insideTarget) {
        isPaused = true;
        const movementEndTime = Date.now();
        const movementTime = movementEndTime - (movementStartTime ?? movementEndTime);

        // --- Calculate distance between start and target ---
        const startRect = startPoint.getBoundingClientRect();
        const targetRect = targetPoint.getBoundingClientRect();
        const dx = targetRect.left - startRect.left;
        const dy = targetRect.top - startRect.top;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // --- Normalize movement time ---
        const normalizedMovementTime = movementTime / distance; // ms per pixel

        // --- Compute velocity ---
        const movementVelocity = distance / movementTime; // px per ms

        results.push({
            trial: ++trialCount,
            akineticDelay,
            movementTime,
            distance: distance.toFixed(1),
            normalizedMovementTime: normalizedMovementTime.toFixed(3),
            movementVelocity: movementVelocity.toFixed(3)
        });


        console.log(`Reached target ${trialCount}: Move=${movementTime}ms Delay=${akineticDelay}ms`);

        targetPoint.style.backgroundColor = 'green';

        // After 2s pause, new target appears — no need to lift finger
        setTimeout(() => {
            if (trialCount < TRIAL_LIMIT) {
                moveTargetToNewLocation();
                isPaused = false;
                movementStartTime = Date.now();
                hasMovedAfterCue = false;
            } else {
                endAdaptiveTask();
            }
        }, REST_DELAY);
    }
});

document.addEventListener('touchend', () => {
    fingerDown = false;
});

function moveTargetToNewLocation() {
    // Current target becomes new start
    const rect = targetPoint.getBoundingClientRect();
    startPoint.style.top = `${rect.top}px`;
    startPoint.style.left = `${rect.left}px`;

    // Generate new target coordinates
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const margin = 100;

    const newX = Math.random() * (screenW - margin * 2) + margin;
    const newY = Math.random() * (screenH - margin * 2) + margin;

    targetPoint.style.top = `${newY}px`;
    targetPoint.style.left = `${newX}px`;
    targetPoint.style.backgroundColor = 'red';

    trialReadyTime = Date.now(); // mark cue for next akinetic delay
    console.log(`New target ready (Trial ${trialCount + 1})`);
}
function endAdaptiveTask() {
    modalContent.innerText = results.map(r =>
        `Trial ${r.trial}:
    Akinetic Delay = ${r.akineticDelay} ms
    Movement Time = ${r.movementTime} ms
    Distance = ${r.distance} px
    Normalized Time = ${r.normalizedMovementTime} ms/px
    Velocity = ${r.movementVelocity} px/ms`
    ).join("\n\n");

    // Show "Next Task" button when done
    const nextButton = document.getElementById("nextTaskButton");
    if (nextButton) nextButton.style.display = "block";

    window.showModal();
    console.log('Adaptive drag sequence complete:', results);

    // Reset visuals
    startPoint.style.backgroundColor = 'green';
    targetPoint.style.backgroundColor = 'red';

    // Reset all tracking variables after modal closes
    const resetAfterModal = () => {
        trialCount = 0;
        results = [];
        isPaused = false;
        fingerDown = false;
        movementStartTime = null;
        trialReadyTime = null;
        akineticDelay = null;
        console.log('🔄 Task reset for new run.');
    };

    // Listen for modal close — works with either the X or Close button
    const modalCloseBtn = document.getElementById("modalCloseButton");
    const modalCloseX = document.getElementById("modalCloseX");

    const resetHandler = () => {
        resetAfterModal();
        modalCloseBtn.removeEventListener('click', resetHandler);
        modalCloseX.removeEventListener('click', resetHandler);
    };

    modalCloseBtn.addEventListener('click', resetHandler);
    modalCloseX.addEventListener('click', resetHandler);
}