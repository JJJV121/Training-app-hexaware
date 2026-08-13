
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import CreatePasswordScreen from './pages/CreatePassword';
import SignUp from './pages/SignUp';
import LoginScreen from './pages/LoginScreen';
import RegisterCourse from './pages/RegisterCourse';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DashBoard from './pages/DashBoard';
import { useTheme } from './context/ThemeContext';

// Auth pages that should never receive the dark-theme class
const AUTH_PATHS = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/create-password'];

function AppRoutes() {
  const { isDarkMode } = useTheme();
  const location = useLocation();

  const isAuthPage = AUTH_PATHS.includes(location.pathname);
  const themeClass = isDarkMode && !isAuthPage ? 'dark-theme' : '';

  return (
    <div className={`app-container ${themeClass}`}>
      <Routes>
        {/* Default route (Base URL) loads the Login screen */}
        <Route path="/" element={<LoginScreen />} />
        
        {/* Specific paths for each of your screens */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/create-password" element={<CreatePasswordScreen />} />
        <Route path="/register-course" element={<RegisterCourse />} />
        <Route path="/forgot-password" element={<ForgotPassword/>}/>
        <Route path="/reset-password" element={<ResetPassword/>}/>
        <Route path="/dashboard" element={<DashBoard/>}/>
        
        {/* Catch-all route to redirect unknown URLs back to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;

