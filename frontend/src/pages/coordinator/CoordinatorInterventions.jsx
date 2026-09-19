import React, { useState, useEffect } from 'react';
import Icon from '../../components/Icon';
import coordinatorService from '../../services/coordinatorService';

export default function CoordinatorInterventions() {
  const [interventions, setInterventions] = useState([]);
  const [atRiskTrainees, setAtRiskTrainees] = useState([]);
  const [activeTab, setActiveTab] = useState('interventions'); // interventions | at-risk-list
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState(null);

  // Form states
  const [formTraineeId, setFormTraineeId] = useState('');
  const [formReason, setFormReason] = useState('Low Attendance & Consecutive Absences');
  const [formConditionTag, setFormConditionTag] = useState('Low Attendance (<75%)');
  const [formActionTaken, setFormActionTaken] = useState('');
  const [formFollowUpDate, setFormFollowUpDate] = useState('2026-09-25');
  const [formOutcome, setFormOutcome] = useState('');
  const [formStatus, setFormStatus] = useState('In Progress');

  // Follow-up Note Modal
  const [followupNote, setFollowupNote] = useState('');
  const [activeInterventionForNote, setActiveInterventionForNote] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const list = coordinatorService.getInterventions();
      const trainees = await coordinatorService.getTraineesDirectory();
      setInterventions(list);
      setAtRiskTrainees(trainees.filter(t => t.status === 'At-Risk'));
    } catch (err) {
      console.error('Error loading interventions:', err);
    }
  };

  const handleOpenCreate = (trainee = null) => {
    setSelectedIntervention(null);
    if (trainee) {
      setFormTraineeId(trainee.id.toString());
      setFormConditionTag(trainee.atRiskReasons?.[0] || 'Low Attendance');
      setFormReason(`Intervention triggered due to ${trainee.atRiskReasons?.join(', ')}.`);
    } else {
      setFormTraineeId(atRiskTrainees[0]?.id?.toString() || '1');
      setFormConditionTag('Low Attendance (<75%)');
      setFormReason('Low Attendance & Consecutive Absences');
    }
    setFormActionTaken('');
    setFormFollowUpDate('2026-09-25');
    setFormOutcome('');
    setFormStatus('In Progress');
    setIsModalOpen(true);
  };

  const handleSaveIntervention = (e) => {
    e.preventDefault();
    const trainee = atRiskTrainees.find(t => t.id === parseInt(formTraineeId)) || {
      name: 'Aarav Sharma',
      batchName: 'Batch 2026-Alpha (Java FullStack)',
      id: 1
    };

    coordinatorService.saveIntervention({
      id: selectedIntervention?.id,
      traineeId: trainee.id,
      traineeName: trainee.name,
      batchId: trainee.batchId || 1,
      batchName: trainee.batchName,
      reason: formReason,
      conditionTag: formConditionTag,
      actionTaken: formActionTaken,
      followUpDate: formFollowUpDate,
      outcome: formOutcome,
      status: formStatus,
      createdBy: 'Batch Coordinator (SPOC)'
    });

    setInterventions(coordinatorService.getInterventions());
    setIsModalOpen(false);
    showToast(`Intervention record saved for ${trainee.name}!`);
  };

  const handleAddFollowupNote = (e) => {
    e.preventDefault();
    coordinatorService.addInterventionFollowup(activeInterventionForNote.id, followupNote);
    setInterventions(coordinatorService.getInterventions());
    showToast(`Follow-up activity recorded.`);
    setActiveInterventionForNote(null);
    setFollowupNote('');
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
          <span className="coord-banner-subtitle">MODULE 15 & 16 • AT-RISK IDENTIFICATION & INTERVENTIONS</span>
          <h1 className="coord-banner-title">At-Risk Diagnostic & Remedial Interventions</h1>
          <p className="coord-banner-desc">
            Automated at-risk flagging (attendance, overdue assignments, diagnostic scores) with formal remedial tracking.
          </p>
        </div>
        <div className="coord-banner-right">
          <button className="coord-banner-btn primary" onClick={() => handleOpenCreate()}>
            <Icon name="plus" style={{ width: '16px', height: '16px' }} />
            <span>Log New Intervention</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="coord-tabs">
        <button
          className={`coord-tab-btn ${activeTab === 'interventions' ? 'active' : ''}`}
          onClick={() => setActiveTab('interventions')}
        >
          <Icon name="clipboard-check" style={{ width: '16px', height: '16px' }} />
          <span>Remedial Interventions Tracking ({interventions.length})</span>
        </button>
        <button
          className={`coord-tab-btn ${activeTab === 'at-risk-list' ? 'active' : ''}`}
          onClick={() => setActiveTab('at-risk-list')}
        >
          <Icon name="alert-triangle" style={{ width: '16px', height: '16px' }} />
          <span>Automated At-Risk Watchlist ({atRiskTrainees.length} Flagged)</span>
        </button>
      </div>

      {activeTab === 'interventions' && (
        <div className="coord-card">
          <div className="coord-card-header">
            <h2 className="coord-card-title">
              <Icon name="shield" className="coord-card-title-icon" />
              <span>Active Intervention Records</span>
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {interventions.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  border: item.status === 'Resolved' ? '1px solid #bbf7d0' : '1px solid #fed7aa',
                  background: item.status === 'Resolved' ? '#f0fdf4' : '#fffbf5',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                        {item.traineeName}
                      </span>
                      <span className="coord-badge purple">{item.id}</span>
                      <span className="coord-badge red">{item.conditionTag}</span>
                      <span className={`coord-badge ${item.status === 'Resolved' ? 'green' : 'orange'}`}>
                        {item.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      Batch: <strong>{item.batchName}</strong> • Next Follow-Up Date: <strong style={{ color: '#0061fe' }}>{item.followUpDate}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="coord-btn secondary coord-btn-sm"
                      onClick={() => setActiveInterventionForNote(item)}
                    >
                      <Icon name="plus" style={{ width: '12px', height: '12px' }} />
                      <span>Add Follow-up Note</span>
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginTop: '14px' }}>
                  <div style={{ padding: '12px 14px', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                    <strong style={{ color: '#0f172a' }}>Action Taken / Remedial Plan:</strong>
                    <div style={{ color: '#334155', marginTop: '4px' }}>{item.actionTaken}</div>
                  </div>

                  <div style={{ padding: '12px 14px', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                    <strong style={{ color: '#0f172a' }}>Target Outcome / Observation:</strong>
                    <div style={{ color: '#334155', marginTop: '4px' }}>{item.outcome || 'Pending verification on follow-up date.'}</div>
                  </div>
                </div>

                {/* Follow-up Timeline History */}
                {item.history && item.history.length > 0 && (
                  <div style={{ marginTop: '14px', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Follow-up Activity Timeline
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {item.history.map((h, i) => (
                        <div key={i} style={{ fontSize: '12px', color: '#475569', display: 'flex', gap: '8px' }}>
                          <span style={{ fontWeight: 700, color: '#0061fe' }}>{h.date}:</span>
                          <span>{h.note}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'at-risk-list' && (
        <div className="coord-card">
          <div className="coord-card-header">
            <h2 className="coord-card-title">
              <Icon name="alert-triangle" className="coord-card-title-icon" style={{ color: '#dc2626' }} />
              <span>Automated Rule-Based At-Risk Flagging Engine</span>
            </h2>
          </div>

          <div className="coord-table-wrapper">
            <table className="coord-table">
              <thead>
                <tr>
                  <th>Trainee Details</th>
                  <th>Batch</th>
                  <th>Attendance %</th>
                  <th>Progress %</th>
                  <th>Avg Assessment</th>
                  <th>Triggered Risk Conditions</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {atRiskTrainees.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{t.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{t.employeeId} • {t.college}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{t.batchName?.split('(')[0]}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: '#b91c1c' }}>{t.attendance}%</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: t.progress < 55 ? '#ea580c' : '#0f172a' }}>
                        {t.progress}%
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: t.avgAssessmentScore < 60 ? '#b91c1c' : '#0f172a' }}>
                        {t.avgAssessmentScore}%
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {t.atRiskReasons?.map((r, i) => (
                          <span key={i} className="coord-badge red" style={{ fontSize: '10px' }}>
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <button
                        className="coord-btn primary coord-btn-sm"
                        onClick={() => handleOpenCreate(t)}
                      >
                        <Icon name="plus" style={{ width: '12px', height: '12px' }} />
                        <span>Create Intervention</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT INTERVENTION MODAL */}
      {isModalOpen && (
        <div className="coord-modal-backdrop">
          <div className="coord-modal-card">
            <div className="coord-modal-header">
              <h3 className="coord-modal-title">
                <Icon name="shield" style={{ color: '#0061fe' }} />
                <span>Log Trainee Remedial Intervention Plan</span>
              </h3>
              <button className="coord-modal-close" onClick={() => setIsModalOpen(false)}>
                <Icon name="x" />
              </button>
            </div>
            <form onSubmit={handleSaveIntervention}>
              <div className="coord-modal-body">
                <div className="coord-form-group">
                  <label className="coord-form-label">Trainee Candidate *</label>
                  <select
                    className="coord-form-select"
                    value={formTraineeId}
                    onChange={(e) => setFormTraineeId(e.target.value)}
                  >
                    {atRiskTrainees.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.batchName?.split('(')[0]})</option>
                    ))}
                  </select>
                </div>

                <div className="coord-form-grid">
                  <div className="coord-form-group">
                    <label className="coord-form-label">Primary Risk Condition Tag *</label>
                    <select
                      className="coord-form-select"
                      value={formConditionTag}
                      onChange={(e) => setFormConditionTag(e.target.value)}
                    >
                      <option value="Low Attendance (<75%)">Low Attendance (&lt;75%)</option>
                      <option value="Consecutive Absences (2+ days)">Consecutive Absences (2+ days)</option>
                      <option value="Overdue Assignments">Overdue Assignments</option>
                      <option value="Low Assessment Score (<60%)">Low Assessment Score (&lt;60%)</option>
                      <option value="Negative Trainer Feedback">Negative Trainer Feedback</option>
                    </select>
                  </div>

                  <div className="coord-form-group">
                    <label className="coord-form-label">Follow-up Target Date *</label>
                    <input
                      type="date"
                      required
                      className="coord-form-input"
                      value={formFollowUpDate}
                      onChange={(e) => setFormFollowUpDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="coord-form-group">
                  <label className="coord-form-label">Intervention Reason & Diagnostic Summary *</label>
                  <input
                    type="text"
                    required
                    className="coord-form-input"
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                  />
                </div>

                <div className="coord-form-group">
                  <label className="coord-form-label">Remedial Action Taken *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. 1-on-1 counseling session conducted, mapped to senior peer buddy, makeup lab assigned..."
                    className="coord-form-textarea"
                    value={formActionTaken}
                    onChange={(e) => setFormActionTaken(e.target.value)}
                  />
                </div>

                <div className="coord-form-group">
                  <label className="coord-form-label">Expected Target Outcome / Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="Candidate agreed to complete Day 12 assignment and maintain 90%+ attendance..."
                    className="coord-form-textarea"
                    value={formOutcome}
                    onChange={(e) => setFormOutcome(e.target.value)}
                  />
                </div>
              </div>
              <div className="coord-modal-footer">
                <button type="button" className="coord-btn secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="coord-btn primary">
                  <Icon name="save" />
                  <span>Save Intervention Plan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD FOLLOW-UP NOTE MODAL */}
      {activeInterventionForNote && (
        <div className="coord-modal-backdrop">
          <div className="coord-modal-card">
            <div className="coord-modal-header">
              <h3 className="coord-modal-title">
                <Icon name="plus" style={{ color: '#0061fe' }} />
                <span>Add Follow-up Entry: {activeInterventionForNote.traineeName}</span>
              </h3>
              <button className="coord-modal-close" onClick={() => setActiveInterventionForNote(null)}>
                <Icon name="x" />
              </button>
            </div>
            <form onSubmit={handleAddFollowupNote}>
              <div className="coord-modal-body">
                <div className="coord-form-group">
                  <label className="coord-form-label">Follow-up Note / Observation *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Record latest progress update, attendance checks, or score improvements..."
                    className="coord-form-textarea"
                    value={followupNote}
                    onChange={(e) => setFollowupNote(e.target.value)}
                  />
                </div>
              </div>
              <div className="coord-modal-footer">
                <button type="button" className="coord-btn secondary" onClick={() => setActiveInterventionForNote(null)}>
                  Cancel
                </button>
                <button type="submit" className="coord-btn primary">
                  <Icon name="check" />
                  <span>Save Timeline Note</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
