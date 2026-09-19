import React, { useState, useEffect } from 'react';
import Icon from '../../components/Icon';
import coordinatorService from '../../services/coordinatorService';

export default function CoordinatorAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formAudience, setFormAudience] = useState('All Batches');
  const [formType, setFormType] = useState('General Announcement');
  const [formPriority, setFormPriority] = useState('Normal');
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const list = coordinatorService.getAnnouncements();
    setAnnouncements(list);
  };

  const handleCreateAnnouncement = (e) => {
    e.preventDefault();
    coordinatorService.createAnnouncement({
      title: formTitle,
      message: formMessage,
      targetAudience: formAudience,
      type: formType,
      priority: formPriority
    });

    setAnnouncements(coordinatorService.getAnnouncements());
    setIsModalOpen(false);
    showToast(`Announcement "${formTitle}" dispatched to ${formAudience}! 📢`);
    setFormTitle('');
    setFormMessage('');
  };

  return (
    <div className="coord-container">
      {/* Toast popup */}
      {toastMsg && (
        <div className="toast-message" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
          <Icon name="check" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="coord-banner">
        <div className="coord-banner-left">
          <span className="coord-banner-subtitle">MODULE 11 • COMMUNICATION & BROADCAST NOTIFICATIONS</span>
          <h1 className="coord-banner-title">Batch Announcements & Reminders</h1>
          <p className="coord-banner-desc">
            Broadcast targeted reminders, deadline notifications, and urgent announcements to batches, trainees, and faculty.
          </p>
        </div>
        <div className="coord-banner-right">
          <button className="coord-banner-btn primary" onClick={() => setIsModalOpen(true)}>
            <Icon name="plus" style={{ width: '16px', height: '16px' }} />
            <span>Compose Announcement</span>
          </button>
        </div>
      </div>

      {/* Announcements Stream */}
      <div className="coord-card">
        <div className="coord-card-header">
          <h2 className="coord-card-title">
            <Icon name="megaphone" className="coord-card-title-icon" />
            <span>Broadcast Feed & Notification History ({announcements.length})</span>
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {announcements.map((ann) => (
            <div
              key={ann.id}
              style={{
                padding: '20px',
                borderRadius: '16px',
                border: ann.priority === 'High' ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                background: ann.priority === 'High' ? '#fffafa' : '#ffffff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`coord-badge ${ann.priority === 'High' ? 'red' : 'blue'}`}>
                      {ann.type} • {ann.priority} Priority
                    </span>
                    <span className="coord-badge purple">Target: {ann.targetAudience}</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{ann.date}</span>
                  </div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: '8px 0 4px 0' }}>
                    {ann.title}
                  </h3>
                </div>
                <div>
                  <span className="coord-badge green" style={{ fontSize: '11px' }}>
                    ✓ {ann.deliveryStats}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6, margin: '8px 0 0 0' }}>
                {ann.message}
              </p>

              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '12px' }}>
                Dispatched by: <strong>{ann.sentBy}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COMPOSE ANNOUNCEMENT MODAL */}
      {isModalOpen && (
        <div className="coord-modal-backdrop">
          <div className="coord-modal-card">
            <div className="coord-modal-header">
              <h3 className="coord-modal-title">
                <Icon name="megaphone" style={{ color: '#0061fe' }} />
                <span>Compose Batch Broadcast</span>
              </h3>
              <button className="coord-modal-close" onClick={() => setIsModalOpen(false)}>
                <Icon name="x" />
              </button>
            </div>
            <form onSubmit={handleCreateAnnouncement}>
              <div className="coord-modal-body">
                <div className="coord-form-group">
                  <label className="coord-form-label">Announcement Title / Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mid-Term Assessment Schedule & Guidelines"
                    className="coord-form-input"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                  />
                </div>

                <div className="coord-form-grid">
                  <div className="coord-form-group">
                    <label className="coord-form-label">Target Audience *</label>
                    <select
                      className="coord-form-select"
                      value={formAudience}
                      onChange={(e) => setFormAudience(e.target.value)}
                    >
                      <option value="All Batches">All Batches (Organization-wide)</option>
                      <option value="Batch 2026-Alpha">Batch 2026-Alpha (Java FullStack)</option>
                      <option value="Batch 2026-Beta">Batch 2026-Beta (Cloud & DevOps)</option>
                      <option value="All Assigned Trainers">All Assigned Trainers & Faculty</option>
                      <option value="At-Risk Trainees Only">At-Risk Trainees Only (Action Reminder)</option>
                    </select>
                  </div>

                  <div className="coord-form-group">
                    <label className="coord-form-label">Category / Alert Type</label>
                    <select
                      className="coord-form-select"
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                    >
                      <option value="General Announcement">General Announcement</option>
                      <option value="Assessment Alert">Assessment Alert</option>
                      <option value="Deadline Notice">Assignment Deadline Notice</option>
                      <option value="Schedule Change">Schedule / Holiday Change</option>
                      <option value="Attendance Warning">Attendance Warning Notice</option>
                    </select>
                  </div>
                </div>

                <div className="coord-form-group">
                  <label className="coord-form-label">Priority Level</label>
                  <select
                    className="coord-form-select"
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High (Urgent Banner & Push Notification)</option>
                  </select>
                </div>

                <div className="coord-form-group">
                  <label className="coord-form-label">Broadcast Message Content *</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Write detailed message body..."
                    className="coord-form-textarea"
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                  />
                </div>
              </div>
              <div className="coord-modal-footer">
                <button type="button" className="coord-btn secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="coord-btn primary">
                  <Icon name="send" />
                  <span>Broadcast Announcement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
