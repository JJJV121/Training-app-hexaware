import React, { useState, useEffect } from 'react';
import Icon from '../../components/Icon';
import coordinatorService from '../../services/coordinatorService';

export default function CoordinatorFeedback() {
  const [activeTab, setActiveTab] = useState('trainer-to-trainee'); // trainer-to-trainee | trainee-feedback
  const [trainerFeedbacks, setTrainerFeedbacks] = useState([]);
  const [traineeFeedbacks, setTraineeFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  // Modal for escalating Trainee feedback to Admin
  const [selectedFeedbackForEscalation, setSelectedFeedbackForEscalation] = useState(null);
  const [escalationRemarks, setEscalationRemarks] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    try {
      const trFb = coordinatorService.getTrainerToTraineeFeedback();
      const stFb = coordinatorService.getTraineeFeedback();
      setTrainerFeedbacks(trFb);
      setTraineeFeedbacks(stFb);
    } catch (err) {
      console.error('Error loading feedback data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEscalateFeedback = (fb) => {
    setSelectedFeedbackForEscalation(fb);
    setEscalationRemarks(`Escalating recurring issue flagged in session feedback: "${fb.recurringIssue || fb.comments}"`);
  };

  const handleConfirmEscalation = (e) => {
    e.preventDefault();
    coordinatorService.escalateFeedbackToAdmin(selectedFeedbackForEscalation.id, escalationRemarks);
    setTraineeFeedbacks(coordinatorService.getTraineeFeedback());
    showToast(`Feedback report #${selectedFeedbackForEscalation.id} escalated directly to System Admin!`);
    setSelectedFeedbackForEscalation(null);
  };

  const renderStars = (rating) => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            name="star"
            style={{
              width: '14px',
              height: '14px',
              color: star <= rating ? '#eab308' : '#cbd5e1',
              fill: star <= rating ? '#eab308' : 'none'
            }}
          />
        ))}
        <span style={{ fontSize: '12px', fontWeight: 700, marginLeft: '4px', color: '#1e293b' }}>
          {rating}/5
        </span>
      </div>
    );
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
          <span className="coord-banner-subtitle">MODULE 5 & 6 • TWO-WAY FEEDBACK SYSTEM</span>
          <h1 className="coord-banner-title">Feedback & Performance Reviews</h1>
          <p className="coord-banner-desc">
            Monitor trainee feedback on sessions and trainers, review faculty competency evaluations, and track improvement trajectories.
          </p>
        </div>
        <div className="coord-banner-right">
          <button
            className="coord-banner-btn primary"
            onClick={() => showToast('Exporting comprehensive 2-way feedback report (PDF/Excel)...')}
          >
            <Icon name="download" style={{ width: '16px', height: '16px' }} />
            <span>Export Feedback Data</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="coord-tabs">
        <button
          className={`coord-tab-btn ${activeTab === 'trainer-to-trainee' ? 'active' : ''}`}
          onClick={() => setActiveTab('trainer-to-trainee')}
        >
          <Icon name="user-check" style={{ width: '16px', height: '16px' }} />
          <span>Trainer → Trainee Competency Evaluations ({trainerFeedbacks.length})</span>
        </button>
        <button
          className={`coord-tab-btn ${activeTab === 'trainee-feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('trainee-feedback')}
        >
          <Icon name="message-square" style={{ width: '16px', height: '16px' }} />
          <span>Trainee Feedback on Sessions & Faculty ({traineeFeedbacks.length})</span>
        </button>
      </div>

      {/* TAB 1: Trainer -> Trainee Evaluation Reviews (Section 6) */}
      {activeTab === 'trainer-to-trainee' && (
        <div className="coord-card">
          <div className="coord-card-header">
            <h2 className="coord-card-title">
              <Icon name="clipboard-check" className="coord-card-title-icon" />
              <span>Trainer Evaluations by Trainee</span>
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {trainerFeedbacks.map((fb) => (
              <div
                key={fb.id}
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  border: fb.requiresSupport ? '1px solid #fecaca' : '1px solid #e2e8f0',
                  background: fb.requiresSupport ? '#fffafa' : '#ffffff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                        {fb.traineeName}
                      </span>
                      {fb.requiresSupport ? (
                        <span className="coord-badge red">Requires Additional Support</span>
                      ) : (
                        <span className="coord-badge green">Good Progress</span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                      Evaluated by <strong>{fb.trainerName}</strong> • Date: {fb.date}
                    </div>
                  </div>

                  {fb.requiresSupport && (
                    <a
                      href="#coordinator-interventions"
                      className="coord-btn danger coord-btn-sm"
                    >
                      <Icon name="alert-triangle" style={{ width: '12px', height: '12px' }} />
                      <span>Create Intervention</span>
                    </a>
                  )}
                </div>

                {/* 6 Dimension Competency Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginTop: '16px', background: '#f8fafc', padding: '14px', borderRadius: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Technical Understanding</div>
                    {renderStars(fb.technicalUnderstanding)}
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Live Participation</div>
                    {renderStars(fb.participation)}
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Communication Skills</div>
                    {renderStars(fb.communication)}
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Assignment Quality</div>
                    {renderStars(fb.assignmentPerformance)}
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Attendance & Discipline</div>
                    {renderStars(fb.attendanceDiscipline)}
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Learning Trajectory</div>
                    {renderStars(fb.learningProgress)}
                  </div>
                </div>

                {/* Areas for Improvement */}
                <div style={{ marginTop: '14px', fontSize: '13px', color: '#334155' }}>
                  <strong>Trainer Remarks & Improvement Guidance:</strong> {fb.areasForImprovement}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Trainee Feedback on Sessions (Section 5) */}
      {activeTab === 'trainee-feedback' && (
        <div className="coord-card">
          <div className="coord-card-header">
            <h2 className="coord-card-title">
              <Icon name="message-square" className="coord-card-title-icon" />
              <span>Trainee Session Feedback & Trends</span>
            </h2>
          </div>

          <div className="coord-table-wrapper">
            <table className="coord-table">
              <thead>
                <tr>
                  <th>Session & Topic</th>
                  <th>Faculty</th>
                  <th>Rating</th>
                  <th>Pacing</th>
                  <th>Candidate Remarks</th>
                  <th>Recurring Issues</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {traineeFeedbacks.map((fb) => (
                  <tr key={fb.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{fb.sessionTopic}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{fb.courseName} • {fb.batchName?.split('(')[0]}</div>
                    </td>
                    <td>{fb.trainerName}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 800 }}>
                        <Icon name="star" style={{ width: '14px', height: '14px', color: '#eab308' }} />
                        <span>{fb.rating} / 5</span>
                      </div>
                    </td>
                    <td>
                      <span className={`coord-badge ${fb.paceRating === 'Just Right' ? 'green' : 'orange'}`}>
                        {fb.paceRating}
                      </span>
                    </td>
                    <td style={{ maxWidth: '240px', fontSize: '12px', color: '#334155' }}>
                      "{fb.comments}"
                    </td>
                    <td>
                      {fb.recurringIssue !== 'None' ? (
                        <span className="coord-badge red" style={{ fontSize: '10px' }}>
                          {fb.recurringIssue}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#64748b' }}>None</span>
                      )}
                    </td>
                    <td>
                      {!fb.escalatedToAdmin ? (
                        <button
                          className="coord-btn secondary coord-btn-sm"
                          onClick={() => handleOpenEscalateFeedback(fb)}
                        >
                          <Icon name="shield" style={{ width: '12px', height: '12px' }} />
                          <span>Escalate to Admin</span>
                        </button>
                      ) : (
                        <span className="coord-badge purple" style={{ fontSize: '10px' }}>
                          Escalated to Admin
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADMIN ESCALATION MODAL */}
      {selectedFeedbackForEscalation && (
        <div className="coord-modal-backdrop">
          <div className="coord-modal-card">
            <div className="coord-modal-header">
              <h3 className="coord-modal-title">
                <Icon name="shield" style={{ color: '#0061fe' }} />
                <span>Escalate Feedback Issue to System Admin</span>
              </h3>
              <button className="coord-modal-close" onClick={() => setSelectedFeedbackForEscalation(null)}>
                <Icon name="x" />
              </button>
            </div>
            <form onSubmit={handleConfirmEscalation}>
              <div className="coord-modal-body">
                <div className="coord-alert warning">
                  <Icon name="info" style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                  <span>
                    This action escalates recurring training or trainer issues directly to the System Admin and Program Director queue for intervention.
                  </span>
                </div>

                <div className="coord-form-group">
                  <label className="coord-form-label">Coordinator Escalation Remarks</label>
                  <textarea
                    required
                    rows={4}
                    className="coord-form-textarea"
                    value={escalationRemarks}
                    onChange={(e) => setEscalationRemarks(e.target.value)}
                  />
                </div>
              </div>
              <div className="coord-modal-footer">
                <button type="button" className="coord-btn secondary" onClick={() => setSelectedFeedbackForEscalation(null)}>
                  Cancel
                </button>
                <button type="submit" className="coord-btn danger">
                  <Icon name="send" />
                  <span>Escalate to Admin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
