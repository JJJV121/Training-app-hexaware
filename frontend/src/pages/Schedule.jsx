import { useEffect, useState } from "react";
import scheduleService from "../services/scheduleService";
import Icon from "../components/Icon";

const statusMeta = {
  completed: {
    label: "Completed",
    colorClass: "status-completed",
    emoji: "🟢"
  },
  inprogress: {
    label: "In Progress",
    colorClass: "status-in-progress",
    emoji: "🟡"
  },
  upcoming: {
    label: "Upcoming",
    colorClass: "status-upcoming",
    emoji: "🔵"
  }
};

function getModuleState(session, dayStatus) {
  if (session.completed) return "completed";
  if (dayStatus === "inprogress") return "inprogress";
  return "upcoming";
}

function getModuleStateClass(state) {
  switch (state) {
    case "completed":
      return "module-completed";
    case "inprogress":
      return "module-inprogress";
    default:
      return "module-upcoming";
  }
}

export default function Schedule() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const selectedCourseId = Number(localStorage.getItem("selected_course_id")) || null;

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setLoading(true);
        const userId = Number(localStorage.getItem("logged_in_user_id")) || 1;
        const result = await scheduleService.getScheduleData(userId, currentWeekIndex);
        setData(result);
      } catch (error) {
        console.error("Failed to load schedule:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, [currentWeekIndex, selectedCourseId]);

  const handleShare = () => {
    alert("Sharing schedule...");
  };

  const handleExport = () => {
    alert("Downloading schedule...");
  };

  const maxWeekIndex = Math.max((data?.weeks?.length || 1) - 1, 0);

  const handlePreviousWeek = () => {
    setCurrentWeekIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleNextWeek = () => {
    setCurrentWeekIndex((prev) => Math.min(prev + 1, maxWeekIndex));
  };

  if (loading) {
    return (
      <div className="page-view schedule-container">
        <h2>Loading schedule...</h2>
      </div>
    );
  }

  if (!data?.weeks?.length) {
    return (
      <div className="page-view schedule-container">
        <h2>No schedule available.</h2>
      </div>
    );
  }

  const currentWeek = data.weeks[Math.min(currentWeekIndex, maxWeekIndex)] || data.weeks[0];

  return (
    <div className="page-view schedule-container">
      <div className="schedule-banner">
        <div className="banner-top">
          <div className="schedule-banner-left">
            <Icon name="calendar" />
            <h1 className="schedule-banner-title">Weekly Schedule</h1>
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
        </div>

        <div className="schedule-stats-card">
          {data.stats.map((stat, index) => {
            let iconName = "layers";
            if (stat.label === "Sections") iconName = "layout";
            if (stat.label === "Days") iconName = "calendar";
            if (stat.label === "Total Hours") iconName = "clock";
            
            return (
              <div key={index} className="schedule-stat-item">
                <div className="stat-icon-wrapper">
                  <Icon name={iconName} className="stat-icon" />
                </div>
                <div className="stat-content">
                  <span className="schedule-stat-val">{stat.value}</span>
                  <span className="schedule-stat-lbl">{stat.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="weekly-view-card">
        <div className="weekly-view-heading">
          <div>
            <h3>Weekly course plan</h3>
            <p>Each day shows the assigned modules with a color that reflects its current state.</p>
          </div>
          <div className="schedule-legend">
            <span className="legend-item">
              <span className="legend-dot legend-completed"></span>
              Completed
            </span>
            <span className="legend-item">
              <span className="legend-dot legend-ongoing"></span>
              Ongoing
            </span>
            <span className="legend-item">
              <span className="legend-dot legend-upcoming"></span>
              Upcoming
            </span>
          </div>
        </div>

        <div className="week-navigation bottom-navigation">
          <button className="schedule-banner-btn week-nav-btn" onClick={handlePreviousWeek}>
            <Icon name="chevron-left" />
            <span>Previous</span>
          </button>
          <div className="week-nav-label">
            <span>{currentWeek.label}</span>
            <small>{currentWeek.range}</small>
          </div>
          <button className="schedule-banner-btn week-nav-btn" onClick={handleNextWeek}>
            <span>Next</span>
            <Icon name="chevron-right" />
          </button>
        </div>

        {/* Timetable Grid */}
        <div className="timetable-grid-container">
          {/* Header row with day names */}
          <div className="timetable-header-row">
            {currentWeek.days.map((day) => (
              <div key={`header-${day.name}`} className="timetable-day-header">
                <p className="timetable-day-name">{day.name.toUpperCase()}</p>
              </div>
            ))}
          </div>

          {/* Content row with modules */}
          <div className="timetable-content-row">
            {currentWeek.days.map((day) => (
              <div key={`content-${day.name}`} className="timetable-day-column">
                {day.sessions.length === 0 ? (
                  <div className="timetable-empty-slot">Rest day</div>
                ) : (
                  day.sessions.map((session) => {
                    const state = getModuleState(session, day.status);
                    return (
                      <div
                        key={`${session.title}-${session.start_time}`}
                        className={`timetable-module-card ${getModuleStateClass(state)}`}
                      >
                        <div className="timetable-module-time">
                          {session.start_time} - {session.end_time}
                        </div>
                        <h4 className="timetable-module-title">{session.title}</h4>
                        <p className="timetable-module-code">LU-{session.learning_unit_id}</p>
                      </div>
                    );
                  })
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}