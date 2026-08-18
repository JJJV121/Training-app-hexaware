import React, { useState } from 'react';
import ConversationItem from './ConversationItem';
import Icon from '../Icon';

export default function ConversationList({
  title = "Messages",
  conversations = [],
  activeConversationId,
  onSelectConversation,
  searchPlaceholder = "Search conversations...",
  extraHeaderAction = null
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter((c) => {
    const name = (c.name || '').toLowerCase();
    const desc = (c.description || '').toLowerCase();
    const lastMsg = (c.last_message?.content || '').toLowerCase();
    const q = searchTerm.toLowerCase();
    return name.includes(q) || desc.includes(q) || lastMsg.includes(q);
  });

  return (
    <div className="messaging-sidebar">
      <div className="messaging-sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 className="messaging-sidebar-title">
            <Icon name="message-square" />
            <span>{title}</span>
          </h3>
          {extraHeaderAction}
        </div>

        <div className="messaging-search-wrapper">
          <Icon name="search" className="messaging-search-icon" />
          <input
            type="text"
            className="messaging-search-input"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="messaging-list">
        {filteredConversations.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-light)', fontSize: '0.875rem' }}>
            No conversations found.
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isSelected={conv.id === activeConversationId}
              onClick={() => onSelectConversation(conv)}
            />
          ))
        )}
      </div>
    </div>
  );
}
