import { supabase } from "../client/supabaseClient.js";
import { initSession } from "../utils/sessionManager.js";

const TASK_TYPE = 'pinch';
let participantId = null;
let sessionId = null;
let sessionType = 'main';
let trialNumber = 0;
let TRIAL_LIMIT = 3;

let taskActive = false;
let taskCompleted = false;
let savingTrial = false;
let trialStartTime = null;
let countdownTimer = null;
let timeRemaining = 10; // 10 seconds

let trajectory = []; // list of { t, x_index, y_index, x_thumb, y_thumb, distance }
let initiationDelay = null;
let firstTouchTime = null;
let isBetweenTrials = false;
let warningTimeout = null;
let indexTouchId = null;
let thumbTouchId = null;
let requiresReset = false;
let lastIndexX = null;
let lastIndexY = null;
let lastThumbX = null;
let lastThumbY = null;
let maxStrokeDistance = 0;

// Progressive Disclosure state variables
let demoLoopCount = 0;
let isFingerDemoAnimating = false;
let demoCountdownInterval = null;
let demoPinchInterval = null;
let demoTrialNumber = 1;
let demoTimeouts = [];
let baselineTopCenterX = null;
let baselineTopCenterY = null;
let baselineBottomCenterX = null;
let baselineBottomCenterY = null;
let inactivityTimer = null;
let gifTimer = null;
let continueInactivityTimer = null;
let practiceStep = 'initial_demo'; // initial_demo -> try_button_shown -> waiting_for_touch -> help_banner_shown -> detailed_demo -> gif_ready_prompt -> active_practice

const ORIGINAL_INSTRUCTION = "Place your index finger and thumb on the guide circles.<br>Open them <strong class=\"highlight-instruction\">as widely</strong> and <strong class=\"highlight-instruction\">as quickly</strong> as possible!";

// DOM Elements
const topTarget = document.getElementById("topTarget");
const bottomTarget = document.getElementById("bottomTarget");
const liveDistanceLabel = document.getElementById("liveDistanceLabel");
const instructionEl = document.getElementById("pinchInstruction");
let timerLine = null;
let timerBadge = null;
let attemptsCounter = null;
const completionBox = document.getElementById("completionBox");

// Standard CSS baseline PPI conversions
const PX_TO_MM = 25.4 / 96.0;

// Initialize Session
async function startSession() {
    try {
        const sessionData = await initSession({ dashboardPath: "../dashboard/dashboard.html" });
        sessionNumber = sessionData.sessionNumber;
        participantId = sessionData.participantId;
        sessionId = sessionData.sessionId;
        sessionType = sessionStorage.getItem("session_type") || "main";

        if (sessionNumber === 1) {
            TRIAL_LIMIT = 2;   // 2 practice trials
        } else {
            TRIAL_LIMIT = 3;   // 3 real trials
        }

        console.log("Pinch task session active. Participant:", participantId, "Limit:", TRIAL_LIMIT);

        timerLine = document.getElementById("timerLine");
        timerBadge = document.getElementById("timerBadge");
        attemptsCounter = document.getElementById("attemptsCounter");

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

        // Listen to touches
        document.addEventListener("touchstart", handleTouch, { passive: false });
        document.addEventListener("touchmove", handleTouch, { passive: false });
        document.addEventListener("touchend", handleTouch, { passive: false });
        document.addEventListener("touchcancel", handleTouch, { passive: false });

        if (sessionNumber === 1) {
            updateInstructions(false);
            const indicator = document.getElementById("watchExampleIndicator");
            if (indicator) indicator.style.display = "inline-block";
            setupProgressiveDisclosure();
        } else {
            updateInstructions(true);
        }
        scheduleDemoAnimation(500);
    } catch (err) {
        console.error("Session initialization failed:", err);
    }
}

// Check touch containment inside targets
function isTouchInsideElement(touch, element) {
    const rect = element.getBoundingClientRect();
    return (
        touch.clientX >= rect.left &&
        touch.clientX <= rect.right &&
        touch.clientY >= rect.top &&
        touch.clientY <= rect.bottom
    );
}

// Helper to reset circles back to their baseline CSS positions
function resetTargetPositions() {
    maxStrokeDistance = 0;
    topTarget.style.left = "";
    topTarget.style.top = "";
    topTarget.style.transform = "";

    bottomTarget.style.left = "";
    bottomTarget.style.top = "";
    bottomTarget.style.transform = "";
}

// Multi-Touch Handler

// ---------------- DEMO ANIMATION FOR PINCH TASK ----------------
let sessionNumber = null;
let demoInterval = null;
let demoTimeout = null;
let demoPointer1 = null;
let demoPointer2 = null;

function scheduleDemoAnimation(delay = 1000) {
    clearDemoTimeout();
    if (sessionNumber === 1 && trialNumber === 0 && !taskActive) {
        demoTimeout = setTimeout(startDemoAnimation, delay);
    }
}

function clearDemoTimeout() {
    if (demoTimeout) {
        clearTimeout(demoTimeout);
        demoTimeout = null;
    }
}

function runDemoTrialCycle() {
    if (trialNumber > 0 || taskActive || taskCompleted) {
        stopDemoAnimation();
        return;
    }

    if (demoTrialNumber > 2) {
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
        ['taskHeader', 'pinchArea'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add("dimmed");
        });
        return;
    }

    // Start a 5-second trial simulation (internally)
    let remainingTime = 5;

    // Show demo pointers
    if (demoPointer1) demoPointer1.style.opacity = "1";
    if (demoPointer2) demoPointer2.style.opacity = "1";

    function doPinchAnimationCycle() {
        if (trialNumber > 0 || taskActive || taskCompleted || !demoPointer1 || !demoPointer2) return;

        // Reset pointers & targets to initial center positions
        demoPointer1.style.transition = "none";
        demoPointer1.style.left = `${baselineTopCenterX - 30}px`;
        demoPointer1.style.top = `${baselineTopCenterY}px`;
        demoPointer1.style.opacity = "1";

        demoPointer2.style.transition = "none";
        demoPointer2.style.left = `${baselineBottomCenterX - 30}px`;
        demoPointer2.style.top = `${baselineBottomCenterY - 54}px`;
        demoPointer2.style.opacity = "1";

        topTarget.style.transition = "none";
        topTarget.style.left = `${baselineTopCenterX}px`;
        topTarget.style.top = `${baselineTopCenterY}px`;
        topTarget.style.transform = "translate(-50%, -50%)";

        bottomTarget.style.transition = "none";
        bottomTarget.style.left = `${baselineBottomCenterX}px`;
        bottomTarget.style.top = `${baselineBottomCenterY}px`;
        bottomTarget.style.transform = "translate(-50%, -50%)";

        // Move apart (spread fingers and guide targets together in lockstep)
        demoTimeouts.push(setTimeout(() => {
            if (trialNumber > 0 || taskActive || taskCompleted || !demoPointer1 || !demoPointer2) return;
            demoPointer1.style.transition = "top 0.6s ease-out";
            demoPointer1.style.top = `${baselineTopCenterY - 120}px`;

            topTarget.style.transition = "top 0.6s ease-out";
            topTarget.style.top = `${baselineTopCenterY - 120}px`;

            demoPointer2.style.transition = "top 0.6s ease-out";
            demoPointer2.style.top = `${baselineBottomCenterY + 120 - 54}px`;

            bottomTarget.style.transition = "top 0.6s ease-out";
            bottomTarget.style.top = `${baselineBottomCenterY + 120}px`;
        }, 200));

        // Fade out pointers
        demoTimeouts.push(setTimeout(() => {
            if (trialNumber > 0 || taskActive || taskCompleted || !demoPointer1 || !demoPointer2) return;
            demoPointer1.style.transition = "opacity 0.2s ease-out";
            demoPointer1.style.opacity = "0";
            demoPointer2.style.transition = "opacity 0.2s ease-out";
            demoPointer2.style.opacity = "0";
        }, 850));

        // Smoothly return target circles together back to center
        demoTimeouts.push(setTimeout(() => {
            if (trialNumber > 0 || taskActive || taskCompleted) return;
            topTarget.style.transition = "top 0.3s ease-in-out";
            topTarget.style.top = `${baselineTopCenterY}px`;

            bottomTarget.style.transition = "top 0.3s ease-in-out";
            bottomTarget.style.top = `${baselineBottomCenterY}px`;
        }, 1100));
    }

    doPinchAnimationCycle();
    demoPinchInterval = setInterval(doPinchAnimationCycle, 1500);

    // Countdown interval (every 1 second)
    demoCountdownInterval = setInterval(() => {
        remainingTime -= 1;
        if (remainingTime <= 0) {
            // End of this 5-second demo trial
            clearInterval(demoCountdownInterval);
            clearInterval(demoPinchInterval);
            demoTimeouts.forEach(t => clearTimeout(t));
            demoTimeouts = [];

            if (demoPointer1) demoPointer1.style.opacity = "0";
            if (demoPointer2) demoPointer2.style.opacity = "0";

            // Restore target circles back to baseline CSS instantly during Stop pinching break
            resetTargetPositions();

            // Briefly show "Stop pinching" just like a real trial end!
            const pinchInstruction = document.getElementById("pinchInstruction");
            const originalInstructionText = pinchInstruction ? pinchInstruction.innerHTML : "";
            if (pinchInstruction) pinchInstruction.innerText = "Stop pinching";

            setTimeout(() => {
                if (pinchInstruction && originalInstructionText) {
                    pinchInstruction.innerHTML = originalInstructionText;
                }
                demoTrialNumber += 1;
                runDemoTrialCycle();
            }, 1200); // 1.2 seconds cooldown
        }
    }, 1000);
}

function startDemoAnimation() {
    if (sessionNumber !== 1) return; // Only practice phase
    if (trialNumber > 0 || taskActive) return;
    isFingerDemoAnimating = true;

    resetTargetPositions();
    const tRect = topTarget.getBoundingClientRect();
    const bRect = bottomTarget.getBoundingClientRect();
    baselineTopCenterX = tRect.left + tRect.width / 2;
    baselineTopCenterY = tRect.top + tRect.height / 2;
    baselineBottomCenterX = bRect.left + bRect.width / 2;
    baselineBottomCenterY = bRect.top + bRect.height / 2;

    if (!demoPointer1) {
        demoPointer1 = document.createElement("div");
        demoPointer1.id = "demoPointer1";
        demoPointer1.style.position = "absolute";
        demoPointer1.style.width = "60px";
        demoPointer1.style.height = "60px";
        demoPointer1.style.fontSize = "54px";
        demoPointer1.style.textAlign = "center";
        demoPointer1.style.lineHeight = "60px";
        demoPointer1.style.zIndex = "1000";
        demoPointer1.style.pointerEvents = "none";
        demoPointer1.style.opacity = "0";
        demoPointer1.innerText = "👆";
        demoPointer1.style.left = `${baselineTopCenterX - 30}px`;
        demoPointer1.style.top = `${baselineTopCenterY}px`;
        document.body.appendChild(demoPointer1);
    } else {
        demoPointer1.style.left = `${baselineTopCenterX - 30}px`;
        demoPointer1.style.top = `${baselineTopCenterY}px`;
    }

    if (!demoPointer2) {
        demoPointer2 = document.createElement("div");
        demoPointer2.id = "demoPointer2";
        demoPointer2.style.position = "absolute";
        demoPointer2.style.width = "60px";
        demoPointer2.style.height = "60px";
        demoPointer2.style.fontSize = "54px";
        demoPointer2.style.textAlign = "center";
        demoPointer2.style.lineHeight = "60px";
        demoPointer2.style.zIndex = "1000";
        demoPointer2.style.pointerEvents = "none";
        demoPointer2.style.opacity = "0";
        demoPointer2.innerText = "👇";
        demoPointer2.style.left = `${baselineBottomCenterX - 30}px`;
        demoPointer2.style.top = `${baselineBottomCenterY - 54}px`;
        document.body.appendChild(demoPointer2);
    } else {
        demoPointer2.style.left = `${baselineBottomCenterX - 30}px`;
        demoPointer2.style.top = `${baselineBottomCenterY - 54}px`;
    }

    demoTrialNumber = 1;
    runDemoTrialCycle();
}

function stopDemoAnimation() {
    isFingerDemoAnimating = false;
    clearDemoTimeout();
    if (demoCountdownInterval) {
        clearInterval(demoCountdownInterval);
        demoCountdownInterval = null;
    }
    if (demoPinchInterval) {
        clearInterval(demoPinchInterval);
        demoPinchInterval = null;
    }
    demoTimeouts.forEach(t => clearTimeout(t));
    demoTimeouts = [];
    if (demoPointer1) {
        demoPointer1.remove();
        demoPointer1 = null;
    }
    if (demoPointer2) {
        demoPointer2.remove();
        demoPointer2 = null;
    }
    resetTargetPositions(); // Instantly restore target circles to baseline CSS
}

function handleTouch(e) {
    // In practice phase (trial 0): block screen and target pinch touches during demo animation or until "Start Practice" is clicked
    if (sessionNumber === 1 && trialNumber === 0) {
        if (practiceStep === 'options_shown') {
            const optionsOverlay = document.getElementById("practiceOptionsOverlay");
            const optionsContainer = document.getElementById("practiceOptionsContainer");
            if (optionsOverlay && optionsContainer && !optionsContainer.contains(e.target)) {
                resumeDemoAnimationFromOptions();
                return;
            }
        }
        if (isFingerDemoAnimating || (practiceStep !== 'waiting_for_touch' && practiceStep !== 'active_practice')) {
            return; // Ignore all touches on screen and targets while demo is running or options are shown
        }
    }

    if (e.target.id === "tryItButton" || e.target.id === "watchVideoBtn" || e.target.id === "watchExampleBtn" || e.target.id === "gifBtnYes" || e.target.id === "gifBtnAgain" || e.target.id === "nextTaskButton" || e.target.closest("#gifModal") || e.target.closest("#helpBanner") || e.target.closest("#completionBox") || e.target.closest("#practiceOptionsContainer")) {
        return;
    }

    // If modal is open or task is completed, do nothing
    if (window.isModalOpen || (trialNumber >= TRIAL_LIMIT && !taskActive) || isBetweenTrials) {
        e.preventDefault();
        return;
    }

    if (sessionNumber === 1 && trialNumber === 0) {
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
                if (inactivityTimer) clearTimeout(inactivityTimer);
                inactivityTimer = setTimeout(() => {
                    if (practiceStep === 'waiting_for_touch') {
                        practiceStep = 'help_banner_shown';
                        const helpBanner = document.getElementById("helpBanner");
                        if (helpBanner) helpBanner.style.display = "flex";
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
                if (inactivityTimer) clearTimeout(inactivityTimer);
                inactivityTimer = setTimeout(() => {
                    if (practiceStep === 'waiting_for_touch') {
                        practiceStep = 'help_banner_shown';
                        if (helpBanner) helpBanner.style.display = "flex";
                    }
                }, 7000);

                e.preventDefault();
                return;
            }
        }
    }

    // Enforce stopping demo only on actual active trial start or main session
    stopDemoAnimation();
    clearDemoTimeout();

    // Prevent any native browser scrolling, panning, or gestures immediately
    e.preventDefault();

    const touches = e.touches;
    const now = Date.now();

    // Track initiation delay on first touch of the session/trial
    if (touches.length > 0 && !firstTouchTime && !taskActive) {
        firstTouchTime = now;
        const pageLoadTime = parseFloat(sessionStorage.getItem("pinch_page_load") || now);
        initiationDelay = now - pageLoadTime;
    }

    if (touches.length === 2) {
        // Clear any pending warning timer and restore normal text
        if (warningTimeout) {
            clearTimeout(warningTimeout);
            warningTimeout = null;
        }

        // Distinguish between Index (higher up, lower Y) and Thumb (lower down, higher Y)
        let t1 = touches[0];
        let t2 = touches[1];
        let indexTouch = (t1.clientY < t2.clientY) ? t1 : t2;
        let thumbTouch = (t1.clientY < t2.clientY) ? t2 : t1;

        // Store touch identifiers to distinguish partial lift-offs
        indexTouchId = indexTouch.identifier;
        thumbTouchId = thumbTouch.identifier;

        const x1 = indexTouch.clientX;
        const y1 = indexTouch.clientY;
        const x2 = thumbTouch.clientX;
        const y2 = thumbTouch.clientY;

        const dx = x1 - x2;
        const dy = y1 - y2;
        const distPx = Math.sqrt(dx * dx + dy * dy);

        if (!taskActive) {
            // Before the trial starts, enforce vertical layout check
            const isVertical = Math.abs(dy) > Math.abs(dx);
            if (!isVertical) {
                instructionEl.innerHTML = `<span style="color: #003366; font-weight: bold;">⚠️ Please place your fingers vertically!</span>`;
                instructionEl.style.display = "block";
                return;
            }

            // Check target containment to start the trial
            if (!savingTrial) {
                const oneInTop = isTouchInsideElement(indexTouch, topTarget) || isTouchInsideElement(thumbTouch, topTarget);
                const oneInBottom = isTouchInsideElement(indexTouch, bottomTarget) || isTouchInsideElement(thumbTouch, bottomTarget);

                if (oneInTop && oneInBottom) {
                    if (sessionNumber === 1 && trialNumber === 0) {
                        practiceStep = 'active_practice';
                        if (inactivityTimer) clearTimeout(inactivityTimer);
                    }
                    requiresReset = false;
                    maxStrokeDistance = distPx;
                    startPinchTrial(now);
                } else {
                    instructionEl.innerHTML = `<span style="color: #003366; font-weight: bold;">⚠️ Please place your thumb on the bottom circle and your index finger on the top circle to start!</span>`;
                    instructionEl.style.display = "block";
                }
            }
        } else {
            // During the active trial
            if (requiresReset) {
                // Enforce placing fingers back inside baseline circles to resume trial (from 0 touches)
                const oneInTop = isTouchInsideElement(indexTouch, topTarget) || isTouchInsideElement(thumbTouch, topTarget);
                const oneInBottom = isTouchInsideElement(indexTouch, bottomTarget) || isTouchInsideElement(thumbTouch, bottomTarget);

                if (oneInTop && oneInBottom) {
                    requiresReset = false; // Recovered!
                    maxStrokeDistance = distPx; // Initialize max distance for this new stroke!
                } else {
                    instructionEl.innerHTML = `<span style="color: #003366; font-weight: bold;">⚠️ Please place your fingers inside the two guide circles to start the next stroke!</span>`;
                    instructionEl.style.display = "block";

                    trajectory.push({
                        t: now - trialStartTime,
                        state: "2_touches_out_of_bounds",
                        x_index: x1,
                        y_index: y1,
                        x_thumb: x2,
                        y_thumb: y2,
                        distance: distPx
                    });
                    return; // Exit early without moving targets or recording active frames
                }
            }

            // Check if this is the start of a stroke (maxStrokeDistance is 0 or uninitialized)
            if (maxStrokeDistance === 0) {
                maxStrokeDistance = distPx;
            }

            // Lock circles to monotonically non-decreasing distance during active pinching
            if (distPx >= maxStrokeDistance) {
                maxStrokeDistance = distPx;

                // Dynamically position target circles directly under the user's touch points
                topTarget.style.left = `${x1}px`;
                topTarget.style.top = `${y1}px`;
                topTarget.style.transform = "translate(-50%, -50%)";

                bottomTarget.style.left = `${x2}px`;
                bottomTarget.style.top = `${y2}px`;
                bottomTarget.style.transform = "translate(-50%, -50%)";

                // Cache coordinates as last known positions
                lastIndexX = x1;
                lastIndexY = y1;
                lastThumbX = x2;
                lastThumbY = y2;
            }

            // Restore normal instructions and draw the targets
            instructionEl.innerHTML = ORIGINAL_INSTRUCTION;
            instructionEl.style.display = "block";

            // Record trajectory frame (always logs actual touch coordinates and actual distance)
            trajectory.push({
                t: now - trialStartTime,
                state: "2_touches_active",
                x_index: x1,
                y_index: y1,
                x_thumb: x2,
                y_thumb: y2,
                distance: distPx
            });
        }

    } else {
        // Less than 2 touches -> hide live distance overlay
        liveDistanceLabel.style.display = "none";

        if (taskActive) {
            if (touches.length === 1) {
                if (requiresReset) {
                    // If we previously dropped to 0 touches, they must place BOTH fingers back on circles to recover
                    trajectory.push({
                        t: now - trialStartTime,
                        state: "1_touch_partial_reset",
                        x_index: null,
                        y_index: null,
                        x_thumb: null,
                        y_thumb: null,
                        distance: null
                    });

                    instructionEl.innerHTML = ORIGINAL_INSTRUCTION;
                    instructionEl.style.display = "block";
                } else {
                    // This is a pause/resume state (1 finger remains). Keep last known position of the missing finger!
                    const remainingTouch = touches[0];
                    let frameState = "1_touch_paused";
                    let x_idx = null, y_idx = null, x_th = null, y_th = null;

                    if (remainingTouch.identifier === indexTouchId) {
                        frameState = "1_touch_paused_thumb_lifted"; // Index remains active, Thumb uses last known position
                        x_idx = remainingTouch.clientX;
                        y_idx = remainingTouch.clientY;
                        x_th = lastThumbX;
                        y_th = lastThumbY;
                    } else if (remainingTouch.identifier === thumbTouchId) {
                        frameState = "1_touch_paused_index_lifted"; // Thumb remains active, Index uses last known position
                        x_idx = lastIndexX;
                        y_idx = lastIndexY;
                        x_th = remainingTouch.clientX;
                        y_th = remainingTouch.clientY;
                    } else {
                        // Fallback if identifiers don't match (e.g. touch mismatch)
                        x_idx = remainingTouch.clientX;
                        y_idx = remainingTouch.clientY;
                        x_th = lastThumbX;
                        y_th = lastThumbY;
                    }

                    // Calculate distance using active finger and last known position of missing finger
                    let currentDist = null;
                    if (x_idx !== null && x_th !== null) {
                        const dx = x_idx - x_th;
                        const dy = y_idx - y_th;
                        currentDist = Math.sqrt(dx * dx + dy * dy);
                    }

                    // Log the frame
                    trajectory.push({
                        t: now - trialStartTime,
                        state: frameState,
                        x_index: x_idx,
                        y_index: y_idx,
                        x_thumb: x_th,
                        y_thumb: y_th,
                        distance: currentDist
                    });

                    // Update visual feedback: position active circle under finger, lock missing circle stationary
                    if (remainingTouch.identifier === indexTouchId) {
                        topTarget.style.left = `${x_idx}px`;
                        topTarget.style.top = `${y_idx}px`;
                        topTarget.style.transform = "translate(-50%, -50%)";

                        if (lastThumbX !== null) {
                            bottomTarget.style.left = `${lastThumbX}px`;
                            bottomTarget.style.top = `${lastThumbY}px`;
                            bottomTarget.style.transform = "translate(-50%, -50%)";
                        }
                    } else {
                        bottomTarget.style.left = `${x_th}px`;
                        bottomTarget.style.top = `${y_th}px`;
                        bottomTarget.style.transform = "translate(-50%, -50%)";

                        if (lastIndexX !== null) {
                            topTarget.style.left = `${lastIndexX}px`;
                            topTarget.style.top = `${lastIndexY}px`;
                            topTarget.style.transform = "translate(-50%, -50%)";
                        }
                    }

                    // Show pause warning with debounce
                    if (!warningTimeout) {
                        warningTimeout = setTimeout(() => {
                            instructionEl.innerHTML = `<span style="color: #003366; font-weight: bold;">⚠️ Pinch paused. Place your second finger back on screen to resume.</span>`;
                            instructionEl.style.display = "block";
                        }, 150);
                    }
                }
            } else {
                // 0 touches or 3+ invalid touches -> enters reset state
                requiresReset = true;
                resetTargetPositions();

                // Clear warning timeout if touches are 0
                if (warningTimeout) {
                    clearTimeout(warningTimeout);
                    warningTimeout = null;
                }

                let frameState = "0_touch_reset";
                if (touches.length >= 3) {
                    frameState = "3plus_invalid_reset";
                }

                trajectory.push({
                    t: now - trialStartTime,
                    state: frameState,
                    x_index: null,
                    y_index: null,
                    x_thumb: null,
                    y_thumb: null,
                    distance: null
                });

                instructionEl.innerHTML = ORIGINAL_INSTRUCTION;
                instructionEl.style.display = "block";
            }
        } else {
            // If trial not active, just reset circles
            resetTargetPositions();
        }
    }

    if (touches.length === 0 && !taskActive && trialNumber === 0) {
        scheduleDemoAnimation(1000);
    }
}

function updateInstructions(showTimeRemaining, secondsLeft = 10) {
    const indicator = document.getElementById("watchExampleIndicator");
    if (indicator) {
        indicator.style.display = (sessionNumber === 1 && !showTimeRemaining && trialNumber === 0) ? "inline-block" : "none";
    }
    if (timerLine) {
        timerLine.style.display = showTimeRemaining ? "block" : "none";
        if (showTimeRemaining && timerBadge) {
            timerBadge.innerText = secondsLeft;
        }
    }
    if (attemptsCounter) {
        const isDemoPlaying = (sessionNumber === 1 && trialNumber === 0);
        const displayTrial = taskActive ? trialNumber : Math.min(trialNumber + 1, TRIAL_LIMIT);
        if (displayTrial <= TRIAL_LIMIT && !taskCompleted && !isDemoPlaying) {
            attemptsCounter.style.display = "block";
            attemptsCounter.innerText = `${displayTrial} of ${TRIAL_LIMIT}`;
        } else {
            attemptsCounter.style.display = "none";
        }
    }
}

function resumeDemoAnimationFromOptions() {
    const optionsOverlay = document.getElementById("practiceOptionsOverlay");
    if (optionsOverlay) optionsOverlay.style.display = "none";
    const optionsContainer = document.getElementById("practiceOptionsContainer");
    if (optionsContainer) optionsContainer.style.display = "none";

    // Un-dim background elements
    ['taskHeader', 'pinchArea'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove("dimmed");
    });

    const indicator = document.getElementById("watchExampleIndicator");
    if (indicator) indicator.style.display = "inline-block";

    practiceStep = 'initial_demo';
    demoTrialNumber = 1;
    scheduleDemoAnimation(300);
}

function setupProgressiveDisclosure() {
    const tryItButton = document.getElementById("tryItButton");
    const watchVideoBtn = document.getElementById("watchVideoBtn");
    const helpBanner = document.getElementById("helpBanner");
    const watchExampleBtn = document.getElementById("watchExampleBtn");
    const gifModal = document.getElementById("gifModal");
    const gifBtnYes = document.getElementById("gifBtnYes");
    const gifBtnAgain = document.getElementById("gifBtnAgain");
    const gifPromptTitle = document.getElementById("gifPromptTitle");
    const gifBtnGroup = document.getElementById("gifBtnGroup");
    const gifDemoImage = document.getElementById("gifDemoImage");
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
        ['taskHeader', 'pinchArea'].forEach(id => {
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
            ['taskHeader', 'pinchArea'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.remove("dimmed");
            });

            practiceStep = 'waiting_for_touch';
        });
    }

    if (watchVideoBtn) {
        watchVideoBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            openGifModal();
        });
    }

    if (helpBanner) {
        helpBanner.addEventListener("click", (e) => {
            e.stopPropagation();
            openGifModal();
        });
    }

    if (watchExampleBtn) {
        watchExampleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            openGifModal();
        });
    }

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
        });
    }

    if (gifBtnAgain) {
        gifBtnAgain.addEventListener("click", (e) => {
            e.stopPropagation();
            openGifModal();
        });
    }
}

// Start Trial
function startPinchTrial(now) {
    taskActive = true;
    trialNumber += 1;
    trialStartTime = now;
    trajectory = [];
    timeRemaining = (sessionNumber === 1) ? 5 : 10;
    requiresReset = false;
    lastIndexX = null;
    lastIndexY = null;
    lastThumbX = null;
    lastThumbY = null;

    // Explicitly hide overlays
    const tryItButton = document.getElementById("tryItButton");
    if (tryItButton) tryItButton.style.display = "none";
    const helpBanner = document.getElementById("helpBanner");
    if (helpBanner) helpBanner.style.display = "none";

    updateInstructions(true, timeRemaining);

    // Countdown Timer
    countdownTimer = setInterval(() => {
        timeRemaining -= 1;
        if (timeRemaining <= 0) {
            stopPinchTrial();
        } else {
            updateInstructions(true, timeRemaining);
        }
    }, 1000);

    console.log(`Pinch trial ${trialNumber} started.`);
}

// Stop Trial
async function stopPinchTrial() {
    taskActive = false;
    clearInterval(countdownTimer);

    // Clear any pending warning timeouts immediately
    if (warningTimeout) {
        clearTimeout(warningTimeout);
        warningTimeout = null;
    }

    // Hide tracking overlays immediately
    liveDistanceLabel.style.display = "none";

    // Reset guide target positions back to baseline
    resetTargetPositions();

    // Synchronously update screen to disabled transition state at start of stopPinchTrial
    isBetweenTrials = true;
    instructionEl.textContent = "Stop pinching";
    instructionEl.style.display = "block";
    if (timerLine) timerLine.style.display = "none";
    if (attemptsCounter) attemptsCounter.style.display = "none";

    console.log(`Pinch trial ${trialNumber} ended. Recorded frames:`, trajectory.length);

    // Save to database asynchronously
    savingTrial = true;
    const savePromise = savePinchTrial(trialStartTime, Date.now()).then(() => {
        savingTrial = false;
    });

    // 2 seconds transition/cooldown
    setTimeout(async () => {
        // Wait for save operation to finish before advancing, if it takes longer than 2 seconds
        await savePromise;

        if (trialNumber >= TRIAL_LIMIT) {
            endPinchTask();
        } else {
            isBetweenTrials = false;
            instructionEl.innerHTML = ORIGINAL_INSTRUCTION;
            updateInstructions(false);
            firstTouchTime = null;
            sessionStorage.setItem("pinch_page_load", String(Date.now()));
        }
    }, 2000);
}

// Save to Supabase
async function savePinchTrial(startTime, endTime) {
    const payload = {
        participant_id: participantId,
        session_id: sessionId,
        task_type: TASK_TYPE,
        trial_number: trialNumber,
        timestamp: new Date().toISOString(),

        total_taps: 0, // Placeholder
        total_tap_time_ms: endTime - startTime,
        initiation_delay: initiationDelay || 0,

        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        device_pixel_ratio: window.devicePixelRatio,

        target_x: 0,
        target_y: 0,
        target_radius: 0,

        taps: [], // No discrete taps recorded
        trajectory: trajectory
    };

    try {
        const { error } = await supabase.from("trial_results").insert(payload);
        if (error) throw error;
        console.log(`Pinch trial ${trialNumber} saved successfully to Supabase.`);
    } catch (err) {
        console.error("Error saving pinch trial:", err);
        alert("Could not connect to database. Trial saved locally only.");
    }
}

// End Task
function endPinchTask() {
    taskCompleted = true;
    // Save state
    sessionStorage.setItem("pinch_completed", "true");

    // Remove listeners
    document.removeEventListener("touchstart", handleTouch);
    document.removeEventListener("touchmove", handleTouch);
    document.removeEventListener("touchend", handleTouch);
    document.removeEventListener("touchcancel", handleTouch);

    // Clear any pending warning timeouts immediately
    if (warningTimeout) {
        clearTimeout(warningTimeout);
        warningTimeout = null;
    }

    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (gifTimer) clearTimeout(gifTimer);

    // Dim background elements strictly to opacity 0.05
    const taskHeader = document.getElementById("taskHeader");
    if (taskHeader) taskHeader.classList.add("dimmed");
    const pinchArea = document.getElementById("pinchArea");
    if (pinchArea) pinchArea.classList.add("dimmed");

    topTarget.style.display = "none";
    bottomTarget.style.display = "none";
    liveDistanceLabel.style.display = "none";
    instructionEl.style.display = "none";

    completionBox.style.display = "flex";

    // Setup inactivity continue pointer after 5 seconds of inactivity on completion box
    if (sessionNumber === 1) {
        continueInactivityTimer = setTimeout(() => {
            const nextButton = document.getElementById("nextTaskButton");
            if (nextButton && completionBox.style.display === "flex") {
                const pointer = document.createElement("div");
                pointer.id = "continuePointer";
                pointer.innerText = "👆";
                pointer.style.position = "absolute";
                pointer.style.fontSize = "54px";
                pointer.style.zIndex = "3000";
                pointer.style.pointerEvents = "none";
                pointer.classList.add("continue-pointer-animate");

                const rect = nextButton.getBoundingClientRect();
                pointer.style.left = `${rect.left + rect.width / 2 - 27}px`;
                pointer.style.top = `${rect.bottom + 15}px`;
                document.body.appendChild(pointer);
            }
        }, 5000);
    }
}

// Page load initialization
sessionStorage.setItem("pinch_page_load", String(Date.now()));
startSession();
