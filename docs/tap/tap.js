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
let tapTrajectory = [];
let taskCompleted = false;
let savingInProgress = false;

let trialStartTime = null;

let topTarget = null;
let bottomTarget = null;
let expectedTarget = "top"; // Alternates: "top" or "bottom"
let nextButton = null;
let tapInstruction = null;
let countdown = null;

let pageLoadTime = Date.now();
let lastTrialEndTime = pageLoadTime;
let initiationDelay = null;

function isTouchInsideTarget(touch, targetEl) {
    if (!targetEl) return false;
    const rect = targetEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = touch.pageX - centerX;
    const dy = touch.pageY - centerY;
    const radius = Math.min(rect.width, rect.height) / 2;
    return (dx * dx + dy * dy) <= (radius * radius);
}

function toggleExpectedTarget() {
    if (expectedTarget === "top") {
        expectedTarget = "bottom";
        if (topTarget) {
            topTarget.classList.remove("active");
            topTarget.classList.add("inactive");
        }
        if (bottomTarget) {
            bottomTarget.classList.remove("inactive");
            bottomTarget.classList.add("active");
        }
    } else {
        expectedTarget = "top";
        if (bottomTarget) {
            bottomTarget.classList.remove("active");
            bottomTarget.classList.add("inactive");
        }
        if (topTarget) {
            topTarget.classList.remove("inactive");
            topTarget.classList.add("active");
        }
    }
}

// attach handler reference so we can remove it later
function handleTouchStart(e) {
    if (window.isModalOpen) return;
    if (taskCompleted) return;

    // block starts while saving is in progress to prevent race
    if (savingInProgress) return;

    // If we've already finished the allowed trials, ignore everything
    if (trialNumber >= TRIAL_LIMIT && !taskActive) return;

    const nextBtn = document.getElementById("nextTaskButton");
    if (nextBtn && nextBtn.contains(e.target)) return;

    e.preventDefault();
    const touch = e.changedTouches[0];
    const now = Date.now();

    const isInsideTop = isTouchInsideTarget(touch, topTarget);
    const isInsideBottom = isTouchInsideTarget(touch, bottomTarget);

    // If we're BETWEEN trials, a touch starts the trial ONLY if it hits one of the targets
    if (!taskActive && isBetweenTrials) {
        if (!isInsideTop && !isInsideBottom) return; // Must hit target to start
        if (trialNumber >= TRIAL_LIMIT) return;

        // prevent race double-starts
        if (taskActive) return;

        initiationDelay = now - lastTrialEndTime;
        trialNumber += 1;

        // Set initial expected target to whichever they hit
        if (isInsideTop) {
            expectedTarget = "top";
        } else {
            expectedTarget = "bottom";
        }

        startTapTrial(now);
        recordTapEvent(touch, now, expectedTarget, true);
        recordTrajectoryPoint(touch, now, 'start');
        
        toggleExpectedTarget();
        return;
    }

    // If a trial is active, record taps based on expected alternation
    if (taskActive) {
        let isHit = false;
        if (expectedTarget === "top" && isInsideTop) {
            isHit = true;
        } else if (expectedTarget === "bottom" && isInsideBottom) {
            isHit = true;
        }

        recordTapEvent(touch, now, expectedTarget, isHit);
        recordTrajectoryPoint(touch, now, 'start');
        
        if (isHit) {
            toggleExpectedTarget();
        }
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
    topTarget = document.getElementById("topTarget");
    bottomTarget = document.getElementById("bottomTarget");
    nextButton = document.getElementById("nextTaskButton");
    tapInstruction = document.getElementById("tapInstruction");
    countdown = document.getElementById("countdownTimer");

    if (!topTarget || !bottomTarget) {
        console.error("Target elements topTarget/bottomTarget not found in DOM.");
        return;
    }

    topTarget.style.touchAction = 'none';
    bottomTarget.style.touchAction = 'none';
    
    if (tapInstruction) tapInstruction.innerHTML = 'Use your index finger to tap the highlighted circle alternatively <strong class="highlight-instruction">as fast as possible</strong>!<br><span class="timer-line">Time remaining: <span class="timer-badge">10</span> seconds</span>';
    
    expectedTarget = "top";
    if (topTarget) {
        topTarget.classList.remove("inactive");
        topTarget.classList.add("active");
    }
    if (bottomTarget) {
        bottomTarget.classList.remove("active");
        bottomTarget.classList.add("inactive");
    }

    document.addEventListener("touchstart", handleTouchStart, { passive: false });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });
})();

// ---------- Start a trial ----------
function startTapTrial(startTs) {
    if (taskCompleted) return;
    if (trialNumber > TRIAL_LIMIT) return;

    clearTimers();

    tapEvents = [];
    tapTrajectory = [];
    taskActive = true;
    isBetweenTrials = false;

    const startTime = startTs || Date.now();
    trialStartTime = startTime;

    if (topTarget && bottomTarget) {
        topTarget.style.pointerEvents = 'auto';
        bottomTarget.style.pointerEvents = 'auto';
        topTarget.style.backgroundColor = "";
        bottomTarget.style.backgroundColor = "";
    }

    // countdown UI
    if (countdown) countdown.style.display = "none";
    let timeLeft = Math.ceil(TASK_DURATION / 1000);

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        if (tapInstruction && timeLeft > 0) {
            tapInstruction.innerHTML = `Use your index finger to tap the highlighted circle alternatively <strong class="highlight-instruction">as fast as possible</strong>!<br><span class="timer-line">Time remaining: <span class="timer-badge">${timeLeft}</span> seconds</span>`;
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

        if (topTarget) topTarget.style.backgroundColor = "green";
        if (bottomTarget) bottomTarget.style.backgroundColor = "green";

        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        if (countdown) countdown.innerText = "";

        // Block any touch-based starts now (immediate)
        if (topTarget) topTarget.style.pointerEvents = 'none';
        if (bottomTarget) bottomTarget.style.pointerEvents = 'none';
        
        // mark save in progress
        savingInProgress = true;

        // Save raw behavior only
        try {
            const endTime = Date.now();
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
                document.removeEventListener("touchstart", handleTouchStart, { passive: false });
                document.removeEventListener("touchmove", handleTouchMove, { passive: false });
                document.removeEventListener("touchend", handleTouchEnd, { passive: false });
            } catch (e) {
                try {
                    document.removeEventListener("touchstart", handleTouchStart);
                    document.removeEventListener("touchmove", handleTouchMove);
                    document.removeEventListener("touchend", handleTouchEnd);
                } catch (er) {}
            }
            if (topTarget) topTarget.style.pointerEvents = 'none';
            if (bottomTarget) bottomTarget.style.pointerEvents = 'none';
            if (nextButton) nextButton.style.display = "block";
            document.getElementById("completionBox").style.display = "flex";
            nextButton.style.display = "block";
            tapInstruction.style.display = "none"; 
            if (countdown) countdown.style.display = "none";
        } else {
            // non-final: wait cooldown then re-enable start
            if (tapInstruction) tapInstruction.innerText = "Stop tapping";
            
            setTimeout(() => {
                isBetweenTrials = true;
                if (topTarget) {
                    topTarget.style.pointerEvents = 'auto';
                    topTarget.style.backgroundColor = "";
                    topTarget.classList.remove("inactive");
                    topTarget.classList.add("active");
                }
                if (bottomTarget) {
                    bottomTarget.style.pointerEvents = 'auto';
                    bottomTarget.style.backgroundColor = "";
                    bottomTarget.classList.remove("active");
                    bottomTarget.classList.add("inactive");
                }
                expectedTarget = "top";
                if (tapInstruction) tapInstruction.innerHTML = 'Use your index finger to tap the highlighted circle alternatively <strong class="highlight-instruction">as fast as possible</strong>!<br><span class="timer-line">Time remaining: <span class="timer-badge">10</span> seconds</span>';
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
function recordTapEvent(touch, ts, expectedTarget, isHit) {
    if (!taskActive) return;

    // Calculate vertical amplitude if there's a previous tap
    let amplitude = null;
    if (tapEvents.length > 0) {
        const lastTap = tapEvents[tapEvents.length - 1];
        amplitude = Math.abs(touch.pageY - lastTap.y);
    }

    const targetEl = (expectedTarget === "top") ? topTarget : bottomTarget;
    let expectedX = null;
    let expectedY = null;
    let expectedR = null;
    if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        expectedX = rect.left + rect.width / 2;
        expectedY = rect.top + rect.height / 2;
        expectedR = rect.width / 2;
    }

    const evt = {
        t: ts || Date.now(),
        x: touch.pageX,
        y: touch.pageY,
        expected_target: expectedTarget,
        target_x: expectedX,
        target_y: expectedY,
        target_radius: expectedR,
        amplitude: amplitude,
        is_inside_target: isHit,
        force: (typeof touch.force === "number") ? touch.force : null
    };
    tapEvents.push(evt);

    // visual feedback on touched target (top or bottom)
    const touchedEl = isTouchInsideTarget(touch, topTarget) ? topTarget : (isTouchInsideTarget(touch, bottomTarget) ? bottomTarget : null);
    if (touchedEl) {
        touchedEl.style.transform = "translateX(-50%) scale(0.9)";
        setTimeout(() => {
            if (touchedEl) {
                touchedEl.style.transform = "translateX(-50%) scale(1)";
            }
        }, 80);
    }
}

function handleTouchMove(e) {
    if (!taskActive) return;
    e.preventDefault();
    const touch = e.changedTouches[0];
    const now = Date.now();
    recordTrajectoryPoint(touch, now, 'move');
}

function handleTouchEnd(e) {
    if (!taskActive) return;
    e.preventDefault();
    const touch = e.changedTouches[0];
    const now = Date.now();
    recordTrajectoryPoint(touch, now, 'end');
}

function recordTrajectoryPoint(touch, ts, type) {
    if (!taskActive) return;
    const pt = {
        t: ts || Date.now(),
        x: touch.pageX,
        y: touch.pageY,
        type: type,
        force: (typeof touch.force === 'number') ? touch.force : null,
        radiusX: (typeof touch.radiusX === 'number') ? touch.radiusX : null,
        radiusY: (typeof touch.radiusY === 'number') ? touch.radiusY : null
    };
    tapTrajectory.push(pt);
}

// ---------- Persist raw taps ----------
async function saveTapTrial(startTime, endTime) {
    const totalTaps = tapEvents.length;
    
    // Store top target in target_x, target_y, target_radius for backward schema compatibility
    let tX = null, tY = null, tR = null;
    if (topTarget) {
        const rect = topTarget.getBoundingClientRect();
        tX = rect.left + rect.width / 2;
        tY = rect.top + rect.height / 2;
        tR = rect.width / 2;
    }
    
    const payload = {
        participant_id: participantId,
        session_id: sessionId,
        task_type: TASK_TYPE,
        trial_number: trialNumber,
        timestamp: new Date().toISOString(),

        total_taps: totalTaps,
        total_tap_time_ms: endTime - startTime,
        initiation_delay: initiationDelay,

        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        device_pixel_ratio: window.devicePixelRatio,

        target_x: tX,
        target_y: tY,
        target_radius: tR,

        taps: tapEvents,
        trajectory: tapTrajectory
    };

    try {
        const { error } = await supabase.from("trial_results").insert(payload);
        if (error) {
            print("Failed to save tap trial to DB:", error);
        } else {
            console.log(`Tap trial saved: ${trialNumber} events:`, totalTaps);
        }
    } catch (err) {
        console.error("Unexpected error saving tap trial:", err);
    }
}

// Prevent long-press context menu globally
document.addEventListener("contextmenu", function (e) { e.preventDefault(); });
