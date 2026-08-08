import { useState } from 'react';
import Icon from '../../components/Icon';
import mockDataService from '../../services/mockDataService';

export default function AdminReports() {
  const [toastMsg, setToastMsg] = useState(null);
  const [reportType, setReportType] = useState('Student Performance');
  const [format, setFormat] = useState('PDF');
  const [dateRange, setDateRange] = useState('This Month');

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleGenerate = () => {
    triggerToast(`Generating ${reportType} report in ${format}...`);
  };

  const reportsList = mockDataService.getReports();

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
          <span className="admin-banner-subtitle">AUDITS & EXPORTS</span>
          <h2 className="admin-banner-title">Reports Generator</h2>
        </div>
      </div>

      <div className="admin-dashboard-row">
        
        {/* Reports Selection list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reportsList.map((rep, idx) => (
            <div 
              key={idx} 
              className="admin-card" 
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '20px', 
                cursor: 'pointer',
                borderColor: reportType === rep.type ? 'var(--primary-blue)' : ''
              }}
              onClick={() => {
                setReportType(rep.type);
                triggerToast(`Selected report: ${rep.title}`);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="admin-stat-icon-bg blue" style={{ width: '40px', height: '40px', borderRadius: '10px' }}>
                  <Icon name={rep.icon} style={{ width: '18px', height: '18px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-dark)' }}>{rep.title}</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-medium)', maxWidth: '420px', lineHeight: 1.4 }}>{rep.desc}</p>
                </div>
              </div>
              <Icon name="chevron-right" style={{ color: 'var(--text-light)', width: '16px' }} />
            </div>
          ))}
        </div>

        {/* Configuration exports pane */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              <Icon name="sliders" className="admin-card-title-icon" />
              <span>Export Configurations</span>
            </h3>
          </div>

          <div className="modal-form">
            <div className="form-group">
              <label className="form-label">Active Selection</label>
              <input type="text" className="form-input" value={reportType} disabled style={{ backgroundColor: '#fafbfc' }} />
            </div>

            <div className="form-group">
              <label className="form-label">Date Range Scope</label>
              <select className="form-input" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                <option value="This Month">This Month</option>
                <option value="Last 3 Months">Last 3 Months</option>
                <option value="Full Year (2026)">Full Year (2026)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Export File Format</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {['PDF', 'Excel', 'CSV'].map(fmt => (
                  <button 
                    key={fmt} 
                    type="button" 
                    className="action-btn-secondary" 
                    style={{ 
                      flexGrow: 1, 
                      justifyContent: 'center', 
                      backgroundColor: format === fmt ? 'var(--primary-blue)' : '', 
                      color: format === fmt ? '#ffffff' : '' 
                    }}
                    onClick={() => setFormat(fmt)}
                  >
                    {fmt === 'Excel' && <Icon name="file-text" style={{ width: '14px', height: '14px' }} />}
                    <span>{fmt}</span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="button" 
              className="action-btn-primary" 
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '16px' }}
              onClick={handleGenerate}
            >
              <Icon name="download" />
              <span>Generate & Download</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
