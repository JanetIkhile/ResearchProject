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
let isInterrupted = false;

const ORIGINAL_INSTRUCTION = "Place your thumb on the bottom circle and your index finger on the top circle. Open and close your fingers <strong class=\"highlight-instruction\">as widely</strong> and <strong class=\"highlight-instruction\">as quickly</strong> as possible.";

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
    
    const touches = e.touches;
    const now = Date.now();
    
    // Track initiation delay on first touch of the session/trial
    if (touches.length > 0 && !firstTouchTime && !taskActive) {
        firstTouchTime = now;
        const pageLoadTime = parseFloat(sessionStorage.getItem("pinch_page_load") || now);
        initiationDelay = now - pageLoadTime;
    }
    
    if (touches.length === 2) {
        // Prevent scrolling/scaling gestures
        e.preventDefault();
        
        // Clear any pending warning timer and restore normal text
        if (warningTimeout) {
            clearTimeout(warningTimeout);
            warningTimeout = null;
        }
        if (taskActive) {
            instructionEl.innerHTML = ORIGINAL_INSTRUCTION;
            instructionEl.style.display = "block";
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
                instructionEl.innerHTML = `<span style="color: #dc2626; font-weight: bold;">⚠️ Please place your fingers vertically!</span>`;
                instructionEl.style.display = "block";
                return;
            }
            
            // Check target containment to start the trial
            if (!savingTrial) {
                const oneInTop = isTouchInsideElement(indexTouch, topTarget) || isTouchInsideElement(thumbTouch, topTarget);
                const oneInBottom = isTouchInsideElement(indexTouch, bottomTarget) || isTouchInsideElement(thumbTouch, bottomTarget);
                
                if (oneInTop && oneInBottom) {
                    isInterrupted = false;
                    startPinchTrial(now);
                } else {
                    // Show a warning instruction if fingers are not placed inside the outlined guides
                    instructionEl.innerHTML = `<span style="color: #003366; font-weight: bold;">⚠️ Please place your thumb on the bottom circle and your index finger on the top circle to start!</span>`;
                    instructionEl.style.display = "block";
                }
            }
        } else {
            // During the active trial
            if (isInterrupted) {
                // Enforce placing fingers back inside baseline circles to resume trial
                const oneInTop = isTouchInsideElement(indexTouch, topTarget) || isTouchInsideElement(thumbTouch, topTarget);
                const oneInBottom = isTouchInsideElement(indexTouch, bottomTarget) || isTouchInsideElement(thumbTouch, bottomTarget);
                
                if (oneInTop && oneInBottom) {
                    isInterrupted = false; // Recovered!
                } else {
                    // Still out of bounds -> keep instruction warning and log interruption state
                    instructionEl.innerHTML = `<span style="color: #003366; font-weight: bold;">⚠️ Please place your thumb on the bottom circle and your index finger on the top circle to resume!</span>`;
                    instructionEl.style.display = "block";
                    
                    trajectory.push({
                        t: now - trialStartTime,
                        state: "2_touches_out_of_bounds",
                        x_index: x1,
                        y_index: y1,
                        x_thumb: x2,
                        y_thumb: y2,
                        distance: null // Keep distance null so post-hoc analysis counts it as interruption
                    });
                    return; // Exit early without moving targets or recording active frames
                }
            }
            
            // Restore normal instructions and draw the targets
            instructionEl.innerHTML = ORIGINAL_INSTRUCTION;
            instructionEl.style.display = "block";
            
            // Dynamically position target circles directly under the user's touch points
            topTarget.style.left = `${x1}px`;
            topTarget.style.top = `${y1}px`;
            topTarget.style.transform = "translate(-50%, -50%)";
            
            bottomTarget.style.left = `${x2}px`;
            bottomTarget.style.top = `${y2}px`;
            bottomTarget.style.transform = "translate(-50%, -50%)";
            
            // Record trajectory frame
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
        // Less than 2 touches -> hide tracking overlay
        liveDistanceLabel.style.display = "none";
        
        // Reset target guides back to their baseline vertical positions
        resetTargetPositions();
        
        if (taskActive) {
            isInterrupted = true; // Mark as interrupted when touches drop below 2
            // Determine the explicit cause of the touch interruption and identify remaining finger
            let frameState = "0_touch_lift_off";
            let x_idx = null, y_idx = null, x_th = null, y_th = null;
            
            if (touches.length === 1) {
                const remainingTouch = touches[0];
                if (remainingTouch.identifier === indexTouchId) {
                    frameState = "1_touch_partial_index_active"; // Thumb left first
                    x_idx = remainingTouch.clientX;
                    y_idx = remainingTouch.clientY;
                } else if (remainingTouch.identifier === thumbTouchId) {
                    frameState = "1_touch_partial_thumb_active"; // Index left first
                    x_th = remainingTouch.clientX;
                    y_th = remainingTouch.clientY;
                } else {
                    frameState = "1_touch_partial";
                }
            } else if (touches.length >= 3) {
                frameState = "3plus_invalid";
            }
            
            // 1. Log the touch loss frame to database (distance: null ensures gap analysis counts it)
            trajectory.push({
                t: now - trialStartTime,
                state: frameState,
                x_index: x_idx,
                y_index: y_idx,
                x_thumb: x_th,
                y_thumb: y_th,
                distance: null
            });
            
            // 2. Set a 150ms debounce timer for the on-screen warning alert to prevent flickering on touch merges
            if (!warningTimeout) {
                warningTimeout = setTimeout(() => {
                    instructionEl.innerHTML = `<span style="color: #dc2626; font-weight: bold;">⚠️ Please keep both fingers on the screen!</span>`;
                    instructionEl.style.display = "block";
                }, 150);
            }
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
