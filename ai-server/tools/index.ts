import { readFile, listDir, editFile } from './fileSystem';
import { grepSearch } from './search';
import { AgentAction } from '../schema';

export async function dispatchTool(action: AgentAction) {
    switch (action.type) {
        case 'read_file':
            return await readFile(action.path!);
        case 'list_dir':
            return await listDir(action.path || '.');
        case 'edit_file':
            return await editFile(action.path!, action.content!);
        case 'grep_search':
            return await grepSearch(action.pattern!, action.path);
        default:
            throw new Error(`Unknown tool: ${action.type}`);
    }
}
