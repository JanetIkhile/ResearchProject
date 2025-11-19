'use strict';

const tapTarget = document.getElementById("tapTarget");
const modalContent = document.getElementById("modalBodyContent");
const nextButton = document.getElementById("nextTaskButton");
const tapInstruction = document.getElementById("tapInstruction");

let tapTimes = [];
let trialCount = 0;
const TRIAL_LIMIT = 3;
const TASK_DURATION = 10000; // 10 seconds
let taskActive = false;
let taskTimer = null;

// --- Handle touch input ---
tapTarget.addEventListener("touchstart", () => {
    if (window.isModalOpen) return; // prevent taps when modal open

    if (!taskActive) {
        startTapTrial();
    } else {
        recordTap();
    }
});

function startTapTrial() {
    tapTimes = [];
    taskActive = true;

    const countdown = document.getElementById("countdownTimer");

    tapTarget.style.backgroundColor = "yellow";
    tapInstruction.innerText = "⏱️ Keep tapping for 10 seconds!";

    const startTime = Date.now();
    countdown.style.display = "block";


    let timeLeft = TASK_DURATION / 1000;
    countdown.innerText = `Time left: ${timeLeft}s`;

    const timerInterval = setInterval(() => {
        timeLeft--;
        countdown.innerText = `Time left: ${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            countdown.innerText = "Time's up!";
        }
    }, 1000);


    taskTimer = setTimeout(() => {
        taskActive = false;
        const endTime = Date.now();
        console.log("📊 Trial finished, calling analyzeTaps()");

        clearInterval(timerInterval);
        countdown.innerText = "";

        analyzeTaps(startTime, endTime);
        trialCount++;

        if (trialCount >= TRIAL_LIMIT) nextButton.style.display = "block";
    }, TASK_DURATION);
}

function recordTap() {
    tapTarget.style.backgroundColor = "white";
    setTimeout(() => (tapTarget.style.backgroundColor = "red"), 100);
    tapTimes.push(Date.now());
}

// --- Analysis ---
function analyzeTaps(startTime, endTime) {
    if (tapTimes.length < 2) {
        modalContent.innerText = "Not enough taps recorded.";
        window.showModal();
        return;
    }

    const intervals = [];
    for (let i = 1; i < tapTimes.length; i++) {
        intervals.push(tapTimes[i] - tapTimes[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const stdInterval = Math.sqrt(
        intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length
    );
    const cv = stdInterval / avgInterval;
    const totalTaps = tapTimes.length;
    const duration = (endTime - startTime) / 1000;
    const tapsPerSecond = totalTaps / duration;

    // --- Interpretations ---
    const rhythmInterpret =
        cv < 0.15 ? "(Highly regular)" :
            cv < 0.3 ? "(Moderately regular)" :
                "(Irregular tapping rhythm)";

    const speedInterpret =
        tapsPerSecond > 4 ? "(Normal speed)" :
            tapsPerSecond > 2 ? "(Mild bradykinesia)" :
                "(Severe bradykinesia)";

    modalContent.innerText = `
Trial: ${trialCount + 1}
Total Taps: ${totalTaps}
Duration: ${duration.toFixed(1)} s
Tapping Speed: ${tapsPerSecond.toFixed(2)} taps/sec ${speedInterpret}
Rhythmic Consistency (CV): ${cv.toFixed(2)} ${rhythmInterpret}
`;
    window.showModal();
    tapInstruction.innerText = "Tap inside the red circle to start next trial";
}
