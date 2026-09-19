import React, { useState, useEffect } from 'react';
import Icon from '../../components/Icon';
import adminUserService from '../../services/adminUserService';
import coordinatorService from '../../services/coordinatorService';

export default function CoordinatorTrainers() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [isCoordinationModalOpen, setIsCoordinationModalOpen] = useState(false);
  const [coordinationMessage, setCoordinationMessage] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const rawTrainers = await adminUserService.getTrainers();
        const list = (rawTrainers && rawTrainers.length > 0 ? rawTrainers : [
          { id: 1, name: 'Dr. Rajesh Kumar', email: 'rajesh.k@hexaware.com', employee_id: 'HEX-TR-01' },
          { id: 2, name: 'Sunita Rao', email: 'sunita.r@hexaware.com', employee_id: 'HEX-TR-02' },
          { id: 3, name: 'Manoj Bajpayee', email: 'manoj.b@hexaware.com', employee_id: 'HEX-TR-03' }
        ]).map((tr, idx) => ({
          ...tr,
          assignedBatch: idx === 0 ? 'Batch 2026-Alpha (Java FullStack)' : idx === 1 ? 'Batch 2026-Beta (Cloud & DevOps)' : 'Batch 2026-Gamma (Data Engineering)',
          courseName: idx === 0 ? 'Java Enterprise Architecture' : idx === 1 ? 'Cloud & Infrastructure Engineering' : 'Data Engineering with Python',
          completedSessions: 18 + (idx * 4),
          totalSessions: 30,
          missedSessions: idx === 0 ? 1 : 0,
          feedbackSubmittedCount: 32 - (idx * 4),
          studentRating: 4.8 - (idx * 0.1),
          availabilityStatus: 'Active & Available'
        }));
        setTrainers(list);
      } catch (err) {
        console.error('Error loading trainers:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleOpenCoordination = (trainer) => {
    setSelectedTrainer(trainer);
    setCoordinationMessage(`Hi ${trainer.name}, checking in regarding batch session schedules and attendance logs.`);
    setIsCoordinationModalOpen(true);
  };

  const handleSendCoordination = (e) => {
    e.preventDefault();
    showToast(`Coordination dispatch sent to ${selectedTrainer.name} (${selectedTrainer.email})!`);
    setIsCoordinationModalOpen(false);
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
          <span className="coord-banner-subtitle">MODULE 3 • TRAINER MANAGEMENT</span>
          <h1 className="coord-banner-title">Trainer Allocations & Session Coordination</h1>
          <p className="coord-banner-desc">
            Review trainer workloads, session completion rates, missed class logs, and manage two-way communications.
          </p>
        </div>
        <div className="coord-banner-right">
          <a href="#coordinator-feedback" className="coord-banner-btn">
            <Icon name="message-square" style={{ width: '16px', height: '16px' }} />
            <span>Review Trainer Evaluations</span>
          </a>
        </div>
      </div>

      {/* Trainers Allocation Table */}
      <div className="coord-card">
        <div className="coord-card-header">
          <h2 className="coord-card-title">
            <Icon name="user" className="coord-card-title-icon" />
            <span>Assigned Faculty & Trainers ({trainers.length})</span>
          </h2>
        </div>

        <div className="coord-table-wrapper">
          <table className="coord-table">
            <thead>
              <tr>
                <th>Trainer Information</th>
                <th>Assigned Batch</th>
                <th>Curriculum Mapped</th>
                <th>Session Progress</th>
                <th>Missed Sessions</th>
                <th>Trainee Evaluations</th>
                <th>Student Rating</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {trainers.map((tr) => (
                <tr key={tr.id}>
                  <td>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{tr.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{tr.email}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: '#1e293b' }}>{tr.assignedBatch}</span>
                  </td>
                  <td>
                    <span className="coord-badge blue" style={{ fontSize: '11px' }}>{tr.courseName}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>
                      {tr.completedSessions} / {tr.totalSessions} Sessions
                    </div>
                    <div style={{ width: '90px', backgroundColor: '#e2e8f0', borderRadius: '9999px', height: '5px', marginTop: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${(tr.completedSessions / tr.totalSessions) * 100}%`, backgroundColor: '#0061fe', height: '100%' }} />
                    </div>
                  </td>
                  <td>
                    {tr.missedSessions > 0 ? (
                      <span className="coord-badge red" style={{ fontSize: '10px' }}>
                        {tr.missedSessions} Missed (Makeup Pending)
                      </span>
                    ) : (
                      <span className="coord-badge green" style={{ fontSize: '10px' }}>0 Missed</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>
                      {tr.feedbackSubmittedCount} evaluations
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 800, color: '#0f172a' }}>
                      <Icon name="star" style={{ width: '14px', height: '14px', color: '#eab308' }} />
                      <span>{tr.studentRating} / 5.0</span>
                    </div>
                  </td>
                  <td>
                    <button
                      className="coord-btn primary coord-btn-sm"
                      onClick={() => handleOpenCoordination(tr)}
                    >
                      <Icon name="send" style={{ width: '12px', height: '12px' }} />
                      <span>Coordinate</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* COORDINATION DISPATCH MODAL */}
      {isCoordinationModalOpen && selectedTrainer && (
        <div className="coord-modal-backdrop">
          <div className="coord-modal-card">
            <div className="coord-modal-header">
              <h3 className="coord-modal-title">
                <Icon name="message-square" style={{ color: '#0061fe' }} />
                <span>Trainer Coordination: {selectedTrainer.name}</span>
              </h3>
              <button className="coord-modal-close" onClick={() => setIsCoordinationModalOpen(false)}>
                <Icon name="x" />
              </button>
            </div>
            <form onSubmit={handleSendCoordination}>
              <div className="coord-modal-body">
                <div className="coord-alert info">
                  <Icon name="info" style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                  <span>
                    Coordinator communication channel for schedule confirmations, missed session makeup scheduling, and candidate training issues.
                  </span>
                </div>

                <div className="coord-form-group">
                  <label className="coord-form-label">Subject / Purpose</label>
                  <input
                    type="text"
                    required
                    defaultValue={`Schedule & Attendance Alignment for ${selectedTrainer.assignedBatch}`}
                    className="coord-form-input"
                  />
                </div>

                <div className="coord-form-group">
                  <label className="coord-form-label">Coordination Message</label>
                  <textarea
                    required
                    rows={4}
                    className="coord-form-textarea"
                    value={coordinationMessage}
                    onChange={(e) => setCoordinationMessage(e.target.value)}
                  />
                </div>
              </div>
              <div className="coord-modal-footer">
                <button type="button" className="coord-btn secondary" onClick={() => setIsCoordinationModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="coord-btn primary">
                  <Icon name="send" />
                  <span>Send Notification & Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
