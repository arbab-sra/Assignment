import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { ChatMessageData } from '../types';

interface Props {
  messages: ChatMessageData[];
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;
}

const EMOJIS = ['🔥', '❤️', '🎉', '😂', '👏', '😮'];

export const ChatBox: React.FC<Props> = ({ messages, onSendMessage, onSendReaction }) => {
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '380px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
        <MessageSquare size={18} color="var(--accent-red)" />
        <h3 style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Live Chat</h3>
      </div>

      {/* Messages Scroll Area */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', paddingRight: '4px' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', margin: 'auto' }}>
            No messages yet. Say hi to the party! 👋
          </div>
        ) : (
          messages.map((m) => {
            const isSystem = m.username === 'System';
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: isSystem ? 'rgba(121, 40, 202, 0.1)' : 'rgba(0, 0, 0, 0.3)',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: isSystem ? '1px dashed rgba(121, 40, 202, 0.4)' : '1px solid var(--glass-border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: isSystem ? 'var(--role-mod)' : 'var(--text-secondary)' }}>
                    {m.username}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{m.timestamp}</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emoji Reaction Toolbar */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.2)', padding: '6px', borderRadius: '10px' }}>
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSendReaction(emoji)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: '6px',
              transition: 'transform 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.3)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            title={`Send ${emoji} reaction`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Text Input */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          className="glass-input"
          style={{ flex: 1 }}
          placeholder="Send a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="btn-primary" style={{ padding: '10px 14px' }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
