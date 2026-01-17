/**
 * Canonical Action Schema for JarvisX Agent
 */

export type ActionType = 'read_file' | 'list_dir' | 'edit_file' | 'grep_search' | 'run_command';

export interface AgentAction {
    type: ActionType;
    path?: string;
    pattern?: string;
    content?: string;
    diff?: string;
    command?: string;
    recursive?: boolean;
}

export interface AgentResponse {
    thought: string;
    plan: string[];
    actions: AgentAction[];
}

/**
 * Validates if an object conforms to the AgentResponse schema.
 */
export function validateAgentResponse(obj: any): AgentResponse | null {
    if (typeof obj !== 'object' || obj === null) return null;

    if (typeof obj.thought !== 'string') return null;
    if (!Array.isArray(obj.plan)) return null;
    if (!Array.isArray(obj.actions)) return null;

    for (const action of obj.actions) {
        if (!['read_file', 'list_dir', 'edit_file', 'grep_search', 'run_command'].includes(action.type)) {
            return null;
        }
    }

    return obj as AgentResponse;
}
