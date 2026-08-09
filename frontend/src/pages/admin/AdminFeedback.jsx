import { useState } from 'react';
import Icon from '../../components/Icon';
import mockDataService from '../../services/mockDataService';

export default function AdminFeedback() {
  const [toastMsg, setToastMsg] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Load state from mockDataService
  const [feedbacks, setFeedbacks] = useState(() => mockDataService.getFeedback());

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleUpdateStatus = (status) => {
    if (!selectedFeedback) return;
    const updated = feedbacks.map(f => {
      if (f.id === selectedFeedback.id) {
        const updatedFeedback = { ...f, status: status };
        setSelectedFeedback(updatedFeedback);
        return updatedFeedback;
      }
      return f;
    });
    setFeedbacks(updated);
    mockDataService.saveFeedback(updated);
    triggerToast(`Feedback marked as ${status}`);
  };

  const filteredFeedbacks = feedbacks.filter(f => {
    return categoryFilter === 'All' || f.category === categoryFilter;
  });

  return (
    <div className="page-view admin-container">
      
      {toastMsg && (
        <div className="toast-message">
          <Icon name="check" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Banner */}
      <div className="admin-banner">
        <div className="admin-banner-left">
          <span className="admin-banner-subtitle">PLATFORM SURVEYS</span>
          <h2 className="admin-banner-title">Feedback & Grievances</h2>
        </div>
      </div>

      {/* Category filters */}
      <div className="admin-card" style={{ padding: '20px' }}>
        <div className="table-actions-bar">
          <div className="filter-group">
            <Icon name="filter" style={{ width: '16px', height: '16px', color: 'var(--text-medium)' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-medium)' }}>Category:</span>
            <select 
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Suggestion">Suggestions</option>
              <option value="Complaint">Complaints</option>
            </select>
          </div>
        </div>
      </div>

      <div className="split-view-container">
        
        {/* Feedbacks table */}
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Submitter</th>
                <th>Category</th>
                <th>Rating</th>
                <th>Feedback Preview</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeedbacks.map(f => (
                <tr 
                  key={f.id} 
                  style={{ cursor: 'pointer', backgroundColor: selectedFeedback?.id === f.id ? '#f8fafc' : '' }}
                  onClick={() => setSelectedFeedback(f)}
                >
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700 }}>{f.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-medium)' }}>{f.role}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`admin-badge ${f.category === 'Complaint' ? 'red' : 'blue'}`}>{f.category}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700 }}>{'â­'.repeat(f.rating)}</span>
                  </td>
                  <td>
                    <p style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px' }}>{f.message}</p>
                  </td>
                  <td>
                    <span className={`admin-badge ${f.status === 'Resolved' ? 'green' : f.status === 'New' ? 'red' : 'orange'}`}>
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Selected Feedback review panel */}
        <div className="details-side-panel">
          {selectedFeedback ? (
            <div className="admin-card">
              <div className="details-card-header" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
                <span className={`admin-badge ${selectedFeedback.category === 'Complaint' ? 'red' : 'blue'}`} style={{ marginBottom: '8px' }}>
                  {selectedFeedback.category}
                </span>
                <h3 className="details-name">{selectedFeedback.name}</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-medium)' }}>Role: <strong>{selectedFeedback.role}</strong> | Submitted: <strong>{selectedFeedback.date}</strong></span>
              </div>

              <div className="details-body-list" style={{ marginTop: '0' }}>
                <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-medium)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>SURVEY FEEDBACK</span>
                  <p style={{ fontSize: '13px', color: 'var(--text-dark)', lineHeight: 1.5, fontStyle: 'italic' }}>
                    "{selectedFeedback.message}"
                  </p>
                  <span style={{ display: 'block', marginTop: '12px', fontWeight: 700, fontSize: '12px' }}>Rating: {'â­'.repeat(selectedFeedback.rating)} ({selectedFeedback.rating}/5)</span>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-dark)' }}>Audit Actions</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="action-btn-secondary" style={{ flexGrow: 1, justifyContent: 'center' }} onClick={() => handleUpdateStatus('Reviewed')}>Reviewed</button>
                    <button className="action-btn-primary" style={{ flexGrow: 1, justifyContent: 'center' }} onClick={() => handleUpdateStatus('Resolved')}>Resolved</button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="admin-card" style={{ justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px', color: 'var(--text-light)', textAlign: 'center', border: '1px dashed #cbd5e1', background: 'none' }}>
              <Icon name="message-square" style={{ width: '48px', height: '48px', marginBottom: '12px', opacity: 0.5 }} />
              <p style={{ fontSize: '13px', fontWeight: 600 }}>Select a feedback item to review suggestion text, view rating levels, and resolve complaints.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
