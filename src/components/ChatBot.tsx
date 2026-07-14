'use client';
import { useState, useRef, useEffect } from 'react';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: '👋 Bonjour ! Je suis l\'assistant BATIZEN.CI. Comment puis-je vous aider aujourd\'hui ?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    'Quel est le prix du ciment ?',
    'Quels services proposez-vous ?',
    'Comment prendre rendez-vous ?',
    'Où sont vos dépôts ?'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage = { role: 'user', text };
    setMessages(prev => [...prev, userMessage]);
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

      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: 'Désolé, je rencontre un problème. Contactez-nous au +225 0749883981'
        }]);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Erreur de connexion. Veuillez réessayer.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Bouton flottant - Mini robot 3D */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '20px',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4A90E2, #2C5FA8)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(74, 144, 226, 0.4), inset 0 1px 2px rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            zIndex: 40,
            animation: 'float 3s ease-in-out infinite'
          }}
          title="Assistant BATIZEN"
          aria-label="Ouvrir l'assistant"
        >
          🤖
        </button>
      )}

      {/* Fenêtre de chat */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '400px',
          maxWidth: 'calc(100vw - 40px)',
          height: '600px',
          maxHeight: 'calc(100vh - 40px)',
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 10px 50px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9999,
          animation: 'slideUp 0.3s ease'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #FF6B00, #FF8C00)',
            color: 'white',
            padding: '20px',
            borderRadius: '20px 20px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px' }}>🤖 Assistant BATIZEN</h3>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', opacity: 0.9 }}>En ligne</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            background: '#F5F5F5'
          }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '15px'
                }}
              >
                <div style={{
                  maxWidth: '80%',
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '15px 15px 0 15px' : '15px 15px 15px 0',
                  background: msg.role === 'user' ? '#FF6B00' : 'white',
                  color: msg.role === 'user' ? 'white' : '#1A1A1A',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '15px' }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '15px 15px 15px 0',
                  background: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <span style={{ display: 'inline-block', animation: 'typing 1.4s infinite' }}>●</span>
                  <span style={{ display: 'inline-block', animation: 'typing 1.4s infinite 0.2s' }}>●</span>
                  <span style={{ display: 'inline-block', animation: 'typing 1.4s infinite 0.4s' }}>●</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length === 1 && (
            <div style={{
              padding: '10px 20px',
              background: 'white',
              borderTop: '1px solid #E0E0E0',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(sug)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '15px',
                    border: '1px solid #FF6B00',
                    background: 'white',
                    color: '#FF6B00',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: '15px 20px',
            background: 'white',
            borderTop: '1px solid #E0E0E0',
            display: 'flex',
            gap: '10px'
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(input)}
              placeholder="Posez votre question..."
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '25px',
                border: '1px solid #E0E0E0',
                outline: 'none',
                fontSize: '14px'
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={isLoading || !input.trim()}
              style={{
                width: '45px',
                height: '45px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF6B00, #FF8C00)',
                border: 'none',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
                opacity: isLoading || !input.trim() ? 0.5 : 1
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes typing {
          0%, 60%, 100% { opacity: 0.3; }
          30% { opacity: 1; }
        }
      `}</style>
    </>
  );
}