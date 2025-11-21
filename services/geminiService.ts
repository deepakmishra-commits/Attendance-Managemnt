import { GoogleGenAI } from "@google/genai";
import { User, AttendanceRecord } from "../types";

// Safely access process.env to avoid "process is not defined" in browser environments
const API_KEY = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';

let aiClient: GoogleGenAI | null = null;

// Initialize client only if key is present to avoid runtime crashes on start
if (API_KEY) {
  aiClient = new GoogleGenAI({ apiKey: API_KEY });
}

export const generateAIResponse = async (
  prompt: string, 
  contextData?: { user: User, attendance: AttendanceRecord[] }
): Promise<string> => {
  if (!aiClient) {
    return "AI Assistant is unavailable. Please configure the API Key.";
  }

  let fullPrompt = prompt;
  if (contextData) {
    const recentAttendance = contextData.attendance.slice(-5).map(a => `${a.date}: ${a.status}`).join('\n');
    fullPrompt = `
      System Instruction: You are a helpful HR Assistant for an attendance app. 
      User Context: ${contextData.user.name}, Role: ${contextData.user.role}.
      Recent Attendance:
      ${recentAttendance}
      
      User Query: ${prompt}
      
      Answer strictly based on HR context. Keep it brief and professional.
    `;
  }

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    });
    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error processing your request.";
  }
};