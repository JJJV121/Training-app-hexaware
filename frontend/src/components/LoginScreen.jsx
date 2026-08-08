import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // State for tracking API lifecycle and server messages
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // OPTIONAL AUTO-LOGIN: Checks if a persistent token exists when page mounts
  useEffect(() => {
    const existingToken = localStorage.getItem('authToken');
    if (existingToken) {
      // If a token is found in localStorage from a previous "Remember Me" session, 
      // you can route them straight into the app or run a token validation check.
      // navigate('/dashboard'); 
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);

  try {
    const response = await axios.post(
      'http://localhost:8000/auth/login',
      {
        email: email,
        password: password
      }
    );

    const { access_token, token_type, user } = response.data;

    if (access_token) {
      const formattedToken = `${token_type} ${access_token}`;

      if (rememberMe) {
        localStorage.setItem('authToken', formattedToken);
      } else {
        sessionStorage.setItem('authToken', formattedToken);
      }

      localStorage.setItem('user', JSON.stringify(user));
    }
    alert('Login Successful!');
    navigate('/dashboard');

  } catch (err) {
    console.error('Login Submission Error:', err);

    setError(
      err.response?.data?.detail ||
      err.response?.data?.message ||
      'Invalid email or password.'
    );
  } finally {
    setIsLoading(false);
  }
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
    <div 
      className="min-h-screen w-full bg-[#F4F7FC] font-sans"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '24px'
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      
      {/* --- BACKGROUND BLUR LAYER --- */}
      <div style={{
        position: 'absolute', top: '14%', left: '12%', width: '140px', height: '140px',
        backgroundColor: '#C8DAF7', borderRadius: '50%', filter: 'blur(25px)', opacity: 0.6, pointerEvents: 'none',
        animation: 'floatSlow 8s ease-in-out infinite'
      }}></div>
      
      <div style={{
        position: 'absolute', bottom: '-5%', left: '2%', width: '340px', height: '340px',
        backgroundColor: '#FFFFFF', borderRadius: '50%', filter: 'blur(40px)', opacity: 0.5, pointerEvents: 'none',
        animation: 'floatReverse 12s ease-in-out infinite'
      }}></div>
      
      <div style={{
        position: 'absolute', top: '22%', right: '10%', width: '310px', height: '310px',
        backgroundColor: '#CFDDF2', borderRadius: '50%', filter: 'blur(45px)', opacity: 0.65, pointerEvents: 'none',
        animation: 'floatSlow 10s ease-in-out infinite'
      }}></div>
      
      <div style={{
        position: 'absolute', top: '8%', right: '0%', width: '170px', height: '170px',
        backgroundColor: '#D9E7F8', borderRadius: '50%', filter: 'blur(20px)', opacity: 0.7, pointerEvents: 'none',
        animation: 'floatReverse 7s ease-in-out infinite'
      }}></div>

      {/* --- MAIN CONTENT GRID WRAPPER --- */}
      <div 
        className="w-full max-w-6xl mx-auto"
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '48px',
          alignItems: 'center'
        }}
      >
        {/* LEFT SIDE: Branding Statement */}
        <div className="flex flex-col items-center text-center md:items-start md:text-left select-none">
          <h1 
            className="text-[72px] md:text-[88px] font-black text-[#0061FE] tracking-tight leading-none"
            style={{ marginBottom: '24px' }}
          >
            Sign In
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 font-medium tracking-tight md:ml-1">
            Sign in to your account
          </p>
        </div>

        {/* RIGHT SIDE: White Login Form Card */}
        <div style={{ display: 'flex', justifyContent: 'center' }} className="w-full">
          <div 
            className="w-full bg-white shadow-[0_20px_50px_rgba(0,0,0,0.03)]"
            style={{
              maxWidth: '500px',
              borderRadius: '32px',
              padding: '48px',
              display: 'flex',
              flexDirection: 'column',
              gap: '40px'
            }}
          >
            
            {/* Header Text */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h2 className="text-[32px] font-bold text-[#0061FE] tracking-tight leading-tight">
                Welcome to Hexaware
              </h2>
              <p className="text-base text-gray-500 font-normal">
                Sign in with your User ID and Password
              </p>
            </div>

            {/* Error Notification Block */}
            {error && (
              <div style={{ 
                backgroundColor: '#FEE2E2', 
                color: '#DC2626', 
                padding: '14px 18px', 
                borderRadius: '14px', 
                fontSize: '13px', 
                fontWeight: '500', 
                marginTop: '-12px' 
              }}>
                {error}
              </div>
            )}

            {/* Input Form Fields */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              
              {/* Field 1: User ID */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label htmlFor="email" className="text-[11px] font-bold text-gray-800 tracking-widest uppercase">
                  EMAIL
                </label>
                
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                  <span style={{ position: 'absolute', left: '18px', display: 'flex', alignItems: 'center', color: '#9ca3af', pointerEvents: 'none' }}>
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  </span>
                  
                  <input
  type="email"
  id="email"
  placeholder="Enter your email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  disabled={isLoading}
  className="w-full bg-[#F1F5F9] border border-transparent rounded-xl text-base text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-blue-400 transition-all"
  style={{
    paddingTop: '16px',
    paddingBottom: '16px',
    paddingLeft: '52px',
    paddingRight: '16px',
    opacity: isLoading ? 0.6 : 1
  }}
  required
/>
                </div>
              </div>

              {/* Field 2: Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label htmlFor="password" className="text-[11px] font-bold text-gray-800 tracking-widest uppercase">
                  PASSWORD
                </label>
                
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                  <span style={{ position: 'absolute', left: '18px', display: 'flex', alignItems: 'center', color: '#9ca3af', pointerEvents: 'none' }}>
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0V10.5m-2.25 0h13.5m-13.5 0a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25M6.75 10.5h10.5" />
                    </svg>
                  </span>
                  
                <input
  type={showPassword ? "text" : "password"}
  id="password"
  placeholder="Enter your password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  disabled={isLoading}
  className="w-full bg-[#F1F5F9] border border-transparent rounded-xl text-base text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-blue-400 transition-all"
  style={{
    paddingTop: '16px',
    paddingBottom: '16px',
    paddingLeft: '52px',
    paddingRight: '52px',
    opacity: isLoading ? 0.6 : 1
  }}
  required
/>

                  {/* Toggle Visibility Button */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    style={{ position: 'absolute', right: '18px', background: 'none', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', color: '#9ca3af' }}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Options Row: Remember Me & Forgot Password */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '-8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                    className="w-4 h-4 text-[#0061FE] bg-[#F1F5F9] border-gray-300 rounded focus:ring-[#0061FE]"
                  />
                  <span className="text-sm text-gray-600 font-medium select-none">Remember me</span>
                </label>
                
                <a href="#forgot" className="text-sm font-semibold text-[#0061FE] hover:underline">
                  Forgot password?
                </a>
              </div>

              {/* Submit Trigger Action Button */}
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-[#0061FE] hover:bg-[#0052CC] text-white text-base font-semibold shadow-md shadow-blue-100 transition-all tracking-wide"
                style={{
                  paddingTop: '16px',
                  paddingBottom: '16px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  marginTop: '8px'
                }}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
        
      </div>
    </div>
  );
}