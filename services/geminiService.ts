
import { GoogleGenAI, Type } from "@google/genai";
import { SquareValue } from "../types.ts";

export const getBestMove = async (board: SquareValue[], aiSymbol: 'X' | 'O'): Promise<number> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    Return ONLY the index (0-8) of your chosen move.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            move: { type: Type.INTEGER, description: "Index 0-8" }
          },
          required: ["move"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    const move = result.move;

    if (typeof move === 'number' && move >= 0 && move <= 8 && board[move] === null) {
      return move;
    }
    const available = board.map((v, i) => v === null ? i : null).filter(v => v !== null) as number[];
    return available[0];
  } catch (error) {
    const available = board.map((v, i) => v === null ? i : null).filter(v => v !== null) as number[];
    return available[Math.floor(Math.random() * available.length)];
  }
};
