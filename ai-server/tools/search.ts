import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function grepSearch(pattern: string, targetPath: string = '.') {
    try {
        // Simple grep-like search using Node (or shell if available)
        // For Windows, we might want to use a more robust search if ripgrep isn't installed.
        // Using a simple powershell command for now.
        const { stdout } = await execAsync(`Select-String -Pattern "${pattern}" -Path "${targetPath}/*" -Recursive | Select-Object LineNumber, Line, Path | ConvertTo-Json`);
        return JSON.parse(stdout);
    } catch (error) {
        return [];
    }
}
