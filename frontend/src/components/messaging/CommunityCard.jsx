import React from 'react';
import Icon from '../Icon';

export default function CommunityCard({
  community,
  onJoin,
  onLeave,
  onOpenChat
}) {
  return (
    <div className="community-card">
      <div className="community-card-top">
        <div className="community-card-icon">
          🌐
        </div>
        <div>
          <h4 className="community-card-title">{community.name}</h4>
          <p className="community-card-desc">{community.description || 'General discussion and knowledge sharing.'}</p>
        </div>
      </div>

      <div className="community-card-bottom">
        <div className="community-members-count">
          <Icon name="users" style={{ width: '16px', height: '16px' }} />
          <span>{community.member_count} member{community.member_count !== 1 ? 's' : ''}</span>
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
