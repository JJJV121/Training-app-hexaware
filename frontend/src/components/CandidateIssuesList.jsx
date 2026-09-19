import React, { useState, useEffect } from 'react';
import issueService from '../services/issueService';
import Icon from './Icon';

export default function CandidateIssuesList({ onRaiseNewIssue }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await issueService.getCandidateIssues();
      setIssues(data || []);
    } catch (err) {
      console.error('Failed to load candidate issues:', err);
      setError('Unable to load issues history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

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
    <div className="candidate-issues-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '20px 24px',
          backgroundColor: 'var(--card-bg, #ffffff)',
          borderRadius: '16px',
          border: '1px solid var(--border-color, #e2e8f0)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark, #0f172a)' }}>
            My Reported Issues
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-medium, #64748b)' }}>
            Track resolution status and administrator responses for reported issues.
          </span>
        </div>

        <button
          type="button"
          onClick={onRaiseNewIssue}
          style={{
            padding: '10px 22px',
            borderRadius: '10px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
          }}
        >
          <Icon name="plus-circle" style={{ width: '18px', height: '18px' }} />
          <span>Raise New Issue</span>
        </button>
      </div>

      {/* Main List Table / Cards */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-medium, #64748b)' }}>
          Loading issue history...
        </div>
      ) : error ? (
        <div style={{ padding: '24px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '12px' }}>
          {error}
        </div>
      ) : issues.length === 0 ? (
        <div
          style={{
            padding: '60px 24px',
            textAlign: 'center',
            backgroundColor: 'var(--card-bg, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--border-color, #e2e8f0)',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>💡</div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark, #0f172a)' }}>
            No Issues Raised Yet
          </h4>
          <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: 'var(--text-medium, #64748b)' }}>
            If you encounter any login, course access, assignment, or platform issues, click below to raise a ticket.
          </p>
          <button
            type="button"
            onClick={onRaiseNewIssue}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Raise Issue Now
          </button>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'var(--card-bg, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--border-color, #e2e8f0)',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-dark, #0f172a)' }}>Issue ID</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-dark, #0f172a)' }}>Issue Type</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-dark, #0f172a)' }}>Subject</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-dark, #0f172a)' }}>Status</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-dark, #0f172a)' }}>Created Date</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-dark, #0f172a)' }}>Last Updated</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-dark, #0f172a)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((item) => {
                  const badge = getStatusBadge(item.status);
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid var(--border-color, #f1f5f9)',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '16px 20px', fontWeight: 800, color: '#2563eb' }}>
                        {item.issue_id}
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-dark, #0f172a)' }}>
                        {item.issue_type}
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-dark, #0f172a)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.subject}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-medium, #64748b)', fontSize: '0.85rem' }}>
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-medium, #64748b)', fontSize: '0.85rem' }}>
                        {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedIssue(item)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--bg-main, #f1f5f9)',
                            border: '1px solid var(--border-color, #cbd5e1)',
                            color: 'var(--text-dark, #0f172a)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          View Details
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

      {/* Detail Modal */}
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
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '600px',
              backgroundColor: 'var(--card-bg, #ffffff)',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid var(--border-color, #cbd5e1)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-color, #e2e8f0)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--bg-main, #f8fafc)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2563eb' }}>
                  {selectedIssue.issue_id}
                </span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark, #0f172a)' }}>
                  {selectedIssue.subject}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIssue(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <Icon name="x" style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-medium, #64748b)', fontWeight: 600 }}>Issue Type:</span>
                  <div style={{ fontWeight: 700, color: 'var(--text-dark, #0f172a)' }}>{selectedIssue.issue_type}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-medium, #64748b)', fontWeight: 600 }}>Priority:</span>
                  <div style={{ fontWeight: 700, color: 'var(--text-dark, #0f172a)' }}>{selectedIssue.priority}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-medium, #64748b)', fontWeight: 600 }}>Status:</span>
                  <div>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        ...getStatusBadge(selectedIssue.status),
                      }}
                    >
                      {selectedIssue.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-medium, #64748b)', fontWeight: 600 }}>Submitted On:</span>
                  <div style={{ fontWeight: 700, color: 'var(--text-dark, #0f172a)' }}>
                    {selectedIssue.created_at ? new Date(selectedIssue.created_at).toLocaleString() : 'N/A'}
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-medium, #64748b)', fontWeight: 700 }}>Description:</span>
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-main, #f8fafc)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    fontSize: '0.9rem',
                    color: 'var(--text-dark, #0f172a)',
                    marginTop: '6px',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedIssue.description}
                </div>
              </div>

              {selectedIssue.attachment_url && (
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-medium, #64748b)', fontWeight: 700 }}>Attachment:</span>
                  <div style={{ marginTop: '4px' }}>
                    <a
                      href={`http://localhost:8000/${selectedIssue.attachment_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#2563eb', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'underline' }}
                    >
                      View Attachment File ↗
                    </a>
                  </div>
                </div>
              )}

              {selectedIssue.admin_response ? (
                <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#eff6ff', borderLeft: '4px solid #2563eb' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e40af' }}>Administrator Response:</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.9rem', color: '#1e293b', whiteSpace: 'pre-wrap' }}>
                    {selectedIssue.admin_response}
                  </p>
                </div>
              ) : (
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>
                  No administrator response provided yet. Status is {selectedIssue.status}.
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color, #e2e8f0)', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setSelectedIssue(null)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
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
