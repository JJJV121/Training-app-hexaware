import React, { useState } from 'react';
import CommunityCard from './CommunityCard';
import Icon from '../Icon';

export default function CommunityList({
  communities = [],
  onJoinCommunity,
  onLeaveCommunity,
  onOpenCommunityChat,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = communities.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q)
    );
  });

  const totalMemberships = communities.reduce((acc, c) => acc + (c.is_member ? 1 : 0), 0);

  return (
    <div className="communities-page">
      <div className="messaging-page-header">
        <div>
          <h2 className="messaging-page-title">
            <Icon name="users" style={{ color: '#2563eb' }} />
            <span>Community Connect</span>
          </h2>
          <p className="messaging-page-sub">
            View the batches assigned to you and connect with your current trainer or cohort in real time.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: 'rgba(37, 99, 235, 0.08)',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
            {totalMemberships} / {communities.length} Batches
          </div>
        </div>
      </div>

      <div className="messaging-search-wrapper" style={{ maxWidth: '420px' }}>
        <Icon name="search" className="messaging-search-icon" />
        <input
          type="text"
          className="messaging-search-input"
          placeholder="Search batches by name or course..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="communities-grid">
        {filtered.length === 0 ? (
          <div style={{ color: 'var(--text-light)', padding: '32px 0', gridColumn: '1 / -1', textAlign: 'center' }}>
            No batches matching "{searchTerm}".
          </div>
        ) : (
          filtered.map((comm) => (
            <CommunityCard
              key={comm.id}
              community={comm}
              onJoin={onJoinCommunity}
              onLeave={onLeaveCommunity}
              onOpenChat={onOpenCommunityChat}
            />
          ))
        )}
      </div>
    </div>
  );
}
