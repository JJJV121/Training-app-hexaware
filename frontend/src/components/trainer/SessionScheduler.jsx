import React, { useState, useEffect } from 'react';
import Icon from '../Icon';
import trainerService from '../../services/trainerService';
import apiClient from '../../services/apiClient';

export default function SessionScheduler() {
  const [sessions, setSessions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sessionType, setSessionType] = useState('ONLINE');
  const [batchId, setBatchId] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('09:00 - 10:30');
  const [meetingLink, setMeetingLink] = useState('https://zoom.us/j/123456789');

  // Edit Mode
  const [editSessionId, setEditSessionId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sessionsData, batchesData] = await Promise.all([
        trainerService.getAllSessions(),
        trainerService.getBatches()
      ]);
      setSessions(sessionsData);
      setBatches(batchesData);
      if (batchesData.length > 0) {
        setBatchId(batchesData[0].id);
      }
    } catch (err) {
      console.error('Failed to load trainer schedule:', err);
      setError('Could not retrieve scheduled sessions.');
    } finally {
      setLoading(false);
    }
  };

  const parseDateTimeRange = (dateStr, slot) => {
    // slot is like "09:00 - 10:30"
    const [start, end] = slot.split('-').map(s => s.trim());
    const [startH, startM] = start.split(':');
    const [endH, endM] = end.split(':');

    const [yr, mo, dy] = dateStr.split('-');
    
    // Construct local datetimes
    const startObj = new Date(Number(yr), Number(mo) - 1, Number(dy), Number(startH), Number(startM));
    const endObj = new Date(Number(yr), Number(mo) - 1, Number(dy), Number(endH), Number(endM));

    return {
      start_time: startObj.toISOString(),
      end_time: endObj.toISOString()
    };
  };

  const handleSaveSession = async (e) => {
    e.preventDefault();
    if (!title || !date || !batchId) {
      alert('Please fill out all fields.');
      return;
    }

    setSubmitting(true);
    try {
      const { start_time, end_time } = parseDateTimeRange(date, timeSlot);
      const payload = {
        title,
        description,
        session_type: sessionType,
        batch_id: Number(batchId),
        start_time,
        end_time,
        meeting_link: meetingLink,
        trainer_id: Number(localStorage.getItem('logged_in_user_id')) || 1
      };

      if (editSessionId) {
        await apiClient.put(`/api/trainer/sessions/${editSessionId}`, payload);
        alert('Session updated successfully.');
      } else {
        await trainerService.createSession(payload);
        alert('Session scheduled successfully.');
      }

      // Reset Form
      setTitle('');
      setDescription('');
      setDate('');
      setMeetingLink('https://zoom.us/j/123456789');
      setEditSessionId(null);
      loadData();
    } catch (err) {
      console.error('Failed to save session:', err);
      alert('Failed to save live session. Verify database status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSession = async (id) => {
    if (confirm('Are you sure you want to cancel and delete this live session?')) {
      try {
        await apiClient.delete(`/api/trainer/sessions/${id}`);
        alert('Session deleted.');
        loadData();
      } catch (err) {
        console.error('Failed to delete session:', err);
        alert('Failed to delete session.');
      }
    }
  };

  const handleOpenEdit = (s) => {
    setEditSessionId(s.id);
    setTitle(s.title);
    setDescription(s.description || '');
    setSessionType(s.session_type);
    setBatchId(s.batch_id);
    
    // Parse start_time to populate date and slot
    const dateObj = new Date(s.start_time);
    const endObj = new Date(s.end_time);
    
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    setDate(`${yyyy}-${mm}-${dd}`);

    const startH = String(dateObj.getHours()).padStart(2, '0');
    const startM = String(dateObj.getMinutes()).padStart(2, '0');
    const endH = String(endObj.getHours()).padStart(2, '0');
    const endM = String(endObj.getMinutes()).padStart(2, '0');
    setTimeSlot(`${startH}:${startM} - ${endH}:${endM}`);
    
    setMeetingLink(s.meeting_link || '');
  };

  if (loading) {
    return (
      <div className="batch-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>Loading Scheduler...</div>
      </div>
    );
  }

  return (
    <div className="batch-container">
      {/* Banner */}
      <div className="batch-banner">
        <div className="batch-banner-left">
          <h2>Live Lecture & Webinar Scheduler</h2>
          <p>Schedule new interactive video webinars and manage active virtual labs for your assigned batches.</p>
        </div>
      </div>

      <div className="split-view-container" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', marginTop: '24px' }}>
        {/* Left Side: Sessions Directory */}
        <div className="admin-table-container">
          <div className="trainee-table-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-dark)' }}>My Scheduled Live Sessions</h3>
          </div>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)', fontSize: '14px' }}>
                No active training sessions scheduled yet.
              </div>
            ) : (
              sessions.map(s => {
                const dateStr = new Date(s.start_time).toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
                const startTimeStr = new Date(s.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const endTimeStr = new Date(s.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const batchName = batches.find(b => b.id === s.batch_id)?.name || `Batch ID: ${s.batch_id}`;

                return (
                  <div key={s.id} className="session-item" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div className="session-icon-wrap" style={{ backgroundColor: 'rgba(53, 99, 233, 0.1)', color: '#3563e9', padding: '10px', borderRadius: '50%' }}>
                        <Icon name="video" style={{ width: '22px', height: '22px' }} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '4px' }}>{s.title}</h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-medium)', marginBottom: '6px' }}>{s.description}</p>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-light)' }}>
                          <span>📅 {dateStr}</span>
                          <span>⏰ {startTimeStr} - {endTimeStr}</span>
                          <span style={{ color: 'var(--primary-blue)', fontWeight: 700 }}>🏷️ {batchName}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                      {s.meeting_link && (
                        <a 
                          href={s.meeting_link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="admin-badge blue"
                          style={{ fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Icon name="link" style={{ width: '12px', height: '12px' }} />
                          Join Webinar
                        </a>
                      )}
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="row-action-btn" 
                          title="Edit Session" 
                          onClick={() => handleOpenEdit(s)}
                          style={{ padding: '6px' }}
                        >
                          <Icon name="edit-3" style={{ width: '14px', height: '14px' }} />
                        </button>
                        <button 
                          className="row-action-btn delete" 
                          title="Cancel Session" 
                          onClick={() => handleDeleteSession(s.id)}
                          style={{ padding: '6px' }}
                        >
                          <Icon name="trash-2" style={{ width: '14px', height: '14px' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Scheduler Form */}
        <div className="review-blade-card" style={{ padding: '24px', backgroundColor: 'var(--bg-card)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '16px' }}>
            {editSessionId ? 'Modify Scheduled Session' : 'Schedule Training Lecture'}
          </h3>

          <form onSubmit={handleSaveSession} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Lecture/Webinar Title</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Intro to Spring Boot Security"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Brief Description</label>
              <textarea 
                className="form-input" 
                placeholder="Details about syllabus coverage..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ minHeight: '60px', padding: '8px', fontFamily: 'inherit' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Select Target Batch</label>
              <select 
                className="form-input" 
                value={batchId} 
                onChange={(e) => setBatchId(e.target.value)} 
                required
              >
                {batches.length === 0 ? (
                  <option value="">No Assigned Batches</option>
                ) : (
                  batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.course_name})</option>
                  ))
                )}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Choose Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                required 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Session Type</label>
                <select className="form-input" value={sessionType} onChange={(e) => setSessionType(e.target.value)}>
                  <option value="ONLINE">ONLINE (Zoom/Teams)</option>
                  <option value="OFFLINE">OFFLINE (Lab/Class)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Time Slot</label>
                <select className="form-input" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)}>
                  <option value="09:00 - 10:30">09:00 AM - 10:30 AM</option>
                  <option value="10:45 - 12:15">10:45 AM - 12:15 PM</option>
                  <option value="14:15 - 15:45">02:15 PM - 03:45 PM</option>
                  <option value="16:00 - 17:30">04:00 PM - 05:30 PM</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Webinar / Zoom Meeting Link</label>
              <input 
                type="url" 
                className="form-input" 
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://zoom.us/j/..."
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              {editSessionId && (
                <button 
                  type="button" 
                  className="action-btn-secondary" 
                  style={{ flex: 1, padding: '10px' }} 
                  onClick={() => {
                    setEditSessionId(null);
                    setTitle('');
                    setDescription('');
                    setDate('');
                  }}
                >
                  Cancel Edit
                </button>
              )}
              <button 
                type="submit" 
                className="action-btn-primary" 
                style={{ flex: 2, padding: '10px', justifyContent: 'center' }} 
                disabled={submitting}
              >
                {submitting ? 'Saving...' : editSessionId ? 'Update Session' : 'Schedule Webinar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
