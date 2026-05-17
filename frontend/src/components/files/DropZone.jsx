// FILE: frontend/src/components/files/DropZone.jsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadFile, setUploadProgress } from '../../store/slices/filesSlice';
import { showToast } from '../../store/slices/uiSlice';
import { selectUploading, selectUploadProgress } from '../../store/slices/filesSlice';
import Spinner from '../ui/Spinner';

const ALLOWED = [
  'image/jpeg','image/png','image/gif','image/webp','image/svg+xml',
  'application/pdf','text/plain','text/csv','application/json',
  'application/zip','application/gzip',
  'video/mp4','video/webm','audio/mpeg','audio/wav',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export default function DropZone({ onSuccess }) {
  const dispatch = useDispatch();
  const uploading = useSelector(selectUploading);
  const progress = useSelector(selectUploadProgress);
  const [staged, setStaged] = useState([]);
  const [description, setDescription] = useState('');

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length) {
      dispatch(showToast(`${rejected.length} file(s) rejected (type or size)`, 'warning'));
    }
    setStaged((prev) => [...prev, ...accepted.map((f) => ({ file: f, id: Math.random() }))]);
  }, [dispatch]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 50 * 1024 * 1024,
    accept: ALLOWED.reduce((acc, m) => { acc[m] = []; return acc; }, {}),
    disabled: uploading,
  });

  const removeStaged = (id) => setStaged((prev) => prev.filter((f) => f.id !== id));

  const handleUpload = async () => {
    if (!staged.length) return;
    let successCount = 0;

    for (const { file, id } of staged) {
      const formData = new FormData();
      formData.append('file', file);
      if (description) formData.append('description', description);

      const result = await dispatch(uploadFile({
        formData,
        onProgress: (pct) => dispatch(setUploadProgress(pct)),
      }));

      if (uploadFile.fulfilled.match(result)) {
        successCount++;
        setStaged((prev) => prev.filter((f) => f.id !== id));
      } else {
        dispatch(showToast(`Failed: ${file.name} — ${result.payload}`, 'error'));
      }
    }

    if (successCount) {
      dispatch(showToast(`${successCount} file(s) uploaded successfully`, 'success'));
      setDescription('');
      onSuccess?.();
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop area */}
      <div
        {...getRootProps()}
        className="rounded-2xl p-10 text-center cursor-pointer transition-all duration-200"
        style={{
          border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--border)'}`,
          background: isDragActive ? 'var(--accent-soft)' : 'var(--bg-card)',
          transform: isDragActive ? 'scale(1.01)' : 'none',
        }}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: isDragActive ? 'var(--accent)' : 'var(--bg-elevated)' }}
          >
            <Upload size={24} style={{ color: isDragActive ? '#fff' : 'var(--accent)' }} />
          </div>
          <div>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              or <span style={{ color: 'var(--accent)' }}>browse files</span> — max 50MB each
            </p>
          </div>
        </div>
      </div>

      {/* Staged files */}
      {staged.length > 0 && (
        <div className="space-y-2">
          {staged.map(({ file, id }) => (
            <div key={id} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <File size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <span className="text-sm flex-1 truncate" style={{ color: 'var(--text-primary)' }}>{file.name}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
              <button onClick={() => removeStaged(id)} style={{ color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            </div>
          ))}

          {/* Description input */}
          <input
            className="input"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Upload progress bar */}
          {uploading && (
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{ width: `${progress}%`, background: 'var(--accent)' }}
              />
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="btn-primary w-full"
          >
            {uploading ? (
              <><Spinner size={14} /> Uploading {progress}%</>
            ) : (
              <><Upload size={15} /> Upload {staged.length} file{staged.length > 1 ? 's' : ''}</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
