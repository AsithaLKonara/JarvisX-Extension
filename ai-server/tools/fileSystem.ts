import * as fs from 'fs/promises';
import * as path from 'path';
import { applyPatch } from 'diff';

const WORKSPACE_ROOT = path.resolve("e:/JarvisX Agent");

export async function readFile(targetPath: string, startLine?: number, endLine?: number) {
    const fullPath = path.resolve(WORKSPACE_ROOT, targetPath);
    const content = await fs.readFile(fullPath, 'utf8');

    if (startLine !== undefined && endLine !== undefined) {
        const lines = content.split('\n');
        return lines.slice(startLine - 1, endLine).join('\n');
    }

    return content;
}

export async function listDir(targetPath: string) {
    const fullPath = path.resolve(WORKSPACE_ROOT, targetPath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    return entries.map(e => ({
        name: e.name,
        isDir: e.isDirectory()
    }));
}

export async function editFile(targetPath: string, content: string, diff?: string) {
    const fullPath = path.resolve(WORKSPACE_ROOT, targetPath);

    if (diff) {
        const oldContent = await fs.readFile(fullPath, 'utf8');
        const newContent = applyPatch(oldContent, diff);
        if (newContent === false) {
            throw new Error("Failed to apply diff: content mismatch or invalid patch.");
        }
        await fs.writeFile(fullPath, newContent, 'utf8');
        return { success: true, method: 'diff' };
    } else {
        await fs.writeFile(fullPath, content, 'utf8');
        return { success: true, method: 'full' };
    }
}
