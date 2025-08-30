import React, { useState } from 'react';
import { KeyIcon, CheckCircleIcon, XCircleIcon } from './Icons';
import { Loader } from './Loader';
import * as groqService from '../services/groqService';

interface ApiKeySetupProps {
  onApiKeySave: (apiKey: string) => void;
  currentApiKey: string | null;
}

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onApiKeySave, currentApiKey }) => {
  const [apiKey, setApiKey] = useState(currentApiKey || '');
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testMessage, setTestMessage] = useState('');

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
    if (testStatus !== 'idle') {
      setTestStatus('idle');
      setTestMessage('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onApiKeySave(apiKey.trim());
    }
  };
  
  const handleTestConnection = async () => {
    if (!apiKey.trim()) return;
    setTestStatus('testing');
    setTestMessage('');
    const result = await groqService.testConnection(apiKey.trim());
    setTestStatus(result.success ? 'success' : 'error');
    setTestMessage(result.message);
  };

  return (
    <div className="flex flex-col">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 mb-4">
           <KeyIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <p className="text-center text-slate-600 dark:text-slate-400">
          Para utilizar o Groq, precisa de uma chave da API. A sua chave será guardada de forma segura no seu browser.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="api-key" className="sr-only">Chave da API GROQ</label>
            <input
              id="api-key"
              name="api-key"
              type="password"
              autoComplete="current-password"
              required
              value={apiKey}
              onChange={handleApiKeyChange}
              className="relative block w-full appearance-none rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              placeholder="gsk_xxxxxxxxxxxxxxxxxxxx"
            />
          </div>
          
           {testStatus !== 'idle' && testStatus !== 'testing' && (
              <div className={`mt-4 flex items-center justify-center gap-2 text-sm ${testStatus === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {testStatus === 'success' && <CheckCircleIcon className="h-5 w-5" />}
                {testStatus === 'error' && <XCircleIcon className="h-5 w-5" />}
                <span>{testMessage}</span>
              </div>
            )}

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleTestConnection}
              className="w-full justify-center rounded-md border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-200/50 dark:hover:bg-slate-800/50 disabled:opacity-50 flex items-center gap-2 transition-colors"
              disabled={!apiKey.trim() || testStatus === 'testing'}
            >
              {testStatus === 'testing' ? (
                <><Loader/> A testar...</>
              ) : 'Testar Ligação'}
            </button>
            <button
              type="submit"
              className="w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
              disabled={!apiKey.trim()}
            >
              Guardar Chave
            </button>
          </div>
        </form>
         <p className="mt-6 text-xs text-slate-500 text-center">
            Não tem uma chave? Crie uma na {' '}
            <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline dark:text-blue-500">
                Consola GROQ
            </a>.
        </p>
    </div>
  );
};

export default ApiKeySetup;