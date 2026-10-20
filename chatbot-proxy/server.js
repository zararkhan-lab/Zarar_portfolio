// server.js — minimal proxy so the portfolio chatbot never exposes an API key in the browser
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_MODEL = "gemini-2.5-flash"; // check ai.google.dev/gemini-api/docs/models for the latest model name

app.post("/api/chat", async (req, res) => {
  try {
    const { system, messages } = req.body;
    // messages arrive as [{ role: 'user'|'assistant', content: '...' }, ...]
    // Gemini wants [{ role: 'user'|'model', parts: [{ text: '...' }] }, ...]
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: system }] },
      }),
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Hmm, I couldn't fetch a response. Try again!";

    // Reshape to match what the frontend expects: data.content[0].text
    res.json({ content: [{ text: reply }] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Chatbot proxy running on http://localhost:${PORT}`));
