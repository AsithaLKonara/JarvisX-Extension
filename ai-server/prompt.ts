export function buildPrompt(userPrompt: string, memory: string[]) {
    return `
You are my personal AI developer assistant.
Follow my coding rules.

MEMORY:
${memory.join("\n")}

TASK:
${userPrompt}
`;
}
