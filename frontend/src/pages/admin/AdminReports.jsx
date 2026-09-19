import React, { useState, useEffect } from 'react';
import reportService from '../../services/reportService';
import feedbackService from '../../services/feedbackService';
import Icon from '../../components/Icon';

export default function AdminReports() {
  const [traineesList, setTraineesList] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [activeTab, setActiveTab] = useState('report_cards'); // 'report_cards' | 'feedback_analytics'
  const [analytics, setAnalytics] = useState(null);

  // Selected Report Card for Modal Preview
  const [selectedCard, setSelectedCard] = useState(null);
  const [commentReason, setCommentReason] = useState('');
  const [editingComment, setEditingComment] = useState(false);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    loadData();
  }, [selectedBatchId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await reportService.getTraineesReportList(selectedBatchId || null);
      setTraineesList(list || []);

      const analyticsData = await feedbackService.getFeedbackAnalytics();
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to load reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReportCard = async (tId, bId) => {
    try {
      setActionLoading(true);
      const card = await reportService.getTraineePerformanceCard(tId, bId);
      setSelectedCard(card);
      setCommentReason(card.performance_metrics.comment_reason || '');
    } catch (err) {
      console.error('Error fetching report card:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveCommentOverride = async () => {
    if (!selectedCard) return;
    try {
      setActionLoading(true);
      await reportService.updateReportComment(
        selectedCard.personal_info.trainee_id || 1,
        selectedCard.personal_info.batch_no_id || 1,
        commentReason
      );
      showToast('Comment / Reason updated successfully!');
      setEditingComment(false);
      handleOpenReportCard(selectedCard.personal_info.trainee_id, selectedCard.personal_info.batch_no_id);
    } catch (err) {
      console.error('Failed to update comment:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredTrainees = traineesList.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
            Hexaware LMS Reports & Performance Analytics
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Comprehensive performance report cards, dynamic attendance telemetry, and export generators.
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={() => reportService.downloadBatchExcel(selectedBatchId || 1, 'Hexaware_Training')}
            style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: '#166534', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Icon name="download" /> Batch Excel Export
          </button>
          <button
            type="button"
            onClick={() => reportService.downloadBatchBulkZip(selectedBatchId || 1, 'Hexaware_Training')}
            style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: '#2563eb', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Icon name="archive" /> Bulk ZIP Export
          </button>
        </div>
      </div>

      {toastMsg && (
        <div style={{ padding: '14px 18px', borderRadius: '10px', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #86efac', marginBottom: '20px', fontWeight: 700 }}>
          {toastMsg}
        </div>
      )}

      {/* Tabs Bar */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('report_cards')}
          style={{ padding: '12px 20px', border: 'none', background: 'none', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', borderBottom: activeTab === 'report_cards' ? '3px solid #2563eb' : 'none', color: activeTab === 'report_cards' ? '#2563eb' : '#64748b' }}
        >
          Performance Report Cards
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('feedback_analytics')}
          style={{ padding: '12px 20px', border: 'none', background: 'none', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', borderBottom: activeTab === 'feedback_analytics' ? '3px solid #2563eb' : 'none', color: activeTab === 'feedback_analytics' ? '#2563eb' : '#64748b' }}
        >
          Trainee Feedback Analytics
        </button>
      </div>

      {/* TAB 1: PERFORMANCE REPORT CARDS */}
      {activeTab === 'report_cards' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Filter Bar */}
          <div style={{ padding: '16px 20px', borderRadius: '14px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search by name, employee ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, minWidth: '260px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
            />
          </div>

          {/* Trainees List Table */}
          <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Trainee Reports Directory ({filteredTrainees.length})</h3>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Synchronizing database report telemetry...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>Superset ID</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>Trainee Name</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>Email</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>Batch</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrainees.map((item) => (
                      <tr key={item.trainee_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: '#2563eb' }}>{item.employee_id}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 700 }}>{item.name}</td>
                        <td style={{ padding: '12px 14px', color: '#64748b' }}>{item.email}</td>
                        <td style={{ padding: '12px 14px' }}>{item.batch_name}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenReportCard(item.trainee_id, item.batch_id)}
                            style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
                          >
                            View Report Card
                          </button>
                          <button
                            type="button"
                            onClick={() => reportService.downloadTraineeExcel(item.trainee_id, item.batch_id, item.employee_id)}
                            style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #86efac', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
                          >
                            Excel
                          </button>
                          <button
                            type="button"
                            onClick={() => reportService.downloadTraineePDF(item.trainee_id, item.batch_id, item.employee_id)}
                            style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
                          >
                            PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FEEDBACK ANALYTICS */}
      {activeTab === 'feedback_analytics' && analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Video Content Quality</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#2563eb', marginTop: '6px' }}>★ {analytics.video_content.avg_rating} / 5</div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Based on {analytics.total_responses} responses</span>
          </div>

          <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Practice Questions</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#10b981', marginTop: '6px' }}>★ {analytics.practice_questions.avg_rating} / 5</div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Relevance & difficulty balance</span>
          </div>

          <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Coding Challenges</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#f59e0b', marginTop: '6px' }}>★ {analytics.coding_challenges.avg_rating} / 5</div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Problem quality & auto-grader</span>
          </div>

          <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Trainer Support</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#8b5cf6', marginTop: '6px' }}>★ {analytics.trainer_support.avg_rating} / 5</div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Doubt resolution & availability</span>
          </div>
        </div>
      )}

      {/* REPORT CARD PREVIEW MODAL */}
      {selectedCard && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '950px', maxHeight: '90vh', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', overflowY: 'auto', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>OFFICIAL PERFORMANCE REPORT CARD</span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{selectedCard.personal_info.name}</h3>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => reportService.downloadTraineeExcel(selectedCard.personal_info.trainee_id, selectedCard.personal_info.batch_no_id, selectedCard.personal_info.superset_id)}
                  style={{ padding: '8px 14px', borderRadius: '8px', backgroundColor: '#166534', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Excel
                </button>
                <button
                  type="button"
                  onClick={() => reportService.downloadTraineePDF(selectedCard.personal_info.trainee_id, selectedCard.personal_info.batch_no_id, selectedCard.personal_info.superset_id)}
                  style={{ padding: '8px 14px', borderRadius: '8px', backgroundColor: '#dc2626', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  PDF / Print
                </button>
                <button type="button" onClick={() => setSelectedCard(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' }}>✕</button>
              </div>
            </div>

            {/* SECTION 1: PERSONAL & TRAINING INFO */}
            <h4 style={{ margin: '16px 0 8px 0', fontSize: '1rem', fontWeight: 800, color: '#1e40af', backgroundColor: '#eff6ff', padding: '6px 12px', borderRadius: '6px' }}>
              1. Personal & Training Info
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '0.85rem', marginBottom: '20px' }}>
              <div><strong>Superset ID:</strong> {selectedCard.personal_info.superset_id}</div>
              <div><strong>Name:</strong> {selectedCard.personal_info.name}</div>
              <div><strong>Email:</strong> {selectedCard.personal_info.registered_mail_id}</div>
              <div><strong>College:</strong> {selectedCard.personal_info.college}</div>
              <div><strong>Language:</strong> {selectedCard.personal_info.foundation_language}</div>
              <div><strong>Trainer:</strong> {selectedCard.personal_info.trainer_name}</div>
              <div><strong>Batch:</strong> {selectedCard.personal_info.batch_no}</div>
              <div><strong>SPOC:</strong> {selectedCard.personal_info.spoc_name}</div>
            </div>

            {/* SECTION 2: PERFORMANCE METRICS */}
            <h4 style={{ margin: '16px 0 8px 0', fontSize: '1rem', fontWeight: 800, color: '#166534', backgroundColor: '#f0fdf4', padding: '6px 12px', borderRadius: '6px' }}>
              2. Performance Metrics
            </h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '20px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Module Category</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>Attempt 1 (A-1)</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>Attempt 2 (A-2)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 12px' }}>SQL MCQ</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{selectedCard.performance_metrics.sql_mcq.a1}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{selectedCard.performance_metrics.sql_mcq.a2}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 12px' }}>Language MCQ</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{selectedCard.performance_metrics.language_mcq.a1}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{selectedCard.performance_metrics.language_mcq.a2}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 12px' }}>Cloud MCQ</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{selectedCard.performance_metrics.cloud_mcq.a1}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{selectedCard.performance_metrics.cloud_mcq.a2}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 12px' }}>SQL Coding</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{selectedCard.performance_metrics.sql_coding.a1}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{selectedCard.performance_metrics.sql_coding.a2}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 12px' }}>Language Coding</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{selectedCard.performance_metrics.language_coding.a1}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{selectedCard.performance_metrics.language_coding.a2}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 12px' }}>Project Score</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{selectedCard.performance_metrics.project_score.a1}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{selectedCard.performance_metrics.project_score.a2}</td>
                </tr>
              </tbody>
            </table>

            {/* SECTION 3: ATTENDANCE & RANKING */}
            <h4 style={{ margin: '16px 0 8px 0', fontSize: '1rem', fontWeight: 800, color: '#9a3412', backgroundColor: '#fff7ed', padding: '6px 12px', borderRadius: '6px' }}>
              3. Attendance & Ranking Summary
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '0.85rem', marginBottom: '20px' }}>
              <div><strong>Total Days:</strong> {selectedCard.attendance.total_no_of_days}</div>
              <div><strong>Present:</strong> {selectedCard.attendance.total_present_days}</div>
              <div><strong>Absences:</strong> {selectedCard.attendance.absences}</div>
              <div><strong>Attendance %:</strong> <span style={{ color: '#15803d', fontWeight: 800 }}>{selectedCard.attendance.percentage}</span></div>
              <div><strong>Ranking Details:</strong> <span style={{ color: '#2563eb', fontWeight: 800 }}>{selectedCard.performance_metrics.ranking_details}</span></div>
              <div><strong>Composite Score:</strong> {selectedCard.performance_metrics.composite_score}%</div>
              <div style={{ gridColumn: 'span 2' }}>
                <strong>Comment / Reason:</strong> {selectedCard.performance_metrics.comment_reason}
                <button type="button" onClick={() => setEditingComment(!editingComment)} style={{ marginLeft: '10px', fontSize: '0.75rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>[Edit Comment]</button>
              </div>
            </div>

            {editingComment && (
              <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Edit Report Comment / Reason</label>
                <input
                  type="text"
                  value={commentReason}
                  onChange={(e) => setCommentReason(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', marginBottom: '10px' }}
                />
                <button type="button" onClick={handleSaveCommentOverride} disabled={actionLoading} style={{ padding: '6px 16px', borderRadius: '6px', backgroundColor: '#2563eb', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                  Save Comment
                </button>
              </div>
            )}

            {/* SECTION 4: QUALITATIVE EVALUATIONS */}
            <h4 style={{ margin: '16px 0 8px 0', fontSize: '1rem', fontWeight: 800, color: '#334155', backgroundColor: '#f1f5f9', padding: '6px 12px', borderRadius: '6px' }}>
              4. Trainer Feedback & Qualitative Evaluation
            </h4>
            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>Strengths:</strong> {selectedCard.trainer_feedback.strengths}</div>
              <div><strong>Areas for Improvement:</strong> {selectedCard.trainer_feedback.areas_for_improvement}</div>
              <div><strong>Trainer Remarks:</strong> {selectedCard.trainer_feedback.comments}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
