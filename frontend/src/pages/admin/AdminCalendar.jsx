import { useState } from 'react';
import Icon from '../../components/Icon';
import mockDataService from '../../services/mockDataService';

export default function AdminCalendar() {
  const [toastMsg, setToastMsg] = useState(null);
  const [selectedDay, setSelectedDay] = useState(15); // July 15, 2026 by default
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load state from mockDataService
  const [events, setEvents] = useState(() => mockDataService.getCalendarEvents());

  // Form Fields for scheduling a new event
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState('Session');
  const [formDay, setFormDay] = useState(15);
  const [formTime, setFormTime] = useState('09:00 AM');
  const [formBatch, setFormBatch] = useState('Batch B21');
  const [formTrainer, setFormTrainer] = useState('Dr. Ava Thompson');

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCreateEvent = (e) => {
    e.preventDefault();
    if (!formTitle) return;

    let color = 'blue';
    if (formType === 'Exam') color = 'red';
    else if (formType === 'Deadline') color = 'orange';
    else if (formType === 'Holiday') color = 'green';

    const newEv = {
      id: Date.now(),
      day: parseInt(formDay),
      type: formType,
      title: formTitle,
      batch: formBatch,
      time: formTime,
      trainer: formTrainer,
      color: color
    };

    const updated = [...events, newEv];
    setEvents(updated);
    mockDataService.saveCalendarEvents(updated);
    setSelectedDay(parseInt(formDay));
    setIsModalOpen(false);
    triggerToast(`Scheduled "${formTitle}" on July ${formDay}`);
  };

  const handleDeleteEvent = (id) => {
    if (confirm('Cancel this scheduled event?')) {
      const updated = events.filter(e => e.id !== id);
      setEvents(updated);
      mockDataService.saveCalendarEvents(updated);
      triggerToast('Event cancelled.');
    }
  };

  // Generate calendar days for July 2026 (starts on a Wednesday)
  // July 2026 has 31 days. Start pad: Wed is index 3 (Sun=0, Mon=1, Tue=2, Wed=3)
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
                  <div key={e.id} className="widget-item-row" style={{ borderLeft: `3px solid var(--accent-${e.color === 'red' ? 'red' : e.color === 'green' ? 'green' : e.color === 'orange' ? 'orange' : 'blue'})`, paddingLeft: '12px' }}>
                    <div className="widget-item-left">
                      <div className="widget-item-info">
                        <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: `var(--accent-${e.color === 'red' ? 'red' : e.color === 'green' ? 'green' : e.color === 'orange' ? 'orange' : 'blue'})` }}>
                          {e.type}
                        </span>
                        <span className="widget-item-title" style={{ fontSize: '13px' }}>{e.title}</span>
                        <span className="widget-item-desc" style={{ fontSize: '11px' }}>{e.batch} â€¢ {e.trainer}</span>
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
                    <option value="Exam">Exam / Test</option>
                    <option value="Deadline">Assignment Deadline</option>
                    <option value="Holiday">Holidays</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">July Date (1-31)</label>
                  <input type="number" min="1" max="31" className="form-input" value={formDay} onChange={(e) => setFormDay(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Time Slot</label>
                  <input type="text" className="form-input" placeholder="e.g. 09:00 AM" value={formTime} onChange={(e) => setFormTime(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Batch</label>
                  <select className="form-input" value={formBatch} onChange={(e) => setFormBatch(e.target.value)}>
                    <option value="Batch B21">Batch B21</option>
                    <option value="Batch B22">Batch B22</option>
                    <option value="Batch B25">Batch B25</option>
                    <option value="All">All Batches</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Conducting Trainer</label>
                <select className="form-input" value={formTrainer} onChange={(e) => setFormTrainer(e.target.value)}>
                  <option value="Dr. Ava Thompson">Dr. Ava Thompson</option>
                  <option value="Prof. Noah Parker">Prof. Noah Parker</option>
                  <option value="Dr. Mason Cooper">Dr. Mason Cooper</option>
                  <option value="Amelia Scott">Amelia Scott</option>
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="action-btn-primary" style={{ padding: '8px 16px' }}>Schedule Event</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
