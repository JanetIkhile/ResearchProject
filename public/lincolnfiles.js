'use strict';

let startTime = 0;
let totalTime = 0;
let touchStartX, touchStartY;
let touchEndX, touchEndY;
let finalSpeed = 0;
let isDragging = false;
let modalContent = document.getElementById('modalBodyContent');
let results = ""; // Initialize as an empty string
let reachedTarget = false;
let hitTarget = false;
let exitedTarget = false;
let targetReentry = 0;
let touchSlipBase = 50;
let touchSlipDistance = 0;
let touchSlipBaseX = 0;
let touchSlipBaseY = 0;
let enterTargetTime = 0;
let verificationTime = 0;
let pauseCounter = 0;
let pauseDuration = 0;
let pauseIdentifier = 0;

const startPoint = document.getElementById('startInnerDot');
const targetPoint = document.getElementById('targetInnerDot');
const screenWidth = window.innerWidth;
const screenHeight = window.innerHeight;

console.log(`Viewport width: ${screenWidth}px`);
console.log(`Viewport height: ${screenHeight}px`);

// Reset function to ensure clean slate for each touch event
function resetVariables() {
    totalTime = 0;
    finalSpeed = 0;
    isDragging = false;
    results = ""; // Reset results string
    reachedTarget = false;
    hitTarget = false;
    exitedTarget = false;
    targetReentry = 0;
    touchSlipBase = 50;
    touchSlipDistance = 0;
    touchSlipBaseX = 0;
    touchSlipBaseY = 0;
    enterTargetTime = 0;
    verificationTime = 0;
    pauseCounter = 0;
    pauseDuration = 0;
    pauseIdentifier = 0;
}

// At the touch start
document.addEventListener("touchstart", e => {
    resetVariables(); // Call reset function at the start of each touch event

    const touch = e.changedTouches[0];
    touchStartX = touch.pageX;
    touchStartY = touch.pageY;

    startTime = Date.now();
    pauseIdentifier = startTime;

    const pointer = document.createElement("div");
    pointer.classList.add("dot");
    pointer.style.top = `${touchStartY}px`;
    pointer.style.left = `${touchStartX}px`;
    pointer.id = touch.identifier;

    document.body.append(pointer);
});

// Finger is moving on the screen
document.addEventListener("touchmove", e => {
    e.preventDefault();
    isDragging = true;

    const touch = e.changedTouches[0];
    let currentX = touch.pageX;
    let currentY = touch.pageY;
    let currentTime = Date.now();

    const pointer = document.getElementById(touch.identifier);
    pointer.style.top = `${touch.pageY}px`;
    pointer.style.left = `${touch.pageX}px`;

    // Handle pauses
    if (pauseIdentifier != startTime && pauseIdentifier <= currentTime - 100) {
        pauseCounter++;
        let specificPauseDuration = currentTime - pauseIdentifier;
        if (specificPauseDuration > pauseDuration) {
            pauseDuration = specificPauseDuration;
        }
    }
    pauseIdentifier = currentTime;

    // Check if touch reaches the target
    const targetRect = targetPoint.getBoundingClientRect();
    if (calculateDistance(currentX, targetRect.left + targetRect.width / 2, currentY, targetRect.top + targetRect.height / 2) < 18) {
        hitTarget = true;
        reachedTarget = true;

        const enterTargetTemp = Date.now();
        if (enterTargetTime === 0) {
            enterTargetTime = enterTargetTemp;
        }

        let tempTouchSlip = calculateDistance(currentX, targetRect.left + targetRect.width / 2, currentY, targetRect.top + targetRect.height / 2);
        if (tempTouchSlip < touchSlipBase) {
            touchSlipBase = tempTouchSlip;
            touchSlipBaseX = currentX;
            touchSlipBaseY = currentY;
        }
        if (touchSlipDistance < calculateDistance(touchSlipBaseX, currentX, touchSlipBaseY, currentY)) {
            touchSlipDistance = calculateDistance(touchSlipBaseX, currentX, touchSlipBaseY, currentY);
        }
        if (exitedTarget) {
            exitedTarget = false;
            targetReentry++;
        }
    } else {
        exitedTarget = true;
    }
});

// Finger leaves the screen
document.addEventListener("touchend", e => {
    const touch = e.changedTouches[0];
    touchEndX = touch.pageX;
    touchEndY = touch.pageY;
    const pointer = document.getElementById(touch.identifier);
    pointer.remove();

    let endTime = Date.now();
    totalTime = endTime - startTime;

    if (enterTargetTime !== 0) {
        verificationTime = Date.now() - enterTargetTime;
    }

    // Results specific to this page
    results += `
    -----------------------------------------
    Target reached at end of tap: ${reachedTarget}
    Target reached at some point: ${hitTarget}
    Total Time: ${totalTime} ms
    Total Pauses: ${pauseCounter} pauses
    Longest Pause Duration: ${pauseDuration} ms
    Max Touchslip: ${Math.round(touchSlipDistance * 100) / 100} pixels
    Target Re-entries: ${targetReentry-1}
    Time to liftoff from contact with target: ${verificationTime} ms`;

    modalContent.innerText += results;
    modal.style.display = 'block';

    isDragging = false;
    reachedTarget = false;
    touchSlipDistance = 0;
    targetReentry = 0;
    enterTargetTime = 0;
});

// Utility function to calculate distance
function calculateDistance(x1, x2, y1, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
