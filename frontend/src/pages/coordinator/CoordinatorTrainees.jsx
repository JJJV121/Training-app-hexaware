import React, { useState, useEffect } from 'react';
import Icon from '../../components/Icon';
import coordinatorService from '../../services/coordinatorService';

export default function CoordinatorTrainees() {
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [batchFilter, setBatchFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [collegeFilter, setCollegeFilter] = useState('ALL');
  
  // Selected Trainee for 360° deep dive modal
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const list = await coordinatorService.getTraineesDirectory();
        setTrainees(list);
      } catch (err) {
        console.error('Error loading trainees:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const batches = Array.from(new Set(trainees.map(t => t.batchName).filter(Boolean)));
  const colleges = Array.from(new Set(trainees.map(t => t.college).filter(Boolean)));

  const filtered = trainees.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBatch = batchFilter === 'ALL' || t.batchName === batchFilter;
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesCollege = collegeFilter === 'ALL' || t.college === collegeFilter;
    return matchesSearch && matchesBatch && matchesStatus && matchesCollege;
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
          <span className="coord-banner-subtitle">MODULE 2 & 7 • TRAINEE MANAGEMENT & 360° MONITORING</span>
          <h1 className="coord-banner-title">Candidate Directory & 360° Insight</h1>
          <p className="coord-banner-desc">
            Monitor holistic trainee profiles, curriculum progress, attendance records, assignments, and test marks.
          </p>
        </div>
        <div className="coord-banner-right">
          <button
            className="coord-banner-btn"
            onClick={() => showToast('Exporting complete trainee roster to Excel...')}
          >
            <Icon name="download" style={{ width: '16px', height: '16px' }} />
            <span>Export Roster</span>
          </button>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="coord-toolbar">
        <div className="coord-search-box">
          <Icon name="search" style={{ color: '#94a3b8', width: '16px', height: '16px' }} />
          <input
            type="text"
            placeholder="Search trainee name, email, employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="coord-filter-group">
          <select className="coord-select" value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
            <option value="ALL">All Batches</option>
            {batches.map((b, i) => (
              <option key={i} value={b}>{b}</option>
            ))}
          </select>

          <select className="coord-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="On Track">On Track</option>
            <option value="At-Risk">At-Risk (Action Required)</option>
          </select>

          <select className="coord-select" value={collegeFilter} onChange={(e) => setCollegeFilter(e.target.value)}>
            <option value="ALL">All Colleges</option>
            {colleges.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Trainees Directory Table */}
      <div className="coord-card">
        <div className="coord-card-header">
          <h2 className="coord-card-title">
            <Icon name="users" className="coord-card-title-icon" />
            <span>Enrolled Candidates ({filtered.length})</span>
          </h2>
        </div>

        <div className="coord-table-wrapper">
          <table className="coord-table">
            <thead>
              <tr>
                <th>Trainee Details</th>
                <th>Assigned Batch</th>
                <th>College</th>
                <th>Attendance</th>
                <th>Syllabus Progress</th>
                <th>Assignments</th>
                <th>Avg Assessment</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{t.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{t.employeeId} • {t.email}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '12px' }}>
                      {t.batchName?.split('(')[0]}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Trainer: {t.trainerName}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>{t.college}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 800, color: t.attendance >= 80 ? '#15803d' : '#b91c1c' }}>
                        {t.attendance}%
                      </span>
                      {t.consecutiveAbsences >= 2 && (
                        <span className="coord-badge red" style={{ fontSize: '9px', padding: '2px 6px' }}>
                          {t.consecutiveAbsences}d absent
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ width: '100px', backgroundColor: '#e2e8f0', borderRadius: '9999px', height: '6px', overflow: 'hidden', marginBottom: '4px' }}>
                      <div
                        style={{
                          width: `${t.progress}%`,
                          backgroundColor: t.progress >= 70 ? '#0061fe' : t.progress >= 50 ? '#ea580c' : '#dc2626',
                          height: '100%'
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>{t.progress}% done</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>
                      {t.assignmentsSubmitted} / {t.totalAssignments}
                    </span>
                    {t.totalAssignments - t.assignmentsSubmitted > 0 && (
                      <div style={{ fontSize: '10px', color: '#ea580c' }}>
                        {t.totalAssignments - t.assignmentsSubmitted} pending
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: t.avgAssessmentScore >= 70 ? '#0f172a' : '#dc2626' }}>
                      {t.avgAssessmentScore}%
                    </span>
                  </td>
                  <td>
                    <span className={`coord-badge ${t.status === 'At-Risk' ? 'red' : 'green'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="coord-btn primary coord-btn-sm"
                      onClick={() => setSelectedTrainee(t)}
                    >
                      <Icon name="eye" style={{ width: '13px', height: '13px' }} />
                      <span>360° View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INDIVIDUAL TRAINEE 360° CONSOLIDATED VIEW MODAL (Section 7) */}
      {selectedTrainee && (
        <div className="coord-modal-backdrop">
          <div className="coord-modal-card wide">
            <div className="coord-modal-header">
              <h3 className="coord-modal-title">
                <Icon name="user-check" style={{ color: '#0061fe' }} />
                <span>Consolidated 360° Profile: {selectedTrainee.name}</span>
              </h3>
              <button className="coord-modal-close" onClick={() => setSelectedTrainee(null)}>
                <Icon name="x" />
              </button>
            </div>
            <div className="coord-modal-body">
              
              {/* Header card with candidate details */}
              <div className="trainee-360-header">
                <div className="trainee-360-avatar">
                  {selectedTrainee.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {selectedTrainee.name}
                    </h2>
                    <span className={`coord-badge ${selectedTrainee.status === 'At-Risk' ? 'red' : 'green'}`}>
                      {selectedTrainee.status}
                    </span>
                    <span className="coord-badge blue">{selectedTrainee.employeeId}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                    {selectedTrainee.email} • {selectedTrainee.phone} • College: <strong>{selectedTrainee.college}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Batch: <strong>{selectedTrainee.batchName}</strong> • Lead Trainer: <strong>{selectedTrainee.trainerName}</strong>
                  </div>
                </div>
              </div>

              {/* At Risk Alert Tag if flagged */}
              {selectedTrainee.status === 'At-Risk' && (
                <div className="coord-alert danger">
                  <Icon name="alert-triangle" style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                  <div>
                    <strong>At-Risk Diagnostic Trigger:</strong>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                      {selectedTrainee.atRiskReasons.map((r, i) => (
                        <span key={i} className="coord-badge red" style={{ backgroundColor: '#ffffff', color: '#b91c1c' }}>
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 4 Metric Boxes */}
              <div className="trainee-360-metrics">
                <div className="trainee-metric-box">
                  <div className="trainee-metric-val" style={{ color: selectedTrainee.attendance >= 80 ? '#15803d' : '#b91c1c' }}>
                    {selectedTrainee.attendance}%
                  </div>
                  <div className="trainee-metric-lbl">Attendance Rate</div>
                </div>
                <div className="trainee-metric-box">
                  <div className="trainee-metric-val" style={{ color: '#0061fe' }}>
                    {selectedTrainee.progress}%
                  </div>
                  <div className="trainee-metric-lbl">Curriculum Progress</div>
                </div>
                <div className="trainee-metric-box">
                  <div className="trainee-metric-val" style={{ color: '#ea580c' }}>
                    {selectedTrainee.assignmentsSubmitted} / {selectedTrainee.totalAssignments}
                  </div>
                  <div className="trainee-metric-lbl">Assignments Submitted</div>
                </div>
                <div className="trainee-metric-box">
                  <div className="trainee-metric-val" style={{ color: '#7e22ce' }}>
                    {selectedTrainee.avgAssessmentScore}%
                  </div>
                  <div className="trainee-metric-lbl">Average Score</div>
                </div>
              </div>

              {/* Two Columns: Assessments & Assignments Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                
                {/* Assessments Card */}
                <div className="coord-card" style={{ padding: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name="clipboard-check" style={{ color: '#0061fe', width: '16px', height: '16px' }} />
                    <span>Assessment Scores & Tests</span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedTrainee.assessments?.map((a, i) => (
                      <div key={i} style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{a.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Date: {a.date}</div>
                        </div>
                        <div>
                          {a.score !== null ? (
                            <span className={`coord-badge ${a.score >= 70 ? 'green' : 'red'}`}>
                              {a.score} / {a.maxScore}
                            </span>
                          ) : (
                            <span className="coord-badge orange">Emergency Absence</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assignments Card */}
                <div className="coord-card" style={{ padding: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name="file-text" style={{ color: '#0061fe', width: '16px', height: '16px' }} />
                    <span>Assignments & Projects</span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedTrainee.assignments?.map((asg, i) => (
                      <div key={i} style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{asg.title}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{asg.submittedDate ? `Submitted: ${asg.submittedDate}` : 'Deadline Passed'}</div>
                        </div>
                        <div>
                          <span className={`coord-badge ${asg.status === 'Submitted' ? 'green' : 'red'}`}>
                            {asg.status} {asg.score ? `(${asg.score}%)` : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Coordinator & Trainer Remarks */}
              <div style={{ padding: '14px 18px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Coordinator Remarks & Notes
                </div>
                <div style={{ fontSize: '13px', color: '#1e293b' }}>
                  {selectedTrainee.remarks}
                </div>
              </div>

            </div>
            <div className="coord-modal-footer">
              <button type="button" className="coord-btn secondary" onClick={() => setSelectedTrainee(null)}>
                Close
              </button>
              <a
                href="#coordinator-interventions"
                className="coord-btn primary"
                onClick={() => setSelectedTrainee(null)}
              >
                <Icon name="alert-triangle" />
                <span>Initiate Intervention Plan</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
