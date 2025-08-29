import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, AIProvider } from '../types';
import { UserIcon, BotIcon, SendIcon, SparklesIcon } from './Icons';
import { Loader } from './Loader';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  provider: AIProvider;
  documentName: string;
}

// Simple fade-in and slide-up animation for new messages
const AnimateIn: React.FC<{children: React.ReactNode}> = ({ children }) => {
    return <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">{children}</div>;
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading, provider, documentName }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const formatContent = (content: string) => {
    // Basic markdown for bolding text between **
    const bolded = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1" dangerouslySetInnerHTML={{ __html: bolded }} />;
  };
  
  const providerName = provider === 'gemini' ? 'Gemini' : 'Groq';

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center flex-shrink-0 bg-white dark:bg-slate-800 rounded-t-xl">
        <div className="flex items-center gap-2 min-w-0">
            <SparklesIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <h2 className="text-lg font-bold truncate" title={documentName}>
                Conversa: {documentName}
            </h2>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full">{providerName}</span>
        </div>
      </div>
      <div className="flex-grow p-4 overflow-y-auto bg-white dark:bg-slate-800">
        <div className="flex flex-col gap-4">
          {messages.map((message, index) => (
            <AnimateIn key={index}>
                <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'model' && (
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <BotIcon className="h-5 w-5 text-slate-500" />
                    </div>
                )}
                <div
                    className={`max-w-xl p-3 rounded-xl ${
                    message.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'
                    }`}
                >
                    {formatContent(message.content)}
                </div>
                {message.role === 'user' && (
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-slate-500" />
                    </div>
                )}
                </div>
            </AnimateIn>
          ))}
          {isLoading && (
            <AnimateIn>
                <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <BotIcon className="h-5 w-5 text-slate-500" />
                    </div>
                <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-xl rounded-bl-none flex items-center">
                    <Loader />
                </div>
                </div>
            </AnimateIn>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-slate-800/50 rounded-b-xl">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Faça uma pergunta sobre o documento..."
            disabled={isLoading}
            className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 h-10 w-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;