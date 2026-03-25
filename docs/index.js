import { supabase } from "./client/supabaseClient.js";

console.log("lab login loaded");

// -----------------------------
// ELEMENTS
// -----------------------------
const participantSelect = document.getElementById("username");
const loginBtn = document.getElementById("loginBtn");
const nextBtn = document.getElementById("nextBtn");
const errorEl = document.getElementById("error");

// -----------------------------
// INIT
// -----------------------------
populateParticipants();

// -----------------------------
// Populate dropdown + disable completed
// -----------------------------
async function populateParticipants() {
    try {
        // Get participants
        const { data: participants, error: pError } = await supabase
            .from("participants")
            .select("id, participant_code");

        if (pError) throw pError;

        // Get sessions
        const { data: sessions, error: sError } = await supabase
            .from("sessions")
            .select("participant_id");

        if (sError) throw sError;

        // Count sessions per participant UUID
        const sessionCountMap = {};

        sessions.forEach(s => {
            sessionCountMap[s.participant_id] =
                (sessionCountMap[s.participant_id] || 0) + 1;
        });

        // Populate P01–P30
        for (let i = 1; i <= 30; i++) {
            const code = `P${String(i).padStart(2, "0")}`;

            const option = document.createElement("option");
            option.value = code;

            // Find participant in DB
            const participant = participants.find(
                p => p.participant_code === code
            );

            let count = 0;

            if (participant) {
                count = sessionCountMap[participant.id] || 0;
            }

            option.textContent = `${code} (${count} sessions)`;

            // Disable if already has 2+ sessions
            if (count >= 2) {
                option.disabled = true;
            }

            participantSelect.appendChild(option);
        }

    } catch (err) {
        console.error(err);
        errorEl.textContent = "Failed to load participants.";
    }
}

// -----------------------------
// Auto-select next available
// -----------------------------
nextBtn.onclick = () => {
    for (let option of participantSelect.options) {
        if (!option.value) continue;

        if (!option.disabled) {
            participantSelect.value = option.value;
            return;
        }
    }

    alert("All participants already have 2+ sessions.");
};

// -----------------------------
// START SESSION (login flow)
// -----------------------------
loginBtn.onclick = async () => {
    errorEl.textContent = "";

    const participantCode = participantSelect.value;

    // ---------- VALIDATION ----------
    if (!participantCode) {
        errorEl.textContent = "Please select a participant.";
        return;
    }

    try {
        // ---------- GET OR CREATE PARTICIPANT ----------
        let { data: participant, error } = await supabase
            .from("participants")
            .select("id")
            .eq("participant_code", participantCode)
            .maybeSingle();

        if (error) throw error;

        if (!participant) {
            const { data: newParticipant, error: insertError } = await supabase
                .from("participants")
                .insert({
                    participant_code: participantCode
                })
                .select()
                .single();

            if (insertError) throw insertError;

            participant = newParticipant;
        }

        const participantUUID = participant.id;

        // ---------- COUNT SESSIONS ----------
        const { data: sessions, error: sessionError } = await supabase
            .from("sessions")
            .select("id")
            .eq("participant_id", participantUUID);

        if (sessionError) throw sessionError;

        const sessionCount = sessions.length;

        console.log(
            `Participant ${participantCode} → ${sessionCount} sessions`
        );

        // ---------- WARNING (optional) ----------
        if (sessionCount >= 2) {
            const confirmReuse = confirm(
                `${participantCode} already has ${sessionCount} sessions.\n\nContinue anyway?`
            );
            if (!confirmReuse) return;
        }

        // ---------- STORE CONTEXT ----------
        sessionStorage.setItem("participant_uuid", participantUUID);
        sessionStorage.setItem("participant_code", participantCode);

        // ---------- REDIRECT ----------
        window.location.href = "./dashboard/dashboard.html";

    } catch (err) {
        console.error(err);
        errorEl.textContent = err.message || "Something went wrong.";
    }
};
// Will use this later for remote study
// import { supabase } from "./client/supabaseClient.js";

// console.log("login.js loaded");

// const loginBtn = document.getElementById("loginBtn");
// const errorEl = document.getElementById("error");

// loginBtn.onclick = async () => {
//     errorEl.textContent = "";

//     const username = document.getElementById("username").value.trim();
//     const password = document.getElementById("password").value;

//     // ---------- BASIC VALIDATION ----------
//     if (!username || !password) {
//         errorEl.textContent = "Please enter a name and password.";
//         return;
//     }

//     if (password.length < 6) {
//         errorEl.textContent = "Password must be at least 6 characters.";
//         return;
//     }

//     const email = `${username}@motorstudy.com`;

//     // ---------- CHECK IF USERNAME EXISTS ----------
//     const { data: existingUser } = await supabase
//         .from("participants")
//         .select("id")
//         .eq("display_name", username)
//         .maybeSingle();

//     // ---------- TRY LOGIN FIRST ----------
//     const login = await supabase.auth.signInWithPassword({
//         email,
//         password
//     });

//     if (!login.error) {
//         // LOGIN SUCCESS
//         console.log("Logged in:", login.data.user.id);
//         window.location.href = "./dashboard/dashboard.html";
//         return;
//     }

//     // ---------- LOGIN FAILED ----------
//     if (existingUser) {
//         // Username exists → wrong password
//         errorEl.textContent = "Incorrect password for this user.";
//         return;
//     }

//     // ---------- REGISTER NEW USER ----------
//     const signup = await supabase.auth.signUp({
//         email,
//         password
//     });

//     if (signup.error) {
//         errorEl.textContent = signup.error.message;
//         return;
//     }

//     const user = signup.data.user;

//     if (!user) {
//         errorEl.textContent = "Registration failed. Please try again.";
//         return;
//     }

//     // ---------- STORE PARTICIPANT ----------
//     const { error: participantError } = await supabase
//         .from("participants")
//         .insert({
//             id: user.id,
//             display_name: username
//         });

//     console.log("Registered new user:", user.id);
//     window.location.href = "./dashboard/dashboard.html";
// };
