import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Calls the forgot-password endpoint as per your specs
      await axios.post('http://localhost:8000/auth/forgot-password', {
        email: email
      });
      
      // Update state to show the success UI
      setIsEmailSent(true);

    } catch (err) {
      console.error('API Error:', err);
      setError(err.response?.data?.detail || err.response?.data?.message || 'Something went wrong. Please try again.');
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

        {/* RIGHT SIDE: Card Container */}
        <div className="flex justify-center lg:justify-end xl:justify-center w-full">
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
            
            {!isEmailSent ? (
              /* --- STATE A: ENTER EMAIL FORM --- */
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h2 className="text-[34px] font-bold text-gray-900 tracking-tight leading-tight">
                    Forgot Password
                  </h2>
                  <p className="text-sm text-gray-500 font-normal mt-1 leading-relaxed">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>

                {error && (
                  <div style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '500' }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label htmlFor="email" className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">
                      EMAIL ADDRESS
                    </label>
                    
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                      <span style={{ position: 'absolute', left: '18px', display: 'flex', alignItems: 'center', color: '#9ca3af', pointerEvents: 'none' }}>
                        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0l-7.5-4.615m19.5 0A2.25 2.25 0 0 0 19.5 4.5" />
                        </svg>
                      </span>
                      
                      <input 
                        type="email" 
                        id="email" 
                        placeholder="your@email.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-base text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#3563e9] focus:ring-2 focus:ring-[#3563e9]/10 transition-all duration-200"
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
                      opacity: isLoading ? 0.7 : 1
                    }}
                  >
                    {isLoading ? 'Sending Link...' : 'Send Reset Link'}
                  </button>

                  {/* Back to Login Link */}
                  <div className="text-center mt-2">
                    <Link to="/login" className="text-sm font-semibold text-gray-500 hover:text-[#0061FE] transition-all flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                      </svg>
                      Back to Sign In
                    </Link>
                  </div>
                </form>
              </>
            ) : (
              /* --- STATE B: SUCCESS / CHECK EMAIL UI --- */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '24px' }}>
                <div style={{ backgroundColor: '#DCFCE7', padding: '20px', borderRadius: '50%', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg className="w-12 height-12" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '48px', height: '48px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                  </svg>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Check your email
                  </h2>
                  <p className="text-sm text-gray-500 font-normal max-w-sm">
                    If an account exists for <span className="font-semibold text-gray-950">{email}</span>, we've sent a password reset link. Please check your inbox.
                  </p>
                </div>

                <div className="flex flex-col gap-4 mt-2 w-full">
                  <Link 
                    to="/login"
                    className="w-full bg-[#0061FE] hover:bg-[#0052CC] text-white text-base font-semibold shadow-md shadow-blue-100 transition-all tracking-wide text-center"
                    style={{
                      paddingTop: '16px',
                      paddingBottom: '16px',
                      borderRadius: '12px',
                      textDecoration: 'none'
                    }}
                  >
                    Return to Sign In
                  </Link>
                  
                  <button 
                    type="button"
                    onClick={() => setIsEmailSent(false)}
                    className="text-sm font-semibold text-gray-500 hover:text-[#0061FE] hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Didn't receive the email? Try again
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
        
      </div>
    </div>
  );
}