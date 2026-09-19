import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import coordinatorService from '../../services/coordinatorService';
import Icon from '../../components/Icon';
import NotificationBell from '../../components/NotificationBell';
import ThemeToggle from '../../components/ThemeToggle';
import hexawareLogo from '../../assets/HEXAWARE logo.png';

export default function CoordinatorDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [metrics, setMetrics] = useState(null);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchDetail, setBatchDetail] = useState(null);

  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [issueStatus, setIssueStatus] = useState('IN_PROGRESS');

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const loggedInUserStr = localStorage.getItem('user');
  const loggedInUser = loggedInUserStr ? JSON.parse(loggedInUserStr) : { name: 'Batch Coordinator', email: 'coordinator@hexaware.com' };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await coordinatorService.getDashboardMetrics();
      setMetrics(data);
      setBatches(data.batches || []);
      const issuesData = await coordinatorService.getCoordinatorIssues();
      setIssues(issuesData || []);
    } catch (err) {
      console.error('Failed to load coordinator telemetry:', err);
      setError(err.response?.data?.detail || 'Failed to load coordinator data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSelectBatch = async (batchId) => {
    try {
      setLoading(true);
      const detail = await coordinatorService.getBatchDetail(batchId);
      setBatchDetail(detail);
      setSelectedBatch(batchId);
      setActiveTab('batch-detail');
    } catch (err) {
      console.error('Failed to load batch detail:', err);
      setError('Unable to load batch detail.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateIssue = async (e) => {
    e.preventDefault();
    if (!selectedIssue) return;

    try {
      setActionLoading(true);
      await coordinatorService.updateCoordinatorIssue(
        selectedIssue.issue_id,
        issueStatus,
        responseNotes,
        false
      );
      setSuccessMsg(`Issue ${selectedIssue.issue_id} updated successfully to ${issueStatus}!`);
      setSelectedIssue(null);
      setResponseNotes('');
      loadDashboardData();
    } catch (err) {
      console.error('Error updating issue:', err);
      setError(err.response?.data?.detail || 'Failed to update issue.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalateIssue = async (issue) => {
    try {
      setActionLoading(true);
      await coordinatorService.updateCoordinatorIssue(
        issue.issue_id,
        issue.status,
        'Escalated to System Administration by Batch Coordinator.',
        true
      );
      setSuccessMsg(`Issue ${issue.issue_id} escalated to Admin.`);
      loadDashboardData();
    } catch (err) {
      console.error('Error escalating issue:', err);
      setError('Failed to escalate issue.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('logged_in_user_id');
    navigate('/login', { replace: true });
  };

  const getStatusBadge = (status) => {
    switch ((status || '').toUpperCase()) {
      case 'OPEN':
        return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: 'OPEN' };
      case 'IN_PROGRESS':
        return { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa', label: 'IN PROGRESS' };
      case 'RESOLVED':
        return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', label: 'RESOLVED' };
      case 'CLOSED':
        return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0', label: 'CLOSED' };
      default:
        return { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1', label: status };
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main, #f8fafc)' }}>
      {/* Sidebar */}
      <aside className="sidebar" style={{ width: '260px', borderRight: '1px solid var(--border-color, #e2e8f0)' }}>
        <div className="sidebar-header" style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={hexawareLogo} alt="Hexaware" className="sidebar-brand-logo" style={{ height: '32px' }} />
          <h1 className="logo" style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Coordinator Portal</h1>
        </div>

        <div className="user-profile-card" style={{ padding: '16px 20px', marginBottom: '16px', backgroundColor: 'var(--card-bg, #ffffff)', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', margin: '0 16px 20px' }}>
          <div className="profile-info">
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>BATCH COORDINATOR</span>
            <div className="user-name" style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-dark, #0f172a)' }}>{loggedInUser.name || 'Batch Coordinator'}</div>
            <div className="user-email" style={{ fontSize: '0.8rem', color: 'var(--text-medium, #64748b)' }}>{loggedInUser.email}</div>
          </div>
        </div>

        <nav className="nav-menu" style={{ padding: '0 16px' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>
              <button
                type="button"
                className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', backgroundColor: activeTab === 'dashboard' ? '#eff6ff' : 'transparent', color: activeTab === 'dashboard' ? '#2563eb' : 'var(--text-dark, #0f172a)' }}
              >
                <Icon name="home" />
                <span>Dashboard Overview</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`nav-item ${activeTab === 'batches' || activeTab === 'batch-detail' ? 'active' : ''}`}
                onClick={() => setActiveTab('batches')}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', backgroundColor: activeTab === 'batches' || activeTab === 'batch-detail' ? '#eff6ff' : 'transparent', color: activeTab === 'batches' || activeTab === 'batch-detail' ? '#2563eb' : 'var(--text-dark, #0f172a)' }}
              >
                <Icon name="layers" />
                <span>Assigned Batches</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`nav-item ${activeTab === 'issues' ? 'active' : ''}`}
                onClick={() => setActiveTab('issues')}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', backgroundColor: activeTab === 'issues' ? '#eff6ff' : 'transparent', color: activeTab === 'issues' ? '#2563eb' : 'var(--text-dark, #0f172a)' }}
              >
                <Icon name="help-circle" />
                <span>Pending Trainee Issues</span>
                {issues.filter(i => i.status === 'OPEN').length > 0 && (
                  <span style={{ marginLeft: 'auto', backgroundColor: '#ef4444', color: '#fff', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 800 }}>
                    {issues.filter(i => i.status === 'OPEN').length}
                  </span>
                )}
              </button>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer" style={{ padding: '20px 16px', marginTop: 'auto' }}>
          <ThemeToggle className="theme-toggle-sidebar" />
          <button type="button" className="nav-item logout-btn" onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', border: '1px solid #fee2e2', backgroundColor: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', marginTop: '12px' }}>
            <Icon name="log-out" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dark, #0f172a)' }}>
              Batch Coordinator Workspace
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-medium, #64748b)' }}>
              Real-time telemetry, trainee issue resolution, and batch monitoring.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <NotificationBell />
          </div>
        </div>

        {error && (
          <div style={{ padding: '16px 20px', borderRadius: '12px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', marginBottom: '24px', fontWeight: 600 }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{ padding: '16px 20px', borderRadius: '12px', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #86efac', marginBottom: '24px', fontWeight: 700 }}>
            {successMsg}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-medium, #64748b)', fontSize: '1.1rem' }}>
            Synchronizing database metrics...
          </div>
        ) : (
          <>
            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {/* Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                  <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Assigned Batches</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#2563eb', marginTop: '6px' }}>{metrics?.assigned_batches_count || 0}</div>
                  </div>
                  <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Active Trainees</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981', marginTop: '6px' }}>{metrics?.active_trainees_count || 0} / {metrics?.total_trainees_count || 0}</div>
                  </div>
                  <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Pending Issues</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b', marginTop: '6px' }}>{metrics?.pending_issues_count || 0}</div>
                  </div>
                </div>

                {/* Assigned Batches Summary Cards */}
                <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark, #0f172a)' }}>My Assigned Batches</h3>
                  {batches.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No batches currently assigned to you.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                      {batches.map((b) => (
                        <div key={b.id} style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color, #cbd5e1)', backgroundColor: 'var(--bg-main, #f8fafc)' }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 800, color: '#2563eb' }}>{b.name}</h4>
                          <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
                            <div><strong>Active Trainees:</strong> {b.active_trainees}</div>
                            <div><strong>Max Capacity:</strong> {b.max_strength}</div>
                            <div><strong>Status:</strong> {b.status}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSelectBatch(b.id)}
                            style={{ width: '100%', padding: '8px 16px', borderRadius: '8px', backgroundColor: '#2563eb', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Manage Batch →
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* BATCHES LIST TAB */}
            {activeTab === 'batches' && (
              <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark, #0f172a)' }}>Assigned Batches List</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '14px 18px', fontWeight: 700 }}>Batch Name</th>
                        <th style={{ padding: '14px 18px', fontWeight: 700 }}>Active Trainees</th>
                        <th style={{ padding: '14px 18px', fontWeight: 700 }}>Max Capacity</th>
                        <th style={{ padding: '14px 18px', fontWeight: 700 }}>Status</th>
                        <th style={{ padding: '14px 18px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batches.map((b) => (
                        <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '14px 18px', fontWeight: 800, color: '#2563eb' }}>{b.name}</td>
                          <td style={{ padding: '14px 18px' }}>{b.active_trainees}</td>
                          <td style={{ padding: '14px 18px' }}>{b.max_strength}</td>
                          <td style={{ padding: '14px 18px' }}>{b.status}</td>
                          <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => handleSelectBatch(b.id)}
                              style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', fontWeight: 700, cursor: 'pointer' }}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* BATCH DETAIL TAB */}
            {activeTab === 'batch-detail' && batchDetail && (
              <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2563eb' }}>BATCH MANAGEMENT</span>
                    <h3 style={{ margin: '2px 0 0 0', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark, #0f172a)' }}>{batchDetail.name}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('batches')}
                    style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', fontWeight: 700, cursor: 'pointer' }}
                  >
                    ← Back to Batches
                  </button>
                </div>

                <h4 style={{ margin: '20px 0 12px 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark, #0f172a)' }}>Enrolled Trainees ({batchDetail.trainees_count})</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 700 }}>Employee ID</th>
                        <th style={{ padding: '12px 16px', fontWeight: 700 }}>Trainee Name</th>
                        <th style={{ padding: '12px 16px', fontWeight: 700 }}>Email</th>
                        <th style={{ padding: '12px 16px', fontWeight: 700 }}>Joined At</th>
                        <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchDetail.trainees.map((t) => (
                        <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 800, color: '#2563eb' }}>{t.employee_id}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 700 }}>{t.name}</td>
                          <td style={{ padding: '12px 16px', color: '#64748b' }}>{t.email}</td>
                          <td style={{ padding: '12px 16px', color: '#64748b' }}>{t.joined_at ? new Date(t.joined_at).toLocaleDateString() : 'N/A'}</td>
                          <td style={{ padding: '12px 16px' }}><span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#f0fdf4', color: '#166534', fontWeight: 800, fontSize: '0.75rem' }}>{t.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PENDING ISSUES TAB */}
            {activeTab === 'issues' && (
              <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark, #0f172a)' }}>Trainee Issues (Assigned Batches)</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '14px 16px', fontWeight: 700 }}>Issue ID</th>
                        <th style={{ padding: '14px 16px', fontWeight: 700 }}>Trainee</th>
                        <th style={{ padding: '14px 16px', fontWeight: 700 }}>Batch</th>
                        <th style={{ padding: '14px 16px', fontWeight: 700 }}>Issue Type</th>
                        <th style={{ padding: '14px 16px', fontWeight: 700 }}>Subject</th>
                        <th style={{ padding: '14px 16px', fontWeight: 700 }}>Status</th>
                        <th style={{ padding: '14px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issues.length === 0 ? (
                        <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No trainee issues reported for your assigned batches.</td></tr>
                      ) : (
                        issues.map((item) => {
                          const badge = getStatusBadge(item.status);
                          return (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '14px 16px', fontWeight: 800, color: '#2563eb' }}>{item.issue_id}</td>
                              <td style={{ padding: '14px 16px', fontWeight: 700 }}>{item.candidate_name}</td>
                              <td style={{ padding: '14px 16px' }}>{item.batch_name}</td>
                              <td style={{ padding: '14px 16px' }}>{item.issue_type}</td>
                              <td style={{ padding: '14px 16px', fontWeight: 600 }}>{item.subject}</td>
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, backgroundColor: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                                  {badge.label}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  onClick={() => { setSelectedIssue(item); setResponseNotes(item.admin_response || ''); setIssueStatus(item.status === 'OPEN' ? 'IN_PROGRESS' : item.status); }}
                                  style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#2563eb', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
                                >
                                  Respond / Update
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEscalateIssue(item)}
                                  disabled={actionLoading}
                                  style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
                                >
                                  Escalate to Admin
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
            )}
          </>
        )}

        {/* Issue Response Modal */}
        {selectedIssue && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ width: '100%', maxWidth: '580px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2563eb' }}>{selectedIssue.issue_id}</span>
                  <h3 style={{ margin: '2px 0 0 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{selectedIssue.subject}</h3>
                </div>
                <button type="button" onClick={() => setSelectedIssue(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <Icon name="x" />
                </button>
              </div>

              <form onSubmit={handleUpdateIssue} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>Update Status</label>
                  <select
                    value={issueStatus}
                    onChange={(e) => setIssueStatus(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  >
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>Coordinator Response Notes</label>
                  <textarea
                    rows={4}
                    value={responseNotes}
                    onChange={(e) => setResponseNotes(e.target.value)}
                    placeholder="Provide resolution details or instructions for trainee..."
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                  <button type="button" onClick={() => setSelectedIssue(null)} style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: 'transparent', border: '1px solid #cbd5e1', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={actionLoading} style={{ padding: '10px 24px', borderRadius: '8px', backgroundColor: '#2563eb', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                    {actionLoading ? 'Updating...' : 'Save & Notify Trainee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
