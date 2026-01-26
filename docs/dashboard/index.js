console.log("index.js running");

import { supabase } from "../client/supabaseClient.js";

(async function initDashboard() {
    // 1. Check authentication
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // Not logged in → go to login
        window.location.href = "/index.html";
        return;
    }

    const participantId = user.id;

    // 2. Check if a session already exists for this visit
    let sessionId = sessionStorage.getItem("session_id");

    if (!sessionId) {
        // Create a new session
        sessionId = crypto.randomUUID();

        const { error } = await supabase.from("sessions").insert({
            id: sessionId,
            participant_id: participantId,
            started_at: new Date().toISOString()
        });

        if (error) {
            console.error("Failed to create session:", error);
            alert("Something went wrong starting your session. Please reload.");
            return;
        }

        sessionStorage.setItem("session_id", sessionId);
        console.log("New session started:", sessionId);
    } else {
        console.log("Resuming existing session:", sessionId);
    }
})();

