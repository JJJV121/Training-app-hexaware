import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import { queryChatbot, getChatbotSuggestions } from '../services/chatbotService';
import '../styles/chatbot.css';

export default function AIChatbot({ role: forcedRole, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  // Determine current role ('admin' or 'trainer')
  const [activeRole, setActiveRole] = useState(() => {
    if (forcedRole) return forcedRole.toLowerCase();
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.role) return parsed.role.toLowerCase();
      }
    } catch (e) {
      // ignore
    }
    return 'admin';
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
    }
  }, [messages, isOpen]);

  // Load initial suggestions and greeting on mount or role change
  useEffect(() => {
    const initChat = async () => {
      const data = await getChatbotSuggestions(activeRole);
      setSuggestions(data.suggestions || []);
      setMessages([
        {
          id: 'init-msg',
          sender: 'assistant',
          text: data.greeting || `Hello! I am your Hexaware AI Assistant for ${activeRole === 'admin' ? 'Admins' : 'Trainers'}.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    };
    initChat();
  }, [activeRole]);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
    setHasUnread(false);
  };

  const handleSend = async (textToSend) => {
    const queryText = textToSend || inputValue.trim();
    if (!queryText || isLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsLoading(true);

    try {
      const res = await queryChatbot(queryText, activeRole);
      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        title: res.title,
        text: res.answer,
        action: res.action,
        relatedActions: res.related_actions,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: "I experienced a temporary connection glitch. Please try asking your question again.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRouteClick = (route) => {
    if (!route) return;
    // Set URL hash for single page router navigation
    window.location.hash = route;
    if (onNavigate) {
      onNavigate(route);
    }
  };

  const handleReset = async () => {
    setIsLoading(true);
    const data = await getChatbotSuggestions(activeRole);
    setMessages([
      {
        id: `reset-${Date.now()}`,
        sender: 'assistant',
        text: data.greeting || "Chat history reset. How can I guide you now?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setIsLoading(false);
  };

  const formatText = (text) => {
    if (!text) return '';
    // Format basic bold text **bold**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="hex-chatbot-wrapper">
      {/* Floating Trigger Button */}
      <button
        type="button"
        className="hex-chatbot-trigger"
        onClick={handleToggle}
        title="Hexaware AI Assistant"
        aria-label="Open Hexaware AI Assistant"
      >
        <span className="hex-chatbot-pulse"></span>
        <Icon name={isOpen ? "x" : "bot"} size={26} />
        {!isOpen && hasUnread && <span className="hex-chatbot-unread-badge"></span>}
      </button>

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="hex-chatbot-card">
          {/* Header */}
          <div className="hex-chatbot-header">
            <div className="hex-chatbot-header-info">
              <div className="hex-chatbot-avatar-box">
                <Icon name="sparkles" size={20} style={{ color: '#ffffff' }} />
              </div>
              <div>
                <div className="hex-chatbot-title">Hexaware AI Guide</div>
                <div className="hex-chatbot-subtitle">
                  <span className="hex-chatbot-status-dot"></span>
                  <span>{activeRole === 'admin' ? 'System Admin Mode' : 'Trainer Specialist'}</span>
                </div>
              </div>
            </div>
            <div className="hex-chatbot-header-actions">
              <button
                type="button"
                className="hex-chatbot-action-btn"
                onClick={handleReset}
                title="Reset Conversation"
              >
                <Icon name="refresh-cw" size={14} />
              </button>
              <button
                type="button"
                className="hex-chatbot-action-btn"
                onClick={() => setIsOpen(false)}
                title="Minimize"
              >
                <Icon name="minimize-2" size={14} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="hex-chatbot-body">
            {messages.map((msg) => (
              <div key={msg.id} className={`hex-chat-msg ${msg.sender}`}>
                <div className="hex-chat-msg-bubble">
                  {msg.title && (
                    <div style={{ fontWeight: 700, marginBottom: '6px', color: '#3563e9' }}>
                      {msg.title}
                    </div>
                  )}
                  <div>{formatText(msg.text)}</div>

                  {/* Primary Action Chip */}
                  {msg.action && (
                    <button
                      type="button"
                      className="hex-chat-action-chip"
                      onClick={() => handleRouteClick(msg.action.route)}
                    >
                      <span>{msg.action.label}</span>
                      <Icon name="arrow-right" size={14} />
                    </button>
                  )}

                  {/* Related Action Chips */}
                  {msg.relatedActions && msg.relatedActions.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                      {msg.relatedActions.map((act, i) => (
                        <button
                          key={i}
                          type="button"
                          className="hex-chat-action-chip"
                          onClick={() => handleRouteClick(act.route)}
                        >
                          <span>{act.label}</span>
                          <Icon name="external-link" size={12} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="hex-chat-msg-time">{msg.time}</div>
              </div>
            ))}

            {/* Quick Suggestions Chips (only when user hasn't asked complex queries yet) */}
            {messages.length <= 2 && suggestions.length > 0 && (
              <div className="hex-chat-suggestions">
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-light, #90a3bf)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                  Suggested Quick Questions
                </div>
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="hex-chat-suggestion-btn"
                    onClick={() => handleSend(sug)}
                  >
                    <Icon name="help-circle" size={14} style={{ color: '#3563e9', flexShrink: 0 }} />
                    <span>{sug}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="hex-chat-msg assistant">
                <div className="hex-chat-typing">
                  <div className="hex-chat-typing-dot"></div>
                  <div className="hex-chat-typing-dot"></div>
                  <div className="hex-chat-typing-dot"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Form */}
          <div className="hex-chatbot-footer">
            <form
              className="hex-chat-input-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <input
                type="text"
                className="hex-chat-input-field"
                placeholder={`Ask ${activeRole === 'admin' ? 'Admin' : 'Trainer'} Assistant...`}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="hex-chat-send-btn"
                disabled={!inputValue.trim() || isLoading}
                title="Send Message"
              >
                <Icon name="send" size={16} />
              </button>
            </form>
            <div className="hex-chatbot-branding">
              Hexaware Mavericks Learning Assistant • AI Powered
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
