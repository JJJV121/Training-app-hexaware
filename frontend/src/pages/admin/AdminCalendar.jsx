import { useState, useEffect } from 'react';
import Icon from '../../components/Icon';
import apiClient from '../../services/apiClient';
import batchService from '../../services/batchService';
import adminUserService from '../../services/adminUserService';

export default function AdminCalendar() {
  const [toastMsg, setToastMsg] = useState(null);
  const [selectedDay, setSelectedDay] = useState(15); // July 15, 2026 by default
  const [isModalOpen, setIsModalOpen] = useState(false);

  // API State
  const [events, setEvents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form Fields for scheduling a new event
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState('Session');
  const [formDay, setFormDay] = useState(15);
  const [formTime, setFormTime] = useState('09:00 AM');
  const [formBatchId, setFormBatchId] = useState('');
  const [formTrainerId, setFormTrainerId] = useState('');

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [sessionsRes, batchesRes, trainersRes] = await Promise.all([
        apiClient.get('/api/trainer/sessions/all'),
        batchService.getBatches(),
        adminUserService.getTrainers()
      ]);

      const batchesList = batchesRes.batches || [];
      setBatches(batchesList);
      setTrainers(trainersRes);

      if (batchesList.length > 0) setFormBatchId(batchesList[0].id);
      if (trainersRes.length > 0) setFormTrainerId(trainersRes[0].id);

      // Map LiveSession items into Calendar events
      const mappedEvents = (sessionsRes.data || []).map(session => {
        const date = new Date(session.start_time);
        const isJuly2026 = date.getFullYear() === 2026 && date.getMonth() === 6; // 6 is July

        const batch = batchesList.find(b => b.id === session.batch_id)?.name || `Batch #${session.batch_id}`;
        const trainerName = trainersRes.find(t => t.id === session.trainer_id)?.name || `Trainer #${session.trainer_id}`;

        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        return {
          id: session.id,
          day: isJuly2026 ? date.getDate() : undefined,
          type: session.session_type === 'ONLINE' ? 'Session' : 'Session',
          title: session.title,
          batch: batch,
          time: timeStr,
          trainer: trainerName,
          color: 'blue'
        };
      });

      setEvents(mappedEvents);
    } catch (err) {
      console.error('Failed to load calendar events:', err);
      setError('Could not retrieve calendar timetables.');
    } finally {
      setLoading(false);
    }
  };

  const parseDateTime = (day, timeStr) => {
    const cleanTime = timeStr.trim();
    const match = cleanTime.match(/^(\d{2}):(\d{2})\s*(AM|PM)$/i);
    let hours = 9;
    let minutes = 0;
    if (match) {
      hours = parseInt(match[1]);
      minutes = parseInt(match[2]);
      const ampm = match[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
    }
    // July is month index 6 (0-indexed)
    const dateObj = new Date(2026, 6, day, hours, minutes);
    return dateObj;
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!formTitle || !formBatchId || !formTrainerId) {
      alert('Please fill out all fields.');
      return;
    }

    setSubmitting(true);
    try {
      const startTime = parseDateTime(parseInt(formDay), formTime);
      const endTime = new Date(startTime.getTime() + 90 * 60 * 1000); // Default 1.5 hours duration

      const payload = {
        title: formTitle,
        description: `Training session for July ${formDay}`,
        session_type: 'ONLINE',
        batch_id: Number(formBatchId),
        trainer_id: Number(formTrainerId),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        meeting_link: 'https://zoom.us/j/123456789'
      };

      await apiClient.post('/api/trainer/sessions', payload);
      triggerToast(`Scheduled "${formTitle}" successfully.`);
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to schedule session:', err);
      alert(err.response?.data?.detail || 'Failed to schedule session. Verify database status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (confirm('Cancel this scheduled training session?')) {
      try {
        await apiClient.delete(`/api/trainer/sessions/${id}`);
        triggerToast('Event cancelled successfully.');
        loadData();
      } catch (err) {
        console.error('Failed to delete session:', err);
        alert(err.response?.data?.detail || 'Failed to cancel session.');
      }
    }
  };

  // Generate calendar days for July 2026 (starts on a Wednesday)
  const padDays = [28, 29, 30]; // preceding June days
  const julyDays = Array.from({ length: 31 }, (_, i) => i + 1);

  const selectedDayEvents = events.filter(e => e.day === selectedDay);

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
          <span className="admin-banner-subtitle">SCHEDULING & TIMELINES</span>
          <h2 className="admin-banner-title">Calendar & Session Scheduler</h2>
        </div>
        <div className="admin-banner-right">
          <button className="admin-banner-btn" onClick={() => setIsModalOpen(true)}>
            <Icon name="plus" style={{ width: '16px', height: '16px' }} />
            <span>Create Event</span>
          </button>
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
          <span>Loading schedules...</span>
        </div>
      ) : (
        <div className="split-view-container">
          
          {/* Month Calendar Grid */}
          <div className="admin-card" style={{ gap: '16px' }}>
            <div className="admin-card-header">
              <span style={{ fontFamily: 'var(--font-family-header)', fontSize: '18px', fontWeight: 800 }}>July 2026</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="row-action-btn" disabled>&lt;</button>
                <button className="row-action-btn" disabled>&gt;</button>
              </div>
            </div>

            <div className="calendar-grid-header">
              <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>

            <div className="calendar-month-grid">
              {/* Preceding June Days */}
              {padDays.map((d, i) => (
                <div key={`pad-${i}`} className="calendar-day-cell inactive">
                  <span className="calendar-day-number">{d}</span>
                </div>
              ))}

              {/* July Days */}
              {julyDays.map(d => {
                const dayEvents = events.filter(e => e.day === d);
                const isSelected = selectedDay === d;

                return (
                  <div 
                    key={`day-${d}`} 
                    className="calendar-day-cell"
                    style={{ 
                      cursor: 'pointer',
                      outline: isSelected ? '2px solid var(--primary-blue)' : 'none',
                      zIndex: isSelected ? '10' : '1'
                    }}
                    onClick={() => setSelectedDay(d)}
                  >
                    <span className="calendar-day-number" style={{ color: isSelected ? 'var(--primary-blue)' : '' }}>{d}</span>
                    <div className="calendar-day-events">
                      {dayEvents.map(e => (
                        <span key={e.id} className={`calendar-event-pill ${e.color}`} title={e.title}>
                          {e.title}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day Agenda details panel */}
          <div className="details-side-panel">
            <div className="admin-card">
              <div className="details-card-header" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-medium)', fontWeight: 700 }}>AGENDA TIMELINE</span>
                <h3 className="details-name">July {selectedDay}, 2026</h3>
              </div>

              <div className="widget-list" style={{ marginTop: '0' }}>
                {selectedDayEvents.length > 0 ? (
                  selectedDayEvents.map(e => (
                    <div key={e.id} className="widget-item-row" style={{ borderLeft: `3px solid var(--accent-blue)`, paddingLeft: '12px' }}>
                      <div className="widget-item-left">
                        <div className="widget-item-info">
                          <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: `var(--primary-blue)` }}>
                            {e.type}
                          </span>
                          <span className="widget-item-title" style={{ fontSize: '13px' }}>{e.title}</span>
                          <span className="widget-item-desc" style={{ fontSize: '11px' }}>{e.batch} • {e.trainer}</span>
                        </div>
                      </div>
                      <div className="widget-item-right" style={{ justifyContent: 'space-between', height: '100%' }}>
                        <span className="widget-time" style={{ fontSize: '11px' }}>{e.time}</span>
                        <button 
                          className="row-action-btn delete" 
                          style={{ width: '22px', height: '22px', borderRadius: '4px', border: 'none', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                          title="Cancel Event"
                          onClick={() => handleDeleteEvent(e.id)}
                        >
                          <Icon name="trash-2" style={{ width: '11px', height: '11px' }} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-light)' }}>
                    <Icon name="calendar" style={{ width: '32px', height: '32px', marginBottom: '8px', opacity: 0.5 }} />
                    <p style={{ fontSize: '12px' }}>No sessions scheduled for this day.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Create Event Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">Schedule New Event</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <Icon name="plus" style={{ transform: 'rotate(45deg)', width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="modal-form">
              <div className="form-group">
                <label className="form-label">Event Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Docker Integration Lecture"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Event Category</label>
                  <select className="form-input" value={formType} onChange={(e) => setFormType(e.target.value)}>
                    <option value="Session">Training Session</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">July Date (1-31)</label>
                  <input type="number" min="1" max="31" className="form-input" value={formDay} onChange={(e) => setFormDay(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Time Slot (AM/PM format)</label>
                  <input type="text" className="form-input" placeholder="e.g. 09:00 AM" value={formTime} onChange={(e) => setFormTime(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Batch</label>
                  <select className="form-input" value={formBatchId} onChange={(e) => setFormBatchId(e.target.value)} required>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Conducting Trainer</label>
                <select className="form-input" value={formTrainerId} onChange={(e) => setFormTrainerId(e.target.value)} required>
                  {trainers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.expertise})</option>
                  ))}
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="action-btn-primary" style={{ padding: '8px 16px' }} disabled={submitting}>
                  {submitting ? 'Scheduling...' : 'Schedule Event'}
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
