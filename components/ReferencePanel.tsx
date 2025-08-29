import React from 'react';
import type { DocumentChunk } from '../types';
import { BookOpenIcon } from './Icons';

interface ReferencePanelProps {
  references: DocumentChunk[] | null;
}

const ReferencePanel: React.FC<ReferencePanelProps> = ({ references }) => {
  const hasReferences = references && references.length > 0;

  const content = hasReferences ? (
    <div className="space-y-6">
      {references.map((ref) => (
        <article key={ref.id} className="border-b border-slate-200 dark:border-slate-700 pb-6 last:border-b-0 last:pb-0">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">{ref.title}</h3>
          <p className="mt-3 text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed font-serif">
            {ref.content}
          </p>
        </article>
      ))}
    </div>
  ) : (
    <div className="text-center flex flex-col items-center justify-center h-full">
        <BookOpenIcon className="h-12 w-12 text-slate-400 dark:text-slate-500" />
        <h3 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">Painel de Referência</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Os artigos relevantes do documento aparecerão aqui quando fizer uma pergunta.</p>
    </div>
  );

  return (
    <div className="sticky top-24 h-[calc(100vh-140px)]">
      <div className={`
        bg-white dark:bg-slate-800/50 rounded-xl shadow-lg w-full h-full p-6 
        overflow-y-auto border border-slate-200 dark:border-slate-800
        transition-opacity duration-500
      `}>
          {content}
      </div>
    </div>
  );
};

export default ReferencePanel;