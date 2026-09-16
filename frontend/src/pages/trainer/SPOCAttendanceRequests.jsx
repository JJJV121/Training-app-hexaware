import React, { useState, useEffect } from 'react';
import Icon from '../../components/Icon';

export default function SPOCAttendanceRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('APPROVE');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const res = await fetch('/api/attendance-followup/spoc/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch approval requests');
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const res = await fetch('/api/attendance-followup/spoc/requests/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          followup_id: selectedRequest.id,
          decision: reviewDecision,
          spoc_comments: comments
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || 'Failed to submit review');
      }

      setMessage(`Request successfully ${reviewDecision === 'APPROVE' ? 'APPROVED' : 'REJECTED'}`);
      setSelectedRequest(null);
      setComments('');
      setTimeout(() => setMessage(''), 3000);
      fetchRequests();
    } catch (err) {
      alert('Review submission failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && requests.length === 0) {
    return <div className="p-4">Loading SPOC Approval Requests...</div>;
  }

  return (
    <div className="spoc-requests-container" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-color)' }}>Attendance Approval Requests</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-light)', fontSize: '13px' }}>
            Review candidate absence reasons, supporting documents, and approve/reject discontinuation escalation.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchRequests} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Icon name="refresh-cw" size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {message && (
        <div style={{ padding: '12px 16px', background: '#dcfce7', color: '#15803d', borderRadius: '8px', marginBottom: '16px', fontWeight: 600 }}>
          {message}
        </div>
      )}

      {/* Requests Table */}
      <div style={{ background: 'var(--card-bg, #fff)', borderRadius: '10px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--table-header-bg, #f8fafc)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Candidate</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>ID / Email</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Batch / Course</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Consecutive Absences</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Absence Dates</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Submitted Reason</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-light)' }}>
                  No attendance approval requests found.
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{r.candidate_name}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.employee_id || `ID_${r.candidate_id}`}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>{r.candidate_email}</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div>{r.batch_name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>{r.course_name}</div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: '#dc2626' }}>
                    {r.consecutive_absence_count}
                  </td>
                  <td style={{ padding: '12px', fontSize: '12px' }}>
                    {r.first_absence_date ? new Date(r.first_absence_date).toLocaleDateString() : '-'}
                    {r.latest_absence_date && r.latest_absence_date !== r.first_absence_date && ` to ${new Date(r.latest_absence_date).toLocaleDateString()}`}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {r.reason_category ? (
                      <div>
                        <div style={{ fontWeight: 600, color: '#0061fe' }}>{r.reason_category}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-light)', maxLines: 2 }}>{r.reason_description}</div>
                        {r.reason_attachment_url && (
                          <a href={r.reason_attachment_url} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#2563eb', textDecoration: 'underline' }}>
                            View Document Attachment
                          </a>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-light)' }}>Pending submission</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: r.spoc_decision === 'APPROVED' ? '#dcfce7' : r.spoc_decision === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                      color: r.spoc_decision === 'APPROVED' ? '#15803d' : r.spoc_decision === 'REJECTED' ? '#991b1b' : '#b45309'
                    }}>
                      {r.spoc_decision || r.current_stage}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => setSelectedRequest(r)}
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                    >
                      Review Request
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* SPOC Review Modal */}
      {selectedRequest && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '500px', maxWidth: '90%' }}>
            <h3 style={{ margin: '0 0 16px', color: '#0f172a' }}>Review Candidate Absence Reason</h3>
            
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
              <div><strong>Candidate:</strong> {selectedRequest.candidate_name} ({selectedRequest.employee_id})</div>
              <div><strong>Batch / Course:</strong> {selectedRequest.batch_name} ({selectedRequest.course_name})</div>
              <div><strong>Consecutive Absences:</strong> {selectedRequest.consecutive_absence_count}</div>
              <div><strong>Reason Category:</strong> {selectedRequest.reason_category}</div>
              <div><strong>Explanation:</strong> {selectedRequest.reason_description}</div>
              {selectedRequest.reason_attachment_url && (
                <div>
                  <strong>Document: </strong>
                  <a href={selectedRequest.reason_attachment_url} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>
                    View Attachment
                  </a>
                </div>
              )}
            </div>

            <form onSubmit={handleReviewSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Action:</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600, color: '#16a34a' }}>
                    <input
                      type="radio"
                      name="decision"
                      value="APPROVE"
                      checked={reviewDecision === 'APPROVE'}
                      onChange={() => setReviewDecision('APPROVE')}
                    />
                    APPROVE (Stops Discontinuation)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600, color: '#dc2626' }}>
                    <input
                      type="radio"
                      name="decision"
                      value="REJECT"
                      checked={reviewDecision === 'REJECT'}
                      onChange={() => setReviewDecision('REJECT')}
                    />
                    REJECT (Escalation Continues)
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>SPOC Comments:</label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Enter optional comments or rejection reason..."
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedRequest(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    background: reviewDecision === 'APPROVE' ? '#16a34a' : '#dc2626',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {submitting ? 'Submitting...' : `Submit ${reviewDecision}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
