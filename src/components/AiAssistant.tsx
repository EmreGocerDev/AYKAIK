// YOL: src/components/AiAssistant.tsx

"use client";
import { Bot, X, Send, User } from 'lucide-react';
import { useState, useEffect, useRef, FormEvent, MouseEvent } from 'react';
import toast from 'react-hot-toast';
import { useSettings } from '@/contexts/SettingsContext';
import GlassCard from './GlassCard';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};
export default function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings();
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsAnimatingOut(false);
    }, 250);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input || isLoading) return;

    setIsLoading(true);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      if (!response.ok || !response.body) {
        throw new Error(`API hatası: ${response.statusText}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = '';

      const assistantMessageId = Date.now().toString() + "-assistant";
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: ''
      }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        assistantResponse += decoder.decode(value, { stream: true });
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: assistantResponse }
            : msg
        ));
      }

    } catch (error: unknown) {
      toast.error(`Mesaj gönderilemedi: ${error instanceof Error ? error.message : String(error)}`);
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="p-3 rounded-full bg-blue-600/50 hover:bg-blue-600/80 text-white backdrop-blur-md border-white/20 shadow-lg transition-all"
        title="AI Asistan"
      >
        <Bot size={24} />
      </button>
    );
  }

  return (
    <GlassCard
      {...{tintValue, blurPx, borderRadiusPx, grainOpacity}}
      className={`fixed bottom-0 left-0 right-0 h-[80vh] md:bottom-6 md:right-6 md:h-[70vh] md:max-w-md 
md:rounded-2xl flex flex-col z-50 !p-0 ${isAnimatingOut ? 'animate-modal-close' : 'animate-modal-open'}`}

    >
      <div className="flex justify-between items-center p-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Bot className="text-blue-400" />
          <h3 className="font-bold text-lg">Ayka AI Asistan</h3>
      
         </div>
        <button onClick={handleClose} className="p-2 rounded-full hover:bg-white/10">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && <Bot className="w-6 h-6 flex-shrink-0 
            text-blue-400" />}
            <div className={`max-w-xs md:max-w-sm p-3 rounded-2xl ${m.role === 'user' ?
            'bg-blue-600' : 'bg-gray-700'}`}>
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
             {m.role === 'user' && <User className="w-6 h-6 flex-shrink-0" />}
          </div>
        ))}
         {isLoading && messages[messages.length - 1]?.role === 'user' && (
           <div className="flex justify-start gap-3">
 
                          <Bot className="w-6 h-6 flex-shrink-0 text-blue-400 animate-pulse" />
                <div className="max-w-sm p-3 rounded-2xl bg-gray-700">
                    <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
       
                                 <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
                    </div>
                </div>
           </div>
 
               )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <input
            className="flex-1 bg-black/20 p-3 rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={input}
       
           placeholder="Sorunuzu buraya yazın..."
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50" disabled={isLoading ||
          !input}>
            <Send size={20} />
          </button>
        </div>
      </form>
    </GlassCard>
  );
}