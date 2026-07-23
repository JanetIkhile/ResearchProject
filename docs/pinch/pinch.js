import { supabase } from "../client/supabaseClient.js";
import { initSession } from "../utils/sessionManager.js";

const TASK_TYPE = 'pinch';
let participantId = null;
let sessionId = null;
let sessionType = 'main';
let trialNumber = 0;
let TRIAL_LIMIT = 3;

let taskActive = false;
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

const ORIGINAL_INSTRUCTION = "Place your thumb on the bottom circle and your index finger on the top circle. Open your fingers <strong class=\"highlight-instruction\">as widely</strong> and <strong class=\"highlight-instruction\">as quickly</strong> as possible, then lift both fingers and repeat.";

// DOM Elements
const topTarget = document.getElementById("topTarget");
const bottomTarget = document.getElementById("bottomTarget");
const liveDistanceLabel = document.getElementById("liveDistanceLabel");
const instructionEl = document.getElementById("pinchInstruction");
const timerEl = document.getElementById("countdownTimer");
const completionBox = document.getElementById("completionBox");

// Standard CSS baseline PPI conversions
const PX_TO_MM = 25.4 / 96.0;

// Initialize Session
async function startSession() {
    try {
        const sessionData = await initSession({ dashboardPath: "../dashboard/dashboard.html" });
        participantId = sessionData.participantId;
        sessionId = sessionData.sessionId;
        sessionType = sessionStorage.getItem("session_type") || "main";
        TRIAL_LIMIT = (sessionType === 'practice') ? 1 : 3;
        
        console.log("Pinch task session active. Participant:", participantId, "Limit:", TRIAL_LIMIT);
        
        // Show session label badge
        const sessionNumber = sessionData.sessionNumber;
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
        
        // Align baseline instruction
        instructionEl.innerHTML = ORIGINAL_INSTRUCTION;
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
function handleTouch(e) {
    // If modal is open or task is completed, do nothing
    if (window.isModalOpen || (trialNumber >= TRIAL_LIMIT && !taskActive) || isBetweenTrials) {
        return;
    }
    
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
}

// Start Trial
function startPinchTrial(now) {
    taskActive = true;
    trialNumber += 1;
    trialStartTime = now;
    trajectory = [];
    timeRemaining = 10;
    requiresReset = false;
    lastIndexX = null;
    lastIndexY = null;
    lastThumbX = null;
    lastThumbY = null;
    
    // Keep instruction text visible, show countdown timer separately
    instructionEl.innerHTML = ORIGINAL_INSTRUCTION;
    instructionEl.style.display = "block";
    
    timerEl.innerHTML = `Time remaining: <span class="timer-badge">${timeRemaining}</span> seconds`;
    timerEl.style.display = "block";
    
    // Countdown Timer
    countdownTimer = setInterval(() => {
        timeRemaining -= 1;
        if (timeRemaining <= 0) {
            stopPinchTrial();
        } else {
            timerEl.innerHTML = `Time remaining: <span class="timer-badge">${timeRemaining}</span> seconds`;
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
    timerEl.style.display = "none";
    
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
            timerEl.innerHTML = `Time remaining: <span class="timer-badge">10</span> seconds`;
            timerEl.style.display = "block";
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
    
    // Visual completes
    topTarget.style.display = "none";
    bottomTarget.style.display = "none";
    liveDistanceLabel.style.display = "none";
    instructionEl.style.display = "none";
    
    completionBox.style.display = "flex";
}

// Page load initialization
sessionStorage.setItem("pinch_page_load", String(Date.now()));
startSession();
