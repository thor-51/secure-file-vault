// FILE: frontend/src/pages/UploadPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ShieldCheck, Zap, Copy } from 'lucide-react';
import DropZone from '../components/files/DropZone';

const features = [
  { icon: ShieldCheck, label: 'AES-256 encrypted at rest', color: 'var(--success)' },
  { icon: Copy, label: 'SHA-256 deduplication', color: 'var(--accent)' },
  { icon: Zap, label: 'Instant CDN delivery', color: 'var(--warning)' },
];

export default function UploadPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-xl mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Upload Files</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Files are encrypted and deduplicated automatically
        </p>
      </div>

      <div className="card p-6 mb-4">
        <DropZone onSuccess={() => setTimeout(() => navigate('/files'), 800)} />
      </div>

      <div className="card p-4">
        <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)' }}>SECURITY FEATURES</p>
        <div className="space-y-2">
          {features.map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-3 text-sm">
              <Icon size={14} style={{ color }} />
              <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs mt-3 pt-3" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
          Max file size: 50MB · Quota: 10MB per account
        </p>
      </div>
    </div>
  );
}
