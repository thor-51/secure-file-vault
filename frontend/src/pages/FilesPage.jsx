// FILE: frontend/src/pages/FilesPage.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Grid, List, RefreshCw, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { searchFiles, selectFiles, selectFilesLoading, selectPagination } from '../store/slices/filesSlice';
import FileCard from '../components/files/FileCard';
import ShareModal from '../components/files/ShareModal';
import Spinner from '../components/ui/Spinner';
import FileIcon from '../components/ui/FileIcon';

function formatBytes(b) {
  const n = Number(b || 0);
  return n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default function FilesPage() {
  const dispatch = useDispatch();
  const files = useSelector(selectFiles);
  const loading = useSelector(selectFilesLoading);
  const pagination = useSelector(selectPagination);
  const [viewMode, setViewMode] = useState('grid');
  const [page, setPage] = useState(1);
  const [shareTarget, setShareTarget] = useState(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    dispatch(searchFiles({ page, limit: 18, sortBy, sortOrder }));
  }, [dispatch, page, sortBy, sortOrder]);

  return (
    <div className="space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>My Files</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {pagination?.total ?? 0} files
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sort */}
          <select className="input text-sm py-2 w-36"
            value={`${sortBy}:${sortOrder}`}
            onChange={(e) => {
              const [s, o] = e.target.value.split(':');
              setSortBy(s); setSortOrder(o); setPage(1);
            }}>
            <option value="createdAt:desc">Newest first</option>
            <option value="createdAt:asc">Oldest first</option>
            <option value="name:asc">Name A–Z</option>
            <option value="name:desc">Name Z–A</option>
            <option value="size:desc">Largest first</option>
            <option value="size:asc">Smallest first</option>
          </select>

          {/* View toggle */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {[{ mode: 'grid', Icon: Grid }, { mode: 'list', Icon: List }].map(({ mode, Icon }) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className="p-2 transition-colors"
                style={{
                  background: viewMode === mode ? 'var(--accent-soft)' : 'transparent',
                  color: viewMode === mode ? 'var(--accent)' : 'var(--text-muted)',
                }}>
                <Icon size={16} />
              </button>
            ))}
          </div>

          <button onClick={() => dispatch(searchFiles({ page, limit: 18, sortBy, sortOrder }))}
            className="btn-ghost p-2" title="Refresh">
            <RefreshCw size={16} />
          </button>

          <Link to="/upload" className="btn-primary">
            <Upload size={15} /> Upload
          </Link>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={32} /></div>
      ) : files.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No files yet</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Upload your first file to see it here</p>
          <Link to="/upload" className="btn-primary mx-auto"><Upload size={15} /> Upload</Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((f) => <FileCard key={f.id} file={f} onShare={setShareTarget} />)}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Name', 'Size', 'Type', 'Date', 'Visibility'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.id} className="transition-colors"
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <FileIcon mimeType={f.mimeType} size={16} />
                      <span className="font-medium truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>{f.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{formatBytes(f.size)}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{f.mimeType?.split('/')[1]}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                    {new Date(f.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge badge-blue">{f.visibility}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={!pagination.hasPrev} onClick={() => setPage(p => p - 1)} className="btn-ghost px-3 py-1.5 text-sm">Prev</button>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button disabled={!pagination.hasNext} onClick={() => setPage(p => p + 1)} className="btn-ghost px-3 py-1.5 text-sm">Next</button>
        </div>
      )}

      {shareTarget && <ShareModal file={shareTarget} onClose={() => setShareTarget(null)} />}
    </div>
  );
}
