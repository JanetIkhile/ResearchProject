import { supabase } from "./client/supabaseClient.js";

console.log("lab login loaded");

// -----------------------------
// ELEMENTS
// -----------------------------
const participantInput = document.getElementById("username");
const participantDropdown = document.getElementById("participantDropdown");
const loginBtn = document.getElementById("loginBtn");
const errorEl = document.getElementById("error");
let allParticipants = [];

function showPointerOnButton(btn) {
    if (document.getElementById("continuePointer")) return;
    btn.classList.add("button-pressed-animate");
    const rect = btn.getBoundingClientRect();
    const pointer = document.createElement("div");
    pointer.id = "continuePointer";
    pointer.className = "hint-pointer continue-pointer-animate";
    pointer.innerText = "👆";
    pointer.style.position = "absolute";
    pointer.style.left = `${rect.left + rect.width / 2 - 30}px`;
    pointer.style.top = `${rect.top + rect.height / 2 + 15}px`;
    document.body.appendChild(pointer);
}

function removePointer() {
    const pointer = document.getElementById("continuePointer");
    if (pointer) {
        pointer.remove();
    }
    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) {
        loginBtn.classList.remove("button-pressed-animate");
    }
}

function checkAllFieldsFilled() {
    const username = participantInput.value.trim();
    const identity = document.querySelector('input[name="identity"]:checked');
    const dominantArm = document.querySelector('input[name="dominant_arm"]:checked');
    const loginBtn = document.getElementById("loginBtn");

    if (username && identity && dominantArm) {
        showPointerOnButton(loginBtn);
    } else {
        removePointer();
    }
}

function updateFilledStatus() {
    const val = participantInput.value.trim();
    const lockBadge = document.getElementById("lockBadge");
    if (val) {
        participantInput.classList.add("is-filled");
        if (lockBadge) lockBadge.style.display = "block";
    } else {
        participantInput.classList.remove("is-filled");
        if (lockBadge) lockBadge.style.display = "none";
    }
    checkAllFieldsFilled();
}

// -----------------------------
// INIT
// -----------------------------
populateParticipants();
updateFilledStatus();

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
        for (let i = 1; i <= 50; i++) {
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

            let status = "";

            if (count === 0) {
                status = " (Not started)";
            } else if (count === 1) {
                status = " (In Progress)";
            } else {
                status = " (Complete)";
            }

            allParticipants.push({ code, text: `${code}${status}` });
        }

        renderDropdown();

        participantInput.addEventListener("focus", () => {
            participantDropdown.style.display = "block";
            renderDropdown(participantInput.value);
        });

        participantInput.addEventListener("input", (e) => {
            participantDropdown.style.display = "block";
            renderDropdown(e.target.value);
            updateFilledStatus();
        });

        document.addEventListener("click", (e) => {
            if (!participantInput.contains(e.target) && !participantDropdown.contains(e.target)) {
                participantDropdown.style.display = "none";
            }
        });

        // Listen to radio changes to trigger pointer checks
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener("change", checkAllFieldsFilled);
        });

    } catch (err) {
        console.error(err);
        errorEl.textContent = "Failed to load participants.";
    }
}

function renderDropdown(filterText = "") {
    participantDropdown.innerHTML = "";
    const filtered = allParticipants.filter(opt => opt.text.toLowerCase().includes(filterText.toLowerCase()));

    if (filtered.length === 0) {
        const div = document.createElement("div");
        div.className = "dropdown-item";
        div.textContent = "No matches found";
        div.style.color = "#666";
        participantDropdown.appendChild(div);
        return;
    }

    filtered.forEach(opt => {
        const div = document.createElement("div");
        div.className = "dropdown-item";
        div.textContent = opt.text;
        div.onclick = () => {
            participantInput.value = opt.code;
            participantDropdown.style.display = "none";
            updateFilledStatus();
        };
        participantDropdown.appendChild(div);
    });
}

// -----------------------------
// START SESSION (login flow)
// -----------------------------
loginBtn.onclick = async () => {
    errorEl.textContent = "";

    const participantCode = participantInput.value;

    // ---------- VALIDATION ----------
    if (!participantCode) {
        errorEl.textContent = "Please select a participant.";
        return;
    }
    const identity = document.querySelector('input[name="identity"]:checked')?.value;
    const dominantArm = document.querySelector('input[name="dominant_arm"]:checked')?.value;

    if (!identity) {
        errorEl.textContent = "Please select how you identify.";
        return;
    }

    if (!dominantArm) {
        errorEl.textContent = "Please select your dominant arm.";
        return;
    }

    try {
        // ---------- GET OR CREATE PARTICIPANT ----------
        let { data: participant, error } = await supabase
            .from("participants")
            .select("id, participant_group")
            .eq("participant_code", participantCode)
            .maybeSingle();

        if (error) throw error;

        if (!participant) {
            const { data: newParticipant, error: insertError } = await supabase
                .from("participants")
                .insert({
                    participant_code: participantCode,
                    participant_group: identity,
                    dominant_arm: dominantArm
                })
                .select()
                .single();

            if (insertError) throw insertError;

            participant = newParticipant;
        }

        const participantUUID = participant.id;

        // ---------- UPDATE GROUP IF NEEDED ----------
        if (participant && !participant.participant_group) {
            await supabase
                .from("participants")
                .update({
                    participant_group: identity,
                    dominant_arm: dominantArm
                })
                .eq("id", participant.id);
        }

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
                `${participantCode} has already completed both sessions (2/2).\n\nDo you want to continue anyway?`
            );
            if (!confirmReuse) return;
        }
        const sessionType = (sessionCount === 0) ? "practice" : "main";

        // ---------- STORE CONTEXT ----------
        sessionStorage.setItem("participant_uuid", participantUUID);
        sessionStorage.setItem("participant_code", participantCode);
        sessionStorage.setItem("participant_group", identity);
        sessionStorage.setItem("dominant_arm", dominantArm);
        sessionStorage.setItem("session_type", sessionType);


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
