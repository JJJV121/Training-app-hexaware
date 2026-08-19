import { useState, useEffect } from 'react';
import Icon from '../../components/Icon';
import batchService from '../../services/batchService';
import adminUserService from '../../services/adminUserService';
import adminCourseService from '../../services/adminCourseService';

export default function AdminCourseAssignment() {
  const [toastMsg, setToastMsg] = useState(null);

  // API State
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form states for making a new assignment
  const [assignType, setAssignType] = useState('Batch'); // 'Batch' or 'Trainee'
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedTraineeId, setSelectedTraineeId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [batchesData, traineesData, coursesData] = await Promise.all([
        batchService.getBatches(),
        adminUserService.getTrainees(),
        adminCourseService.getCourses()
      ]);

      setCourses(coursesData);
      setBatches(batchesData.batches || []);
      setTrainees(traineesData);

      // Default dropdown values
      if (coursesData.length > 0) setSelectedCourseId(coursesData[0].id);
      if (batchesData.batches?.length > 0) setSelectedBatchId(batchesData.batches[0].id);
      if (traineesData.length > 0) setSelectedTraineeId(traineesData[0].id);

      // Compute active allocations
      const activeAllocations = [];

      // 1. Existing batch course assignments
      (batchesData.batches || []).forEach(b => {
        if (b.course_id) {
          activeAllocations.push({
            id: `batch_${b.id}`,
            targetId: b.id,
            targetName: b.name,
            type: 'Batch',
            courseId: b.course_id,
            collegeName: b.college_name || 'Hexaware Academy'
          });
        }
      });

      // 2. Trainee allocations
      traineesData.forEach(t => {
        if (t.course_id) {
          activeAllocations.push({
            id: `trainee_${t.id}`,
            targetId: t.id,
            targetName: t.name || 'Unnamed Trainee',
            type: 'Trainee',
            courseId: t.course_id,
            collegeName: t.college_name || t.college || 'Hexaware Academy'
          });
        }
      });

      setAssignments(activeAllocations);
    } catch (err) {
      console.error('Failed to load allocations:', err);
      setError('Could not retrieve allocations data.');
    } finally {
      setLoading(false);
    }
  };

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) {
      alert('Please select a course.');
      return;
    }

    setSubmitting(true);
    try {
      if (assignType === 'Batch') {
        const batch = batches.find(b => b.id === Number(selectedBatchId));
        if (!batch) throw new Error('Batch not found');

        const payload = {
          name: batch.name,
            course_id: Number(selectedCourseId)
        };

        await batchService.updateBatch(batch.id, payload);
        triggerToast(`Course assigned successfully to batch ${batch.name}`);
      } else {
        const student = trainees.find(t => t.id === Number(selectedTraineeId));
        if (!student) throw new Error('Student not found');

        const payload = {
          name: student.name,
          email: student.email,
            course_id: Number(selectedCourseId)
        };

        await adminUserService.updateTrainee(student.id, payload);
        triggerToast(`Course assigned successfully to student ${student.name}`);
      }
      loadData();
    } catch (err) {
      console.error('Failed to assign course:', err);
      alert(err.response?.data?.detail || 'Failed to assign course.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassign = async (allocation) => {
    if (confirm(`Remove course allocation for ${allocation.targetName}?`)) {
      try {
        if (allocation.type === 'Batch') {
          const batch = batches.find(b => b.id === allocation.targetId);
          if (batch) {
            const payload = {
              name: batch.name,
              course_id: null
            };
            await batchService.updateBatch(batch.id, payload);
          }
        } else {
          const student = trainees.find(t => t.id === allocation.targetId);
          if (student) {
            const payload = {
              name: student.name,
              email: student.email,
              course_id: null
            };
            await adminUserService.updateTrainee(student.id, payload);
          }
        }
        triggerToast('Allocation removed successfully.');
        loadData();
      } catch (err) {
        console.error('Failed to remove allocation:', err);
        alert(err.response?.data?.detail || 'Failed to remove allocation.');
      }
    }
  };

  const getCourseTitle = (courseId) => {
    const c = courses.find(course => course.id === courseId);
    return c ? c.title : 'Unassigned';
  };

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
          <span className="admin-banner-subtitle">TRAINEE & BATCH COURSE ALLOCATION</span>
          <h2 className="admin-banner-title">Course Assignment Module</h2>
        </div>
      </div>

      {error && (
        <div className="admin-card" style={{ padding: '20px', borderColor: 'var(--accent-red)', backgroundColor: '#fff5f5', color: '#c53030' }}>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-medium)' }}>
          <div className="loading-spinner" style={{ border: '3px solid #f3f3f3', borderTop: '3px solid var(--primary-blue)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }}></div>
          <span>Loading course allocations from database...</span>
        </div>
      ) : (
        <div className="admin-dashboard-row">
          
          {/* Active Assignments List */}
          <div className="admin-table-container">
            <div className="admin-card-header" style={{ padding: '20px 20px 0 20px' }}>
              <h3 className="admin-card-title">
                <Icon name="activity" className="admin-card-title-icon" />
                <span>Active Course Allocations</span>
              </h3>
            </div>
            <table className="admin-table" style={{ marginTop: '16px' }}>
              <thead>
                <tr>
                  <th>Target & Type</th>
                  <th>Course Name</th>
                  <th>College Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length > 0 ? (
                  assignments.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{a.targetName}</span>
                          <span className={`admin-badge ${a.type === 'Trainee' ? 'orange' : 'blue'}`} style={{ fontSize: '10px', width: 'fit-content' }}>
                            {a.type} Level
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{getCourseTitle(a.courseId)}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>🏛️ {a.collegeName || 'Hexaware Academy'}</span>
                      </td>
                      <td>
                        <button className="row-action-btn delete" title="Remove Allocation" onClick={() => handleUnassign(a)}>
                          <Icon name="trash-2" style={{ width: '14px', height: '14px' }} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-light)' }}>
                      No active course assignments.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Allocate Form Widget */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">
                <Icon name="sliders" className="admin-card-title-icon" />
                <span>Assign Course</span>
              </h3>
            </div>

            <form onSubmit={handleAssign} className="modal-form">
              {/* Allocation Target Toggle */}
              <div className="form-group">
                <label className="form-label">Allocation Scope</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className={assignType === 'Batch' ? 'action-btn-primary' : 'action-btn-secondary'}
                    style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                    onClick={() => setAssignType('Batch')}
                  >
                    🏢 Existing Batch
                  </button>
                  <button
                    type="button"
                    className={assignType === 'Trainee' ? 'action-btn-primary' : 'action-btn-secondary'}
                    style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                    onClick={() => setAssignType('Trainee')}
                  >
                    👨‍🎓 Trainee Course Assigning
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Select Course</label>
                <select className="form-input" value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              {assignType === 'Batch' ? (
                <div className="form-group">
                  <label className="form-label">Select Target Batch</label>
                  <select className="form-input" value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)}>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Select Trainee / Student</label>
                  <select className="form-input" value={selectedTraineeId} onChange={(e) => setSelectedTraineeId(e.target.value)}>
                    {trainees.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.college || 'Hexaware Academy'})</option>
                    ))}
                  </select>
                </div>
              )}

              <button type="submit" className="action-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} disabled={submitting}>
                {submitting ? 'Assigning...' : `Assign Course to ${assignType}`}
              </button>
            </form>
          </div>

        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
