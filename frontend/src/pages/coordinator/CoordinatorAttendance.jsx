import React, { useState, useEffect } from 'react';
import Icon from '../../components/Icon';
import coordinatorService from '../../services/coordinatorService';

export default function CoordinatorAttendance() {
  const [selectedDate, setSelectedDate] = useState('2026-09-18');
  const [selectedBatch, setSelectedBatch] = useState('Batch 2026-Alpha (Java FullStack)');
  const [trainees, setTrainees] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('tracker'); // tracker | audit
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  // Correction Modal
  const [correctionTrainee, setCorrectionTrainee] = useState(null);
  const [newStatus, setNewStatus] = useState('Present');
  const [correctionReason, setCorrectionReason] = useState('');

  // Escalation Modal
  const [escalationTrainee, setEscalationTrainee] = useState(null);
  const [escalationLevel, setEscalationLevel] = useState('Level 2 - SPOC & College Warning');
  const [escalationNotes, setEscalationNotes] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const list = await coordinatorService.getTraineesDirectory();
      const logs = coordinatorService.getAttendanceAuditLogs();
      setTrainees(list);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Error loading attendance data:', err);
    }
  };

  // Mock status per trainee for selected date
  const getDailyStatus = (t) => {
    if (t.id === 1) return { status: 'Absent', consecutive: 3, time: '-' };
    if (t.id === 2) return { status: 'Late', consecutive: 0, time: '09:22 AM' };
    if (t.id === 5) return { status: 'Absent', consecutive: 2, time: '-' };
    return { status: 'Present', consecutive: 0, time: '08:55 AM' };
  };

  const handleOpenCorrection = (t, currentStatus) => {
    setCorrectionTrainee({ ...t, currentStatus });
    setNewStatus('Present');
    setCorrectionReason('');
  };

  const handleSaveCorrection = (e) => {
    e.preventDefault();
    if (!correctionReason) {
      alert('A valid reason is required for authorized audit compliance.');
      return;
    }

    coordinatorService.recordAttendanceCorrection({
      date: selectedDate,
      traineeId: correctionTrainee.id,
      traineeName: correctionTrainee.name,
      batchName: selectedBatch,
      oldStatus: correctionTrainee.currentStatus,
      newStatus: newStatus,
      reason: correctionReason,
      authorizedBy: 'Batch Coordinator (SPOC)'
    });

    setAuditLogs(coordinatorService.getAttendanceAuditLogs());
    showToast(`Attendance updated for ${correctionTrainee.name} to "${newStatus}". Audit log entry saved.`);
    setCorrectionTrainee(null);
  };

  const handleOpenEscalation = (t) => {
    setEscalationTrainee(t);
    setEscalationNotes(`Trainee has accumulated consecutive absences without pre-approved leave. Formal warning required.`);
  };

  const handleTriggerEscalation = (e) => {
    e.preventDefault();
    showToast(`Attendance escalation workflow triggered for ${escalationTrainee.name} (${escalationLevel}). Email alerts dispatched.`);
    setEscalationTrainee(null);
  };

  const filtered = trainees.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <span className="coord-banner-subtitle">MODULE 4 • ATTENDANCE MANAGEMENT</span>
          <h1 className="coord-banner-title">Attendance Tracking & Escalation Workflow</h1>
          <p className="coord-banner-desc">
            Track daily session attendance, monitor consecutive absences, trigger escalation warnings, and log authorized audit corrections.
          </p>
        </div>
        <div className="coord-banner-right">
          <button
            className="coord-banner-btn primary"
            onClick={() => showToast(`Generating Batch Attendance Report for ${selectedDate} (Excel/PDF)...`)}
          >
            <Icon name="download" style={{ width: '16px', height: '16px' }} />
            <span>Download Daily Report</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="coord-tabs">
        <button
          className={`coord-tab-btn ${activeTab === 'tracker' ? 'active' : ''}`}
          onClick={() => setActiveTab('tracker')}
        >
          <Icon name="clock" style={{ width: '16px', height: '16px' }} />
          <span>Session Attendance Tracker</span>
        </button>
        <button
          className={`coord-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <Icon name="shield" style={{ width: '16px', height: '16px' }} />
          <span>Authorized Correction Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {activeTab === 'tracker' && (
        <>
          {/* Controls & Filter Bar */}
          <div className="coord-toolbar">
            <div className="coord-search-box">
              <Icon name="search" style={{ color: '#94a3b8', width: '16px', height: '16px' }} />
              <input
                type="text"
                placeholder="Search trainee name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="coord-filter-group">
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Date:</label>
              <input
                type="date"
                className="coord-select"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />

              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Batch:</label>
              <select
                className="coord-select"
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
              >
                <option value="Batch 2026-Alpha (Java FullStack)">Batch 2026-Alpha (Java FullStack)</option>
                <option value="Batch 2026-Beta (Cloud & DevOps)">Batch 2026-Beta (Cloud & DevOps)</option>
              </select>
            </div>
          </div>

          {/* Attendance Tracker Table */}
          <div className="coord-card">
            <div className="coord-card-header">
              <h2 className="coord-card-title">
                <Icon name="calendar" className="coord-card-title-icon" />
                <span>Attendance Log for {selectedDate} • {selectedBatch}</span>
              </h2>
            </div>

            <div className="coord-table-wrapper">
              <table className="coord-table">
                <thead>
                  <tr>
                    <th>Trainee Details</th>
                    <th>College</th>
                    <th>Check-in Time</th>
                    <th>Overall Attendance</th>
                    <th>Consecutive Absences</th>
                    <th>Status ({selectedDate})</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => {
                    const daily = getDailyStatus(t);
                    return (
                      <tr key={t.id}>
                        <td>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{t.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{t.employeeId} • {t.email}</div>
                        </td>
                        <td>{t.college}</td>
                        <td style={{ fontWeight: 600, color: '#475569' }}>{daily.time}</td>
                        <td>
                          <span style={{ fontWeight: 800, color: t.attendance >= 80 ? '#15803d' : '#b91c1c' }}>
                            {t.attendance}%
                          </span>
                        </td>
                        <td>
                          {daily.consecutive >= 2 ? (
                            <span className="coord-badge red" style={{ fontSize: '11px' }}>
                              ⚠️ {daily.consecutive} Days Absent
                            </span>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#64748b' }}>None</span>
                          )}
                        </td>
                        <td>
                          <span className={`coord-badge ${daily.status === 'Present' ? 'green' : daily.status === 'Late' ? 'yellow' : 'red'}`}>
                            {daily.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="coord-btn secondary coord-btn-sm"
                              onClick={() => handleOpenCorrection(t, daily.status)}
                            >
                              <Icon name="edit-3" style={{ width: '12px', height: '12px' }} />
                              <span>Correction</span>
                            </button>
                            {daily.consecutive >= 2 && (
                              <button
                                className="coord-btn danger coord-btn-sm"
                                onClick={() => handleOpenEscalation(t)}
                              >
                                <Icon name="alert-triangle" style={{ width: '12px', height: '12px' }} />
                                <span>Escalate</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'audit' && (
        <div className="coord-card">
          <div className="coord-card-header">
            <h2 className="coord-card-title">
              <Icon name="shield" className="coord-card-title-icon" />
              <span>Authorized Attendance Modifications Audit Trail ({auditLogs.length})</span>
            </h2>
          </div>

          <div className="coord-table-wrapper">
            <table className="coord-table">
              <thead>
                <tr>
                  <th>Audit ID</th>
                  <th>Session Date</th>
                  <th>Trainee</th>
                  <th>Batch</th>
                  <th>Status Transition</th>
                  <th>Mandatory Justification / Reason</th>
                  <th>Authorized By & Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className="coord-badge purple">{log.id}</span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{log.date}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{log.traineeName}</div>
                    </td>
                    <td>{log.batchName}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <span className="coord-badge red">{log.oldStatus}</span>
                        <span>→</span>
                        <span className="coord-badge green">{log.newStatus}</span>
                      </div>
                    </td>
                    <td style={{ maxWidth: '280px', color: '#334155' }}>{log.reason}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{log.authorizedBy}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{log.timestamp}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ATTENDANCE CORRECTION MODAL WITH AUDIT COMPLIANCE */}
      {correctionTrainee && (
        <div className="coord-modal-backdrop">
          <div className="coord-modal-card">
            <div className="coord-modal-header">
              <h3 className="coord-modal-title">
                <Icon name="edit-3" style={{ color: '#0061fe' }} />
                <span>Authorized Attendance Correction</span>
              </h3>
              <button className="coord-modal-close" onClick={() => setCorrectionTrainee(null)}>
                <Icon name="x" />
              </button>
            </div>
            <form onSubmit={handleSaveCorrection}>
              <div className="coord-modal-body">
                <div className="coord-alert info">
                  <Icon name="info" style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                  <span>
                    Compliance Notice: All modifications require a justified reason and will be permanently recorded in the system audit log.
                  </span>
                </div>

                <div className="coord-form-grid">
                  <div className="coord-form-group">
                    <label className="coord-form-label">Trainee</label>
                    <input
                      type="text"
                      disabled
                      className="coord-form-input"
                      value={correctionTrainee.name}
                      style={{ backgroundColor: '#f8fafc' }}
                    />
                  </div>
                  <div className="coord-form-group">
                    <label className="coord-form-label">Current Status</label>
                    <input
                      type="text"
                      disabled
                      className="coord-form-input"
                      value={correctionTrainee.currentStatus}
                      style={{ backgroundColor: '#f8fafc' }}
                    />
                  </div>
                </div>

                <div className="coord-form-group">
                  <label className="coord-form-label">New Corrected Status *</label>
                  <select
                    className="coord-form-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="Present">Present (Full Session)</option>
                    <option value="Present (Late Marked)">Present (Late Marked)</option>
                    <option value="Excused Leave">Excused Leave (College Approved)</option>
                    <option value="Medical Leave">Medical Leave (Doctor Note Verified)</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>

                <div className="coord-form-group">
                  <label className="coord-form-label">Mandatory Correction Reason & Remarks *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide specific reason for adjustment (e.g. Lab connectivity issue confirmed by College SPOC)..."
                    className="coord-form-textarea"
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="coord-modal-footer">
                <button type="button" className="coord-btn secondary" onClick={() => setCorrectionTrainee(null)}>
                  Cancel
                </button>
                <button type="submit" className="coord-btn primary">
                  <Icon name="check" />
                  <span>Save Correction & Log Audit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ESCALATION WORKFLOW MODAL */}
      {escalationTrainee && (
        <div className="coord-modal-backdrop">
          <div className="coord-modal-card">
            <div className="coord-modal-header">
              <h3 className="coord-modal-title">
                <Icon name="alert-triangle" style={{ color: '#dc2626' }} />
                <span>Trigger Attendance Escalation: {escalationTrainee.name}</span>
              </h3>
              <button className="coord-modal-close" onClick={() => setEscalationTrainee(null)}>
                <Icon name="x" />
              </button>
            </div>
            <form onSubmit={handleTriggerEscalation}>
              <div className="coord-modal-body">
                <div className="coord-alert danger">
                  <Icon name="alert-circle" style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                  <span>
                    Initiating formal escalation workflow due to consecutive absences. Notifications will be dispatched to candidate and college SPOC.
                  </span>
                </div>

                <div className="coord-form-group">
                  <label className="coord-form-label">Escalation Tier *</label>
                  <select
                    className="coord-form-select"
                    value={escalationLevel}
                    onChange={(e) => setEscalationLevel(e.target.value)}
                  >
                    <option value="Level 1 - Candidate Reminder">Level 1 - Candidate Attendance Warning</option>
                    <option value="Level 2 - SPOC & College Warning">Level 2 - College Faculty & SPOC Alert</option>
                    <option value="Level 3 - System Admin Escalation">Level 3 - System Admin & Program Head Review</option>
                  </select>
                </div>

                <div className="coord-form-group">
                  <label className="coord-form-label">Escalation Justification & Remarks</label>
                  <textarea
                    required
                    rows={4}
                    className="coord-form-textarea"
                    value={escalationNotes}
                    onChange={(e) => setEscalationNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="coord-modal-footer">
                <button type="button" className="coord-btn secondary" onClick={() => setEscalationTrainee(null)}>
                  Cancel
                </button>
                <button type="submit" className="coord-btn danger">
                  <Icon name="send" />
                  <span>Trigger Escalation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
