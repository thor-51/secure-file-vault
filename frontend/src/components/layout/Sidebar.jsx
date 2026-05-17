// FILE: frontend/src/components/layout/Sidebar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard, Files, Upload, Search, Share2,
  Settings, ShieldCheck, LogOut, Vault, ChevronLeft,
} from 'lucide-react';
import { logoutUser } from '../../store/slices/authSlice';
import { selectSidebarOpen, toggleSidebar } from '../../store/slices/uiSlice';
import { showToast } from '../../store/slices/uiSlice';
import StorageBar from '../ui/StorageBar';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/files', icon: Files, label: 'My Files' },
  { to: '/upload', icon: Upload, label: 'Upload' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/shared', icon: Share2, label: 'Shared' },
];

const bottomItems = [
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isOpen = useSelector(selectSidebarOpen);
  const user = useSelector((s) => s.auth.user);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    dispatch(showToast('Logged out', 'info'));
    navigate('/login');
  };

  return (
    <aside
      className="fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300"
      style={{
        width: isOpen ? '240px' : '64px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 h-16" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--accent)', boxShadow: '0 0 20px var(--accent-soft)' }}>
          <Vault size={16} className="text-white" />
        </div>
        {isOpen && (
          <span className="font-semibold text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>
            SecureVault
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'text-[color:var(--accent)] bg-[color:var(--accent-soft)]'
                  : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--bg-elevated)]'
              }`
            }
          >
            <Icon size={17} className="flex-shrink-0" />
            {isOpen && <span className="truncate">{label}</span>}
          </NavLink>
        ))}

        {/* Admin link — only for admins */}
        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'text-[color:var(--warning)] bg-[rgba(246,173,85,0.1)]'
                  : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--bg-elevated)]'
              }`
            }
          >
            <ShieldCheck size={17} className="flex-shrink-0" />
            {isOpen && <span>Admin</span>}
          </NavLink>
        )}
      </nav>

      {/* Bottom section */}
      <div className="p-2" style={{ borderTop: '1px solid var(--border)' }}>
        {/* Storage bar */}
        {isOpen && user && (
          <div className="px-3 py-2 mb-2">
            <StorageBar used={user.storageUsed} quota={user.storageQuota} />
          </div>
        )}

        {bottomItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'text-[color:var(--accent)] bg-[color:var(--accent-soft)]'
                  : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--bg-elevated)]'
              }`
            }
          >
            <Icon size={17} />
            {isOpen && label}
          </NavLink>
        ))}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
          style={{ color: 'var(--danger)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--danger-soft)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={17} />
          {isOpen && 'Log out'}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="w-full flex items-center justify-center p-2 rounded-lg mt-1 transition-all duration-150"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <ChevronLeft size={16} style={{ transform: isOpen ? 'none' : 'rotate(180deg)', transition: 'transform 0.3s' }} />
        </button>
      </div>
    </aside>
  );
}
