// FILE: frontend/src/components/files/FileCard.jsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { MoreVertical, Download, Pencil, Trash2, Share2, Globe, Lock, Users } from 'lucide-react';
import { deleteFile, renameFile } from '../../store/slices/filesSlice';
import { showToast } from '../../store/slices/uiSlice';
import { filesApi } from '../../api/index';
import FileIcon from '../ui/FileIcon';

function formatBytes(bytes) {
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const visibilityIcon = { public: Globe, private: Lock, specific_users: Users };
const visibilityColor = { public: 'var(--success)', private: 'var(--text-muted)', specific_users: 'var(--warning)' };

export default function FileCard({ file, onShare }) {
  const dispatch = useDispatch();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(file.name);
  const [downloading, setDownloading] = useState(false);

  const VisIcon = visibilityIcon[file.visibility] || Lock;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await filesApi.getDownloadUrl(file.id);
      window.open(res.data.data.url, '_blank');
    } catch {
      dispatch(showToast('Download failed', 'error'));
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${file.name}"?`)) return;
    await dispatch(deleteFile(file.id));
    dispatch(showToast('File deleted', 'success'));
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!newName.trim() || newName === file.name) { setRenaming(false); return; }
    await dispatch(renameFile({ id: file.id, name: newName.trim() }));
    dispatch(showToast('File renamed', 'success'));
    setRenaming(false);
  };

  return (
    <div
      className="card p-4 flex flex-col gap-3 group transition-all duration-150 hover:border-[color:var(--border-active)] relative"
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--bg-elevated)' }}>
          <FileIcon mimeType={file.mimeType} size={20} />
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Visibility badge */}
          <span className="badge badge-blue text-xs flex items-center gap-1">
            <VisIcon size={11} style={{ color: visibilityColor[file.visibility] }} />
            <span style={{ color: visibilityColor[file.visibility] }}>{file.visibility}</span>
          </span>

          {/* Context menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <MoreVertical size={15} />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-40 rounded-xl py-1 z-50 fade-in"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-elevated)' }}
                onMouseLeave={() => setMenuOpen(false)}
              >
                {[
                  { icon: Download, label: 'Download', action: handleDownload },
                  { icon: Pencil, label: 'Rename', action: () => { setRenaming(true); setMenuOpen(false); } },
                  { icon: Share2, label: 'Share', action: () => { onShare(file); setMenuOpen(false); } },
                ].map(({ icon: Icon, label, action }) => (
                  <button key={label} onClick={action}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-soft)'; e.currentTarget.style.color = 'var(--accent)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    <Icon size={14} />{label}
                  </button>
                ))}
                <div style={{ borderTop: '1px solid var(--border)' }} className="mt-1 pt-1">
                  <button onClick={handleDelete}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
                    style={{ color: 'var(--danger)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--danger-soft)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File name */}
      {renaming ? (
        <form onSubmit={handleRename}>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRename}
            className="input text-sm py-1.5"
          />
        </form>
      ) : (
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }} title={file.name}>
          {file.name}
        </p>
      )}

      {/* Meta */}
      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>{formatBytes(file.size)}</span>
        <span>{formatDate(file.createdAt)}</span>
      </div>

      {/* Tags */}
      {file.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {file.tags.slice(0, 3).map(({ tag }) => (
            <span key={tag.id} className="badge badge-blue text-xs">{tag.name}</span>
          ))}
        </div>
      )}
    </div>
  );
}
