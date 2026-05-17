// FILE: frontend/src/pages/DashboardPage.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Files, Upload, HardDrive, Clock, ArrowRight } from 'lucide-react';
import { searchFiles, selectFiles, selectFilesLoading } from '../store/slices/filesSlice';
import { selectUser } from '../store/slices/authSlice';
import StorageBar from '../components/ui/StorageBar';
import FileCard from '../components/files/FileCard';
import ShareModal from '../components/files/ShareModal';
import Spinner from '../components/ui/Spinner';

function formatBytes(bytes) {
  const n = Number(bytes || 0);
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default function DashboardPage() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const files = useSelector(selectFiles);
  const loading = useSelector(selectFilesLoading);
  const [shareTarget, setShareTarget] = useState(null);

  useEffect(() => {
    dispatch(searchFiles({ limit: 6, sortBy: 'createdAt', sortOrder: 'desc' }));
  }, [dispatch]);

  const stats = [
    {
      label: 'Total Files',
      value: files.length,
      icon: Files,
      color: 'var(--accent)',
      bg: 'var(--accent-soft)',
    },
    {
      label: 'Storage Used',
      value: formatBytes(user?.storageUsed),
      icon: HardDrive,
      color: 'var(--success)',
      bg: 'rgba(104,211,145,0.1)',
    },
    {
      label: 'Quota Remaining',
      value: formatBytes(Number(user?.storageQuota || 0) - Number(user?.storageUsed || 0)),
      icon: Upload,
      color: 'var(--warning)',
      bg: 'rgba(246,173,85,0.1)',
    },
    {
      label: 'Last Upload',
      value: files[0] ? new Date(files[0].createdAt).toLocaleDateString() : '—',
      icon: Clock,
      color: '#9f7aea',
      bg: 'rgba(159,122,234,0.1)',
    },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
          {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Here's what's happening in your vault
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                <Icon size={17} style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Storage bar card */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Storage Quota</h2>
          <Link to="/upload" className="btn-primary text-xs px-3 py-1.5">
            <Upload size={13} /> Upload
          </Link>
        </div>
        <StorageBar used={user?.storageUsed} quota={user?.storageQuota} />
      </div>

      {/* Recent files */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Files</h2>
          <Link to="/files"
            className="text-sm flex items-center gap-1 transition-colors hover:opacity-80"
            style={{ color: 'var(--accent)' }}>
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size={28} />
          </div>
        ) : files.length === 0 ? (
          <div className="card p-12 text-center">
            <Files size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No files yet</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Upload your first file to get started</p>
            <Link to="/upload" className="btn-primary mx-auto">
              <Upload size={15} /> Upload a file
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {files.map((file) => (
              <FileCard key={file.id} file={file} onShare={setShareTarget} />
            ))}
          </div>
        )}
      </div>

      {shareTarget && <ShareModal file={shareTarget} onClose={() => setShareTarget(null)} />}
    </div>
  );
}
