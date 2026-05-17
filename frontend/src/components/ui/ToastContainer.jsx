// FILE: frontend/src/components/ui/ToastContainer.jsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { selectToasts, removeToast } from '../../store/slices/uiSlice';

const icons = {
  success: <CheckCircle size={16} />,
  error: <XCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  info: <Info size={16} />,
};

const colors = {
  success: 'var(--success)',
  error: 'var(--danger)',
  warning: 'var(--warning)',
  info: 'var(--accent)',
};

export default function ToastContainer() {
  const toasts = useSelector(selectToasts);
  const dispatch = useDispatch();

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2" style={{ maxWidth: '340px' }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-start gap-3 px-4 py-3 rounded-xl slide-up"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-elevated)',
            color: colors[toast.type] || 'var(--text-primary)',
          }}
        >
          <span className="mt-0.5 flex-shrink-0">{icons[toast.type] || icons.info}</span>
          <p className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{toast.message}</p>
          <button onClick={() => dispatch(removeToast(toast.id))} style={{ color: 'var(--text-muted)' }}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
