
import { GoogleGenAI } from "@google/genai";

export const getSunnahExplanation = async (sunnahTitle: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `সুন্নাহ: "${sunnahTitle}"। এই সুন্নাহটির গুরুত্ব, ফজিলত এবং এটি পালনের সঠিক নিয়ম সম্পর্কে খুব সংক্ষেপে ৪-৫ লাইনে বাংলায় একটি ব্যাখ্যা দিন।`,
    });
    return response.text || "দুঃখিত, কোনো ব্যাখ্যা পাওয়া যায়নি।";
  } catch (error) {
    console.error("AI Error:", error);
    return "AI এর মাধ্যমে তথ্য আনতে সমস্যা হচ্ছে। অনুগ্রহ করে পরে চেষ্টা করুন।";
  }
};

export const searchVirtues = async (query: string): Promise<{text: string, sources: any[]}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `ইসলামী ইবাদতের ফজিলত সম্পর্কে তথ্য দিন: "${query}"। উত্তরটি বাংলায় দিন এবং নির্ভরযোগ্য হাদিসের রেফারেন্স দিন।`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return {
      text: response.text || "দুঃখিত, কোনো তথ্য পাওয়া যায়নি।",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Search Error:", error);
    return { text: "সার্চ করতে সমস্যা হয়েছে।", sources: [] };
  }
};
