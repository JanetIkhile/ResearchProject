'use strict';

const startPoint = document.getElementById('startPoint');
const targetPoint = document.getElementById('targetPoint');
const modalContent = document.getElementById('modalBodyContent');

const REST_DELAY = 2000; // 2 seconds before new target appears
const TRIAL_LIMIT = 5; // number of adaptive movements

let trialCount = 0;
let isDragging = false;
let startX, startY;
let movementStartTime, movementEndTime;
let akineticDelay = null;
let trialReadyTime = null;
let results = [];

// Initialize
window.addEventListener('load', () => {
    targetPoint.style.backgroundColor = 'red';
    startPoint.style.backgroundColor = 'green';
    console.log("Adaptive drag task initialized");
});

document.addEventListener("touchstart", e => {
    if (window.isModalOpen) return;

    const touch = e.changedTouches[0];
    startX = touch.pageX;
    startY = touch.pageY;
    isDragging = true;
    movementStartTime = Date.now();

    if (trialReadyTime) {
        akineticDelay = movementStartTime - trialReadyTime;
    } else {
        akineticDelay = 0;
    }
});

document.addEventListener("touchmove", e => {
    if (!isDragging || window.isModalOpen) return;
    const touch = e.changedTouches[0];

    const targetRect = targetPoint.getBoundingClientRect();
    const insideTarget =
        touch.pageX >= targetRect.left &&
        touch.pageX <= targetRect.right &&
        touch.pageY >= targetRect.top &&
        touch.pageY <= targetRect.bottom;

    if (insideTarget) {
        isDragging = false;
        movementEndTime = Date.now();
        const movementTime = movementEndTime - movementStartTime;

        // Log results
        results.push({
            trial: trialCount + 1,
            akineticDelay,
            movementTime
        });

        console.log(`Target reached (Trial ${trialCount + 1}): akineticDelay=${akineticDelay} ms, movementTime=${movementTime} ms`);

        // Visual feedback
        targetPoint.style.backgroundColor = "green";

        // Wait before spawning next target
        setTimeout(() => {
            trialCount++;
            if (trialCount < TRIAL_LIMIT) {
                moveTargetToNewLocation();
            } else {
                endAdaptiveTask();
            }
        }, REST_DELAY);
    }
});

function moveTargetToNewLocation() {
    // Make current target the new start
    const targetRect = targetPoint.getBoundingClientRect();
    startPoint.style.top = `${targetRect.top}px`;
    startPoint.style.left = `${targetRect.left}px`;

    // Generate a new target location
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    const margin = 100;
    const newX = Math.random() * (screenW - margin * 2) + margin;
    const newY = Math.random() * (screenH - margin * 2) + margin;

    targetPoint.style.top = `${newY}px`;
    targetPoint.style.left = `${newX}px`;
    targetPoint.style.backgroundColor = "red";

    trialReadyTime = Date.now(); // mark time for next akinetic delay
    console.log(`New target shown for Trial ${trialCount + 1}`);
}

function endAdaptiveTask() {
    modalContent.innerText = results.map(r =>
        `Trial ${r.trial} — Akinetic Delay: ${r.akineticDelay} ms, Movement Time: ${r.movementTime} ms`
    ).join("\n");

    window.showModal();
    console.log("Adaptive drag task completed:", results);
}
