// shared/sessionManager.js
import { supabase } from "../client/supabaseClient.js";

/**
 * initSession(options)
 * - Verifies the current signed-in user and resolves a session id.
 * - Prefers window.CURRENT_SESSION_ID, then session_<participantId>.
 * - If no valid session exists, redirects to the provided dashboardPath.
 *
 * Returns: { participantId, sessionId, sessionRow } on success.
 */
export async function initSession({ dashboardPath = "/dashboard/dashboard.html" } = {}) {
    // 1) get auth user
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
        console.error("Error fetching auth user:", userErr);
        window.location.href = "/index.html";
        throw new Error("no-user");
    }
    if (!user) {
        window.location.href = "/index.html";
        throw new Error("no-user");
    }
    const participantId = user.id;

    // 2) resolve candidate session id
    const perUserKey = `session_${participantId}`;
    let candidateSessionId = window.CURRENT_SESSION_ID || sessionStorage.getItem(perUserKey);

    if (!candidateSessionId) {
        console.warn("No session id found for user. Redirecting to dashboard to start session.");
        window.location.href = dashboardPath;
        throw new Error("no-session");
    }

    // helper: create a new session for this participant and persist it locally
    async function createNewSession() {
        const payload = {
            participant_id: participantId,
            started_at: new Date().toISOString(),
            completed: false,
            drag_completed: false,
            tap_completed: false,
            hold_completed: false
        };
        const { data: inserted, error: insertErr } = await supabase
            .from("sessions")
            .insert(payload)
            .select("id, started_at")
            .single();

        if (insertErr) {
            console.error("Failed to create new session:", insertErr);
            throw insertErr;
        }
        const newId = inserted.id;
        sessionStorage.setItem(perUserKey, newId);
        window.CURRENT_SESSION_ID = newId;
        console.log("Created new session for user:", participantId, newId);
        return newId;
    }

    // 3) verify session row belongs to user
    const { data: sessionRow, error: fetchErr } = await supabase
        .from("sessions")
        .select("id, participant_id, completed, completed_at, drag_completed, tap_completed, hold_completed, started_at")
        .eq("id", candidateSessionId)
        .maybeSingle();

    if (fetchErr) {
        console.error("Error fetching session row:", fetchErr);
        window.location.href = dashboardPath;
        throw new Error("session-fetch-error");
    }
    if (!sessionRow) {
        console.warn("Session id provided does not exist in DB. Redirecting to dashboard.");
        window.location.href = dashboardPath;
        throw new Error("session-not-found");
    }
    if (sessionRow.participant_id !== participantId) {
        console.warn("Session belongs to another user. Redirecting to dashboard.");
        window.location.href = dashboardPath;
        throw new Error("session-wrong-owner");
    }

    // NEW: if the candidate session is already completed, create & use a fresh session
    if (sessionRow.completed) {
        console.info("Candidate session is already completed — creating a new session for user.");
        const newSessionId = await createNewSession();

        // fetch the newly created row to return its data
        const { data: newRow, error: newFetchErr } = await supabase
            .from("sessions")
            .select("id, participant_id, completed, completed_at, drag_completed, tap_completed, hold_completed, started_at")
            .eq("id", newSessionId)
            .single();

        if (newFetchErr) {
            console.error("Created a new session but failed to fetch it:", newFetchErr);
            // still persist the id and return minimal info
            return { participantId, sessionId: newSessionId, sessionRow: null };
        }

        // persist and return new session
        sessionStorage.setItem(perUserKey, newSessionId);
        window.CURRENT_SESSION_ID = newSessionId;
        return { participantId, sessionId: newSessionId, sessionRow: newRow };
    }

    // persist per-user key for future reloads (existing, unfinished session)
    sessionStorage.setItem(perUserKey, sessionRow.id);
    window.CURRENT_SESSION_ID = sessionRow.id;

    return { participantId, sessionId: sessionRow.id, sessionRow };
}

/**
 * updateSessionFlags(sessionId, {drag, tap, hold})
 * - Updates any provided boolean flags on sessions table.
 * - Then checks whether all three task flags are true and marks completed + completed_at if so.
 */
export async function updateSessionFlags(sessionId, { drag = null, tap = null, hold = null } = {}) {
    if (!sessionId) throw new Error("missing-sessionId");

    const updates = {};
    if (drag !== null) updates.drag_completed = !!drag;
    if (tap !== null) updates.tap_completed = !!tap;
    if (hold !== null) updates.hold_completed = !!hold;

    if (Object.keys(updates).length > 0) {
        const { error: upErr } = await supabase
            .from("sessions")
            .update(updates)
            .eq("id", sessionId);

        if (upErr) {
            console.error("Failed to update session flags:", upErr);
            throw upErr;
        }
    }

    // fetch current flags (include completed_at)
    const { data: sessionRow, error: fetchErr } = await supabase
        .from("sessions")
        .select("drag_completed, tap_completed, hold_completed, completed, completed_at")
        .eq("id", sessionId)
        .maybeSingle();

    if (fetchErr || !sessionRow) {
        console.error("Failed to fetch session after update:", fetchErr);
        throw fetchErr || new Error("session-missing-after-update");
    }

    const allDone = !!sessionRow.drag_completed && !!sessionRow.tap_completed && !!sessionRow.hold_completed;
    if (allDone && !sessionRow.completed) {
        const { error: completeErr } = await supabase
            .from("sessions")
            .update({ completed: true, completed_at: new Date().toISOString() })
            .eq("id", sessionId);

        if (completeErr) {
            console.error("Failed to mark completed:", completeErr);
            throw completeErr;
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
