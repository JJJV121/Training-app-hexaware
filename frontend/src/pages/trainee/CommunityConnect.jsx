import React, { useState, useEffect } from 'react';
import CommunityList from '../../components/messaging/CommunityList';
import ChatWindow from '../../components/messaging/ChatWindow';
import CommunityMembers from '../../components/messaging/CommunityMembers';
import communityService from '../../services/communityService';
import messagingService from '../../services/messagingService';
import Icon from '../../components/Icon';
import '../../styles/messaging.css';

export default function CommunityConnect() {
  const [viewMode, setViewMode] = useState('browse'); // 'browse' or 'chat'
  const [communities, setCommunities] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [activeCommunity, setActiveCommunity] = useState(null);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [communityMembers, setCommunityMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentUserId = Number(localStorage.getItem('logged_in_user_id')) || 1;

  const loadCommunities = async () => {
    try {
      setIsLoading(true);
      const data = await communityService.getCommunities();
      setCommunities(data);
    } catch (err) {
      console.error('Failed to load communities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCommunities();
  }, []);

  const handleJoin = async (communityId) => {
    try {
      await communityService.joinCommunity(communityId);
      await loadCommunities();
    } catch (err) {
      console.error('Failed to join community:', err);
    }
  };

  const handleLeave = async (communityId) => {
    try {
      await communityService.leaveCommunity(communityId);
      await loadCommunities();
      if (activeCommunity?.id === communityId) {
        setViewMode('browse');
        setActiveConversation(null);
        setActiveCommunity(null);
      }
    } catch (err) {
      console.error('Failed to leave community:', err);
    }
  };

  const handleOpenChat = async (community) => {
    try {
      if (!community.conversation_id) {
        // Join if not already joined
        await handleJoin(community.id);
      }
      const conv = await messagingService.getConversationById(community.conversation_id);
      setActiveCommunity(community);
      setActiveConversation(conv);
      setViewMode('chat');
    } catch (err) {
      console.error('Failed to open community chat:', err);
    }
  };

  const handleViewMembers = async () => {
    if (!activeCommunity) return;
    try {
      const members = await communityService.getCommunityMembers(activeCommunity.id);
      setCommunityMembers(members);
      setMembersModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch community members:', err);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-medium)' }}>
        Loading Community Connect...
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', height: '100%' }}>
      {viewMode === 'chat' && activeConversation ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className="chat-btn-icon"
              onClick={() => setViewMode('browse')}
            >
              <Icon name="arrow-left" />
              <span>Back to Communities</span>
            </button>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-dark)' }}>
              {activeCommunity?.name}
            </h3>
          </div>

          <div className="messaging-container" style={{ flex: 1 }}>
            <ChatWindow
              conversation={activeConversation}
              currentUserId={currentUserId}
              onViewMembers={handleViewMembers}
            />
          </div>
        </div>
      ) : (
        <CommunityList
          communities={communities}
          onJoinCommunity={handleJoin}
          onLeaveCommunity={handleLeave}
          onOpenCommunityChat={handleOpenChat}
        />
      )}

      {membersModalOpen && (
        <CommunityMembers
          communityName={activeCommunity?.name || 'Community'}
          members={communityMembers}
          onClose={() => setMembersModalOpen(false)}
        />
      )}
    </div>
  );
}
