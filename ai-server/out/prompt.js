"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPrompt = buildPrompt;
function buildPrompt(userPrompt, memory) {
    return `
You are my personal AI developer assistant.
Follow my coding rules.

MEMORY:
${memory.join("\n")}

TASK:
${userPrompt}
`;
}
//# sourceMappingURL=prompt.js.map