import React, { useState, useEffect } from 'react';
import Icon from '../../components/Icon';
import coordinatorService from '../../services/coordinatorService';

export default function CoordinatorIssues() {
  const [issues, setIssues] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedIssueForAction, setSelectedIssueForAction] = useState(null);
  const [actionType, setActionType] = useState('update'); // update | escalate
  const [newStatus, setNewStatus] = useState('In Progress');
  const [remarks, setRemarks] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const list = coordinatorService.getIssues();
    setIssues(list);
  };

  const handleOpenAction = (issue, type) => {
    setSelectedIssueForAction(issue);
    setActionType(type);
    setNewStatus(issue.status);
    setRemarks(issue.remarks || '');
  };

  const handleSaveAction = (e) => {
    e.preventDefault();
    if (actionType === 'escalate') {
      coordinatorService.escalateIssueToAdmin(selectedIssueForAction.id, remarks);
      showToast(`Issue #${selectedIssueForAction.id} escalated to System Admin queue.`);
    } else {
      coordinatorService.saveIssue({
        ...selectedIssueForAction,
        status: newStatus,
        remarks: remarks
      });
      showToast(`Issue #${selectedIssueForAction.id} status updated to "${newStatus}".`);
    }

    setIssues(coordinatorService.getIssues());
    setSelectedIssueForAction(null);
  };

  const filtered = issues.filter(i => {
    const matchesSearch = i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.traineeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || i.category === categoryFilter;
    const matchesStat = statusFilter === 'ALL' || i.status === statusFilter;
    return matchesSearch && matchesCat && matchesStat;
  });

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
          <span className="coord-banner-subtitle">MODULE 12 • ISSUE & ESCALATION MANAGEMENT</span>
          <h1 className="coord-banner-title">Candidate Issues & Escalations</h1>
          <p className="coord-banner-desc">
            Handle assessment blocks, attendance disputes, lab issues, and route critical bottlenecks to Admin.
          </p>
        </div>
        <div className="coord-banner-right">
          <button
            className="coord-banner-btn primary"
            onClick={() => showToast('Exporting Issue & Escalation Resolution Summary...')}
          >
            <Icon name="download" style={{ width: '16px', height: '16px' }} />
            <span>Export Issues Log</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="coord-toolbar">
        <div className="coord-search-box">
          <Icon name="search" style={{ color: '#94a3b8', width: '16px', height: '16px' }} />
          <input
            type="text"
            placeholder="Search issue ID, candidate name, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="coord-filter-group">
          <select className="coord-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="ALL">All Categories</option>
            <option value="Assessment">Assessment Issues</option>
            <option value="Training Session">Training Session / Lab</option>
            <option value="Assignment">Assignment Submissions</option>
            <option value="Attendance">Attendance Dispute</option>
          </select>

          <select className="coord-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="Escalated to Admin">Escalated to Admin</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Issues Cards */}
      <div className="coord-card">
        <div className="coord-card-header">
          <h2 className="coord-card-title">
            <Icon name="shield" className="coord-card-title-icon" />
            <span>Tracked Candidate Issues ({filtered.length})</span>
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map((issue) => (
            <div
              key={issue.id}
              style={{
                padding: '20px',
                borderRadius: '16px',
                border: issue.severity === 'Critical' ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                background: issue.severity === 'Critical' ? '#fffafa' : '#ffffff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`coord-badge ${issue.severity === 'Critical' ? 'red' : issue.severity === 'High' ? 'orange' : 'blue'}`}>
                      {issue.category} • {issue.severity} Severity
                    </span>
                    <span className="coord-badge purple">{issue.id}</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Logged: {issue.createdAt}</span>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '8px 0 4px 0' }}>
                    {issue.title}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Reported by: <strong>{issue.traineeName}</strong> ({issue.traineeEmail}) • Batch: <strong>{issue.batchName}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`coord-badge ${issue.status === 'Resolved' ? 'green' : issue.status === 'Escalated to Admin' ? 'purple' : 'orange'}`}>
                    {issue.status}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, margin: '10px 0 0 0' }}>
                {issue.description}
              </p>

              {issue.remarks && (
                <div style={{ marginTop: '10px', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', fontSize: '12px', color: '#475569' }}>
                  <strong>Coordinator Remarks:</strong> {issue.remarks}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
                <button
                  className="coord-btn secondary coord-btn-sm"
                  onClick={() => handleOpenAction(issue, 'update')}
                >
                  <Icon name="edit-3" style={{ width: '12px', height: '12px' }} />
                  <span>Update Status & Remarks</span>
                </button>
                {!issue.escalatedToAdmin && (
                  <button
                    className="coord-btn danger coord-btn-sm"
                    onClick={() => handleOpenAction(issue, 'escalate')}
                  >
                    <Icon name="shield" style={{ width: '12px', height: '12px' }} />
                    <span>Escalate to Admin</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ACTION MODAL */}
      {selectedIssueForAction && (
        <div className="coord-modal-backdrop">
          <div className="coord-modal-card">
            <div className="coord-modal-header">
              <h3 className="coord-modal-title">
                <Icon name="shield" style={{ color: actionType === 'escalate' ? '#dc2626' : '#0061fe' }} />
                <span>{actionType === 'escalate' ? 'Escalate Issue to Admin' : 'Update Candidate Issue'}</span>
              </h3>
              <button className="coord-modal-close" onClick={() => setSelectedIssueForAction(null)}>
                <Icon name="x" />
              </button>
            </div>
            <form onSubmit={handleSaveAction}>
              <div className="coord-modal-body">
                {actionType === 'escalate' ? (
                  <div className="coord-alert danger">
                    <Icon name="alert-triangle" style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                    <span>
                      Escalating will transfer this ticket directly to System Admin and Program Leads for infrastructure/account level resolution.
                    </span>
                  </div>
                ) : (
                  <div className="coord-form-group">
                    <label className="coord-form-label">Workflow Status *</label>
                    <select
                      className="coord-form-select"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                )}

                <div className="coord-form-group">
                  <label className="coord-form-label">
                    {actionType === 'escalate' ? 'Admin Escalation Justification *' : 'Resolution Remarks & Notes *'}
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="coord-form-textarea"
                    placeholder="Document action taken or explanation for escalation..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>
              </div>
              <div className="coord-modal-footer">
                <button type="button" className="coord-btn secondary" onClick={() => setSelectedIssueForAction(null)}>
                  Cancel
                </button>
                <button type="submit" className={`coord-btn ${actionType === 'escalate' ? 'danger' : 'primary'}`}>
                  <Icon name="check" />
                  <span>{actionType === 'escalate' ? 'Confirm Admin Escalation' : 'Save Update'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
