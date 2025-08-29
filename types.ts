export interface DocumentChunk {
  id: string;
  title: string;
  content: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export enum AppState {
  INITIAL,
  PARSING,
  PROCESSING, // Was STRUCTURING
  READY,
  ANSWERING,
  ERROR,
}

export type SavedDocuments = Record<string, DocumentChunk[]>;

export type AIProvider = 'gemini' | 'groq' | 'ollama';