'use strict';

import { supabase } from "../client/supabaseClient.js";
import { initSession, updateSessionFlags } from "../utils/sessionManager.js";


// ---------------- DEMO ANIMATION FOR HOLD TASK ----------------
let sessionNumber = null;
let demoInterval = null;
let demoPointer = null;
let demoTimeouts = [];

// Progressive Disclosure state variables
let demoLoopCount = 0;
let isFingerDemoAnimating = false;
let inactivityTimer = null;
let gifTimer = null;
let continueInactivityTimer = null;
let practiceStep = 'initial_demo'; // initial_demo -> try_button_shown -> waiting_for_touch -> help_banner_shown -> detailed_demo -> gif_ready_prompt -> active_practice

const ORIGINAL_INSTRUCTION = "Press Start and immediately hold the blue circle with your index finger";

// DOM Refs for progressive disclosure
let tryItButton = null;
let helpBanner = null;
let gifModal = null;
let gifDemoImage = null;
let gifPromptTitle = null;
let gifBtnGroup = null;
let attemptsCounter = null;

function startDemoAnimation() {
    if (sessionNumber !== 1) return; // Only practice phase
    if (taskCompleted || trialCount >= TRIAL_LIMIT || trialActive) return;
    isFingerDemoAnimating = true;

    // Capture initial layouts
    const startRect = startButton.getBoundingClientRect();
    const startX = startRect.left + startRect.width / 2 - 30;
    const startY = startRect.top + startRect.height / 2;

    const targetRect = holdTarget.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2 - 30;
    const targetY = targetRect.top + targetRect.height / 2;

    if (!demoPointer) {
        demoPointer = document.createElement("div");
        demoPointer.id = "demoPointer";
        demoPointer.style.position = "absolute";
        demoPointer.style.width = "60px";
        demoPointer.style.height = "60px";
        demoPointer.style.fontSize = "54px";
        demoPointer.style.textAlign = "center";
        demoPointer.style.lineHeight = "60px";
        demoPointer.style.zIndex = "1000";
        demoPointer.style.pointerEvents = "none";
        demoPointer.style.opacity = "0";
        demoPointer.innerText = "👆";
        demoPointer.style.left = `${startX}px`;
        demoPointer.style.top = `${startY + 60}px`;
        document.body.appendChild(demoPointer);
    } else {
        demoPointer.style.left = `${startX}px`;
        demoPointer.style.top = `${startY + 60}px`;
    }

    function clearDemoTimeouts() {
        demoTimeouts.forEach(t => clearTimeout(t));
        demoTimeouts = [];
    }

    function runAnimationCycle() {
        if (taskCompleted || trialCount >= TRIAL_LIMIT || trialActive) {
            stopDemoAnimation();
            return;
        }

        if (sessionNumber === 1 && trialCount === 0) {
            demoLoopCount += 1;
            if (demoLoopCount > 2) {
                stopDemoAnimation();
                practiceStep = 'options_shown';
                const optionsOverlay = document.getElementById("practiceOptionsOverlay");
                if (optionsOverlay) optionsOverlay.style.display = "flex";
                const optionsContainer = document.getElementById("practiceOptionsContainer");
                if (optionsContainer) optionsContainer.style.display = "flex";
                const tryItButton = document.getElementById("tryItButton");
                if (tryItButton) tryItButton.style.display = "block";
                const indicator = document.getElementById("watchExampleIndicator");
                if (indicator) indicator.style.display = "none";

                // Dim background elements
                ['taskHeader', 'holdArea'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.classList.add("dimmed");
                });
                return;
            }
        }

        clearDemoTimeouts();

        // 1. Initial State: Pointer starts below Start button, invisible
        demoPointer.style.transition = "none";
        demoPointer.style.left = `${startX}px`;
        demoPointer.style.top = `${startY + 60}px`;
        demoPointer.style.opacity = "0";
        demoPointer.style.transform = "scale(1)";

        holdTarget.style.transition = "none";
        holdTarget.style.backgroundColor = "blue";
        holdTarget.style.transform = "translateX(-50%) scale(1)";

        holdInstruction.innerHTML = "Press Start and immediately hold the blue circle with your index finger";
        startButton.style.transition = "opacity 0.2s ease";
        startButton.style.opacity = "1";

        // 2. Fade in and slide to Start button (0.2s)
        demoTimeouts.push(setTimeout(() => {
            if (taskCompleted || trialCount >= TRIAL_LIMIT || trialActive || !demoPointer) return;
            demoPointer.style.transition = "top 0.4s ease-out, opacity 0.4s ease-in";
            demoPointer.style.top = `${startY}px`;
            demoPointer.style.opacity = "1";
        }, 200));

        // 3. Simulates Click (0.8s)
        demoTimeouts.push(setTimeout(() => {
            if (taskCompleted || trialCount >= TRIAL_LIMIT || trialActive || !demoPointer) return;
            demoPointer.style.transition = "transform 0.15s ease";
            demoPointer.style.transform = "scale(0.85)";
            
            // Simulates start button click visually
            startButton.style.opacity = "0.2";
        }, 800));

        // 4. Shrink/Press animation release, Start button disappears (1.0s)
        demoTimeouts.push(setTimeout(() => {
            if (taskCompleted || trialCount >= TRIAL_LIMIT || trialActive || !demoPointer) return;
            demoPointer.style.transform = "scale(1)";
            startButton.style.opacity = "0";
        }, 1000));

        // 5. Move from Start button to target circle (1.2s)
        demoTimeouts.push(setTimeout(() => {
            if (taskCompleted || trialCount >= TRIAL_LIMIT || trialActive || !demoPointer) return;
            demoPointer.style.transition = "left 0.6s ease-in-out, top 0.6s ease-in-out";
            demoPointer.style.left = `${targetX}px`;
            demoPointer.style.top = `${targetY}px`;
        }, 1200));

        // 6. Hold begins (1.8s)
        demoTimeouts.push(setTimeout(() => {
            if (taskCompleted || trialCount >= TRIAL_LIMIT || trialActive || !demoPointer) return;
            // Target circle shrinks/presses
            holdTarget.style.transition = "transform 0.2s ease";
            holdTarget.style.transform = "translateX(-50%) scale(0.95)";
            
            // Simulates countdown
            holdInstruction.innerHTML = "Keep holding steady for<br><span class=\"timer-badge\">5</span> seconds...";
        }, 1800));

        // 7. Simulates Hold progress (2.8s)
        demoTimeouts.push(setTimeout(() => {
            if (taskCompleted || trialCount >= TRIAL_LIMIT || trialActive || !demoPointer) return;
            holdInstruction.innerHTML = "Keep holding steady for<br><span class=\"timer-badge\">4</span> seconds...";
        }, 2800));

        // 8. Simulates Hold progress (3.8s)
        demoTimeouts.push(setTimeout(() => {
            if (taskCompleted || trialCount >= TRIAL_LIMIT || trialActive || !demoPointer) return;
            holdInstruction.innerHTML = "Keep holding steady for<br><span class=\"timer-badge\">3</span> seconds...";
        }, 3800));

        // 8b. Simulates Hold progress (4.8s)
        demoTimeouts.push(setTimeout(() => {
            if (taskCompleted || trialCount >= TRIAL_LIMIT || trialActive || !demoPointer) return;
            holdInstruction.innerHTML = "Keep holding steady for<br><span class=\"timer-badge\">2</span> seconds...";
        }, 4880));

        // 8c. Simulates Hold progress (5.8s)
        demoTimeouts.push(setTimeout(() => {
            if (taskCompleted || trialCount >= TRIAL_LIMIT || trialActive || !demoPointer) return;
            holdInstruction.innerHTML = "Keep holding steady for<br><span class=\"timer-badge\">1</span> seconds...";
        }, 5880));

        // 9. Hold completes: turns green! (6.8s)
        demoTimeouts.push(setTimeout(() => {
            if (taskCompleted || trialCount >= TRIAL_LIMIT || trialActive || !demoPointer) return;
            holdTarget.style.transition = "background-color 0.3s ease";
            holdTarget.style.backgroundColor = "green";
            holdInstruction.innerText = "✅ You can release now!";
        }, 6880));

        // 10. Fade out and reset pointer (7.5s)
        demoTimeouts.push(setTimeout(() => {
            if (taskCompleted || trialCount >= TRIAL_LIMIT || trialActive || !demoPointer) return;
            demoPointer.style.transition = "opacity 0.4s ease-out, top 0.4s ease-out";
            demoPointer.style.opacity = "0";
            demoPointer.style.top = `${targetY + 60}px`;
        }, 7580));

        // 11. Smoothly clean up targets/button (8.2s)
        demoTimeouts.push(setTimeout(() => {
            if (taskCompleted || trialCount >= TRIAL_LIMIT || trialActive) return;
            holdTarget.style.transition = "background-color 0.2s ease, transform 0.2s ease";
            holdTarget.style.backgroundColor = "blue";
            holdTarget.style.transform = "translateX(-50%) scale(1)";
            startButton.style.opacity = "1";
            holdInstruction.innerHTML = "Press Start and immediately hold the blue circle with your index finger";
        }, 8280));
    }

    runAnimationCycle();
    demoInterval = setInterval(runAnimationCycle, 9000);
}

function stopDemoAnimation() {
    isFingerDemoAnimating = false;
    if (demoInterval) {
        clearInterval(demoInterval);
        demoInterval = null;
    }
    demoTimeouts.forEach(t => clearTimeout(t));
    demoTimeouts = [];

    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
    }
    if (gifTimer) {
        clearTimeout(gifTimer);
        gifTimer = null;
    }

    if (demoPointer) {
        demoPointer.remove();
        demoPointer = null;
    }

    // Reset visual elements
    if (holdTarget) {
        holdTarget.style.backgroundColor = "blue";
        holdTarget.style.transform = "translateX(-50%) scale(1)";
    }
    if (startButton) {
        startButton.style.opacity = "1";
    }
    if (holdInstruction) {
        holdInstruction.innerHTML = "Press Start and immediately hold the blue circle with your index finger";
    }
}

let participantId = null;
let sessionId = null;
let trialNumber = 0;
const TASK_TYPE = "hold";
const PRESSURE_FEEDBACK_ENABLED = false;

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

        sessionNumber = result.sessionNumber;

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
            TRIAL_LIMIT = 2;   // practice
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

    if (sessionNumber === 1) {
        updateInstructions(false);
        const indicator = document.getElementById("watchExampleIndicator");
        if (indicator) indicator.style.display = "inline-block";
        setupProgressiveDisclosure();
    }

    setTimeout(startDemoAnimation, 500);

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
        if (sessionNumber === 1) {
            startButton.style.pointerEvents = 'none'; // Lock until Now Try It clicked
        }
        startButton.addEventListener("click", () => {
            // don't start if we've already finished all trials
            if (taskCompleted || trialCount >= TRIAL_LIMIT) return;

            const now = Date.now();
            initiationDelay = now - lastTrialEndTime;
            stopDemoAnimation();
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
        stopDemoAnimation();
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

    // --- Finish session handler ---
    if (nextButton) {
        nextButton.addEventListener('click', (e) => {
            e.stopPropagation();
            finishAndNavigate();
        });
    }
})();

async function finishAndNavigate() {
    const nextBtn = nextButton || document.getElementById("nextTaskButton");
    if (nextBtn) nextBtn.disabled = true;
    try {
        if (sessionId) {
            const { error } = await supabase
                .from('sessions')
                .update({ completed: true })
                .eq('id', sessionId);

            if (error) {
                console.error("Failed to mark session completed:", error);
            } else {
                console.log("Session marked completed:", sessionId);
            }
        }
    } catch (err) {
        console.error("Unexpected error while finishing session:", err);
    } finally {
        if (sessionNumber === 1) {
            window.location.href = "../start-main.html";
        } else {
            window.location.href = "../thank-you.html";
        }
    }
}

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

    // Explicitly hide overlays
    const tryItButton = document.getElementById("tryItButton");
    if (tryItButton) tryItButton.style.display = "none";
    const helpBanner = document.getElementById("helpBanner");
    if (helpBanner) helpBanner.style.display = "none";

    // Enable touches now that Start was clicked
    if (holdTarget) {
        holdTarget.style.pointerEvents = 'auto';
        holdTarget.style.backgroundColor = "blue";
    }

    // immediate cue
    readyTime = Date.now();
    
    updateInstructions(true);

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
    if (holdTarget) holdTarget.style.transform = "translateX(-50%) scale(0.95)";

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
        holdTarget.style.transform = "translateX(-50%) scale(1)";
        if (isFinalTrial) {
            holdTarget.style.backgroundColor = "green";
        } else {
            holdTarget.style.backgroundColor = "blue";
        }
    }

    let tX = null, tY = null, tR = null;
    if (holdTarget) {
        const rect = holdTarget.getBoundingClientRect();
        tX = rect.left + rect.width / 2;
        tY = rect.top + rect.height / 2;
        tR = rect.width / 2;
    }

    const trialPayload = {
        participant_id: participantId,
        session_id: sessionId,
        task_type: TASK_TYPE,
        trial_number: trialNumber,
        timestamp: new Date().toISOString(),
        initiation_delay: initiationDelay,

        // minimal metadata
        akinetic_delay_hold: akinetic,
        total_hold_time_ms: totalHoldTime,
        release_delay_ms: null,
        released_early: true,
        hold_target_duration_ms: HOLD_DURATION,

        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        device_pixel_ratio: window.devicePixelRatio,

        target_x: tX,
        target_y: tY,
        target_radius: tR,

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

    if (holdTarget) holdTarget.style.transform = "translateX(-50%) scale(1)";

    let tX = null, tY = null, tR = null;
    if (holdTarget) {
        const rect = holdTarget.getBoundingClientRect();
        tX = rect.left + rect.width / 2;
        tY = rect.top + rect.height / 2;
        tR = rect.width / 2;
    }

    const trialPayload = {
        participant_id: participantId,
        session_id: sessionId,
        task_type: TASK_TYPE,
        trial_number: trialNumber,
        timestamp: new Date().toISOString(),
        initiation_delay: initiationDelay,

        akinetic_delay_hold: akinetic,
        total_hold_time_ms: totalHoldTime,
        release_delay_ms: releaseDelay > 0 ? releaseDelay : 0,
        released_early: false,
        hold_target_duration_ms: HOLD_DURATION,

        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        device_pixel_ratio: window.devicePixelRatio,

        target_x: tX,
        target_y: tY,
        target_radius: tR,

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
    if (holdInstruction) holdInstruction.innerHTML = "Press Start and immediately hold the blue circle with your index finger";
    if (pressureGaugeContainer) pressureGaugeContainer.style.display = "none";
    if (holdTarget) {
        holdTarget.style.backgroundColor = "blue";
        holdTarget.style.transform = "translateX(-50%) scale(1)";
    }
    if (startButton) startButton.style.display = "block";
    // after resetting UI, prevent touches until next Start (user must click Start again)
    if (holdTarget) holdTarget.style.pointerEvents = 'none';
    trialActive = false;
    readyToRelease = false;
    readyTime = 0;
    holdStartTime = 0;
    holdEvents = [];

    updateInstructions(false);
}

async function maybeFinishSession() {
    if (trialCount >= TRIAL_LIMIT) {
        updateInstructions(false);
        
        // Dim background elements
        const holdArea = document.getElementById("holdArea");
        const taskHeader = document.getElementById("taskHeader");
        if (holdArea) holdArea.classList.add("dimmed");
        if (taskHeader) taskHeader.classList.add("dimmed");

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

        // Task complete Centered Modal
        const nextBtn = document.getElementById("nextTaskButton");
        const completionBox = document.getElementById("completionBox");
        const completionText = document.getElementById("completionText");

        if (sessionNumber === 1) {
            if (completionText) completionText.innerText = "✅ Practice Complete";
            if (nextBtn) nextBtn.innerText = "Finish Tasks";
        } else {
            if (completionText) completionText.innerText = "✅ Task Complete";
            if (nextBtn) nextBtn.innerText = "Finish Tasks";
        }

        if (nextBtn) nextBtn.style.display = "block";
        if (completionBox) {
            completionBox.style.display = "flex";
            completionBox.style.cursor = "pointer";
            completionBox.onclick = () => {
                finishAndNavigate();
            };
        }

        if (sessionNumber === 1) {
            // Create finger pointer continue animation after 5 seconds
            if (continueInactivityTimer) clearTimeout(continueInactivityTimer);
            continueInactivityTimer = setTimeout(() => {
                if (taskCompleted) {
                    const existingPointer = document.getElementById("continuePointer");
                    if (!existingPointer) {
                        const pointer = document.createElement("div");
                        pointer.id = "continuePointer";
                        pointer.classList.add("continue-pointer-animate");
                        pointer.innerText = "👆";
                        pointer.style.position = "fixed";
                        pointer.style.left = "50%";
                        pointer.style.top = "50%";
                        pointer.style.fontSize = "54px";
                        pointer.style.zIndex = "2500";
                        pointer.style.pointerEvents = "none";
                        document.body.appendChild(pointer);
                    }
                }
            }, 5000);
        }
    }
}

// Progressive Disclosure & Touch Handling Helpers

function handleTouch(e) {
    // In practice phase (trial 0): block screen and target touches during demo animation or until "Start Practice" is clicked
    if (sessionNumber === 1 && trialCount === 0) {
        if (practiceStep === 'options_shown') {
            const optionsOverlay = document.getElementById("practiceOptionsOverlay");
            const optionsContainer = document.getElementById("practiceOptionsContainer");
            if (optionsOverlay && optionsContainer && !optionsContainer.contains(e.target)) {
                resumeDemoAnimationFromOptions();
                return;
            }
        }
        if (isFingerDemoAnimating || (practiceStep !== 'waiting_for_touch' && practiceStep !== 'active_practice')) {
            return; // Ignore all touches while demo is running or options are shown
        }
    }

    if (e.target.id === "tryItButton" || e.target.id === "watchVideoBtn" || e.target.id === "watchExampleBtn" || e.target.id === "gifBtnYes" || e.target.id === "gifBtnAgain" || e.target.id === "nextTaskButton" || e.target.closest("#gifModal") || e.target.closest("#helpBanner") || e.target.closest("#completionBox") || e.target.closest("#practiceOptionsContainer")) {
        return;
    }

    if (window.isModalOpen || taskCompleted || trialCount >= TRIAL_LIMIT) {
        e.preventDefault();
        return;
    }

    if (sessionNumber === 1 && trialCount === 0) {
        if (practiceStep === 'initial_demo' || practiceStep === 'detailed_demo' || practiceStep === 'gif_ready_prompt') {
            e.preventDefault();
            return;
        }

        if (practiceStep === 'try_button_shown') {
            const tryItButton = document.getElementById("tryItButton");
            if (tryItButton && !tryItButton.contains(e.target)) {
                tryItButton.style.display = "none";
                const indicator = document.getElementById("watchExampleIndicator");
                if (indicator) indicator.style.display = "none";

                practiceStep = 'waiting_for_touch';
                if (startButton) startButton.style.pointerEvents = 'auto';

                if (inactivityTimer) clearTimeout(inactivityTimer);
                inactivityTimer = setTimeout(() => {
                    if (practiceStep === 'waiting_for_touch') {
                        practiceStep = 'help_banner_shown';
                        if (startButton) startButton.style.pointerEvents = 'none';
                        const banner = document.getElementById("helpBanner");
                        if (banner) banner.style.display = "flex";
                    }
                }, 7000);

                e.preventDefault();
                return;
            }
        }

        if (practiceStep === 'help_banner_shown') {
            const helpBanner = document.getElementById("helpBanner");
            if (helpBanner && !helpBanner.contains(e.target)) {
                helpBanner.style.display = "none";

                practiceStep = 'waiting_for_touch';
                if (startButton) startButton.style.pointerEvents = 'auto';

                if (inactivityTimer) clearTimeout(inactivityTimer);
                inactivityTimer = setTimeout(() => {
                    if (practiceStep === 'waiting_for_touch') {
                        practiceStep = 'help_banner_shown';
                        if (startButton) startButton.style.pointerEvents = 'none';
                        if (helpBanner) helpBanner.style.display = "flex";
                    }
                }, 7000);

                e.preventDefault();
                return;
            }
        }
    }

    stopDemoAnimation();
}

function resumeDemoAnimationFromOptions() {
    const optionsOverlay = document.getElementById("practiceOptionsOverlay");
    if (optionsOverlay) optionsOverlay.style.display = "none";
    const optionsContainer = document.getElementById("practiceOptionsContainer");
    if (optionsContainer) optionsContainer.style.display = "none";

    // Un-dim background elements
    ['taskHeader', 'holdArea'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove("dimmed");
    });

    const indicator = document.getElementById("watchExampleIndicator");
    if (indicator) indicator.style.display = "inline-block";

    practiceStep = 'initial_demo';
    demoLoopCount = 0;
    setTimeout(startDemoAnimation, 300);
}

function setupProgressiveDisclosure() {
    tryItButton = document.getElementById("tryItButton");
    helpBanner = document.getElementById("helpBanner");
    gifModal = document.getElementById("gifModal");
    gifDemoImage = document.getElementById("gifDemoImage");
    gifPromptTitle = document.getElementById("gifPromptTitle");
    gifBtnGroup = document.getElementById("gifBtnGroup");
    attemptsCounter = document.getElementById("attemptsCounter");
    const watchVideoBtn = document.getElementById("watchVideoBtn");
    const optionsContainer = document.getElementById("practiceOptionsContainer");

    const optionsOverlay = document.getElementById("practiceOptionsOverlay");
    if (optionsOverlay) {
        optionsOverlay.addEventListener("click", (e) => {
            if (e.target === optionsOverlay || !e.target.closest("#practiceOptionsContainer")) {
                e.stopPropagation();
                resumeDemoAnimationFromOptions();
            }
        });
    }

    const openGifModal = () => {
        const optionsOverlay = document.getElementById("practiceOptionsOverlay");
        if (optionsOverlay) optionsOverlay.style.display = "none";
        if (optionsContainer) optionsContainer.style.display = "none";
        if (helpBanner) helpBanner.style.display = "none";

        // Un-dim background elements
        ['taskHeader', 'holdArea'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove("dimmed");
        });
        practiceStep = 'detailed_demo';

        if (gifModal) {
            gifModal.style.display = "block";
            gifModal.classList.add("show");
        }
        window.isModalOpen = true;

        if (gifDemoImage) {
            const currentSrc = gifDemoImage.src;
            gifDemoImage.src = "";
            gifDemoImage.src = currentSrc.split('?')[0] + '?v=' + Date.now();
        }

        if (gifPromptTitle) gifPromptTitle.style.display = "none";
        if (gifBtnGroup) gifBtnGroup.style.display = "none";

        if (gifTimer) clearTimeout(gifTimer);
        gifTimer = setTimeout(() => {
            practiceStep = 'gif_ready_prompt';
            if (gifPromptTitle) gifPromptTitle.style.display = "block";
            if (gifBtnGroup) gifBtnGroup.style.display = "flex";
        }, 6000);
    };

    if (tryItButton) {
        tryItButton.addEventListener("click", (e) => {
            e.stopPropagation();
            stopDemoAnimation();
            const optionsOverlay = document.getElementById("practiceOptionsOverlay");
            if (optionsOverlay) optionsOverlay.style.display = "none";
            if (optionsContainer) optionsContainer.style.display = "none";
            const indicator = document.getElementById("watchExampleIndicator");
            if (indicator) indicator.style.display = "none";

            // Un-dim background elements
            ['taskHeader', 'holdArea'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.remove("dimmed");
            });

            practiceStep = 'waiting_for_touch';
            if (startButton) startButton.style.pointerEvents = 'auto';
        });
    }

    if (watchVideoBtn) {
        watchVideoBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            openGifModal();
        });
    }

    const gifBtnYes = document.getElementById("gifBtnYes");
    if (gifBtnYes) {
        gifBtnYes.addEventListener("click", (e) => {
            e.stopPropagation();
            if (gifTimer) clearTimeout(gifTimer);
            if (gifModal) {
                gifModal.style.display = "none";
                gifModal.classList.remove("show");
            }
            window.isModalOpen = false;

            practiceStep = 'waiting_for_touch';
            if (startButton) startButton.style.pointerEvents = 'auto';
        });
    }

    const gifBtnAgain = document.getElementById("gifBtnAgain");
    if (gifBtnAgain) {
        gifBtnAgain.addEventListener("click", (e) => {
            e.stopPropagation();
            openGifModal();
        });
    }
}

function updateInstructions(showAttempts) {
    const indicator = document.getElementById("watchExampleIndicator");
    if (indicator) {
        indicator.style.display = (sessionNumber === 1 && !showAttempts && trialCount === 0) ? "inline-block" : "none";
    }
    if (attemptsCounter) {
        const isDemoPlaying = (sessionNumber === 1 && trialCount === 0 && !showAttempts);
        const displayTrial = Math.min(trialCount + 1, TRIAL_LIMIT);
        if (displayTrial <= TRIAL_LIMIT && !taskCompleted && !isDemoPlaying) {
            attemptsCounter.style.display = "block";
            attemptsCounter.innerText = `${displayTrial} of ${TRIAL_LIMIT}`;
        } else {
            attemptsCounter.style.display = "none";
        }
    }
}

// Global Touch Handlers
document.addEventListener("touchstart", handleTouch, { passive: false });
document.addEventListener("mousedown", handleTouch);

// Prevent long-press context menu globally
document.addEventListener("contextmenu", function (e) { e.preventDefault(); });
