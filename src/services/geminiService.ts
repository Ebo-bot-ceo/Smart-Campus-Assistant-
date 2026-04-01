import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AISuggestion {
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
}

export async function getAcademicSuggestions(courses: any[], deadlines: any[], currentGPA: number, targetGPA: number): Promise<AISuggestion[]> {
  try {
    const prompt = `As an Academic Advisor, analyze this student's profile and provide 3-5 actionable suggestions.
    
    Current GPA: ${currentGPA.toFixed(2)}
    Target GPA: ${targetGPA.toFixed(2)}
    
    Courses:
    ${courses.map(c => `- ${c.courseName} (${c.courseCode}): Difficulty: ${c.difficulty}, Credits: ${c.credits}, Grade: ${c.grade || 'In Progress'}`).join('\n')}
    
    Upcoming Deadlines:
    ${deadlines.map(d => `- ${d.title} for ${d.courseId}: Due ${d.dueDate}, Priority: ${d.priority}`).join('\n')}
    
    CRITICAL INSTRUCTIONS:
    1. Consider Course Difficulty: Prioritize warnings for "Hard" difficulty courses that are "In Progress".
    2. Consider Credits: High-credit courses (e.g., 3 or 4 credits) have a larger impact on GPA. Suggest focusing more effort on these.
    3. Strategic Balance: If a student has multiple "Hard" courses, suggest time management strategies.
    4. GPA Gap: If the current GPA is significantly below the target, provide more aggressive study strategies for high-impact (high-credit/high-difficulty) courses.
    
    Provide suggestions in JSON format with fields: type ('warning', 'info', 'success'), title, and description.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ['warning', 'info', 'success'] },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ['type', 'title', 'description'],
          },
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Error fetching AI suggestions:", error);
    return [];
  }
}
