'use strict';
import { supabase } from "../client/supabaseClient.js";
import { initSession, updateSessionFlags } from "../utils/sessionManager.js";


let participantId = null;
let sessionId = null;
let trialNumber = 0;
const TASK_TYPE = "drag";
let TRIAL_LIMIT = 10;
let taskCompleted = false;
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
            TRIAL_LIMIT = 1;   // practice session
        } else {
            TRIAL_LIMIT = 10;  // real session
        }
        instructionMain.innerHTML = "Drag from Start to Target as fast and<br>accurately as possible.";
        instructionSub.innerText = `Attempts left: ${TRIAL_LIMIT}`;

        console.log("Drag task started");
        console.log("Participant:", participantId);
        console.log("Session:", sessionId);
        console.log("Session number:", sessionNumber);
        console.log("Trial limit:", TRIAL_LIMIT);

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

// ---------- Named touch handlers (so we can remove them) ----------
function handleTouchStart(e) {
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
    const touch = e.changedTouches[0];
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

    const startRect = startPoint.getBoundingClientRect();
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
        initiation_delay_ms: initiationDelay,
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
