import { GoogleGenAI, Type } from "@google/genai";
import { VocabWord } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const explainWord = async (word: VocabWord): Promise<any> => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze the Chinese word: "${word.hanzi}" (Pinyin: ${word.pinyin}).
    Level: HSK ${word.level}.
    Meaning provided: ${word.translations.join(', ')}.

    Provide a JSON response with:
    1. A concise explanation of its nuance or usage.
    2. Two example sentences (Chinese, Pinyin, English).
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nuance: { type: Type.STRING },
            examples: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  chinese: { type: Type.STRING },
                  pinyin: { type: Type.STRING },
                  english: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No response text");
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
