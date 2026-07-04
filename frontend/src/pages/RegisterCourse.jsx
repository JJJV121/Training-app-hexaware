import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function RegisterCourse() {
  const navigate = useNavigate();
  const location = useLocation();

  const course = location.state?.courseData || {
    title: "Python Mastery",
    subtitle: "Learn Python from scratch",
    category: "DATA SCIENCE",
    days: "10",
    modules: "35",
    startDate: "18 June, 26",
    endDate: "28 June, 26"
  };

  const handleRegister = (e) => {
    e.preventDefault();
    console.log(`Registered for ${course.title}`);
    alert(`Course registration for ${course.title} successful!`);
  };

  const animationStyles = `
    @keyframes floatSlow {
      0% { transform: translate(0px, 0px) scale(1); }
      50% { transform: translate(20px, -15px) scale(1.05); }
      100% { transform: translate(0px, 0px) scale(1); }
    }
    @keyframes floatReverse {
      0% { transform: translate(0px, 0px) scale(1); }
      50% { transform: translate(-15px, 15px) scale(0.95); }
      100% { transform: translate(0px, 0px) scale(1); }
    }
  `;

  return (
    // MAIN BACKGROUND CONTAINER
    <div 
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#F4F7FC',
        fontFamily: 'sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '40px 24px'
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      
      {/* BACKGROUND DECORATIVE BLURS */}
      <div style={{ position: 'absolute', top: '14%', left: '12%', width: '140px', height: '140px', backgroundColor: '#C8DAF7', borderRadius: '50%', filter: 'blur(25px)', opacity: 0.6, pointerEvents: 'none', animation: 'floatSlow 8s ease-in-out infinite' }}></div>
      <div style={{ position: 'absolute', bottom: '-5%', left: '2%', width: '340px', height: '340px', backgroundColor: '#FFFFFF', borderRadius: '50%', filter: 'blur(40px)', opacity: 0.5, pointerEvents: 'none', animation: 'floatReverse 12s ease-in-out infinite' }}></div>
      <div style={{ position: 'absolute', top: '22%', right: '10%', width: '310px', height: '310px', backgroundColor: '#CFDDF2', borderRadius: '50%', filter: 'blur(45px)', opacity: 0.65, pointerEvents: 'none', animation: 'floatSlow 10s ease-in-out infinite' }}></div>
      <div style={{ position: 'absolute', top: '8%', right: '0%', width: '170px', height: '170px', backgroundColor: '#D9E7F8', borderRadius: '50%', filter: 'blur(20px)', opacity: 0.7, pointerEvents: 'none', animation: 'floatReverse 7s ease-in-out infinite' }}></div>

      {/* MAIN CONTENT SPLIT WRAPPER */}
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '64px',
          alignItems: 'center'
        }}
      >
        {/* LEFT SIDE: Branding Text */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', userSelect: 'none' }}>
          <h1 
            style={{ 
              fontSize: '88px', 
              fontWeight: 900, 
              color: '#0061FE', 
              letterSpacing: '-0.05em', 
              lineHeight: 1,
              margin: '0 0 16px 0'
            }}
          >
            Register
          </h1>
          <p style={{ fontSize: '20px', color: '#6B7280', fontWeight: 500, margin: '0 0 0 4px', maxWidth: '400px' }}>
            Register now to get start your learning journey
          </p>
        </div>

        {/* RIGHT SIDE: White Card Container */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div 
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 25px 70px rgba(0,0,0,0.06)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              borderRadius: '32px',
              padding: '40px',
              display: 'flex',
              flexDirection: 'column',
              gap: '32px',
              backdropFilter: 'blur(10px)',
              transition: 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)',
              hoverShadow: '0 30px 80px rgba(0,0,0,0.08)'
            }}
          >
            {/* Header Title inside Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0061FE', margin: 0, letterSpacing: '-0.02em' }}>
                Register Course
              </h2>
              <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: 500, margin: 0 }}>
                Register course to get started
              </p>
            </div>

            {/* --- FIXED INNER GREY BOX WITH GUARANTEED INLINE PADDING --- */}
            <div 
              style={{
                backgroundColor: '#F4F7FC',
                borderRadius: '24px',
                padding: '32px', // Guaranteed 32px of interior padding away from borders
                display: 'flex',
                flexDirection: 'column',
                gap: '28px', // Spacing between rows
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              
              {/* Row 1: Icon & Course Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                <div 
                  style={{
                    width: '52px',
                    height: '52px',
                    backgroundColor: '#4A72FF',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 16px rgba(74, 114, 255, 0.2)',
                    flexShrink: 0
                  }}
                >
                  <svg style={{ width: '24px', height: '24px', color: '#FFFFFF' }} fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', margin: 0, letterSpacing: '-0.01em' }}>{course.title}</h3>
                  <p style={{ fontSize: '13px', color: '#6B7280', margin: '2px 0 0 0' }}>{course.subtitle}</p>
                </div>
              </div>

              {/* Row 2: Stats Row Distributed Perfectly Edge-to-Edge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                {/* Category metadata */}
                <span style={{ color: '#4B5563', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {course.category}
                </span>
                
                {/* Geometric Dot separator */}
                <div style={{ width: '4px', height: '4px', backgroundColor: '#9CA3AF', borderRadius: '50%' }}></div>
                
                {/* Days Display */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: '#111827', lineHeight: 1 }}>{course.days}</span>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Days</span>
                </div>
                
                {/* Geometric Dot separator */}
                <div style={{ width: '4px', height: '4px', backgroundColor: '#9CA3AF', borderRadius: '50%' }}></div>
                
                {/* Modules Display */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: '#111827', lineHeight: 1 }}>{course.modules}</span>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Modules</span>
                </div>
              </div>

              {/* Row 3: Start Date and End Date Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                {/* Start Date Block */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg style={{ width: '16px', height: '16px', color: '#0061FE' }} fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                    </svg>
                    <span style={{ fontSize: '10px', color: '#6B7280', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Start Date</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: '#111827' }}>{course.startDate}</span>
                </div>

                {/* End Date Block */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg style={{ width: '16px', height: '16px', color: '#0061FE' }} fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                    </svg>
                    <span style={{ fontSize: '10px', color: '#6B7280', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.04em' }}>End Date</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: '#111827' }}>{course.endDate}</span>
                </div>
              </div>
            </div>

            {/* Main Action Register Button */}
            <button 
              onClick={handleRegister}
              style={{
                width: '100%',
                backgroundColor: '#4A72FF',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: 'bold',
                paddingTop: '16px',
                paddingBottom: '16px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 12px 24px rgba(74, 114, 255, 0.15)',
                letterSpacing: '0.02em',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#385CE0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4A72FF'}
            >
              Register Now
            </button>
            
          </div>
        </div>
        
      </div>
    </div>
  );
}