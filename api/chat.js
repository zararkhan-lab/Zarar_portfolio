export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: "GEMINI_API_KEY is not configured in Vercel." });
  try {
    const { system = "", messages = [] } = req.body || {};
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content || "") }],
    }));
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents, systemInstruction: { parts: [{ text: system }] } }),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || "Gemini API request failed" });
    const reply = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "Hmm, I couldn't fetch a response. Try again!";
    return res.status(200).json({ content: [{ text: reply }] });
  } catch (error) {
    return res.status(500).json({ error: "Something went wrong processing the chat request." });
  }
}
