import React from 'react';
import Icon from '../Icon';

export default function CommunityMembers({
  communityName,
  members = [],
  onClose
}) {
  return (
    <div className="messaging-modal-overlay" onClick={onClose}>
      <div className="messaging-modal" onClick={(e) => e.stopPropagation()}>
        <div className="messaging-modal-header">
          <h4 className="messaging-modal-title">
            {communityName} Members ({members.length})
          </h4>
          <button
            type="button"
            className="chat-btn-icon"
            onClick={onClose}
            style={{ padding: '4px 8px' }}
          >
            <Icon name="x" />
          </button>
        </div>

        <div className="messaging-modal-body">
          {members.length === 0 ? (
            <div style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>
              No members listed.
            </div>
          ) : (
            members.map((m) => {
              const name = m.name || m.email.split('@')[0];
              const initial = name.charAt(0).toUpperCase();

              return (
                <div
                  key={m.user_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--hover-bg, #f9fafb)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="conversation-avatar-container" style={{ width: '36px', height: '36px' }}>
                      <div className="conversation-avatar" style={{ width: '36px', height: '36px', fontSize: '0.9rem' }}>
                        {initial}
                      </div>
                      <div className={m.is_online ? 'online-status-dot' : 'offline-status-dot'} />
                    </div>

                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                        {name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                        {m.email} • {m.role || 'Member'}
                      </div>
                    </div>
                  </div>

                  {m.is_online ? (
                    <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Online</span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Offline</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
