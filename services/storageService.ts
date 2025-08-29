import type { DocumentChunk, SavedDocuments, AIProvider } from '../types';

const DOCUMENTS_STORAGE_KEY = 'legal-eagle-documents';
const GROQ_API_KEY_STORAGE_KEY = 'legal-eagle-groq-api-key';
const OLLAMA_URL_STORAGE_KEY = 'legal-eagle-ollama-url';
const API_PROVIDER_STORAGE_KEY = 'legal-eagle-api-provider';


/**
 * Retrieves all saved documents from localStorage.
 * @returns A record of filenames to DocumentChunk arrays.
 */
export const getSavedDocuments = (): SavedDocuments => {
  try {
    const savedData = localStorage.getItem(DOCUMENTS_STORAGE_KEY);
    return savedData ? JSON.parse(savedData) : {};
  } catch (error) {
    console.error("Failed to retrieve documents from localStorage:", error);
    return {};
  }
};

/**
 * Saves a single document's structured data to localStorage.
 * @param fileName The name of the document file.
 * @param chunks The array of structured chunks to save.
 */
export const saveDocument = (fileName: string, chunks: DocumentChunk[]): void => {
  try {
    const allDocs = getSavedDocuments();
    allDocs[fileName] = chunks;
    localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(allDocs));
  } catch (error) {
    console.error(`Failed to save document "${fileName}" to localStorage:`, error);
  }
};

/**
 * Deletes a document from localStorage by its filename.
 * @param fileName The name of the document to delete.
 */
export const deleteDocument = (fileName: string): void => {
  try {
    const allDocs = getSavedDocuments();
    delete allDocs[fileName];
    localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(allDocs));
  } catch (error)
    {
    console.error(`Failed to delete document "${fileName}" from localStorage:`, error);
  }
};

/**
 * Retrieves the stored Groq API key from localStorage.
 * @returns The API key string, or null if not found.
 */
export const getGroqApiKey = (): string | null => {
  return localStorage.getItem(GROQ_API_KEY_STORAGE_KEY);
};

/**
 * Saves the Groq API key to localStorage.
 * @param apiKey The Groq API key to save.
 */
export const saveGroqApiKey = (apiKey: string): void => {
  localStorage.setItem(GROQ_API_KEY_STORAGE_KEY, apiKey);
};

/**
 * Retrieves the stored Ollama Server URL from localStorage.
 * @returns The URL string, or null if not found.
 */
export const getOllamaUrl = (): string | null => {
  return localStorage.getItem(OLLAMA_URL_STORAGE_KEY);
};

/**
 * Saves the Ollama Server URL to localStorage.
 * @param url The Ollama URL to save.
 */
export const saveOllamaUrl = (url: string): void => {
  localStorage.setItem(OLLAMA_URL_STORAGE_KEY, url);
};


/**
 * Retrieves the user's preferred AI provider.
 * Defaults to 'gemini'.
 */
export const getAiProvider = (): AIProvider => {
    return (localStorage.getItem(API_PROVIDER_STORAGE_KEY) as AIProvider) || 'gemini';
};

/**
 * Saves the user's preferred AI provider.
 * @param provider The provider to save ('gemini', 'groq', or 'ollama').
 */
export const saveAiProvider = (provider: AIProvider): void => {
    localStorage.setItem(API_PROVIDER_STORAGE_KEY, provider);
};