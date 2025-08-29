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
    // Reset test status when user types a new key
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
    <div className="flex flex-col items-center justify-center max-w-2xl mx-auto">
      <div className="w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
           <KeyIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Configurar Chave da API GROQ</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Para utilizar as funcionalidades de IA, precisa de uma chave da API GROQ. A sua chave será guardada de forma segura no seu browser.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="api-key" className="sr-only">
              Chave da API GROQ
            </label>
            <input
              id="api-key"
              name="api-key"
              type="password"
              autoComplete="current-password"
              required
              value={apiKey}
              onChange={handleApiKeyChange}
              className="relative block w-full appearance-none rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
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

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleTestConnection}
              className="w-full justify-center rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 flex items-center gap-2"
              disabled={!apiKey.trim() || testStatus === 'testing'}
            >
              {testStatus === 'testing' ? (
                <>
                  <Loader/> A testar...
                </>
              ) : (
                'Testar Ligação'
              )}
            </button>
            <button
              type="submit"
              className="w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
              disabled={!apiKey.trim()}
            >
              Guardar Chave
            </button>
          </div>
        </form>
         <p className="mt-6 text-xs text-slate-500">
            Não tem uma chave? Crie uma na {' '}
            <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline dark:text-blue-500">
                Consola GROQ
            </a>.
        </p>
      </div>
    </div>
  );
};

export default ApiKeySetup;