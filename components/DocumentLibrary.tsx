import React from 'react';
import type { DocumentChunk, SavedDocuments } from '../types';
import { BookOpenIcon, TrashIcon } from './Icons';

interface DocumentLibraryProps {
  documents: SavedDocuments;
  onSelect: (fileName: string, chunks: DocumentChunk[]) => void;
  onDelete: (fileName: string) => void;
}

const DocumentLibrary: React.FC<DocumentLibraryProps> = ({ documents, onSelect, onDelete }) => {
  const documentEntries = Object.entries(documents);

  const handleDelete = (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation(); // Prevent the select action from firing
    if (window.confirm(`Tem a certeza que quer apagar "${fileName}" da sua biblioteca?`)) {
        onDelete(fileName);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">A Sua Biblioteca de Documentos</h2>
      {documentEntries.length > 0 ? (
        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
          {documentEntries.map(([fileName, chunks]) => (
            <li key={fileName} className="py-3 flex items-center justify-between group">
               <button 
                onClick={() => onSelect(fileName, chunks)} 
                className="flex items-center gap-4 text-left w-full group-hover:bg-slate-50 dark:group-hover:bg-slate-700/50 p-2 rounded-md transition-colors"
                >
                <BookOpenIcon className="h-6 w-6 text-slate-500" />
                <div className="flex-grow">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{fileName}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{chunks.length} secções</p>
                </div>
              </button>
              <button
                onClick={(e) => handleDelete(e, fileName)}
                className="ml-4 p-2 rounded-md text-slate-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 transition-colors"
                aria-label={`Apagar ${fileName}`}
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-10">
          <p className="text-slate-500 dark:text-slate-400">A sua biblioteca está vazia.</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Analise um novo documento para o adicionar aqui.</p>
        </div>
      )}
    </div>
  );
};

export default DocumentLibrary;