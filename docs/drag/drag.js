'use strict';
import { supabase } from "../client/supabaseClient.js";
import { initSession, updateSessionFlags } from "../utils/sessionManager.js";


let participantId = null;
let sessionId = null;
let trialNumber = 0;
const TASK_TYPE = "drag";
let TRIAL_LIMIT = 10;
let taskCompleted = false;
let hasShownSpeedPrompt = false;
let pageLoadTime = Date.now();
let lastTrialEndTime = pageLoadTime;
let initiationDelay = null;
const instructionMain = document.getElementById("instructionMain");
const instructionSub = document.getElementById("instructionSub");
// const dragInstruction = document.getElementById("dragInstruction");

// async setup
(async function initContext() {
    try {
        const result = await initSession({ dashboardPath: "/dashboard.html" });

        participantId = result.participantId;
        sessionId = result.sessionId;

        const sessionNumber = result.sessionNumber;
        const header = document.getElementById("taskHeader");

        if (header) {
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
            TRIAL_LIMIT = 3;   // practice session
        } else {
            TRIAL_LIMIT = 10;  // real session
        }
        instructionMain.innerHTML = "Drag from Start to Target <strong class=\"highlight-instruction\">as fast</strong> and<br>accurately as possible.";
        instructionSub.innerText = `Attempts left: ${TRIAL_LIMIT}`;

        console.log("Drag task started");
        console.log("Participant:", participantId);
        console.log("Session:", sessionId);
        console.log("Session number:", sessionNumber);
        console.log("Trial limit:", TRIAL_LIMIT);
        setTimeout(startDemoAnimation, 500);

    } catch (err) {
        return;
    }
})();

let touchStartX, touchStartY;
let touchEndX, touchEndY;
let trajectoryLog = [];
let trialStartTime = null;
let trialEndTime = null;
let startX, startY, targetX, targetY;
let startRadius, targetRadius;
let activeTouchId = null;
let clearCanvasTimeout = null;

// Get DOM elements
const startPoint = document.getElementById('startInnerDot');
const targetPoint = document.getElementById('targetInnerDot');

// ---------------- CANVAS SETUP ----------------
const canvas = document.getElementById('pathCanvas');
const ctx = canvas.getContext('2d');

// Fullscreen adaptive canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Helper to read touch force if available
function touchForce(touch) {
    // some browsers support touch.force
    return (typeof touch.force === 'number') ? touch.force : null;
}


// ---------------- DEMO ANIMATION FOR DRAG TASK ----------------
let demoInterval = null;
let demoPointer = null;
let isAnimatingDemo = false;
let demoPath = [];

function animateDemoPath() {
    if (!isAnimatingDemo || !demoPointer) return;

    const rect = demoPointer.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    
    // Get finger tip coordinate (roughly center-top of the hand emoji)
    const curX = rect.left + rect.width / 2 - canvasRect.left;
    const curY = rect.top + rect.height / 2 - canvasRect.top;

    demoPath.push({ x: curX, y: curY });

    if (ctx && demoPath.length > 1) {
        ctx.strokeStyle = 'rgba(0, 128, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const prev = demoPath[demoPath.length - 2];
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curX, curY);
        ctx.stroke();
    }

    requestAnimationFrame(animateDemoPath);
}


// ---------------- DYNAMIC TRIAL FEEDBACK ----------------
function showFeedback(message, type) {
    const existing = document.getElementById("trialFeedback");
    if (existing) existing.remove();

    const feedback = document.createElement("div");
    feedback.id = "trialFeedback";
    feedback.style.position = "absolute";
    feedback.style.top = "30vh";
    feedback.style.left = "50vw";
    feedback.style.transform = "translate(-50%, -50%)";
    feedback.style.padding = "16px 28px";
    feedback.style.borderRadius = "12px";
    feedback.style.fontSize = "22px";
    feedback.style.fontWeight = "bold";
    feedback.style.zIndex = "2000";
    feedback.style.pointerEvents = "none";
    feedback.style.textAlign = "center";
    feedback.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    feedback.style.transition = "opacity 0.3s ease-out";
    
    if (type === "success") {
        feedback.style.backgroundColor = "#d1fae5";
        feedback.style.color = "#065f46";
        feedback.style.border = "2px solid #34d399";
    } else if (type === "warning") {
        feedback.style.backgroundColor = "#fef3c7";
        feedback.style.color = "#92400e";
        feedback.style.border = "2px solid #fbbf24";
    } else {
        feedback.style.backgroundColor = "#fee2e2";
        feedback.style.color = "#991b1b";
        feedback.style.border = "2px solid #f87171";
    }

    feedback.innerText = message;
    document.body.appendChild(feedback);

    setTimeout(() => {
        if (feedback) {
            feedback.style.opacity = "0";
            setTimeout(() => feedback.remove(), 300);
        }
    }, 1500);
}

function startDemoAnimation() {
    if (trialNumber > 0 || taskCompleted) return;

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
        document.body.appendChild(demoPointer);
    }

    const outerStart = document.getElementById('startPoint');
    const targetPoint = document.getElementById('targetInnerDot');
    if (!outerStart || !targetPoint) return;
    const startRect = outerStart.getBoundingClientRect();
    const targetRect = targetPoint.getBoundingClientRect();

    const sX = startRect.left + startRect.width / 2 - 30;
    const sY = startRect.top + startRect.height / 2 - 30;
    const tX = targetRect.left + targetRect.width / 2 - 30;
    const tY = targetRect.top + targetRect.height / 2 - 30;

    function runAnimationCycle() {
        if (trialNumber > 0 || taskCompleted) {
            stopDemoAnimation();
            return;
        }

        // Reset canvas and animation variables
        isAnimatingDemo = false;
        demoPath = [];
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set to start position (opacity 0)
        demoPointer.style.transition = "none";
        demoPointer.style.left = `${sX}px`;
        demoPointer.style.top = `${sY}px`;
        demoPointer.style.opacity = "0";

        // Fade in
        setTimeout(() => {
            if (trialNumber > 0 || taskCompleted || !demoPointer) return;
            demoPointer.style.transition = "opacity 0.3s ease-in";
            demoPointer.style.opacity = "1";
        }, 100);

        // Start drawing path and move to target
        setTimeout(() => {
            if (trialNumber > 0 || taskCompleted || !demoPointer) return;
            isAnimatingDemo = true;
            animateDemoPath();

            demoPointer.style.transition = "left 1.2s ease-in-out, top 1.2s ease-in-out, opacity 0.3s ease-in";
            demoPointer.style.left = `${tX}px`;
            demoPointer.style.top = `${tY}px`;
        }, 500);

        // Stop drawing path (reaches target)
        setTimeout(() => {
            isAnimatingDemo = false;
        }, 1700);

        // Fade out
        setTimeout(() => {
            if (trialNumber > 0 || taskCompleted || !demoPointer) return;
            demoPointer.style.transition = "opacity 0.3s ease-out";
            demoPointer.style.opacity = "0";
        }, 2000);

        // Clear canvas trail after fade out
        setTimeout(() => {
            if (trialNumber > 0 || taskCompleted) return;
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }, 2350);
    }

    runAnimationCycle();
    demoInterval = setInterval(runAnimationCycle, 3000);
}

function stopDemoAnimation() {
    isAnimatingDemo = false;
    if (demoInterval) {
        clearInterval(demoInterval);
        demoInterval = null;
    }
    if (demoPointer) {
        demoPointer.remove();
        demoPointer = null;
    }
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ---------- Named touch handlers (so we can remove them) ----------
function handleTouchStart(e) {
    stopDemoAnimation();
    if (taskCompleted) return;  // prevent further trials

    if (activeTouchId !== null) return; // Prevent multiple fingers

    if (trialNumber >= TRIAL_LIMIT) {
        taskCompleted = true;
        const nextButton = document.getElementById('nextTaskButton');
        if (nextButton) nextButton.style.display = 'block';
        // remove listeners and disable interactions
        removeTouchListeners();
        if (canvas) canvas.style.pointerEvents = 'none';
        return;
    }

    if (window.isModalOpen || e.target.id === "nextTaskButton") return;

    // Enforce that touch must start inside the outer green circle
    const outerStart = document.getElementById('startPoint');
    const outerStartRect = outerStart.getBoundingClientRect();
    const sX = outerStartRect.left + outerStartRect.width / 2;
    const sY = outerStartRect.top + outerStartRect.height / 2;
    const sRad = outerStartRect.width / 2;

    const touch = e.changedTouches[0];
    const distToStart = Math.hypot(touch.clientX - sX, touch.clientY - sY);

    if (distToStart > sRad) {
        return; // Ignore touches starting outside the green circle
    }

    activeTouchId = touch.identifier;

    if (clearCanvasTimeout) {
        clearTimeout(clearCanvasTimeout);
        clearCanvasTimeout = null;
    }
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

    trialStartTime = Date.now();
    initiationDelay = trialStartTime - lastTrialEndTime;

    touchStartX = touch.pageX;
    touchStartY = touch.pageY;

    trajectoryLog = [];

    trajectoryLog.push({
        x: touchStartX,
        y: touchStartY,
        t: trialStartTime,
        id: touch.identifier,
        force: touchForce(touch)
    });

    // create visual pointer
    const pointer = document.createElement("div");
    pointer.classList.add("dot");
    pointer.style.top = `${touchStartY}px`;
    pointer.style.left = `${touchStartX}px`;
    pointer.id = `pointer-${touch.identifier}`;
    document.body.append(pointer);

    const startRect = startPoint.getBoundingClientRect(); // startPoint refers to startInnerDot
    const targetRect = targetPoint.getBoundingClientRect();

    startX = startRect.left + startRect.width / 2;
    startY = startRect.top + startRect.height / 2;
    startRadius = startRect.width / 2;
    
    targetX = targetRect.left + targetRect.width / 2;
    targetY = targetRect.top + targetRect.height / 2;
    targetRadius = targetRect.width / 2;
}

function handleTouchMove(e) {
    if (taskCompleted) return;
    if (window.isModalOpen || e.target.id === "nextTaskButton") return;
    
    const touch = Array.from(e.changedTouches).find(t => t.identifier === activeTouchId);
    if (!touch) return;

    e.preventDefault();
    let currentX = touch.pageX;
    let currentY = touch.pageY;
    let currentTime = Date.now();
    trajectoryLog.push({
        x: currentX,
        y: currentY,
        t: currentTime,
        id: touch.identifier,
        force: touchForce(touch)
    });

    const pointer = document.getElementById(`pointer-${touch.identifier}`);
    if (pointer) {
        pointer.style.top = `${touch.pageY}px`;
        pointer.style.left = `${touch.pageX}px`;
    }

    // Draw small segment (blue)
    const prev = trajectoryLog[trajectoryLog.length - 2];
    if (prev) {
        ctx.strokeStyle = 'rgba(0, 128, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(touch.pageX, touch.pageY);
        ctx.stroke();
    }
}

async function handleTouchEnd(e) {
    if (taskCompleted) return;
    if (window.isModalOpen || e.target.id === "nextTaskButton") return;
    
    const touch = Array.from(e.changedTouches).find(t => t.identifier === activeTouchId);
    if (!touch) return;
    activeTouchId = null;

    touchEndX = touch.pageX;
    touchEndY = touch.pageY;

    // Ignore taps (distance < 20px)
    const dist = Math.hypot(touchEndX - touchStartX, touchEndY - touchStartY);
    if (dist < 20) {
        const pointer = document.getElementById(`pointer-${touch.identifier}`);
        if (pointer) pointer.remove();
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    trialNumber += 1;
    const remaining = TRIAL_LIMIT - trialNumber;
    if (remaining >= 0) {
        instructionSub.innerText = `Attempts left: ${remaining}`;
    }

    trialEndTime = Date.now();
    // Calculate target reach based on the outer red circle (targetPoint in HTML)
    const outerTarget = document.getElementById('targetPoint');
    const outerTargetRect = outerTarget.getBoundingClientRect();
    const outerTargetRadius = outerTargetRect.width / 2;

    const distToTarget = Math.hypot(touchEndX - targetX, touchEndY - targetY);
    const targetReached = distToTarget <= outerTargetRadius;

    if (targetReached) {
        if (!hasShownSpeedPrompt) {
            showFeedback("Good! Move as fast as possible.", "success");
            hasShownSpeedPrompt = true;
        } else {
            showFeedback("Good!", "success");
        }
    } else {
        showFeedback("Drag all the way to the red circle.", "warning");
    }
    lastTrialEndTime = trialEndTime;

    trajectoryLog.push({
        x: touchEndX,
        y: touchEndY,
        t: trialEndTime,
        id: touch.identifier,
        force: touchForce(touch)
    });

    const pointer = document.getElementById(`pointer-${touch.identifier}`);
    if (pointer) pointer.remove();

    const trialPayload = {
        // ---- identity ----
        participant_id: participantId,
        session_id: sessionId,
        task_type: TASK_TYPE,
        trial_number: trialNumber,
        timestamp: new Date().toISOString(),

        // ---- timing ----
        trial_start_time: new Date(trialStartTime).toISOString(),
        trial_end_time: new Date(trialEndTime).toISOString(),

        // NEW METRICS
        initiation_delay: initiationDelay,
        movement_time_ms: trialEndTime - trialStartTime,

        // ---- task geometry ----
        start_x: startX,
        start_y: startY,
        start_radius: startRadius,
        target_x: targetX,
        target_y: targetY,
        target_radius: targetRadius,

        // ---- device context ----
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        device_pixel_ratio: window.devicePixelRatio,

        // ---- behavior ----
        trajectory: trajectoryLog
    };
    console.log("Saving trial data:", trialPayload);
    const { error } = await supabase
        .from("trial_results")
        .insert(trialPayload);

    if (error) {
        console.error("Failed to save trial:", error);
    } else {
        console.log("Trial saved:", trialNumber);
    }
    // Clear canvas for next trial after short delay
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const first = trajectoryLog[0];
    const last = trajectoryLog[trajectoryLog.length - 1];
    if (first && last) {
        ctx.moveTo(first.x, first.y);
        ctx.lineTo(last.x, last.y);
        ctx.stroke();
    }
    clearCanvasTimeout = setTimeout(() => {
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 300);

    // ---- CHECK IF TASK COMPLETE ----
    if (trialNumber >= TRIAL_LIMIT) {
        console.log("All trials completed.");
        const completionBox = document.getElementById("completionBox");
        const instructionBox = document.getElementById("instructionBox");

        if (instructionBox) instructionBox.style.display = "none";
        if (completionBox) completionBox.style.display = "block";
        // indicate stop
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        const nextButton = document.getElementById('nextTaskButton');
        if (nextButton) {
            nextButton.style.display = 'block';
        }
        if (!taskCompleted) {
            taskCompleted = true;
            await updateSessionFlags(sessionId, { drag: true });
        }

        // Disable further input by removing listeners and disabling canvas
        removeTouchListeners();
        if (canvas) canvas.style.pointerEvents = 'none';
    }
}

function handleTouchCancel(e) {
    if (taskCompleted) return;
    const touch = Array.from(e.changedTouches).find(t => t.identifier === activeTouchId);
    if (!touch) return;
    
    // Abort cleanly without recording a trial
    activeTouchId = null;
    const pointer = document.getElementById(`pointer-${touch.identifier}`);
    if (pointer) pointer.remove();
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// helper to detach listeners
function removeTouchListeners() {
    document.removeEventListener("touchstart", handleTouchStart);
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", handleTouchEnd);
    document.removeEventListener("touchcancel", handleTouchCancel);
}

// attach handlers (use named functions so we can remove them)
document.addEventListener("touchstart", handleTouchStart);
document.addEventListener("touchmove", handleTouchMove, { passive: false });
document.addEventListener("touchend", handleTouchEnd);
document.addEventListener("touchcancel", handleTouchCancel);

// Prevent long-press context menu globally
document.addEventListener("contextmenu", function(e) { e.preventDefault(); });
