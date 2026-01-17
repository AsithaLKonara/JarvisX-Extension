import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.post("/chat", async (req, res) => {
  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      body: JSON.stringify({
        model: "mistral-lora", // User specified mistral-lora
        prompt: req.body.prompt,
        stream: false
      })
    });

    const data = await response.json();
    res.json({ text: data.response });
  } catch (error) {
    console.error("Error calling local AI:", error);
    res.status(500).json({ error: "Failed to connect to local AI server (Ollama/llama.cpp)" });
  }
});

const PORT = 3333;
app.listen(PORT, () => {
  console.log(`AI Server running on http://localhost:${PORT}`);
});
