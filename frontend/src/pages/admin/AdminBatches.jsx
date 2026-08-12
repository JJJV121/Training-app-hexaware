import { useState, useEffect } from 'react';
import Icon from '../../components/Icon';
import batchService from '../../services/batchService';
import adminCourseService from '../../services/adminCourseService';
import adminUserService from '../../services/adminUserService';
import trainerMockService from '../../services/trainerMockService';

export default function AdminBatches() {
  const [toastMsg, setToastMsg] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editBatch, setEditBatch] = useState(null);

  // API State
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [allTrainees, setAllTrainees] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState('All');
  const colleges = adminUserService.getColleges();

  // Form inputs
  const [formCode, setFormCode] = useState('');
  const [formCollege, setFormCollege] = useState('');
  const [formCourseId, setFormCourseId] = useState('');
  const [formTrainerId, setFormTrainerId] = useState('');
  const [formTraineeIds, setFormTraineeIds] = useState([]);
  const [formStrength, setFormStrength] = useState(30);
  const [formTiming, setFormTiming] = useState('09:00:00');
  const [formEndTime, setFormEndTime] = useState('11:00:00');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-08-30');
  const [formSchedule, setFormSchedule] = useState('Mon, Wed, Fri');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [batchesData, coursesData, traineesData] = await Promise.all([
        batchService.getBatches(),
        adminCourseService.getCourses(),
        adminUserService.getTrainees()
      ]);
      
      const trainersData = trainerMockService.getTrainers();
      setCourses(coursesData);
      setAllTrainees(traineesData);
      setTrainers(trainersData);

      // Enrich batches with college metadata (from mock registry) and trainee IDs
      const enrichedBatches = (batchesData.batches || []).map(b => {
        const storedTrainees = JSON.parse(localStorage.getItem(`batch_trainees_${b.id}`) || '[]');
        return {
          ...b,
          college: localStorage.getItem(`batch_college_${b.id}`) || colleges[0],
          trainees: storedTrainees,
          strength: b.max_strength, // capacity
          timing: `${b.start_time || '09:00:00'} - ${b.end_time || '11:00:00'}`
        };
      });

      setBatches(enrichedBatches);
    } catch (err) {
      console.error('Failed to load batch data:', err);
      setError('Could not retrieve batches. Please check backend status.');
    } finally {
      setLoading(false);
    }
  };

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditBatch(null);
    setFormCode('');
    setFormCollege(colleges[0] || 'IIT Madras');
    setFormCourseId(courses[0]?.id || '');
    setFormTrainerId(trainers[0]?.id || '');
    setFormTraineeIds([]);
    setFormStrength(30);
    setFormTiming('09:00:00');
    setFormEndTime('11:00:00');
    setStartDate('2026-08-01');
    setEndDate('2026-08-30');
    setFormSchedule('Mon, Wed, Fri');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (batch) => {
    setEditBatch(batch);
    setFormCode(batch.name);
    setFormCollege(batch.college);
    setFormCourseId(batch.course_id || '');
    setFormTrainerId(batch.trainer_id || '');
    setFormTraineeIds(batch.trainees || []);
    setFormStrength(batch.max_strength);
    setFormTiming(batch.start_time || '09:00:00');
    setFormEndTime(batch.end_time || '11:00:00');
    setStartDate(batch.start_date || '2026-08-01');
    setEndDate(batch.end_date || '2026-08-30');
    setFormSchedule('Mon, Wed, Fri');
    setIsModalOpen(true);
  };

  const toggleTraineeSelection = (id) => {
    if (formTraineeIds.includes(id)) {
      setFormTraineeIds(formTraineeIds.filter(tid => tid !== id));
    } else {
      setFormTraineeIds([...formTraineeIds, id]);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this batch? This will affect attendance records and student groups.')) {
      try {
        await batchService.deleteBatch(id);
        localStorage.removeItem(`batch_trainees_${id}`);
        localStorage.removeItem(`batch_college_${id}`);
        triggerToast('Batch deleted successfully.');
        loadData();
      } catch (err) {
        console.error('Failed to delete batch:', err);
        alert(err.response?.data?.detail || 'Failed to delete batch.');
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formCode || !formCourseId || !formCollege) {
      alert('Please fill out all fields.');
      return;
    }

    setSubmitting(true);
    const payload = {
      name: formCode,
      course_id: Number(formCourseId),
      trainer_id: formTrainerId ? Number(formTrainerId) : null,
      start_date: startDate,
      end_date: endDate,
      start_time: formTiming,
      end_time: formEndTime,
      max_strength: Number(formStrength),
      status: 'UPCOMING'
    };

    try {
      if (editBatch) {
        await batchService.updateBatch(editBatch.id, payload);
        
        // Update batch trainees
        const prevTrainees = JSON.parse(localStorage.getItem(`batch_trainees_${editBatch.id}`) || '[]');
        const toAdd = formTraineeIds.filter(id => !prevTrainees.includes(id));
        const toRemove = prevTrainees.filter(id => !formTraineeIds.includes(id));

        if (toAdd.length > 0) {
          await batchService.addTraineesToBatch(editBatch.id, toAdd);
        }
        for (const tid of toRemove) {
          await batchService.removeTraineeFromBatch(editBatch.id, tid);
        }

        localStorage.setItem(`batch_trainees_${editBatch.id}`, JSON.stringify(formTraineeIds));
        localStorage.setItem(`batch_college_${editBatch.id}`, formCollege);
        triggerToast('Batch updated successfully.');
      } else {
        const response = await batchService.createBatch(payload);
        const newBatch = response.batch;
        
        if (formTraineeIds.length > 0) {
          await batchService.addTraineesToBatch(newBatch.id, formTraineeIds);
        }

        localStorage.setItem(`batch_trainees_${newBatch.id}`, JSON.stringify(formTraineeIds));
        localStorage.setItem(`batch_college_${newBatch.id}`, formCollege);
        triggerToast('Batch created successfully.');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to save batch:', err);
      alert(err.response?.data?.detail || 'Failed to save batch structure.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCourseTitle = (courseId) => {
    const c = courses.find(course => course.id === courseId);
    return c ? c.title : 'Unassigned';
  };

  const getTrainerName = (trainerId) => {
    const t = trainers.find(tr => tr.id === trainerId);
    return t ? t.name : 'Unassigned';
  };

  const getTraineeName = (traineeId) => {
    const s = allTrainees.find(student => student.id === traineeId);
    return s ? s.name : 'Unknown';
  };

  const filteredBatches = batches.filter(b => {
    if (selectedCollegeFilter === 'All') return true;
    return b.college === selectedCollegeFilter;
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
          <span className="admin-banner-subtitle">COLLEGE-BASED BATCH & TRAINER-TRAINEE FORMATION</span>
          <h2 className="admin-banner-title">Batch Management Module</h2>
        </div>
        <div className="admin-banner-right">
          <button className="admin-banner-btn" onClick={handleOpenAdd}>
            <Icon name="plus" style={{ width: '16px', height: '16px' }} />
            <span>Create College Batch</span>
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="admin-card" style={{ padding: '20px', borderColor: 'var(--accent-red)', backgroundColor: '#fff5f5', color: '#c53030' }}>
          <p>{error}</p>
        </div>
      )}

      {/* Filter Bar */}
      <div className="admin-card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="sliders" style={{ width: '18px', height: '18px', color: 'var(--primary-blue)' }} />
            <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-dark)' }}>Filter by College:</span>
          </div>
          <select 
            className="form-input" 
            style={{ width: '220px', padding: '6px 12px', fontSize: '13px' }}
            value={selectedCollegeFilter}
            onChange={(e) => setSelectedCollegeFilter(e.target.value)}
          >
            <option value="All">All Colleges ({colleges.length})</option>
            {colleges.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <span style={{ fontSize: '12px', color: 'var(--text-medium)', marginLeft: 'auto' }}>
            Showing {filteredBatches.length} of {batches.length} Batches
          </span>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-medium)' }}>
          <div className="loading-spinner" style={{ border: '3px solid #f3f3f3', borderTop: '3px solid var(--primary-blue)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }}></div>
          <span>Loading batches catalog from Neon database...</span>
        </div>
      ) : (
        /* Grid of Batch Cards */
        <div className="admin-stats-grid-9" style={{ marginTop: '0', gridTemplateColumns: 'repeat( auto-fit, minmax(320px, 1fr) )' }}>
          {filteredBatches.length > 0 ? (
            filteredBatches.map(b => (
              <div key={b.id} className="admin-card" style={{ gap: '14px' }}>
                <div className="admin-card-header">
                  <div>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary-blue)', fontFamily: 'var(--font-family-header)' }}>
                      {b.name}
                    </span>
                    <span className="admin-badge blue" style={{ fontSize: '10px', marginLeft: '8px' }}>
                      🏛️ {b.college || 'Hexaware College'}
                    </span>
                  </div>
                  <span className="admin-badge green" style={{ fontSize: '10px' }}>
                    {b.max_strength} Capacity
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)' }}>Course: {getCourseTitle(b.course_id)}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-medium)', fontWeight: 600 }}>👨‍🏫 Lead Trainer: <strong>{getTrainerName(b.trainer_id)}</strong></span>
                </div>

                {/* Assigned Trainees */}
                <div style={{ backgroundColor: 'var(--bg-card-subtle)', padding: '10px', borderRadius: '6px', fontSize: '11px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>
                    👨‍🎓 Trainee Batch Allocation ({b.trainees?.length || 0}):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {b.trainees && b.trainees.length > 0 ? (
                      b.trainees.map((tid) => (
                        <span key={tid} className="admin-badge blue" style={{ fontSize: '10px' }}>{getTraineeName(tid)}</span>
                      ))
                    ) : (
                      <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>No trainees assigned yet</span>
                    )}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--text-medium)' }}>
                  <span>📅 Timetable: <strong>{b.start_date} to {b.end_date}</strong></span>
                  <span>⏰ Timings: <strong>{b.timing}</strong></span>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button className="row-action-btn" title="Modify Batch & Formation" onClick={() => handleOpenEdit(b)}>
                    <Icon name="edit-3" style={{ width: '14px', height: '14px' }} />
                  </button>
                  <button className="row-action-btn delete" title="Delete Batch" onClick={() => handleDelete(b.id)}>
                    <Icon name="trash-2" style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '48px', color: 'var(--text-light)' }}>
              No batches found. Establish a new college batch.
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editBatch ? 'Edit Batch & Trainee Formation' : 'Establish New College Batch'}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <Icon name="plus" style={{ transform: 'rotate(45deg)', width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Batch Code Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Select College</label>
                  <select className="form-input" value={formCollege} onChange={(e) => setFormCollege(e.target.value)}>
                    {colleges.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Select Course</label>
                <select className="form-input" value={formCourseId} onChange={(e) => setFormCourseId(e.target.value)}>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assign Lead Trainer (Mock)</label>
                <select className="form-input" value={formTrainerId} onChange={(e) => setFormTrainerId(e.target.value)}>
                  {trainers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.expertise})</option>
                  ))}
                </select>
              </div>

              {/* Trainee Batch Formation Selection */}
              <div className="form-group">
                <label className="form-label">Trainee Batch Formation (Select Trainees):</label>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {allTrainees.map(s => (
                    <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={formTraineeIds.includes(s.id)} 
                        onChange={() => toggleTraineeSelection(s.id)}
                      />
                      <span>{s.name} ({s.college || 'General'})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Active Capacity/Strength</label>
                  <input type="number" className="form-input" value={formStrength} onChange={(e) => setFormStrength(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Timings Start</label>
                  <input type="text" className="form-input" placeholder="e.g. 09:00:00" value={formTiming} onChange={(e) => setFormTiming(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Timings End</label>
                  <input type="text" className="form-input" placeholder="e.g. 11:00:00" value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Schedule Days</label>
                  <input type="text" className="form-input" placeholder="e.g. Mon, Wed, Fri" value={formSchedule} onChange={(e) => setFormSchedule(e.target.value)} required />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="action-btn-primary" style={{ padding: '8px 16px' }} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Batch & Formation'}
                </button>
              </div>
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
