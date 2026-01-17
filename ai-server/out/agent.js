"use strict";
/**
 * Autonomous Agent Loop
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAgentLoop = startAgentLoop;
async function model(prompt) {
    const response = await fetch("http://localhost:3333/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
    });
    const data = await response.json();
    return data.text;
}
async function runTool(action) {
    console.log(`Executing tool: ${action}`);
    // Tool execution logic would go here (e.g. file writing, shell commands)
    return { success: true };
}
async function startAgentLoop(goal) {
    let step = 1;
    while (step < 10) { // Limit steps for safety
        console.log(`--- Step ${step}: ${goal} ---`);
        const plan = await model(`Current goal: ${goal}. Plan the next immediate step to achieve this.`);
        console.log(`Plan: ${plan}`);
        const action = await model(`Execute the following plan: ${plan}. Return a tool command.`);
        const result = await runTool(action);
        if (result.success && plan.toLowerCase().includes("finish")) {
            console.log("Goal achieved.");
            break;
        }
        step++;
    }
}
//# sourceMappingURL=agent.js.map