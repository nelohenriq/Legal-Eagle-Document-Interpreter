import React from 'react';
import type { DocumentChunk, SavedDocuments, AIProvider } from '../types';
import { BookOpenIcon, TrashIcon, PlusIcon, GeminiIcon, GroqIcon, LlamaIcon, SunIcon, MoonIcon } from './Icons';

interface SidebarProps {
  documents: SavedDocuments;
  activeDocument: string | null;
  onSelect: (fileName: string, chunks: DocumentChunk[]) => void;
  onDelete: (fileName:string) => void;
  onFileUpload: (file: File) => void;
  onProviderChange: (provider: AIProvider) => void;
  currentProvider: AIProvider;
  onThemeToggle: () => void;
  theme: 'light' | 'dark';
}

const DocumentLibrary: React.FC<SidebarProps> = ({ 
  documents, activeDocument, onSelect, onDelete, onFileUpload, 
  onProviderChange, currentProvider, onThemeToggle, theme
}) => {
  const documentEntries = Object.entries(documents);

  const handleDelete = (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation();
    if (window.confirm(`Tem a certeza que quer apagar "${fileName}"?`)) {
        onDelete(fileName);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (e.target.files[0].type === 'application/pdf') {
        onFileUpload(e.target.files[0]);
      } else {
        alert("Please select a PDF file.");
      }
    }
     // Reset input value to allow re-uploading the same file
    e.target.value = '';
  };

  const ProviderButton: React.FC<{ provider: AIProvider, children: React.ReactNode }> = ({ provider, children }) => {
    const isActive = provider === currentProvider;
    return (
      <button 
        onClick={() => onProviderChange(provider)} 
        className={`flex-1 flex items-center justify-center gap-2 p-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${
          isActive 
            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
        }`}
        aria-label={`Mudar para ${provider}`}
      >
        {children}
      </button>
    );
  };
  
  return (
    <aside className="w-full md:w-80 lg:w-96 flex-shrink-0 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col md:h-full">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 h-16 flex items-center justify-between">
        <h2 className="text-lg font-bold">Biblioteca</h2>
        <label htmlFor="new-document-upload" className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer">
          <PlusIcon className="h-4 w-4" />
          Novo
        </label>
        <input type="file" id="new-document-upload" className="hidden" accept=".pdf" onChange={handleFileChange} />
      </div>

      <div className="flex-grow p-2 overflow-y-auto">
        {documentEntries.length > 0 ? (
          <ul className="space-y-1">
            {documentEntries.map(([fileName, chunks]) => {
              const isActive = fileName === activeDocument;
              return (
                <li key={fileName} className="group">
                  <button 
                    onClick={() => onSelect(fileName, chunks)} 
                    className={`flex items-center gap-3 text-left w-full p-2.5 rounded-lg transition-colors ${
                        isActive 
                        ? 'bg-blue-600/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' 
                        : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <BookOpenIcon className={`h-5 w-5 ${isActive ? 'text-blue-600 dark:text-blue-500' : 'text-slate-500'}`} />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className={`font-semibold text-sm truncate ${isActive ? '' : 'text-slate-800 dark:text-slate-200'}`}>{fileName}</p>
                      <p className={`text-xs ${isActive ? 'text-blue-600/80 dark:text-blue-400/70' : 'text-slate-500 dark:text-slate-400'}`}>{chunks.length} secções</p>
                    </div>
                    <div className="flex-shrink-0">
                        <button
                            onClick={(e) => handleDelete(e, fileName)}
                            className="p-1.5 rounded-md text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 transition-all"
                            aria-label={`Apagar ${fileName}`}
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-center py-10 px-4">
            <p className="text-slate-500 dark:text-slate-400 text-sm">A sua biblioteca está vazia.</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Carregue um documento para começar.</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex-shrink-0 space-y-4">
        <div>
          <h3 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2 px-1">Fornecedor IA</h3>
          <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-xl">
            <ProviderButton provider="gemini"><GeminiIcon className="h-4 w-4" /> Gemini</ProviderButton>
            <ProviderButton provider="groq"><GroqIcon className="h-4 w-4" /> Groq</ProviderButton>
            <ProviderButton provider="ollama"><LlamaIcon className="h-4 w-4" /> Ollama</ProviderButton>
          </div>
        </div>
        <div className="flex items-center justify-center">
            <button onClick={onThemeToggle} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" aria-label="Mudar tema">
                {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
            </button>
        </div>
      </div>
    </aside>
  );
};

export default DocumentLibrary;
