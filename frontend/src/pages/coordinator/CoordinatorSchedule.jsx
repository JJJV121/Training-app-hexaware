import React, { useState } from 'react';
import Icon from '../../components/Icon';

export default function CoordinatorSchedule() {
  const [selectedBatch, setSelectedBatch] = useState('Batch 2026-Alpha (Java FullStack)');
  const [sessions, setSessions] = useState([
    {
      id: 1,
      title: 'Spring Security & OAuth2 Integration',
      batch: 'Batch 2026-Alpha (Java FullStack)',
      trainer: 'Dr. Rajesh Kumar',
      date: '2026-09-19',
      time: '09:00 AM - 11:00 AM',
      location: 'Virtual Lab 1 (Teams Link Active)',
      status: 'Upcoming'
    },
    {
      id: 2,
      title: 'Distributed Tracing with Micrometer & Zipkin',
      batch: 'Batch 2026-Alpha (Java FullStack)',
      trainer: 'Dr. Rajesh Kumar',
      date: '2026-09-20',
      time: '09:00 AM - 11:00 AM',
      location: 'Virtual Lab 1 (Teams Link Active)',
      status: 'Upcoming'
    },
    {
      id: 3,
      title: 'Kafka Event Streaming Architecture',
      batch: 'Batch 2026-Alpha (Java FullStack)',
      trainer: 'Dr. Rajesh Kumar',
      date: '2026-09-18',
      time: '09:00 AM - 11:00 AM',
      location: 'Virtual Lab 1',
      status: 'Completed'
    },
    {
      id: 4,
      title: 'Terraform State & AWS ECS Fargate',
      batch: 'Batch 2026-Beta (Cloud & DevOps)',
      trainer: 'Sunita Rao',
      date: '2026-09-19',
      time: '11:30 AM - 01:30 PM',
      location: 'Virtual Lab 2',
      status: 'Upcoming'
    }
  ]);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedSessionForReschedule, setSelectedSessionForReschedule] = useState(null);

  // Form states
  const [formTopic, setFormTopic] = useState('');
  const [formDate, setFormDate] = useState('2026-09-21');
  const [formTime, setFormTime] = useState('09:00 AM - 11:00 AM');
  const [formTrainer, setFormTrainer] = useState('Dr. Rajesh Kumar');
  const [formLink, setFormLink] = useState('https://teams.microsoft.com/hexaware-lab');
  const [rescheduleDate, setRescheduleDate] = useState('2026-09-22');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleCreateSession = (e) => {
    e.preventDefault();
    const newSess = {
      id: sessions.length + 1,
      title: formTopic,
      batch: selectedBatch,
      trainer: formTrainer,
      date: formDate,
      time: formTime,
      location: formLink,
      status: 'Upcoming'
    };
    setSessions([newSess, ...sessions]);
    setIsScheduleModalOpen(false);
    showToast(`Session "${formTopic}" scheduled! Automated alerts dispatched to trainees & trainer.`);
    setFormTopic('');
  };

  const handleOpenReschedule = (sess) => {
    setSelectedSessionForReschedule(sess);
    setRescheduleDate(sess.date);
    setRescheduleReason('');
    setIsRescheduleModalOpen(true);
  };

  const handleConfirmReschedule = (e) => {
    e.preventDefault();
    setSessions(sessions.map(s => s.id === selectedSessionForReschedule.id ? {
      ...s,
      date: rescheduleDate,
      status: 'Rescheduled'
    } : s));
    setIsRescheduleModalOpen(false);
    showToast(`Session "${selectedSessionForReschedule.title}" rescheduled to ${rescheduleDate}. Notifications sent to all attendees.`);
  };

  const handleCancelSession = (sess) => {
    if (confirm(`Are you sure you want to cancel session "${sess.title}"? Attendees will be immediately alerted.`)) {
      setSessions(sessions.map(s => s.id === sess.id ? { ...s, status: 'Cancelled' } : s));
      showToast(`Session cancelled. Cancellation notification sent.`);
    }
  };

  const filteredSessions = sessions.filter(s => s.batch === selectedBatch);

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
          <span className="coord-banner-subtitle">MODULE 10 • TRAINING SCHEDULE MANAGEMENT</span>
          <h1 className="coord-banner-title">Batch Timetable & Calendar Alignment</h1>
          <p className="coord-banner-desc">
            Coordinate trainer availability, schedule curriculum sessions, and manage real-time rescheduling notifications.
          </p>
        </div>
        <div className="coord-banner-right">
          <button className="coord-banner-btn primary" onClick={() => setIsScheduleModalOpen(true)}>
            <Icon name="plus" style={{ width: '16px', height: '16px' }} />
            <span>Schedule Session</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="coord-toolbar">
        <div className="coord-filter-group">
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Selected Batch:</label>
          <select
            className="coord-select"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
          >
            <option value="Batch 2026-Alpha (Java FullStack)">Batch 2026-Alpha (Java FullStack)</option>
            <option value="Batch 2026-Beta (Cloud & DevOps)">Batch 2026-Beta (Cloud & DevOps)</option>
          </select>
        </div>
        <div>
          <span className="coord-badge blue">
            Regular Schedule: Mon - Fri • 09:00 AM - 11:00 AM
          </span>
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="coord-card">
        <div className="coord-card-header">
          <h2 className="coord-card-title">
            <Icon name="calendar" className="coord-card-title-icon" />
            <span>Scheduled Training Sessions ({filteredSessions.length})</span>
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredSessions.map((s) => (
            <div
              key={s.id}
              style={{
                padding: '18px 20px',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                background: s.status === 'Completed' ? '#f8fafc' : s.status === 'Cancelled' ? '#fef2f2' : '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className={`coord-badge ${s.status === 'Completed' ? 'green' : s.status === 'Cancelled' ? 'red' : s.status === 'Rescheduled' ? 'orange' : 'blue'}`}>
                    {s.status}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                    📅 {s.date} • ⏰ {s.time}
                  </span>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                  {s.title}
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Trainer: <strong>{s.trainer}</strong> • Room / Link: <span style={{ color: '#0061fe' }}>{s.location}</span>
                </div>
              </div>

              {s.status !== 'Completed' && s.status !== 'Cancelled' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="coord-btn secondary coord-btn-sm"
                    onClick={() => handleOpenReschedule(s)}
                  >
                    <Icon name="clock" style={{ width: '12px', height: '12px' }} />
                    <span>Reschedule</span>
                  </button>
                  <button
                    className="coord-btn danger coord-btn-sm"
                    onClick={() => handleCancelSession(s)}
                  >
                    <Icon name="x" style={{ width: '12px', height: '12px' }} />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SCHEDULE SESSION MODAL */}
      {isScheduleModalOpen && (
        <div className="coord-modal-backdrop">
          <div className="coord-modal-card">
            <div className="coord-modal-header">
              <h3 className="coord-modal-title">
                <Icon name="calendar" style={{ color: '#0061fe' }} />
                <span>Schedule Batch Training Session</span>
              </h3>
              <button className="coord-modal-close" onClick={() => setIsScheduleModalOpen(false)}>
                <Icon name="x" />
              </button>
            </div>
            <form onSubmit={handleCreateSession}>
              <div className="coord-modal-body">
                <div className="coord-form-group">
                  <label className="coord-form-label">Session Topic / Curriculum Unit *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unit 14: Kubernetes Ingress Controllers & TLS"
                    className="coord-form-input"
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                  />
                </div>

                <div className="coord-form-grid">
                  <div className="coord-form-group">
                    <label className="coord-form-label">Date *</label>
                    <input
                      type="date"
                      required
                      className="coord-form-input"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                    />
                  </div>
                  <div className="coord-form-group">
                    <label className="coord-form-label">Time Window</label>
                    <input
                      type="text"
                      className="coord-form-input"
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="coord-form-grid">
                  <div className="coord-form-group">
                    <label className="coord-form-label">Assigned Trainer</label>
                    <input
                      type="text"
                      className="coord-form-input"
                      value={formTrainer}
                      onChange={(e) => setFormTrainer(e.target.value)}
                    />
                  </div>
                  <div className="coord-form-group">
                    <label className="coord-form-label">Virtual Meeting / Lab Link</label>
                    <input
                      type="text"
                      className="coord-form-input"
                      value={formLink}
                      onChange={(e) => setFormLink(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="coord-modal-footer">
                <button type="button" className="coord-btn secondary" onClick={() => setIsScheduleModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="coord-btn primary">
                  <Icon name="check" />
                  <span>Publish & Notify Batch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {isRescheduleModalOpen && selectedSessionForReschedule && (
        <div className="coord-modal-backdrop">
          <div className="coord-modal-card">
            <div className="coord-modal-header">
              <h3 className="coord-modal-title">
                <Icon name="clock" style={{ color: '#ea580c' }} />
                <span>Reschedule Session: {selectedSessionForReschedule.title}</span>
              </h3>
              <button className="coord-modal-close" onClick={() => setIsRescheduleModalOpen(false)}>
                <Icon name="x" />
              </button>
            </div>
            <form onSubmit={handleConfirmReschedule}>
              <div className="coord-modal-body">
                <div className="coord-alert warning">
                  <Icon name="info" style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                  <span>
                    Rescheduling will automatically update the batch calendar and broadcast an urgent SMS/Email notification to all trainees and trainer.
                  </span>
                </div>

                <div className="coord-form-group">
                  <label className="coord-form-label">New Session Date *</label>
                  <input
                    type="date"
                    required
                    className="coord-form-input"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                  />
                </div>

                <div className="coord-form-group">
                  <label className="coord-form-label">Rescheduling Reason & Notification Message *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Faculty medical adjustment / Campus electrical maintenance..."
                    className="coord-form-textarea"
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="coord-modal-footer">
                <button type="button" className="coord-btn secondary" onClick={() => setIsRescheduleModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="coord-btn primary">
                  <Icon name="send" />
                  <span>Confirm & Broadcast Update</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
