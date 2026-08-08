import { useState } from 'react';
import Icon from '../../components/Icon';
import mockDataService from '../../services/mockDataService';

export default function AdminActivityLogs() {
  const [toastMsg, setToastMsg] = useState(null);
  const [logFilter, setLogFilter] = useState('All');

  // Load state from mockDataService
  const [logs, setLogs] = useState(() => mockDataService.getActivityLogs());

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleClearLogs = () => {
    if (confirm('Clear audit log cache? This action is permanent.')) {
      setLogs([]);
      mockDataService.saveActivityLogs([]);
      triggerToast('Activity logs cleared.');
    }
  };

  const filteredLogs = logs.filter(l => {
    if (logFilter === 'All') return true;
    return l.type === logFilter;
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
          <span className="admin-banner-subtitle">PLATFORM AUDITS</span>
          <h2 className="admin-banner-title">Activity Logs Audit</h2>
        </div>
        <div className="admin-banner-right">
          <button className="admin-banner-btn" style={{ backgroundColor: 'var(--accent-red-light)', color: 'var(--accent-red)', borderColor: 'var(--accent-red)' }} onClick={handleClearLogs}>
            <Icon name="trash-2" style={{ width: '16px', height: '16px' }} />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-card" style={{ padding: '20px' }}>
        <div className="table-actions-bar">
          <div className="filter-group">
            <Icon name="filter" style={{ width: '16px', height: '16px', color: 'var(--text-medium)' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-medium)' }}>Event Type:</span>
            <select 
              className="filter-select"
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
            >
              <option value="All">All Operations</option>
              <option value="publish">Publishing</option>
              <option value="assign">Allocations</option>
              <option value="enroll">Enrollments</option>
              <option value="grade">Grading</option>
              <option value="settings">System/Security</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline list */}
      <div className="admin-card">
        {filteredLogs.length > 0 ? (
          <div className="timeline-container">
            <div className="timeline-line"></div>
            
            {filteredLogs.map(log => (
              <div key={log.id} className="timeline-event-row">
                <div className={`timeline-node ${log.color}`}>
                  <Icon name="activity" style={{ width: '12px', height: '12px' }} />
                </div>
                
                <div className="timeline-event-content">
                  <div className="timeline-event-left">
                    <span className="timeline-event-title">{log.title}</span>
                    <span className="timeline-event-desc">{log.desc}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '4px' }}>Actor: <strong>{log.user}</strong></span>
                  </div>
                  
                  <span className="timeline-event-time">{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>
            <Icon name="history" style={{ width: '48px', height: '48px', marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ fontSize: '14px', fontWeight: 600 }}>No activity records found.</p>
          </div>
        )}
      </div>

    </div>
  );
}
