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
let practiceStep = 'initial_demo_waiting'; // initial_demo_waiting, initial_demo_animating, try_button_shown -> waiting_for_touch -> help_banner_shown -> detailed_demo -> gif_ready_prompt -> active_practice
let trialStartTimestamp = 0;

const ORIGINAL_INSTRUCTION = "Press <strong class=\"highlight-instruction\">Start</strong> and immediately <strong class=\"highlight-instruction\">hold</strong> the blue circle<br>with your index finger";

// DOM Refs for progressive disclosure
let tryItButton = null;
let helpBanner = null;
let gifModal = null;
let gifDemoImage = null;
let gifPromptTitle = null;
let gifBtnGroup = null;
let attemptsCounter = null;

function addInstantButtonHandler(btn, callback) {
    if (!btn) return;
    let handled = false;
    const trigger = (e) => {
        if (handled) return;
        handled = true;
        if (e && e.cancelable) e.preventDefault();
        if (e) e.stopPropagation();
        callback(e);
        setTimeout(() => { handled = false; }, 300);
    };
    btn.addEventListener("pointerup", trigger);
    btn.addEventListener("touchend", trigger);
    btn.addEventListener("click", trigger);
}

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
            if (demoLoopCount > 1) {
                stopDemoAnimation();
                practiceStep = 'options_shown';
                const optionsOverlay = document.getElementById("practiceOptionsOverlay");
                if (optionsOverlay) optionsOverlay.style.display = "flex";
                const optionsContainer = document.getElementById("practiceOptionsContainer");
                if (optionsContainer) optionsContainer.style.display = "flex";
                const tryItButton = document.getElementById("tryItButton");
                if (tryItButton) tryItButton.style.display = "block";
                const watchExampleBtn = document.getElementById("watchExampleBtn");
                if (watchExampleBtn) watchExampleBtn.style.display = "none";

                // Dim background elements
                ['taskHeader', 'holdArea', 'holdInstruction'].forEach(id => {
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
        holdTarget.style.backgroundColor = "#0046FF";
        holdTarget.style.transform = "translateX(-50%) scale(1)";

        holdInstruction.innerHTML = "Press <strong class=\"highlight-instruction\">Start</strong> and immediately <strong class=\"highlight-instruction\">hold</strong> the blue circle<br>with your index finger";
        startButton.style.transition = "opacity 0.2s ease, transform 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease";
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
            startButton.classList.add("pressed");
        }, 800));

        // 4. Shrink/Press animation release, Start button disappears (1.0s)
        demoTimeouts.push(setTimeout(() => {
            if (taskCompleted || trialCount >= TRIAL_LIMIT || trialActive || !demoPointer) return;
            demoPointer.style.transform = "scale(1)";
            startButton.classList.remove("pressed");
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
            holdTarget.style.backgroundColor = "#41A67E";
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
            holdTarget.style.backgroundColor = "#0046FF";
            holdTarget.style.transform = "translateX(-50%) scale(1)";
            
            if (sessionNumber === 1 && trialCount === 0 && demoLoopCount >= 1) {
                // End of the 1st demo cycle in practice phase: show options!
                stopDemoAnimation();
                practiceStep = 'options_shown';
                const optionsOverlay = document.getElementById("practiceOptionsOverlay");
                if (optionsOverlay) optionsOverlay.style.display = "flex";
                const optionsContainer = document.getElementById("practiceOptionsContainer");
                if (optionsContainer) optionsContainer.style.display = "flex";
                const tryItButton = document.getElementById("tryItButton");
                if (tryItButton) tryItButton.style.display = "block";
                const watchExampleBtn = document.getElementById("watchExampleBtn");
                if (watchExampleBtn) watchExampleBtn.style.display = "none";

                // Dim background elements
                ['taskHeader', 'holdArea', 'holdInstruction'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.classList.add("dimmed");
                });
            } else {
                startButton.style.opacity = "1";
                holdInstruction.innerHTML = "Press <strong class=\"highlight-instruction\">Start</strong> and immediately <strong class=\"highlight-instruction\">hold</strong> the blue circle<br>with your index finger";
            }
        }, 8280));
    }

    runAnimationCycle();
    demoInterval = setInterval(runAnimationCycle, 9000);
}

let hintTimeouts = [];
function clearHintTimeouts() {
    hintTimeouts.forEach(t => clearTimeout(t));
    hintTimeouts = [];
}

function showStartHint() {
    // If hint is already visible, don't duplicate
    if (document.getElementById("startHintPointer")) return;

    const startBtn = document.getElementById("startTaskButton");
    if (!startBtn || startBtn.style.display === "none" || startBtn.style.opacity === "0") return;

    const hintPointer = document.createElement("div");
    hintPointer.id = "startHintPointer";
    hintPointer.innerText = "👆";
    hintPointer.className = "hint-pointer";

    const rect = startBtn.getBoundingClientRect();
    const targetLeft = rect.left + rect.width / 2 - 30;
    const targetTop = rect.top + rect.height / 2;

    // Initial state: 60px below the target, transparent (matching demoPointer initial state)
    hintPointer.style.left = `${targetLeft}px`;
    hintPointer.style.top = `${targetTop + 60}px`;

    document.body.appendChild(hintPointer);

    clearHintTimeouts();

    // 1. Fade in and slide to target immediately
    hintTimeouts.push(setTimeout(() => {
        hintPointer.style.opacity = "1";
        hintPointer.style.top = `${targetTop + 15}px`;
    }, 50));

    // 2. Press 1 (300ms)
    hintTimeouts.push(setTimeout(() => {
        hintPointer.style.top = `${targetTop}px`;
        hintPointer.style.transform = "scale(0.85)";
        startBtn.classList.add("pressed");
    }, 300));

    // 3. Release 1 (700ms)
    hintTimeouts.push(setTimeout(() => {
        hintPointer.style.top = `${targetTop + 15}px`;
        hintPointer.style.transform = "scale(1)";
        startBtn.classList.remove("pressed");
    }, 700));

    // 4. Press 2 (1300ms)
    hintTimeouts.push(setTimeout(() => {
        hintPointer.style.top = `${targetTop}px`;
        hintPointer.style.transform = "scale(0.85)";
        startBtn.classList.add("pressed");
    }, 1300));

    // 5. Release 2 (1700ms)
    hintTimeouts.push(setTimeout(() => {
        hintPointer.style.top = `${targetTop + 15}px`;
        hintPointer.style.transform = "scale(1)";
        startBtn.classList.remove("pressed");
    }, 1700));

    // 6. Fade out and clean up (2250ms)
    hintTimeouts.push(setTimeout(() => {
        hintPointer.style.opacity = "0";
        hintTimeouts.push(setTimeout(() => {
            hintPointer.remove();
            clearHintTimeouts();
        }, 200));
    }, 2250));
}

let holdInactivityTimer = null;
let holdHintTimeouts = [];

function clearHoldInactivityTimer() {
    if (holdInactivityTimer) {
        clearTimeout(holdInactivityTimer);
        holdInactivityTimer = null;
    }
}

function clearHoldHintTimeouts() {
    holdHintTimeouts.forEach(t => clearTimeout(t));
    holdHintTimeouts = [];
}

function removeHoldTargetHint() {
    const hint = document.getElementById("holdTargetHintPointer");
    if (hint) hint.remove();
    clearHoldHintTimeouts();
    if (holdTarget) {
        holdTarget.style.transform = "translateX(-50%) scale(1)";
    }
}

function showHoldTargetHint() {
    // If already visible, don't duplicate
    if (document.getElementById("holdTargetHintPointer")) return;
    if (!holdTarget) return;

    const hintPointer = document.createElement("div");
    hintPointer.id = "holdTargetHintPointer";
    hintPointer.innerText = "👆";
    hintPointer.className = "hint-pointer";

    const targetRect = holdTarget.getBoundingClientRect();
    const targetLeft = targetRect.left + targetRect.width / 2 - 30;
    const targetTop = targetRect.top + targetRect.height / 2;

    // Initial state: 60px below target center, transparent
    hintPointer.style.left = `${targetLeft}px`;
    hintPointer.style.top = `${targetTop + 60}px`;

    document.body.appendChild(hintPointer);

    clearHoldHintTimeouts();

    // 1. Fade in and slide to target immediately
    holdHintTimeouts.push(setTimeout(() => {
        hintPointer.style.opacity = "1";
        hintPointer.style.top = `${targetTop + 15}px`;
    }, 50));

    // 2. Press 1 (300ms)
    holdHintTimeouts.push(setTimeout(() => {
        hintPointer.style.top = `${targetTop}px`;
        hintPointer.style.transform = "scale(0.85)";
        holdTarget.style.transition = "transform 0.15s ease";
        holdTarget.style.transform = "translateX(-50%) scale(0.92)"; // scale down circle
    }, 300));

    // 3. Release 1 (700ms)
    holdHintTimeouts.push(setTimeout(() => {
        hintPointer.style.top = `${targetTop + 15}px`;
        hintPointer.style.transform = "scale(1)";
        holdTarget.style.transform = "translateX(-50%) scale(1)";
    }, 700));

    // 4. Press 2 (1300ms)
    holdHintTimeouts.push(setTimeout(() => {
        hintPointer.style.top = `${targetTop}px`;
        hintPointer.style.transform = "scale(0.85)";
        holdTarget.style.transform = "translateX(-50%) scale(0.92)";
    }, 1300));

    // 5. Release 2 (1700ms)
    holdHintTimeouts.push(setTimeout(() => {
        hintPointer.style.top = `${targetTop + 15}px`;
        hintPointer.style.transform = "scale(1)";
        holdTarget.style.transform = "translateX(-50%) scale(1)";
    }, 1700));

    // 6. Fade out and clean up (2250ms)
    holdHintTimeouts.push(setTimeout(() => {
        hintPointer.style.opacity = "0";
        holdHintTimeouts.push(setTimeout(() => {
            hintPointer.remove();
            clearHoldHintTimeouts();
        }, 200));
    }, 2250));
}

function showButtonPointer(btn) {
    const existing = document.getElementById("btnPointer");
    if (existing) existing.remove();

    btn.classList.add("button-pressed-animate");

    const pointer = document.createElement("div");
    pointer.id = "btnPointer";
    pointer.innerText = "👆";
    pointer.style.position = "absolute";
    pointer.style.fontSize = "54px";
    pointer.style.zIndex = "3000";
    pointer.style.pointerEvents = "none";
    pointer.classList.add("continue-pointer-animate");

    const rect = btn.getBoundingClientRect();
    pointer.style.left = `${rect.left + rect.width / 2}px`;
    pointer.style.top = `${rect.bottom + 15}px`;
    document.body.appendChild(pointer);
}

// Reposition the helper hand pointer on window resize
window.addEventListener("resize", () => {
    const btn = document.getElementById("watchExampleBtn");
    const pointer = document.getElementById("btnPointer");
    if (btn && pointer && btn.style.display !== "none") {
        const rect = btn.getBoundingClientRect();
        pointer.style.left = `${rect.left + rect.width / 2}px`;
        pointer.style.top = `${rect.bottom + 15}px`;
    }
});

function stopDemoAnimation() {
    if (isFingerDemoAnimating) {
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
            holdTarget.style.backgroundColor = "#0046FF";
            holdTarget.style.transform = "translateX(-50%) scale(1)";
        }
        if (startButton) {
            if (sessionNumber === 1 && (practiceStep === 'initial_demo' || practiceStep === 'detailed_demo' || practiceStep === 'options_shown')) {
                startButton.style.opacity = "0";
                startButton.style.pointerEvents = 'none';
            } else {
                startButton.style.opacity = "1";
                startButton.style.pointerEvents = 'auto';
            }
            startButton.classList.remove("pressed");
            startButton.classList.remove("pulse-pressed");
        }
        if (holdInstruction) {
            holdInstruction.innerHTML = "Press <strong class=\"highlight-instruction\">Start</strong> and immediately <strong class=\"highlight-instruction\">hold</strong> the blue circle<br>with your index finger";
        }
    }

    const btnPointer = document.getElementById("btnPointer");
    if (btnPointer) btnPointer.remove();

    const watchExampleBtn = document.getElementById("watchExampleBtn");
    if (watchExampleBtn) {
        watchExampleBtn.style.display = "none";
        watchExampleBtn.classList.remove("button-pressed-animate");
    }
}

let participantId = null;
let sessionId = null;
let trialNumber = 0;
const TASK_TYPE = "hold";
const PRESSURE_FEEDBACK_ENABLED = false;

// Practice error threshold
const MAX_PRACTICE_ERRORS = 7;
let practiceErrorCount = 0;

// DOM refs (will be assigned after session init)
let holdTarget = null;
let nextButton = null;
let holdInstruction = null;
let startButton = null;
let timerLine = null;
let timerBadge = null;

let pressureGaugeContainer = null;
let pressureGaugeFill = null;
let pressureFeedbackText = null;

let holdStartTime = 0;
let releaseTime = 0;
let readyTime = 0;
let trialCount = 0;
let TRIAL_LIMIT = 3;
let HOLD_DURATION = 5000;

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

        sessionNumber = (sessionStorage.getItem("session_type") === "practice") ? 1 : result.sessionNumber;
        if (sessionNumber !== 1) {
            HOLD_DURATION = 10000;
        }

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
    timerLine = document.getElementById("timerLine");
    timerBadge = document.getElementById("timerBadge");

    pressureGaugeContainer = document.getElementById("pressureGaugeContainer");
    pressureGaugeFill = document.getElementById("pressureGaugeFill");
    pressureFeedbackText = document.getElementById("pressureFeedbackText");
    attemptsCounter = document.getElementById("attemptsCounter");

    if (sessionNumber === 1) {
        updateInstructions(false);
        const watchExampleBtn = document.getElementById("watchExampleBtn");
        if (watchExampleBtn) watchExampleBtn.style.display = "inline-block";
        setupProgressiveDisclosure();
    } else {
        updateInstructions(true, 10); // Show timer remaining on load during main phase
    }

    if (!holdTarget) {
        console.error("holdTarget element not found");
        return;
    }

    // Disable pointer events until Start clicked (but keep touchable for hint)
    holdTarget.style.pointerEvents = 'auto';
    holdTarget.style.backgroundColor = "#0046FF";

    // Start button listener
    if (startButton) {
        startButton.style.display = "block";
        if (sessionNumber === 1) {
            startButton.style.pointerEvents = 'none'; // Lock until Now Try It clicked
        }
        const handleStartTrigger = (e) => {
            e.preventDefault();
            e.stopPropagation();

            // don't start if we've already finished all trials
            if (taskCompleted || trialCount >= TRIAL_LIMIT) return;

            // Remove hint pointer if active
            const existingHint = document.getElementById("startHintPointer");
            if (existingHint) {
                existingHint.remove();
            }
            clearHintTimeouts();
            startButton.classList.remove("pressed");
            startButton.classList.remove("pulse-pressed");

            const now = Date.now();
            initiationDelay = now - lastTrialEndTime;
            stopDemoAnimation();
            if (!trialActive) startHoldTrial();
        };

        startButton.addEventListener("pointerdown", handleStartTrigger);
        startButton.addEventListener("touchstart", handleStartTrigger, { passive: false });
        startButton.addEventListener("mousedown", handleStartTrigger);
    }
    // Touch handlers: they now early-return if not active or task finished
    holdTarget.addEventListener("touchstart", (e) => {
        e.preventDefault();
        if (taskCompleted) return;
        if (trialCount >= TRIAL_LIMIT) return;
        if (!trialActive) {
            // User touched the blue circle before clicking "Start"!
            // Determine if we should show the helper hint
            let shouldShowHint = false;
            if (sessionNumber === 1) {
                // In practice phase: only show after clicking "Start Practice"
                if (practiceStep === 'waiting_for_touch') {
                    shouldShowHint = true;
                }
            } else {
                // In main phase: always show if touched before starting
                shouldShowHint = true;
            }

            if (shouldShowHint) {
                showStartHint();
            }
            return;
        }

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

    trialStartTimestamp = Date.now();
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
        holdTarget.style.backgroundColor = "#0046FF";
    }

    // immediate cue
    readyTime = Date.now();
    
    updateInstructions(true);

    playBeep(); // cue sound
    // wait for user to touch; HOLD_DURATION applies once holding begins

    // In practice phase: show a helper hint if they don't press the dot within 5 seconds
    if (sessionNumber === 1) {
        clearHoldInactivityTimer();
        holdInactivityTimer = setTimeout(() => {
            if (trialActive && !isHolding) {
                showHoldTargetHint();
            }
        }, 2000);
    }
}

function beginHold(touch) {
    // require that cue already happened
    if (!readyTime) return;
    if (isHolding) return;

    clearHoldInactivityTimer();
    removeHoldTargetHint();

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

        // Drift check only during practice phase
        if (sessionNumber === 1) {
            if (!isPointInsideTargetWithTolerance(currentTouchX, currentTouchY, 0)) {
                handleDriftError();
                return;
            }
        }

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

    if (timerLine) timerLine.style.display = "none";

    if (holdDisplayInterval) clearInterval(holdDisplayInterval);
    holdDisplayInterval = setInterval(() => {
        const elapsed = Date.now() - holdStartTime;
        const remainingSeconds = Math.max(0, Math.ceil((HOLD_DURATION - elapsed) / 1000));
        if (remainingSeconds > 0) {
            if (holdInstruction) {
                holdInstruction.innerHTML = `Keep holding steady for<br><span class="timer-badge">${remainingSeconds}</span> seconds...`;
            }
            if (timerBadge) {
                timerBadge.innerText = remainingSeconds;
            }
        }
    }, 100);

    // schedule allowed-release marker
    if (holdTimer) clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
        if (holdDisplayInterval) clearInterval(holdDisplayInterval);
        readyToRelease = true;
        if (holdInstruction) holdInstruction.innerText = "✅ You can release now!";
        if (timerBadge) timerBadge.innerText = "0";
        if (holdTarget) holdTarget.style.backgroundColor = "#41A67E";
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

    await endHoldTrialEarly(releaseTime);
}

async function endHoldPracticeEarly() {
    // Log threshold reached to Supabase
    try {
        if (sessionId) {
            await supabase.from("trial_results").insert({
                participant_id: participantId,
                session_id: sessionId,
                task_type: TASK_TYPE,
                trial_number: trialNumber,
                timestamp: new Date().toISOString(),
                notes: "practice_error_threshold_reached",
                viewport_width: window.innerWidth,
                viewport_height: window.innerHeight,
                device_pixel_ratio: window.devicePixelRatio
            });
        }
    } catch (err) {
        console.warn("Could not log hold practice threshold event:", err);
    }
    console.log("[Hold] Practice error threshold reached — ending practice early.");

    // Clean up timers
    if (holdPollingInterval) { clearInterval(holdPollingInterval); holdPollingInterval = null; }
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    if (holdDisplayInterval) { clearInterval(holdDisplayInterval); holdDisplayInterval = null; }
    isHolding = false;
    trialActive = false;
    taskCompleted = true;

    if (holdTarget) holdTarget.style.pointerEvents = 'none';
    if (startButton) { startButton.style.display = 'none'; }

    // Show completion UI
    const nextBtn = document.getElementById("nextTaskButton");
    const completionBox = document.getElementById("completionBox");
    const completionText = document.getElementById("completionText");
    if (completionText) completionText.innerText = "✅ Practice Complete";
    if (nextBtn) nextBtn.innerText = "Finish Tasks";
    if (nextBtn) nextBtn.style.display = "block";
    if (completionBox) {
        completionBox.style.display = "flex";
        addInstantButtonHandler(completionBox, () => { finishAndNavigate(); });
        if (nextBtn) addInstantButtonHandler(nextBtn, () => { finishAndNavigate(); });
    }
}

function showEarlyReleaseModal() {
    if (sessionNumber !== 1) {
        // In main phase, early release still shows modal but does NOT count toward practice threshold
        if (document.getElementById("earlyReleaseModal")) return;
        _showEarlyReleaseModalImpl();
        return;
    }

    // In practice phase, count this as a practice error
    practiceErrorCount++;
    console.log(`[Hold] Practice error (early release) #${practiceErrorCount}`);
    if (practiceErrorCount >= MAX_PRACTICE_ERRORS) {
        endHoldPracticeEarly();
        return;
    }

    if (document.getElementById("earlyReleaseModal")) return;
    _showEarlyReleaseModalImpl();
}

function _showEarlyReleaseModalImpl() {

    window.isModalOpen = true; // Lock modal interactions
    const modalDiv = document.createElement("div");
    modalDiv.id = "earlyReleaseModal";
    modalDiv.style.position = "fixed";
    modalDiv.style.top = "0";
    modalDiv.style.left = "0";
    modalDiv.style.width = "100%";
    modalDiv.style.height = "100%";
    modalDiv.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
    modalDiv.style.backdropFilter = "blur(8px)";
    modalDiv.style.webkitBackdropFilter = "blur(8px)";
    modalDiv.style.display = "flex";
    modalDiv.style.justifyContent = "center";
    modalDiv.style.alignItems = "center";
    modalDiv.style.zIndex = "9999";

    const dismissModal = () => {
        modalDiv.remove();
        window.isModalOpen = false; // Release modal interactions lock
        resetTrial();
    };

    modalDiv.addEventListener("click", dismissModal);

    // Stop touch/pointer events from bubbling down to task elements underneath
    ["touchstart", "touchmove", "touchend", "mousedown", "mouseup"].forEach(evtName => {
        modalDiv.addEventListener(evtName, (e) => {
            e.stopPropagation();
        });
    });
    
    const contentDiv = document.createElement("div");
    contentDiv.style.backgroundColor = "white";
    contentDiv.style.padding = "40px clamp(24px, 5vw, 40px)";
    contentDiv.style.borderRadius = "24px";
    contentDiv.style.boxShadow = "0 20px 40px rgba(0,0,0,0.15)";
    contentDiv.style.maxWidth = "580px";
    contentDiv.style.width = "85%";
    contentDiv.style.textAlign = "center";
    contentDiv.style.fontFamily = "'Selawik', Arial, Helvetica, sans-serif";
    contentDiv.style.boxSizing = "border-box";
    
    const title = document.createElement("h3");
    title.innerText = "⚠️ Early Release";
    title.style.margin = "0 0 16px 0";
    title.style.color = "#ea580c";
    title.style.fontSize = "26px";
    title.style.fontWeight = "bold";
    
    const msg = document.createElement("p");
    msg.innerText = "Released early. You should keep holding until the timer is up.";
    msg.style.margin = "0 0 28px 0";
    msg.style.fontSize = "22px";
    msg.style.lineHeight = "1.6";
    msg.style.color = "#4b5563";
    
    const btn = document.createElement("button");
    btn.innerText = "Okay";
    btn.style.backgroundColor = "#003366";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.padding = "16px 28px";
    btn.style.fontSize = "20px";
    btn.style.fontWeight = "bold";
    btn.style.borderRadius = "12px";
    btn.style.cursor = "pointer";
    btn.style.width = "100%";
    btn.style.boxSizing = "border-box";
    btn.style.boxShadow = "0 4px 12px rgba(0, 51, 102, 0.25)";
    btn.style.transition = "background-color 0.2s, transform 0.1s";
    
    btn.addEventListener("mouseenter", () => {
        btn.style.backgroundColor = "#002244";
    });
    btn.addEventListener("mouseleave", () => {
        btn.style.backgroundColor = "#003366";
    });
    btn.addEventListener("pointerdown", () => {
        btn.style.transform = "scale(0.97)";
    });
    btn.addEventListener("pointerup", () => {
        btn.style.transform = "scale(1)";
    });
    
    btn.addEventListener("click", dismissModal);
    
    contentDiv.appendChild(title);
    contentDiv.appendChild(msg);
    contentDiv.appendChild(btn);
    modalDiv.appendChild(contentDiv);
    document.body.appendChild(modalDiv);
}

async function endHoldTrialEarly(releaseTime) {
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
    if (sessionNumber === 1) {
        // In practice phase, failed holds do not count towards the successful trial limit.
        // We do NOT increment trialCount, so they repeat this trial.
        trialNumber++;
    } else {
        trialCount++;
        trialNumber++;
    }

    const isFinalTrial = (trialCount >= TRIAL_LIMIT);

    if (holdTarget) {
        holdTarget.style.transform = "translateX(-50%) scale(1)";
        if (isFinalTrial) {
            holdTarget.style.backgroundColor = "#41A67E";
        } else {
            holdTarget.style.backgroundColor = "#0046FF";
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
    if (holdTarget && !isFinalTrial) {
        holdTarget.style.backgroundColor = "#CD4439";
    }

    // ---------- SAVE ----------
    await maybeFinishSession();

    // ---------- DELAY BEFORE RESET ----------
    if (!taskCompleted && !isFinalTrial) {
        showEarlyReleaseModal();
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
    clearHoldInactivityTimer();
    removeHoldTargetHint();

    if (holdDisplayInterval) {
        clearInterval(holdDisplayInterval);
        holdDisplayInterval = null;
    }
    if (holdInstruction) holdInstruction.innerHTML = "Press <strong class=\"highlight-instruction\">Start</strong> and immediately <strong class=\"highlight-instruction\">hold</strong> the blue circle<br>with your index finger";
    if (pressureGaugeContainer) pressureGaugeContainer.style.display = "none";
    if (holdTarget) {
        holdTarget.style.backgroundColor = "#0046FF";
        holdTarget.style.transform = "translateX(-50%) scale(1)";
    }
    if (startButton) startButton.style.display = "block";
    // after resetting UI, allow touches for the Start hint helper
    if (holdTarget) holdTarget.style.pointerEvents = 'auto';
    trialActive = false;
    readyToRelease = false;
    readyTime = 0;
    holdStartTime = 0;
    holdEvents = [];

    if (sessionNumber === 1) {
        updateInstructions(true, 5);
    } else {
        updateInstructions(true, 10);
    }
}

async function maybeFinishSession() {
    if (trialCount >= TRIAL_LIMIT) {
        clearHoldInactivityTimer();
        removeHoldTargetHint();
        updateInstructions(false);
        
        // Dim background elements
        const holdArea = document.getElementById("holdArea");
        const taskHeader = document.getElementById("taskHeader");
        const holdInstruction = document.getElementById("holdInstruction");
        const attemptsCounter = document.getElementById("attemptsCounter");
        if (holdArea) holdArea.classList.add("dimmed");
        if (taskHeader) taskHeader.classList.add("dimmed");
        if (holdInstruction) holdInstruction.classList.add("dimmed");
        if (attemptsCounter) attemptsCounter.classList.add("dimmed");

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
            addInstantButtonHandler(completionBox, () => {
                finishAndNavigate();
            });
            if (nextBtn) {
                addInstantButtonHandler(nextBtn, () => {
                    finishAndNavigate();
                });
            }
        }

        // Create finger pointer continue animation after 2 seconds
        if (continueInactivityTimer) clearTimeout(continueInactivityTimer);
        continueInactivityTimer = setTimeout(() => {
            if (taskCompleted) {
                const nextBtn = document.getElementById("nextTaskButton");
                const existingPointer = document.getElementById("continuePointer");
                if (nextBtn && !existingPointer) {
                    const pointer = document.createElement("div");
                    pointer.id = "continuePointer";
                    pointer.classList.add("continue-pointer-animate");
                    pointer.innerText = "👆";
                    pointer.style.position = "absolute";
                    pointer.style.fontSize = "54px";
                    pointer.style.zIndex = "2500";
                    pointer.style.pointerEvents = "none";

                    const rect = nextBtn.getBoundingClientRect();
                    pointer.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`;
                    pointer.style.top = `${rect.bottom + 15 + window.scrollY}px`;
                    document.body.appendChild(pointer);
                }
            }
        }, 2000);
    }
}

// Progressive Disclosure & Touch Handling Helpers

function handleTouch(e) {
    if (e.target.id === "tryItButton" || e.target.id === "watchVideoBtn" || e.target.id === "watchExampleBtn" || e.target.id === "gifBtnYes" || e.target.id === "gifBtnAgain" || e.target.id === "nextTaskButton" || e.target.closest("#gifModal") || e.target.closest("#helpBanner") || e.target.closest("#completionBox") || e.target.closest("#practiceOptionsContainer")) {
        return;
    }

    // In practice phase (trial 0): block screen and target touches during demo animation or until "Start Practice" is clicked
    if (sessionNumber === 1 && trialCount === 0) {
        if (practiceStep === 'initial_demo_animating') {
            e.stopPropagation();
            e.preventDefault();
            return;
        }
        if (practiceStep === 'initial_demo_waiting') {
            // Touch occurred on load before watching demo -> show helper hand pointer to guide the user, then ignore touch
            const watchExampleBtn = document.getElementById("watchExampleBtn");
            if (watchExampleBtn && !document.getElementById("btnPointer")) {
                showButtonPointer(watchExampleBtn);
            }
            e.stopPropagation();
            e.preventDefault();
            return;
        }
        if (practiceStep === 'options_shown') {
            e.stopPropagation();
            e.preventDefault();
            return;
        }
        if (isFingerDemoAnimating || (practiceStep !== 'waiting_for_touch' && practiceStep !== 'active_practice' && practiceStep !== 'help_banner_shown' && practiceStep !== 'try_button_shown')) {
            return; // Ignore all touches while demo is running or options are shown
        }
    }

    if (window.isModalOpen || taskCompleted || trialCount >= TRIAL_LIMIT) {
        e.preventDefault();
        return;
    }

    if (sessionNumber === 1) {
        // 1. If trial is not active, but they touched outside start button
        if (!trialActive && practiceStep === 'waiting_for_touch') {
            if (e.target !== startButton) {
                showStartHint();
                e.stopPropagation();
                e.preventDefault();
                return;
            }
        }
        
        // 2. If trial is active, but they haven't started holding, and touched outside the circle target
        if (trialActive && !isHolding && (Date.now() - trialStartTimestamp > 500)) {
            if (e.target !== holdTarget && e.target !== startButton) {
                // Abort the trial
                clearHoldInactivityTimer();
                if (holdDisplayInterval) {
                    clearInterval(holdDisplayInterval);
                    holdDisplayInterval = null;
                }
                if (holdTimer) {
                    clearTimeout(holdTimer);
                    holdTimer = null;
                }
                trialActive = false;
                isHolding = false;
                
                showHoldPracticeMissModal();
                e.stopPropagation();
                e.preventDefault();
                return;
            }
        }
    }

    if (sessionNumber === 1 && trialCount === 0) {
        if (practiceStep === 'initial_demo_waiting' || practiceStep === 'initial_demo_animating' || practiceStep === 'detailed_demo' || practiceStep === 'gif_ready_prompt') {
            e.preventDefault();
            return;
        }

        if (practiceStep === 'try_button_shown') {
            const tryItButton = document.getElementById("tryItButton");
            if (tryItButton && !tryItButton.contains(e.target)) {
                tryItButton.style.display = "none";
                const watchExampleBtn = document.getElementById("watchExampleBtn");
                if (watchExampleBtn) watchExampleBtn.style.display = "none";

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
            if (!helpBanner || !helpBanner.contains(e.target)) {
                if (helpBanner) helpBanner.style.display = "none";

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
    ['taskHeader', 'holdArea', 'holdInstruction'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove("dimmed");
    });

    const watchExampleBtn = document.getElementById("watchExampleBtn");
    if (watchExampleBtn) watchExampleBtn.style.display = "inline-block";

    practiceStep = 'initial_demo_waiting';
    demoLoopCount = 0;
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
            e.stopPropagation();
            e.preventDefault();
        });
    }

    const openGifModal = () => {
        const optionsOverlay = document.getElementById("practiceOptionsOverlay");
        if (optionsOverlay) optionsOverlay.style.display = "none";
        if (optionsContainer) optionsContainer.style.display = "none";
        if (helpBanner) helpBanner.style.display = "none";

        // Un-dim background elements
        ['taskHeader', 'holdArea', 'holdInstruction'].forEach(id => {
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
        addInstantButtonHandler(tryItButton, (e) => {
            stopDemoAnimation();
            const optionsOverlay = document.getElementById("practiceOptionsOverlay");
            if (optionsOverlay) optionsOverlay.style.display = "none";
            if (optionsContainer) optionsContainer.style.display = "none";
            const watchExampleBtn = document.getElementById("watchExampleBtn");
            if (watchExampleBtn) watchExampleBtn.style.display = "none";

            // Un-dim background elements
            ['taskHeader', 'holdArea', 'holdInstruction'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.remove("dimmed");
            });

            practiceStep = 'waiting_for_touch';
            if (startButton) {
                startButton.style.opacity = "1";
                startButton.style.pointerEvents = 'auto';
            }
            updateInstructions(true, 5);
        });
    }

    if (watchExampleBtn) {
        addInstantButtonHandler(watchExampleBtn, (e) => {
            // Remove helper hand
            const pointer = document.getElementById("btnPointer");
            if (pointer) pointer.remove();

            // Hide the button and remove scale animation class
            watchExampleBtn.style.display = "none";
            watchExampleBtn.classList.remove("button-pressed-animate");

            // Start the finger demo animation
            practiceStep = 'initial_demo_animating';
            demoLoopCount = 0;
            startDemoAnimation();
        });
    }

    if (watchVideoBtn) {
        addInstantButtonHandler(watchVideoBtn, (e) => {
            openGifModal();
        });
    }

    const gifBtnYes = document.getElementById("gifBtnYes");
    if (gifBtnYes) {
        addInstantButtonHandler(gifBtnYes, (e) => {
            if (gifTimer) clearTimeout(gifTimer);
            if (gifModal) {
                gifModal.style.display = "none";
                gifModal.classList.remove("show");
            }
            window.isModalOpen = false;

            practiceStep = 'waiting_for_touch';
            if (startButton) {
                startButton.style.opacity = "1";
                startButton.style.pointerEvents = 'auto';
            }
            updateInstructions(true, 5);
        });
    }

    const gifBtnAgain = document.getElementById("gifBtnAgain");
    if (gifBtnAgain) {
        addInstantButtonHandler(gifBtnAgain, (e) => {
            openGifModal();
        });
    }
}

function updateInstructions(showTimeRemaining, secondsLeft) {
    const watchExampleBtn = document.getElementById("watchExampleBtn");
    const isDemoWaitingOrPlaying = (sessionNumber === 1 && (practiceStep === 'initial_demo_waiting' || practiceStep === 'initial_demo_animating' || practiceStep === 'detailed_demo' || practiceStep === 'try_button_shown'));
    
    if (watchExampleBtn) {
        watchExampleBtn.style.display = (sessionNumber === 1 && (practiceStep === 'initial_demo_waiting' || practiceStep === 'try_button_shown') && trialCount === 0) ? "inline-block" : "none";
    }

    if (timerLine) {
        timerLine.style.display = showTimeRemaining ? "block" : "none";
        if (showTimeRemaining && timerBadge) {
            timerBadge.innerText = (secondsLeft !== undefined) ? secondsLeft : (HOLD_DURATION / 1000);
        }
    }

    if (attemptsCounter) {
        const displayTrial = Math.min(trialCount + 1, TRIAL_LIMIT);
        if (displayTrial <= TRIAL_LIMIT && !taskCompleted && !isDemoWaitingOrPlaying) {
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

// Programmatic zoom and multi-touch prevention
document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
}, { passive: false });
document.addEventListener('gesturechange', function(e) {
    e.preventDefault();
}, { passive: false });
document.addEventListener('gestureend', function(e) {
    e.preventDefault();
}, { passive: false });
document.addEventListener('touchstart', function(e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });


function isPointInsideTargetWithTolerance(x, y, tolerance = 0) {
    if (!holdTarget) return false;
    const rect = holdTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2 + window.scrollX;
    const centerY = rect.top + rect.height / 2 + window.scrollY;
    const radius = rect.width / 2 + tolerance;
    
    const dx = x - centerX;
    const dy = y - centerY;
    return (dx * dx + dy * dy) <= (radius * radius);
}

async function handleDriftError() {
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

    const totalHoldTime = holdStartTime ? (Date.now() - holdStartTime) : 0;
    const akinetic = holdStartTime ? (holdStartTime - readyTime) : null;

    isHolding = false;
    trialActive = false;
    trialNumber++; // increment absolute counter, but NOT trialCount!

    if (holdTarget) {
        holdTarget.style.transform = "translateX(-50%) scale(1)";
        holdTarget.style.backgroundColor = "#CD4439";
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
        release_delay_ms: null,
        released_early: true,
        hold_target_duration_ms: HOLD_DURATION,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        device_pixel_ratio: window.devicePixelRatio,
        hold_events: holdEvents
    };

    try {
        await supabase.from("trial_results").insert(trialPayload);
    } catch (err) {
        console.error("Failed to save hold trial (drift):", err);
    }

    showHoldPracticeDriftModal();
}

function showHoldPracticeDriftModal() {
    if (sessionNumber === 1) {
        // In practice phase, count this as a practice error
        practiceErrorCount++;
        console.log(`[Hold] Practice error (drift) #${practiceErrorCount}`);
        if (practiceErrorCount >= MAX_PRACTICE_ERRORS) {
            endHoldPracticeEarly();
            return;
        }
    }

    if (document.getElementById("practiceDriftModal")) return;

    window.isModalOpen = true; // Lock modal interactions
    const modalDiv = document.createElement("div");
    modalDiv.id = "practiceDriftModal";
    modalDiv.style.position = "fixed";
    modalDiv.style.top = "0";
    modalDiv.style.left = "0";
    modalDiv.style.width = "100%";
    modalDiv.style.height = "100%";
    modalDiv.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
    modalDiv.style.backdropFilter = "blur(8px)";
    modalDiv.style.webkitBackdropFilter = "blur(8px)";
    modalDiv.style.display = "flex";
    modalDiv.style.justifyContent = "center";
    modalDiv.style.alignItems = "center";
    modalDiv.style.zIndex = "9999";

    const dismissModal = () => {
        modalDiv.remove();
        window.isModalOpen = false; // Release modal interactions lock
        resetTrial();
    };

    modalDiv.addEventListener("click", dismissModal);

    // Stop touch/pointer events from bubbling down to task elements underneath
    ["touchstart", "touchmove", "touchend", "mousedown", "mouseup"].forEach(evtName => {
        modalDiv.addEventListener(evtName, (e) => {
            e.stopPropagation();
        });
    });

    const contentDiv = document.createElement("div");
    contentDiv.style.backgroundColor = "white";
    contentDiv.style.padding = "40px clamp(24px, 5vw, 40px)";
    contentDiv.style.borderRadius = "24px";
    contentDiv.style.boxShadow = "0 20px 40px rgba(0,0,0,0.15)";
    contentDiv.style.maxWidth = "580px";
    contentDiv.style.width = "85%";
    contentDiv.style.textAlign = "center";
    contentDiv.style.fontFamily = "'Selawik', Arial, Helvetica, sans-serif";
    contentDiv.style.boxSizing = "border-box";

    const title = document.createElement("h3");
    title.innerText = "⚠️ Practice Tip";
    title.style.margin = "0 0 16px 0";
    title.style.color = "#ea580c";
    title.style.fontSize = "26px";
    title.style.fontWeight = "bold";

    const msg = document.createElement("p");
    msg.innerText = "Please try keeping your finger on the dot.";
    msg.style.margin = "0 0 28px 0";
    msg.style.fontSize = "22px";
    msg.style.lineHeight = "1.6";
    msg.style.color = "#4b5563";

    const btn = document.createElement("button");
    btn.innerText = "Okay";
    btn.style.backgroundColor = "#003366";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.padding = "16px 28px";
    btn.style.fontSize = "20px";
    btn.style.fontWeight = "bold";
    btn.style.borderRadius = "12px";
    btn.style.cursor = "pointer";
    btn.style.width = "100%";
    btn.style.boxSizing = "border-box";
    btn.style.boxShadow = "0 4px 12px rgba(0, 51, 102, 0.25)";
    btn.style.transition = "background-color 0.2s, transform 0.1s";

    btn.addEventListener("mouseenter", () => {
        btn.style.backgroundColor = "#002244";
    });
    btn.addEventListener("mouseleave", () => {
        btn.style.backgroundColor = "#003366";
    });
    btn.addEventListener("pointerdown", () => {
        btn.style.transform = "scale(0.97)";
    });
    btn.addEventListener("pointerup", () => {
        btn.style.transform = "scale(1)";
    });

    btn.addEventListener("click", dismissModal);

    contentDiv.appendChild(title);
    contentDiv.appendChild(msg);
    contentDiv.appendChild(btn);
    modalDiv.appendChild(contentDiv);
    document.body.appendChild(modalDiv);
}

function showHoldPracticeMissModal() {
    if (document.getElementById("practiceMissModal")) return;

    window.isModalOpen = true; // Lock modal interactions
    const modalDiv = document.createElement("div");
    modalDiv.id = "practiceMissModal";
    modalDiv.style.position = "fixed";
    modalDiv.style.top = "0";
    modalDiv.style.left = "0";
    modalDiv.style.width = "100%";
    modalDiv.style.height = "100%";
    modalDiv.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
    modalDiv.style.backdropFilter = "blur(8px)";
    modalDiv.style.webkitBackdropFilter = "blur(8px)";
    modalDiv.style.display = "flex";
    modalDiv.style.justifyContent = "center";
    modalDiv.style.alignItems = "center";
    modalDiv.style.zIndex = "9999";

    const dismissModal = () => {
        modalDiv.remove();
        window.isModalOpen = false; // Release modal interactions lock
        resetTrial();
    };

    modalDiv.addEventListener("click", dismissModal);

    // Stop touch/pointer events from bubbling down to task elements underneath
    ["touchstart", "touchmove", "touchend", "mousedown", "mouseup"].forEach(evtName => {
        modalDiv.addEventListener(evtName, (e) => {
            e.stopPropagation();
        });
    });

    const contentDiv = document.createElement("div");
    contentDiv.style.backgroundColor = "white";
    contentDiv.style.padding = "40px clamp(24px, 5vw, 40px)";
    contentDiv.style.borderRadius = "24px";
    contentDiv.style.boxShadow = "0 20px 40px rgba(0,0,0,0.15)";
    contentDiv.style.maxWidth = "580px";
    contentDiv.style.width = "85%";
    contentDiv.style.textAlign = "center";
    contentDiv.style.fontFamily = "'Selawik', Arial, Helvetica, sans-serif";
    contentDiv.style.boxSizing = "border-box";

    const title = document.createElement("h3");
    title.innerText = "⚠️ Practice Tip";
    title.style.margin = "0 0 16px 0";
    title.style.color = "#ea580c";
    title.style.fontSize = "26px";
    title.style.fontWeight = "bold";

    const msg = document.createElement("p");
    msg.innerText = "Please place and hold your index finger on the blue circle.";
    msg.style.margin = "0 0 28px 0";
    msg.style.fontSize = "22px";
    msg.style.lineHeight = "1.6";
    msg.style.color = "#4b5563";

    const btn = document.createElement("button");
    btn.innerText = "Okay";
    btn.style.backgroundColor = "#003366";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.padding = "16px 28px";
    btn.style.fontSize = "20px";
    btn.style.fontWeight = "bold";
    btn.style.borderRadius = "12px";
    btn.style.cursor = "pointer";
    btn.style.width = "100%";
    btn.style.boxSizing = "border-box";
    btn.style.boxShadow = "0 4px 12px rgba(0, 51, 102, 0.25)";
    btn.style.transition = "background-color 0.2s, transform 0.1s";

    btn.addEventListener("mouseenter", () => {
        btn.style.backgroundColor = "#002244";
    });
    btn.addEventListener("mouseleave", () => {
        btn.style.backgroundColor = "#003366";
    });
    btn.addEventListener("pointerdown", () => {
        btn.style.transform = "scale(0.97)";
    });
    btn.addEventListener("pointerup", () => {
        btn.style.transform = "scale(1)";
    });

    btn.addEventListener("click", dismissModal);

    contentDiv.appendChild(title);
    contentDiv.appendChild(msg);
    contentDiv.appendChild(btn);
    modalDiv.appendChild(contentDiv);
    document.body.appendChild(modalDiv);
}
