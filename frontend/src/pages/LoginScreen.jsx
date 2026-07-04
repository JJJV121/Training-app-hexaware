import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
        localStorage.setItem('logged_in_user_id', user.id);
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

  return (
    <div className="login-wrapper min-h-screen w-full bg-gradient-to-br from-[#F4F7FC] via-[#F8FAFC] to-[#EFF6FF] font-sans" style={{ position: 'relative', overflow: 'hidden' }}>
      
      {/* --- BACKGROUND BLUR LAYER --- */}
      <div className="blur-layer-1"></div>
      <div className="blur-layer-2"></div>
      <div className="blur-layer-3"></div>
      <div className="blur-layer-4"></div>

      {/* --- MAIN CONTENT GRID WRAPPER --- */}
      <div className="content-grid w-full max-w-6xl mx-auto" style={{ position: 'relative', zIndex: 10 }}>
        
        {/* LEFT SIDE: Branding Statement */}
        <div className="flex flex-col items-center text-center md:items-start md:text-left select-none">
          <h1 className="brand-title text-[72px] md:text-[88px] font-black text-[#0061FE] tracking-tight leading-none">
            Sign In
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 font-medium tracking-tight md:ml-1">
            Sign in to your account
          </p>
        </div>

        {/* RIGHT SIDE: White Login Form Card */}
        <div className="form-card-wrapper w-full">
          <div className="form-card w-full bg-white shadow-[0_25px_70px_rgba(0,0,0,0.06)] backdrop-blur-xl border border-white/80 hover:shadow-[0_30px_80px_rgba(0,0,0,0.08)] transition-all duration-300">
            
            {/* Header Text */}
            <div className="card-header">
              <h2 className="text-[32px] font-bold text-[#0061FE] tracking-tight leading-tight">
                Welcome to Hexaware
              </h2>
              <p className="text-base text-gray-500 font-normal">
                Sign in with your User ID and Password
              </p>
            </div>

            {/* Error Notification Block */}
            {error && (
              <div className="error-notification">
                {error}
              </div>
            )}

            {/* Input Form Fields */}
            <form onSubmit={handleSubmit} className="login-form">
              
              {/* Field 1: Email */}
              <div className="input-group">
                <label htmlFor="email" className="text-[11px] font-bold text-gray-800 tracking-widest uppercase">
                  EMAIL
                </label>
                
                <div className="input-wrapper relative">
                  <span className="input-icon">
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
                    className="email-input w-full bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-base text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#3563e9] focus:ring-2 focus:ring-[#3563e9]/10 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {/* Field 2: Password */}
              <div className="input-group">
                <label htmlFor="password" className="text-[11px] font-bold text-gray-800 tracking-widest uppercase">
                  PASSWORD
                </label>
                
                {/* Note the 'relative' utility class on this wrapper to keep absolute elements bound inside */}
                <div className="input-wrapper relative">
                  <span className="input-icon">
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0V10.5m-2.25 0h13.5m-13.5 0a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25M6.75 10.5h10.5" />
                    </svg>
                  </span>
                  
                  {/* Added pr-12 padding-right so long typed text never overlaps behind the eye button */}
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="password-input w-full pl-11 pr-12 bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-base text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#3563e9] focus:ring-2 focus:ring-[#3563e9]/10 transition-all duration-200"
                    required
                  />

                  {/* Single Toggle Visibility Eye Button positioned perfectly on the right */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="toggle-visibility-btn absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
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
              <div className="options-row">
                <label className={`remember-label ${isLoading ? 'loading' : ''}`}>
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                    className="w-4 h-4 text-[#0061FE] bg-[#F1F5F9] border-gray-300 rounded focus:ring-[#0061FE]"
                  />
                  <span className="text-sm text-gray-600 font-medium select-none">Remember me</span>
                </label>
                
                <a href="/forgot-password" className="text-sm font-semibold text-[#0061FE] hover:underline">
                  Forgot password?
                </a>
              </div>

              {/* Submit Trigger Action Button */}
              <button 
                type="submit" 
                disabled={isLoading}
                className="submit-btn w-full bg-[#0061FE] hover:bg-[#0052CC] text-white text-base font-semibold shadow-md shadow-blue-100 transition-all tracking-wide"
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