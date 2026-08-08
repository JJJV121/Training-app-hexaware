import { Fragment } from 'react';
import scheduleService from '../services/scheduleService';
import Icon from '../components/Icon';

export default function Schedule() {
  const data = scheduleService.getScheduleData();

  const handleShare = () => {
    alert('Sharing schedule schedule_export.json link copied!');
  };

  const handleExport = () => {
    alert('Downloading schedule schedule_export.json...');
  };

  return (
    <div className="page-view schedule-container">
      
      {/* Schedule Page Banner */}
      <div className="schedule-banner">
        
        <div className="schedule-banner-left">
          <Icon name="calendar" />
          <h2 className="schedule-banner-title">{data.title}</h2>
        </div>

        <div className="schedule-banner-right">
          <button className="schedule-banner-btn" id="btn-share" onClick={handleShare}>
            <Icon name="share-2" />
            <span>Share</span>
          </button>
          <button className="schedule-banner-btn" id="btn-export" onClick={handleExport}>
            <Icon name="download" />
            <span>Export</span>
          </button>
        </div>

        {/* Statistics Overlay Card */}
        <div className="schedule-stats-card">
          {data.stats.map((stat, index) => (
            <div key={index} className="schedule-stat-item">
              {stat.label !== 'Total Hours/Week' && (
                <div className="schedule-stat-icon-circle" style={{ backgroundColor: stat.color }}></div>
              )}
              <div className="schedule-stat-info">
                <span className="schedule-stat-lbl">{stat.label}</span>
                <span className="schedule-stat-val">{stat.value}</span>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Timetable Outer Wrapper */}
      <div className="timetable-outer-container">
        <div className="timetable-grid">
          
          {/* Table Headers */}
          <div className="timetable-header-cell">
            <Icon name="clock" />
          </div>
          {data.days.map((day, index) => (
            <div key={index} className="timetable-header-cell">{day}</div>
          ))}

          {/* Timetable Rows */}
          {data.timeSlots.map((slot, rowIndex) => {
            // Find events for each day in this timeslot
            return (
              <Fragment key={rowIndex}>
                {/* Time slot indicator cell */}
                <div className="timetable-time-cell">
                  {slot.split('\n').map((line, idx) => (
                    <Fragment key={idx}>
                      {line}
                      {idx < slot.split('\n').length - 1 && <br />}
                    </Fragment>
                  ))}
                </div>

                {/* Day cells */}
                {data.days.map((day, dayIndex) => {
                  const event = data.events.find(e => e.day === day && e.timeSlot === slot);
                  
                  if (event) {
                    return (
                      <div key={dayIndex} className="timetable-grid-cell">
                        <div className={`schedule-event-card ${event.colorClass}`} id={`event-${event.code}-${event.day}`}>
                          <span className="event-type-badge">• {event.type}</span>
                          <h4 className="event-title">{event.title}</h4>
                          <span className="event-code">{event.code}</span>
                          <span className="event-instructor">{event.instructor}</span>
                        </div>
                      </div>
                    );
                  } else {
                    return <div key={dayIndex} className="timetable-grid-cell"></div>;
                  }
                })}
              </Fragment>
            );
          })}

        </div>
      </div>

    </div>
  );
}
