import { useState, useEffect, useCallback } from 'react';
import courseService from '../services/courseService';
import dashboardService from '../services/dashboardService';
import Icon from '../components/Icon';
import '../styles/Course.css';
import Assignment from '../components/Assignment.jsx'
import { useRef } from "react";

// 🌟 Prop Injection: Accept courseId dynamically from DashBoard parent component shell
export default function Course({ courseId }) {
  // Fallback sanity guard: Ensure we have a default ID if undefined or null
  const activeCourseId = courseId || 1;

  // Asynchronous Core Data States
  const [course, setCourse] = useState(null);
  const [rawCourseData, setRawCourseData] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [maxWatchedTime, setMaxWatchedTime] = useState(0);
  // Dynamic User Tracking States
  const userId = Number(localStorage.getItem('logged_in_user_id')) || 1;
  const [currentUnlockedDay, setCurrentUnlockedDay] = useState(1); 
  const [expandedDay, setExpandedDay] = useState(1); 
  const lastValidTime = useRef(0);
  const isSeekingRef = useRef(false);

  // Layout Sub-Views Controllers
  const [activeMainTab, setActiveMainTab] = useState('Content'); 
  const [subView, setSubView] = useState('outline'); 
  const [activeHorizontalTab, setActiveHorizontalTab] = useState('Videos');
  const [selectedLesson, setSelectedLesson] = useState(null);

  // Video Player & Playlist States
  const [unitVideos, setUnitVideos] = useState([]);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [completedVideos, setCompletedVideos] = useState(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = window.localStorage.getItem(`course-video-progress-${activeCourseId}-${userId}`);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (err) {
      console.error('Failed to load persisted video progress:', err);
      return new Set();
    }
  });

  // Progress states
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [progressPercentage, setProgressPercentage] = useState(0);

const getModuleByDayId = (dayId) => {
  if (!course || dayId === null || dayId === undefined) return null;
  return course.modules.find(module => String(module.id) === String(dayId)) || null;
};

const isDayFullyCompleted = (dayId) => {
  const module = getModuleByDayId(dayId);
  if (!module || !module.lessons.length) return false;
  return module.lessons.every(lesson => completedLessons.has(String(lesson.id)));
};

useEffect(() => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      `course-video-progress-${activeCourseId}-${userId}`,
      JSON.stringify([...completedVideos])
    );
  } catch (err) {
    console.error('Failed to persist video progress:', err);
  }
}, [completedVideos, activeCourseId, userId]);

// Converts Google Drive share/view links into playable direct links for <video>
const normalizeVideoUrl = (url) => {
  if (!url) return '';

  // Match Google Drive file links:
  // https://drive.google.com/file/d/<FILE_ID>/view?usp=drive_link
  const match = url.match(/\/file\/d\/([^/]+)\//);

  if (match && match[1]) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }

  return url;
};

  // Fetch Structure and Progress from Backend
  const syncCourseProgressAndDashboard = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setIsLoading(true);

      const dashData = await dashboardService.getDashboardData(userId);
      const activeDay = dashData?.current_course?.current_day || 1;
      setCurrentUnlockedDay(activeDay);

      if (showLoading) {
        setExpandedDay(activeDay);
      }

      const [contentData, progressData] = await Promise.all([
        courseService.getCourseContent(activeCourseId),
        courseService.getCourseProgress(activeCourseId, userId)
      ]);

      setRawCourseData(contentData?.course || contentData);

      const mappedCourse = {
        title: contentData?.course?.title || contentData?.course_name || "Unknown Course",
        totalDays: contentData?.course?.duration_days || contentData?.duration_days || 0,
        modules: (contentData?.days || []).map(day => ({
          id: day.day_number || day.day_id,
          title: day.title || `Day ${day.day_number || day.day_id}`,
          dayLabel: `DAY ${day.day_number || day.day_id}`,
          lessons: (day.learning_units || day.units || []).map(unit => ({
            id: unit.unit_id || unit.id,
            title: unit.title || "Untitled Unit",
            duration: unit.duration_mins ? `${unit.duration_mins}m` : "Estimated: 45m",
            type: unit.type || "theory",
            dayId: day.day_number || day.day_id
          }))
        }))
      };

      setCourse(mappedCourse);
      setProgressPercentage(progressData?.progress_percentage || progressData?.percentage || 0); 

if (Array.isArray(progressData?.completed_learning_units)) {
  setCompletedLessons(
    new Set(progressData.completed_learning_units.map(id => String(id)))
  );
} else if (Array.isArray(progressData?.completed_units)) {
  setCompletedLessons(
    new Set(progressData.completed_units.map(id => String(id)))
  );
} else if (progressData?.completed_learning_units) {
  setCompletedLessons(
    new Set([String(progressData.completed_learning_units)])
  );
} else if (progressData?.completed_units && typeof progressData.completed_units !== 'number') {
  setCompletedLessons(
    new Set([String(progressData.completed_units)])
  );
} else {
  setCompletedLessons(new Set());
}

      if (Array.isArray(progressData?.completed_videos)) {
        setCompletedVideos(prev => {
          const next = new Set(prev);
          progressData.completed_videos.forEach(id => next.add(String(id)));
          return next;
        });
      }

    } catch (err) {
      console.error("Failed to fetch course data:", err);
      setError("Failed to load course details. Please try again later.");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [userId, activeCourseId]);

  useEffect(() => {
    syncCourseProgressAndDashboard(true);
  }, [syncCourseProgressAndDashboard]);

  useEffect(() => {
    if (!isLoading && course) {
      const targetRaw = localStorage.getItem('continue_learning_target');
      if (targetRaw) {
        try {
          const target = JSON.parse(targetRaw);
          if (Number(target.course_id) === Number(activeCourseId)) {
            let targetLesson = null;
            for (const mod of course.modules) {
              const lesson = mod.lessons.find(l => Number(l.id) === Number(target.module_id));
              if (lesson) {
                targetLesson = lesson;
                break;
              }
            }
            if (targetLesson) {
              setExpandedDay(target.day);
              handleLaunchVideoPlayer(targetLesson, 'Videos');
            } else {
              setExpandedDay(target.day);
            }
          }
        } catch (e) {
          console.error("Failed to automatically redirect to lesson module:", e);
        } finally {
          localStorage.removeItem('continue_learning_target');
        }
      }
    }
  }, [isLoading, course, activeCourseId]);

  // Accordion Toggle Handler
  const toggleDayAccordion = (dayId, isLocked) => {
    if (isLocked) return; 
    setExpandedDay(expandedDay === dayId ? null : dayId);
  };

  // Automated Progress Sync
  const triggerLessonCompletion = async (lessonId) => {
    const normalizedLessonId = String(lessonId);
    if (completedLessons.has(normalizedLessonId)) return;

setCompletedLessons(prev => {
  const next = new Set(prev);
  next.add(normalizedLessonId);
  return next;
});

    try {
      await courseService.markUnitComplete(userId, lessonId);
      await syncCourseProgressAndDashboard(false);
    } catch (err) {
      console.error("Failed to sync progress with database:", err);
      setCompletedLessons(prev => {
        const next = new Set(prev);
        next.delete(normalizedLessonId);
        return next;
      });
    }
  };

  // Launch Dynamic Video Player & Initialize Playlist
  const handleLaunchVideoPlayer = async (lesson, fallbackTab = 'Videos') => {
    setSelectedLesson(lesson);
    setActiveHorizontalTab(fallbackTab);
    setSubView('player');
    setUnitVideos([]); 
    setCurrentVideoUrl('');

    try {
      const progressData = await courseService.getCourseProgress(activeCourseId, userId);
      console.log("Progress Data:", progressData);
      if (Array.isArray(progressData?.completed_videos)) {
        setCompletedVideos(prev => {
          const next = new Set(prev);
          progressData.completed_videos.forEach(id => next.add(String(id)));
          return next;
        });
      }

      const videos = await courseService.getUnitVideos(lesson.id);
      console.log(videos);
      setUnitVideos(videos || []);
      console.log("Video URL:", videos[0].video_url || videos[0].url);
console.log("Normalized URL:", normalizeVideoUrl(videos[0].video_url || videos[0].url));

      if (videos && videos.length > 0) {
        setMaxWatchedTime(0);
        setCurrentVideoUrl(
          normalizeVideoUrl(videos[0].video_url || videos[0].url)
        );
      }
    } catch (err) {
      console.error("Failed to load videos for the learning unit:", err);
    }
  };

  // Unified click/select video mechanism 
  const handleSelectVideo = (targetUrl) => {
    setMaxWatchedTime(0);
    const normalizedUrl = normalizeVideoUrl(targetUrl);

    if (currentVideoUrl === normalizedUrl) {
      const videoEl = document.querySelector('.dashboard-active-video-element');
      if (videoEl) {
        videoEl.currentTime = 0;
        videoEl.play().catch(err => console.log("Playback forced error:", err));
      }
    } else {
      setCurrentVideoUrl(normalizedUrl);
    }
  };
const handleTimeUpdate = (e) => {
    if (!e.target.seeking) {
        lastValidTime.current = e.target.currentTime;
    }
};

const handleSeeking = (e) => {
    const currentIndex = unitVideos.findIndex(v => {
      const videoUrl = normalizeVideoUrl(v.video_url || v.url);
      return videoUrl === currentVideoUrl;
    });
    if (currentIndex !== -1) {
      const currentVid = unitVideos[currentIndex];
      const videoId = String(currentVid.id ?? currentVid.video_id ?? currentIndex);
      if (completedVideos.has(videoId)) {
        return;
      }
    }
    if (e.target.currentTime > lastValidTime.current + 1) {
        e.target.currentTime = lastValidTime.current;
    }
};

  // Video End Handler / manual complete handler
  const handleVideoComplete = async () => {
    const currentIndex = unitVideos.findIndex(v => {
      const videoUrl = normalizeVideoUrl(v.video_url || v.url);
      return videoUrl === currentVideoUrl;
    });

    if (currentIndex === -1) return;

    const currentVid = unitVideos[currentIndex];
    const videoId = String(currentVid.id ?? currentVid.video_id ?? currentIndex);

    if (completedVideos.has(videoId)) {
      const nextIndex = currentIndex + 1;
      if (nextIndex < unitVideos.length) {
        const nextVid = unitVideos[nextIndex];
        setCurrentVideoUrl(normalizeVideoUrl(nextVid.video_url || nextVid.url));
      }
      return;
    }

    setCompletedVideos(prev => {
      const next = new Set(prev);
      next.add(videoId);
      return next;
    });

    try {
      if (typeof courseService.markVideoComplete === 'function') {
        await courseService.markVideoComplete(userId, videoId);
      }

      const nextIndex = currentIndex + 1;

      if (nextIndex < unitVideos.length) {
        const nextVid = unitVideos[nextIndex];
        setCurrentVideoUrl(normalizeVideoUrl(nextVid.video_url || nextVid.url));
      } else if (selectedLesson) {
        await triggerLessonCompletion(selectedLesson.id);
      }

      await syncCourseProgressAndDashboard(false);
    } catch (err) {
      console.error('Failed to sync video completion to backend:', err);
    }
  };

  if (isLoading) return <div className="course-viewport-centered-fallback"><h3>Loading Course Details...</h3></div>;
  if (error) return <div className="course-viewport-centered-fallback"><h3 className="error-headline-text">{error}</h3></div>;
  if (!course) return null; 

  const activeAssignmentDayId = selectedLesson?.dayId || expandedDay || currentUnlockedDay;

  if (subView === 'outline') {
    return (
      <div className="course-main-viewport">
        <div className="course-hero-banner">
          <div className="hero-left-block">
            <span className="hero-meta-label">COURSE CONTENT</span>
            <h2 className="hero-main-title">{course.title}</h2>
            <div className="hero-navigation-tabs">
              <button className={`hero-tab-item ${activeMainTab === 'Content' ? 'active-ui-tab' : ''}`} onClick={() => setActiveMainTab('Content')}>Content</button>
              <button className={`hero-tab-item ${activeMainTab === 'Overview' ? 'active-ui-tab' : ''}`} onClick={() => setActiveMainTab('Overview')}>Overview</button>
            </div>
          </div>
          <div className="hero-right-metrics">
            <div className="metric-pill-card">
              <span className="metric-pill-title">PROGRESS</span>
              <span className="metric-pill-digit">{progressPercentage}%</span>
              <div className="metric-pill-track-rail">
                <div className="metric-pill-track-fill" style={{ width: `${progressPercentage}%` }}></div>
              </div>
            </div>
            <div className="metric-pill-card">
              <span className="metric-pill-title">CURRENT DAY</span>
              <span className="metric-pill-digit">{currentUnlockedDay}/{course.totalDays}</span>
            </div>
          </div>
        </div>

        <div className="course-workspace-scroll-area">
          {activeMainTab === 'Content' ? (
            course.modules.map(module => {
              const isLocked = Number(module.id) > Number(currentUnlockedDay);
              const isExpanded = expandedDay === module.id;

              return (
                <div 
                  key={module.id} 
                  className={`module-timeline-group ${isLocked ? 'locked-module' : 'unlocked-module'}`}
                  style={{ 
                    opacity: isLocked ? 0.6 : 1, 
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    background: isLocked ? 'var(--bg-main)' : 'var(--bg-sidebar)'
                  }}
                >
                  <div 
                    className="module-timeline-header" 
                    onClick={() => toggleDayAccordion(module.id, isLocked)}
                    style={{ 
                      cursor: isLocked ? 'not-allowed' : 'pointer', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '20px',
                      borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div className="module-numeric-badge" style={{ background: isLocked ? 'var(--border-color)' : 'var(--primary-blue)', color: '#fff' }}>
                        {module.id}
                      </div>
                      <div className="module-heading-details">
                        <h3 className="module-primary-title" style={{ color: isLocked ? 'var(--text-medium)' : 'var(--text-dark)', margin: 0 }}>
                          {module.title}
                        </h3>
                        <span className="module-duration-subtitle" style={{ color: 'var(--text-medium)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <Icon name="clock" style={{ width: '14px' }} />
                          <span>{module.dayLabel} • {module.lessons.length} Modules</span>
                        </span>
                      </div>
                    </div>
                    <div>
                      {isLocked ? <Icon name="lock" style={{ color: 'var(--text-light)' }} /> : <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} style={{ color: 'var(--primary-blue)' }} />}
                    </div>
                  </div>

                  {isExpanded && !isLocked && (
                    <div className="module-lessons-deck" style={{ padding: '0 20px 20px 20px' }}>
                      {(() => {
                        let isLessonChainBroken = false;

                        return module.lessons.map((lesson, lessonIdx) => {
                          const isCompleted = completedLessons.has(String(lesson.id));
                          let isLessonLocked = false;

                          if (lessonIdx > 0) {
                            if (isLessonChainBroken) {
                              isLessonLocked = true;
                            } else {
                              const prevLesson = module.lessons[lessonIdx - 1];
                              if (!completedLessons.has(String(prevLesson.id))) {
                                isLessonLocked = true;
                                isLessonChainBroken = true;
                              }
                            }
                          }

                          return (
                            <div 
                              key={lesson.id} 
                              className={`lesson-row-interactive-card ${isLessonLocked ? 'locked-lesson' : ''}`} 
                              style={{ 
                                marginTop: '16px', 
                                background: isCompleted ? 'var(--accent-green-light)' : isLessonLocked ? 'var(--bg-main)' : 'var(--bg-sidebar)',
                                opacity: isLessonLocked ? 0.55 : 1,
                                cursor: isLessonLocked ? 'not-allowed' : 'pointer'
                              }}
                            >
                              <div className="lesson-row-meta-left">
                                <h4 className="lesson-row-title" style={{ color: isLessonLocked ? 'var(--text-light)' : 'var(--text-dark)' }}>
                                  {lesson.title}
                                </h4>
                                <span className="lesson-row-duration">{lesson.duration}</span>
                                <div className="lesson-row-action-row">
                                  <button 
                                    className="action-pill-btn variant-blue-play" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!isLessonLocked) handleLaunchVideoPlayer(lesson, 'Videos');
                                    }}
                                    disabled={isLessonLocked}
                                    style={{ opacity: isLessonLocked ? 0.6 : 1 }}
                                  >
                                    <Icon name={isLessonLocked ? "lock" : "play"} style={{ fill: isLessonLocked ? 'transparent' : '#ffffff', marginRight: '4px' }} />
                                    <span>Videos</span>
                                  </button>
                                  <button 
                                    className="variant-secondary-notes" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!isLessonLocked) handleLaunchVideoPlayer(lesson, 'Notes');
                                    }}
                                    disabled={isLessonLocked}
                                    style={{ opacity: isLessonLocked ? 0.6 : 1 }}
                                  >
                                    <Icon name="file-text" style={{ marginRight: '4px', width: '14px', height: '14px' }} />
                                    <span>Notes</span>
                                  </button>
                                </div>
                              </div>
                              <div className="lesson-row-checkbox-right">
                                <div className={`ui-checkbox-node ${isCompleted ? 'state-checked' : 'state-unchecked'}`}>
                                  {isCompleted ? (
                                    <Icon name="check" />
                                  ) : isLessonLocked ? (
                                    <Icon name="lock" style={{ width: '12px', color: 'var(--text-light)' }} />
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="overview-split-layout-grid">
              <div className="overview-informational-card">
                <h3>Course Overview</h3>
                <p className="overview-body-narrative">
                  {rawCourseData?.description || "Master the fundamentals of Java programming with this comprehensive course. Learn everything from basic syntax to advanced concepts like data structures, algorithms, and object-oriented programming."}
                </p>

                <div className="overview-metrics-vertical-stack">
                  <div className="overview-metric-strip-row">
                    <div className="overview-metric-icon-housing"><Icon name="clock" /></div>
                    <div className="overview-metric-meta-details">
                      <span className="overview-metric-meta-label">Duration</span>
                      <span className="overview-metric-meta-value">{course.totalDays} Days • 48 Hours</span>
                    </div>
                  </div>

                  <div className="overview-metric-strip-row">
                    <div className="overview-metric-icon-housing"><Icon name="file-text" /></div>
                    <div className="overview-metric-meta-details">
                      <span className="overview-metric-meta-label">Total Lessons</span>
                      <span className="overview-metric-meta-value">48 Video Lessons</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overview-informational-card">
                <h3>What You'll Learn</h3>
                <div className="overview-curriculum-checklist-deck">
                  {[
                    "Core Java syntax and fundamentals",
                    "Object-oriented programming concepts",
                    "Data structures and algorithms",
                    "Exception handling and debugging",
                    "File I/O and serialization",
                    "Multithreading and concurrency"
                  ].map((curriculumValue, index) => (
                    <div key={index} className="overview-checklist-node-item">
                      <div className="overview-checklist-bullet-node"><Icon name="check" /></div>
                      <span className="overview-checklist-bullet-text">{curriculumValue}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="course-main-viewport">
      <div className="video-workspace-banner">
        <button className="video-banner-back-btn" onClick={() => setSubView('outline')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"></polyline></svg>
          Back to Course
        </button>
        <h2 className="video-banner-title">{course.title}</h2>
        <p className="video-banner-subtitle">{selectedLesson?.title}</p>
      </div>

      <div className="course-workspace-scroll-area">
        <div className="video-media-frame-wrapper">
          <div className="video-playback-screen-canvas">
            {currentVideoUrl ? (
              <video
              key={currentVideoUrl}
              controls
              className="dashboard-active-video-element"
              autoPlay
              onEnded={handleVideoComplete}
              onTimeUpdate={handleTimeUpdate}
              onSeeking={handleSeeking}
              controlsList="nodownload"
              disablePictureInPicture
              style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
              >
                <source src={currentVideoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div style={{ color: '#94a3b8', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <p>No video streaming paths found.</p>
              </div>
            )}
          </div>

          
        </div>

        <div className="video-content-horizontal-nav-row">
          {['Videos', 'Notes', 'Assignment', 'Q&A'].map((tabName) => (
            <button key={tabName} onClick={() => setActiveHorizontalTab(tabName)} className={`video-horizontal-nav-item ${activeHorizontalTab === tabName ? 'active-nav-pill' : ''}`}>{tabName}</button>
          ))}
        </div>

        <div className="video-dynamic-card-container-wrapper">
          {activeHorizontalTab === 'Videos' && (
            <VideoPlaylist 
              videos={unitVideos}
              currentVideoUrl={currentVideoUrl} 
              onPlayVideo={handleSelectVideo} 
              completedVideos={completedVideos} 
            />
          )}
          {activeHorizontalTab === 'Notes' && <NotesSection learningUnitId={selectedLesson?.id} />}
          {activeHorizontalTab === 'Assignment' && (
            <Assignment
              courseDayId={activeAssignmentDayId}
              userId={userId}
              isUnlocked={isDayFullyCompleted(activeAssignmentDayId)}
            />
          )}
          {activeHorizontalTab === 'Q&A' && <QnASection learningUnitId={selectedLesson?.id} />}
        </div>
      </div>
    </div>
  );
}

function VideoPlaylist({ videos, currentVideoUrl, onPlayVideo, completedVideos }) {
  if (!videos || videos.length === 0) {
    return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-medium)' }}><p>No lecture parts attached.</p></div>;
  }

  let isChainBroken = false;

  return (
    <div className="video-tab-playlist-vertical-stack">
      {videos.map((video, idx) => {
        const targetUrl = video.video_url || video.url;
        const videoId = String(video.id ?? video.video_id ?? idx);

        const prevVideo = idx === 0 ? null : videos[idx - 1];

const prevVideoId = prevVideo
    ? String(prevVideo.id ?? prevVideo.video_id ?? (idx - 1))
    : null;

let isLocked = false;

if (idx > 0) {
    isLocked = !completedVideos.has(prevVideoId);
}

        const isActive = !isLocked && currentVideoUrl === (targetUrl.includes('drive.google.com/file/d/') ? targetUrl.replace(/https:\/\/drive\.google\.com\/file\/d\/([^/]+)\/view.*$/, 'https://drive.google.com/uc?export=download&id=$1') : targetUrl);

        return (
          <div 
            key={videoId}
            className={`playlist-card-item ${isActive ? 'selection-active' : ''}`}
            onClick={() => {
              if (!isLocked) onPlayVideo(targetUrl); 
            }} 
            style={{ 
              cursor: isLocked ? 'not-allowed' : 'pointer',
              opacity: isLocked ? 0.5 : 1,
              background: isLocked ? 'var(--bg-main)' : ''
            }}
          >
            <div className="playlist-card-icon-frame"><Icon name={isLocked ? "lock" : "play"} /></div>
            <div className="playlist-card-text-block">
              <h4 className="playlist-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dark)' }}>
                {video.title || `Part ${idx + 1}`}
                {completedVideos.has(videoId) && <Icon name="check" style={{ width: '14px', color: '#16a34a' }} />}
              </h4>
              <p className="playlist-card-meta" style={{ color: 'var(--text-medium)' }}>{isLocked ? 'Complete previous video to unlock' : (video.duration || 'Lecture Video File')}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NotesSection({ learningUnitId }) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!learningUnitId) return;

    let isMounted = true;
    const fetchNotes = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await courseService.getUnitNotes(learningUnitId);
        if (isMounted) {
          setNotes(data?.content_text || data?.content || '');
        }
      } catch (err) {
        console.error("Failed to fetch notes:", err);
        if (isMounted) setError("Could not load lesson text summaries.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchNotes();
    return () => { isMounted = false; };
  }, [learningUnitId]);

  if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-medium)' }}><p>Fetching lesson notes...</p></div>;
  if (error) return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--accent-red)' }}><p>{error}</p></div>;

  return (
    <div style={{ padding: '24px', backgroundColor: 'var(--bg-sidebar)', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-dark)' }}>
        <Icon name="file-text" style={{ width: '20px', height: '20px' }} />
        <h3 style={{ margin: 0, fontSize: '18px' }}>Lesson Notes & Summaries</h3>
      </div>
      {notes ? (
        <div 
          style={{ color: 'var(--text-medium)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}
          dangerouslySetInnerHTML={{ __html: notes }}
        />
      ) : (
        <p style={{ color: 'var(--text-light)', fontStyle: 'italic', margin: 0 }}>No theory text summaries provided for this lesson yet.</p>
      )}
    </div>
  );
}

function QnASection({ learningUnitId }) {
  const [qaList, setQaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!learningUnitId) return;

    let isMounted = true;
    const fetchQA = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await courseService.getUnitQA(learningUnitId);
        if (isMounted) {
          setQaList(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load Q&A data:", err);
        if (isMounted) setError("Could not pull discussion board feeds.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchQA();
    return () => { isMounted = false; };
  }, [learningUnitId]);

  if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-medium)' }}><p>Loading discussions...</p></div>;
  if (error) return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--accent-red)' }}><p>{error}</p></div>;

  return (
    <div style={{ padding: '24px', backgroundColor: 'var(--bg-sidebar)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--text-dark)' }}>
        <Icon name="message-circle" style={{ width: '20px', height: '20px' }} />
        <h3 style={{ margin: 0, fontSize: '18px' }}>Questions & Answers</h3>
      </div>

      {qaList.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '16px' }}>
          <p>No questions have been submitted for this module unit yet. Be the first to start the thread!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {qaList.map((item, idx) => (
            <div key={item.id || item.qa_id || idx} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-dark)', fontSize: '15px' }}>Q: {item.question}</h4>
              <p style={{ margin: 0, color: 'var(--text-medium)', fontSize: '14px', paddingLeft: '20px' }}>
                <span style={{ fontWeight: '600', color: 'var(--primary-blue)' }}>A: </span>
                {item.answer || <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Pending answer from instructors...</span>}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AssignmentSection() {
  return (
    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-medium)', backgroundColor: 'var(--bg-main)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
      <Icon name="file-text" style={{ width: '32px', height: '32px', marginBottom: '16px', opacity: 0.5 }} />
      <h3>Assignments & Code Labs</h3>
      <p style={{ maxWidth: '400px', margin: '0 auto 12px auto', fontSize: '14px', color: 'var(--text-medium)' }}>
        Coding sandbox workspaces and testing suite verifications are currently being developed by our backend engineering team.
      </p>
      <span style={{ fontSize: '11px', textTransform: 'uppercase', padding: '4px 8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', color: 'var(--text-medium)', fontWeight: 'bold' }}>
        Coming Soon
      </span>
    </div>
  );
}
