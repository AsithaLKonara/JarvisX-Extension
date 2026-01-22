/**
 * Canonical Action Schema for JarvisX Agent
 */

export type ActionType = 'read_file' | 'list_dir' | 'edit_file' | 'grep_search' | 'run_command' | 'process_design' | 'search_memory';

export interface AgentAction {
    type: ActionType;
    path?: string;
    pattern?: string;
    content?: string;
    diff?: string;
    command?: string;
    recursive?: boolean;
    data?: any;
    task?: 'to_html' | 'extract_tokens';
}

export interface AgentResponse {
    thought: string;
    reflection?: string;
    plan: string[];
    actions: AgentAction[];
}

/**
 * Validates if an object conforms to the AgentResponse schema.
 */
export function validateAgentResponse(obj: any): AgentResponse | null {
    if (typeof obj !== 'object' || obj === null) return null;

    if (typeof obj.thought !== 'string') return null;
    if (obj.reflection && typeof obj.reflection !== 'string') return null;
    if (!Array.isArray(obj.plan)) return null;
    if (!Array.isArray(obj.actions)) return null;

    for (const action of obj.actions) {
        if (!['read_file', 'list_dir', 'edit_file', 'grep_search', 'run_command', 'process_design', 'search_memory'].includes(action.type)) {
            return null;
        }

        // Strict Parameter Validation
        switch (action.type) {
            case 'read_file':
            case 'list_dir':
                if (typeof action.path !== 'string') return null;
                break;
            case 'edit_file':
                if (typeof action.path !== 'string') return null;
                if (typeof action.content !== 'string' && typeof action.diff !== 'string') return null;
                break;
            case 'grep_search':
                if (typeof action.pattern !== 'string') return null;
                break;
            case 'run_command':
                if (typeof action.command !== 'string') return null;
                break;
            case 'process_design':
                if (!action.data || typeof action.task !== 'string') return null;
                break;
            case 'search_memory':
                if (typeof action.pattern !== 'string') return null;
                break;
        }
    }

    return obj as AgentResponse;
}
