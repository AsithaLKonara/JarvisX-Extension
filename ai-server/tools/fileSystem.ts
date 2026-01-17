import * as fs from 'fs/promises';
import * as path from 'path';

const WORKSPACE_ROOT = path.resolve("e:/JarvisX Agent");

export async function readFile(targetPath: string) {
    const fullPath = path.resolve(WORKSPACE_ROOT, targetPath);
    return await fs.readFile(fullPath, 'utf8');
}

export async function listDir(targetPath: string) {
    const fullPath = path.resolve(WORKSPACE_ROOT, targetPath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    return entries.map(e => ({
        name: e.name,
        isDir: e.isDirectory()
    }));
}

export async function editFile(targetPath: string, content: string) {
    const fullPath = path.resolve(WORKSPACE_ROOT, targetPath);
    await fs.writeFile(fullPath, content, 'utf8');
    return { success: true };
}
