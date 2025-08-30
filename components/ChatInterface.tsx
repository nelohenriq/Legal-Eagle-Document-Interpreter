import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { UserIcon, BotIcon, SendIcon } from './Icons';
import { Loader } from './Loader';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const AnimateIn: React.FC<{children: React.ReactNode}> = ({ children }) => {
    return <div className="chat-message-animation">{children}</div>;
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading }) => {
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
    const bolded = content.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    return <div className="prose prose-slate dark:prose-invert max-w-none prose-p:my-1" dangerouslySetInnerHTML={{ __html: bolded }} />;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
      <div className="flex-grow p-4 sm:p-6 overflow-y-auto">
        <div className="flex flex-col gap-4">
          {messages.map((message, index) => (
            <AnimateIn key={index}>
              <div className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'model' && (
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                    <BotIcon className="h-5 w-5 text-slate-500" />
                  </div>
                )}
                <div
                  className={`max-w-xl p-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-lg'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-lg'
                  }`}
                >
                  {formatContent(message.content)}
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-slate-500" />
                  </div>
                )}
              </div>
            </AnimateIn>
          ))}
          {isLoading && (
            <AnimateIn>
              <div className="flex items-start gap-3 justify-start">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                  <BotIcon className="h-5 w-5 text-slate-500" />
                </div>
                <div className="bg-slate-200 dark:bg-slate-800 p-3 rounded-2xl rounded-bl-lg flex items-center">
                  <Loader />
                </div>
              </div>
            </AnimateIn>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex-shrink-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-b-xl">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                }
            }}
            placeholder="Faça uma pergunta sobre o documento..."
            disabled={isLoading}
            rows={1}
            className="w-full px-4 py-2 pr-12 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all resize-none leading-6"
            style={{ height: 'auto', minHeight: '44px' }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            aria-label="Enviar mensagem"
          >
            <SendIcon className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;