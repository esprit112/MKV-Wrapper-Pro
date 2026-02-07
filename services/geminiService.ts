
import { GoogleGenAI, Type } from "@google/genai";
import { MediaMetadata } from "../types";

export const getMovieMetadata = async (sanitizedLabel: string): Promise<MediaMetadata> => {
  // Use process.env.API_KEY as per instructions
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  // If no API key is set, we return mock data for demonstration
  if (!process.env.API_KEY) {
    return {
      title: "The Dark Knight",
      year: "2008",
      posterUrl: "https://picsum.photos/seed/darkknight/600/900",
      overview: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
      type: "movie"
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for movie/TV metadata for the disc label: "${sanitizedLabel}". Return the most likely match.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            year: { type: Type.STRING },
            posterUrl: { type: Type.STRING, description: 'Return a high quality poster URL' },
            overview: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['movie', 'tv'] }
          },
          required: ["title", "year", "overview"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    // Ensure we have a valid poster URL
    if (!data.posterUrl) {
      data.posterUrl = `https://picsum.photos/seed/${data.title}/600/900`;
    }
    return data;
  } catch (error) {
    console.error("Metadata retrieval failed", error);
    return {
      title: sanitizedLabel.replace(/_/g, ' '),
      year: "2024",
      posterUrl: `https://picsum.photos/seed/${sanitizedLabel}/600/900`,
      overview: "Archival process for local disc media. Metadata search currently unavailable.",
      type: "movie"
    };
  }
};
