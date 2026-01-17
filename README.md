# JarvisX-Extension (local-cursor-dev-os)

A **personal, local, full-stack AI development system**
Powered by **LoRA-Mistral-7B**, **VS Code**, and **Figma**

## 🧱 HIGH-LEVEL ARCHITECTURE

```
VS Code Extension
│
├── AI Orchestrator (Node)
│   ├── Model Router
│   ├── Prompt Engine
│   ├── Memory Engine
│   └── Tool Runner
│
├── Local AI Server (HTTP)
│   ├── Ollama / llama.cpp
│   ├── JSON-safe outputs
│   └── Streaming
│
├── Figma Plugin
│   ├── UI → JSON
│   └── JSON → UI
│
└── Memory Store
    ├── SQLite
    └── Vector embeddings
```
