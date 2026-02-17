
import { GoogleGenAI, Type } from "@google/genai";
import { SquareValue } from "../types";

// Service to determine the best Tic-Tac-Toe move using Gemini AI
export const getBestMove = async (board: SquareValue[], aiSymbol: 'X' | 'O'): Promise<number> => {
  // Always initialize client using named parameter and process.env.API_KEY directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Format board for prompt: index mapping and current values
  const boardDescription = board.map((val, idx) => `${idx}: ${val || 'empty'}`).join(', ');
  const opponentSymbol = aiSymbol === 'X' ? 'O' : 'X';

  const prompt = `
    You are an unbeatable Tic-Tac-Toe expert.
    The current board state is represented by indices 0 to 8:
    ${boardDescription}

    You are playing as "${aiSymbol}". Your opponent is "${opponentSymbol}".
    Analyze the board carefully. 
    1. If you can win in one move, take it.
    2. If your opponent can win in their next move, block them.
    3. Otherwise, play the strategically best move (e.g., center, corners).

    Return ONLY the index (0-8) of your chosen move.
  `;

  try {
    const response = await ai.models.generateContent({
      // Use gemini-3-pro-preview for complex reasoning and logic tasks
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            move: {
              type: Type.INTEGER,
              description: "The index of the move to make (0-8).",
            },
            reasoning: {
              type: Type.STRING,
              description: "Brief explanation of the choice."
            }
          },
          required: ["move"],
        },
      },
    });

    // Extract text output using the .text property (not a method)
    const jsonStr = (response.text || "").trim();
    if (!jsonStr) throw new Error("Empty response from AI");
    
    const result = JSON.parse(jsonStr);
    const move = result.move;

    if (typeof move === 'number' && move >= 0 && move <= 8 && board[move] === null) {
      return move;
    }

    // Fallback: Pick first available square if AI fails to return a valid move
    const available = board.map((v, i) => v === null ? i : null).filter(v => v !== null) as number[];
    return available[0];
  } catch (error) {
    console.error("Gemini AI failed to pick a move:", error);
    // Fallback logic
    const available = board.map((v, i) => v === null ? i : null).filter(v => v !== null) as number[];
    return available[Math.floor(Math.random() * available.length)];
  }
};