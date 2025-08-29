import Groq from 'groq-sdk';
import * as storage from './storageService';
import type { ChatMessage } from '../types';

let groq: Groq | null = null;

const getGroqClient = (): Groq => {
  const apiKey = storage.getGroqApiKey();
  if (!apiKey) {
    throw new Error("A sua chave da API GROQ não foi configurada. Por favor, vá às definições para a adicionar.");
  }

  // If the client already exists with the same key, return it
  // This is a simple check; more complex key rotation logic isn't needed here.
  if (groq && groq.apiKey === apiKey) {
    return groq;
  }

  // Otherwise, create a new instance
  groq = new Groq({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  return groq;
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
    If the context does not contain the answer, state that clearly in Portuguese (e.g., "A informação não se encontra no contexto fornecido.").
  `;

  const userPrompt = `
    ${context}
    
    ---
    User's Question: "${question}"
    ---
    
    Your simplified explanation (in European Portuguese), continuing the conversation based on the history provided:
  `;

  try {
     const ai = getGroqClient();

     const groqHistory = history.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.content
     } as const));

     const chatCompletion = await ai.chat.completions.create({
        messages: [
            { role: "system", content: systemPrompt },
            ...groqHistory,
            { role: "user", content: userPrompt }
        ],
        model: "llama3-70b-8192",
        temperature: 0.7,
     });

    return chatCompletion.choices[0]?.message?.content || "Desculpe, não consegui gerar uma resposta.";

  } catch (error) {
    console.error("Error getting interpretation from Groq:", error);
    groq = null; // Invalidate client on error
    if (error instanceof Error) {
        throw new Error(`Falha ao obter uma interpretação do Groq AI: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Tests the connection to the Groq API with a given API key.
 * @param apiKey The API key to test.
 * @returns An object with success status and a message.
 */
export const testConnection = async (apiKey: string): Promise<{ success: boolean; message: string }> => {
  if (!apiKey) {
    return { success: false, message: 'A chave da API não pode estar vazia.' };
  }
  
  try {
    const testGroq = new Groq({
      apiKey,
      dangerouslyAllowBrowser: true,
    });

    // Make a very small, cheap request to validate the key
    await testGroq.chat.completions.create({
      messages: [{ role: 'user', content: 'test' }],
      model: 'llama3-70b-8192',
      max_tokens: 1,
    });
    
    return { success: true, message: 'Ligação bem-sucedida!' };

  } catch (error: any) {
    console.error("Groq connection test failed:", error);
    let errorMessage = 'Ocorreu um erro desconhecido.';
    if (error.status === 401) {
      errorMessage = 'Falha na autenticação. A chave da API é inválida ou expirou.';
    } else if (error instanceof Error && error.message.includes('fetch')) {
      errorMessage = 'Falha na rede. Verifique a sua ligação à Internet.'
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { success: false, message: `A ligação falhou: ${errorMessage}` };
  }
};