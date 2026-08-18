import React, { useState } from 'react';
import Icon from '../Icon';

export default function MessageInput({ onSendMessage, onTyping }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (onTyping) {
      onTyping();
    }
  };

  return (
    <form className="chat-input-wrapper" onSubmit={handleSubmit}>
      <input
        type="text"
        className="chat-input"
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button
        type="submit"
        className="chat-send-btn"
        disabled={!text.trim()}
        title="Send message"
      >
        <Icon name="send" style={{ width: '18px', height: '18px' }} />
      </button>
    </form>
  );
}
