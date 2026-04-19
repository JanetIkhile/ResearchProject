'use strict';

import { supabase } from "../client/supabaseClient.js";
import { initSession, updateSessionFlags } from "../utils/sessionManager.js";

let participantId = null;
let sessionId = null;
let trialNumber = 0;
const TASK_TYPE = "hold";
const PRESSURE_FEEDBACK_ENABLED = true;

// DOM refs (will be assigned after session init)
let holdTarget = null;
let nextButton = null;
let holdInstruction = null;
let startButton = null;

let pressureGaugeContainer = null;
let pressureGaugeFill = null;
let pressureFeedbackText = null;

let holdStartTime = 0;
let releaseTime = 0;
let readyTime = 0;
let trialCount = 0;
let TRIAL_LIMIT = 3;
const HOLD_DURATION = 5000;

let isHolding = false;
let trialActive = false;
let holdTimer = null;
let holdDisplayInterval = null;
let akineticDelay = null;
let readyToRelease = false;
let holdPollingInterval = null;
let currentTouchX = null;
let currentTouchY = null;
let currentTouchForce = null;

let holdEvents = [];
let taskCompleted = false;
let holdFlagUpdated = false;

let pageLoadTime = Date.now();
let lastTrialEndTime = pageLoadTime;
let initiationDelay = null;

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

        console.log("Hold task started");
        console.log("Session number:", sessionNumber);
        console.log("Trial limit:", TRIAL_LIMIT);
    } catch (err) {
        // initSession already redirected or threw; stop further execution
        return;
    }

    // now get DOM elements (after session verified)
    holdTarget = document.getElementById("holdTarget");
    nextButton = document.getElementById("nextTaskButton");
    holdInstruction = document.getElementById("holdInstruction");
    startButton = document.getElementById("startTaskButton");

    pressureGaugeContainer = document.getElementById("pressureGaugeContainer");
    pressureGaugeFill = document.getElementById("pressureGaugeFill");
    pressureFeedbackText = document.getElementById("pressureFeedbackText");

    if (!holdTarget) {
        console.error("holdTarget element not found");
        return;
    }

    // Disable pointer events until Start clicked
    holdTarget.style.pointerEvents = 'none';
    holdTarget.style.backgroundColor = "blue";

    // Start button listener
    if (startButton) {
        startButton.style.display = "block";
        startButton.addEventListener("click", () => {
            // don't start if we've already finished all trials
            if (taskCompleted || trialCount >= TRIAL_LIMIT) return;

            const now = Date.now();
            initiationDelay = now - lastTrialEndTime;
            if (!trialActive) startHoldTrial();
        });
    }
    // Touch handlers: they now early-return if not active or task finished
    holdTarget.addEventListener("touchstart", (e) => {
        e.preventDefault();
        if (taskCompleted) return;
        if (trialCount >= TRIAL_LIMIT) return;
        if (!trialActive) return; // won't register touches before Start

        const touch = e.changedTouches[0];
        if (!isHolding && !readyToRelease) beginHold(touch);
    }, { passive: false });

    document.addEventListener("touchmove", (e) => {
        if (!isHolding || taskCompleted || trialCount >= TRIAL_LIMIT || !trialActive) return;
        e.preventDefault();

        const touch = e.changedTouches[0];
        currentTouchX = touch.pageX;
        currentTouchY = touch.pageY;
        currentTouchForce = (typeof touch.force === "number") ? touch.force : null;
    }, { passive: false });

    // For browser testing fallbacks
    document.addEventListener("mousemove", (e) => {
        if (!isHolding || taskCompleted || trialCount >= TRIAL_LIMIT || !trialActive) return;

        // Ensure primary mouse button is depressed (e.buttons === 1)
        if (e.buttons !== 1) return;

        currentTouchX = e.pageX;
        currentTouchY = e.pageY;
        currentTouchForce = null;
    });

    holdTarget.addEventListener("touchend", (e) => {
        e.preventDefault();
        if (taskCompleted) return;
        if (trialCount >= TRIAL_LIMIT) return;
        if (!trialActive) return;

        const touch = e.changedTouches[0];

        // Early release before allowed release window
        if (!readyToRelease && isHolding) {
            handleEarlyRelease(touch);
            return;
        }

        // Normal release after allowed window
        if (readyToRelease && isHolding) {
            endHold(touch);
        }
    }, { passive: false });

    // --- Minimal addition: Finish session handler ---
    if (nextButton) {
        nextButton.addEventListener('click', async () => {
            try {
                // Prevent double clicks
                nextButton.disabled = true;

                if (!sessionId) {
                    console.warn("No sessionId available to complete session.");
                    nextButton.disabled = false;
                    return;
                }

                const { error } = await supabase
                    .from('sessions')
                    .update({ completed: true })
                    .eq('id', sessionId);

                if (error) {
                    console.error("Failed to mark session completed:", error);
                    nextButton.disabled = false;
                    return;
                }

                console.log("Session marked completed:", sessionId);
                if (TRIAL_LIMIT === 1) {
                    // Practice session → go to start main session page
                    window.location.href = "../start-main.html";
                } else {
                    // Main session → go to thank you page
                    window.location.href = "../thank-you.html";
                }

            } catch (err) {
                console.error("Unexpected error while finishing session:", err);
                if (nextButton) nextButton.disabled = false;
            }
        });
    }
})();

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
    // defensive: do nothing if task already completed
    if (taskCompleted || trialCount >= TRIAL_LIMIT) return;

    trialActive = true;
    isHolding = false;
    readyToRelease = false;
    akineticDelay = null;
    holdEvents = [];
    if (startButton) startButton.style.display = "none";

    // Enable touches now that Start was clicked
    if (holdTarget) {
        holdTarget.style.pointerEvents = 'auto';
        holdTarget.style.backgroundColor = "blue";
    }

    // immediate cue
    readyTime = Date.now();
    // Intentionally omitting instruction text change to prevent reading delay

    playBeep(); // cue sound
    // wait for user to touch; HOLD_DURATION applies once holding begins
}

function beginHold(touch) {
    // require that cue already happened
    if (!readyTime) return;
    if (isHolding) return;

    holdStartTime = Date.now();
    akineticDelay = holdStartTime - readyTime;
    isHolding = true;

    currentTouchX = touch ? touch.pageX : null;
    currentTouchY = touch ? touch.pageY : null;
    currentTouchForce = (touch && typeof touch.force === "number") ? touch.force : null;

    // record raw start event
    holdEvents.push({
        event: "start",
        t: holdStartTime,
        x: currentTouchX,
        y: currentTouchY,
        force: currentTouchForce
    });

    // store akinetic delay as an event for raw trace
    holdEvents.push({
        event: "akinetic_delay",
        t: readyTime,
        value_ms: akineticDelay
    });

    let timeLeft = HOLD_DURATION / 1000;
    if (holdInstruction) holdInstruction.innerHTML = `Keep holding steady for<br><span class="timer-badge">${timeLeft}</span> seconds...`;
    if (holdTarget) holdTarget.style.backgroundColor = "yellow";

    // Show pressure gauge
    if (PRESSURE_FEEDBACK_ENABLED && pressureGaugeContainer) {
        pressureGaugeContainer.style.display = "block";
    }

    // Fire active 60Hz telemetry polling loop
    if (holdPollingInterval) clearInterval(holdPollingInterval);
    holdPollingInterval = setInterval(() => {
        if (!isHolding || currentTouchX === null) return;

        let forceVal = currentTouchForce || 0; // fallback

        // Update UI
        if (PRESSURE_FEEDBACK_ENABLED && pressureGaugeFill && pressureFeedbackText) {
            let percentage = Math.min(forceVal * 100, 100);
            pressureGaugeFill.style.width = percentage + "%";
            console.log("Force:", forceVal, "percentage:", percentage);
            if (forceVal > 0.5) {
                pressureGaugeFill.style.backgroundColor = "#ef4444"; // red
                pressureFeedbackText.innerText = "Apply less force!";
            } else if (forceVal < 0.1) {
                pressureGaugeFill.style.backgroundColor = "#eab308"; // yellow
                pressureFeedbackText.innerText = "Apply more force!";
            } else {
                pressureGaugeFill.style.backgroundColor = "#10b981"; // green
                pressureFeedbackText.innerText = "Force: Optimal";
            }
        }

        holdEvents.push({
            event: "move",
            t: Date.now(),
            x: currentTouchX,
            y: currentTouchY,
            force: currentTouchForce
        });
    }, 16);

    if (holdDisplayInterval) clearInterval(holdDisplayInterval);
    holdDisplayInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0 && holdInstruction) {
            holdInstruction.innerHTML = `Keep holding steady for<br><span class="timer-badge">${timeLeft}</span> seconds...`;
        }
    }, 1000);

    // schedule allowed-release marker
    if (holdTimer) clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
        if (holdDisplayInterval) clearInterval(holdDisplayInterval);
        readyToRelease = true;
        if (holdInstruction) holdInstruction.innerText = "✅ You can release now!";
        if (holdTarget) holdTarget.style.backgroundColor = "green";
        if (navigator.vibrate) navigator.vibrate(200);
    }, HOLD_DURATION);
}

async function handleEarlyRelease(touch) {
    // if somehow called when not holding, ignore
    if (!isHolding) return;

    const releaseTime = Date.now();
    lastTrialEndTime = releaseTime;

    // record raw end event
    holdEvents.push({
        event: "end",
        t: releaseTime,
        x: touch ? touch.pageX : null,
        y: touch ? touch.pageY : null,
        force: (touch && typeof touch.force === "number") ? touch.force : null
    });

    if (holdPollingInterval) {
        clearInterval(holdPollingInterval);
        holdPollingInterval = null;
    }

    if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
    }
    if (holdDisplayInterval) {
        clearInterval(holdDisplayInterval);
        holdDisplayInterval = null;
    }

    const totalHoldTime = holdStartTime ? (releaseTime - holdStartTime) : 0;
    const akinetic = holdStartTime ? (holdStartTime - readyTime) : null;

    isHolding = false;
    trialActive = false;
    trialCount++;
    trialNumber++;

    const isFinalTrial = (trialCount >= TRIAL_LIMIT);

    if (holdTarget) {
        if (isFinalTrial) {
            holdTarget.style.backgroundColor = "green";
        } else {
            holdTarget.style.backgroundColor = "blue";
        }
    }

    const trialPayload = {
        participant_id: participantId,
        session_id: sessionId,
        task_type: TASK_TYPE,
        trial_number: trialNumber,
        timestamp: new Date().toISOString(),
        initiation_delay_ms: initiationDelay,

        // minimal metadata
        akinetic_delay_hold_ms: akinetic,
        total_hold_time_ms: totalHoldTime,
        release_delay_ms: null,
        released_early: true,
        hold_target_duration_ms: HOLD_DURATION,

        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        device_pixel_ratio: window.devicePixelRatio,

        // raw behavior
        hold_events: holdEvents
    };

    try {
        const { error } = await supabase.from("trial_results").insert(trialPayload);
        if (error) console.error("Failed to save hold trial (early):", error);
        else console.log("Saved hold trial (early):", trialNumber);
    } catch (err) {
        console.error("Unexpected error saving hold trial (early):", err);
    }

    // ---------- FEEDBACK ----------
    if (holdInstruction) {
        holdInstruction.innerText = "⚠️ Released too early. Try again.";
    }

    if (holdTarget && !isFinalTrial) {
        holdTarget.style.backgroundColor = "red";
    }

    // ---------- SAVE ----------
    await maybeFinishSession();

    // ---------- DELAY BEFORE RESET ----------
    if (!taskCompleted && !isFinalTrial) {
        setTimeout(() => {
            resetTrial();
        }, 1500);  // 🔥 1.5 seconds feedback window
    }
}

async function endHold(touch) {
    if (!isHolding) return;

    const releaseTimeLocal = Date.now();
    lastTrialEndTime = releaseTimeLocal;

    // record raw end event
    holdEvents.push({
        event: "end",
        t: releaseTimeLocal,
        x: touch ? touch.pageX : null,
        y: touch ? touch.pageY : null,
        force: (touch && typeof touch.force === "number") ? touch.force : null
    });

    if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
    }
    if (holdDisplayInterval) {
        clearInterval(holdDisplayInterval);
        holdDisplayInterval = null;
    }

    const totalHoldTime = holdStartTime ? (releaseTimeLocal - holdStartTime) : 0;
    const releaseDelay = releaseTimeLocal - (holdStartTime + HOLD_DURATION);
    const akinetic = holdStartTime ? (holdStartTime - readyTime) : null;

    isHolding = false;
    trialActive = false;
    trialCount++;
    trialNumber++;

    const trialPayload = {
        participant_id: participantId,
        session_id: sessionId,
        task_type: TASK_TYPE,
        trial_number: trialNumber,
        timestamp: new Date().toISOString(),
        initiation_delay_ms: initiationDelay,

        akinetic_delay_hold_ms: akinetic,
        total_hold_time_ms: totalHoldTime,
        release_delay_ms: releaseDelay > 0 ? releaseDelay : 0,
        released_early: false,
        hold_target_duration_ms: HOLD_DURATION,

        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        device_pixel_ratio: window.devicePixelRatio,

        hold_events: holdEvents
    };

    try {
        const { error } = await supabase.from("trial_results").insert(trialPayload);
        if (error) console.error("Failed to save hold trial:", error);
        else console.log("Saved hold trial:", trialNumber);
    } catch (err) {
        console.error("Unexpected error saving hold trial:", err);
    }

    await maybeFinishSession();

    if (!taskCompleted) {
        resetTrial();   // only reset if NOT finished
    }
}

function resetTrial() {
    if (holdDisplayInterval) {
        clearInterval(holdDisplayInterval);
        holdDisplayInterval = null;
    }
    if (holdInstruction) holdInstruction.innerHTML = "Click Start and immediately hold<br>the blue circle.";
    if (pressureGaugeContainer) pressureGaugeContainer.style.display = "none";
    if (holdTarget) holdTarget.style.backgroundColor = "blue";
    if (startButton) startButton.style.display = "block";
    // after resetting UI, prevent touches until next Start (user must click Start again)
    if (holdTarget) holdTarget.style.pointerEvents = 'none';
    trialActive = false;
    readyToRelease = false;
    readyTime = 0;
    holdStartTime = 0;
    holdEvents = [];
}

async function maybeFinishSession() {
    if (trialCount >= TRIAL_LIMIT) {

        document.getElementById("completionBox").style.display = "flex";
        if (holdDisplayInterval) {
            clearInterval(holdDisplayInterval);
            holdDisplayInterval = null;
        }
        if (pressureGaugeContainer) pressureGaugeContainer.style.display = "none";
        if (holdInstruction) holdInstruction.style.display = "none";
        if (!taskCompleted) {
            taskCompleted = true;
            try {
                await updateSessionFlags(sessionId, { hold: true });
            } catch (err) {
                console.error("Failed to update session hold flag:", err);
            }
        }
        // disable start button and prevent further touches
        if (startButton) {
            startButton.disabled = true;
            startButton.style.display = "none";
        }
        if (holdTarget) {
            holdTarget.style.pointerEvents = 'none';
        }
        if (nextButton) nextButton.style.display = "block";
    }
}

// Prevent long-press context menu globally
document.addEventListener("contextmenu", function (e) { e.preventDefault(); });
