import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL =
    (import.meta && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
    "https://cuodmwpzyyhycubctetf.supabase.co";
const SUPABASE_ANON_KEY =
    (import.meta && import.meta.env && import.meta.env.SUPABASE_ANON_KEY) ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1b2Rtd3B6eXloeWN1YmN0ZXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxOTU3MzcsImV4cCI6MjA4NDc3MTczN30.7BH627JDq6mQgKzTbqm-1yFkrvLGCD2QNEbiBftuBj0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// export default async function handler(req, res) {
//     if (req.method !== "POST") {
//         return res.status(405).json({ error: "Method not allowed" });
//     }

//     const payload = req.body;

//     const { error } = await supabase
//         .from("trials")
//         .insert(payload);

//     if (error) {
//         console.error(error);
//         return res.status(500).json({ error: "DB insert failed" });
//     }

//     return res.status(200).json({ status: "ok" });
// }
