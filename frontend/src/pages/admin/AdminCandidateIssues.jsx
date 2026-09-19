import React, { useState, useEffect } from 'react';
import issueService from '../../services/issueService';
import apiClient from '../../services/apiClient';
import Icon from '../../components/Icon';
import NotificationBell from '../../components/NotificationBell';

export default function AdminCandidateIssues() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Issue Management Modal State
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [newStatus, setNewStatus] = useState('OPEN');
  const [adminResponse, setAdminResponse] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState(null);

  // Attendance Escalations State
  const [escalations, setEscalations] = useState([]);
  const [loadingEscalations, setLoadingEscalations] = useState(false);

  // Post Day 3 Admin Action Modal
  const [actionTarget, setActionTarget] = useState(null); // { candidate_id, batch_id, name, employee_id }
  const [actionType, setActionType] = useState('KEEP_ACTIVE');
  const [actionComments, setActionComments] = useState('');
  const [executingAction, setExecutingAction] = useState(false);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await issueService.getAdminIssues({
        status: statusFilter,
        issue_type: typeFilter,
        search: searchQuery,
      });
      setIssues(data || []);
    } catch (err) {
      console.error('Failed to load admin issues:', err);
      setError('Failed to fetch candidate issues.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEscalatedAttendance = async () => {
    try {
      setLoadingEscalations(true);
      // Fetch escalated followup records from attendance followup backend endpoint
      const response = await apiClient.get('/attendance-followup/audit-history');
      // Filter or fetch followup records with ESCALATED or WARNING_SENT
      const allAudit = response.data || [];
      // We can also poll attendance followups
      const escRes = await apiClient.get('/attendance-followup/global-settings');
      setEscalations(allAudit.filter(a => a.event_type?.includes('ESCALATED') || a.event_type?.includes('WARNING') || a.event_type?.includes('ACTION')).slice(0, 10));
    } catch (err) {
      console.warn('Escalated attendance fetch notice:', err);
    } finally {
      setLoadingEscalations(false);
    }
  };

  useEffect(() => {
    fetchIssues();
    fetchEscalatedAttendance();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchIssues();
  };

  const handleOpenManageModal = (issue) => {
    setSelectedIssue(issue);
    setNewStatus(issue.status);
    setAdminResponse(issue.admin_response || '');
    setUpdateMsg(null);
  };

  const handleUpdateIssue = async (e) => {
    e.preventDefault();
    if (!selectedIssue) return;

    try {
      setUpdating(true);
      setUpdateMsg(null);
      await issueService.updateAdminIssue(selectedIssue.issue_id, newStatus, adminResponse);
      setUpdateMsg('Issue updated successfully! Candidate notified.');
      setTimeout(() => {
        setSelectedIssue(null);
        fetchIssues();
      }, 1200);
    } catch (err) {
      console.error('Error updating issue:', err);
      setUpdateMsg('Failed to update issue.');
    } finally {
      setUpdating(false);
    }
  };

  const handleExecuteAction = async (e) => {
    e.preventDefault();
    if (!actionTarget) return;

    try {
      setExecutingAction(true);
      await issueService.executeCandidateAction(
        actionTarget.candidate_id,
        actionTarget.batch_id,
        actionType,
        actionComments
      );
      alert(`Action '${actionType}' executed successfully for candidate.`);
      setActionTarget(null);
      fetchEscalatedAttendance();
    } catch (err) {
      console.error('Error executing admin candidate action:', err);
      alert('Failed to execute admin action.');
    } finally {
      setExecutingAction(false);
    }
  };

  // Stats calculation
  const totalCount = issues.length;
  const openCount = issues.filter(i => i.status === 'OPEN').length;
  const inProgressCount = issues.filter(i => i.status === 'IN_PROGRESS').length;
  const resolvedCount = issues.filter(i => ['RESOLVED', 'CLOSED'].includes(i.status)).length;

  const getStatusStyle = (status) => {
    switch ((status || '').toUpperCase()) {
      case 'OPEN':
        return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
      case 'IN_PROGRESS':
        return { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' };
      case 'RESOLVED':
        return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
      case 'CLOSED':
        return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
      default:
        return { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' };
    }
  };

  return (
    <div className="admin-issues-page" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-dark, #0f172a)' }}>
            Candidate Issue Management & Escalations
          </h2>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-medium, #64748b)' }}>
            Review candidate support tickets, attendance escalations, and administrative actions.
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <NotificationBell />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Issues</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>{totalCount}</div>
        </div>
        <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid #bfdbfe', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>New / Open Issues</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#2563eb', marginTop: '4px' }}>{openCount}</div>
        </div>
        <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid #fed7aa', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>In Progress</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ea580c', marginTop: '4px' }}>{inProgressCount}</div>
        </div>
        <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid #bbf7d0', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>Resolved / Closed</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#16a34a', marginTop: '4px' }}>{resolvedCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ padding: '20px', backgroundColor: 'var(--card-bg, #ffffff)', borderRadius: '14px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Status Filter */}
          <div style={{ minWidth: '160px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>

          {/* Type Filter */}
          <div style={{ minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Issue Type Filter</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            >
              <option value="ALL">All Issue Types</option>
              <option value="Login Issue">Login Issue</option>
              <option value="Account Setup Issue">Account Setup Issue</option>
              <option value="Password Issue">Password Issue</option>
              <option value="MFA / Authentication Issue">MFA / Authentication Issue</option>
              <option value="Course Access Issue">Course Access Issue</option>
              <option value="Assignment Issue">Assignment Issue</option>
              <option value="Assessment Issue">Assessment Issue</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Search Query */}
          <div style={{ flex: 1, minWidth: '240px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Search Issues</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Issue ID, candidate name, employee ID, or subject..."
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            />
          </div>

          <button
            type="submit"
            style={{ marginTop: '18px', padding: '9px 20px', borderRadius: '8px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Filter / Search
          </button>
        </form>
      </div>

      {/* Issues Table */}
      <div style={{ backgroundColor: 'var(--card-bg, #ffffff)', borderRadius: '14px', border: '1px solid var(--border-color, #e2e8f0)', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                <th style={{ padding: '14px 18px', fontWeight: 700 }}>Issue ID</th>
                <th style={{ padding: '14px 18px', fontWeight: 700 }}>Candidate</th>
                <th style={{ padding: '14px 18px', fontWeight: 700 }}>Batch</th>
                <th style={{ padding: '14px 18px', fontWeight: 700 }}>Issue Type</th>
                <th style={{ padding: '14px 18px', fontWeight: 700 }}>Subject</th>
                <th style={{ padding: '14px 18px', fontWeight: 700 }}>Priority</th>
                <th style={{ padding: '14px 18px', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '14px 18px', fontWeight: 700 }}>Raised At</th>
                <th style={{ padding: '14px 18px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                    Loading issues...
                  </td>
                </tr>
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                    No matching candidate issues found.
                  </td>
                </tr>
              ) : (
                issues.map((item) => {
                  const style = getStatusStyle(item.status);
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 800, color: '#2563eb' }}>{item.issue_id}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.candidate_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.employee_id} | {item.candidate_email}</div>
                      </td>
                      <td style={{ padding: '14px 18px', color: '#475569' }}>{item.batch_name}</td>
                      <td style={{ padding: '14px 18px', fontWeight: 600 }}>{item.issue_type}</td>
                      <td style={{ padding: '14px 18px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.subject}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, backgroundColor: item.priority === 'HIGH' ? '#fef2f2' : '#eff6ff', color: item.priority === 'HIGH' ? '#ef4444' : '#2563eb' }}>
                          {item.priority}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, backgroundColor: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', color: '#64748b', fontSize: '0.8rem' }}>
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenManageModal(item)}
                          style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Post Day 3 Escalated Attendance Section (Requirement 6 & 17) */}
      <div style={{ padding: '24px', backgroundColor: 'var(--card-bg, #ffffff)', borderRadius: '16px', border: '1px solid #fca5a5', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Icon name="alert-triangle" style={{ color: '#dc2626', width: '22px', height: '22px' }} />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#991b1b' }}>
              Attendance Escalations & Post Day 3 Admin Actions
            </h3>
            <span style={{ fontSize: '0.85rem', color: '#7f1d1d' }}>
              Candidates absent beyond Day 3 require manual Admin decision (No automatic removal).
            </span>
          </div>
        </div>

        {escalations.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
            No candidate attendance escalations requiring admin action currently.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {escalations.map((item, idx) => (
              <div key={idx} style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#fff5f5', border: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#991b1b' }}>{item.description}</div>
                  <div style={{ fontSize: '0.8rem', color: '#7f1d1d', marginTop: '2px' }}>
                    Candidate ID: {item.candidate_id} | Event: {item.event_type} | Logged: {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActionTarget({ candidate_id: item.candidate_id, batch_id: 1, description: item.description })}
                  style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Take Action
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Issue Manage Modal */}
      {selectedIssue && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '650px',
              backgroundColor: 'var(--card-bg, #ffffff)',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid var(--border-color, #cbd5e1)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2563eb' }}>{selectedIssue.issue_id}</span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  {selectedIssue.subject}
                </h3>
              </div>
              <button type="button" onClick={() => setSelectedIssue(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <Icon name="x" style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleUpdateIssue} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {updateMsg && (
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#166534', fontWeight: 700, fontSize: '0.85rem' }}>
                  {updateMsg}
                </div>
              )}

              {/* Candidate Info Box */}
              <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                <div><strong>Candidate:</strong> {selectedIssue.candidate_name} ({selectedIssue.employee_id})</div>
                <div><strong>Email:</strong> {selectedIssue.candidate_email}</div>
                <div><strong>Batch:</strong> {selectedIssue.batch_name}</div>
                <div><strong>Issue Type:</strong> {selectedIssue.issue_type}</div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Description</label>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                  {selectedIssue.description}
                </div>
              </div>

              {selectedIssue.attachment_url && (
                <div>
                  <a href={`http://localhost:8000/${selectedIssue.attachment_url}`} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'underline' }}>
                    View Uploaded Attachment ↗
                  </a>
                </div>
              )}

              {/* Status Update */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Update Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700 }}
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              {/* Response / Resolution */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Admin Response / Resolution</label>
                <textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  rows={4}
                  placeholder="Provide resolution details or update note for the candidate..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setSelectedIssue(null)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'transparent', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={updating} style={{ padding: '10px 24px', borderRadius: '8px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                  {updating ? 'Saving...' : 'Update & Notify Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Day 3 Admin Action Modal */}
      {actionTarget && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '520px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#991b1b' }}>
              Execute Administrative Action
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>
              Select explicit administrative action for candidate ID: <strong>{actionTarget.candidate_id}</strong>. Candidate will NOT be automatically removed without this decision.
            </p>

            <form onSubmit={handleExecuteAction} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>Admin Action Decision</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700 }}
                >
                  <option value="KEEP_ACTIVE">Keep Candidate Active</option>
                  <option value="CONTACT">Contact Candidate</option>
                  <option value="REMOVE_FROM_BATCH">Remove Candidate from Batch</option>
                  <option value="DEACTIVATE">Deactivate Candidate Account</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>Action Comments / Notes</label>
                <textarea
                  value={actionComments}
                  onChange={(e) => setActionComments(e.target.value)}
                  rows={3}
                  placeholder="Reasoning or notes regarding this decision..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setActionTarget(null)} style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'transparent', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={executingAction} style={{ padding: '10px 22px', borderRadius: '8px', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                  {executingAction ? 'Executing...' : 'Confirm Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
