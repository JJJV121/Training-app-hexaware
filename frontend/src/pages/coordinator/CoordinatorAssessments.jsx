import React, { useState, useEffect } from 'react';
import Icon from '../../components/Icon';
import coordinatorService from '../../services/coordinatorService';

export default function CoordinatorAssessments() {
  const [activeTab, setActiveTab] = useState('scheduled'); // scheduled | absences
  const [absenceRequests, setAbsenceRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [makeupDate, setMakeupDate] = useState('2026-09-24');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const reqs = await coordinatorService.getAbsenceRequests();
    setAbsenceRequests(reqs);
  };

  const assessments = [
    {
      id: 1,
      title: 'Module 1: Core Java & Data Structures Diagnostic',
      batch: 'Batch 2026-Alpha (Java FullStack)',
      scheduledDate: '2026-08-20 (Conducted)',
      totalCandidates: 35,
      participatedCount: 35,
      missedCount: 0,
      avgScore: 84,
      passRate: '100%',
      status: 'Completed'
    },
    {
      id: 2,
      title: 'Mid-Term Proctored Coding & Architecture Assessment',
      batch: 'Batch 2026-Alpha (Java FullStack)',
      scheduledDate: '2026-09-18 (Conducted)',
      totalCandidates: 35,
      participatedCount: 33,
      missedCount: 2,
      avgScore: 78,
      passRate: '91%',
      status: 'Evaluation & Makeups in Progress'
    },
    {
      id: 3,
      title: 'Cloud DevOps CI/CD & Terraform Proctored Exam',
      batch: 'Batch 2026-Beta (Cloud & DevOps)',
      scheduledDate: '2026-09-25 10:00 AM',
      totalCandidates: 30,
      participatedCount: 0,
      missedCount: 0,
      avgScore: null,
      passRate: '-',
      status: 'Upcoming'
    }
  ];

  const handleOpenReview = (req) => {
    setSelectedRequest(req);
    setReviewRemarks(`Emergency absence verified with official medical/college documentation. Makeup test authorized.`);
  };

  const handleApproveRequest = async (e) => {
    e.preventDefault();
    const updated = await coordinatorService.updateAbsenceRequest(
      selectedRequest.id,
      `Approved - Makeup Scheduled for ${makeupDate}`,
      reviewRemarks
    );
    setAbsenceRequests(await coordinatorService.getAbsenceRequests());
    showToast(`Emergency absence approved for ${selectedRequest.traineeName}. Makeup scheduled for ${makeupDate}.`);
    setSelectedRequest(null);
  };

  const handleRejectRequest = async () => {
    await coordinatorService.updateAbsenceRequest(
      selectedRequest.id,
      'Rejected - Insufficient Documentation',
      'Documentation not matching institute emergency guidelines.'
    );
    setAbsenceRequests(await coordinatorService.getAbsenceRequests());
    showToast(`Emergency absence rejected for ${selectedRequest.traineeName}.`);
    setSelectedRequest(null);
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
          <span className="coord-banner-subtitle">MODULE 9 • ASSESSMENT MONITORING & ABSENCE PROCESS</span>
          <h1 className="coord-banner-title">Assessment Oversight & Emergency Makeups</h1>
          <p className="coord-banner-desc">
            Monitor proctored tests, evaluate batch participation benchmarks, and process formal candidate emergency absence authorizations.
          </p>
        </div>
        <div className="coord-banner-right">
          <a
            href="#coordinator-announcements"
            className="coord-banner-btn primary"
          >
            <Icon name="megaphone" style={{ width: '16px', height: '16px' }} />
            <span>Send Assessment Reminder</span>
          </a>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="coord-tabs">
        <button
          className={`coord-tab-btn ${activeTab === 'scheduled' ? 'active' : ''}`}
          onClick={() => setActiveTab('scheduled')}
        >
          <Icon name="clipboard-check" style={{ width: '16px', height: '16px' }} />
          <span>Batch Assessments & Participation ({assessments.length})</span>
        </button>
        <button
          className={`coord-tab-btn ${activeTab === 'absences' ? 'active' : ''}`}
          onClick={() => setActiveTab('absences')}
        >
          <Icon name="alert-circle" style={{ width: '16px', height: '16px' }} />
          <span>Emergency Absence Requests ({absenceRequests.filter(r => r.status.includes('Pending')).length} Pending)</span>
        </button>
      </div>

      {activeTab === 'scheduled' && (
        <div className="coord-card">
          <div className="coord-card-header">
            <h2 className="coord-card-title">
              <Icon name="award" className="coord-card-title-icon" />
              <span>Assessment Participation & Performance Records</span>
            </h2>
          </div>

          <div className="coord-table-wrapper">
            <table className="coord-table">
              <thead>
                <tr>
                  <th>Assessment Title</th>
                  <th>Batch</th>
                  <th>Scheduled Schedule</th>
                  <th>Participation Rate</th>
                  <th>Missed Tests</th>
                  <th>Average Score</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a) => {
                  const partPct = a.participatedCount > 0 ? Math.round((a.participatedCount / a.totalCandidates) * 100) : 0;
                  return (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{a.title}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Proctored Evaluation</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{a.batch?.split('(')[0]}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#334155' }}>{a.scheduledDate}</span>
                      </td>
                      <td>
                        {a.status !== 'Upcoming' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 800, color: '#0f172a' }}>{a.participatedCount} / {a.totalCandidates}</span>
                            <span className={`coord-badge ${partPct >= 95 ? 'green' : 'orange'}`} style={{ fontSize: '10px' }}>
                              {partPct}%
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#64748b' }}>Scheduled</span>
                        )}
                      </td>
                      <td>
                        {a.missedCount > 0 ? (
                          <span className="coord-badge red" style={{ fontSize: '10px' }}>
                            ⚠️ {a.missedCount} Missed
                          </span>
                        ) : (
                          <span className="coord-badge green" style={{ fontSize: '10px' }}>0 Missed</span>
                        )}
                      </td>
                      <td>
                        {a.avgScore !== null ? (
                          <span style={{ fontWeight: 800, color: '#0f172a' }}>{a.avgScore}% (Pass: {a.passRate})</span>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#64748b' }}>-</span>
                        )}
                      </td>
                      <td>
                        <span className={`coord-badge ${a.status === 'Completed' ? 'green' : a.status === 'Upcoming' ? 'blue' : 'orange'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td>
                        {a.missedCount > 0 ? (
                          <button
                            className="coord-btn danger coord-btn-sm"
                            onClick={() => setActiveTab('absences')}
                          >
                            <span>Review Absences</span>
                          </button>
                        ) : (
                          <button
                            className="coord-btn secondary coord-btn-sm"
                            onClick={() => showToast(`Exporting detailed score metrics for ${a.title}...`)}
                          >
                            <Icon name="download" style={{ width: '12px', height: '12px' }} />
                            <span>Scorebook</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'absences' && (
        <div className="coord-card">
          <div className="coord-card-header">
            <h2 className="coord-card-title">
              <Icon name="alert-triangle" className="coord-card-title-icon" style={{ color: '#ea580c' }} />
              <span>Candidate Emergency Absence Requests & Makeup Approvals</span>
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {absenceRequests.map((req) => (
              <div
                key={req.id}
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  border: req.status.includes('Pending') ? '1px solid #fde68a' : '1px solid #e2e8f0',
                  background: req.status.includes('Pending') ? '#fffdf7' : '#ffffff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                        {req.traineeName}
                      </span>
                      <span className="coord-badge blue">{req.id}</span>
                      <span className={`coord-badge ${req.status.includes('Approved') ? 'green' : req.status.includes('Pending') ? 'orange' : 'red'}`}>
                        {req.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      {req.traineeEmail} • Missed Assessment: <strong>{req.assessmentName}</strong> ({req.scheduledDate})
                    </div>
                  </div>

                  {req.status.includes('Pending') && (
                    <button
                      className="coord-btn primary coord-btn-sm"
                      onClick={() => handleOpenReview(req)}
                    >
                      <Icon name="check-square" style={{ width: '13px', height: '13px' }} />
                      <span>Process Absence & Makeup</span>
                    </button>
                  )}
                </div>

                <div style={{ marginTop: '14px', padding: '12px 14px', background: '#f8fafc', borderRadius: '10px', fontSize: '13px', color: '#334155' }}>
                  <strong>Candidate Stated Reason:</strong> {req.reason}
                  <div style={{ fontSize: '11px', color: req.doctorNoteProvided ? '#15803d' : '#ea580c', marginTop: '4px', fontWeight: 700 }}>
                    {req.doctorNoteProvided ? '✓ Official Verification Document Attached' : '⚠️ No supporting file attached (requires college confirmation)'}
                  </div>
                </div>

                {req.coordinatorRemarks && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#475569' }}>
                    <strong>Coordinator Resolution:</strong> {req.coordinatorRemarks}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABSENCE REVIEW & MAKEUP SCHEDULING MODAL */}
      {selectedRequest && (
        <div className="coord-modal-backdrop">
          <div className="coord-modal-card">
            <div className="coord-modal-header">
              <h3 className="coord-modal-title">
                <Icon name="clipboard-check" style={{ color: '#0061fe' }} />
                <span>Authorize Emergency Absence: {selectedRequest.traineeName}</span>
              </h3>
              <button className="coord-modal-close" onClick={() => setSelectedRequest(null)}>
                <Icon name="x" />
              </button>
            </div>
            <form onSubmit={handleApproveRequest}>
              <div className="coord-modal-body">
                <div className="coord-alert info">
                  <Icon name="info" style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                  <span>
                    Emergency absence approvals unlock a secure re-attempt token for the designated makeup date without penalties.
                  </span>
                </div>

                <div className="coord-form-group">
                  <label className="coord-form-label">Authorized Makeup Exam Date *</label>
                  <input
                    type="date"
                    required
                    className="coord-form-input"
                    value={makeupDate}
                    onChange={(e) => setMakeupDate(e.target.value)}
                  />
                </div>

                <div className="coord-form-group">
                  <label className="coord-form-label">Coordinator Remarks & Audit Justification *</label>
                  <textarea
                    required
                    rows={4}
                    className="coord-form-textarea"
                    value={reviewRemarks}
                    onChange={(e) => setReviewRemarks(e.target.value)}
                  />
                </div>
              </div>
              <div className="coord-modal-footer">
                <button type="button" className="coord-btn danger" onClick={handleRejectRequest}>
                  Reject Request
                </button>
                <button type="submit" className="coord-btn success">
                  <Icon name="check" />
                  <span>Approve & Schedule Makeup</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
