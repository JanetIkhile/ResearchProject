'use strict';

import { supabase } from "../client/supabaseClient.js";
import { initSession, updateSessionFlags } from "../utils/sessionManager.js";

let participantId = null;
let sessionId = null;
let trialNumber = 0;
const TASK_TYPE = "tap";
let TRIAL_LIMIT = 3;
let TASK_DURATION = 10000;
const INTER_TRIAL_COOLDOWN = 1500;

let taskActive = false;
let isBetweenTrials = true;
let taskTimer = null;
let timerInterval = null;
let tapEvents = [];
let tapTrajectory = [];
let taskCompleted = false;
let sessionNumber = null;
let savingInProgress = false;

// Progressive disclosure practice states
let practiceStep = 'initial_demo'; // 'initial_demo', 'try_button_shown', 'waiting_for_touch', 'help_banner_shown', 'detailed_demo', 'gif_ready_prompt', 'active_practice'
let demoLoopCount = 0;
let isFingerDemoAnimating = false;
let demoCountdownInterval = null;
let demoTapInterval = null;
let demoTrialNumber = 1;
let inactivityTimer = null;
let gifTimer = null;
let continueInactivityTimer = null;
let demoPointer = null;

function showTapPracticeErrorModal(message) {
    if (sessionNumber !== 1) return; // Only in practice phase
    if (document.getElementById("practiceErrorModal")) return;

    // Abort active trial if active
    if (taskActive) {
        clearTimers();
        taskActive = false;
        isBetweenTrials = true;
        trialNumber--; // decrement so they repeat this trial

        // Reset targets back to default initial state (top active, bottom inactive)
        expectedTarget = "top";
        if (topTarget) {
            topTarget.classList.remove("inactive");
            topTarget.classList.add("active");
            topTarget.style.pointerEvents = 'auto';
        }
        if (bottomTarget) {
            bottomTarget.classList.remove("active");
            bottomTarget.classList.add("inactive");
            bottomTarget.style.pointerEvents = 'auto';
        }

        updateInstructions(false);
    }

    const modalDiv = document.createElement("div");
    modalDiv.id = "practiceErrorModal";
    modalDiv.style.position = "fixed";
    modalDiv.style.top = "0";
    modalDiv.style.left = "0";
    modalDiv.style.width = "100%";
    modalDiv.style.height = "100%";
    modalDiv.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
    modalDiv.style.display = "flex";
    modalDiv.style.justifyContent = "center";
    modalDiv.style.alignItems = "center";
    modalDiv.style.zIndex = "9999";

    // Stop all touch and click events from bubbling up to document background
    ["touchstart", "touchmove", "touchend", "mousedown", "mouseup", "click"].forEach(evtName => {
        modalDiv.addEventListener(evtName, (e) => {
            e.stopPropagation();
        });
    });

    const contentDiv = document.createElement("div");
    contentDiv.style.backgroundColor = "white";
    contentDiv.style.padding = "32px 40px";
    contentDiv.style.borderRadius = "16px";
    contentDiv.style.boxShadow = "0 12px 30px rgba(0,0,0,0.25)";
    contentDiv.style.maxWidth = "460px";
    contentDiv.style.width = "85%";
    contentDiv.style.textAlign = "center";
    contentDiv.style.fontFamily = "'Outfit', 'Inter', sans-serif";

    const title = document.createElement("h3");
    title.innerText = "⚠️ Practice Tip";
    title.style.margin = "0 0 16px 0";
    title.style.color = "#ea580c";
    title.style.fontSize = "26px";

    const msg = document.createElement("p");
    msg.innerText = message;
    msg.style.margin = "0 0 24px 0";
    msg.style.fontSize = "19px";
    msg.style.lineHeight = "1.6";
    msg.style.color = "#374151";

    const btn = document.createElement("button");
    btn.innerText = "Okay";
    btn.style.backgroundColor = "#003366";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.padding = "14px 28px";
    btn.style.fontSize = "18px";
    btn.style.fontWeight = "bold";
    btn.style.borderRadius = "8px";
    btn.style.cursor = "pointer";
    btn.style.width = "100%";

    btn.addEventListener("click", () => {
        modalDiv.remove();
        // Allow restarting
        isBetweenTrials = true;
        lastTrialEndTime = Date.now();
    });

    contentDiv.appendChild(title);
    contentDiv.appendChild(msg);
    contentDiv.appendChild(btn);
    modalDiv.appendChild(contentDiv);
    document.body.appendChild(modalDiv);
}


let trialStartTime = null;

let topTarget = null;
let bottomTarget = null;
let expectedTarget = "top"; // Alternates: "top" or "bottom"
let nextButton = null;
let tapInstruction = null;
let countdown = null;
let timerLine = null;
let timerBadge = null;
let attemptsCounter = null;

let pageLoadTime = Date.now();
let lastTrialEndTime = pageLoadTime;
let initiationDelay = null;

function isTouchInsideTarget(touch, targetEl) {
    if (!targetEl) return false;
    const rect = targetEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = touch.pageX - centerX;
    const dy = touch.pageY - centerY;
    const radius = Math.min(rect.width, rect.height) / 2;
    return (dx * dx + dy * dy) <= (radius * radius);
}

function toggleExpectedTarget() {
    if (expectedTarget === "top") {
        expectedTarget = "bottom";
        if (topTarget) {
            topTarget.classList.remove("active");
            topTarget.classList.add("inactive");
        }
        if (bottomTarget) {
            bottomTarget.classList.remove("inactive");
            bottomTarget.classList.add("active");
        }
    } else {
        expectedTarget = "top";
        if (bottomTarget) {
            bottomTarget.classList.remove("active");
            bottomTarget.classList.add("inactive");
        }
        if (topTarget) {
            topTarget.classList.remove("inactive");
            topTarget.classList.add("active");
        }
    }
}

// attach handler reference so we can remove it later

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
        ['taskHeader', 'tapArea', 'topTarget', 'bottomTarget'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add("dimmed");
        });
        return;
    }

    // Start a 5-second trial simulation
    const timerLine = document.getElementById("timerLine");
    if (timerLine) timerLine.style.display = "none"; // Hide timer badge and label during initial demo
    const countdown = document.getElementById("countdown");
    let remainingTime = 5;
    if (countdown) countdown.innerText = remainingTime;

    // Show demo pointer
    if (demoPointer) demoPointer.style.opacity = "1";

    let tapStep = 0; // 0 = tap top, 1 = tap bottom

    // Animate pointer tapping back and forth every 500ms
    demoTapInterval = setInterval(() => {
        if (trialNumber > 0 || taskActive || taskCompleted || !demoPointer) {
            clearInterval(demoTapInterval);
            return;
        }

        const tRect = topTarget.getBoundingClientRect();
        const bRect = bottomTarget.getBoundingClientRect();
        const tX = tRect.left + tRect.width / 2 - 30;
        const tY = tRect.top + tRect.height / 2;
        const bX = bRect.left + bRect.width / 2 - 30;
        const bY = bRect.top + bRect.height / 2;

        if (tapStep === 0) {
            // Tap top target
            expectedTarget = "top";
            if (topTarget) {
                topTarget.classList.remove("inactive");
                topTarget.classList.add("active");
            }
            if (bottomTarget) {
                bottomTarget.classList.remove("active");
                bottomTarget.classList.add("inactive");
            }
            demoPointer.style.transition = "none";
            demoPointer.style.left = `${tX}px`;
            demoPointer.style.top = `${tY}px`;
            demoPointer.style.transform = "scale(0.75)";
            setTimeout(() => {
                if (demoPointer) demoPointer.style.transform = "scale(1.0)";
            }, 100);
            tapStep = 1;
        } else {
            // Tap bottom target
            expectedTarget = "bottom";
            if (bottomTarget) {
                bottomTarget.classList.remove("inactive");
                bottomTarget.classList.add("active");
            }
            if (topTarget) {
                topTarget.classList.remove("active");
                topTarget.classList.add("inactive");
            }
            demoPointer.style.transition = "none";
            demoPointer.style.left = `${bX}px`;
            demoPointer.style.top = `${bY}px`;
            demoPointer.style.transform = "scale(0.75)";
            setTimeout(() => {
                if (demoPointer) demoPointer.style.transform = "scale(1.0)";
            }, 100);
            tapStep = 0;
        }
    }, 500);

    // Countdown interval (every 1 second)
    demoCountdownInterval = setInterval(() => {
        remainingTime -= 1;
        if (countdown) countdown.innerText = Math.max(0, remainingTime);

        if (remainingTime <= 0) {
            // End of this 5-second demo trial
            clearInterval(demoCountdownInterval);
            clearInterval(demoTapInterval);

            if (demoPointer) demoPointer.style.opacity = "0";

            // Briefly show "Stop tapping" just like a real trial end!
            const tapInstruction = document.getElementById("tapInstruction");
            const originalInstructionText = tapInstruction ? tapInstruction.innerHTML : "";
            if (tapInstruction) tapInstruction.innerText = "Stop tapping";
            if (timerLine) timerLine.style.display = "none";

            setTimeout(() => {
                if (tapInstruction && originalInstructionText) {
                    tapInstruction.innerHTML = originalInstructionText;
                }
                demoTrialNumber += 1;
                runDemoTrialCycle();
            }, 1200); // 1.2 seconds cooldown
        }
    }, 1000);
}

function startDemoAnimation() {
    if (sessionNumber !== 1) return; // Only practice phase
    if (trialNumber > 0 || taskActive || taskCompleted) return;
    isFingerDemoAnimating = true;

    const tRect = topTarget.getBoundingClientRect();
    const tX = tRect.left + tRect.width / 2 - 30;
    const tY = tRect.top + tRect.height / 2;

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
        demoPointer.innerText = "👆";
        demoPointer.style.opacity = "0";
        demoPointer.style.left = `${tX}px`;
        demoPointer.style.top = `${tY}px`;
        document.body.appendChild(demoPointer);
    } else {
        demoPointer.style.left = `${tX}px`;
        demoPointer.style.top = `${tY}px`;
    }

    demoTrialNumber = 1;
    runDemoTrialCycle();
}

function stopDemoAnimation() {
    if (!isFingerDemoAnimating) return;
    isFingerDemoAnimating = false;
    if (demoCountdownInterval) {
        clearInterval(demoCountdownInterval);
        demoCountdownInterval = null;
    }
    if (demoTapInterval) {
        clearInterval(demoTapInterval);
        demoTapInterval = null;
    }
    if (demoPointer) {
        demoPointer.remove();
        demoPointer = null;
    }
    if (topTarget) {
        topTarget.classList.remove("active");
        topTarget.classList.add("inactive");
    }
    if (bottomTarget) {
        bottomTarget.classList.remove("active");
        bottomTarget.classList.add("inactive");
    }

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
    if (gifModal) {
        gifModal.style.display = "none";
        gifModal.classList.remove("show");
    }
    const watchExampleIndicator = document.getElementById("watchExampleIndicator");
    if (watchExampleIndicator) watchExampleIndicator.style.display = "none";
}

function handleTouchStart(e) {
    if (e.target.id === "tryItButton" || e.target.id === "watchVideoBtn" || e.target.id === "watchExampleBtn" || e.target.id === "gifBtnYes" || e.target.id === "gifBtnAgain" || e.target.closest("#gifModal") || e.target.closest("#helpBanner") || e.target.closest("#completionBox") || e.target.closest("#practiceOptionsContainer")) {
        return; // Let custom button click handlers capture the action
    }

    // In practice phase (trial 0): block target dots and screen taps during demo animation or until "Start Practice" is clicked
    if (sessionNumber === 1 && trialNumber === 0) {
        if (practiceStep === 'options_shown') {
            e.stopPropagation();
            e.preventDefault();
            return;
        }
        if (isFingerDemoAnimating || (practiceStep !== 'waiting_for_touch' && practiceStep !== 'active_practice')) {
            return; // Ignore all touches on dots and screen while demo is running or options are shown
        }
    }

    if (sessionNumber === 1 && trialNumber === 0) {
        if (practiceStep === 'help_banner_shown') {
            const helpBanner = document.getElementById("helpBanner");
            if (helpBanner && !helpBanner.contains(e.target)) {
                helpBanner.style.display = "none";
                practiceStep = 'waiting_for_touch';
                updateInstructions(true);

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

    // block starts while saving is in progress to prevent race
    if (savingInProgress) return;

    // If we've already finished the allowed trials, ignore everything
    if (trialNumber >= TRIAL_LIMIT && !taskActive) return;

    const nextBtn = document.getElementById("nextTaskButton");
    if (nextBtn && nextBtn.contains(e.target)) return;

    e.preventDefault();
    const touch = e.changedTouches[0];
    const now = Date.now();

    const isInsideTop = isTouchInsideTarget(touch, topTarget);
    const isInsideBottom = isTouchInsideTarget(touch, bottomTarget);
    const isInsideAnyTarget = isInsideTop || isInsideBottom;

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

            if (isInsideAnyTarget) {
                // Touched either target: start trial immediately
                practiceStep = 'active_practice';
                updateInstructions(true);
            } else {
                // Touched outside targets: transition to waiting_for_touch and set inactivity timer
                practiceStep = 'waiting_for_touch';
                updateInstructions(true);

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

    // If we're BETWEEN trials, a touch starts the trial ONLY if it hits one of the targets
    if (!taskActive && isBetweenTrials) {
        if (!isInsideTop && !isInsideBottom) {
            showTapPracticeErrorModal("Please tap inside the blue circle.");
            return; // Must hit target to start
        }

        // For practice phase, they MUST start by tapping the highlighted blue circle (topTarget)
        if (sessionNumber === 1 && !isInsideTop) {
            showTapPracticeErrorModal("Please tap the highlighted blue circle.");
            return; // Must hit correct target to start in practice
        }
        if (trialNumber >= TRIAL_LIMIT) return;

        // prevent race double-starts
        if (taskActive) return;

        initiationDelay = now - lastTrialEndTime;
        trialNumber += 1;

        // Set initial expected target to whichever they hit
        if (isInsideTop) {
            expectedTarget = "top";
        } else {
            expectedTarget = "bottom";
        }

        startTapTrial(now);
        recordTapEvent(touch, now, expectedTarget, true);
        recordTrajectoryPoint(touch, now, 'start');

        toggleExpectedTarget();
        return;
    }

    // If a trial is active, record taps based on expected alternation
    if (taskActive) {
        let isHit = false;
        if (expectedTarget === "top" && isInsideTop) {
            isHit = true;
        } else if (expectedTarget === "bottom" && isInsideBottom) {
            isHit = true;
        }

        recordTapEvent(touch, now, expectedTarget, isHit);
        recordTrajectoryPoint(touch, now, 'start');

        if (isHit) {
            toggleExpectedTarget();
        } else {
            if (isInsideTop || isInsideBottom) {
                showTapPracticeErrorModal("Please tap the highlighted blue circle.");
            } else {
                showTapPracticeErrorModal("Please tap inside the blue circles.");
            }
        }
    }
}

function updateInstructions(showTimeRemaining, secondsLeft) {
    if (tapInstruction) {
        tapInstruction.innerHTML = `Use your index finger to tap the highlighted circle<br>alternatively <strong class="highlight-instruction">as fast as possible</strong>!`;
    }

    const indicator = document.getElementById("watchExampleIndicator");

    if (timerLine) {
        timerLine.style.display = showTimeRemaining ? "block" : "none";
        if (showTimeRemaining && timerBadge) {
            timerBadge.innerText = (secondsLeft !== undefined) ? secondsLeft : (TASK_DURATION / 1000);
        }
    }

    if (attemptsCounter) {
        const isDemoPlaying = (sessionNumber === 1 && (practiceStep === 'initial_demo' || practiceStep === 'detailed_demo' || practiceStep === 'options_shown'));
        const displayTrial = taskActive ? trialNumber : Math.min(trialNumber + 1, TRIAL_LIMIT);
        if (displayTrial <= TRIAL_LIMIT && !taskCompleted && !isDemoPlaying) {
            attemptsCounter.style.display = "block";
            attemptsCounter.innerText = `${displayTrial} of ${TRIAL_LIMIT}`;
        } else {
            attemptsCounter.style.display = "none";
        }
    }

    if (sessionNumber === 1 && trialNumber === 0 && !showTimeRemaining && (practiceStep === 'initial_demo' || practiceStep === 'try_button_shown')) {
        if (indicator) indicator.style.display = "inline-block";
    } else {
        if (indicator) indicator.style.display = "none";
    }
}

(async function initContext() {
    try {
        const result = await initSession({ dashboardPath: "/dashboard.html" });
        participantId = result.participantId;
        sessionId = result.sessionId;
        console.log("Session verified:", sessionId, result.sessionRow);

        sessionNumber = (sessionStorage.getItem("session_type") === "practice") ? 1 : result.sessionNumber;

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
            TRIAL_LIMIT = 2;   // 2 practice trials
            TASK_DURATION = 5000; // 5-second practice duration
        } else {
            TRIAL_LIMIT = 3;   // 3 real trials
            TASK_DURATION = 10000; // 10-second real duration
        }

        console.log("Tap task started");
        console.log("Session number:", sessionNumber);
        console.log("Trial limit:", TRIAL_LIMIT);

    } catch (err) {
        return;
    }

    // DOM elements
    topTarget = document.getElementById("topTarget");
    bottomTarget = document.getElementById("bottomTarget");
    nextButton = document.getElementById("nextTaskButton");
    tapInstruction = document.getElementById("tapInstruction");
    countdown = document.getElementById("countdownTimer");
    timerLine = document.getElementById("timerLine");
    timerBadge = document.getElementById("timerBadge");
    attemptsCounter = document.getElementById("attemptsCounter");

    if (!topTarget || !bottomTarget) {
        console.error("Target elements topTarget/bottomTarget not found in DOM.");
        return;
    }

    topTarget.style.touchAction = 'none';
    bottomTarget.style.touchAction = 'none';

    if (sessionNumber === 1) {
        updateInstructions(false);
    } else {
        updateInstructions(true);
    }

    expectedTarget = "top";
    if (topTarget) {
        topTarget.classList.remove("inactive");
        topTarget.classList.add("active");
    }
    if (bottomTarget) {
        bottomTarget.classList.remove("active");
        bottomTarget.classList.add("inactive");
    }

    document.addEventListener("touchstart", handleTouchStart, { passive: false });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });
    initProgressiveDisclosure();
    setTimeout(startDemoAnimation, 500);
})();

// ---------- Start a trial ----------
function startTapTrial(startTs) {
    if (taskCompleted) return;
    if (trialNumber > TRIAL_LIMIT) return;

    clearTimers();

    tapEvents = [];
    tapTrajectory = [];
    taskActive = true;
    isBetweenTrials = false;

    const startTime = startTs || Date.now();
    trialStartTime = startTime;

    if (topTarget && bottomTarget) {
        topTarget.style.pointerEvents = 'auto';
        bottomTarget.style.pointerEvents = 'auto';
        topTarget.style.backgroundColor = "";
        bottomTarget.style.backgroundColor = "";
    }

    // countdown UI
    if (countdown) countdown.style.display = "none";
    let timeLeft = Math.ceil(TASK_DURATION / 1000);
    updateInstructions(true, timeLeft);

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            updateInstructions(true, timeLeft);
        }
        if (timeLeft <= 0 && timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }, 1000);

    if (taskTimer) {
        clearTimeout(taskTimer);
        taskTimer = null;
    }

    taskTimer = setTimeout(async () => {
        // Trial finished — flip states and clear timers
        taskActive = false;
        const reachedFinal = (trialNumber >= TRIAL_LIMIT);
        if (tapInstruction) {
            tapInstruction.innerText = "Stop tapping";
        }
        if (attemptsCounter) {
            attemptsCounter.style.display = "none";
        }
        if (timerLine) {
            timerLine.style.display = "none";
        }

        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        if (countdown) countdown.innerText = "";

        // Block any touch-based starts now (immediate)
        if (topTarget) topTarget.style.pointerEvents = 'none';
        if (bottomTarget) bottomTarget.style.pointerEvents = 'none';

        // mark save in progress
        savingInProgress = true;

        // Save raw behavior only
        try {
            const endTime = Date.now();
            lastTrialEndTime = endTime;
            await saveTapTrial(trialStartTime, endTime);
        } finally {
            savingInProgress = false;
        }

        if (reachedFinal) {
            if (!taskCompleted) {
                taskCompleted = true;
                try {
                    await updateSessionFlags(sessionId, { tap: true });
                } catch (err) {
                    console.error("Failed to update session tap flag:", err);
                }
            }

            // final cleanup
            try {
                document.removeEventListener("touchstart", handleTouchStart, { passive: false });
                document.removeEventListener("touchmove", handleTouchMove, { passive: false });
                document.removeEventListener("touchend", handleTouchEnd, { passive: false });
            } catch (e) {
                try {
                    document.removeEventListener("touchstart", handleTouchStart);
                    document.removeEventListener("touchmove", handleTouchMove);
                    document.removeEventListener("touchend", handleTouchEnd);
                } catch (er) { }
            }
            if (topTarget) topTarget.style.pointerEvents = 'none';
            if (bottomTarget) bottomTarget.style.pointerEvents = 'none';

            // Allow "Stop tapping" to display clearly for 1.2s before completion modal appears
            setTimeout(() => {
                const completionText = document.getElementById("completionText");
                if (completionText) {
                    if (sessionNumber === 1) {
                        completionText.innerText = "✅ Practice Complete";
                    } else {
                        completionText.innerText = "✅ Task Complete";
                    }
                }

                // Dim background task elements during task completion (practice and main phase)
                const elementsToDim = ['taskHeader', 'tapArea', 'topTarget', 'bottomTarget', 'attemptsCounter'];
                elementsToDim.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.classList.add("dimmed");
                });

                const nextButton = document.getElementById('nextTaskButton');
                if (nextButton) {
                    nextButton.innerText = "Continue ➔";
                    nextButton.style.display = 'block';
                }
                document.getElementById("completionBox").style.display = "flex";
                if (tapInstruction) tapInstruction.style.display = "none";
                if (countdown) countdown.style.display = "none";
            }, 1200);

            // Show clicking hand animation if they are inactive for 5 seconds on completion screen
            if (continueInactivityTimer) clearTimeout(continueInactivityTimer);
            continueInactivityTimer = setTimeout(() => {
                const completionBox = document.getElementById("completionBox");
                if (nextButton && completionBox && completionBox.style.display === "flex" && !document.getElementById("continuePointer")) {
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
        } else {
            // non-final: wait cooldown then re-enable start
            if (tapInstruction) {
                tapInstruction.innerText = "Stop tapping";
            }

            setTimeout(() => {
                isBetweenTrials = true;
                if (topTarget) {
                    topTarget.style.pointerEvents = 'auto';
                    topTarget.style.backgroundColor = "";
                    topTarget.classList.remove("inactive");
                    topTarget.classList.add("active");
                }
                if (bottomTarget) {
                    bottomTarget.style.pointerEvents = 'auto';
                    bottomTarget.style.backgroundColor = "";
                    bottomTarget.classList.remove("active");
                    bottomTarget.classList.add("inactive");
                }
                expectedTarget = "top";
                updateInstructions(true);
                if (countdown) countdown.style.display = "none";
            }, INTER_TRIAL_COOLDOWN);
        }

        clearTimers();
    }, TASK_DURATION);
}

// helper timers clear
function clearTimers() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (taskTimer) {
        clearTimeout(taskTimer);
        taskTimer = null;
    }
}

// ---------- record a tap only while a trial is active ----------
function recordTapEvent(touch, ts, expectedTarget, isHit) {
    if (!taskActive) return;

    // Calculate vertical amplitude if there's a previous tap
    let amplitude = null;
    if (tapEvents.length > 0) {
        const lastTap = tapEvents[tapEvents.length - 1];
        amplitude = Math.abs(touch.pageY - lastTap.y);
    }

    const targetEl = (expectedTarget === "top") ? topTarget : bottomTarget;
    let expectedX = null;
    let expectedY = null;
    let expectedR = null;
    if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        expectedX = rect.left + rect.width / 2;
        expectedY = rect.top + rect.height / 2;
        expectedR = rect.width / 2;
    }

    const evt = {
        t: ts || Date.now(),
        x: touch.pageX,
        y: touch.pageY,
        expected_target: expectedTarget,
        target_x: expectedX,
        target_y: expectedY,
        target_radius: expectedR,
        amplitude: amplitude,
        is_inside_target: isHit,
        force: (typeof touch.force === "number") ? touch.force : null
    };
    tapEvents.push(evt);

    // visual feedback on touched target (top or bottom)
    const touchedEl = isTouchInsideTarget(touch, topTarget) ? topTarget : (isTouchInsideTarget(touch, bottomTarget) ? bottomTarget : null);
    if (touchedEl) {
        touchedEl.style.transform = "translateX(-50%) scale(0.9)";
        setTimeout(() => {
            if (touchedEl) {
                touchedEl.style.transform = "translateX(-50%) scale(1)";
            }
        }, 80);
    }
}

function handleTouchMove(e) {
    if (!taskActive) return;
    e.preventDefault();
    const touch = e.changedTouches[0];
    const now = Date.now();
    recordTrajectoryPoint(touch, now, 'move');
}

function handleTouchEnd(e) {
    if (!taskActive) return;
    e.preventDefault();
    const touch = e.changedTouches[0];
    const now = Date.now();
    recordTrajectoryPoint(touch, now, 'end');
}

function recordTrajectoryPoint(touch, ts, type) {
    if (!taskActive) return;
    const pt = {
        t: ts || Date.now(),
        x: touch.pageX,
        y: touch.pageY,
        type: type,
        force: (typeof touch.force === 'number') ? touch.force : null,
        radiusX: (typeof touch.radiusX === 'number') ? touch.radiusX : null,
        radiusY: (typeof touch.radiusY === 'number') ? touch.radiusY : null
    };
    tapTrajectory.push(pt);
}

// ---------- Persist raw taps ----------
async function saveTapTrial(startTime, endTime) {
    const totalTaps = tapEvents.length;

    // Store top target in target_x, target_y, target_radius for backward schema compatibility
    let tX = null, tY = null, tR = null;
    if (topTarget) {
        const rect = topTarget.getBoundingClientRect();
        tX = rect.left + rect.width / 2;
        tY = rect.top + rect.height / 2;
        tR = rect.width / 2;
    }

    const payload = {
        participant_id: participantId,
        session_id: sessionId,
        task_type: TASK_TYPE,
        trial_number: trialNumber,
        timestamp: new Date().toISOString(),

        total_taps: totalTaps,
        total_tap_time_ms: endTime - startTime,
        initiation_delay: initiationDelay,

        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        device_pixel_ratio: window.devicePixelRatio,

        target_x: tX,
        target_y: tY,
        target_radius: tR,

        taps: tapEvents,
        trajectory: tapTrajectory
    };

    try {
        const { error } = await supabase.from("trial_results").insert(payload);
        if (error) {
            print("Failed to save tap trial to DB:", error);
        } else {
            console.log(`Tap trial saved: ${trialNumber} events:`, totalTaps);
        }
    } catch (err) {
        console.error("Unexpected error saving tap trial:", err);
    }
}

// Prevent long-press context menu globally
document.addEventListener("contextmenu", function (e) { e.preventDefault(); });

function resumeDemoAnimationFromOptions() {
    const optionsOverlay = document.getElementById("practiceOptionsOverlay");
    if (optionsOverlay) optionsOverlay.style.display = "none";
    const optionsContainer = document.getElementById("practiceOptionsContainer");
    if (optionsContainer) optionsContainer.style.display = "none";

    // Un-dim background elements
    ['taskHeader', 'tapArea', 'topTarget', 'bottomTarget'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove("dimmed");
    });

    const indicator = document.getElementById("watchExampleIndicator");
    if (indicator) indicator.style.display = "inline-block";

    practiceStep = 'initial_demo';
    demoTrialNumber = 1;
    setTimeout(startDemoAnimation, 300);
}

function initProgressiveDisclosure() {
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
        ['taskHeader', 'tapArea', 'topTarget', 'bottomTarget'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove("dimmed");
        });
        practiceStep = 'detailed_demo';
        const gifModal = document.getElementById("gifModal");
        if (gifModal) {
            gifModal.style.display = "block";
            gifModal.classList.add("show");
        }
        window.isModalOpen = true;

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
            ['taskHeader', 'tapArea', 'topTarget', 'bottomTarget'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.remove("dimmed");
            });

            expectedTarget = "top";
            if (topTarget) {
                topTarget.classList.remove("inactive");
                topTarget.classList.add("active");
            }
            if (bottomTarget) {
                bottomTarget.classList.remove("active");
                bottomTarget.classList.add("inactive");
            }

            practiceStep = 'waiting_for_touch';
            updateInstructions(true);
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
            if (gifModal) {
                gifModal.style.display = "none";
                gifModal.classList.remove("show");
            }
            window.isModalOpen = false;

            expectedTarget = "top";
            if (topTarget) {
                topTarget.classList.remove("inactive");
                topTarget.classList.add("active");
            }
            if (bottomTarget) {
                bottomTarget.classList.remove("active");
                bottomTarget.classList.add("inactive");
            }

            practiceStep = 'waiting_for_touch';
            updateInstructions(true);
        });
    }

    if (gifBtnAgain) {
        gifBtnAgain.addEventListener("click", (e) => {
            e.stopPropagation();
            openGifModal();
        });
    }
}

// Programmatic zoom and multi-touch prevention
document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
}, { passive: false });
document.addEventListener('gesturechange', function (e) {
    e.preventDefault();
}, { passive: false });
document.addEventListener('gestureend', function (e) {
    e.preventDefault();
}, { passive: false });
document.addEventListener('touchstart', function (e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });
