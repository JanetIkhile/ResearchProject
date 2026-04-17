'use strict';

import { supabase } from "../client/supabaseClient.js";
import { initSession, updateSessionFlags } from "../utils/sessionManager.js";

let participantId = null;
let sessionId = null;
let trialNumber = 0;
const TASK_TYPE = "tap";
let TRIAL_LIMIT = 3;
const TASK_DURATION = 10000;
const INTER_TRIAL_COOLDOWN = 1500;

let taskActive = false;
let isBetweenTrials = true;
let taskTimer = null;
let timerInterval = null;
let tapEvents = [];
let taskCompleted = false;
let savingInProgress = false;

let trialStartTime = null;

let tapTarget = null;
let nextButton = null;
let tapInstruction = null;
let countdown = null;

let pageLoadTime = Date.now();
let lastTrialEndTime = pageLoadTime;
let initiationDelay = null;

function isTouchInsideTarget(touch) {
    if (!tapTarget) return false;
    const rect = tapTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = touch.pageX - centerX;
    const dy = touch.pageY - centerY;
    const radius = Math.min(rect.width, rect.height) / 2;
    return (dx * dx + dy * dy) <= (radius * radius);
}

// attach handler reference so we can remove it later
function handleTouchStart(e) {
    if (window.isModalOpen) return;
    if (taskCompleted) return;

    // block starts while saving is in progress to prevent race
    if (savingInProgress) return;

    // If we've already finished the allowed trials, ignore everything
    if (trialNumber >= TRIAL_LIMIT && !taskActive) return;

    e.preventDefault();
    const touch = e.changedTouches[0];
    const now = Date.now();

    // ONLY proceed if touch is inside the circular target
    if (!isTouchInsideTarget(touch)) return;

    // If we're BETWEEN trials, a touch starts the trial and is recorded as first tap
    if (!taskActive && isBetweenTrials) {
        if (trialNumber >= TRIAL_LIMIT) return;

        // prevent race double-starts
        if (taskActive) return;

        const now = Date.now();

        initiationDelay = now - lastTrialEndTime;

        trialNumber += 1;
        startTapTrial(now);
        recordTapEvent(touch, now);
        return;
    }

    // If a trial is active, record taps normally
    if (taskActive) {
        recordTapEvent(touch, now);
    }
}

(async function initContext() {
    try {
        const result = await initSession({ dashboardPath: "/dashboard.html" });
        participantId = result.participantId;
        sessionId = result.sessionId;
        console.log("Session verified:", sessionId, result.sessionRow);

        const sessionNumber = result.sessionNumber;

        const header = document.getElementById("taskHeader");
        if (header) {
            const existing = header.querySelector(".session-label");
            if (existing) existing.remove();

            const label = document.createElement("div");
            label.classList.add("session-label");

            if (sessionNumber === 1) {
                label.classList.add("practice");
                label.innerText = "Practice Phase";
                document.body.classList.add("practice-mode");
            } else {
                label.classList.add("real");
                label.innerText = "Main Phase";
            }
            header.appendChild(label);
        }

        if (sessionNumber === 1) {
            TRIAL_LIMIT = 1;   // practice
        } else {
            TRIAL_LIMIT = 3;   // real
        }

        console.log("Tap task started");
        console.log("Session number:", sessionNumber);
        console.log("Trial limit:", TRIAL_LIMIT);

    } catch (err) {
        return;
    }

    // DOM elements
    tapTarget = document.getElementById("tapTarget");
    nextButton = document.getElementById("nextTaskButton");
    tapInstruction = document.getElementById("tapInstruction");
    countdown = document.getElementById("countdownTimer");

    if (!tapTarget) {
        console.error("tapTarget element not found in DOM.");
        return;
    }

    tapTarget.style.touchAction = 'none';
    if (tapInstruction) tapInstruction.innerHTML = 'Tap the blue circle as fast as you can<br>for <span class="timer-badge">10</span> seconds!';
    if (tapTarget) tapTarget.style.backgroundColor = "blue";

    tapTarget.addEventListener("touchstart", handleTouchStart, { passive: false });
})();

// ---------- Start a trial ----------
function startTapTrial(startTs) {
    if (taskCompleted) return;
    if (trialNumber > TRIAL_LIMIT) return;

    clearTimers();

    tapEvents = [];
    taskActive = true;
    isBetweenTrials = false;

    const startTime = startTs || Date.now();
    trialStartTime = startTime;

    // Do NOT change instruction text or color to prevent distraction
    if (tapTarget) {
        tapTarget.style.backgroundColor = "blue";
        tapTarget.style.pointerEvents = 'auto'; // ensure pointer enabled during trial
    }

    // countdown UI
    if (countdown) countdown.style.display = "none";
    let timeLeft = Math.ceil(TASK_DURATION / 1000);

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        if (tapInstruction && timeLeft > 0) {
            tapInstruction.innerHTML = `Tap the blue circle as fast as you can<br>for <span class="timer-badge">${timeLeft}</span> seconds!`;
        }
        if (timeLeft <= 0 && timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }, 1000);

    if (taskTimer) {
        clearTimeout(taskTimer);
        taskTimer = null;
    }

    taskTimer = setTimeout(async () => {
        // Trial finished — flip states and clear timers
        taskActive = false;
        const reachedFinal = (trialNumber >= TRIAL_LIMIT);
        if (tapInstruction) {
            tapInstruction.innerText = "Stop tapping";
        }

        if (tapTarget) {
            tapTarget.style.backgroundColor = "green";
        }

        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        if (countdown) countdown.innerText = "";

        // Block any touch-based starts now (immediate)
        if (tapTarget) {
            tapTarget.style.pointerEvents = 'none';
        }
        // mark save in progress
        savingInProgress = true;

        // Save raw behavior only (use trialStartTime as start)
        try {
            const endTime = Date.now();

            // 🔥 update last trial end time
            lastTrialEndTime = endTime;

            await saveTapTrial(trialStartTime, endTime);
        } finally {
            savingInProgress = false;
        }

        if (reachedFinal) {
            if (!taskCompleted) {
                taskCompleted = true;
                try {
                    await updateSessionFlags(sessionId, { tap: true });
                } catch (err) {
                    console.error("Failed to update session tap flag:", err);
                }
            }

            // final cleanup
            try {
                tapTarget.removeEventListener("touchstart", handleTouchStart, { passive: false });
            } catch (e) {
                try { tapTarget.removeEventListener("touchstart", handleTouchStart); } catch (er) { }
            }
            if (tapTarget) tapTarget.style.pointerEvents = 'none';
            if (nextButton) nextButton.style.display = "block";
            document.getElementById("completionBox").style.display = "flex";
            nextButton.style.display = "block";
            tapInstruction.style.display = "none"; if (countdown) countdown.style.display = "none";
        } else {
            // non-final: wait cooldown then re-enable start
            if (tapInstruction) tapInstruction.innerText = "Stop tapping";
            if (tapTarget) tapTarget.style.backgroundColor = "green";

            setTimeout(() => {
                isBetweenTrials = true;
                if (tapTarget) {
                    tapTarget.style.pointerEvents = 'auto'; // re-enable touches
                    tapTarget.style.backgroundColor = "blue";
                }
                if (tapInstruction) tapInstruction.innerHTML = 'Tap the blue circle as fast as you can<br>for <span class="timer-badge">10</span> seconds!';
                if (countdown) countdown.style.display = "none";
            }, INTER_TRIAL_COOLDOWN);
        }

        clearTimers();
    }, TASK_DURATION);
}

// helper timers clear
function clearTimers() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (taskTimer) {
        clearTimeout(taskTimer);
        taskTimer = null;
    }
}

// ---------- record a tap only while a trial is active ----------
function recordTapEvent(touch, ts) {
    if (!taskActive) return; // only capture taps during active trial
    if (!isTouchInsideTarget(touch)) return;

    const evt = {
        t: ts || Date.now(),
        x: touch.pageX,
        y: touch.pageY,
        force: (typeof touch.force === "number") ? touch.force : null
    };
    tapEvents.push(evt);

    // small visual feedback
    if (tapTarget) {
        tapTarget.style.backgroundColor = "white";
        setTimeout(() => {
            if (tapTarget) {
                tapTarget.style.backgroundColor = "blue"; // Always return to blue
            }
        }, 100);
    }
}

// ---------- Persist raw taps ----------
async function saveTapTrial(startTime, endTime) {
    const totalTaps = tapEvents.length;
    const payload = {
        participant_id: participantId,
        session_id: sessionId,
        task_type: TASK_TYPE,
        trial_number: trialNumber,
        timestamp: new Date().toISOString(),

        total_taps: totalTaps,
        total_tap_time_ms: endTime - startTime,
        initiation_delay_ms: initiationDelay,

        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        device_pixel_ratio: window.devicePixelRatio,

        taps: tapEvents
    };

    try {
        const { error } = await supabase.from("trial_results").insert(payload);
        if (error) {
            console.error("Failed to save tap trial:", error);
        } else {
            console.log(`Tap trial saved: ${trialNumber} events:`, totalTaps);
        }
    } catch (err) {
        console.error("Unexpected error saving tap trial:", err);
    }
}

// Prevent long-press context menu globally
document.addEventListener("contextmenu", function (e) { e.preventDefault(); });
