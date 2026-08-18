import React, { useState, useEffect } from 'react';
import ConversationList from '../../components/messaging/ConversationList';
import ChatWindow from '../../components/messaging/ChatWindow';
import messagingService from '../../services/messagingService';
import Icon from '../../components/Icon';
import '../../styles/messaging.css';

export default function TrainerMentorConnect() {
  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentUserId = Number(localStorage.getItem('logged_in_user_id')) || 30; // Default to Trainer 3

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [contactsData, convsData] = await Promise.all([
        messagingService.getContacts(),
        messagingService.getConversations(),
      ]);

      setContacts(contactsData);

      const directConvs = convsData.filter((c) => c.conversation_type === 'DIRECT');
      setConversations(directConvs);

      if (directConvs.length > 0) {
        setActiveConversation(directConvs[0]);
      } else if (contactsData.length > 0) {
        const newConv = await messagingService.createOrGetDirectConversation(contactsData[0].id);
        setConversations([newConv]);
        setActiveConversation(newConv);
      }
    } catch (err) {
      console.error('Error loading Trainer Mentor Connect data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectTrainee = async (traineeId) => {
    try {
      const conv = await messagingService.createOrGetDirectConversation(traineeId);
      setConversations((prev) => {
        if (prev.some((c) => c.id === conv.id)) return prev;
        return [conv, ...prev];
      });
      setActiveConversation(conv);
    } catch (err) {
      console.error('Failed to open conversation with trainee:', err);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-medium)' }}>
        Synchronizing Mentor Connect channels...
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div className="messaging-page-header">
        <div>
          <h2 className="messaging-page-title">
            <Icon name="message-square" style={{ color: '#4f46e5' }} />
            <span>Mentor Connect</span>
          </h2>
          <p className="messaging-page-sub">
            Direct 1-on-1 real-time channel with trainees enrolled in your assigned batches.
          </p>
        </div>
      </div>

      {contacts.length === 0 && conversations.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--msg-card-bg)', borderRadius: '16px', border: '1px solid var(--msg-border)', boxShadow: 'var(--msg-shadow)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎓</div>
          <h3 style={{ color: 'var(--text-dark)', margin: '0 0 8px 0', fontWeight: 800 }}>No Enrolled Trainees</h3>
          <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '0.9rem' }}>
            No trainees are currently assigned to your training batches.
          </p>
        </div>
      ) : (
        <div className="messaging-container">
          <ConversationList
            title="Assigned Trainees"
            conversations={conversations}
            activeConversationId={activeConversation?.id}
            onSelectConversation={(conv) => setActiveConversation(conv)}
            searchPlaceholder="Search trainees..."
            extraHeaderAction={
              contacts.length > conversations.length ? (
                <button
                  type="button"
                  onClick={() => handleSelectTrainee(contacts[0].id)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    backgroundColor: '#4f46e5',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  + New Trainee Chat
                </button>
              ) : null
            }
          />

          <ChatWindow
            conversation={activeConversation}
            currentUserId={currentUserId}
          />
        </div>
      )}
    </div>
  );
}
