import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { generateEmbedding } from './embeddings';

const DB_PATH = path.resolve(__dirname, '../memory/memory.db');
const SCHEMA_PATH = path.resolve(__dirname, '../memory/schema.sql');

if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

const db = new Database(DB_PATH);

// Initialize database if empty
const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='memory'").get();
if (!tableExists) {
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    db.exec(schema);
}

export interface MemoryEntry {
    type: 'short_term' | 'project' | 'skill';
    content: string;
    embedding?: number[];
}

/**
 * Helper to compute cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function saveMemory(type: MemoryEntry['type'], content: string, shouldEmbed: boolean = false) {
    let embeddingBlob = null;
    if (shouldEmbed) {
        const vector = await generateEmbedding(content);
        embeddingBlob = Buffer.from(new Float32Array(vector).buffer);
    }

    const stmt = db.prepare('INSERT INTO memory (type, content, embedding) VALUES (?, ?, ?)');
    return stmt.run(type, content, embeddingBlob);
}

export function getMemories(type?: MemoryEntry['type'], limit: number = 10) {
    let query = 'SELECT * FROM memory';
    const params = [];

    if (type) {
        query += ' WHERE type = ?';
        params.push(type);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    return db.prepare(query).all(...params);
}

export function clearShortTermMemory() {
    return db.prepare("DELETE FROM memory WHERE type = 'short_term'").run();
}

/**
 * Scan workspace for project markers (package.json, etc)
 */
export async function detectProjectInfo() {
    const packageJsonPath = path.resolve(__dirname, '../package.json'); // Adjusted to project root
    if (fs.existsSync(packageJsonPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            const content = `Project: ${pkg.name}\nDependencies: ${Object.keys(pkg.dependencies || {}).join(', ')}`;

            // Upsert project info
            const existing = db.prepare("SELECT id FROM memory WHERE type = 'project'").get();
            if (existing) {
                db.prepare("UPDATE memory SET content = ? WHERE id = ?").run(content, (existing as any).id);
            } else {
                await saveMemory('project', content, true); // Embed project info
            }
            return content;
        } catch (e) {
            console.error("Failed to parse package.json for project memory.");
        }
    }
    return null;
}

/**
 * Save a successful pattern or snippet as a 'skill'
 */
export async function saveSkill(name: string, pattern: string) {
    const content = `Skill Name: ${name}\nPattern: ${pattern}`;
    return await saveMemory('skill', content, true);
}

/**
 * Semantic search for memories/skills using cosine similarity
 */
export async function searchMemories(query: string, type?: MemoryEntry['type']) {
    const queryVector = await generateEmbedding(query);

    // Fetch all candidates with embeddings
    let sql = "SELECT * FROM memory WHERE embedding IS NOT NULL";
    const params = [];
    if (type) {
        sql += " AND type = ?";
        params.push(type);
    }

    const rows = db.prepare(sql).all(...params) as any[];

    if (rows.length === 0) {
        // Fallback to keyword search if no embeddings found
        return keywordSearch(query, type);
    }

    // Rank by similarity
    const results = rows.map(row => {
        const rowVector = Array.from(new Float32Array(row.embedding.buffer, row.embedding.byteOffset, row.embedding.byteLength / 4));
        return {
            ...row,
            similarity: cosineSimilarity(queryVector, rowVector)
        };
    });

    return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);
}

function keywordSearch(query: string, type?: MemoryEntry['type']) {
    let sql = "SELECT * FROM memory WHERE content LIKE ?";
    const params = [`%${query}%`];

    if (type) {
        sql += " AND type = ?";
        params.push(type);
    }

    sql += " ORDER BY created_at DESC LIMIT 5";
    return db.prepare(sql).all(...params);
}
