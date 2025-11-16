'use strict';

const holdTarget = document.getElementById("holdTarget");
const modalContent = document.getElementById("modalBodyContent");
const nextButton = document.getElementById("nextTaskButton");
const holdInstruction = document.getElementById("holdInstruction");

let holdStartTime = 0;
let releaseTime = 0;
let readyTime = 0;
let trialCount = 0;
const TRIAL_LIMIT = 3;
const HOLD_DURATION = 5000; // ms — 5 seconds hold

let isHolding = false;
let trialActive = false;
let holdTimer = null;
let akineticDelay = null;
let countdownTimer = null;
let readyToRelease = false;

// Initial color
holdTarget.style.backgroundColor = "blue";

holdTarget.addEventListener("touchstart", () => {
    if (window.isModalOpen) return;

    // Start new trial
    if (!trialActive) {
        startHoldTrial();
        return;
    }

    // Start hold after countdown (only if active)
    if (!isHolding && !readyToRelease) {
        beginHold();
    }
});

holdTarget.addEventListener("touchend", () => {
    // Only count release after the "release cue"
    if (readyToRelease) {
        endHold();
    }
});

function playBeep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.type = 'sine';
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
    holdInstruction.innerText = "Get ready…";
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

    // After 5 seconds, signal to release — don't end automatically
    holdTimer = setTimeout(() => {
        readyToRelease = true;
        holdInstruction.innerText = "✅ You can release now!";
        holdTarget.style.backgroundColor = "green";
        if (navigator.vibrate) navigator.vibrate(200);
    }, HOLD_DURATION);
}

function endHold() {
    releaseTime = Date.now();
    const totalHoldTime = releaseTime - holdStartTime;

    clearTimeout(holdTimer);

    holdTarget.style.backgroundColor = "red";
    isHolding = false;
    trialActive = false;
    readyToRelease = false;

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
Akinetic Delay (Reaction Start): ${akineticDelay !== null ? akineticDelay : "N/A"
        } ms ${akineticInterpret}
Hold Duration: ${totalHoldTime} ms ${durationInterpret}
Release Delay (after cue): ${releaseDelay > 0 ? releaseDelay : 0} ms ${releaseInterpret}
`;

    window.showModal();
    holdInstruction.innerText = "Press the circle to start next trial.";
    holdTarget.style.backgroundColor = "blue";
    readyTime = 0;

    if (trialCount >= TRIAL_LIMIT) {
        nextButton.style.display = "block";
    }
}
