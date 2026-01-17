import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const API_KEY = "local-dev-key-123"; // In production, this should be in .env

// Auth Middleware
const authMiddleware = (req: any, res: any, next: any) => {
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// Health Check
app.get("/health", async (req, res) => {
  try {
    const response = await fetch("http://localhost:11434/api/tags");
    if (response.ok) {
      res.json({ status: "healthy", ai_provider: "connected" });
    } else {
      res.status(503).json({ status: "degraded", ai_provider: "unreachable" });
    }
  } catch (e) {
    res.status(503).json({ status: "degraded", ai_provider: "error" });
  }
});

app.post("/chat", authMiddleware, async (req, res) => {
  const { prompt, stream = false } = req.body;

  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      body: JSON.stringify({
        model: "mistral-lora",
        prompt: prompt,
        stream: stream
      })
    });

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      response.body.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(l => l.trim());
        for (const line of lines) {
          const json = JSON.parse(line);
          if (json.response) {
            res.write(`data: ${json.response}\n\n`);
          }
        }
      });

      response.body.on('end', () => res.end());
    } else {
      const data = await response.json();
      res.json({ text: data.response });
    }
  } catch (error) {
    console.error("Error calling local AI:", error);
    res.status(500).json({ error: "Failed to connect to local AI server" });
  }
});

const PORT = 3333;
app.listen(PORT, () => {
  console.log(`AI Server running on http://localhost:${PORT}`);
});
