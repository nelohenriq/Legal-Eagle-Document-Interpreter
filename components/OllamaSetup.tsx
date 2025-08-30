import React, { useState } from 'react';
import { ServerIcon, CheckCircleIcon, XCircleIcon } from './Icons';
import { Loader } from './Loader';
import * as ollamaService from '../services/ollamaService';

interface OllamaSetupProps {
  onUrlSave: (url: string) => void;
  currentUrl: string | null;
}

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

const OllamaSetup: React.FC<OllamaSetupProps> = ({ onUrlSave, currentUrl }) => {
  const [url, setUrl] = useState(currentUrl || 'http://localhost:11434');
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testMessage, setTestMessage] = useState('');

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (testStatus !== 'idle') {
      setTestStatus('idle');
      setTestMessage('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onUrlSave(url.trim());
    }
  };
  
  const handleTestConnection = async () => {
    if (!url.trim()) return;
    setTestStatus('testing');
    setTestMessage('');
    const result = await ollamaService.testConnection(url.trim());
    setTestStatus(result.success ? 'success' : 'error');
    setTestMessage(result.message);
  };

  return (
    <div className="flex flex-col">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 mb-4">
          <ServerIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
      </div>
      <p className="text-center text-slate-600 dark:text-slate-400">
        Introduza o URL base do seu servidor Ollama. Será guardado de forma segura no seu browser.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="ollama-url" className="sr-only">URL do Servidor Ollama</label>
          <input
            id="ollama-url"
            name="ollama-url"
            type="url"
            required
            value={url}
            onChange={handleUrlChange}
            className="relative block w-full appearance-none rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            placeholder="http://localhost:11434"
          />
        </div>
        
          {testStatus !== 'idle' && testStatus !== 'testing' && (
            <div className={`mt-4 flex items-center justify-center gap-2 text-sm text-center ${testStatus === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {testStatus === 'success' && <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />}
              {testStatus === 'error' && <XCircleIcon className="h-5 w-5 flex-shrink-0" />}
              <span>{testMessage}</span>
            </div>
          )}

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleTestConnection}
            className="w-full justify-center rounded-md border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-200/50 dark:hover:bg-slate-800/50 disabled:opacity-50 flex items-center gap-2 transition-colors"
            disabled={!url.trim() || testStatus === 'testing'}
          >
            {testStatus === 'testing' ? (
              <><Loader/> A testar...</>
            ) : 'Testar Ligação'}
          </button>
          <button
            type="submit"
            className="w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            disabled={!url.trim()}
          >
            Guardar URL
          </button>
        </div>
      </form>
        <p className="mt-6 text-xs text-slate-500 text-center">
          Precisa de ajuda? Consulte a documentação oficial do {' '}
          <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline dark:text-blue-500">
              Ollama
          </a>.
      </p>
    </div>
  );
};

export default OllamaSetup;