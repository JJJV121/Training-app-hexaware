import { useEffect, useState } from 'react';
import Icon from '../../components/Icon';
import adminCourseService from '../../services/adminCourseService';
import massEnrollmentService from '../../services/massEnrollmentService';

export default function CoordinatorMassEnrollment() {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [file, setFile] = useState(null);
  const [validation, setValidation] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    adminCourseService.getCourses(1, 100)
      .then((items) => {
        setCourses(Array.isArray(items) ? items : []);
        if (items?.length) setCourseId(String(items[0].id));
      })
      .catch(() => setError('Unable to load courses.'));
  }, []);

  const validate = async () => {
    if (!file || !courseId) {
      setError('Select a course and CSV file before validating.');
      return;
    }
    setBusy(true);
    setError('');
    setResult(null);
    try {
      setValidation(await massEnrollmentService.validateCsv('question_bank', file, Number(courseId)));
    } catch (err) {
      setError(err.response?.data?.detail || 'MCQ validation failed.');
    } finally {
      setBusy(false);
    }
  };

  const importRows = async () => {
    if (!validation || validation.invalid_count > 0 || !courseId) return;
    setBusy(true);
    setError('');
    try {
      setResult(await massEnrollmentService.importCsv('question_bank', validation.rows, Number(courseId)));
    } catch (err) {
      setError(err.response?.data?.detail || 'MCQ import failed. No rows were committed.');
    } finally {
      setBusy(false);
    }
  };

  const selectedCourse = courses.find((course) => String(course.id) === String(courseId));

  return (
    <div className="page-view admin-container">
      <div className="admin-banner">
        <div className="admin-banner-left">
          <span className="admin-banner-subtitle">MASS ENROLLMENT</span>
          <h2 className="admin-banner-title">MCQ Import</h2>
        </div>
      </div>

      <div className="admin-card" style={{ padding: '24px' }}>
        {error && <div className="alert-box alert-error" style={{ marginBottom: '16px', padding: '10px 12px' }}>{error}</div>}
        <div className="form-group">
          <label className="form-label">Select Course</label>
          <select className="form-input" value={courseId} onChange={(event) => { setCourseId(event.target.value); setValidation(null); }}>
            <option value="">Select a course</option>
            {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Upload CSV</label>
          <input type="file" accept=".csv" onChange={(event) => { setFile(event.target.files?.[0] || null); setValidation(null); setResult(null); }} />
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button type="button" className="action-btn-secondary" onClick={() => massEnrollmentService.downloadTemplate('question_bank')}>
            <Icon name="download" /> Download Sample Template
          </button>
          <button type="button" className="action-btn-primary" disabled={busy || !file || !courseId} onClick={validate}>
            <Icon name="check-square" /> Validate
          </button>
        </div>
      </div>

      {validation && !result && (
        <div className="admin-card" style={{ padding: '24px', marginTop: '20px' }}>
          <h3>Validation Preview</h3>
          <p>{validation.valid_count} valid, {validation.invalid_count} invalid, {validation.duplicate_count} duplicate rows.</p>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%' }}>
              <thead><tr><th>Row</th><th>Question</th><th>Subject</th><th>Topic</th><th>Sub-topic</th><th>Answer</th><th>Normalized Answer</th><th>Type</th><th>Matched Course</th><th>Matched Day</th><th>Matched Learning Unit</th><th>Status</th></tr></thead>
              <tbody>{validation.rows.map((row) => (
                <tr key={row.row_index}>
                  <td>{row.row_index}</td>
                  <td>{row.data.question || '-'}</td>
                  <td>{row.data.subject_name || '-'}</td>
                  <td>{row.data.topic_name || '-'}</td>
                  <td>{row.data.sub_topic_name || '-'}</td>
                  <td>{row.data.answer || '-'}</td>
                  <td>{row.data.resolved_normalized_answer || '-'}</td>
                  <td>{row.data.resolved_question_type || '-'}</td>
                  <td>{row.data.resolved_learning_unit_id ? selectedCourse?.title : '—'}</td>
                  <td>{row.data.resolved_course_day_number ? `Day ${row.data.resolved_course_day_number}` : '—'}</td>
                  <td>{row.data.resolved_learning_unit_title || '—'}</td>
                  <td style={{ color: row.status === 'valid' ? '#047857' : '#B91C1C' }}>
                    {row.status === 'valid' ? '✓' : `✗ ${row.errors?.join(' ') || 'Not mapped'}`}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ marginTop: '16px' }}>
            <button type="button" className="action-btn-primary" disabled={busy || validation.invalid_count > 0 || validation.duplicate_count > 0 || validation.valid_count === 0} onClick={importRows}>
              <Icon name="upload" /> Import {validation.valid_count} MCQs
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="admin-card" style={{ padding: '24px', marginTop: '20px' }}>
          <h3>Import Complete</h3>
          <p>{result.successful_count} MCQs imported into {selectedCourse?.title || 'the selected course'}.</p>
        </div>
      )}
    </div>
  );
}
