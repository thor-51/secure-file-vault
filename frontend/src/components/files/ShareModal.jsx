// FILE: frontend/src/components/files/ShareModal.jsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { X, Globe, Lock, Users } from 'lucide-react';
import { shareFile } from '../../store/slices/filesSlice';
import { showToast } from '../../store/slices/uiSlice';
import Spinner from '../ui/Spinner';

const options = [
  { value: 'private', icon: Lock, label: 'Private', desc: 'Only you can access' },
  { value: 'public', icon: Globe, label: 'Public', desc: 'Anyone with the link' },
  { value: 'specific_users', icon: Users, label: 'Specific Users', desc: 'Select who can access' },
];

export default function ShareModal({ file, onClose }) {
  const dispatch = useDispatch();
  const [visibility, setVisibility] = useState(file.visibility);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await dispatch(shareFile({ id: file.id, data: { visibility } }));
    dispatch(showToast('Sharing updated', 'success'));
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="card slide-up w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Share File</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <p className="text-sm mb-4 truncate" style={{ color: 'var(--text-secondary)' }}>{file.name}</p>

        <div className="space-y-2 mb-6">
          {options.map(({ value, icon: Icon, label, desc }) => (
            <button
              key={value}
              onClick={() => setVisibility(value)}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-150"
              style={{
                background: visibility === value ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                border: `1px solid ${visibility === value ? 'var(--border-active)' : 'var(--border)'}`,
              }}
            >
              <Icon size={16} style={{ color: visibility === value ? 'var(--accent)' : 'var(--text-muted)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: visibility === value ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {label}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? <Spinner size={14} /> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
