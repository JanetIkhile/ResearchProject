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
let strokeStartDistance = 0;
let strokeStartTime = 0;

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
let practiceStep = 'initial_demo_waiting'; // initial_demo_waiting, initial_demo_animating, try_button_shown -> waiting_for_touch -> help_banner_shown -> detailed_demo -> gif_ready_prompt -> active_practice

const ORIGINAL_INSTRUCTION = "Place your index finger and thumb on the guide circles.<br>Spread your fingers as <strong class=\"highlight-instruction\">wide</strong> and <strong class=\"highlight-instruction\">fast</strong> as possible.<br>Then lift both fingers and repeat.";

let practiceTipCount = 0;
let openGifModalFn = null;
let inwardErrorCount = 0;

// Practice error threshold
const MAX_PRACTICE_ERRORS = 7;
let practiceErrorCount = 0;

function getInwardErrorMessage() {
    inwardErrorCount++;
    if (inwardErrorCount % 2 === 1) {
        return "Please spread your fingers apart, not inward.";
    } else {
        return "Imagine you are zooming in on a picture.";
    }
}

function showPinchPracticeErrorModal(message) {
    if (sessionNumber !== 1) return; // Only in practice phase

    // Check error threshold
    practiceErrorCount++;
    console.log(`[Pinch] Practice error #${practiceErrorCount}`);
    if (practiceErrorCount >= MAX_PRACTICE_ERRORS) {
        // Log threshold reached to Supabase, then end practice early
        (async () => {
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
                console.warn("Could not log pinch practice threshold event:", err);
            }
            console.log("[Pinch] Practice error threshold reached — ending practice early.");
            endPinchTask();
        })();
        return;
    }

    if (document.getElementById("practiceErrorModal")) return;

    practiceTipCount++;

    window.isModalOpen = true; // Lock modal interactions
    stopDemoAnimation(); // Stop any running demo animations and clear timeouts!

    // Abort active trial if active
    if (taskActive) {
        clearInterval(countdownTimer);
        taskActive = false;
        trialNumber--; // decrement so they repeat this trial

        // Reset target positions back to default baseline
        resetTargetPositions();

        // Reset screen state
        if (liveDistanceLabel) liveDistanceLabel.style.display = "none";

        updateInstructions(true, (sessionNumber === 1) ? 5 : 10);
    }

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
        window.isModalOpen = false; // Release modal interactions lock
        // Allow restarting
        firstTouchTime = null;
        sessionStorage.setItem("pinch_page_load", String(Date.now()));

        // If practice tips triggered 3 times, open watch video modal
        if (practiceTipCount >= 3) {
            practiceTipCount = 0;
            if (typeof openGifModalFn === 'function') {
                openGifModalFn();
            }
        }
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

// DOM Elements
const topTarget = document.getElementById("topTarget");
const bottomTarget = document.getElementById("bottomTarget");
const liveDistanceLabel = document.getElementById("liveDistanceLabel");
const instructionEl = document.getElementById("pinchInstruction");

function setInstruction(html) {
    if (!instructionEl) return;
    instructionEl.innerHTML = html;

    // Check if we are showing a warning or cooldown message
    const isWarning = html.includes("⚠️");
    const isStopPinching = html.includes("Stop pinching");

    if (taskActive && !isWarning && !isStopPinching) {
        // Hide the instruction during active pinching and collapse its space
        instructionEl.style.display = "none";
    } else {
        // Show fully visible and restore layout flow
        instructionEl.style.display = "block";
    }
}

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
        sessionNumber = (sessionStorage.getItem("session_type") === "practice") ? 1 : sessionData.sessionNumber;
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

        // Calculate coordinate baselines on session start
        const tRect = topTarget.getBoundingClientRect();
        const bRect = bottomTarget.getBoundingClientRect();
        baselineTopCenterX = tRect.left + tRect.width / 2;
        baselineTopCenterY = tRect.top + tRect.height / 2;
        baselineBottomCenterX = bRect.left + bRect.width / 2;
        baselineBottomCenterY = bRect.top + bRect.height / 2;

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
            const watchExampleBtn = document.getElementById("watchExampleBtn");
            if (watchExampleBtn) watchExampleBtn.style.display = "inline-block";
            setupProgressiveDisclosure();
        } else {
            updateInstructions(true, 10); // Show timer label at the start of the page
        }
    } catch (err) {
        console.error("Session initialization failed:", err);
    }
}

// Check touch containment inside targets with padding tolerance
function isTouchInsideElement(touch, element, padding = 35) {
    const rect = element.getBoundingClientRect();
    return (
        touch.clientX >= (rect.left - padding) &&
        touch.clientX <= (rect.right + padding) &&
        touch.clientY >= (rect.top - padding) &&
        touch.clientY <= (rect.bottom + padding)
    );
}

// Helper to reset circles back to their baseline CSS positions
function resetTargetPositions() {
    maxStrokeDistance = 0;
    strokeStartDistance = 0;
    strokeStartTime = 0;
    topTarget.style.left = "";
    topTarget.style.top = "";
    topTarget.style.transform = "";
    topTarget.style.transition = "";

    bottomTarget.style.left = "";
    bottomTarget.style.top = "";
    bottomTarget.style.transform = "";
    bottomTarget.style.transition = "";
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

    if (demoTrialNumber > 1) {
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

        // Reset pointers & targets to initial center positions instantly and make them visible
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
        topTarget.style.opacity = "0.8";

        bottomTarget.style.transition = "none";
        bottomTarget.style.left = `${baselineBottomCenterX}px`;
        bottomTarget.style.top = `${baselineBottomCenterY}px`;
        bottomTarget.style.transform = "translate(-50%, -50%)";
        bottomTarget.style.opacity = "0.8";

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

        // Fade out pointers and target guides (simulating lifting fingers)
        demoTimeouts.push(setTimeout(() => {
            if (trialNumber > 0 || taskActive || taskCompleted || !demoPointer1 || !demoPointer2) return;
            demoPointer1.style.transition = "opacity 0.2s ease-out";
            demoPointer1.style.opacity = "0";
            demoPointer2.style.transition = "opacity 0.2s ease-out";
            demoPointer2.style.opacity = "0";

            topTarget.style.transition = "opacity 0.2s ease-out";
            topTarget.style.opacity = "0";
            bottomTarget.style.transition = "opacity 0.2s ease-out";
            bottomTarget.style.opacity = "0";
        }, 850));

        // Reset target positions back to center instantly while invisible (preventing returning animation)
        demoTimeouts.push(setTimeout(() => {
            if (trialNumber > 0 || taskActive || taskCompleted) return;
            topTarget.style.transition = "none";
            topTarget.style.top = `${baselineTopCenterY}px`;

            bottomTarget.style.transition = "none";
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

            // Place target circles apart during Stop pinching break (so user doesn't pinch back inward)
            topTarget.style.transition = "none";
            topTarget.style.top = `${baselineTopCenterY - 120}px`;
            topTarget.style.opacity = "0.8";

            bottomTarget.style.transition = "none";
            bottomTarget.style.top = `${baselineBottomCenterY + 120}px`;
            bottomTarget.style.opacity = "0.8";

            // Briefly show "Stop pinching" just like a real trial end!
            const pinchInstruction = document.getElementById("pinchInstruction");
            const originalInstructionText = pinchInstruction ? pinchInstruction.innerHTML : "";
            if (pinchInstruction) pinchInstruction.innerText = "Stop pinching";

            setTimeout(() => {
                if (pinchInstruction && originalInstructionText) {
                    pinchInstruction.innerHTML = originalInstructionText;
                }
                resetTargetPositions(); // Reset back to center now for the next trial
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
    updateInstructions(false);

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
    pointer.style.left = `${rect.left + rect.width / 2 - 27}px`;
    pointer.style.top = `${rect.bottom + 15}px`;
    document.body.appendChild(pointer);
}

// Reposition the helper hand pointer on window resize
window.addEventListener("resize", () => {
    const btn = document.getElementById("watchExampleBtn");
    const pointer = document.getElementById("btnPointer");
    if (btn && pointer && btn.style.display !== "none") {
        const rect = btn.getBoundingClientRect();
        pointer.style.left = `${rect.left + rect.width / 2 - 27}px`;
        pointer.style.top = `${rect.bottom + 15}px`;
    }
});

function stopDemoAnimation() {
    if (isFingerDemoAnimating) {
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

    const btnPointer = document.getElementById("btnPointer");
    if (btnPointer) btnPointer.remove();

    const watchExampleBtn = document.getElementById("watchExampleBtn");
    if (watchExampleBtn) {
        watchExampleBtn.style.display = "none";
        watchExampleBtn.classList.remove("button-pressed-animate");
    }
}

function handleTouch(e) {
    if (e.target.id === "tryItButton" || e.target.id === "watchVideoBtn" || e.target.id === "watchExampleBtn" || e.target.id === "gifBtnYes" || e.target.id === "gifBtnAgain" || e.target.id === "nextTaskButton" || e.target.closest("#gifModal") || e.target.closest("#helpBanner") || e.target.closest("#completionBox") || e.target.closest("#practiceOptionsContainer") || e.target.closest(".instruction-container")) {
        return;
    }

    // In practice phase (trial 0): block screen and target pinch touches during demo animation or until "Start Practice" is clicked
    if (sessionNumber === 1 && trialNumber === 0) {
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
            return; // Ignore all touches on screen and targets while demo is running or options are shown
        }
    }

    // If modal is open or task is completed, do nothing
    if (window.isModalOpen || (trialNumber >= TRIAL_LIMIT && !taskActive) || isBetweenTrials) {
        e.preventDefault();
        return;
    }

    if (sessionNumber === 1 && trialNumber === 0) {
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
            if (!helpBanner || !helpBanner.contains(e.target)) {
                if (helpBanner) helpBanner.style.display = "none";

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







    if (touches.length >= 2) {
        // Clear any pending warning timer and restore normal text
        if (warningTimeout) {
            clearTimeout(warningTimeout);
            warningTimeout = null;
        }

        // Distinguish between Index (higher up, lower Y) and Thumb (lower down, higher Y)
        let sortedTouches = Array.from(touches).sort((a, b) => a.clientY - b.clientY);
        let indexTouch = sortedTouches[0];
        let thumbTouch = sortedTouches[sortedTouches.length - 1];

        const x1 = indexTouch.clientX;
        const y1 = indexTouch.clientY;
        const x2 = thumbTouch.clientX;
        const y2 = thumbTouch.clientY;
        const dx = x1 - x2;
        const dy = y1 - y2;
        const distPx = Math.sqrt(dx * dx + dy * dy);



        // Store touch identifiers to distinguish partial lift-offs
        indexTouchId = indexTouch.identifier;
        thumbTouchId = thumbTouch.identifier;

        if (!taskActive) {
            // Check target containment to start the trial
            if (!savingTrial) {
                const oneInTop = isTouchInsideElement(indexTouch, topTarget, 35) || isTouchInsideElement(thumbTouch, topTarget, 35);
                const oneInBottom = isTouchInsideElement(indexTouch, bottomTarget, 35) || isTouchInsideElement(thumbTouch, bottomTarget, 35);

                if (oneInTop && oneInBottom) {
                    if (sessionNumber === 1 && trialNumber === 0) {
                        practiceStep = 'active_practice';
                        if (inactivityTimer) clearTimeout(inactivityTimer);
                    }
                    requiresReset = false;
                    maxStrokeDistance = distPx;
                    strokeStartDistance = distPx;
                    strokeStartTime = now;
                    startPinchTrial(now);
                } else {
                    if (sessionNumber === 1) {
                        showPinchPracticeErrorModal("Place your fingers on the circles, spread them apart, and lift.");
                    }
                }
            }
        } else {
            // During the active trial
            if (requiresReset) {
                // Enforce placing fingers back inside baseline circles to resume trial (from 0 touches)
                const oneInTop = isTouchInsideElement(indexTouch, topTarget, 35) || isTouchInsideElement(thumbTouch, topTarget, 35);
                const oneInBottom = isTouchInsideElement(indexTouch, bottomTarget, 35) || isTouchInsideElement(thumbTouch, bottomTarget, 35);

                if (oneInTop && oneInBottom) {
                    requiresReset = false; // Recovered!
                    maxStrokeDistance = distPx; // Initialize max distance for this new stroke!
                    strokeStartDistance = distPx;
                    strokeStartTime = now;
                } else {
                    if (sessionNumber === 1) {
                        showPinchPracticeErrorModal("Place your fingers back on the circles, spread them apart, and lift.");
                    }

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
            if (strokeStartDistance === 0) {
                strokeStartDistance = distPx;
            }
            if (strokeStartTime === 0) {
                strokeStartTime = now;
            }

            // Practice phase validations
            if (sessionNumber === 1) {
                const strokeAge = now - strokeStartTime;

                // Ignore inward check during the initial 300ms touch landing settlement phase
                if (strokeAge > 300) {
                    const hasOpened = (maxStrokeDistance > strokeStartDistance + 40);

                    // Require the participant to pinch inward fully (fingers brought together <80px or collapsed by >100px) before showing practice tip
                    const isFullyPinchedInward = (distPx < 80) || (hasOpened && distPx < maxStrokeDistance - 100);

                    if (isFullyPinchedInward) {
                        showPinchPracticeErrorModal(getInwardErrorMessage());
                        return;
                    }
                }

                // Check if user holds fingers stationary on guide circles for >2.5s without spreading apart
                // if (strokeAge > 2500 && maxStrokeDistance < strokeStartDistance + 35) {
                //     showPinchPracticeErrorModal("Please spread your fingers apart as wide and fast as possible.");
                //     return;
                // }
            }

            // Lock circles to monotonically non-decreasing distance during active pinching
            if (distPx >= maxStrokeDistance) {
                maxStrokeDistance = distPx;

                // Dynamically position target circles directly under the user's touch points
                topTarget.style.transition = "none";
                topTarget.style.left = `${x1}px`;
                topTarget.style.top = `${y1}px`;
                topTarget.style.transform = "translate(-50%, -50%)";

                bottomTarget.style.transition = "none";
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
            setInstruction(ORIGINAL_INSTRUCTION);

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
            // Check if user lifted fingers without spreading circles wide (only in practice phase)
            // if (sessionNumber === 1 && maxStrokeDistance < strokeStartDistance + 40) {
            //     showPinchPracticeErrorModal("Please spread your fingers apart as wide and fast as possible.");
            //     return;
            // }

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

                    setInstruction(ORIGINAL_INSTRUCTION);
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

                setInstruction(ORIGINAL_INSTRUCTION);
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
    const watchExampleBtn = document.getElementById("watchExampleBtn");
    if (watchExampleBtn) {
        watchExampleBtn.style.display = (sessionNumber === 1 && (practiceStep === 'initial_demo_waiting' || practiceStep === 'try_button_shown') && trialNumber === 0) ? "inline-block" : "none";
    }
    if (timerLine) {
        timerLine.style.display = showTimeRemaining ? "block" : "none";
        if (showTimeRemaining && timerBadge) {
            timerBadge.innerText = secondsLeft;
        }
    }
    if (attemptsCounter) {
        let showAttempts = false;
        if (sessionNumber === 1) {
            // Practice phase: only show once they started practice (waiting for touch) or during trials
            if ((practiceStep === 'waiting_for_touch' || trialNumber > 0) && !taskCompleted) {
                showAttempts = true;
            }
        } else {
            // Main phase: show during active session
            if (!taskCompleted) {
                showAttempts = true;
            }
        }

        const displayTrial = taskActive ? trialNumber : Math.min(trialNumber + 1, TRIAL_LIMIT);
        if (showAttempts && displayTrial <= TRIAL_LIMIT) {
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

    const watchExampleBtn = document.getElementById("watchExampleBtn");
    if (watchExampleBtn) watchExampleBtn.style.display = "inline-block";

    practiceStep = 'initial_demo_waiting';
    demoTrialNumber = 1;
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
            e.stopPropagation();
            e.preventDefault();
        });
    }

    const openGifModal = () => {
        openGifModalFn = openGifModal;
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
        addInstantButtonHandler(tryItButton, (e) => {
            stopDemoAnimation();
            const optionsOverlay = document.getElementById("practiceOptionsOverlay");
            if (optionsOverlay) optionsOverlay.style.display = "none";
            if (optionsContainer) optionsContainer.style.display = "none";
            const watchExampleBtn = document.getElementById("watchExampleBtn");
            if (watchExampleBtn) watchExampleBtn.style.display = "none";

            // Un-dim background elements
            ['taskHeader', 'pinchArea'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.remove("dimmed");
            });

            practiceStep = 'waiting_for_touch';
            updateInstructions(true, (sessionNumber === 1) ? 5 : 10);
        });
    }

    if (watchVideoBtn) {
        addInstantButtonHandler(watchVideoBtn, (e) => {
            openGifModal();
        });
    }

    if (helpBanner) {
        addInstantButtonHandler(helpBanner, (e) => {
            openGifModal();
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

            // Start the hand demo animation
            practiceStep = 'initial_demo_animating';
            demoTrialNumber = 1;
            startDemoAnimation();
        });
    }

    if (gifBtnYes) {
        addInstantButtonHandler(gifBtnYes, (e) => {
            if (gifTimer) clearTimeout(gifTimer);
            if (gifModal) {
                gifModal.style.display = "none";
                gifModal.classList.remove("show");
            }
            window.isModalOpen = false;

            practiceStep = 'waiting_for_touch';
            updateInstructions(true, (sessionNumber === 1) ? 5 : 10);
        });
    }

    if (gifBtnAgain) {
        addInstantButtonHandler(gifBtnAgain, (e) => {
            openGifModal();
        });
    }

    openGifModalFn = openGifModal;
}

// Start Trial
function startPinchTrial(now) {
    taskActive = true;
    setInstruction(ORIGINAL_INSTRUCTION); // Ensure opacity goes to 0 immediately
    trialNumber += 1;
    trialStartTime = now;
    trajectory = [];
    timeRemaining = (sessionNumber === 1) ? 5 : 10;
    requiresReset = false;
    lastIndexX = null;
    lastIndexY = null;
    lastThumbX = null;
    lastThumbY = null;

    firstTouchTime = now;
    const pageLoadTime = parseFloat(sessionStorage.getItem("pinch_page_load") || now);
    initiationDelay = now - pageLoadTime;

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

    // Keep target circles apart during Stop pinching cooldown (so user doesn't pinch back inward)
    topTarget.style.opacity = "0.8";
    bottomTarget.style.opacity = "0.8";

    // Synchronously update screen to disabled transition state at start of stopPinchTrial
    isBetweenTrials = true;
    setInstruction("Stop pinching");
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
            resetTargetPositions(); // Reset back to center now for the next trial
            setInstruction(ORIGINAL_INSTRUCTION);
            updateInstructions(true, (sessionNumber === 1) ? 5 : 10);
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

async function finishAndNavigate() {
    const nextBtn = document.getElementById("nextTaskButton");
    if (nextBtn) nextBtn.disabled = true;
    try {
        if (sessionId && sessionNumber !== 1) {
            const { error } = await supabase
                .from('sessions')
                .update({ completed: true })
                .eq('id', sessionId);
            if (error) console.error("Failed to mark session completed:", error);
        }
    } catch (err) {
        console.error("Unexpected error while finishing session:", err);
    } finally {
        window.location.href = "../hold/hold.html?v=100";
    }
}

// End Task
function endPinchTask() {
    taskCompleted = true;
    // Save state
    sessionStorage.setItem("pinch_completed", "true");

    // Remove listeners
    document.removeEventListener("touchstart", handleTouch, { passive: false });
    document.removeEventListener("touchmove", handleTouch, { passive: false });
    document.removeEventListener("touchend", handleTouch, { passive: false });
    document.removeEventListener("touchcancel", handleTouch, { passive: false });

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
    const attemptsCounter = document.getElementById("attemptsCounter");
    if (attemptsCounter) attemptsCounter.classList.add("dimmed");

    topTarget.style.display = "none";
    bottomTarget.style.display = "none";
    liveDistanceLabel.style.display = "none";
    instructionEl.style.display = "none";

    const completionText = document.getElementById("completionText");
    if (completionText) {
        if (sessionNumber === 1) {
            completionText.innerText = "✅ Practice Complete";
        } else {
            completionText.innerText = "✅ Task Complete";
        }
    }

    completionBox.style.display = "flex";
    addInstantButtonHandler(completionBox, () => {
        finishAndNavigate();
    });
    const nextButton = document.getElementById("nextTaskButton");
    if (nextButton) {
        addInstantButtonHandler(nextButton, () => {
            finishAndNavigate();
        });
    }

    // Setup inactivity continue pointer after 2 seconds of inactivity on completion box
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
    }, 2000);
}

// Page load initialization
sessionStorage.setItem("pinch_page_load", String(Date.now()));
startSession();

// Programmatic zoom prevention (Pinch task requires multi-touch, so gesturestart blocker is used)
document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
}, { passive: false });
document.addEventListener('gesturechange', function (e) {
    e.preventDefault();
}, { passive: false });
document.addEventListener('gestureend', function (e) {
    e.preventDefault();
}, { passive: false });
