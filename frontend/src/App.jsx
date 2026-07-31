import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import CreatePasswordScreen from './pages/CreatePassword';
import LoginScreen from './pages/LoginScreen';
import RegisterCourse from './pages/RegisterCourse';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DashBoard from './pages/DashBoard';
import { useTheme } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';

function AppRoutes() {
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const themeClass = isDarkMode ? 'dark-theme' : '';
  const isDashboardPage = location.pathname === '/dashboard' || location.pathname.startsWith('/course/');

  return (
    <div className={`app-container ${themeClass}`}>
      {!isDashboardPage && <ThemeToggle className="theme-toggle-auth" />}
      <Routes>
        {/* Default route (Base URL) loads the Login screen */}
        <Route path="/" element={<LoginScreen />} />
        
        {/* Specific paths for each of your screens */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/create-password" element={<CreatePasswordScreen />} />
        <Route path="/register-course" element={<RegisterCourse />} />
        <Route path="/forgot-password" element={<ForgotPassword/>}/>
        <Route path="/reset-password" element={<ResetPassword/>}/>
        <Route path="/dashboard" element={<DashBoard/>}/>
        <Route path="/course/:courseId" element={<DashBoard/>}/>
        
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
