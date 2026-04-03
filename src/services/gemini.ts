import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return new GoogleGenAI({ apiKey });
};

export async function analyzeDiscussion(messages: any[]) {
  const ai = getAiClient();
  const chatContext = messages.map(m => `${m.userName}: ${m.text}`).join('\n');
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following team discussion and extract any new tasks, decisions, or project risks.
    
    Discussion:
    ${chatContext}
    
    Return the analysis in JSON format.`,
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

  return JSON.parse(response.text);
}

export async function generateWorkspaceReport(workspaceName: string, tasks: any[], decisions: any[], risks: any[]) {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a professional project status report for workspace "${workspaceName}".
    
    Tasks: ${JSON.stringify(tasks)}
    Decisions: ${JSON.stringify(decisions)}
    Risks: ${JSON.stringify(risks)}
    
    The report should be in Markdown format, professional, and concise.`,
  });

  return response.text;
}

export async function getProjectInsights(tasks: any[]) {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Provide 3 actionable project management insights based on these tasks: ${JSON.stringify(tasks)}.
    Focus on workload, bottlenecks, and velocity.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  return JSON.parse(response.text);
}
