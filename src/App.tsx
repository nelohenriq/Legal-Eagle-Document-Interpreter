import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { DocumentChunk, ChatMessage, AppState, SavedDocuments, AIProvider } from './types';
import usePdfParser from './hooks/usePdfParser';
import * as aiService from './services/aiService';
import * as storage from './services/storageService';
import FileUpload from './components/FileUpload';
import ChatInterface from './components/ChatInterface';
import DocumentLibrary from './components/DocumentLibrary';
import ApiKeySetup from './components/ApiKeySetup';
import OllamaSetup from './components/OllamaSetup';
import ReferencePanel from './components/ReferencePanel';
import { FileIcon, BrainCircuitIcon, ScalesIcon, AlertTriangleIcon, CogIcon, MoonIcon, SunIcon, XIcon, PlusIcon } from './components/Icons';

const App: React.FC = () => {
  const [aiProvider, setAiProvider] = useState<AIProvider>(storage.getAiProvider());
  const [groqApiKey, setGroqApiKey] = useState<string | null>(storage.getGroqApiKey());
  const [ollamaUrl, setOllamaUrl] = useState<string | null>(storage.getOllamaUrl());
  
  const [appState, setAppState] = useState<AppState>(AppState.INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [documentFileName, setDocumentFileName] = useState<string>('');
  const [documentChunks, setDocumentChunks] = useState<DocumentChunk[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [savedDocuments, setSavedDocuments] = useState<SavedDocuments>({});
  const [showSettingsModal, setShowSettingsModal] = useState<null | 'groq' | 'ollama'>(null);
  const [activeReferences, setActiveReferences] = useState<DocumentChunk[] | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  const { parsePdf, text: parsedText, isLoading: isParsing, error: parsingError } = usePdfParser();

  useEffect(() => {
    setSavedDocuments(storage.getSavedDocuments());
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleFileSelect = useCallback(async (file: File) => {
    setDocumentFileName(file.name);
    setDocumentChunks([]);
    setChatHistory([]);
    setActiveReferences(null);
    setError(null);
    setAppState(AppState.PARSING);
    await parsePdf(file);
  }, [parsePdf]);

  useEffect(() => {
    if (parsingError) {
      setError(`Falha ao processar o PDF: ${parsingError}`);
      setAppState(AppState.ERROR);
    }
  }, [parsingError]);
  
  useEffect(() => {
    const processParsedText = () => {
      if (parsedText && documentFileName) {
        setAppState(AppState.PROCESSING);
        
        const chunkText = (text: string, chunkSize: number, overlap: number): DocumentChunk[] => {
            const chunks: DocumentChunk[] = [];
            if (!text) return chunks;
            let i = 0;
            while (i < text.length) {
                const end = i + chunkSize;
                const content = text.substring(i, end);
                const firstLine = content.split('\n')[0].trim();
                const title = firstLine.length > 10 && firstLine.length < 100 ? firstLine : `Parte ${chunks.length + 1}`;
                chunks.push({ id: `chunk-${i}`, title: title, content: content });
                i += chunkSize - overlap;
            }
            return chunks.filter(c => c.content.trim().length > 0);
        };

        const structureDocumentByArticles = (text: string): DocumentChunk[] => {
            const chunks: DocumentChunk[] = [];
            const articleRegex = /^(Art(igo)?\.?\s+\d+º?(?:-?[A-Z\d]+)?\.?.*)/gm;
            const matches = [...text.matchAll(articleRegex)];

            if (matches.length === 0) {
                console.warn("Nenhuma estrutura de 'Artigo' encontrada. A recorrer à divisão por blocos de texto.");
                return chunkText(text, 1500, 200);
            }

            const firstMatchIndex = matches[0].index || 0;
            if (firstMatchIndex > 0) {
                const preambleContent = text.substring(0, firstMatchIndex).trim();
                if (preambleContent.length > 100) {
                    chunks.push({ id: 'chunk-preamble', title: 'Preâmbulo / Introdução', content: preambleContent });
                }
            }

            matches.forEach((match, i) => {
                const title = match[0].trim();
                const startIndex = match.index || 0;
                const nextMatch = matches[i + 1];
                const endIndex = nextMatch ? nextMatch.index : text.length;
                const fullArticleContent = text.substring(startIndex, endIndex).trim();
                chunks.push({ id: `chunk-artigo-${i}`, title: title, content: fullArticleContent });
            });

            return chunks;
        };
        
        const chunks = structureDocumentByArticles(parsedText);
        setDocumentChunks(chunks);
        storage.saveDocument(documentFileName, chunks); 
        setSavedDocuments(storage.getSavedDocuments()); 
        setChatHistory([{
          role: 'model',
          content: `O seu documento "${documentFileName}" foi processado. Encontrámos ${chunks.length} artigos/secções. Pode começar a fazer perguntas.`
        }]);
        setAppState(AppState.READY);
      }
    };
    processParsedText();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedText, documentFileName]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (aiProvider === 'groq' && !groqApiKey) {
      setShowSettingsModal('groq');
      return;
    }
    if (aiProvider === 'ollama' && !ollamaUrl) {
      setShowSettingsModal('ollama');
      return;
    }
    setAppState(AppState.ANSWERING);
    const newUserMessage: ChatMessage = { role: 'user', content: message };
    const updatedChatHistory = [...chatHistory, newUserMessage];
    setChatHistory(updatedChatHistory);
    
    try {
        const queryWords = message.toLowerCase().match(/\b(\w{3,})\b/g) || [];
        const uniqueQueryWords = [...new Set(queryWords)];

        const scoredChunks = documentChunks.map(chunk => {
            let score = 0;
            const chunkContent = chunk.content.toLowerCase();
            const chunkTitle = chunk.title.toLowerCase();
            uniqueQueryWords.forEach(word => {
                if (chunkTitle.includes(word)) score += 5;
                if (chunkContent.includes(word)) score++;
            });
            return { chunk, score };
        }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);

        const relevantChunks = scoredChunks.slice(0, 3).map(item => item.chunk);

        if (relevantChunks.length === 0) {
            setChatHistory(prev => [...prev, { role: 'model', content: "Não consegui encontrar nenhuma secção relevante no documento para responder à sua pergunta. Tente reformular." }]);
            setActiveReferences(null);
            setAppState(AppState.READY);
            return;
        }
      
        setActiveReferences(relevantChunks);
        const context = `CONTEXTO: As seguintes secções foram extraídas do documento:\n\n---\n` +
            relevantChunks.map(chunk => `Secção "${chunk.title}":\n${chunk.content}`).join('\n\n---\n') + `\n---`;
        const historyToConsider = updatedChatHistory.slice(0, -1).slice(-6);
        const interpretation = await aiService.getInterpretation(context, message, historyToConsider, aiProvider);
        setChatHistory(prev => [...prev, { role: 'model', content: interpretation }]);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'Desculpe, encontrei um erro ao gerar a resposta.';
      setChatHistory(prev => [...prev, { role: 'model', content: errorMessage }]);
    } finally {
      setAppState(AppState.READY);
    }
  }, [documentChunks, aiProvider, groqApiKey, ollamaUrl, chatHistory]);

  const handleSelectSavedDocument = (fileName: string, chunks: DocumentChunk[]) => {
    setDocumentFileName(fileName);
    setDocumentChunks(chunks);
    setChatHistory([{ role: 'model', content: `Documento "${fileName}" carregado. Pode começar a fazer perguntas.` }]);
    setAppState(AppState.READY);
    setActiveReferences(null);
    setError(null);
  };

  const handleDeleteDocument = (fileName: string) => {
    storage.deleteDocument(fileName);
    const updatedDocs = storage.getSavedDocuments();
    setSavedDocuments(updatedDocs);
    if (fileName === documentFileName) {
      setDocumentFileName('');
      setDocumentChunks([]);
      setChatHistory([]);
      setActiveReferences(null);
      setAppState(AppState.INITIAL);
    }
  };

  const handleApiKeySave = (apiKey: string) => {
    storage.saveGroqApiKey(apiKey);
    setGroqApiKey(apiKey);
    setShowSettingsModal(null);
  };
  
  const handleOllamaUrlSave = (url: string) => {
    storage.saveOllamaUrl(url);
    setOllamaUrl(url);
    setShowSettingsModal(null);
  };

  const handleProviderChange = (provider: AIProvider) => {
    storage.saveAiProvider(provider);
    setAiProvider(provider);
    if ((provider === 'groq' && !groqApiKey) || (provider === 'ollama' && !ollamaUrl)) {
        setShowSettingsModal(provider);
    } else {
        setShowSettingsModal(null);
    }
  };

  const handleThemeToggle = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  const loadingMessage = useMemo(() => {
    switch (appState) {
      case AppState.PARSING: return { icon: <FileIcon />, text: `A processar ${documentFileName}...` };
      case AppState.PROCESSING: return { icon: <BrainCircuitIcon />, text: `A analisar e a estruturar o documento...` };
      default: return null;
    }
  }, [appState, documentFileName]);
  
  const hasDocuments = Object.keys(savedDocuments).length > 0;
  const isDocumentLoaded = documentFileName && documentChunks.length > 0;

  const Modal: React.FC<{ children: React.ReactNode, title: string, onClose: () => void }> = ({ children, title, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative bg-slate-100 dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 pt-0">
          {children}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen font-sans flex flex-col md:flex-row">
      {showSettingsModal === 'groq' && (
        <Modal title="Configurar Chave da API GROQ" onClose={() => setShowSettingsModal(null)}>
          <ApiKeySetup onApiKeySave={handleApiKeySave} currentApiKey={groqApiKey} />
        </Modal>
      )}
      {showSettingsModal === 'ollama' && (
        <Modal title="Configurar Servidor Ollama" onClose={() => setShowSettingsModal(null)}>
          <OllamaSetup onUrlSave={handleOllamaUrlSave} currentUrl={ollamaUrl} />
        </Modal>
      )}

      <DocumentLibrary
        documents={savedDocuments}
        activeDocument={documentFileName}
        onSelect={handleSelectSavedDocument}
        onDelete={handleDeleteDocument}
        onFileUpload={handleFileSelect}
        onProviderChange={handleProviderChange}
        currentProvider={aiProvider}
        onThemeToggle={handleThemeToggle}
        theme={theme}
      />
      
      <main className="flex-1 flex flex-col h-screen">
        <header className="flex-shrink-0 bg-white/80 dark:bg-slate-950/70 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <ScalesIcon className="h-7 w-7 text-blue-600 dark:text-blue-500" />
              <h1 className="text-xl font-bold tracking-tight">Legal Eagle</h1>
            </div>
            {isDocumentLoaded && (
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate hidden sm:block" title={documentFileName}>
                A analisar: <span className="font-semibold text-slate-700 dark:text-slate-300">{documentFileName}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              {/* FIX: Disable settings button for Gemini and add a tooltip, as its API key is configured via environment variables. This also fixes a type error where 'gemini' was being passed to a state that only accepts 'groq' or 'ollama'. */}
              <button 
                onClick={() => { if (aiProvider !== 'gemini') setShowSettingsModal(aiProvider) }}
                disabled={aiProvider === 'gemini'}
                title={aiProvider === 'gemini' ? 'A configuração do Gemini é feita via variáveis de ambiente.' : "Configurar Fornecedor de IA"}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                aria-label="Configurar Fornecedor de IA"
              >
                  <CogIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          {!isDocumentLoaded && (
             <div className="h-full flex flex-col justify-center items-center p-8">
              {appState === AppState.INITIAL && (
                <div className="text-center max-w-2xl">
                  {hasDocuments ? (
                    <>
                      <ScalesIcon className="h-16 w-16 text-slate-400 dark:text-slate-600 mx-auto" />
                      <h2 className="mt-4 text-3xl font-bold">Bem-vindo de volta</h2>
                      <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
                        Selecione um documento da sua biblioteca na barra lateral para começar, ou carregue um novo.
                      </p>
                    </>
                  ) : (
                    <FileUpload onFileSelect={handleFileSelect} />
                  )}
                </div>
              )}
              {(appState === AppState.PARSING || appState === AppState.PROCESSING) && loadingMessage && (
                  <div className="flex flex-col items-center justify-center gap-4 text-lg">
                      <div className="h-10 w-10 animate-pulse text-blue-600 dark:text-blue-500">{loadingMessage.icon}</div>
                      <p className="text-slate-600 dark:text-slate-400">{loadingMessage.text}</p>
                  </div>
              )}
             </div>
          )}

          {appState === AppState.ERROR && (
               <div className="h-full flex flex-col items-center justify-center p-8">
                  <div className="flex flex-col items-center justify-center gap-4 text-lg bg-red-50 dark:bg-red-900/20 p-8 rounded-lg max-w-2xl mx-auto">
                     <AlertTriangleIcon className="h-12 w-12 text-red-500" />
                     <h2 className="text-2xl font-bold text-red-700 dark:text-red-400">Ocorreu um Erro</h2>
                     <p className="text-slate-600 dark:text-slate-400 text-center max-w-md">{error}</p>
                 </div>
               </div>
          )}
          
          {isDocumentLoaded && (appState === AppState.READY || appState === AppState.ANSWERING) && (
             <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full p-4 sm:p-6 lg:p-8">
                 <div className="xl:col-span-2 h-full">
                     <ChatInterface
                         messages={chatHistory}
                         onSendMessage={handleSendMessage}
                         isLoading={appState === AppState.ANSWERING}
                     />
                 </div>
                 <div className="hidden xl:block xl:col-span-1 h-full overflow-hidden">
                     <ReferencePanel references={activeReferences} />
                 </div>
             </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
