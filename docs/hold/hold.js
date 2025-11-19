'use strict';

const holdTarget = document.getElementById("holdTarget");
const modalContent = document.getElementById("modalBodyContent");
const nextButton = document.getElementById("nextTaskButton");
const holdInstruction = document.getElementById("holdInstruction");
const startButton = document.getElementById("startTaskButton");

let holdStartTime = 0;
let releaseTime = 0;
let readyTime = 0;
let trialCount = 0;
const TRIAL_LIMIT = 3;
const HOLD_DURATION = 5000;

let isHolding = false;
let trialActive = false;
let holdTimer = null;
let akineticDelay = null;
let countdownTimer = null;
let readyToRelease = false;

holdTarget.style.backgroundColor = "blue";

// Start button listener
startButton.addEventListener("click", () => {
    if (!trialActive) startHoldTrial();
});

holdTarget.addEventListener("touchstart", () => {
    if (window.isModalOpen || !trialActive) return;

    if (!isHolding && !readyToRelease) beginHold();
});

holdTarget.addEventListener("touchend", () => {
    if (!trialActive) return;

    // Early release before cue
    if (!readyToRelease && isHolding) {
        handleEarlyRelease();
        return;
    }

    // Normal release after cue
    if (readyToRelease) {
        endHold();
    }
});

function playBeep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = 880;
        gainNode.gain.value = 0.1;
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.2);
    } catch (e) {
        console.warn("Audio not supported:", e);
    }
}

function startHoldTrial() {
    trialActive = true;
    isHolding = false;
    readyToRelease = false;
    akineticDelay = null;
    startButton.style.display = "none";

    holdInstruction.innerText = "Get ready...";
    holdTarget.style.backgroundColor = "blue";

    let countdown = 3;
    countdownTimer = setInterval(() => {
        if (countdown > 0) {
            holdInstruction.innerText = `Starting in ${countdown}...`;
            countdown--;
        } else {
            clearInterval(countdownTimer);
            holdInstruction.innerText = "Go! Hold the circle now!";
            playBeep();
            readyTime = Date.now();
        }
    }, 1000);
}

function beginHold() {
    if (!readyTime) return;
    holdStartTime = Date.now();
    akineticDelay = holdStartTime - readyTime;
    isHolding = true;

    holdInstruction.innerText = "⏱️ Keep holding steady...";
    holdTarget.style.backgroundColor = "yellow";

    holdTimer = setTimeout(() => {
        readyToRelease = true;
        holdInstruction.innerText = "✅ You can release now!";
        holdTarget.style.backgroundColor = "green";
        if (navigator.vibrate) navigator.vibrate(200);
    }, HOLD_DURATION);
}

function handleEarlyRelease() {
    const releaseTime = Date.now();
    const totalHoldTime = releaseTime - holdStartTime;
    clearTimeout(holdTimer);
    isHolding = false;
    trialActive = false;

    modalContent.innerText = `
Trial: ${++trialCount}
Akinetic Delay (Reaction Start): ${akineticDelay ?? "N/A"} ms
Hold Duration: ${totalHoldTime} ms (Released early)
`;

    window.showModal();
    resetTrial();
}

function endHold() {
    releaseTime = Date.now();
    const totalHoldTime = releaseTime - holdStartTime;

    clearTimeout(holdTimer);

    const releaseDelay = releaseTime - (holdStartTime + HOLD_DURATION);
    const akineticInterpret =
        akineticDelay === null
            ? "(Not captured)"
            : akineticDelay < 800
                ? "(Normal initiation)"
                : akineticDelay < 1500
                    ? "(Mild delay)"
                    : "(Severe delay)";

    const durationInterpret =
        totalHoldTime >= HOLD_DURATION - 300
            ? "(Held steady)"
            : "(Released early)";

    const releaseInterpret =
        releaseDelay < 300
            ? "(Prompt release)"
            : releaseDelay < 1000
                ? "(Mild hesitation)"
                : "(Delayed release)";

    modalContent.innerText = `
Trial: ${++trialCount}
Akinetic Delay (Reaction Start): ${akineticDelay ?? "N/A"} ms ${akineticInterpret}
Hold Duration: ${totalHoldTime} ms ${durationInterpret}
Release Delay (after cue): ${releaseDelay > 0 ? releaseDelay : 0} ms ${releaseInterpret}
`;

    window.showModal();
    resetTrial();
}

function resetTrial() {
    holdInstruction.innerText = "Click 'Start Task' when you're ready to begin.";
    holdTarget.style.backgroundColor = "blue";
    startButton.style.display = "block";
    trialActive = false;
    readyToRelease = false;
    readyTime = 0;

    if (trialCount >= TRIAL_LIMIT) {
        nextButton.style.display = "block";
    }
}
