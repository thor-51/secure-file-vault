// FILE: frontend/src/App.jsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe, selectInitializing, selectIsAuthenticated } from './store/slices/authSlice';
import { selectTheme } from './store/slices/uiSlice';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import FilesPage from './pages/FilesPage';
import UploadPage from './pages/UploadPage';
import SearchPage from './pages/SearchPage';
import AdminPage from './pages/AdminPage';
import SharedPage from './pages/SharedPage';
import SettingsPage from './pages/SettingsPage';

// Layout
import AppLayout from './components/layout/AppLayout';
import ToastContainer from './components/ui/ToastContainer';
import Spinner from './components/ui/Spinner';

// Route guards
const ProtectedRoute = ({ children }) => {
  const isAuth = useSelector(selectIsAuthenticated);
  return isAuth ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const user = useSelector((s) => s.auth.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const isAuth = useSelector(selectIsAuthenticated);
  return isAuth ? <Navigate to="/dashboard" replace /> : children;
};

export default function App() {
  const dispatch = useDispatch();
  const initializing = useSelector(selectInitializing);
  const theme = useSelector(selectTheme);

  // Attempt to restore session from stored token on app load
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      dispatch(fetchMe());
    } else {
      // No token — mark initialization done immediately
      dispatch({ type: 'auth/me/rejected' });
    }
  }, [dispatch]);

  // Apply theme class to document root
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

        {/* Protected routes inside AppLayout */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="shared" element={<SharedPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      <ToastContainer />
    </>
  );
}
