import { useState, useEffect } from 'react';
import progressService from '../services/progressService';
import Icon from '../components/Icon';

export default function ProgressView() {
  const [progressData, setProgressData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProgressTelemetry = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let data = null;
        if (typeof progressService.getProgressOverview === 'function') {
          data = await progressService.getProgressOverview();
        }

        if (!data) {
          data = {
            percentage: 58,
            completedModules: 48,
            totalModules: 48,
            completedAssessments: 2,
            totalAssessments: 3,
            insights: [
              { title: "You learn best at 9:00 AM", description: "Based on your completion patterns" },
              { title: "20% ahead of average pace", description: "You're making excellent progress!" },
              { title: "Estimated completion: May 22, 2026", description: "2 days earlier than scheduled" }
            ],
            assessments: [
              { id: "java-basics", title: "Java Basics Quiz", status: "Passed", score: 85, total: 100, details: "Score: 85/100" },
              { id: "oop-mid", title: "OOP Mid-Assessment", status: "Passed", score: 78, total: 100, details: "Score: 78/100" },
              { id: "data-structures", title: "Data Structures Quiz", status: "Upcoming", score: null, total: null, details: "Not yet taken" }
            ]
          };
        }

        setProgressData(data);
      } catch (err) {
        console.error("Error collecting course progress profile:", err);
        setError("Failed to synchronize your progress telemetry data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgressTelemetry();
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh', width: '100%', fontFamily: 'sans-serif' }}>
        <h3 style={{ color: '#64748b', fontWeight: '500' }}>Loading Progress Profile...</h3>
      </div>
    );
  }

  if (error || !progressData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh', width: '100%', fontFamily: 'sans-serif' }}>
        <h3 style={{ color: '#ef4444', fontWeight: '500' }}>{error || "Data Unavailable"}</h3>
      </div>
    );
  }

  const isCertificateUnlocked = progressData.percentage >= 100;

  return (
    <div 
      className="page-view progress-container-view"
      style={{ 
        boxSizing: 'border-box',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        paddingBottom: '40px' /* Safe buffer space at the bottom of the scroll list */
      }}
    >
      {/* 1. Header Blue Banner Card */}
      <div 
        className="progress-banner-header"
        style={{
          background: 'linear-gradient(135deg, #3563e9 0%, #254dd0 100%)',
          borderRadius: '20px',
          padding: '32px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 12px 40px rgba(53, 99, 233, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: '14px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="activity" style={{ color: '#ffffff', width: '28px', height: '28px' }} />
          </div>
          <div>
            <h2 style={{ color: '#ffffff', margin: '0 0 2px 0', fontSize: '28px', fontWeight: '700', letterSpacing: '-0.3px' }}>Your Progress</h2>
            <span style={{ color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', fontSize: '12px', fontWeight: '600', letterSpacing: '0.8px' }}>Track your progress</span>
          </div>
        </div>
        <button 
          className="progress-new-note-btn" 
          onClick={() => alert('Feature coming soon!')}
          style={{
            backgroundColor: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 20px',
            color: '#2563eb',
            fontWeight: '600',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <Icon name="plus" style={{ width: '16px', height: '16px', strokeWidth: '2.5' }} />
          <span>New Note</span>
        </button>
      </div>

      {/* 2. Middle Grid Block */}
      <div 
        className="progress-grid-mid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '28px',
          alignItems: 'stretch'
        }}
      >
        {/* Certificate Progress Card */}
        <div 
          className="progress-card progress-cert-card"
          style={{ 
            backgroundColor: 'var(--bg-sidebar)',
            borderRadius: '20px',
            padding: '28px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '24px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            transition: 'all 300ms ease-out',
            hoverShadow: '0 12px 32px rgba(0,0,0,0.08)'
          }}
        >
          <div>
            <div className="progress-card-header" style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ backgroundColor: 'var(--primary-blue)', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="file-text" style={{ color: '#ffffff', width: '20px', height: '20px' }} />
              </div>
              <div className="progress-card-header-text">
                <h3 style={{ margin: '0 0 2px 0', fontSize: '18px', fontWeight: '700', color: 'var(--text-dark)' }}>Course Certificate</h3>
                <span style={{ color: 'var(--text-medium)', fontSize: '13px' }}>Complete all modules to unlock</span>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-main)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ color: 'var(--text-medium)', fontWeight: '600', fontSize: '13px' }}>Requirements Progress</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', fontSize: '14px' }}>{progressData.percentage}%</span>
              </div>
              
              <div style={{ width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '9999px', height: '8px', overflow: 'hidden', marginBottom: '20px' }}>
                <div style={{ width: `${progressData.percentage}%`, height: '100%', backgroundColor: 'var(--primary-blue)', borderRadius: '9999px' }}></div>
              </div>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-medium)', fontWeight: '500' }}>
                  <span style={{ backgroundColor: 'var(--accent-green-light)', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="check" style={{ color: 'var(--accent-green)', width: '12px', height: '12px', strokeWidth: '3' }} />
                  </span>
                  <span>Complete all {progressData.totalModules} modules</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-medium)', fontWeight: '500' }}>
                  <span style={{ border: '2px solid var(--border-color)', borderRadius: '50%', width: '18px', height: '18px', display: 'block', boxSizing: 'border-box', flexShrink: 0, backgroundColor: 'var(--bg-sidebar)' }}></span>
                  <span>Pass all assessments ({progressData.completedAssessments}/{progressData.totalAssessments} completed)</span>
                </li>
              </ul>
            </div>
          </div>

          <button 
            disabled={!isCertificateUnlocked} 
            style={{ 
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: isCertificateUnlocked ? 'var(--primary-blue)' : 'var(--border-color)',
              color: isCertificateUnlocked ? '#ffffff' : 'var(--text-light)',
              fontWeight: '600',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: isCertificateUnlocked ? 'pointer' : 'not-allowed'
            }}
          >
            <Icon name={isCertificateUnlocked ? "award" : "lock"} style={{ width: '16px', height: '16px' }} />
            <span>{isCertificateUnlocked ? "Download Certificate" : "Certificate Locked"}</span>
          </button>
        </div>

        {/* Learning Insights Card */}
        <div 
          className="progress-card progress-insights-card" 
          style={{ 
            backgroundColor: 'var(--primary-blue-light)', 
            borderRadius: '20px', 
            padding: '28px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Icon name="info" style={{ color: 'var(--primary-blue)', width: '20px', height: '20px' }} />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-dark)' }}>Learning Insights</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1, justifyContent: 'space-between' }}>
            {progressData.insights && progressData.insights.map((insight, idx) => (
              <div 
                key={idx} 
                style={{ 
                  backgroundColor: 'var(--bg-sidebar)', 
                  padding: '16px 20px', 
                  borderRadius: '14px',
                  border: '1px solid var(--border-color)',
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <div style={{ fontWeight: '700', color: 'var(--text-dark)', fontSize: '14px', marginBottom: '2px' }}>{insight.title}</div>
                <div style={{ color: 'var(--text-medium)', fontSize: '12px', fontWeight: '500' }}>{insight.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Bottom Table Assessment Card */}
      <div 
        className="progress-card progress-assessment-card" 
        style={{ 
          backgroundColor: 'var(--bg-sidebar)', 
          borderRadius: '20px', 
          padding: '28px',
          border: '1px solid var(--border-color)'
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '18px', fontWeight: '700', color: 'var(--text-dark)' }}>Assessment Results</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {progressData.assessments && progressData.assessments.map(item => (
            <div 
              key={item.id} 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px',
                padding: '20px',
                backgroundColor: 'var(--bg-main)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: '600', color: 'var(--text-dark)' }}>{item.title}</h4>
                  <span style={{ color: 'var(--text-medium)', fontSize: '12px', fontWeight: '500' }}>{item.details}</span>
                </div>
                <span 
                  style={{ 
                    backgroundColor: item.status === 'Passed' ? 'var(--accent-green-light)' : 'var(--border-color)', 
                    color: item.status === 'Passed' ? 'var(--accent-green)' : 'var(--text-medium)', 
                    padding: '6px 14px', 
                    borderRadius: '20px', 
                    fontSize: '12px', 
                    fontWeight: '700' 
                  }}
                >
                  {item.status}
                </span>
              </div>
              {item.status === 'Passed' && item.score !== null && (
                <div style={{ width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${item.score}%`, height: '100%', backgroundColor: 'var(--primary-blue)', borderRadius: '9999px' }}></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}