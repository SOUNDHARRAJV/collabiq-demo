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
    const chatContext = messages.map(m => `${m.userName}: ${m.text}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Analyze the following team discussion and extract any new tasks, decisions, or project risks.
    
Discussion:
${chatContext}

Return ONLY valid JSON with tasks (title, description, priority), decisions (strings), and risks (strings).`,
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
                  priority: { type: Type.STRING, enum: ['low', 'medium', 'high', 'urgent'] }
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

    const parsed = JSON.parse(response.text);
    console.log('[Trace][API][Gemini] analyzeDiscussion parsed', {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks.length : 0,
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions.length : 0,
      risks: Array.isArray(parsed.risks) ? parsed.risks.length : 0,
    });
    
    // Validate response structure
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks : []
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
