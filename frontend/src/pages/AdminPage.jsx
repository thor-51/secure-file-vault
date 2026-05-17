// FILE: frontend/src/pages/AdminPage.jsx
import React, { useEffect, useState } from 'react';
import { Users, Files, HardDrive, Activity, ShieldCheck, ToggleLeft } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { adminApi } from '../api/index';
import Spinner from '../components/ui/Spinner';

function formatBytes(bytes) {
  const n = Number(bytes || 0);
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

const COLORS = ['#63b3ed', '#9f7aea', '#68d391', '#f6ad55', '#fc8181', '#76e4f7'];

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    Promise.all([adminApi.getStats(), adminApi.listUsers()])
      .then(([statsRes, usersRes]) => {
        setStats(statsRes.data.data);
        setUsers(usersRes.data.data.users);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleToggleUser = async (id) => {
    await adminApi.toggleUserStatus(id);
    const res = await adminApi.listUsers();
    setUsers(res.data.data.users);
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size={32} /></div>;

  const uploadChartData = stats?.uploads?.byDay?.slice(-14).map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    uploads: d.count,
    size: +(d.size / 1024 / 1024).toFixed(2),
  })) || [];

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center gap-3">
        <ShieldCheck size={22} style={{ color: 'var(--warning)' }} />
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Admin Dashboard</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>System analytics and user management</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {['overview', 'users', 'audit'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all"
            style={{
              background: tab === t ? 'var(--accent-soft)' : 'transparent',
              color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
            }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: stats?.users?.total, icon: Users, color: 'var(--accent)' },
              { label: 'Active (7d)', value: stats?.users?.active, icon: Activity, color: 'var(--success)' },
              { label: 'Total Files', value: stats?.files?.total, icon: Files, color: '#9f7aea' },
              { label: 'Storage Used', value: formatBytes(stats?.users?.totalStorageUsed), icon: HardDrive, color: 'var(--warning)' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card p-5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: `${color}18` }}>
                  <Icon size={17} style={{ color }} />
                </div>
                <p className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{value ?? '—'}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Upload chart */}
          <div className="card p-6">
            <h2 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Upload Activity (last 14 days)</h2>
            {uploadChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={uploadChartData}>
                  <defs>
                    <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Area type="monotone" dataKey="uploads" stroke="var(--accent)" strokeWidth={2} fill="url(#colorUploads)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>No upload data yet</p>
            )}
          </div>

          {/* MIME type breakdown */}
          {stats?.files?.mimeTypeBreakdown?.length > 0 && (
            <div className="card p-6">
              <h2 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>File Types</h2>
              <div className="flex items-center gap-8">
                <PieChart width={160} height={160}>
                  <Pie data={stats.files.mimeTypeBreakdown} cx={75} cy={75} innerRadius={45} outerRadius={75}
                    dataKey="_count.id" paddingAngle={2}>
                    {stats.files.mimeTypeBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="space-y-2 flex-1">
                  {stats.files.mimeTypeBreakdown.map((item, i) => (
                    <div key={item.mimeType} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="truncate max-w-[160px]" style={{ color: 'var(--text-secondary)' }}>{item.mimeType}</span>
                      </div>
                      <span style={{ color: 'var(--text-muted)' }}>{item._count?.id ?? 0} files</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'users' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['User', 'Role', 'Files', 'Storage', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                        style={{ background: 'var(--accent)', color: '#fff' }}>
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{u.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.role === 'admin' ? 'badge-yellow' : 'badge-blue'}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{u.fileCount}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{formatBytes(u.storageUsed)}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                      {u.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleUser(u.id)} className="btn-ghost px-2 py-1 text-xs">
                      <ToggleLeft size={14} /> {u.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'audit' && (
        <AuditLogsTab />
      )}
    </div>
  );
}

function AuditLogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getAuditLogs({ limit: 50 })
      .then((res) => setLogs(res.data.data.logs))
      .finally(() => setLoading(false));
  }, []);

  const actionColor = {
    UPLOAD: 'var(--success)', DOWNLOAD: 'var(--accent)', DELETE: 'var(--danger)',
    LOGIN: 'var(--text-muted)', LOGOUT: 'var(--text-muted)', REGISTER: '#9f7aea',
    RENAME: 'var(--warning)', SHARE: 'var(--warning)',
  };

  if (loading) return <div className="flex justify-center py-8"><Spinner size={24} /></div>;

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Action', 'User', 'File', 'IP', 'Time'].map((h) => (
              <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <td className="px-4 py-2.5">
                <span className="text-xs font-mono font-medium" style={{ color: actionColor[log.action] || 'var(--text-primary)' }}>
                  {log.action}
                </span>
              </td>
              <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                {log.user?.email || '—'}
              </td>
              <td className="px-4 py-2.5 text-xs truncate max-w-[140px]" style={{ color: 'var(--text-muted)' }}>
                {log.file?.name || '—'}
              </td>
              <td className="px-4 py-2.5 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                {log.ipAddress || '—'}
              </td>
              <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                {new Date(log.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
