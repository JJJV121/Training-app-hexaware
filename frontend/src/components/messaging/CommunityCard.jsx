import React from 'react';
import Icon from '../Icon';

export default function CommunityCard({
  community,
  onJoin,
  onLeave,
  onOpenChat
}) {
  const getCommunityIcon = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('python')) return '🐍';
    if (n.includes('backend')) return '⚡';
    if (n.includes('full stack')) return '💻';
    if (n.includes('ai') || n.includes('machine')) return '🤖';
    if (n.includes('career')) return '💼';
    return '💬';
  };

  const getTopicPill = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('python')) return 'Core Language';
    if (n.includes('backend')) return 'APIs & Microservices';
    if (n.includes('full stack')) return 'Web Development';
    if (n.includes('ai') || n.includes('machine')) return 'Machine Learning';
    if (n.includes('career')) return 'Jobs & Guidance';
    return 'General Forum';
  };

  const iconEmoji = getCommunityIcon(community.name);
  const topicLabel = getTopicPill(community.name);

  return (
    <div className="community-card">
      <div className="community-card-top">
        <div className="community-card-icon">
          {iconEmoji}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h4 className="community-card-title" style={{ margin: 0 }}>{community.name}</h4>
          </div>
          <span className="expertise-pill" style={{ display: 'inline-block', marginBottom: '8px' }}>
            {topicLabel}
          </span>
          <p className="community-card-desc">{community.description || 'General discussion and knowledge sharing forum.'}</p>
        </div>
      </div>

      <div className="community-card-bottom">
        <div className="community-members-count">
          <Icon name="users" style={{ width: '16px', height: '16px', color: '#2563eb' }} />
          <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>
            {community.member_count} member{community.member_count !== 1 ? 's' : ''}
          </span>
        </div>

        <div>
          {community.is_member ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="community-action-btn open"
                onClick={() => onOpenChat(community)}
              >
                Open Chat
              </button>
              <button
                type="button"
                className="community-action-btn leave"
                onClick={() => onLeave(community.id)}
              >
                Leave
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="community-action-btn join"
              onClick={() => onJoin(community.id)}
            >
              Join Community
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
