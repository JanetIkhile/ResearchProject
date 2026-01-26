import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const supabase = createClient(
    import.meta.env.SUPABASE_URL || "https://cuodmwpzyyhycubctetf.supabase.co",
    import.meta.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1b2Rtd3B6eXloeWN1YmN0ZXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxOTU3MzcsImV4cCI6MjA4NDc3MTczN30.7BH627JDq6mQgKzTbqm-1yFkrvLGCD2QNEbiBftuBj0"
);

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
