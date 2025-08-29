import * as storage from './storageService';
import type { ChatMessage } from '../types';

/**
 * Gets an interpretation from a configured Ollama server.
 */
export const getInterpretation = async (context: string, question: string, history: ChatMessage[]): Promise<string> => {
  const url = storage.getOllamaUrl();
  if (!url) {
    throw new Error("O URL do servidor Ollama não está configurado.");
  }

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

  const ollamaHistory = history.map(msg => ({
    role: msg.role === 'model' ? 'assistant' : 'user',
    content: msg.content
  }));

  const messages = [
    { role: "system", content: systemPrompt },
    ...ollamaHistory,
    { role: "user", content: userPrompt }
  ];

  try {
    const response = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3', // A common default model
        messages: messages,
        stream: false, // We want the full response at once
      }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`O servidor Ollama respondeu com o estado ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    return data.message?.content || "Desculpe, não consegui gerar uma resposta do Ollama.";
  } catch (error) {
    console.error("Error getting interpretation from Ollama:", error);
    if (error instanceof Error) {
        throw new Error(`Falha ao obter uma interpretação do Ollama: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Tests the connection to the Ollama server.
 * @param url The server URL to test.
 * @returns An object with success status and a message.
 */
export const testConnection = async (url: string): Promise<{ success: boolean; message: string }> => {
  if (!url) {
    return { success: false, message: 'O URL não pode estar vazio.' };
  }
  
  try {
    // Ollama's root endpoint should respond with "Ollama is running"
    const response = await fetch(url, { method: 'GET' });
    
    if (response.ok) {
       const textResponse = await response.text();
       if (textResponse.includes("Ollama is running")) {
         return { success: true, message: 'Ligação bem-sucedida!' };
       }
    }
    
    // If we are here, it means the response was not as expected
    return { success: false, message: `A ligação falhou: O servidor no URL fornecido não parece ser um servidor Ollama válido.` };

  } catch (error: any) {
    console.error("Ollama connection test failed:", error);
    let errorMessage = 'Ocorreu um erro desconhecido.';
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'Falha na rede ou URL inalcançável. Verifique o URL e as definições de CORS do seu servidor Ollama.';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { success: false, message: `A ligação falhou: ${errorMessage}` };
  }
};