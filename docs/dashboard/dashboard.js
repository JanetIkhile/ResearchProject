console.log("index.js running");

import { supabase } from "../client/supabaseClient.js";

const dragBtn = document.getElementById("dragBtn");
const tapBtn = document.getElementById("tapBtn");
const holdBtn = document.getElementById("holdBtn");

(async function initDashboard() {
    // 1. Check authentication
    const { data: { user }, error: userErr } = await supabase.auth.getUser();

    if (userErr) {
        console.error("Error fetching auth user:", userErr);
        window.location.href = "/index.html";
        return;
    }

    if (!user) {
        // Not logged in → go to login
        window.location.href = "/index.html";
        return;
    }

    const participantId = user.id;
    const perUserKey = `session_${participantId}`;

    // 2. Try per-user session id in sessionStorage
    let sessionId = sessionStorage.getItem(perUserKey);

    if (sessionId) {
        // Verify this session exists and belongs to this participant
        try {
            const { data: sessionRow, error: fetchErr } = await supabase
                .from("sessions")
                .select("id, participant_id, completed, started_at")
                .eq("id", sessionId)
                .maybeSingle(); // may return null if not found

            if (fetchErr) {
                console.error("Error fetching session row:", fetchErr);
                sessionId = null;
            } else if (!sessionRow) {
                console.warn("Per-user session id found in sessionStorage but row missing in DB. Creating new session.");
                sessionId = null;
            } else if (sessionRow.participant_id !== participantId) {
                // This should not happen with per-user key, but will check defensively
                console.warn("Stored session belongs to another participant. Overwriting with new session.");
                sessionId = null;
            } else {
                // Session belongs to this user and exists — reuse it
                console.log("Resuming existing session for user:", participantId, sessionId, sessionRow);
            }
        } catch (err) {
            console.error("Unexpected error verifying session:", err);
            sessionId = null;
        }
    }

    // 3. If no valid sessionId, create a new session row and store per-user
    if (!sessionId) {
        try {
            // Let the DB create the id
            const payload = {
                participant_id: participantId,
                started_at: new Date().toISOString(),
                completed: false,
                drag_completed: false,
                tap_completed: false,
                hold_completed: false
            };

            // insert and return id (use .single() to get the inserted row)
            const { data: inserted, error: insertErr } = await supabase
                .from("sessions")
                .insert(payload)
                .select("id")
                .single();

            if (insertErr) {
                console.error("Failed to create session:", insertErr);
                alert("Something went wrong starting your session. Please reload.");
                return;
            }

            sessionId = inserted.id;
            sessionStorage.setItem(perUserKey, sessionId);
            console.log("New session started for user:", participantId, sessionId);
        } catch (err) {
            console.error("Unexpected error creating session:", err);
            alert("Something went wrong starting your session. Please reload.");
            return;
        }
    }

    // Expose sessionId globally if needed by other modules
    window.CURRENT_SESSION_ID = sessionId;

    // Defensive: ensure DOM refs exist
    if (!dragBtn || !tapBtn || !holdBtn) {
        console.warn("One or more task buttons not found in DOM. Skipping button state setup.");
        return;
    }

    // Default UI state: only Drag enabled initially
    dragBtn.disabled = false;
    tapBtn.disabled = true;
    holdBtn.disabled = true;

    // Attach navigation handlers (always allow clicking drag)
    dragBtn.onclick = () => { window.location.href = "../drag/drag.html"; };
    tapBtn.onclick = () => { window.location.href = "../tap/tap.html"; };
    holdBtn.onclick = () => { window.location.href = "../hold/hold.html"; };

    // Fetch session flags to enable subsequent tasks if already completed
    try {
        const { data: sessionRow, error: flagsErr } = await supabase
            .from("sessions")
            .select("drag_completed, tap_completed, hold_completed")
            .eq("id", sessionId)
            .single();

        if (flagsErr) {
            console.error("Failed to fetch session flags:", flagsErr);
            // keep default: only drag enabled
            return;
        }

        // Enable Tap only if drag_completed true
        if (sessionRow.drag_completed) {
            tapBtn.disabled = false;
        } else {
            tapBtn.disabled = true;
        }

        // Enable Hold only if tap_completed true
        if (sessionRow.tap_completed) {
            holdBtn.disabled = false;
        } else {
            holdBtn.disabled = true;
        }
    } catch (err) {
        console.error("Unexpected error fetching/updating button state:", err);
    }
})();
