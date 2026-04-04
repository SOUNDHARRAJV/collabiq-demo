import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not configured.");
  }

  return new GoogleGenAI({ apiKey });
};

// Default response if API fails
const getDefaultAnalysis = () => ({
  tasks: [],
  decisions: [],
  risks: []
});

export async function analyzeDiscussion(messages: any[]) {
  try {
    console.log('[Trace][API][Gemini] analyzeDiscussion called', { messageCount: messages.length });
    if (messages.length === 0) {
      console.warn('[Breakpoint][Flow][Gemini] analyzeDiscussion called with empty messages');
      return getDefaultAnalysis();
    }

    const ai = getAiClient();
    const chatContext = messages
      .map((message, index) => {
        const when = message.timestamp ? new Date(message.timestamp).toISOString() : 'unknown-time';
        return `${index + 1}. [${when}] ${message.userName}: ${message.text}`;
      })
      .join('\n');

    const extractionPrompt = `You are an expert project coordinator extracting structured outputs from team chat logs.

Return STRICT JSON only with this shape:
{
  "tasks": [
    {
      "title": string,
      "description": string,
      "priority": "low"|"medium"|"high"|"urgent",
      "owner": string|null
    }
  ],
  "decisions": string[],
  "risks": string[]
}

Rules:
1) Extract only actionable tasks with a clear work verb (build, implement, write, test, design, deploy, review, fix).
2) Ignore non-actionable statements (status updates, summaries, opinions, greetings, or "we discussed" statements).
3) Owner extraction:
- If text says "<Name> will...", "I'll...", "I will...", "<Name> is doing...", assign that person.
- For "I" statements, owner is that message speaker.
- If no owner is clear, set owner to null.
4) Priority mapping:
- urgent: today, tonight, ASAP, immediately, tomorrow, specific near deadline (e.g. Friday when current week implied).
- high: this week / soon / blocker-sensitive tasks.
- medium: normal planned work.
- low: optional or nice-to-have tasks.
5) Description must include what to do and why/context from chat when possible.
6) De-duplicate similar tasks.
7) Decisions are concrete commitments or agreed responsibilities.
8) Risks are timeline, dependency, quality, scope, or resource concerns.

Examples:
- "Sarah will finish API by tomorrow" -> task owner Sarah, priority urgent.
- "I'll handle database schema tonight" from John -> owner John, priority urgent.
- "We discussed testing strategy" -> not a task.

Chat transcript:
${chatContext}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: extractionPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  priority: { type: Type.STRING, enum: ['low', 'medium', 'high', 'urgent'] },
                  owner: { type: Type.STRING, nullable: true }
                },
                required: ['title', 'description', 'priority']
              }
            },
            decisions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            risks: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['tasks', 'decisions', 'risks']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    console.log('[Trace][API][Gemini] analyzeDiscussion parsed', {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks.length : 0,
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions.length : 0,
      risks: Array.isArray(parsed.risks) ? parsed.risks.length : 0,
    });

    const validPriorities = new Set(['low', 'medium', 'high', 'urgent']);
    const safeTasks = Array.isArray(parsed.tasks)
      ? parsed.tasks
          .filter((task: any) => task && typeof task.title === 'string' && typeof task.description === 'string')
          .map((task: any) => ({
            title: task.title.trim().slice(0, 200),
            description: task.description.trim().slice(0, 1500),
            priority: validPriorities.has(task.priority) ? task.priority : 'medium',
            owner: typeof task.owner === 'string' && task.owner.trim() ? task.owner.trim().slice(0, 120) : null,
          }))
      : [];

    return {
      tasks: safeTasks,
      decisions: Array.isArray(parsed.decisions)
        ? parsed.decisions.filter((item: any) => typeof item === 'string').map((item: string) => item.trim()).filter(Boolean)
        : [],
      risks: Array.isArray(parsed.risks)
        ? parsed.risks.filter((item: any) => typeof item === 'string').map((item: string) => item.trim()).filter(Boolean)
        : []
    };
  } catch (error) {
    console.error('[Trace][API][Gemini] analyzeDiscussion error', error);
    console.error('Failed to analyze discussion:', error);
    // Return empty results on error - UI will show graceful fallback
    return getDefaultAnalysis();
  }
}

export async function generateWorkspaceReport(workspaceName: string, tasks: any[], decisions: any[], risks: any[]) {
  try {
    console.log('[Trace][API][Gemini] generateWorkspaceReport called', {
      workspaceName,
      tasks: tasks.length,
      decisions: decisions.length,
      risks: risks.length,
    });
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Generate a professional project status report for workspace "${workspaceName}".
    
Tasks: ${JSON.stringify(tasks)}
Decisions: ${JSON.stringify(decisions)}
Risks: ${JSON.stringify(risks)}
    
The report should be in Markdown format, professional, and concise.`,
    });

    console.log('[Trace][API][Gemini] generateWorkspaceReport success', { responseLength: response.text.length });
    return response.text;
  } catch (error) {
    console.error('[Trace][API][Gemini] generateWorkspaceReport error', error);
    console.error('Failed to generate report:', error);
    return `# Status Report: ${workspaceName}\n\nUnable to generate AI report. Please try again later.`;
  }
}

export async function getProjectInsights(tasks: any[]) {
  try {
    console.log('[Trace][API][Gemini] getProjectInsights called', { taskCount: tasks.length });
    if (tasks.length === 0) {
      console.warn('[Breakpoint][Flow][Gemini] getProjectInsights called with empty tasks');
      return [];
    }

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Provide 3 actionable project management insights based on these tasks: ${JSON.stringify(tasks)}.
Focus on workload, bottlenecks, and velocity. Return as JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const parsed = JSON.parse(response.text);
    console.log('[Trace][API][Gemini] getProjectInsights parsed', { insightCount: Array.isArray(parsed) ? parsed.length : 0 });
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('[Trace][API][Gemini] getProjectInsights error', error);
    console.error('Failed to get insights:', error);
    return [];
  }
}
