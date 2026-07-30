'use client';
import { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  role: string;
  text: string;
}

const CHAT_STORAGE_KEY = "rhinozen_chat";
const MAX_CHAT_SIZE = 50;

function loadChatHistory(): ChatMessage[] {
  const defaultMsg: ChatMessage = { role: 'assistant', text: '👋 Bonjour ! Je suis l\'assistant BATIZEN.CI. Comment puis-je vous aider aujourd\'hui ?' };
  if (typeof window === "undefined") return [defaultMsg];
  const raw = sessionStorage.getItem(CHAT_STORAGE_KEY);
  if (!raw) return [defaultMsg];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [defaultMsg];
    const valid = parsed.filter((m: unknown): m is ChatMessage =>
      typeof m === "object" && m !== null && "role" in m && "text" in m
    );
    return valid.length > 0 ? valid : [defaultMsg];
  } catch {
    return [defaultMsg];
  }
}

function saveChatHistory(messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = messages.slice(-MAX_CHAT_SIZE);
    sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Silencieux — échec de sauvegarde non bloquant
  }
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(loadChatHistory);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    'Quel est le prix du ciment ?',
    'Quels services proposez-vous ?',
    'Comment prendre rendez-vous ?',
    'Où sont vos dépôts ?'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Persistance sessionStorage
  useEffect(() => {
    saveChatHistory(messages);
  }, [messages]);

  // Click outside pour fermer
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history })
      });

      const data = await response.json();

      if (response.status === 429) {
        setMessages(prev => [...prev, { role: 'assistant', text: '⏳ Quota dépassé. Vous pouvez envoyer 5 messages par jour. Réessayez demain.' }]);
      } else if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: 'Désolé, je rencontre un problème. Contactez-nous au +225 0749883981' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Erreur de connexion. Veuillez réessayer.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-28 right-5 z-50 cursor-pointer bg-transparent border-none p-0"
        title="RHINOZEN - Assistant BÂTIZEN"
        aria-label="Ouvrir l'assistant"
      >
        <img 
          src="/images/rhinozen.png" 
          alt="RHINOZEN - Assistant BÂTIZEN" 
          className="w-32 h-32 object-contain drop-shadow-xl transition-transform hover:scale-110"
        />
      </button>
      )}

      {isOpen && (
        <div ref={chatRef} className="fixed bottom-5 right-5 z-[9999] flex flex-col w-[440px] max-w-[calc(100vw-40px)] h-[660px] max-h-[calc(100vh-40px)] rounded-[28px] border border-white/30 bg-transparent backdrop-blur-xl shadow-xl animate-slideUp">
          <div className="rounded-[28px_28px_0_0] bg-transparent text-white px-6 py-5 flex items-center justify-between">
            <div>
              <h3 className="m-0 text-lg font-black">🦏 RHINOZEN — Assistant BATIZEN</h3>
              <p className="mt-1 text-xs text-white/70">En ligne</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="grid size-8 place-items-center rounded-full bg-white/20 text-white text-lg border-none cursor-pointer hover:bg-white/30 transition" aria-label="Fermer">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 bg-transparent backdrop-blur-sm space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                <div className={`max-w-[80%] px-4 py-3 text-sm font-semibold shadow-lg ${
                  msg.role === 'user'
                    ? 'rounded-[18px_18px_0_18px] bg-gradient-to-br from-[#0B5FFF] to-[#0D2B6B] text-white'
                    : 'rounded-[18px_18px_18px_0] bg-white/90 backdrop-blur-md text-[#1A1A1A] border border-white/50'
                }`}>{msg.text}</div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="px-4 py-3 rounded-[18px_18px_18px_0] bg-white/90 backdrop-blur-md shadow-lg border border-white/50">
                  <span className="inline-block animate-typing">●</span>
                  <span className="inline-block animate-typing animate-delay-200">●</span>
                  <span className="inline-block animate-typing animate-delay-400">●</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="px-5 py-3 bg-transparent backdrop-blur-sm border-t border-white/20 flex flex-wrap gap-2">
              {suggestions.map((sug, idx) => (
                <button key={idx} onClick={() => sendMessage(sug)} className="rounded-[18px] border border-[#FF7A00]/50 bg-white/80 text-[#FF7A00] text-xs font-bold px-3 py-2 cursor-pointer hover:bg-[#FF7A00]/10 transition">{sug}</button>
              ))}
            </div>
          )}

          <div className="px-5 py-4 bg-transparent backdrop-blur-sm border-t border-white/20 rounded-[0_0_28px_28px] flex gap-3">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage(input)} placeholder="Posez votre question..." className="flex-1 px-4 py-3 rounded-[25px] border border-white/30 bg-white/80 text-sm text-[#1A1A1A] outline-none focus:border-[#0B5FFF] focus:ring-2 focus:ring-[#0B5FFF]/20 placeholder:text-gray-400" />
            <button onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()} className="size-[45px] rounded-full bg-gradient-to-br from-[#0B5FFF] to-[#0D2B6B] border-none text-white text-xl cursor-pointer grid place-items-center shadow-lg disabled:opacity-50 hover:shadow-xl transition">➤</button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes typing { 0%, 60%, 100% { opacity: 0.3; } 30% { opacity: 1; } }
      `}</style>
    </>
  );
}