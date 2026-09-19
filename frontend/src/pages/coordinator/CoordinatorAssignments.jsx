import React, { useState, useEffect } from 'react';
import Icon from '../../components/Icon';
import { assignmentService } from '../../services/assignmentService';

export default function CoordinatorAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [batchFilter, setBatchFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const raw = await assignmentService.getAssignments().catch(() => []);
      const enriched = (raw.length > 0 ? raw : [
        { id: 1, title: 'Day 04 OOP Architecture & Design Patterns', batchName: 'Batch 2026-Alpha (Java FullStack)', deadline: '2026-08-15', totalAssigned: 35, submittedCount: 35, pendingCount: 0, overdueCount: 0, avgScore: 88 },
        { id: 2, title: 'Day 08 REST API & Spring Boot Security', batchName: 'Batch 2026-Alpha (Java FullStack)', deadline: '2026-08-28', totalAssigned: 35, submittedCount: 33, pendingCount: 2, overdueCount: 2, avgScore: 82 },
        { id: 3, title: 'Day 12 Microservices & Kafka Pub/Sub Project', batchName: 'Batch 2026-Alpha (Java FullStack)', deadline: '2026-09-20', totalAssigned: 35, submittedCount: 24, pendingCount: 11, overdueCount: 0, avgScore: 85 },
        { id: 4, title: 'Docker Containerization & Multi-Stage Builds', batchName: 'Batch 2026-Beta (Cloud & DevOps)', deadline: '2026-09-12', totalAssigned: 30, submittedCount: 29, pendingCount: 1, overdueCount: 1, avgScore: 91 },
        { id: 5, title: 'Kubernetes Helm Chart Deployment Lab', batchName: 'Batch 2026-Beta (Cloud & DevOps)', deadline: '2026-09-22', totalAssigned: 30, submittedCount: 18, pendingCount: 12, overdueCount: 0, avgScore: 84 }
      ]).map(asg => ({
        id: asg.id,
        title: asg.title || `Assignment #${asg.id}`,
        batchName: asg.batchName || 'Batch 2026-Alpha (Java FullStack)',
        deadline: asg.deadline || '2026-09-20',
        totalAssigned: asg.totalAssigned || 35,
        submittedCount: asg.submittedCount || 28,
        pendingCount: asg.pendingCount || 7,
        overdueCount: asg.overdueCount || 2,
        avgScore: asg.avgScore || 85
      }));
      setAssignments(enriched);
    } catch (err) {
      console.error('Error loading assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = assignments.filter(asg => {
    const matchesSearch = asg.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBatch = batchFilter === 'ALL' || asg.batchName === batchFilter;
    const matchesStatus = statusFilter === 'ALL' || 
      (statusFilter === 'Overdue' && asg.overdueCount > 0) ||
      (statusFilter === 'Pending' && asg.pendingCount > 0) ||
      (statusFilter === 'Completed' && asg.pendingCount === 0);
    return matchesSearch && matchesBatch && matchesStatus;
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
          <span className="coord-banner-subtitle">MODULE 8 • ASSIGNMENT MONITORING</span>
          <h1 className="coord-banner-title">Batch Assignment Tracking & Oversight</h1>
          <p className="coord-banner-desc">
            Track assignment completion rates, pinpoint overdue submissions, coordinate with trainers, and generate completion reports.
          </p>
        </div>
        <div className="coord-banner-right">
          <button
            className="coord-banner-btn primary"
            onClick={() => showToast('Generating Assignment Completion Audit Report (Excel/PDF)...')}
          >
            <Icon name="download" style={{ width: '16px', height: '16px' }} />
            <span>Generate Completion Report</span>
          </button>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="coord-toolbar">
        <div className="coord-search-box">
          <Icon name="search" style={{ color: '#94a3b8', width: '16px', height: '16px' }} />
          <input
            type="text"
            placeholder="Search assignment title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="coord-filter-group">
          <select className="coord-select" value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
            <option value="ALL">All Batches</option>
            <option value="Batch 2026-Alpha (Java FullStack)">Batch 2026-Alpha</option>
            <option value="Batch 2026-Beta (Cloud & DevOps)">Batch 2026-Beta</option>
          </select>

          <select className="coord-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="Overdue">Has Overdue Submissions</option>
            <option value="Pending">Pending Evaluation</option>
            <option value="Completed">100% Submitted</option>
          </select>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="coord-card">
        <div className="coord-card-header">
          <h2 className="coord-card-title">
            <Icon name="file-text" className="coord-card-title-icon" />
            <span>Tracked Batch Assignments ({filtered.length})</span>
          </h2>
        </div>

        <div className="coord-table-wrapper">
          <table className="coord-table">
            <thead>
              <tr>
                <th>Assignment Title</th>
                <th>Target Batch</th>
                <th>Due Date</th>
                <th>Submission Progress</th>
                <th>Overdue Status</th>
                <th>Average Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((asg) => {
                const completionPct = Math.round((asg.submittedCount / asg.totalAssigned) * 100);
                return (
                  <tr key={asg.id}>
                    <td>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{asg.title}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Assigned to {asg.totalAssigned} candidates</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{asg.batchName?.split('(')[0]}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#334155' }}>{asg.deadline}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '100px', backgroundColor: '#e2e8f0', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
                          <div style={{ width: `${completionPct}%`, backgroundColor: completionPct === 100 ? '#15803d' : '#0061fe', height: '100%' }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 800 }}>{completionPct}%</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {asg.submittedCount} submitted • {asg.pendingCount} pending
                      </div>
                    </td>
                    <td>
                      {asg.overdueCount > 0 ? (
                        <span className="coord-badge red">
                          ⚠️ {asg.overdueCount} Overdue
                        </span>
                      ) : (
                        <span className="coord-badge green">On Track</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>{asg.avgScore}%</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <a
                          href="#coordinator-announcements"
                          className="coord-btn secondary coord-btn-sm"
                          onClick={() => showToast(`Drafting deadline reminder for ${asg.title}...`)}
                        >
                          <Icon name="bell" style={{ width: '12px', height: '12px' }} />
                          <span>Remind Batch</span>
                        </a>
                        {asg.overdueCount > 0 && (
                          <a
                            href="#coordinator-interventions"
                            className="coord-btn danger coord-btn-sm"
                          >
                            <Icon name="alert-triangle" style={{ width: '12px', height: '12px' }} />
                            <span>Intervene</span>
                          </a>
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
    </div>
  );
}
