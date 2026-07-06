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

// DOM Elements
const topTarget = document.getElementById("topTarget");
const bottomTarget = document.getElementById("bottomTarget");
const fingerLine = document.getElementById("fingerLine");
const liveDistanceLabel = document.getElementById("liveDistanceLabel");
const timerEl = document.getElementById("countdownTimer");
const instructionEl = document.getElementById("pinchInstruction");
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

// Multi-Touch Handler
function handleTouch(e) {
    // If modal is open or task is completed, do nothing
    if (window.isModalOpen || (trialNumber >= TRIAL_LIMIT && !taskActive)) {
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
        e.preventDefault(); // Prevent scrolling/scaling gestures
        
        // Distinguish between Index (higher up, lower Y) and Thumb (lower down, higher Y)
        let t1 = touches[0];
        let t2 = touches[1];
        let indexTouch = (t1.clientY < t2.clientY) ? t1 : t2;
        let thumbTouch = (t1.clientY < t2.clientY) ? t2 : t1;
        
        const x1 = indexTouch.clientX;
        const y1 = indexTouch.clientY;
        const x2 = thumbTouch.clientX;
        const y2 = thumbTouch.clientY;
        
        // Visual connection line
        fingerLine.setAttribute("x1", x1);
        fingerLine.setAttribute("y1", y1);
        fingerLine.setAttribute("x2", x2);
        fingerLine.setAttribute("y2", y2);
        fingerLine.style.display = "block";
        
        // Midpoint and distance
        const dx = x1 - x2;
        const dy = y1 - y2;
        const distPx = Math.sqrt(dx * dx + dy * dy);
        const distMm = distPx * PX_TO_MM;
        
        // Floating MM label
        const xMid = (x1 + x2) / 2;
        const yMid = (y1 + y2) / 2;
        liveDistanceLabel.style.left = `${xMid}px`;
        liveDistanceLabel.style.top = `${yMid}px`;
        liveDistanceLabel.textContent = `${distMm.toFixed(1)} mm`;
        liveDistanceLabel.style.display = "block";
        
        // Active visual state for targets
        const insideTop = isTouchInsideElement(indexTouch, topTarget);
        const insideBottom = isTouchInsideElement(thumbTouch, bottomTarget);
        
        if (insideTop) topTarget.classList.add("active");
        else topTarget.classList.remove("active");
        
        if (insideBottom) bottomTarget.classList.add("active");
        else bottomTarget.classList.remove("active");
        
        // Automatic start trigger if both targets are pressed
        if (!taskActive && !savingTrial && insideTop && insideBottom) {
            startPinchTrial(now);
        }
        
        // Record trajectory frame
        if (taskActive) {
            trajectory.push({
                t: now - trialStartTime,
                x_index: x1,
                y_index: y1,
                x_thumb: x2,
                y_thumb: y2,
                distance: distPx
            });
        }
        
    } else {
        // Less than 2 touches -> hide tracking overlay
        fingerLine.style.display = "none";
        liveDistanceLabel.style.display = "none";
        topTarget.classList.remove("active");
        bottomTarget.classList.remove("active");
    }
}

// Start Trial
function startPinchTrial(now) {
    taskActive = true;
    trialNumber += 1;
    trialStartTime = now;
    trajectory = [];
    timeRemaining = 10;
    
    // Hide instructions, show countdown
    instructionEl.style.display = "none";
    timerEl.textContent = `Time remaining: ${timeRemaining}s`;
    timerEl.style.display = "block";
    
    // Visual indicators
    topTarget.textContent = "";
    bottomTarget.textContent = "";
    
    // Countdown Timer
    countdownTimer = setInterval(() => {
        timeRemaining -= 1;
        if (timeRemaining <= 0) {
            stopPinchTrial();
        } else {
            timerEl.textContent = `Time remaining: ${timeRemaining}s`;
        }
    }, 1000);
    
    console.log(`Pinch trial ${trialNumber} started.`);
}

// Stop Trial
async function stopPinchTrial() {
    taskActive = false;
    clearInterval(countdownTimer);
    timerEl.style.display = "none";
    
    console.log(`Pinch trial ${trialNumber} ended. Recorded frames:`, trajectory.length);
    
    // Save to database
    savingTrial = true;
    await savePinchTrial(trialStartTime, Date.now());
    savingTrial = false;
    
    // Check if reached limit
    if (trialNumber >= TRIAL_LIMIT) {
        endPinchTask();
    } else {
        // Cooldown and prep next trial
        instructionEl.textContent = `Trial ${trialNumber} Complete! Place fingers on the dots again to start Trial ${trialNumber + 1}.`;
        instructionEl.style.display = "block";
        topTarget.textContent = "Top Dot";
        bottomTarget.textContent = "Bottom Dot";
        firstTouchTime = null;
        sessionStorage.setItem("pinch_page_load", String(Date.now()));
    }
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
    fingerLine.style.display = "none";
    liveDistanceLabel.style.display = "none";
    
    completionBox.style.display = "flex";
}

// Page load initialization
sessionStorage.setItem("pinch_page_load", String(Date.now()));
startSession();
