import React from 'react';
import Icon from '../Icon';

export default function MessageBubble({ message, isOwnMessage, showSenderName = false }) {
  const timeStr = message.created_at
    ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`message-bubble-wrapper ${isOwnMessage ? 'outgoing' : 'incoming'}`}>
      {!isOwnMessage && showSenderName && (
        <span className="message-sender-name">
          {message.sender_name} {message.sender_role ? `(${message.sender_role})` : ''}
        </span>
      )}

      <div className="message-bubble">
        <div>{message.content}</div>

        <div className="message-meta">
          <span>{timeStr}</span>
          {isOwnMessage && (
            <span style={{ marginLeft: '4px', opacity: 0.85 }}>
              {message.is_read ? (
                <Icon name="check-circle" style={{ width: '12px', height: '12px', color: '#60a5fa' }} />
              ) : (
                <Icon name="check" style={{ width: '12px', height: '12px' }} />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
