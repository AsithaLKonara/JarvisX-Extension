import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const ALLOWED_COMMANDS = ['npm', 'git', 'ls', 'dir', 'tsc', 'node', 'grep'];
const COMMAND_TIMEOUT = 30000; // 30 seconds

export async function runCommand(command: string) {
    const baseCommand = command.split(' ')[0];

    if (!ALLOWED_COMMANDS.includes(baseCommand)) {
        throw new Error(`Command '${baseCommand}' is not allowed for security reasons.`);
    }

    try {
        const { stdout, stderr } = await execAsync(command, { timeout: COMMAND_TIMEOUT });
        return {
            stdout: stdout.trim(),
            stderr: stderr.trim()
        };
    } catch (error: any) {
        return {
            error: error.message,
            stdout: error.stdout?.trim(),
            stderr: error.stderr?.trim()
        };
    }
}
