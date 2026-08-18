import React from 'react';
import Icon from '../Icon';

export default function ChatHeader({
  conversation,
  onBack,
  onViewMembers,
}) {
  if (!conversation) return null;

  const isCommunity = conversation.conversation_type === 'COMMUNITY';
  const name = conversation.name || 'Chat';
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="chat-header">
      <div className="chat-header-user-info">
        {onBack && (
          <button
            type="button"
            className="chat-btn-icon"
            onClick={onBack}
            style={{ padding: '6px' }}
            title="Back to conversations"
          >
            <Icon name="arrow-left" />
          </button>
        )}

        <div className="conversation-avatar-container" style={{ width: '40px', height: '40px' }}>
          <div className={`conversation-avatar ${isCommunity ? 'community-avatar' : ''}`} style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
            {isCommunity ? '🌐' : initial}
          </div>
          {!isCommunity && (
            <div className={conversation.is_online ? 'online-status-dot' : 'offline-status-dot'} />
          )}
        </div>

        <div>
          <h4 className="chat-header-title">{name}</h4>
          <div className="chat-header-subtitle">
            {isCommunity ? (
              <span>Community Group Channel</span>
            ) : conversation.is_online ? (
              <span style={{ color: '#10b981', fontWeight: 600 }}>● Online</span>
            ) : (
              <span style={{ color: '#9ca3af' }}>○ Offline</span>
            )}
          </div>
        </div>
      </div>

      <div className="chat-header-actions">
        {isCommunity && onViewMembers && (
          <button
            type="button"
            className="chat-btn-icon"
            onClick={onViewMembers}
          >
            <Icon name="users" />
            <span>Members</span>
          </button>
        )}
      </div>
    </div>
  );
}
