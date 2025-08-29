import React from 'react';
import type { DocumentChunk } from '../types';
import { BookOpenIcon, MessageSquarePlusIcon } from './Icons';

interface DocumentViewerProps {
  chunks: DocumentChunk[];
  onChunkSelect: (chunk: DocumentChunk) => void;
  fileName: string;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ chunks, onChunkSelect, fileName }) => {

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
          <BookOpenIcon className="h-8 w-8 text-slate-500" />
          {fileName}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
            Pode ler o documento abaixo. Passe o rato sobre qualquer secção e clique no ícone de chat para fazer uma pergunta sobre ela.
        </p>
      </header>

      <div className="space-y-6">
        {chunks.map((chunk) => (
          <article 
            key={chunk.id}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 relative group transition-shadow hover:shadow-xl"
          >
            <button
              onClick={() => onChunkSelect(chunk)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200"
              aria-label={`Perguntar sobre ${chunk.title}`}
            >
              <MessageSquarePlusIcon className="h-5 w-5" />
            </button>

            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 pr-10">{chunk.title}</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
              {chunk.content}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
};

export default DocumentViewer;