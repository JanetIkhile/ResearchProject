'use strict';
import { supabase } from "../client/supabaseClient.js";
import { initSession, updateSessionFlags } from "../utils/sessionManager.js";


let participantId = null;
let sessionId = null;
let trialNumber = 0;
const TASK_TYPE = "drag";
const TRIAL_LIMIT = 10;
let taskCompleted = false;

// async setup
(async function initContext() {
    try {
        const result = await initSession({ dashboardPath: "/dashboard.html" });
        participantId = result.participantId;
        sessionId = result.sessionId;
        // sessionRow available at result.sessionRow if you need flags
        console.log("Drag task started");
        console.log("Participant:", participantId);
        console.log("Session:", sessionId);
    } catch (err) {
        // initSession already redirected or threw; stop further execution
        return;
    }
})();


let touchStartX, touchStartY;
let touchEndX, touchEndY;
let trajectoryLog = [];
let trialStartTime = null;
let trialEndTime = null;
let startX, startY, targetX, targetY;

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
    touchStartX = touch.pageX;
    touchStartY = touch.pageY;
    trialStartTime = Date.now();

    trialNumber += 1;
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
    targetX = targetRect.left + targetRect.width / 2;
    targetY = targetRect.top + targetRect.height / 2;
}

function handleTouchMove(e) {
    if (taskCompleted) return;
    if (window.isModalOpen || e.target.id === "nextTaskButton") return;
    e.preventDefault();

    const touch = e.changedTouches[0];
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
    const touch = e.changedTouches[0];
    touchEndX = touch.pageX;
    touchEndY = touch.pageY;
    trialEndTime = Date.now();

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

        // ---- trial timing ----
        trial_start_time: new Date(trialStartTime).toISOString(),
        trial_end_time: new Date(trialEndTime).toISOString(),

        // ---- task geometry ----
        start_x: startX,
        start_y: startY,
        target_x: targetX,
        target_y: targetY,

        // ---- device context ----
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        device_pixel_ratio: window.devicePixelRatio,

        // ---- raw behavioral data ----
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
    setTimeout(() => ctx.clearRect(0, 0, canvas.width, canvas.height), 1500);

    // ---- CHECK IF TASK COMPLETE ----
    if (trialNumber >= TRIAL_LIMIT) {
        console.log("All trials completed.");

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

// helper to detach listeners
function removeTouchListeners() {
    document.removeEventListener("touchstart", handleTouchStart);
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", handleTouchEnd);
}

// attach handlers (use named functions so we can remove them)
document.addEventListener("touchstart", handleTouchStart);
document.addEventListener("touchmove", handleTouchMove, { passive: false });
document.addEventListener("touchend", handleTouchEnd);
