
import { GoogleGenAI, Type } from "@google/genai";
import { ColorAnalysis } from '../types';

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    palette: {
      type: Type.ARRAY,
      description: "An array of 10 to 12 distinct and prominent colors found in the image.",
      items: {
        type: Type.OBJECT,
        properties: {
          hex: {
            type: Type.STRING,
            description: "The hex code of the color, e.g., #A1B2C3."
          },
          rgb: {
            type: Type.STRING,
            description: "The RGB value of the color, e.g., rgb(161, 178, 195)."
          },
          name: {
            type: Type.STRING,
            description: "A creative name for the color in Korean, e.g., 'Dusty Rose' or 'Midnight Blue'."
          },
          description: {
            type: Type.STRING,
            description: "A brief description in Korean of where this color appears prominently in the image."
          }
        },
        required: ["hex", "rgb", "name", "description"]
      }
    }
  },
  required: ["palette"]
};

export async function analyzeImageColors(base64Image: string, mimeType: string, apiKey: string): Promise<ColorAnalysis> {
  // Initialize the client with the provided user key
  const ai = new GoogleGenAI({ apiKey: apiKey });

  try {
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };

    const textPart = {
      text: "이미지의 색상을 상세하게 분석해주세요. 이미지의 분위기와 구성을 대표하는 10~12가지의 뚜렷하고 주요한 색상 팔레트를 식별하세요. 각 색상에 대해 16진수 코드(hex), RGB 값, 창의적인 한국어 이름, 그리고 해당 색상이 이미지에서 주로 어디에 나타나는지에 대한 짧은 한국어 설명을 제공하세요. 제공된 스키마에 따라 JSON 형식으로 응답하세요.",
    };
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2,
      }
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);

    // Basic validation to ensure the response matches the expected structure
    if (parsedJson.palette && Array.isArray(parsedJson.palette)) {
      return parsedJson as ColorAnalysis;
    } else {
      throw new Error("Invalid response format from Gemini API.");
    }

  } catch (error) {
    console.error("Error analyzing image colors:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to analyze image: ${error.message}`);
    }
    throw new Error("An unknown error occurred during image analysis.");
  }
}
