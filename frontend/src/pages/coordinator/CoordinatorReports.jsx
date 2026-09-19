import React, { useState, useEffect } from 'react';
import Icon from '../../components/Icon';
import coordinatorService from '../../services/coordinatorService';

export default function CoordinatorReports() {
  const [reportType, setReportType] = useState('batch-attendance');
  const [selectedBatch, setSelectedBatch] = useState('Batch 2026-Alpha (Java FullStack)');
  const [selectedFormat, setSelectedFormat] = useState('excel');
  const [dateRangeStart, setDateRangeStart] = useState('2026-08-01');
  const [dateRangeEnd, setDateRangeEnd] = useState('2026-09-18');
  const [reportData, setReportData] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedTimestamp, setGeneratedTimestamp] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    async function load() {
      const list = await coordinatorService.getTraineesDirectory();
      setTrainees(list);
    }
    load();
  }, []);

  const handleGenerateReport = () => {
    setLoading(true);
    setTimeout(() => {
      setGeneratedTimestamp(new Date().toLocaleString());
      if (reportType === 'batch-attendance') {
        setReportData([
          { id: 1, name: 'Aarav Sharma', college: 'IIT Madras', presentDays: 24, absentDays: 6, attendancePct: '80.0%', consecutiveAbsences: 3, riskStatus: 'At-Risk' },
          { id: 2, name: 'Priya Patel', college: 'NIT Trichy', presentDays: 26, absentDays: 4, attendancePct: '86.6%', consecutiveAbsences: 0, riskStatus: 'On Track' },
          { id: 3, name: 'Rohan Gupta', college: 'BITS Pilani', presentDays: 28, absentDays: 2, attendancePct: '93.3%', consecutiveAbsences: 0, riskStatus: 'On Track' },
          { id: 4, name: 'Ananya Verma', college: 'PSG Tech', presentDays: 30, absentDays: 0, attendancePct: '100.0%', consecutiveAbsences: 0, riskStatus: 'On Track' },
          { id: 5, name: 'Vikram Mehta', college: 'Anna University', presentDays: 25, absentDays: 5, attendancePct: '83.3%', consecutiveAbsences: 2, riskStatus: 'At-Risk' }
        ]);
      } else if (reportType === 'course-progress') {
        setReportData([
          { id: 1, name: 'Aarav Sharma', modulesCompleted: '8 / 15', progressPct: '53.3%', labsDone: '6 / 12', status: 'Needs Acceleration' },
          { id: 2, name: 'Priya Patel', modulesCompleted: '11 / 15', progressPct: '73.3%', labsDone: '10 / 12', status: 'On Track' },
          { id: 3, name: 'Rohan Gupta', modulesCompleted: '14 / 15', progressPct: '93.3%', labsDone: '12 / 12', status: 'Excellent' },
          { id: 4, name: 'Ananya Verma', modulesCompleted: '15 / 15', progressPct: '100.0%', labsDone: '12 / 12', status: 'Top Performer' }
        ]);
      } else if (reportType === 'at-risk-summary') {
        setReportData([
          { id: 1, name: 'Aarav Sharma', batch: 'Batch 2026-Alpha', triggerReason: 'Low Attendance (68%), 3 Consecutive Absences', interventionStatus: 'In Progress', followUp: '2026-09-24' },
          { id: 2, name: 'Priya Patel', batch: 'Batch 2026-Alpha', triggerReason: '3 Overdue Assignments, Low Midterm Score (42%)', interventionStatus: 'Pending', followUp: '2026-09-22' }
        ]);
      } else {
        setReportData([
          { id: 1, metric: 'Total Enrolled Trainees', value: '35 Candidates' },
          { id: 2, metric: 'Average Batch Attendance', value: '88.4%' },
          { id: 3, metric: 'Curriculum Completion Rate', value: '74.2%' },
          { id: 4, metric: 'Assignment Submission Compliance', value: '91.8%' },
          { id: 5, metric: 'Average Assessment Score', value: '82.5 / 100' },
          { id: 6, metric: 'Faculty Rating (Student Evaluated)', value: '4.8 / 5.0' }
        ]);
      }
      setLoading(false);
      showToast(`Report compiled successfully (${reportType})! Ready for download.`);
    }, 400);
  };

  const handleDownload = () => {
    const filename = `${reportType}_${selectedBatch.replace(/[^a-zA-Z0-9]/g, '_')}.${selectedFormat === 'excel' ? 'xlsx' : selectedFormat === 'csv' ? 'csv' : 'pdf'}`;
    
    // Create download trigger simulation
    if (selectedFormat === 'csv') {
      const csvContent = "data:text/csv;charset=utf-8," + 
        Object.keys(reportData[0] || {}).join(",") + "\n" +
        reportData.map(row => Object.values(row).join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    showToast(`Downloading "${filename}"...`);
  };

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
          <span className="coord-banner-subtitle">MODULE 13 • AUDIT REPORT GENERATION ENGINE</span>
          <h1 className="coord-banner-title">Report Generator & Data Exports</h1>
          <p className="coord-banner-desc">
            View → Filter → Generate → Download (PDF / Excel / CSV) batch performance, attendance records, at-risk rosters and 360° candidate reports.
          </p>
        </div>
      </div>

      {/* Report Configurator Card */}
      <div className="coord-card">
        <div className="coord-card-header">
          <h2 className="coord-card-title">
            <Icon name="sliders" className="coord-card-title-icon" />
            <span>Configure Report Parameters</span>
          </h2>
        </div>

        <div className="coord-form-grid">
          <div className="coord-form-group">
            <label className="coord-form-label">Report Category *</label>
            <select
              className="coord-form-select"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="batch-attendance">Batch Attendance & Consecutive Absence Audit</option>
              <option value="course-progress">Course Progress & Syllabus Completion Rate</option>
              <option value="at-risk-summary">At-Risk Candidates & Intervention Audit</option>
              <option value="batch-comprehensive">Comprehensive Batch 360° Summary</option>
              <option value="assessment-performance">Assessment Scores & Grade Distribution</option>
              <option value="feedback-summary">2-Way Trainee & Trainer Feedback Report</option>
            </select>
          </div>

          <div className="coord-form-group">
            <label className="coord-form-label">Target Batch *</label>
            <select
              className="coord-form-select"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
            >
              <option value="Batch 2026-Alpha (Java FullStack)">Batch 2026-Alpha (Java FullStack)</option>
              <option value="Batch 2026-Beta (Cloud & DevOps)">Batch 2026-Beta (Cloud & DevOps)</option>
              <option value="Batch 2026-Gamma (Data Engineering)">Batch 2026-Gamma (Data Engineering)</option>
            </select>
          </div>

          <div className="coord-form-group">
            <label className="coord-form-label">Start Date</label>
            <input
              type="date"
              className="coord-form-input"
              value={dateRangeStart}
              onChange={(e) => setDateRangeStart(e.target.value)}
            />
          </div>

          <div className="coord-form-group">
            <label className="coord-form-label">End Date</label>
            <input
              type="date"
              className="coord-form-input"
              value={dateRangeEnd}
              onChange={(e) => setDateRangeEnd(e.target.value)}
            />
          </div>

          <div className="coord-form-group">
            <label className="coord-form-label">Export Format *</label>
            <select
              className="coord-form-select"
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
            >
              <option value="excel">Microsoft Excel (.xlsx)</option>
              <option value="csv">Comma-Separated Values (.csv)</option>
              <option value="pdf">Adobe Acrobat PDF (.pdf)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button className="coord-btn primary" onClick={handleGenerateReport}>
            <Icon name="activity" />
            <span>Generate & Preview Report</span>
          </button>
        </div>
      </div>

      {/* LIVE PREVIEW & DOWNLOAD AREA */}
      {generatedTimestamp && (
        <div className="coord-card">
          <div className="coord-card-header">
            <div>
              <h3 className="coord-card-title">
                <Icon name="file-text" className="coord-card-title-icon" />
                <span>Report Preview: {reportType}</span>
              </h3>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Batch: <strong>{selectedBatch}</strong> • Range: {dateRangeStart} to {dateRangeEnd} • Compiled at {generatedTimestamp}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="coord-btn secondary" onClick={() => window.print()}>
                <Icon name="printer" style={{ width: '14px', height: '14px' }} />
                <span>Print</span>
              </button>
              <button className="coord-btn success" onClick={handleDownload}>
                <Icon name="download" style={{ width: '14px', height: '14px' }} />
                <span>Download ({selectedFormat.toUpperCase()})</span>
              </button>
            </div>
          </div>

          <div className="coord-table-wrapper">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Compiling report data...</div>
            ) : reportData.length > 0 ? (
              <table className="coord-table">
                <thead>
                  <tr>
                    {Object.keys(reportData[0]).map((key) => (
                      <th key={key}>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((val, cIdx) => (
                        <td key={cIdx}>
                          {typeof val === 'string' && val.includes('At-Risk') ? (
                            <span className="coord-badge red">{val}</span>
                          ) : typeof val === 'string' && val.includes('On Track') ? (
                            <span className="coord-badge green">{val}</span>
                          ) : (
                            val
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No records found for specified criteria.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
