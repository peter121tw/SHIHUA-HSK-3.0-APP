import { GoogleGenAI, Type } from "@google/genai";
import { VocabWord, CultureTip } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL = "gemini-3-flash-preview";

export const explainWord = async (word: VocabWord): Promise<any> => {
  const prompt = `
    Analyze the Chinese word: "${word.hanzi}" (Pinyin: ${word.pinyin}).
    Level: HSK ${word.level}.
    Meaning provided: ${word.translations.join(', ')}.
    ${word.translationsThai ? `Thai Meaning: ${word.translationsThai.join(', ')}` : ''}

    Provide a JSON response with:
    1. A concise explanation of its nuance or usage in Thai language.
    2. Two example sentences (Chinese, Pinyin, Thai translation).
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
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
                  translation: { type: Type.STRING }
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

export const identifyTextInImage = async (base64Image: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: "Identify all legible Chinese words (Simplified or Traditional) in this image. Return them as a flat JSON array of strings. Ignore single characters unless they are meaningful words on their own. Ignore non-Chinese text."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return [];
  }
};

export const generateCultureTip = async (word: VocabWord): Promise<CultureTip> => {
  const prompt = `
    Create a "Culture Tip" for the Chinese word: "${word.hanzi}" (Pinyin: ${word.pinyin}).
    
    The tip should:
    1. Be a brief, interesting fact about how this word is used in daily life in China or a cultural nuance.
    2. Be friendly and educational.
    3. Include Pinyin annotation for the tip if relevant.
    4. Provide a translation of the tip in Thai.

    Output format: JSON with keys: "tip" (English text), "pinyin" (Pinyin for the Chinese terms used), "thai" (Thai translation).
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tip: { type: Type.STRING },
            pinyin: { type: Type.STRING },
            thai: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No tip generated");
  } catch (error) {
    console.error("Gemini Culture Tip Error:", error);
    throw error;
  }
};