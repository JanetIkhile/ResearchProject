'use strict';
import { supabase } from "../client/supabaseClient.js";
import { initSession, updateSessionFlags } from "../utils/sessionManager.js";


let participantId = null;
let sessionId = null;
let trialNumber = 0;
const TASK_TYPE = "drag";
let TRIAL_LIMIT = 10;
let taskCompleted = false;
let sessionNumber = null;
let hasShownSpeedPrompt = false;
let pageLoadTime = Date.now();
let lastTrialEndTime = pageLoadTime;
let initiationDelay = null;
const instructionMain = document.getElementById("instructionMain");
const instructionSub = document.getElementById("instructionSub");

// Progressive disclosure practice states
let practiceStep = 'initial_demo'; // 'initial_demo', 'try_button_shown', 'waiting_for_touch', 'help_banner_shown', 'detailed_demo', 'gif_ready_prompt', 'active_practice'
let demoLoopCount = 0;
let inactivityTimer = null;
let gifTimer = null;
let continueInactivityTimer = null;
// const dragInstruction = document.getElementById("dragInstruction");

// async setup
(async function initContext() {
    try {
        const result = await initSession({ dashboardPath: "/dashboard.html" });

        participantId = result.participantId;
        sessionId = result.sessionId;

        sessionNumber = (sessionStorage.getItem("session_type") === "practice") ? 1 : result.sessionNumber;
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
            instructionMain.innerHTML = "Use your Index finger to drag from Start to Target<br><strong class=\"highlight-instruction\">as fast</strong> and <strong class=\"highlight-instruction\">accurately</strong> as possible.";
            instructionSub.style.display = "none";
            const indicator = document.getElementById("watchExampleIndicator");
            if (indicator) indicator.style.display = "inline-block";
        } else {
            TRIAL_LIMIT = 10;  // real session
            instructionMain.innerHTML = "Use your Index finger to drag from Start to Target<br><strong class=\"highlight-instruction\">as fast</strong> and <strong class=\"highlight-instruction\">accurately</strong> as possible.";
            instructionSub.innerText = `Attempts left: ${TRIAL_LIMIT}`;
            instructionSub.style.display = "inline-block";
        }

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

    // Get finger tip coordinate (top-center of the 80x80 container)
    const curX = rect.left + rect.width / 2 - canvasRect.left;
    const curY = rect.top - canvasRect.top;

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
    if (sessionNumber !== 1) return; // Only practice phase
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
    const sY = startRect.top + startRect.height / 2;
    const tX = targetRect.left + targetRect.width / 2 - 30;
    const tY = targetRect.top + targetRect.height / 2;

    function runAnimationCycle() {
        if (trialNumber > 0 || taskCompleted) {
            stopDemoAnimation();
            return;
        }

        if (sessionNumber === 1 && trialNumber === 0) {
            demoLoopCount += 1;
            if (demoLoopCount > 3) {
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
                ['taskHeader', 'mainContainer', 'startPoint', 'targetPoint', 'pathCanvas'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.classList.add("dimmed");
                });
                return;
            }
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

    // Clear progressive timers
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
    }
    if (gifTimer) {
        clearTimeout(gifTimer);
        gifTimer = null;
    }
    if (continueInactivityTimer) {
        clearTimeout(continueInactivityTimer);
        continueInactivityTimer = null;
    }
    const continuePointer = document.getElementById("continuePointer");
    if (continuePointer) continuePointer.remove();

    // Hide progressive disclosure helper UI
    const tryItButton = document.getElementById("tryItButton");
    if (tryItButton) tryItButton.style.display = "none";
    const helpBanner = document.getElementById("helpBanner");
    if (helpBanner) helpBanner.style.display = "none";
    const gifModal = document.getElementById("gifModal");
    if (gifModal) gifModal.style.display = "none";
    const watchExampleIndicator = document.getElementById("watchExampleIndicator");
    if (watchExampleIndicator) watchExampleIndicator.style.display = "none";
}

// ---------- Named touch handlers (so we can remove them) ----------
function handleTouchStart(e) {
    if (e.target.id === "tryItButton" || e.target.id === "watchVideoBtn" || e.target.id === "watchExampleBtn" || e.target.id === "gifBtnYes" || e.target.id === "gifBtnAgain" || e.target.closest("#gifModal") || e.target.closest("#helpBanner") || e.target.closest("#practiceOptionsContainer")) {
        return; // Let custom button click handlers capture the action
    }

    if (e.target.id === "watchExampleIndicator" || e.target.closest("#instructionBox")) {
        return;
    }

    if (sessionNumber === 1 && trialNumber === 0 && practiceStep === 'initial_demo') {
        return; // Ignore all touches while initial demo animation is playing so user watches fully
    }

    if (sessionNumber === 1 && trialNumber === 0 && practiceStep === 'options_shown') {
        e.stopPropagation();
        e.preventDefault();
        return;
    }

    if (sessionNumber === 1 && trialNumber === 0) {
        if (practiceStep === 'help_banner_shown') {
            const helpBanner = document.getElementById("helpBanner");
            if (helpBanner && !helpBanner.contains(e.target)) {
                helpBanner.style.display = "none";
                practiceStep = 'waiting_for_touch';
                instructionMain.innerHTML = "Use your Index finger to drag from Start to Target<br><strong class=\"highlight-instruction\">as fast</strong> and <strong class=\"highlight-instruction\">accurately</strong> as possible.";
                instructionSub.style.display = "inline-block";
                instructionSub.innerText = `Attempts left: ${TRIAL_LIMIT}`;

                // Setup inactivity timer when dismissing the help banner
                if (inactivityTimer) clearTimeout(inactivityTimer);
                inactivityTimer = setTimeout(() => {
                    if (practiceStep === 'waiting_for_touch') {
                        practiceStep = 'help_banner_shown';
                        const banner = document.getElementById("helpBanner");
                        if (banner) banner.style.display = "flex";
                    }
                }, 7000);
            }
        }
    }

    stopDemoAnimation();
    if (taskCompleted) return;  // prevent further trials

    if (activeTouchId !== null) return; // Prevent multiple fingers

    if (window.isModalOpen || e.target.id === "nextTaskButton") return;

    // Enforce that touch must start inside the outer green circle
    const outerStart = document.getElementById('startPoint');
    const outerStartRect = outerStart.getBoundingClientRect();
    const sX = outerStartRect.left + outerStartRect.width / 2;
    const sY = outerStartRect.top + outerStartRect.height / 2;
    const sRad = outerStartRect.width / 2;

    const touch = e.changedTouches[0];
    const distToStart = Math.hypot(touch.clientX - sX, touch.clientY - sY);

    if (sessionNumber === 1 && trialNumber === 0) {
        if (practiceStep === 'help_banner_shown' || practiceStep === 'detailed_demo' || practiceStep === 'gif_ready_prompt') {
            return; // Lock task interaction during dialog phases
        }
        if (practiceStep === 'initial_demo' || practiceStep === 'try_button_shown' || practiceStep === 'waiting_for_touch') {
            const tryItButton = document.getElementById("tryItButton");
            if (tryItButton) tryItButton.style.display = "none";
            const indicator = document.getElementById("watchExampleIndicator");
            if (indicator) indicator.style.display = "none";

            if (inactivityTimer) {
                clearTimeout(inactivityTimer);
                inactivityTimer = null;
            }

            if (distToStart <= sRad) {
                // Touched green circle: start trial immediately
                practiceStep = 'active_practice';
                instructionMain.innerHTML = "Use your Index finger to drag from Start to Target<br><strong class=\"highlight-instruction\">as fast</strong> and <strong class=\"highlight-instruction\">accurately</strong> as possible.";
                instructionSub.style.display = "inline-block";
                instructionSub.innerText = `Attempts left: ${TRIAL_LIMIT}`;
            } else {
                // Touched outside green circle: transition to waiting_for_touch and set inactivity timer
                practiceStep = 'waiting_for_touch';
                instructionMain.innerHTML = "Use your Index finger to drag from Start to Target<br><strong class=\"highlight-instruction\">as fast</strong> and <strong class=\"highlight-instruction\">accurately</strong> as possible.";
                instructionSub.style.display = "inline-block";
                instructionSub.innerText = `Attempts left: ${TRIAL_LIMIT}`;

                inactivityTimer = setTimeout(() => {
                    if (practiceStep === 'waiting_for_touch') {
                        practiceStep = 'help_banner_shown';
                        const helpBanner = document.getElementById("helpBanner");
                        if (helpBanner) helpBanner.style.display = "flex";
                    }
                }, 7000);
            }
        }
    }

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

function showPracticeTip(message) {
    if (document.getElementById("practiceErrorModal")) return;

    const modalDiv = document.createElement("div");
    modalDiv.id = "practiceErrorModal";
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
        // Reset trial starts
        trialStartTime = Date.now();
        lastTrialEndTime = Date.now();
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
    msg.innerText = message;
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

    // Calculate target reach based on the outer red circle (targetPoint in HTML)
    const outerTarget = document.getElementById('targetPoint');
    const outerTargetRect = outerTarget.getBoundingClientRect();
    const outerTargetRadius = outerTargetRect.width / 2;

    const distToTarget = Math.hypot(touchEndX - targetX, touchEndY - targetY);
    const targetReached = distToTarget <= outerTargetRadius;

    if (sessionNumber === 1 && !targetReached) {
        showPracticeTip("Please drag all the way to the target circle.");
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

    if (trialNumber >= TRIAL_LIMIT) {
        console.log("All trials completed.");
        const completionBox = document.getElementById("completionBox");
        const instructionBox = document.getElementById("instructionBox");

        const completionText = document.getElementById("completionText");
        if (completionText) {
            if (sessionNumber === 1) {
                completionText.innerText = "✅ Practice Complete";
            } else {
                completionText.innerText = "✅ Task Complete";
            }
        }

        if (instructionBox) instructionBox.style.display = "none";
        if (completionBox) completionBox.style.display = "flex";

        // Dim background task elements during completion (practice and main phase)
        const elementsToDim = ['taskHeader', 'mainContainer', 'startPoint', 'targetPoint', 'pathCanvas'];
        elementsToDim.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add("dimmed");
        });

        // indicate stop
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        const nextButton = document.getElementById('nextTaskButton');
        if (nextButton) {
            nextButton.innerText = "Continue ➔";
            nextButton.style.display = 'block';
        }
        if (!taskCompleted) {
            taskCompleted = true;
            await updateSessionFlags(sessionId, { drag: true });
        }

        // Disable further input by removing listeners and disabling canvas
        removeTouchListeners();
        if (canvas) canvas.style.pointerEvents = 'none';

        // Show clicking hand animation if they are inactive for 5 seconds on completion screen
        if (continueInactivityTimer) clearTimeout(continueInactivityTimer);
        continueInactivityTimer = setTimeout(() => {
            if (nextButton && completionBox.style.display === "flex" && !document.getElementById("continuePointer")) {
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
document.addEventListener("contextmenu", function (e) { e.preventDefault(); });

function resumeDemoAnimationFromOptions() {
    const optionsOverlay = document.getElementById("practiceOptionsOverlay");
    if (optionsOverlay) optionsOverlay.style.display = "none";
    const optionsContainer = document.getElementById("practiceOptionsContainer");
    if (optionsContainer) optionsContainer.style.display = "none";

    // Un-dim background elements
    ['taskHeader', 'mainContainer', 'startPoint', 'targetPoint', 'pathCanvas'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove("dimmed");
    });

    const indicator = document.getElementById("watchExampleIndicator");
    if (indicator) indicator.style.display = "inline-block";

    practiceStep = 'initial_demo';
    demoLoopCount = 0;
    setTimeout(startDemoAnimation, 300);
}

// ---------- Progressive Disclosure Initialization & Click Listeners ----------
(function initProgressiveDisclosure() {
    const tryItButton = document.getElementById("tryItButton");
    const watchVideoBtn = document.getElementById("watchVideoBtn");
    const gifBtnYes = document.getElementById("gifBtnYes");
    const gifBtnAgain = document.getElementById("gifBtnAgain");
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

        // Un-dim background elements
        ['taskHeader', 'mainContainer', 'startPoint', 'targetPoint', 'pathCanvas'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove("dimmed");
        });
        practiceStep = 'detailed_demo';
        const gifModal = document.getElementById("gifModal");
        if (gifModal) gifModal.style.display = "block";

        const promptTitle = document.getElementById("gifPromptTitle");
        const btnGroup = document.getElementById("gifBtnGroup");
        if (promptTitle) promptTitle.style.display = "none";
        if (btnGroup) btnGroup.style.display = "none";

        const img = document.getElementById("gifDemoImage");
        if (img) {
            const currentSrc = img.src;
            img.src = "";
            img.src = currentSrc.split('?')[0] + '?v=' + Date.now();
        }

        if (gifTimer) clearTimeout(gifTimer);
        gifTimer = setTimeout(() => {
            practiceStep = 'gif_ready_prompt';
            if (promptTitle) promptTitle.style.display = "block";
            if (btnGroup) btnGroup.style.display = "flex";
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
            ['taskHeader', 'mainContainer', 'startPoint', 'targetPoint', 'pathCanvas'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.remove("dimmed");
            });

            practiceStep = 'waiting_for_touch';
            instructionMain.innerHTML = "Use your Index finger to drag from Start to Target<br><strong class=\"highlight-instruction\">as fast</strong> and <strong class=\"highlight-instruction\">accurately</strong> as possible.";
            instructionSub.style.display = "inline-block";
            instructionSub.innerText = `Attempts left: ${TRIAL_LIMIT}`;
        });
    }

    if (watchVideoBtn) {
        watchVideoBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            openGifModal();
        });
    }

    if (gifBtnYes) {
        gifBtnYes.addEventListener("click", (e) => {
            e.stopPropagation();
            if (gifTimer) clearTimeout(gifTimer);
            const gifModal = document.getElementById("gifModal");
            if (gifModal) gifModal.style.display = "none";

            practiceStep = 'waiting_for_touch';
            instructionMain.innerHTML = "Use your Index finger to drag from Start to Target<br><strong class=\"highlight-instruction\">as fast</strong> and <strong class=\"highlight-instruction\">accurately</strong> as possible.";
            instructionSub.style.display = "inline-block";
            instructionSub.innerText = `Attempts left: ${TRIAL_LIMIT}`;
        });
    }

    if (gifBtnAgain) {
        gifBtnAgain.addEventListener("click", (e) => {
            e.stopPropagation();
            openGifModal();
        });
    }
})();

// Programmatic zoom, multi-touch, and scrolling prevention
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
document.addEventListener('touchmove', function(e) {
    // Prevent default scroll/bounce completely during drag task touch movements
    if (e.target.closest("#gifModal") || e.target.closest("#practiceOptionsContainer")) {
        return;
    }
    e.preventDefault();
}, { passive: false });
