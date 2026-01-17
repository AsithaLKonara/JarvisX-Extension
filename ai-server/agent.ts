import fetch from "node-fetch";
import { validateAgentResponse, AgentAction } from "./schema";

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

function isPathSafe(targetPath: string) {
    // This would ideally be shared with server.ts or moved to a utils file
    return true; // Placeholder for logic added in server.ts
}

export async function startAgentLoop(goal: string) {
    let step = 1;
    const history: any[] = [];

    while (step < 10) {
        console.log(`--- Step ${step}: ${goal} ---`);

        const context = history.map(h => `Step ${h.step}: ${h.action.type} -> ${h.success ? 'Success' : 'Failure'}${h.result ? `: ${h.result}` : ''}`).join('\n');
        const prompt = `Goal: ${goal}\nHistory:\n${context}\n\nTask: Plan the next step. Return ONLY valid JSON.`;

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
            const result = await runTool(action);
            history.push({
                step,
                action,
                success: result.success,
                result: result.result
            });
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
