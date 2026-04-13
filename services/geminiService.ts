
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeStockMovement = async (data: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analise os seguintes dados de estoque e forneça um resumo executivo: ${data}`,
  });
  return response.text;
};
