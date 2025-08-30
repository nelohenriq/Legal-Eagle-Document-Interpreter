import React from 'react';
import type { DocumentChunk } from '../types';
import { BookOpenIcon } from './Icons';

interface ReferencePanelProps {
  references: DocumentChunk[] | null;
}

const ReferencePanel: React.FC<ReferencePanelProps> = ({ references }) => {
  const hasReferences = references && references.length > 0;

  const content = hasReferences ? (
    <div className="space-y-4">
      {references.map((ref) => (
        <article key={ref.id} className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-sm text-blue-600 dark:text-blue-500">{ref.title}</h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed text-sm font-serif">
            {ref.content}
          </p>
        </article>
      ))}
    </div>
  ) : (
    <div className="text-center flex flex-col items-center justify-center h-full p-6">
        <BookOpenIcon className="h-12 w-12 text-slate-400 dark:text-slate-600" />
        <h3 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">Painel de Referência</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-xs">Os artigos relevantes do documento aparecerão aqui quando fizer uma pergunta.</p>
    </div>
  );

  return (
    <div className="h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <h2 className="font-bold text-lg">Referências do Documento</h2>
      </div>
      <div className="flex-grow p-4 overflow-y-auto">
          {content}
      </div>
    </div>
  );
};

export default ReferencePanel;