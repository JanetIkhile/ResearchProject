import { supabase } from "../client/supabaseClient.js";

console.log("login.js loaded");

const loginBtn = document.getElementById("loginBtn");
const errorEl = document.getElementById("error");

loginBtn.onclick = async () => {
    errorEl.textContent = "";

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    // ---------- BASIC VALIDATION ----------
    if (!username || !password) {
        errorEl.textContent = "Please enter a name and password.";
        return;
    }

    if (password.length < 6) {
        errorEl.textContent = "Password must be at least 6 characters.";
        return;
    }

    const email = `${username}@motorstudy.local`;

    // ---------- CHECK IF USERNAME EXISTS ----------
    const { data: existingUser } = await supabase
        .from("participants")
        .select("id")
        .eq("display_name", username)
        .maybeSingle();

    // ---------- TRY LOGIN FIRST ----------
    const login = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (!login.error) {
        // LOGIN SUCCESS
        console.log("Logged in:", login.data.user.id);
        window.location.href = "/docs/index.html";
        return;
    }

    // ---------- LOGIN FAILED ----------
    if (existingUser) {
        // Username exists → wrong password
        errorEl.textContent = "Incorrect password for this user.";
        return;
    }

    // ---------- REGISTER NEW USER ----------
    const signup = await supabase.auth.signUp({
        email,
        password
    });

    if (signup.error) {
        errorEl.textContent = signup.error.message;
        return;
    }

    const user = signup.data.user;

    if (!user) {
        errorEl.textContent = "Registration failed. Please try again.";
        return;
    }

    // ---------- STORE PARTICIPANT ----------
    const { error: participantError } = await supabase
        .from("participants")
        .insert({
            id: user.id,
            display_name: username
        });

    console.log("Registered new user:", user.id);
    window.location.href = "/docs/index.html";
};
