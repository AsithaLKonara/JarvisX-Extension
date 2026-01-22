import path from "path";
import { encode } from "gpt-tokenizer";

const WORKSPACE_ROOT = path.resolve("e:/JarvisX Agent");

/**
 * Safety Check: Prevent access outside workspace
 */
export const isPathSafe = (targetPath: string) => {
    const resolvedPath = path.resolve(WORKSPACE_ROOT, targetPath);
    return resolvedPath.startsWith(WORKSPACE_ROOT);
};

/**
 * Blacklist: Prevent editing potentially harmful or binary files
 */
const FORBIDDEN_EXTENSIONS = ['.exe', '.dll', '.bin', '.pyc', '.node'];

export const isFileAllowed = (targetPath: string) => {
    const ext = path.extname(targetPath).toLowerCase();
    return !FORBIDDEN_EXTENSIONS.includes(ext);
};

/**
 * Token counting for context management
 */
export function countTokens(text: string): number {
    try {
        return encode(text).length;
    } catch (e) {
        // Fallback to rough estimation if tokenizer fails
        return Math.ceil(text.length / 4);
    }
}

/**
 * Constants for context management
 */
export const MAX_CONTEXT_TOKENS = 8192; // Adjust based on model
export const MAX_FILE_LINES = 500; // Chunk size
