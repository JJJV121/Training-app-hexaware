import React from 'react';

export default function ConversationItem({ conversation, isSelected, onClick }) {
  const isCommunity = conversation.conversation_type === 'COMMUNITY';
  const name = conversation.name || 'Conversation';
  const initial = name.charAt(0).toUpperCase();

  const timeStr = conversation.last_message
    ? new Date(conversation.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const previewStr = conversation.last_message
    ? conversation.last_message.content
    : (conversation.description || 'No messages yet');

  return (
    <div
      className={`conversation-item ${isSelected ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="conversation-avatar-container">
        <div className={`conversation-avatar ${isCommunity ? 'community-avatar' : ''}`}>
          {isCommunity ? '🌐' : initial}
        </div>
        {!isCommunity && (
          <div className={conversation.is_online ? 'online-status-dot' : 'offline-status-dot'} />
        )}
      </div>

      <div className="conversation-info">
        <div className="conversation-name-row">
          <span className="conversation-name">{name}</span>
          {timeStr && <span className="conversation-time">{timeStr}</span>}
        </div>

        <div className="conversation-preview-row">
          <span className="conversation-preview">{previewStr}</span>
          {conversation.unread_count > 0 && (
            <span className="unread-badge">{conversation.unread_count}</span>
          )}
        </div>
      </div>
    </div>
  );
}
