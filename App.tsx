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
import { FileIcon, BrainCircuitIcon, ScalesIcon, AlertTriangleIcon, CogIcon, GeminiIcon, GroqIcon, LlamaIcon } from './components/Icons';


const App: React.FC = () => {
  const [aiProvider, setAiProvider] = useState<AIProvider>(storage.getAiProvider());
  const [groqApiKey, setGroqApiKey] = useState<string | null>(storage.getGroqApiKey());
  const [ollamaUrl, setOllamaUrl] = useState<string | null>(storage.getOllamaUrl());
  
  const [appState, setAppState] = useState<AppState>(AppState.INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentFileName, setDocumentFileName] = useState<string>('');
  const [documentChunks, setDocumentChunks] = useState<DocumentChunk[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [savedDocuments, setSavedDocuments] = useState<SavedDocuments>({});
  const [showProviderSetup, setShowProviderSetup] = useState(false);
  const [activeReferences, setActiveReferences] = useState<DocumentChunk[] | null>(null);


  const { parsePdf, text: parsedText, isLoading: isParsing, error: parsingError } = usePdfParser();

  useEffect(() => {
    setSavedDocuments(storage.getSavedDocuments());
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    setDocumentFile(file);
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
        
        // Fallback for documents that don't use the "Artigo" structure.
        const chunkText = (text: string, chunkSize: number, overlap: number): DocumentChunk[] => {
            const chunks: DocumentChunk[] = [];
            if (!text) return chunks;
            
            let i = 0;
            while (i < text.length) {
                const end = i + chunkSize;
                const content = text.substring(i, end);
                const firstLine = content.split('\n')[0].trim();
                const title = firstLine.length > 10 && firstLine.length < 100 ? firstLine : `Parte ${chunks.length + 1}`;

                chunks.push({
                    id: `chunk-${i}`,
                    title: title,
                    content: content
                });
                
                i += chunkSize - overlap;
            }
            return chunks.filter(c => c.content.trim().length > 0);
        };

        const structureDocumentByArticles = (text: string): DocumentChunk[] => {
            const chunks: DocumentChunk[] = [];
            // Regex to match "Artigo 1.º", "Art. 2.º", "Artigo 3-A." etc. at the start of a line.
            const articleRegex = /^(Art(igo)?\.?\s+\d+º?(?:-?[A-Z\d]+)?\.?.*)/gm;
            
            const matches = [...text.matchAll(articleRegex)];

            if (matches.length === 0) {
                console.warn("Nenhuma estrutura de 'Artigo' encontrada. A recorrer à divisão por blocos de texto.");
                return chunkText(text, 1500, 200);
            }

            // Handle text before the first article (preamble)
            const firstMatchIndex = matches[0].index || 0;
            if (firstMatchIndex > 0) {
                const preambleContent = text.substring(0, firstMatchIndex).trim();
                if (preambleContent.length > 100) { // Threshold for meaningful content
                    chunks.push({
                        id: 'chunk-preamble',
                        title: 'Preâmbulo / Introdução',
                        content: preambleContent,
                    });
                }
            }

            // Create chunks for each article
            matches.forEach((match, i) => {
                const title = match[0].trim();
                const startIndex = match.index || 0;
                
                const nextMatch = matches[i + 1];
                const endIndex = nextMatch ? nextMatch.index : text.length;
                
                const fullArticleContent = text.substring(startIndex, endIndex).trim();

                chunks.push({
                    id: `chunk-artigo-${i}`,
                    title: title,
                    // The content is the full article text, including its own title, for display and context.
                    content: fullArticleContent,
                });
            });

            return chunks;
        };
        
        const chunks = structureDocumentByArticles(parsedText);
        
        setDocumentChunks(chunks);
        storage.saveDocument(documentFileName, chunks); 
        setSavedDocuments(storage.getSavedDocuments()); 
        setChatHistory([{
          role: 'model',
          content: `O seu documento "${documentFileName}" foi processado e estruturado. Encontrámos ${chunks.length} artigos/secções. Agora pode "conversar" com ele. Faça uma pergunta para começar.`
        }]);
        setAppState(AppState.READY);
      }
    };
    processParsedText();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedText, documentFileName]);


  const handleSendMessage = useCallback(async (message: string) => {
     if (aiProvider === 'groq' && !groqApiKey) {
        setChatHistory(prev => [...prev, { role: 'model', content: 'Erro: A chave da API GROQ não está configurada. Por favor, configure-a no menu de definições.' }]);
        return;
    }
    if (aiProvider === 'ollama' && !ollamaUrl) {
      setChatHistory(prev => [...prev, { role: 'model', content: 'Erro: O URL do servidor Ollama não está configurado. Por favor, configure-o no menu de definições.' }]);
      return;
    }
    setAppState(AppState.ANSWERING);
    
    const newUserMessage: ChatMessage = { role: 'user', content: message };
    const updatedChatHistory = [...chatHistory, newUserMessage];
    setChatHistory(updatedChatHistory);
    
    try {
        const queryWords = message.toLowerCase().match(/\b(\w{3,})\b/g) || [];
        const uniqueQueryWords = [...new Set(queryWords)];

        if (uniqueQueryWords.length === 0) {
            setChatHistory(prev => [...prev, { role: 'model', content: "Por favor, faça uma pergunta mais específica para que eu possa encontrar a informação no documento." }]);
            setAppState(AppState.READY);
            return;
        }

        const scoredChunks = documentChunks.map(chunk => {
            let score = 0;
            const chunkContent = chunk.content.toLowerCase();
            const chunkTitle = chunk.title.toLowerCase();

            uniqueQueryWords.forEach(word => {
                // Higher score for matches in the title (e.g., matching article number)
                if (chunkTitle.includes(word)) {
                    score += 5;
                }
                if (chunkContent.includes(word)) {
                    score++;
                }
            });
            return { chunk, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);

        const relevantChunks = scoredChunks.slice(0, 3).map(item => item.chunk);

        if (relevantChunks.length === 0) {
            setChatHistory(prev => [...prev, { role: 'model', content: "Não consegui encontrar nenhuma secção relevante no documento para responder à sua pergunta. Tente reformular a sua questão." }]);
            setActiveReferences(null);
            setAppState(AppState.READY);
            return;
        }
      
        setActiveReferences(relevantChunks);
        const context = `CONTEXTO: As seguintes secções foram extraídas do documento por serem relevantes para a pergunta do utilizador:\n\n---\n` +
            relevantChunks.map(chunk => `Secção "${chunk.title}":\n${chunk.content}`).join('\n\n---\n') +
            `\n---`;

        const historyToConsider = updatedChatHistory.slice(0, -1).slice(-6);

        const interpretation = await aiService.getInterpretation(context, message, historyToConsider, aiProvider);

        setChatHistory(prev => [...prev, { role: 'model', content: interpretation }]);

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'Desculpe, encontrei um erro ao gerar a resposta. Por favor, tente novamente.';
      setChatHistory(prev => [...prev, { role: 'model', content: errorMessage }]);
    } finally {
      setAppState(AppState.READY);
    }
  }, [documentChunks, aiProvider, groqApiKey, ollamaUrl, chatHistory]);

  const resetState = () => {
    setAppState(AppState.INITIAL);
    setError(null);
    setDocumentFile(null);
    setDocumentFileName('');
    setDocumentChunks([]);
    setChatHistory([]);
    setShowProviderSetup(false);
    setActiveReferences(null);
  };

  const handleSelectSavedDocument = (fileName: string, chunks: DocumentChunk[]) => {
    setDocumentFileName(fileName);
    setDocumentChunks(chunks);
    setChatHistory([{
      role: 'model',
      content: `Documento "${fileName}" carregado da sua biblioteca. Pode começar a fazer perguntas.`
    }]);
    setAppState(AppState.READY);
    setShowProviderSetup(false);
    setActiveReferences(null);
  };

  const handleDeleteDocument = (fileName: string) => {
    storage.deleteDocument(fileName);
    setSavedDocuments(storage.getSavedDocuments());
  };

  const handleApiKeySave = (apiKey: string) => {
    storage.saveGroqApiKey(apiKey);
    setGroqApiKey(apiKey);
    setShowProviderSetup(false);
    if (appState === AppState.ERROR && error?.includes('GROQ')) {
        resetState();
    }
  };
  
  const handleOllamaUrlSave = (url: string) => {
    storage.saveOllamaUrl(url);
    setOllamaUrl(url);
    setShowProviderSetup(false);
  };

  const handleProviderChange = (provider: AIProvider) => {
    storage.saveAiProvider(provider);
    setAiProvider(provider);
    if ((provider === 'groq' && !groqApiKey) || (provider === 'ollama' && !ollamaUrl)) {
        setShowProviderSetup(true);
    } else {
        setShowProviderSetup(false);
    }
  };

  const handleToggleProviderSetup = () => {
    if (aiProvider === 'gemini') {
      alert("O Gemini utiliza a chave de API do ambiente do projeto e não requer configuração adicional aqui.");
      return;
    }
    setShowProviderSetup(s => !s);
  };
  
  const loadingMessage = useMemo(() => {
    switch (appState) {
      case AppState.PARSING:
        return { icon: <FileIcon className="h-8 w-8 animate-pulse" />, text: `A processar ${documentFileName}...` };
      case AppState.PROCESSING:
        return { icon: <BrainCircuitIcon className="h-8 w-8 animate-pulse" />, text: `A analisar e a estruturar o documento por artigos...` };
      default:
        return null;
    }
  }, [appState, documentFileName]);
  
  const mainContent = () => {
    if (showProviderSetup) {
      if (aiProvider === 'groq') {
        return <div className="max-w-2xl mx-auto"><ApiKeySetup onApiKeySave={handleApiKeySave} currentApiKey={groqApiKey} /></div>;
      }
      if (aiProvider === 'ollama') {
        return <div className="max-w-2xl mx-auto"><OllamaSetup onUrlSave={handleOllamaUrlSave} currentUrl={ollamaUrl} /></div>;
      }
    }
    switch (appState) {
        case AppState.INITIAL:
            return (
                <div className="max-w-3xl mx-auto">
                    <DocumentLibrary 
                        documents={savedDocuments}
                        onSelect={handleSelectSavedDocument}
                        onDelete={handleDeleteDocument}
                    />
                    <div className="mt-12">
                        <FileUpload onFileSelect={handleFileSelect} />
                    </div>
                </div>
            );
        case AppState.PARSING:
        case AppState.PROCESSING:
            return loadingMessage && (
                <div className="flex flex-col items-center justify-center h-96 gap-4 text-lg">
                    {loadingMessage.icon}
                    <p className="text-slate-600 dark:text-slate-400">{loadingMessage.text}</p>
                </div>
            );
        case AppState.ERROR:
            return (
                 <div className="flex flex-col items-center justify-center h-96 gap-4 text-lg bg-red-50 dark:bg-red-900/20 p-8 rounded-lg max-w-2xl mx-auto">
                    <AlertTriangleIcon className="h-12 w-12 text-red-500" />
                    <h2 className="text-2xl font-bold text-red-700 dark:text-red-400">Ocorreu um Erro</h2>
                    <p className="text-slate-600 dark:text-slate-400 text-center max-w-md">{error}</p>
                    <button onClick={resetState} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                        Tentar Novamente
                    </button>
                </div>
            );
        case AppState.READY:
        case AppState.ANSWERING:
             return (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-3">
                        <ChatInterface
                            documentName={documentFileName}
                            messages={chatHistory}
                            onSendMessage={handleSendMessage}
                            isLoading={appState === AppState.ANSWERING}
                            provider={aiProvider}
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <ReferencePanel references={activeReferences} />
                    </div>
                </div>
            );
        default:
            return null;
    }
  };

  const ProviderButton: React.FC<{ provider: AIProvider, current: AIProvider, children: React.ReactNode, onClick: (p: AIProvider) => void }> = ({ provider, current, children, onClick }) => {
    const isActive = provider === current;
    return (
      <button 
        onClick={() => onClick(provider)} 
        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
          isActive 
            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md scale-105' 
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
        }`}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans">
      <header className="sticky top-0 z-30 bg-white/70 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ScalesIcon className="h-8 w-8 text-blue-600 dark:text-blue-500" />
            <h1 className="text-xl font-bold tracking-tight">Legal Eagle</h1>
          </div>
          <div className="flex items-center gap-4">
             {appState !== AppState.INITIAL && !showProviderSetup && (
                <button onClick={resetState} className="text-sm font-medium text-blue-600 dark:text-blue-500 hover:underline">
                Voltar à Biblioteca
                </button>
            )}
             <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-xl">
                <ProviderButton provider="gemini" current={aiProvider} onClick={handleProviderChange}>
                  <GeminiIcon className="h-4 w-4" /> Gemini
                </ProviderButton>
                <ProviderButton provider="groq" current={aiProvider} onClick={handleProviderChange}>
                  <GroqIcon className="h-4 w-4" /> Groq
                </ProviderButton>
                <ProviderButton provider="ollama" current={aiProvider} onClick={handleProviderChange}>
                  <LlamaIcon className="h-4 w-4" /> Ollama
                </ProviderButton>
             </div>
             <button onClick={handleToggleProviderSetup} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Configurar Fornecedor de IA">
                <CogIcon className="h-5 w-5 text-slate-500" />
             </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {mainContent()}
      </main>
    </div>
  );
};

export default App;