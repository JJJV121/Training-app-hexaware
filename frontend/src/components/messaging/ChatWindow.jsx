import React, { useState, useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import DateSeparator from './DateSeparator';
import MentorInfoPanel from './MentorInfoPanel';
import messagingService from '../../services/messagingService';
import messagingSocket from '../../services/messagingSocket';
import Icon from '../Icon';

export default function ChatWindow({
  conversation,
  currentUserId,
  onBack,
  onViewMembers,
}) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connected');

  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);

  const conversationId = conversation?.id;
  const isCommunity = conversation?.conversation_type === 'COMMUNITY';

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  useEffect(() => {
    if (!conversationId) return;

    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const data = await messagingService.getMessages(conversationId);
        setMessages(data);
        setTimeout(() => scrollToBottom(false), 50);
        await messagingService.markAsRead(conversationId);
      } catch (err) {
        console.error('Failed to load message history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();

    messagingSocket.connect(
      conversationId,
      (newMsg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(() => scrollToBottom(true), 50);
      },
      (typingData) => {
        if (typingData.user_id !== currentUserId) {
          setTypingUser(typingData.user_name);
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => {
            setTypingUser(null);
          }, 3000);
        }
      }
    );

    return () => {
      messagingSocket.disconnect();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [conversationId, currentUserId]);

  const handleSendMessage = async (content) => {
    if (!conversationId || !content) return;

    const sentViaWs = messagingSocket.sendMessage(content);
    if (!sentViaWs) {
      try {
        const newMsg = await messagingService.sendMessage(conversationId, content);
        setMessages((prev) => [...prev, newMsg]);
        setTimeout(() => scrollToBottom(true), 50);
      } catch (err) {
        console.error('Failed to send message via REST fallback:', err);
      }
    }
  };

  const handleTyping = () => {
    messagingSocket.sendTyping();
  };

  if (!conversation) {
    return (
      <div className="chat-window" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '24px' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>💬</div>
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-dark)', fontWeight: 800, fontSize: '1.25rem' }}>Select a Conversation</h3>
          <p style={{ margin: 0, fontSize: '0.925rem' }}>Choose an assigned mentor or community channel from the list to start messaging.</p>
        </div>
      </div>
    );
  }

  // Helper to group messages by date
  const renderMessagesWithDateSeparators = () => {
    let lastDateStr = null;
    const elements = [];

    messages.forEach((msg, idx) => {
      const msgDate = new Date(msg.created_at).toDateString();
      if (msgDate !== lastDateStr) {
        lastDateStr = msgDate;
        elements.push(
          <DateSeparator key={`date-${msg.id || idx}`} dateString={msg.created_at} />
        );
      }

      elements.push(
        <MessageBubble
          key={msg.id || idx}
          message={msg}
          isOwnMessage={msg.sender_id === currentUserId}
          showSenderName={isCommunity}
        />
      );
    });

    return elements;
  };

  return (
    <div style={{ display: 'flex', flex: 1, width: '100%', overflow: 'hidden' }}>
      <div className="chat-window">
        <ChatHeader
          conversation={conversation}
          onBack={onBack}
          onViewMembers={onViewMembers}
        />

        <div className="messages-container">
          {isLoading ? (
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="skeleton-box" style={{ width: '60%', height: '40px' }} />
              <div className="skeleton-box" style={{ width: '40%', height: '35px', alignSelf: 'flex-end' }} />
              <div className="skeleton-box" style={{ width: '50%', height: '45px' }} />
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '60px 20px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>👋</div>
              <h4 style={{ margin: '0 0 6px 0', color: 'var(--text-dark)', fontWeight: 800 }}>Start the Conversation</h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Send your first message to connect in real time.</p>
            </div>
          ) : (
            renderMessagesWithDateSeparators()
          )}

          {typingUser && (
            <div className="typing-indicator">
              <Icon name="edit-2" style={{ width: '14px', height: '14px' }} />
              <span>{typingUser} is typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
        />
      </div>

      {showInfoPanel && (
        <MentorInfoPanel
          conversation={conversation}
          onViewMembers={onViewMembers}
        />
      )}
    </div>
  );
}
