import React, { useState, useEffect } from 'react';
import Icon from '../../components/Icon';
import coordinatorService from '../../services/coordinatorService';

export default function CoordinatorOverview({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const overview = await coordinatorService.getDashboardOverview();
        const trainees = await coordinatorService.getTraineesDirectory();
        const interventions = coordinatorService.getInterventions();
        const issues = coordinatorService.getIssues();
        const announcements = coordinatorService.getAnnouncements();
        
        setData({
          ...overview,
          atRiskTrainees: trainees.filter(t => t.status === 'At-Risk'),
          activeInterventions: interventions.filter(i => i.status !== 'Resolved'),
          openIssues: issues.filter(i => i.status !== 'Resolved'),
          recentAnnouncements: announcements.slice(0, 3)
        });
      } catch (err) {
        console.error('Failed to load coordinator overview:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !data) {
    return (
      <div className="coord-container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <div style={{ fontSize: '15px', color: '#64748b', fontWeight: 600 }}>Loading Batch Coordinator Portal...</div>
      </div>
    );
  }

  const kpis = [
    { label: 'Active Batches', val: data.activeBatchesCount, icon: 'layers', color: 'blue', link: 'coordinator-batches' },
    { label: 'Total Trainees', val: data.totalTraineesCount, icon: 'users', color: 'indigo', link: 'coordinator-trainees' },
    { label: 'Assigned Trainers', val: data.totalTrainersCount, icon: 'user', color: 'green', link: 'coordinator-trainers' },
    { label: 'Avg Batch Attendance', val: `${data.avgAttendancePercent}%`, icon: 'clock', color: data.avgAttendancePercent >= 85 ? 'green' : 'orange', link: 'coordinator-attendance' },
    { label: 'Avg Syllabus Progress', val: `${data.avgProgressPercent}%`, icon: 'activity', color: 'blue', link: 'coordinator-trainees' },
    { label: 'Pending Assignments', val: data.pendingAssignmentsCount, icon: 'file-text', color: 'orange', link: 'coordinator-assignments' },
    { label: 'At-Risk Candidates', val: data.atRiskTrainees.length, icon: 'alert-triangle', color: 'red', link: 'coordinator-interventions' },
    { label: 'Open Candidate Issues', val: data.openIssues.length, icon: 'alert-circle', color: 'purple', link: 'coordinator-issues' }
  ];

  return (
    <div className="coord-container">
      {/* Toast popup */}
      {toastMsg && (
        <div className="toast-message" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
          <Icon name="check" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Blue Header Banner */}
      <div className="coord-banner">
        <div className="coord-banner-left">
          <span className="coord-banner-subtitle">HEXAWARE BATCH COORDINATOR PORTAL (SPOC)</span>
          <h1 className="coord-banner-title">Welcome, Batch Coordinator! 👋</h1>
          <p className="coord-banner-desc">
            Monitor trainee lifecycles, attendance trends, trainer activities, and intervene on at-risk exceptions.
          </p>
        </div>
        <div className="coord-banner-right">
          <a
            href="#coordinator-announcements"
            className="coord-banner-btn primary"
            onClick={() => onNavigate && onNavigate('coordinator-announcements')}
          >
            <Icon name="megaphone" style={{ width: '16px', height: '16px' }} />
            <span>Send Batch Alert</span>
          </a>
          <a
            href="#coordinator-reports"
            className="coord-banner-btn"
            onClick={() => onNavigate && onNavigate('coordinator-reports')}
          >
            <Icon name="download" style={{ width: '16px', height: '16px' }} />
            <span>Generate Reports</span>
          </a>
        </div>
      </div>

      {/* Critical Exceptions & Attention Notice */}
      {data.atRiskTrainees.length > 0 && (
        <div className="coord-alert danger" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Icon name="alert-triangle" style={{ width: '22px', height: '22px', flexShrink: 0, color: '#dc2626' }} />
            <div>
              <strong style={{ fontWeight: 800 }}>Coordinator Action Required:</strong> {data.atRiskTrainees.length} trainees require immediate intervention due to low attendance (&lt;75%) or overdue milestones.
            </div>
          </div>
          <a
            href="#coordinator-interventions"
            className="coord-btn danger"
            onClick={() => onNavigate && onNavigate('coordinator-interventions')}
          >
            Review At-Risk List →
          </a>
        </div>
      )}

      {/* 8 Primary KPI Cards */}
      <div className="coord-stats-grid">
        {kpis.map((kpi, idx) => (
          <a
            key={idx}
            href={`#${kpi.link}`}
            className="coord-stat-card"
            style={{ textDecoration: 'none' }}
            onClick={() => onNavigate && onNavigate(kpi.link)}
          >
            <div className={`coord-stat-icon-bg ${kpi.color}`}>
              <Icon name={kpi.icon} style={{ width: '22px', height: '22px' }} />
            </div>
            <div className="coord-stat-info">
              <span className="coord-stat-val">{kpi.val}</span>
              <span className="coord-stat-lbl">{kpi.label}</span>
            </div>
          </a>
        ))}
      </div>

      {/* Two Column Layout: Active At-Risk Candidates & Live Issues */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        
        {/* At-Risk Watchlist */}
        <div className="coord-card">
          <div className="coord-card-header">
            <h2 className="coord-card-title">
              <Icon name="alert-triangle" className="coord-card-title-icon" style={{ color: '#ea580c' }} />
              <span>At-Risk Candidate Exceptions</span>
            </h2>
            <a
              href="#coordinator-interventions"
              className="coord-btn secondary coord-btn-sm"
              onClick={() => onNavigate && onNavigate('coordinator-interventions')}
            >
              Manage Interventions
            </a>
          </div>

          <div className="coord-table-wrapper">
            <table className="coord-table">
              <thead>
                <tr>
                  <th>Trainee</th>
                  <th>Batch</th>
                  <th>Flag Reasons</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.atRiskTrainees.slice(0, 4).map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{t.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{t.email}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{t.batchName?.split('(')[0]}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {t.atRiskReasons.map((r, i) => (
                          <span key={i} className="coord-badge red" style={{ fontSize: '10px' }}>
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <a
                        href="#coordinator-interventions"
                        className="coord-btn primary coord-btn-sm"
                        onClick={() => onNavigate && onNavigate('coordinator-interventions')}
                      >
                        Intervene
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Candidate Issues & Escalations */}
        <div className="coord-card">
          <div className="coord-card-header">
            <h2 className="coord-card-title">
              <Icon name="message-square" className="coord-card-title-icon" />
              <span>Active Issues & Escalations</span>
            </h2>
            <a
              href="#coordinator-issues"
              className="coord-btn secondary coord-btn-sm"
              onClick={() => onNavigate && onNavigate('coordinator-issues')}
            >
              View All Issues
            </a>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.openIssues.map((issue) => (
              <div
                key={issue.id}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className={`coord-badge ${issue.severity === 'Critical' ? 'red' : issue.severity === 'High' ? 'yellow' : 'blue'}`}>
                      {issue.category} • {issue.severity}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{issue.id}</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{issue.title}</div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                    Raised by {issue.traineeName} ({issue.batchName})
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span className={`coord-badge ${issue.status === 'Escalated to Admin' ? 'purple' : 'yellow'}`}>
                    {issue.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Quick Access Module Hub */}
      <div className="coord-card">
        <div className="coord-card-header">
          <h2 className="coord-card-title">
            <Icon name="sliders" className="coord-card-title-icon" />
            <span>Recommended Coordinator Modules</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Batch Management', icon: 'layers', page: 'coordinator-batches', desc: 'Create batches, assign trainers/trainees, verify batch closure.' },
            { label: 'Trainee 360° View', icon: 'users', page: 'coordinator-trainees', desc: 'Deep dive individual profiles, progress, scores and logs.' },
            { label: 'Trainer Allocation', icon: 'user', page: 'coordinator-trainers', desc: 'Track trainer sessions, schedules and performance.' },
            { label: 'Attendance Management', icon: 'clock', page: 'coordinator-attendance', desc: 'Daily attendance logs, consecutive absence warnings & audit.' },
            { label: '2-Way Feedback', icon: 'message-square', page: 'coordinator-feedback', desc: 'Trainee session feedback and Trainer -> Trainee assessments.' },
            { label: 'Assignment Tracking', icon: 'file-text', page: 'coordinator-assignments', desc: 'Monitor pending & overdue submissions with reports.' },
            { label: 'Assessment Oversight', icon: 'clipboard-check', page: 'coordinator-assessments', desc: 'Track participation and emergency absence requests.' },
            { label: 'Training Schedule', icon: 'calendar', page: 'coordinator-schedule', desc: 'Batch calendar, trainer availability and session scheduling.' },
            { label: 'Targeted Communication', icon: 'megaphone', page: 'coordinator-announcements', desc: 'Send batch reminders, assessment notices and alerts.' },
            { label: 'Issue Escalation', icon: 'shield', page: 'coordinator-issues', desc: 'Log candidate issues and escalate critical items to Admin.' },
            { label: 'At-Risk & Interventions', icon: 'alert-triangle', page: 'coordinator-interventions', desc: 'Flag struggling trainees and track resolution plans.' },
            { label: 'Report Generation', icon: 'download', page: 'coordinator-reports', desc: 'Filter, preview and download batch/individual PDF & Excel.' }
          ].map((m, idx) => (
            <a
              key={idx}
              href={`#${m.page}`}
              className="coord-stat-card"
              style={{ textDecoration: 'none', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}
              onClick={() => onNavigate && onNavigate(m.page)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="coord-stat-icon-bg blue" style={{ width: '38px', height: '38px' }}>
                  <Icon name={m.icon} style={{ width: '18px', height: '18px' }} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{m.label}</div>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>{m.desc}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
