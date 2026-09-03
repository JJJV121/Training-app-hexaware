import { useState, useEffect } from 'react';
import Icon from '../../components/Icon';
import massEnrollmentService from '../../services/massEnrollmentService';

export default function AdminMassEnrollment() {
  // Check hash for initial type override (e.g. #admin-mass-enrollment?type=batches)
  const [enrollmentType, setEnrollmentType] = useState(() => {
    const hash = window.location.hash;
    if (hash.includes('type=trainers')) return 'trainers';
    if (hash.includes('type=batches')) return 'batches';
    return 'trainees';
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [validationData, setValidationData] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    // Reset state on type change
    setSelectedFile(null);
    setValidationData(null);
    setImportResult(null);
    setErrorMsg('');
    setActiveFilter('all');
  }, [enrollmentType]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleDownloadTemplate = async (type) => {
    try {
      await massEnrollmentService.downloadTemplate(type);
      showToast(`Downloaded ${type} CSV template`);
    } catch (err) {
      console.error('Failed to download template:', err);
      setErrorMsg('Failed to download CSV template. Please try again.');
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endswith('.csv')) {
      setErrorMsg('Invalid file format. Please upload a .csv file.');
      return;
    }
    setErrorMsg('');
    setSelectedFile(file);
    setValidationData(null);
    setImportResult(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleValidate = async () => {
    if (!selectedFile) return;
    setIsValidating(true);
    setErrorMsg('');
    try {
      const data = await massEnrollmentService.validateCsv(enrollmentType, selectedFile);
      setValidationData(data);
      showToast(`CSV Validated: ${data.valid_count} valid, ${data.invalid_count} invalid, ${data.duplicate_count} duplicate rows.`);
    } catch (err) {
      console.error('Validation error:', err);
      const detail = err.response?.data?.detail || 'Failed to validate CSV file.';
      setErrorMsg(detail);
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!validationData || !validationData.rows) return;
    setIsImporting(true);
    setErrorMsg('');
    try {
      const res = await massEnrollmentService.importCsv(enrollmentType, validationData.rows);
      setImportResult(res);
      showToast(`Import finished: ${res.successful_count} created, ${res.failed_count} failed.`);
    } catch (err) {
      console.error('Import error:', err);
      const detail = err.response?.data?.detail || 'Mass import execution failed.';
      setErrorMsg(detail);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadFailedRows = () => {
    if (!importResult || !validationData) return;
    massEnrollmentService.downloadFailedRowsCsv(
      enrollmentType,
      importResult.results,
      validationData.rows
    );
    showToast('Downloaded failed rows CSV');
  };

  const resetAll = () => {
    setSelectedFile(null);
    setValidationData(null);
    setImportResult(null);
    setErrorMsg('');
  };

  // Row filtering logic
  const filteredRows = (validationData?.rows || []).filter((r) => {
    if (activeFilter === 'valid') return r.status === 'valid';
    if (activeFilter === 'invalid') return r.status === 'invalid';
    if (activeFilter === 'duplicate') return r.status === 'duplicate';
    return true;
  });

  return (
    <div className="admin-page-container">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="admin-toast success-toast" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }}>
          <Icon name="check-circle" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Icon name="upload-cloud" style={{ color: 'var(--primary-color)' }} />
            Mass Enrollment & Bulk Import
          </h1>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0', color: 'var(--text-light)', fontSize: '14px' }}>
            Bulk upload Trainees, Trainers, and Batches via CSV using existing database structures.
          </p>
        </div>
      </div>

      {/* Top Error Alert */}
      {errorMsg && (
        <div className="alert-box alert-error" style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '8px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Icon name="alert-triangle" />
          <div style={{ flex: 1, fontSize: '14px' }}>{errorMsg}</div>
          <button type="button" onClick={() => setErrorMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B' }}>
            <Icon name="x" />
          </button>
        </div>
      )}

      {/* STEP 1: Select Enrollment Type */}
      <div className="admin-card" style={{ marginBottom: '24px', padding: '24px', borderRadius: '12px', background: 'var(--card-bg, #ffffff)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-flex', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary-color)', color: '#fff', fontSize: '12px', justifyContent: 'center', alignItems: 'center' }}>1</span>
          Select Enrollment Category
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {/* Category Card: Trainees */}
          <div
            onClick={() => setEnrollmentType('trainees')}
            style={{
              padding: '16px',
              borderRadius: '10px',
              border: enrollmentType === 'trainees' ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
              background: enrollmentType === 'trainees' ? 'rgba(79, 70, 229, 0.04)' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '15px' }}>
                <Icon name="users" style={{ color: 'var(--primary-color)' }} />
                <span>Trainees</span>
              </div>
              <button
                type="button"
                className="btn btn-xs btn-outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadTemplate('trainees');
                }}
                title="Download Trainee CSV Template"
                style={{ padding: '4px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Icon name="download" /> Template
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: 0 }}>
              Bulk register trainees into user tables, optionally assigning courses & batches.
            </p>
          </div>

          {/* Category Card: Trainers */}
          <div
            onClick={() => setEnrollmentType('trainers')}
            style={{
              padding: '16px',
              borderRadius: '10px',
              border: enrollmentType === 'trainers' ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
              background: enrollmentType === 'trainers' ? 'rgba(79, 70, 229, 0.04)' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '15px' }}>
                <Icon name="user" style={{ color: 'var(--primary-color)' }} />
                <span>Trainers</span>
              </div>
              <button
                type="button"
                className="btn btn-xs btn-outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadTemplate('trainers');
                }}
                title="Download Trainer CSV Template"
                style={{ padding: '4px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Icon name="download" /> Template
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: 0 }}>
              Import trainers with credentials complying with system password policy.
            </p>
          </div>

          {/* Category Card: Batches */}
          <div
            onClick={() => setEnrollmentType('batches')}
            style={{
              padding: '16px',
              borderRadius: '10px',
              border: enrollmentType === 'batches' ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
              background: enrollmentType === 'batches' ? 'rgba(79, 70, 229, 0.04)' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '15px' }}>
                <Icon name="layers" style={{ color: 'var(--primary-color)' }} />
                <span>Batches</span>
              </div>
              <button
                type="button"
                className="btn btn-xs btn-outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadTemplate('batches');
                }}
                title="Download Batch CSV Template"
                style={{ padding: '4px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Icon name="download" /> Template
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: 0 }}>
              Create training batches with validated course & trainer foreign key references.
            </p>
          </div>
        </div>
      </div>

      {/* STEP 2: CSV File Upload */}
      {!importResult && (
        <div className="admin-card" style={{ marginBottom: '24px', padding: '24px', borderRadius: '12px', background: 'var(--card-bg, #ffffff)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-flex', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary-color)', color: '#fff', fontSize: '12px', justifyContent: 'center', alignItems: 'center' }}>2</span>
            Upload CSV File ({enrollmentType.toUpperCase()})
          </h2>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              border: dragActive ? '2px dashed var(--primary-color)' : '2px dashed var(--border-color)',
              backgroundColor: dragActive ? 'rgba(79, 70, 229, 0.04)' : 'var(--bg-secondary, #F9FAFB)',
              borderRadius: '12px',
              padding: '36px 20px',
              textAlign: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <Icon name="file-text" style={{ fontSize: '40px', color: 'var(--text-light)', marginBottom: '12px' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 6px 0' }}>
              Drag & Drop your CSV file here
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: '0 0 16px 0' }}>
              Only standard <code>.csv</code> files are supported. Max size 10MB.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', alignItems: 'center' }}>
              <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="folder" /> Browse File
                <input
                  type="file"
                  accept=".csv"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                />
              </label>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => handleDownloadTemplate(enrollmentType)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Icon name="download" /> Sample Template
              </button>
            </div>

            {selectedFile && (
              <div style={{ marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '8px 16px', borderRadius: '20px', background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#3730A3', fontSize: '14px', fontWeight: 500 }}>
                <Icon name="check-circle" />
                <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4338CA', padding: '2px' }}
                >
                  <Icon name="x" />
                </button>
              </div>
            )}
          </div>

          {selectedFile && !validationData && (
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={handleValidate}
                disabled={isValidating}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: 600 }}
              >
                {isValidating ? (
                  <>
                    <Icon name="loader" className="spin-icon" /> Validating CSV...
                  </>
                ) : (
                  <>
                    <Icon name="check-square" /> Validate & Preview CSV
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Validation Preview */}
      {validationData && !importResult && (
        <div className="admin-card" style={{ marginBottom: '24px', padding: '24px', borderRadius: '12px', background: 'var(--card-bg, #ffffff)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-flex', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary-color)', color: '#fff', fontSize: '12px', justifyContent: 'center', alignItems: 'center' }}>3</span>
              Validation Summary & Data Preview
            </h2>
            <button type="button" className="btn btn-sm btn-outline" onClick={resetAll}>
              Re-upload File
            </button>
          </div>

          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', borderRadius: '8px', background: '#F3F4F6', border: '1px solid #E5E7EB', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#1F2937' }}>{validationData.total_rows}</div>
              <div style={{ fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600, marginTop: '4px' }}>Total Rows</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '8px', background: '#ECFDF5', border: '1px solid #A7F3D0', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#047857' }}>{validationData.valid_count}</div>
              <div style={{ fontSize: '12px', color: '#047857', textTransform: 'uppercase', fontWeight: 600, marginTop: '4px' }}>Valid Rows</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FCA5A5', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#B91C1C' }}>{validationData.invalid_count}</div>
              <div style={{ fontSize: '12px', color: '#B91C1C', textTransform: 'uppercase', fontWeight: 600, marginTop: '4px' }}>Invalid Rows</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '8px', background: '#FFFBEB', border: '1px solid #FDE68A', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#B45309' }}>{validationData.duplicate_count}</div>
              <div style={{ fontSize: '12px', color: '#B45309', textTransform: 'uppercase', fontWeight: 600, marginTop: '4px' }}>Duplicates</div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <button
              type="button"
              className={`btn btn-sm ${activeFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveFilter('all')}
            >
              All Rows ({validationData.total_rows})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeFilter === 'valid' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveFilter('valid')}
            >
              Valid Only ({validationData.valid_count})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeFilter === 'invalid' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveFilter('invalid')}
            >
              Invalid Only ({validationData.invalid_count})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeFilter === 'duplicate' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveFilter('duplicate')}
            >
              Duplicates Only ({validationData.duplicate_count})
            </button>
          </div>

          {/* Data Table */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', maxHeight: '400px' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead style={{ background: 'var(--bg-secondary, #F9FAFB)', stickyTop: 0, position: 'sticky' }}>
                <tr>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Row #</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Status</th>
                  {enrollmentType === 'trainees' && (
                    <>
                      <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Employee ID</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Name</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Email</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Resolved Course</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Resolved Batch</th>
                    </>
                  )}
                  {enrollmentType === 'trainers' && (
                    <>
                      <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Employee ID</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Name</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Email</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Resolved Course</th>
                    </>
                  )}
                  {enrollmentType === 'batches' && (
                    <>
                      <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Batch Name</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Resolved Course</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Resolved Trainer</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Start Date</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>End Date</th>
                    </>
                  )}
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Validation Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-light)' }}>
                      No rows match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.row_index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{row.row_index}</td>
                      <td style={{ padding: '10px 12px' }}>
                        {row.status === 'valid' && (
                          <span className="badge badge-success" style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                            Valid
                          </span>
                        )}
                        {row.status === 'invalid' && (
                          <span className="badge badge-danger" style={{ background: '#FEE2E2', color: '#991B1B', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                            Invalid
                          </span>
                        )}
                        {row.status === 'duplicate' && (
                          <span className="badge badge-warning" style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                            Duplicate
                          </span>
                        )}
                      </td>

                      {enrollmentType === 'trainees' && (
                        <>
                          <td style={{ padding: '10px 12px' }}>{row.data.employee_id || '-'}</td>
                          <td style={{ padding: '10px 12px' }}>{row.data.name || '-'}</td>
                          <td style={{ padding: '10px 12px' }}>{row.data.email || '-'}</td>
                          <td style={{ padding: '10px 12px' }}>{row.data.resolved_course_title || row.data.course || '-'}</td>
                          <td style={{ padding: '10px 12px' }}>{row.data.resolved_batch_name || row.data.batch || '-'}</td>
                        </>
                      )}

                      {enrollmentType === 'trainers' && (
                        <>
                          <td style={{ padding: '10px 12px' }}>{row.data.employee_id || '-'}</td>
                          <td style={{ padding: '10px 12px' }}>{row.data.name || '-'}</td>
                          <td style={{ padding: '10px 12px' }}>{row.data.email || '-'}</td>
                          <td style={{ padding: '10px 12px' }}>{row.data.resolved_course_title || row.data.course || '-'}</td>
                        </>
                      )}

                      {enrollmentType === 'batches' && (
                        <>
                          <td style={{ padding: '10px 12px' }}>{row.data.name || '-'}</td>
                          <td style={{ padding: '10px 12px' }}>{row.data.resolved_course_title || row.data.course || '-'}</td>
                          <td style={{ padding: '10px 12px' }}>{row.data.resolved_trainer_name || row.data.trainer || '-'}</td>
                          <td style={{ padding: '10px 12px' }}>{row.data.start_date || '-'}</td>
                          <td style={{ padding: '10px 12px' }}>{row.data.end_date || '-'}</td>
                        </>
                      )}

                      <td style={{ padding: '10px 12px', color: row.status === 'valid' ? '#059669' : '#DC2626', fontSize: '12px' }}>
                        {row.errors && row.errors.length > 0 ? (
                          <ul style={{ margin: 0, paddingLeft: '16px' }}>
                            {row.errors.map((e, idx2) => (
                              <li key={idx2}>{e}</li>
                            ))}
                          </ul>
                        ) : (
                          <span>Ready for import</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Action Bar */}
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-light)' }}>
              {validationData.valid_count > 0 ? (
                <span style={{ color: '#059669', fontWeight: 600 }}>
                  <Icon name="check-circle" /> {validationData.valid_count} valid records will be imported into database.
                </span>
              ) : (
                <span style={{ color: '#DC2626', fontWeight: 600 }}>
                  No valid records available to import. Please fix your CSV and re-upload.
                </span>
              )}
            </div>

            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleImport}
              disabled={isImporting || validationData.valid_count === 0}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', fontSize: '15px', fontWeight: 700 }}
            >
              {isImporting ? (
                <>
                  <Icon name="loader" className="spin-icon" /> Executing Mass Import...
                </>
              ) : (
                <>
                  <Icon name="upload" /> Confirm & Import {validationData.valid_count} Records
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Import Results Report */}
      {importResult && (
        <div className="admin-card" style={{ marginBottom: '24px', padding: '24px', borderRadius: '12px', background: 'var(--card-bg, #ffffff)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="check-circle" style={{ color: '#059669', fontSize: '24px' }} />
              Mass Import Final Results Report ({importResult.enrollment_type.toUpperCase()})
            </h2>
            <button type="button" className="btn btn-primary" onClick={resetAll}>
              <Icon name="plus" /> Start New Import
            </button>
          </div>

          {/* Metrics summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', borderRadius: '8px', background: '#F3F4F6', border: '1px solid #E5E7EB', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#1F2937' }}>{importResult.total_records}</div>
              <div style={{ fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600, marginTop: '4px' }}>Total Records</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '8px', background: '#ECFDF5', border: '1px solid #A7F3D0', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#047857' }}>{importResult.successful_count}</div>
              <div style={{ fontSize: '12px', color: '#047857', textTransform: 'uppercase', fontWeight: 600, marginTop: '4px' }}>Successfully Created</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FCA5A5', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#B91C1C' }}>{importResult.failed_count}</div>
              <div style={{ fontSize: '12px', color: '#B91C1C', textTransform: 'uppercase', fontWeight: 600, marginTop: '4px' }}>Failed Rows</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '8px', background: '#FFFBEB', border: '1px solid #FDE68A', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#B45309' }}>{importResult.duplicate_count}</div>
              <div style={{ fontSize: '12px', color: '#B45309', textTransform: 'uppercase', fontWeight: 600, marginTop: '4px' }}>Duplicates</div>
            </div>
          </div>

          {/* Failed rows export button */}
          {importResult.failed_count > 0 && (
            <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FCA5A5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '14px', color: '#991B1B', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="alert-circle" />
                <span>{importResult.failed_count} row(s) failed during import or validation.</span>
              </div>
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={handleDownloadFailedRows}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fff', color: '#B91C1C', borderColor: '#FCA5A5', fontSize: '13px', fontWeight: 600 }}
              >
                <Icon name="download" /> Download Failed Rows as CSV
              </button>
            </div>
          )}

          {/* Results table */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', maxHeight: '400px' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead style={{ background: 'var(--bg-secondary, #F9FAFB)', stickyTop: 0, position: 'sticky' }}>
                <tr>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Row #</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Import Status</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Reason / Outcome</th>
                </tr>
              </thead>
              <tbody>
                {importResult.results.map((res) => (
                  <tr key={res.row_index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{res.row_index}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {res.status === 'Success' ? (
                        <span className="badge badge-success" style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                          Success
                        </span>
                      ) : (
                        <span className="badge badge-danger" style={{ background: '#FEE2E2', color: '#991B1B', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                          Failed
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', color: res.status === 'Success' ? '#047857' : '#B91C1C' }}>
                      {res.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
