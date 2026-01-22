import fetch from "node-fetch";
import { validateAgentResponse, AgentAction, AgentResponse } from "./schema";
import { isPathSafe, isFileAllowed, countTokens, MAX_CONTEXT_TOKENS } from "./utils";
import { saveMemory, getMemories, clearShortTermMemory, detectProjectInfo } from "./memory";
import { buildPrompt } from "./prompt";

async function model(prompt: string): Promise<string> {
    const response = await fetch("http://localhost:3333/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
    });
    const data = await response.json();
    return data.text;
}

import { dispatchTool } from './tools';

async function runTool(action: AgentAction): Promise<{ success: boolean, result?: any }> {
    console.log(`Executing tool: ${action.type}`);

    try {
        const result = await dispatchTool(action);
        return { success: true, result };
    } catch (error: any) {
        console.error(`Tool Execution Failed: ${error.message}`);
        return { success: false, result: error.message };
    }
}

// function isPathSafe(targetPath: string) {
//     // Removed redundant placeholder
// }

export async function startAgentLoop(goal: string) {
    let step = 1;
    // Clear previous short-term session memory for a fresh start or handle as needed
    // clearShortTermMemory(); 

    // Auto-detect project info
    await detectProjectInfo();

    while (step < 10) {
        console.log(`--- Step ${step}: ${goal} ---`);

        // Retrieve short-term and project memory for context
        let shortMemories = getMemories('short_term', 10) as any[];
        const projectMemories = getMemories('project', 1) as any[];

        let memoryLines = [
            ...projectMemories.map(m => `PROJECT INFO: ${m.content}`),
            ...shortMemories.reverse().map(m => `HISTORY: ${m.content}`)
        ];

        let memoryContext = memoryLines.join('\n');

        // Context Pruning: If token count is too high, remove oldest history
        while (countTokens(memoryContext + goal) > MAX_CONTEXT_TOKENS * 0.8 && memoryLines.length > 2) {
            memoryLines.splice(1, 1); // Remove the oldest history entry (keep project info at index 0)
            memoryContext = memoryLines.join('\n');
        }

        const prompt = buildPrompt(goal, memoryContext);
        console.log(`Current context size: ${countTokens(prompt)} tokens`);

        const rawResponse = await model(prompt);

        let response;
        try {
            response = JSON.parse(rawResponse);
        } catch (e) {
            console.error("Failed to parse AI response as JSON.");
            break;
        }

        const validatedResponse = validateAgentResponse(response);
        if (!validatedResponse) {
            console.error("AI response did not match the expected schema.");
            break;
        }

        console.log(`Plan: ${validatedResponse.plan.join(" -> ")}`);

        let stepSuccess = true;
        for (const action of validatedResponse.actions) {
            // Path and File Safety Checks
            if (action.path) {
                if (!isPathSafe(action.path)) {
                    console.error(`Blocked unsafe path access: ${action.path}`);
                    saveMemory('short_term', `Step ${step}: ${action.type} -> ACCESS DENIED (Unsafe Path)`);
                    stepSuccess = false;
                    break;
                }
                if (action.type === 'edit_file' && !isFileAllowed(action.path)) {
                    console.error(`Blocked forbidden file type: ${action.path}`);
                    saveMemory('short_term', `Step ${step}: ${action.type} -> ACCESS DENIED (Forbidden Extension)`);
                    stepSuccess = false;
                    break;
                }
            }

            const result = await runTool(action);

            // Persist step result to memory
            const memoryContent = `Step ${step}: ${action.type} ${action.path || ''} -> ${result.success ? 'Success' : 'Failure'}${result.result ? `: ${JSON.stringify(result.result)}` : ''}`;
            saveMemory('short_term', memoryContent);

            if (!result.success) {
                stepSuccess = false;
                break;
            }
        }

        if (validatedResponse.plan.some(p => p.toLowerCase().includes("finish"))) {
            console.log("Goal achieved.");
            break;
        }
        step++;
    }
}
