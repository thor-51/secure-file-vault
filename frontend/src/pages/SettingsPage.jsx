// FILE: frontend/src/pages/SettingsPage.jsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User, Moon, Sun, ShieldCheck } from 'lucide-react';
import { selectUser } from '../store/slices/authSlice';
import { selectTheme, toggleTheme } from '../store/slices/uiSlice';
import StorageBar from '../components/ui/StorageBar';

export default function SettingsPage() {
  const user = useSelector(selectUser);
  const theme = useSelector(selectTheme);
  const dispatch = useDispatch();

  return (
    <div className="max-w-xl space-y-5 fade-in">
      <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Settings</h1>

      {/* Profile card */}
      <div className="card p-6">
        <h2 className="text-sm font-medium mb-4" style={{ color: 'var(--text-muted)' }}>PROFILE</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-semibold"
            style={{ background: 'var(--accent)', color: '#fff' }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
            <span className="badge badge-blue mt-1">{user?.role}</span>
          </div>
        </div>
        <StorageBar used={user?.storageUsed} quota={user?.storageQuota} />
      </div>

      {/* Appearance */}
      <div className="card p-6">
        <h2 className="text-sm font-medium mb-4" style={{ color: 'var(--text-muted)' }}>APPEARANCE</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon size={18} style={{ color: 'var(--accent)' }} /> : <Sun size={18} style={{ color: 'var(--warning)' }} />}
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {theme === 'dark' ? 'Dark mode' : 'Light mode'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Click to switch theme</p>
            </div>
          </div>
          <button onClick={() => dispatch(toggleTheme())}
            className="relative w-12 h-6 rounded-full transition-colors"
            style={{ background: theme === 'dark' ? 'var(--accent)' : 'var(--border)' }}>
            <span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
              style={{ left: theme === 'dark' ? '26px' : '4px' }} />
          </button>
        </div>
      </div>

      {/* Security */}
      <div className="card p-6">
        <h2 className="text-sm font-medium mb-4" style={{ color: 'var(--text-muted)' }}>SECURITY</h2>
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
          <ShieldCheck size={18} style={{ color: 'var(--success)' }} />
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Files encrypted at rest</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>AES-256 server-side encryption via AWS S3</p>
          </div>
        </div>
      </div>
    </div>
  );
}
