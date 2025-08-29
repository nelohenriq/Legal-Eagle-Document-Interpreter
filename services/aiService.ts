import type { AIProvider, ChatMessage } from '../types';
import * as geminiService from './geminiService';
import * as groqService from './groqService';
import * as ollamaService from './ollamaService';

export const getInterpretation = async (
  context: string,
  question: string,
  history: ChatMessage[],
  provider: AIProvider
): Promise<string> => {
  if (provider === 'groq') {
    return groqService.getInterpretation(context, question, history);
  }
  if (provider === 'ollama') {
    return ollamaService.getInterpretation(context, question, history);
  }
  return geminiService.getInterpretation(context, question, history);
};