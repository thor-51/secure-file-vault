// FILE: frontend/src/components/layout/Header.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { toggleTheme, selectTheme } from '../../store/slices/uiSlice';
import { logoutUser, selectUser } from '../../store/slices/authSlice';

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useSelector(selectTheme);
  const user = useSelector(selectUser);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <header
      className="flex items-center justify-between h-16 px-6 flex-shrink-0"
      style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
    >
      {/* Breadcrumb slot (empty for now — pages fill it via context) */}
      <div />

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={() => dispatch(toggleTheme())}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-elevated)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-150"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseLeave={(e) => { if (!menuOpen) e.currentTarget.style.background = 'transparent'; }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {user?.name?.split(' ')[0]}
            </span>
            <ChevronDown size={14} />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-52 rounded-xl py-1 z-50 fade-in"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-elevated)' }}
              onMouseLeave={() => setMenuOpen(false)}
            >
              <div className="px-3 py-2 mb-1" style={{ borderBottom: '1px solid var(--border)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
              </div>
              {[
                { icon: User, label: 'Profile', action: () => navigate('/settings') },
                { icon: Settings, label: 'Settings', action: () => navigate('/settings') },
              ].map(({ icon: Icon, label, action }) => (
                <button key={label} onClick={() => { action(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm transition-all duration-150"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-soft)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <Icon size={15} />{label}
                </button>
              ))}
              <div style={{ borderTop: '1px solid var(--border)' }} className="mt-1 pt-1">
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm transition-all duration-150"
                  style={{ color: 'var(--danger)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--danger-soft)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={15} /> Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
