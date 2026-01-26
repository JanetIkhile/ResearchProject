'use strict';

const blinkDot = document.getElementById("blinkDot");
const instruction = document.getElementById("tapInstruction");
const modalContent = document.getElementById("modalBodyContent");
const nextButton = document.getElementById("nextTaskButton");
const closeBtn = document.getElementById("modalCloseButton");
const closeX = document.getElementById("modalCloseX");

let blinkInterval = 1000; // 1 Hz blink rate
let blinkTimer = null;

let blinkTimes = [];
let tapTimes = [];
let reactionTimes = [];

let TOTAL_BLINKS = 10;
let redCount = 0;
let isRed = false;
let trialCount = 0;

let awaitingReaction = false;
let currentRedTime = null;

instruction.innerText = "Tap when the circle turns red!";

// -----------------------------
// Start blinking task
// -----------------------------
function startBlinking() {
    console.log("🎵 Starting blinking sequence...");

    // 🔴 Defensive clear
    if (blinkTimer !== null) {
        clearInterval(blinkTimer);
        blinkTimer = null;
    }

    blinkTimes = [];
    tapTimes = [];
    reactionTimes = [];

    redCount = 0;
    isRed = false;
    awaitingReaction = false;
    currentRedTime = null;

    blinkDot.style.backgroundColor = "gray";
    instruction.innerText = "Tap when the circle turns red!";

    blinkTimer = setInterval(() => {
        isRed = !isRed;
        blinkDot.style.backgroundColor = isRed ? "red" : "gray";

        if (isRed) {
            const now = Date.now();
            blinkTimes.push(now);

            awaitingReaction = true;
            currentRedTime = now;

            redCount++;

            if (redCount >= TOTAL_BLINKS) {
                clearInterval(blinkTimer);
                blinkTimer = null;
                endTask();
            }
        }
    }, blinkInterval / 2);
}

// -----------------------------
// Handle tap
// -----------------------------
blinkDot.addEventListener("touchstart", () => {
    if (window.isModalOpen) return;

    const tapTime = Date.now();
    tapTimes.push(tapTime);

    // --- Reaction time capture ---
    if (awaitingReaction && currentRedTime !== null) {
        reactionTimes.push(tapTime - currentRedTime);
        awaitingReaction = false;
        currentRedTime = null;
    }

    blinkDot.style.backgroundColor = "white";
    setTimeout(() => {
        blinkDot.style.backgroundColor = isRed ? "red" : "gray";
    }, 100);
});

// -----------------------------
// End trial
// -----------------------------
function endTask() {
    console.log("✅ Trial complete");
    trialCount++;

    if (tapTimes.length === 0 || blinkTimes.length === 0) {
        modalContent.innerText = "No valid taps recorded.";
        window.showModal();
        nextButton.style.display = "block";
        return;
    }

    // --- Asynchrony ---
    const asynchronies = tapTimes.map(tap => {
        const nearestBlink = blinkTimes.reduce((a, b) =>
            Math.abs(tap - a) < Math.abs(tap - b) ? a : b
        );
        return tap - nearestBlink;
    });

    const meanAsync =
        asynchronies.reduce((a, b) => a + b, 0) / asynchronies.length;

    const stdAsync = Math.sqrt(
        asynchronies.reduce((s, a) => s + Math.pow(a - meanAsync, 2), 0) /
        asynchronies.length
    );

    // --- Reaction Time stats ---
    let meanRT = null;
    let stdRT = null;

    if (reactionTimes.length > 0) {
        meanRT =
            reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;

        stdRT = Math.sqrt(
            reactionTimes.reduce((s, rt) => s + Math.pow(rt - meanRT, 2), 0) /
            reactionTimes.length
        );
    }

    const syncQuality =
        Math.abs(meanAsync) < 100 ? "(Excellent timing)" :
            Math.abs(meanAsync) < 250 ? "(Moderate sync)" :
                "(Delayed / advanced timing)";

    modalContent.innerText = `
Trial: ${trialCount}
Total Taps: ${tapTimes.length}

Mean Asynchrony: ${meanAsync.toFixed(1)} ms ${syncQuality}
Timing Variability (SD): ${stdAsync.toFixed(1)} ms

Reaction Time:
${meanRT !== null
            ? `Mean RT: ${meanRT.toFixed(1)} ms
RT Variability (SD): ${stdRT.toFixed(1)} ms`
            : "No valid reaction times recorded."}
`;

    window.showModal();
    nextButton.style.display = "block";
}

// -----------------------------
// Reset & restart
// -----------------------------
function resetAndRestart() {
    console.log("🔄 Resetting for new trial...");

    if (blinkTimer !== null) {
        clearInterval(blinkTimer);
        blinkTimer = null;
    }

    blinkDot.style.backgroundColor = "gray";
    instruction.innerText = "Tap when the circle turns red!";

    setTimeout(startBlinking, 1000);
}

// -----------------------------
// Modal hooks
// -----------------------------
if (closeBtn) closeBtn.addEventListener("click", resetAndRestart);
if (closeX) closeX.addEventListener("click", resetAndRestart);

// -----------------------------
// Start first trial
// -----------------------------
window.addEventListener("load", startBlinking);
