// shared/sessionManager.js
// shared/sessionManager.js
import { supabase } from "../client/supabaseClient.js";

/**
 * initSession(options)
 * Lab version: uses participant_uuid instead of auth user
 */
export async function initSession({ dashboardPath = "../dashboard/dashboard.html" } = {}) {

    // -----------------------------
    // 1) get participant from sessionStorage
    // -----------------------------
    const participantId = sessionStorage.getItem("participant_uuid");

    if (!participantId) {
        console.warn("No participant found → redirecting");
        window.location.href = "../index.html";
        throw new Error("no-participant");
    }

    const sessionType = sessionStorage.getItem("session_type") || "practice";
    const perUserKey = `session_${participantId}_${sessionType}`;
    let candidateSessionId =
        window.CURRENT_SESSION_ID || sessionStorage.getItem(perUserKey) || sessionStorage.getItem(`session_${participantId}`);

    // -----------------------------
    // 2) no session → redirect to dashboard
    // -----------------------------
    if (!candidateSessionId) {
        console.warn("No session found → redirecting to dashboard");
        window.location.href = dashboardPath;
        throw new Error("no-session");
    }

    // -----------------------------
    // helper: create new session
    // -----------------------------
    async function createNewSession() {
        const payload = {
            participant_id: participantId,
            session_type: sessionStorage.getItem("session_type"),
            started_at: new Date().toISOString(),
            completed: false,
            drag_completed: false,
            tap_completed: false,
            pinch_completed: false,
            hold_completed: false
        };

        const { data: inserted, error } = await supabase
            .from("sessions")
            .insert(payload)
            .select("id, started_at")
            .single();

        if (error) {
            console.error("Failed to create new session:", error);
            throw error;
        }

        const newId = inserted.id;

        sessionStorage.setItem(perUserKey, newId);
        window.CURRENT_SESSION_ID = newId;

        console.log("Created new session:", newId);

        return newId;
    }

    // -----------------------------
    // 3) fetch session row
    // -----------------------------
    const { data: sessionRow, error: fetchErr } = await supabase
        .from("sessions")
        .select("id, participant_id, completed, completed_at, drag_completed, tap_completed, hold_completed, started_at")
        .eq("id", candidateSessionId)
        .maybeSingle();

    if (fetchErr) {
        console.error("Error fetching session:", fetchErr);
        window.location.href = dashboardPath;
        throw new Error("session-fetch-error");
    }

    if (!sessionRow) {
        console.warn("Session not found → redirecting");
        window.location.href = dashboardPath;
        throw new Error("session-not-found");
    }

    if (sessionRow.participant_id !== participantId) {
        console.warn("Session belongs to another participant");
        window.location.href = dashboardPath;
        throw new Error("session-wrong-owner");
    }

    // -----------------------------
    // 4) if completed → do NOT create new session on task pages
    // -----------------------------
    if (sessionRow.completed) {
        const { data: sessions } = await supabase
            .from("sessions")
            .select("id, started_at")
            .eq("participant_id", participantId)
            .order("started_at", { ascending: true });

        let sessionNumber = sessions.findIndex(s => s.id === sessionRow.id) + 1;
        if (sessionNumber === 0) sessionNumber = sessions.length;

        return {
            participantId,
            sessionId: sessionRow.id,
            sessionRow,
            sessionNumber
        };
    }

    // -----------------------------
    // 5) persist valid session
    // -----------------------------
    sessionStorage.setItem(perUserKey, sessionRow.id);
    window.CURRENT_SESSION_ID = sessionRow.id;

    // -----------------------------
    // GET SESSION NUMBER
    // -----------------------------
    const { data: sessions } = await supabase
        .from("sessions")
        .select("id, started_at")
        .eq("participant_id", participantId)
        .order("started_at", { ascending: true });

    // session index (1-based)
    let sessionNumber = sessions.findIndex(s => s.id === sessionRow.id) + 1;

    // fallback
    if (sessionNumber === 0) sessionNumber = sessions.length;

    return {
        participantId,
        sessionId: sessionRow.id,
        sessionRow,
        sessionNumber
    };
}

/**
 * updateSessionFlags(sessionId, {drag, tap, hold})
 * - Updates any provided boolean flags on sessions table.
 * - Then checks whether all three task flags are true and marks completed + completed_at if so.
 */
export async function updateSessionFlags(sessionId, { drag = null, tap = null, pinch = null, hold = null } = {}) {
    if (!sessionId) throw new Error("missing-sessionId");

    const updates = {};
    if (drag !== null) updates.drag_completed = !!drag;
    if (tap !== null) updates.tap_completed = !!tap;
    if (pinch !== null) updates.pinch_completed = !!pinch;
    if (hold !== null) updates.hold_completed = !!hold;

    if (Object.keys(updates).length > 0) {
        try {
            const { error: upErr } = await supabase
                .from("sessions")
                .update(updates)
                .eq("id", sessionId);

            if (upErr) {
                console.error("Failed to update session flags:", upErr);
            }
        } catch (err) {
            console.warn("Could not update session flags:", err);
        }
    }

    // fetch current flags (include completed_at)
    const { data: sessionRow, error: fetchErr } = await supabase
        .from("sessions")
        .select("drag_completed, tap_completed, pinch_completed, hold_completed, completed, completed_at")
        .eq("id", sessionId)
        .maybeSingle();

    if (fetchErr || !sessionRow) {
        console.error("Failed to fetch session after update:", fetchErr);
        return { allDone: false };
    }

    const allDone = !!sessionRow.drag_completed && 
                    !!sessionRow.tap_completed && 
                    !!sessionRow.pinch_completed && 
                    !!sessionRow.hold_completed;

    if (allDone && !sessionRow.completed) {
        const { error: completeErr } = await supabase
            .from("sessions")
            .update({ completed: true, completed_at: new Date().toISOString() })
            .eq("id", sessionId);

        if (completeErr) {
            console.error("Failed to mark completed:", completeErr);
        }
    }

    return { ...sessionRow, allDone };
}

/**
 * optional helper: fetchSession(sessionId)
 */
export async function fetchSession(sessionId) {
    const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .maybeSingle();
    if (error) throw error;
    return data;
}
