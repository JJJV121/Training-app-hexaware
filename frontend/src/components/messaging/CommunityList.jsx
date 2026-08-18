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

  return (
    <div className="communities-page">
      <div>
        <h2 className="communities-header-title">Community Connect</h2>
        <p className="communities-header-sub">
          Join learning communities to collaborate, share resources, and connect with peers.
        </p>
      </div>

      <div className="messaging-search-wrapper" style={{ maxWidth: '400px' }}>
        <Icon name="search" className="messaging-search-icon" />
        <input
          type="text"
          className="messaging-search-input"
          placeholder="Search communities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="communities-grid">
        {filtered.length === 0 ? (
          <div style={{ color: 'var(--text-light)', padding: '24px 0' }}>
            No communities matching "{searchTerm}".
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
