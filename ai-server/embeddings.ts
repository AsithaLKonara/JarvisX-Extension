import fetch from "node-fetch";

const OLLAMA_BASE_URL = "http://localhost:11434/api";
const EMBEDDING_MODEL = "nomic-embed-text";

/**
 * Generates an embedding vector for the given text using Ollama.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/embeddings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: EMBEDDING_MODEL,
                prompt: text,
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama embedding error: ${response.statusText}`);
        }

        const data: any = await response.json();
        return data.embedding;
    } catch (error) {
        console.error("Failed to generate embedding:", error);
        // Fallback or rethrow depending on strategy. For now, we want progress.
        throw error;
    }
}

/**
 * Ensures the embedding model is available in Ollama.
 */
export async function ensureEmbeddingModel() {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/tags`);
        const data: any = await response.json();
        const models = data.models || [];
        const hasModel = models.some((m: any) => m.name.includes(EMBEDDING_MODEL));

        if (!hasModel) {
            console.log(`Model ${EMBEDDING_MODEL} not found. Pulling...`);
            await fetch(`${OLLAMA_BASE_URL}/pull`, {
                method: "POST",
                body: JSON.stringify({ name: EMBEDDING_MODEL }),
            });
        }
    } catch (e) {
        console.warn("Could not verify/pull embedding model. Ensure Ollama is running.");
    }
}
