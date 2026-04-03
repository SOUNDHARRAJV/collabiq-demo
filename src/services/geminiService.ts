import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return new GoogleGenAI({ apiKey });
};

export const analyzeDiscussion = async (messages: string[]) => {
  const ai = getAiClient();
  const model = "gemini-3.1-flash-lite-preview";
  const prompt = `
    Analyze the following team discussion and extract:
    1. Tasks (title, description, assignee, deadline, priority)
    2. Decisions (key outcomes)
    3. Risks (potential blockers or issues)

    Discussion:
    ${messages.join("\n")}

    Return the result in JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
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
                  assignee: { type: Type.STRING },
                  deadline: { type: Type.STRING },
                  priority: { type: Type.STRING, enum: ["low", "medium", "high", "urgent"] }
                },
                required: ["title"]
              }
            },
            decisions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            risks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  severity: { type: Type.STRING, enum: ["low", "medium", "high", "critical"] }
                },
                required: ["description", "severity"]
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return { tasks: [], decisions: [], risks: [] };
  }
};

export const getProjectInsights = async (tasks: any[], messages: any[]) => {
  const ai = getAiClient();
  const model = "gemini-3.1-flash-lite-preview";
  const prompt = `
    Based on the following tasks and recent messages, provide a productivity score (0-100) and a brief summary of team workload and potential delays.

    Tasks: ${JSON.stringify(tasks)}
    Messages: ${JSON.stringify(messages.slice(-10))}

    Return JSON with: { productivityScore: number, summary: string, workloadDistribution: { name: string, taskCount: number }[] }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productivityScore: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            workloadDistribution: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  taskCount: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Insights Error:", error);
    return { productivityScore: 0, summary: "Unable to generate insights.", workloadDistribution: [] };
  }
};

export const generateWorkspaceReport = async (tasks: any[], messages: any[], decisions: any[], risks: any[]) => {
  const ai = getAiClient();
  const model = "gemini-3.1-flash-lite-preview";
  const prompt = `
    Generate a comprehensive project status report based on the following data:
    
    Tasks: ${JSON.stringify(tasks)}
    Decisions: ${JSON.stringify(decisions)}
    Risks: ${JSON.stringify(risks)}
    Recent Discussion: ${JSON.stringify(messages.slice(-20))}

    The report should be in professional Markdown format, including:
    - Executive Summary
    - Task Progress Overview
    - Key Decisions Made
    - Risk Assessment & Mitigation
    - Next Steps

    Return the report as a plain text string.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "Report generation failed.";
  } catch (error) {
    console.error("Report Generation Error:", error);
    return "Error generating report.";
  }
};
