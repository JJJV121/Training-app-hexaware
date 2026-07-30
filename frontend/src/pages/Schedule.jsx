import { Fragment, useEffect, useState } from "react";
import scheduleService from "../services/scheduleService";
import Icon from "../components/Icon";

export default function Schedule() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const userId = Number(localStorage.getItem('logged_in_user_id')) || 1;
        const result = await scheduleService.getScheduleData(userId);
        setData(result);
      } catch (error) {
        console.error("Failed to load schedule:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, []);

  const handleShare = () => {
    alert("Sharing schedule...");
  };

  const handleExport = () => {
    alert("Downloading schedule...");
  };

  if (loading) {
    return (
      <div className="page-view schedule-container">
        <h2>Loading schedule...</h2>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-view schedule-container">
        <h2>No schedule available.</h2>
      </div>
    );
  }

  return (
    <div className="page-view schedule-container">

      {/* Banner */}
      <div className="schedule-banner">

        <div className="schedule-banner-left">
          <Icon name="calendar" />
          <h2 className="schedule-banner-title">{data.title}</h2>
        </div>

        <div className="schedule-banner-right">
          <button
            className="schedule-banner-btn"
            id="btn-share"
            onClick={handleShare}
          >
            <Icon name="share-2" />
            <span>Share</span>
          </button>

          <button
            className="schedule-banner-btn"
            id="btn-export"
            onClick={handleExport}
          >
            <Icon name="download" />
            <span>Export</span>
          </button>
        </div>

        {/* Stats */}
        <div className="schedule-stats-card">
          {data.stats.map((stat, index) => (
            <div key={index} className="schedule-stat-item">
              {stat.label !== "Total Hours" && (
                <div
                  className="schedule-stat-icon-circle"
                  style={{ backgroundColor: stat.color }}
                />
              )}

              <div className="schedule-stat-info">
                <span className="schedule-stat-lbl">{stat.label}</span>
                <span className="schedule-stat-val">{stat.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timetable */}
      <div className="timetable-outer-container">
        <div className="timetable-grid">

          {/* Header */}
          <div className="timetable-header-cell">
            <Icon name="clock" />
          </div>

          {data.days.map((day, index) => {
            let statusColorClass = "";
            let emoji = "🔵";
            if (day.status === "completed") {
              statusColorClass = "status-completed";
              emoji = "🟢";
            } else if (day.status === "current") {
              statusColorClass = "status-in-progress";
              emoji = "🟡";
            } else {
              statusColorClass = "status-upcoming";
              emoji = "🔵";
            }
            return (
              <div key={index} className={`timetable-header-cell ${statusColorClass}`} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: "800" }}>{emoji} {day.name}</span>
                <span style={{ fontSize: "8px", opacity: 0.8, fontWeight: "normal", textTransform: "uppercase" }}>
                  {day.status === "completed" ? "Completed" : day.status === "current" ? "In Progress" : "Yet to be Done"}
                </span>
              </div>
            );
          })}

          {/* Rows */}
          {data.timeSlots.map((slot, rowIndex) => (
            <Fragment key={rowIndex}>

              {/* Time Column */}
              <div className="timetable-time-cell">
                {slot.split("\n").map((line, idx) => (
                  <Fragment key={idx}>
                    {line}
                    {idx < slot.split("\n").length - 1 && <br />}
                  </Fragment>
                ))}
              </div>

              {/* Events */}
              {data.days.map((day, dayIndex) => {
                const event = data.events.find(
                  (e) =>
                    e.day === day.name &&
                    e.timeSlot === slot
                );

                return (
                  <div
                    key={dayIndex}
                    className="timetable-grid-cell"
                  >
                    {event && (
                      <div
                        className={`schedule-event-card ${event.colorClass}`}
                      >
                        <span className="event-type-badge">
                          • {event.type}
                        </span>

                        <h4 className="event-title">
                          {event.title}
                        </h4>

                        <span className="event-code">
                          {event.code}
                        </span>

                        {event.instructor && (
                          <span className="event-instructor">
                            {event.instructor}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

    </div>
  );
}