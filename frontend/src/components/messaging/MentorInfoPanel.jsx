import React from 'react';
import Icon from '../Icon';

export default function MentorInfoPanel({
  conversation,
  onViewMembers
}) {
  if (!conversation) return null;

  const isCommunity = conversation.conversation_type === 'COMMUNITY';
  const name = conversation.name || 'Chat Info';
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="messaging-info-panel">
      <div className="info-panel-header">
        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)' }}>
          {isCommunity ? 'Community Details' : 'Mentor Profile'}
        </h4>
      </div>

      <div className="info-panel-body">
        {/* Avatar Card */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            className={`conversation-avatar ${isCommunity ? 'community-avatar' : ''}`}
            style={{
              width: '72px',
              height: '72px',
              fontSize: '1.8rem',
              margin: '0 auto 12px auto',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)'
            }}
          >
            {isCommunity ? '🌐' : initial}
          </div>

          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)' }}>
            {name}
          </h3>

          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: isCommunity ? 'rgba(16, 185, 129, 0.12)' : 'rgba(79, 70, 229, 0.12)',
              color: isCommunity ? '#059669' : '#4f46e5',
              display: 'inline-block'
            }}
          >
            {isCommunity ? 'Learning Community Channel' : 'Assigned Mentor & Trainer'}
          </span>
        </div>

        {/* Status indicator */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            backgroundColor: 'var(--hover-bg, #f8fafc)',
            border: '1px solid var(--msg-border, #e2e8f0)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-light)' }}>
            Status
          </span>
          {isCommunity ? (
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>
              Active Channel
            </span>
          ) : conversation.is_online ? (
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              Online
            </span>
          ) : (
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>
              Offline
            </span>
          )}
        </div>

        {/* Details Section */}
        {isCommunity ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '0.04em' }}>
                Description
              </label>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-dark)', lineHeight: 1.5 }}>
                {conversation.description || 'General learning and tech discussion forum.'}
              </p>
            </div>

            {onViewMembers && (
              <button
                type="button"
                className="chat-btn-icon"
                onClick={onViewMembers}
                style={{ width: '100%', justifyContent: 'center', marginTop: '10px', padding: '10px' }}
              >
                <Icon name="users" />
                <span>View All Community Members</span>
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '0.04em' }}>
                Core Expertise
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                <span className="expertise-pill">FastAPI</span>
                <span className="expertise-pill">Python</span>
                <span className="expertise-pill">PostgreSQL</span>
                <span className="expertise-pill">WebSockets</span>
                <span className="expertise-pill">Full Stack</span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '0.04em' }}>
                Assigned Batch
              </label>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                Hexaware Mentor Connect Batch 2026
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
