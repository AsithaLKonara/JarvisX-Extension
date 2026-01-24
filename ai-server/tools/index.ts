import { readFile, listDir, editFile } from './fileSystem';
import { grepSearch } from './search';
import { runCommand } from './terminal';
import { figmaToHtml, extractDesignTokens } from './designParser';
import { AgentAction } from '../schema';
import { approvalManager } from '../approvalManager';
import { searchMemories } from '../memory';

export async function dispatchTool(action: AgentAction) {
    switch (action.type) {
        case 'read_file':
            return await readFile(action.path!);
        case 'list_dir':
            return await listDir(action.path || '.');
        case 'edit_file': {
            const approved = await approvalManager.requestApproval('edit_file', action);
            if (!approved) throw new Error("Edit rejected by user.");
            return await editFile(action.path!, action.content || '', action.diff);
        }
        case 'grep_search':
            return await grepSearch(action.pattern!, action.path);
        case 'run_command': {
            const approved = await approvalManager.requestApproval('run_command', action);
            if (!approved) throw new Error("Command execution rejected by user.");
            return await runCommand(action.command!);
        }
        case 'process_design':
            if (action.task === 'to_html') return figmaToHtml(action.data);
            if (action.task === 'extract_tokens') return extractDesignTokens(action.data);
            throw new Error(`Unknown design task: ${action.task}`);
        case 'search_memory':
            return searchMemories(action.pattern!);
        default:
            throw new Error(`Unknown tool: ${action.type}`);
    }
}
