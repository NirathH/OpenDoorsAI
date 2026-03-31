import fs from 'fs';

async function main() {
    const key = process.env.HUME_API_KEY;
    console.log("Key:", key ? "Exists" : "Missing");

    const res = await fetch("https://api.hume.ai/v0/evi/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Hume-Api-Key": key
        },
        body: JSON.stringify({
            messages: [{ role: "user", content: "Analyze this transcript: Q: How are you? A: Good." }]
        })
    });
    const data = await res.json();
    console.log("Response:", data);
}
main();
