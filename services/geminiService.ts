import { GoogleGenAI } from "@google/genai";
import type { ChatMessage } from '../types';

// This will be a singleton instance.
let genAI: GoogleGenAI | null = null;

const getGeminiClient = (): GoogleGenAI => {
  if (genAI) {
    return genAI;
  }
  
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    // This error will be caught by the calling function in App.tsx
    throw new Error("A sua chave da API Google GenAI não foi configurada. Por favor, configure a variável de ambiente API_KEY.");
  }

  genAI = new GoogleGenAI({ 
    apiKey,
  });

  return genAI;
};

export const getInterpretation = async (context: string, question: string, history: ChatMessage[]): Promise<string> => {
  const systemPrompt = `
    You are an AI assistant named Legal Eagle, specializing in simplifying complex legal text.
    Your task is to provide a simplified explanation for the user's question based *only* on the provided context from a legal document.
    Your response should be *only* the simplified explanation. Do not repeat the original text from the context. Do not add introductory phrases like "Here is the explanation".
    You will be given the recent conversation history for context. Use it to continue the conversation naturally.
    
    Your entire response MUST be in European Portuguese.
    Explain the concepts in plain, easy-to-understand language, as if you were explaining it to a high school student.
    Do not invent information or use knowledge outside of the provided context.
    If the context does not contain the answer, state clearly in Portuguese (e.g., "A informação não se encontra no contexto fornecido.").
  `;

  const historyText = history.length > 0
    ? 'HISTÓRICO DA CONVERSA RECENTE:\n---\n' + history
        .map(msg => `${msg.role === 'user' ? 'Utilizador' : 'Assistente'}: ${msg.content}`)
        .join('\n') + '\n---\n'
    : '';

  const userPrompt = `
    ${historyText}
    ${context}
    
    ---
    Pergunta do Utilizador: "${question}"
    ---
    
    A sua explicação simplificada (em Português Europeu), continuando a conversa com base no histórico fornecido:
  `;

  try {
     const ai = getGeminiClient();
     const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
        }
    });

    return response.text || "Desculpe, não consegui gerar uma resposta.";
  } catch (error) {
    console.error("Error getting interpretation from Gemini:", error);
    genAI = null;
    if (error instanceof Error) {
        throw new Error("Falha ao obter uma interpretação do Gemini AI.");
    }
    throw error;
  }
};
