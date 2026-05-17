// FILE: frontend/src/components/ui/StorageBar.jsx
import React from 'react';

function formatBytes(bytes) {
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default function StorageBar({ used, quota }) {
  const usedN = Number(used || 0);
  const quotaN = Number(quota || 10485760);
  const pct = Math.min(100, (usedN / quotaN) * 100);
  const color = pct > 90 ? 'var(--danger)' : pct > 70 ? 'var(--warning)' : 'var(--accent)';

  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
        <span>Storage</span>
        <span>{formatBytes(usedN)} / {formatBytes(quotaN)}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
