import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function CreatePasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read token and email dynamically from the URL query parameters
  const token = searchParams.get('token');
  const userEmail = searchParams.get('email') || 'your account';

  // Security check: If someone navigates here without a token, block them or redirect them
  useEffect(() => {
    if (!token) {
      setError('Invalid or missing activation link. Please check your email or request a new link.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!token) {
      setError('Cannot submit: Activation token is missing.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    setIsLoading(true);

    try {
      // Update this URL endpoint to match your actual FastAPI/Node backend route
      await axios.post('http://localhost:8000/auth/activate', {
        token: token,
        password: password
      });

      setSuccessMessage('Password successfully created! Redirecting to login...');
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      console.error('API Error:', err);
      setError(err.response?.data?.detail || 'Failed to set password. Link may be expired.');
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
      
      {/* --- BACKGROUND LAYER --- */}
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

      {/* --- MAIN CONTENT WRAPPER --- */}
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">

        {/* LEFT SIDE: Branding */}
        <div className="flex flex-col text-center lg:text-left items-center lg:items-start select-none">
          <h1 className="text-7xl md:text-8xl font-black text-[#0061FE] tracking-tight mb-4">
            Hexaware
          </h1>
          <p className="text-lg md:text-xl text-gray-400 font-medium tracking-tight">
            Learn, build, and grow with every login.
          </p>
        </div>

        {/* RIGHT SIDE: White Login Card */}
        <div style={{ display: 'flex', justifyContent: 'center' }} className="w-full">
          <div 
            className="w-full bg-white shadow-[0_25px_70px_rgba(0,0,0,0.06)] border border-white/80 hover:shadow-[0_30px_80px_rgba(0,0,0,0.08)] backdrop-blur-xl transition-all duration-300"
            style={{
              maxWidth: '500px',
              borderRadius: '32px',
              padding: '48px',
              display: 'flex',
              flexDirection: 'column',
              gap: '32px'
            }}
          >
            
            {/* Header Text Grouping */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h2 className="text-[34px] font-bold text-gray-900 tracking-tight leading-tight">
                Create New Password
              </h2>
              <p className="text-base text-gray-500 font-normal">
                Set up a strong password for <span className="font-bold text-gray-950">{userEmail}</span>
              </p>
            </div>

            {/* Inline Notifications */}
            {error && (
              <div style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '500' }}>
                {error}
              </div>
            )}
            {successMessage && (
              <div style={{ backgroundColor: '#DCFCE7', color: '#16A34A', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '500' }}>
                {successMessage}
              </div>
            )}

            {/* Input Form Section */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Field 1: New Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label htmlFor="password" className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">
                  NEW PASSWORD
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
                    placeholder="Create strong password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading || !token}
                    className="w-full bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-base text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#3563e9] focus:ring-2 focus:ring-[#3563e9]/10 transition-all duration-200"
                    style={{
                      paddingTop: '16px',
                      paddingBottom: '16px',
                      paddingLeft: '52px',
                      paddingRight: '52px'
                    }}
                    required 
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '18px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
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

              {/* Field 2: Confirm Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label htmlFor="confirmPassword" className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">
                  CONFIRM PASSWORD
                </label>
                
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                  <span style={{ position: 'absolute', left: '18px', display: 'flex', alignItems: 'center', color: '#9ca3af', pointerEvents: 'none' }}>
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0V10.5m-2.25 0h13.5m-13.5 0a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25M6.75 10.5h10.5" />
                    </svg>
                  </span>
                  
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    id="confirmPassword" 
                    placeholder="Re-enter password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading || !token}
                    className="w-full bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-base text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#3563e9] focus:ring-2 focus:ring-[#3563e9]/10 transition-all duration-200"
                    style={{
                      paddingTop: '16px',
                      paddingBottom: '16px',
                      paddingLeft: '52px',
                      paddingRight: '52px'
                    }}
                    required 
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '18px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                  >
                    {showConfirmPassword ? (
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

              {/* Action Button */}
              <button 
                type="submit" 
                disabled={isLoading || !token}
                className="w-full bg-gradient-to-r from-[#3563e9] to-[#254dd0] hover:from-[#254dd0] hover:to-[#1d4ed8] text-white text-base font-semibold shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all duration-200 tracking-wide"
                style={{
                  paddingTop: '16px',
                  paddingBottom: '16px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: (isLoading || !token) ? 'not-allowed' : 'pointer',
                  opacity: (isLoading || !token) ? 0.6 : 1,
                  marginTop: '8px'
                }}
              >
                {isLoading ? 'Saving Password...' : 'Set Password'}
              </button>
            </form>

          </div>
        </div>
        
      </div>
    </div>
  );
}