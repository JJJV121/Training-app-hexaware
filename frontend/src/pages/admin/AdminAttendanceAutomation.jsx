import React, { useState, useEffect } from 'react';
import Icon from '../../components/Icon';

export default function AdminAttendanceAutomation() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('cases'); // 'cases', 'candidates', 'workflow'
  const [actionMessage, setActionMessage] = useState('');
  const [selectedCaseModal, setSelectedCaseModal] = useState(null);
  const [runningScheduler, setRunningScheduler] = useState(false);

  const fetchCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      let url = '/api/attendance-followup/admin/cases?';
      if (selectedBatch) url += `batch_id=${selectedBatch}&`;
      if (selectedStage) url += `stage=${selectedStage}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch attendance automation data');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [selectedBatch, selectedStage]);

  const handleGlobalToggle = async (currentStatus) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const res = await fetch('/api/attendance-followup/admin/global-toggle', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ enabled: !currentStatus })
      });
      if (res.ok) {
        setActionMessage(`Global automation set to ${!currentStatus ? 'ENABLED (ACTIVE)' : 'DISABLED (PAUSED)'}`);
        setTimeout(() => setActionMessage(''), 3500);
        fetchCases();
      }
    } catch (err) {
      alert('Error updating global toggle: ' + err.message);
    }
  };

  const handleCandidateToggle = async (candidateId, currentStatus) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const res = await fetch(`/api/attendance-followup/admin/candidate-eligibility/${candidateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ enabled: !currentStatus })
      });
      if (res.ok) {
        setActionMessage(`Candidate eligibility updated successfully.`);
        setTimeout(() => setActionMessage(''), 3500);
        fetchCases();
      }
    } catch (err) {
      alert('Error updating candidate eligibility: ' + err.message);
    }
  };

  const handleTriggerScheduler = async () => {
    setRunningScheduler(true);
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const res = await fetch('/api/attendance-followup/admin/trigger-scheduler', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setActionMessage(`Scheduler Engine Executed: Processed ${json.processed_candidates} candidates safely.`);
        setTimeout(() => setActionMessage(''), 4000);
        fetchCases();
      }
    } catch (err) {
      alert('Error triggering scheduler: ' + err.message);
    } finally {
      setRunningScheduler(false);
    }
  };

  const getStageBadgeInfo = (stage) => {
    switch (stage) {
      case 'REMINDER_1_SENT':
        return { label: 'Day 1: Reminder 1', bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' };
      case 'REMINDER_2_SENT':
        return { label: 'Day 2: Reminder 2', bg: '#ffedd5', color: '#c2410c', border: '#fed7aa' };
      case 'WARNING_SENT':
        return { label: 'Day 3: Warning Sent', bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' };
      case 'REASON_SUBMITTED':
        return { label: 'Reason Submitted', bg: '#f3e8ff', color: '#7e22ce', border: '#e9d5ff' };
      case 'REASON_APPROVED':
        return { label: 'Reason Approved', bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' };
      case 'REASON_REJECTED':
        return { label: 'Reason Rejected', bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
      case 'DISCONTINUED':
        return { label: 'Day 5: Discontinued', bg: '#7f1d1d', color: '#ffffff', border: '#991b1b' };
      case 'CLOSED':
        return { label: 'Cycle Closed (Present)', bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
      default:
        return { label: stage, bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
    }
  };

  if (loading && !data) {
    return <div className="admin-page-loading" style={{ padding: '40px', textAlign: 'center', fontSize: '16px', color: '#64748b' }}>Loading Attendance Automation Dashboard...</div>;
  }

  const globalEnabled = data?.global_automation_enabled ?? true;
  const stageCounts = data?.stage_counts || {};

  return (
    <div className="admin-dashboard-container" style={{ padding: '24px', background: 'var(--bg-primary, #f8fafc)', minHeight: '100vh' }}>
      
      {/* Top Banner Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #0061fe 100%)',
        padding: '28px 32px',
        borderRadius: '16px',
        color: '#ffffff',
        marginBottom: '24px',
        boxShadow: '0 10px 25px -5px rgba(0, 97, 254, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
              <Icon name="clock" size={24} color="#fff" />
            </div>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
              Attendance & Follow-up Automation
            </h1>
          </div>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '14px', maxWidth: '650px', lineHeight: 1.5 }}>
            Automated session absence tracking, multi-stage reminders, SPOC approval workflows, discontinuation enforcement & Campus Recruitment notification.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Master Toggle */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            padding: '8px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Automation Engine:</span>
            <button
              type="button"
              onClick={() => handleGlobalToggle(globalEnabled)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                border: 'none',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
                background: globalEnabled ? '#22c55e' : '#ef4444',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'transform 0.2s'
              }}
            >
              {globalEnabled ? 'GLOBAL ON' : 'GLOBAL OFF'}
            </button>
          </div>

          <button
            onClick={handleTriggerScheduler}
            disabled={runningScheduler}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              border: 'none',
              background: '#ffffff',
              color: '#0061fe',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
            }}
          >
            <Icon name="refresh-cw" size={16} className={runningScheduler ? 'spin' : ''} />
            <span>{runningScheduler ? 'Processing...' : 'Run Scheduler Engine'}</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div style={{
          padding: '14px 20px',
          background: '#dcfce7',
          color: '#15803d',
          borderRadius: '12px',
          marginBottom: '24px',
          border: '1px solid #bbf7d0',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Icon name="check-circle" size={18} />
          {actionMessage}
        </div>
      )}

      {/* Visual Workflow Stage Process Bar */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="git-commit" size={18} color="#0061fe" />
          Attendance Escalation Workflow Lifecycle
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', textAlign: 'center' }}>
          <div style={{ background: '#f0f9ff', border: '1px dashed #0284c7', padding: '12px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>Day 1</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '4px 0' }}>Reminder 1</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Absence Session 1</div>
          </div>

          <div style={{ background: '#fff7ed', border: '1px dashed #ea580c', padding: '12px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#c2410c', textTransform: 'uppercase' }}>Day 2</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '4px 0' }}>Reminder 2</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Absence Session 2</div>
          </div>

          <div style={{ background: '#fef2f2', border: '1px dashed #dc2626', padding: '12px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase' }}>Day 3</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '4px 0' }}>Warning Email</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Reason Submission Link</div>
          </div>

          <div style={{ background: '#faf5ff', border: '1px dashed #9333ea', padding: '12px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#7e22ce', textTransform: 'uppercase' }}>Day 4</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '4px 0' }}>SPOC Review</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Approve or Reject</div>
          </div>

          <div style={{ background: '#fef2f2', border: '1px solid #991b1b', padding: '12px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase' }}>Day 5</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#991b1b', margin: '4px 0' }}>Discontinuation</div>
            <div style={{ fontSize: '11px', color: '#7f1d1d', fontWeight: 600 }}>CR Team LOI Revocation</div>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Reminder 1', count: stageCounts.REMINDER_1_SENT || 0, color: '#2563eb', bg: '#eff6ff', stage: 'REMINDER_1_SENT' },
          { label: 'Reminder 2', count: stageCounts.REMINDER_2_SENT || 0, color: '#ea580c', bg: '#fff7ed', stage: 'REMINDER_2_SENT' },
          { label: 'Warnings', count: stageCounts.WARNING_SENT || 0, color: '#dc2626', bg: '#fef2f2', stage: 'WARNING_SENT' },
          { label: 'Pending SPOC', count: stageCounts.REASON_SUBMITTED || 0, color: '#7e22ce', bg: '#faf5ff', stage: 'REASON_SUBMITTED' },
          { label: 'Approved', count: stageCounts.REASON_APPROVED || 0, color: '#16a34a', bg: '#f0fdf4', stage: 'REASON_APPROVED' },
          { label: 'Rejected', count: stageCounts.REASON_REJECTED || 0, color: '#475569', bg: '#f8fafc', stage: 'REASON_REJECTED' },
          { label: 'Discontinued', count: stageCounts.DISCONTINUED || 0, color: '#991b1b', bg: '#fef2f2', stage: 'DISCONTINUED' },
        ].map((m) => (
          <div
            key={m.label}
            onClick={() => { setSelectedStage(selectedStage === m.stage ? '' : m.stage); setActiveTab('cases'); }}
            style={{
              background: m.bg,
              padding: '16px',
              borderRadius: '14px',
              border: selectedStage === m.stage ? `2px solid ${m.color}` : '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>{m.label}</span>
            <span style={{ fontSize: '24px', fontWeight: 800, color: m.color }}>{m.count}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px' }}>
        <button
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'cases' ? '3px solid #0061fe' : 'none',
            fontWeight: activeTab === 'cases' ? 800 : 600,
            color: activeTab === 'cases' ? '#0061fe' : '#64748b',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onClick={() => setActiveTab('cases')}
        >
          <Icon name="layers" size={16} />
          Active Follow-up Cases ({data?.cases?.length || 0})
        </button>

        <button
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'candidates' ? '3px solid #0061fe' : 'none',
            fontWeight: activeTab === 'candidates' ? 800 : 600,
            color: activeTab === 'candidates' ? '#0061fe' : '#64748b',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onClick={() => setActiveTab('candidates')}
        >
          <Icon name="shield-check" size={16} />
          Student Protection & Whitelist Settings ({data?.candidates?.length || 0})
        </button>
      </div>

      {/* TAB 1: Follow-up Cases View */}
      {activeTab === 'cases' && (
        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
              <input
                type="text"
                className="search-input"
                placeholder="Search candidate name, ID or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCases()}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 600 }}
            >
              <option value="">All Stages</option>
              <option value="REMINDER_1_SENT">Day 1: Reminder 1</option>
              <option value="REMINDER_2_SENT">Day 2: Reminder 2</option>
              <option value="WARNING_SENT">Day 3: Warning Sent</option>
              <option value="REASON_SUBMITTED">Reason Submitted</option>
              <option value="REASON_APPROVED">Reason Approved</option>
              <option value="REASON_REJECTED">Reason Rejected</option>
              <option value="DISCONTINUED">Day 5: Discontinued</option>
              <option value="CLOSED">Cycle Closed</option>
            </select>

            {(selectedStage || searchQuery) && (
              <button
                onClick={() => { setSelectedStage(''); setSearchQuery(''); fetchCases(); }}
                style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f1f5f9', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Cases Table */}
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '14px', textAlign: 'left' }}>Candidate</th>
                  <th style={{ padding: '14px', textAlign: 'left' }}>Employee ID</th>
                  <th style={{ padding: '14px', textAlign: 'left' }}>Batch & Course</th>
                  <th style={{ padding: '14px', textAlign: 'center' }}>Consecutive Absences</th>
                  <th style={{ padding: '14px', textAlign: 'left' }}>Workflow Stage</th>
                  <th style={{ padding: '14px', textAlign: 'left' }}>Reason / SPOC Status</th>
                  <th style={{ padding: '14px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {data?.cases?.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                      No active follow-up cases found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  data?.cases?.map((c) => {
                    const badge = getStageBadgeInfo(c.current_stage);
                    const isTestCand = ['E_034', 'E_035'].includes(c.employee_id);
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.15s' }}>
                        <td style={{ padding: '14px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{c.candidate_name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{c.candidate_email}</div>
                        </td>

                        <td style={{ padding: '14px' }}>
                          <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontFamily: 'monospace', fontWeight: 700, color: '#334155' }}>
                            {c.employee_id || `ID_${c.candidate_id}`}
                          </span>
                          {isTestCand && (
                            <span style={{ marginLeft: '6px', background: '#dbeafe', color: '#1e40af', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: 800 }}>
                              TEST CANDIDATE
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '14px' }}>
                          <div style={{ fontWeight: 600 }}>{c.batch_name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{c.course_name}</div>
                        </td>

                        <td style={{ padding: '14px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            width: '28px',
                            height: '28px',
                            lineHeight: '28px',
                            borderRadius: '50%',
                            background: c.consecutive_absence_count >= 5 ? '#fef2f2' : c.consecutive_absence_count >= 3 ? '#fff7ed' : '#eff6ff',
                            color: c.consecutive_absence_count >= 5 ? '#991b1b' : c.consecutive_absence_count >= 3 ? '#c2410c' : '#2563eb',
                            fontWeight: 800,
                            fontSize: '14px'
                          }}>
                            {c.consecutive_absence_count}
                          </span>
                        </td>

                        <td style={{ padding: '14px' }}>
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 800,
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`
                          }}>
                            {badge.label}
                          </span>
                        </td>

                        <td style={{ padding: '14px' }}>
                          {c.reason_category ? (
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a' }}>{c.reason_category}</div>
                              {c.spoc_decision && (
                                <div style={{ fontSize: '11px', color: c.spoc_decision === 'APPROVED' ? '#16a34a' : '#dc2626', fontWeight: 800 }}>
                                  SPOC: {c.spoc_decision}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>None</span>
                          )}
                        </td>

                        <td style={{ padding: '14px', textAlign: 'center' }}>
                          <button
                            onClick={() => setSelectedCaseModal(c)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              color: '#0061fe',
                              fontWeight: 700,
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            View Details
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

      {/* TAB 2: Candidate Protection Whitelist View */}
      {activeTab === 'candidates' && (
        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', padding: '18px 24px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #bfdbfe' }}>
            <h4 style={{ margin: '0 0 6px', fontSize: '15px', color: '#1e40af', fontWeight: 800 }}>
              🛡️ Candidate Whitelisting & Current Student Protection System
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#1e3a8a', lineHeight: 1.5 }}>
              By default, all existing students have <code>attendance_followup_enabled = false</code> to ensure current students are completely protected and unaffected by this automation.<br/>
              Only explicitly whitelisted test candidates <strong>E_034</strong> (thirtyfour@example.com) and <strong>E_035</strong> (thirtyfive@example.com) are enabled.
            </p>
          </div>

          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '14px', textAlign: 'left' }}>Candidate Name</th>
                  <th style={{ padding: '14px', textAlign: 'left' }}>Employee ID</th>
                  <th style={{ padding: '14px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '14px', textAlign: 'center' }}>Automation Status</th>
                  <th style={{ padding: '14px', textAlign: 'center' }}>Toggle Action</th>
                </tr>
              </thead>
              <tbody>
                {data?.candidates?.map((cand) => {
                  const isTestCand = ['E_034', 'E_035'].includes(cand.employee_id);
                  return (
                    <tr key={cand.id} style={{ borderBottom: '1px solid #e2e8f0', background: isTestCand ? '#f0f9ff' : 'transparent' }}>
                      <td style={{ padding: '14px', fontWeight: isTestCand ? 800 : 600, color: '#0f172a' }}>
                        {cand.name}
                        {isTestCand && (
                          <span style={{ marginLeft: '10px', background: '#2563eb', color: '#ffffff', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 800 }}>
                            TEST WHITELISTED
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '14px', fontFamily: 'monospace', fontWeight: 700, color: '#334155' }}>
                        {cand.employee_id}
                      </td>

                      <td style={{ padding: '14px', color: '#475569' }}>
                        {cand.email}
                      </td>

                      <td style={{ padding: '14px', textAlign: 'center' }}>
                        <span style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 800,
                          background: cand.attendance_followup_enabled ? '#dcfce7' : '#f1f5f9',
                          color: cand.attendance_followup_enabled ? '#15803d' : '#64748b',
                          border: cand.attendance_followup_enabled ? '1px solid #bbf7d0' : '1px solid #cbd5e1'
                        }}>
                          {cand.attendance_followup_enabled ? 'ENABLED (WHITELISTED)' : 'DISABLED (PROTECTED)'}
                        </span>
                      </td>

                      <td style={{ padding: '14px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleCandidateToggle(cand.id, cand.attendance_followup_enabled)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            background: cand.attendance_followup_enabled ? '#fee2e2' : '#dbeafe',
                            color: cand.attendance_followup_enabled ? '#991b1b' : '#1e40af',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 800
                          }}
                        >
                          {cand.attendance_followup_enabled ? 'Disable Automation' : 'Enable Automation'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Case Details Timeline Modal */}
      {selectedCaseModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#ffffff', padding: '28px', borderRadius: '20px', width: '560px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a', fontWeight: 800 }}>
                  Attendance Case History
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                  Candidate: <strong>{selectedCaseModal.candidate_name}</strong> ({selectedCaseModal.employee_id})
                </p>
              </div>
              <button
                onClick={() => setSelectedCaseModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            {/* Candidate & Case Overview */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div><strong>Email:</strong> {selectedCaseModal.candidate_email}</div>
                <div><strong>Batch:</strong> {selectedCaseModal.batch_name}</div>
                <div><strong>Course:</strong> {selectedCaseModal.course_name}</div>
                <div><strong>Consecutive Absences:</strong> <span style={{ color: '#dc2626', fontWeight: 800 }}>{selectedCaseModal.consecutive_absence_count}</span></div>
              </div>
            </div>

            {/* Timeline Events */}
            <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#0f172a', fontWeight: 700 }}>Workflow Timestamps & Action Logs</h4>
            <div style={{ borderLeft: '2px solid #0061fe', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              {selectedCaseModal.reminder_1_sent_at && (
                <div>
                  <div style={{ fontWeight: 700, color: '#2563eb' }}>Reminder 1 Email Sent</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{new Date(selectedCaseModal.reminder_1_sent_at).toLocaleString()}</div>
                </div>
              )}
              {selectedCaseModal.reminder_2_sent_at && (
                <div>
                  <div style={{ fontWeight: 700, color: '#ea580c' }}>Reminder 2 Email Sent</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{new Date(selectedCaseModal.reminder_2_sent_at).toLocaleString()}</div>
                </div>
              )}
              {selectedCaseModal.warning_sent_at && (
                <div>
                  <div style={{ fontWeight: 700, color: '#dc2626' }}>Warning Email & Portal Link Sent</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{new Date(selectedCaseModal.warning_sent_at).toLocaleString()}</div>
                </div>
              )}
              {selectedCaseModal.reason_submitted_at && (
                <div>
                  <div style={{ fontWeight: 700, color: '#7e22ce' }}>Absence Reason Submitted ({selectedCaseModal.reason_category})</div>
                  <div style={{ fontSize: '12px', color: '#334155' }}>"{selectedCaseModal.reason_description}"</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{new Date(selectedCaseModal.reason_submitted_at).toLocaleString()}</div>
                </div>
              )}
              {selectedCaseModal.spoc_reviewed_at && (
                <div>
                  <div style={{ fontWeight: 700, color: selectedCaseModal.spoc_decision === 'APPROVED' ? '#16a34a' : '#dc2626' }}>
                    SPOC Decision: {selectedCaseModal.spoc_decision}
                  </div>
                  {selectedCaseModal.spoc_comments && <div style={{ fontSize: '12px', color: '#334155' }}>Comments: "{selectedCaseModal.spoc_comments}"</div>}
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{new Date(selectedCaseModal.spoc_reviewed_at).toLocaleString()}</div>
                </div>
              )}
              {selectedCaseModal.discontinued_at && (
                <div>
                  <div style={{ fontWeight: 700, color: '#991b1b' }}>Candidate Discontinued from Program</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{new Date(selectedCaseModal.discontinued_at).toLocaleString()}</div>
                </div>
              )}
              {selectedCaseModal.cr_notified_at && (
                <div>
                  <div style={{ fontWeight: 700, color: '#991b1b' }}>Campus Recruitment Notification Sent</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{new Date(selectedCaseModal.cr_notified_at).toLocaleString()}</div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button
                onClick={() => setSelectedCaseModal(null)}
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#0061fe', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
