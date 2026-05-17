// FILE: frontend/src/pages/RegisterPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, EyeOff, Vault, ArrowRight, Check } from 'lucide-react';
import { registerUser, clearError, selectAuthLoading, selectAuthError } from '../store/slices/authSlice';
import Spinner from '../components/ui/Spinner';

const rules = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /[0-9]/.test(p) },
];

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  useEffect(() => { return () => dispatch(clearError()); }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(registerUser(form));
    if (registerUser.fulfilled.match(result)) navigate('/login?registered=1');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-96 h-96 rounded-full opacity-5"
          style={{ background: '#9f7aea', filter: 'blur(80px)' }} />
      </div>

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'var(--accent)', boxShadow: '0 0 40px var(--accent-soft)' }}>
            <Vault size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Create account</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Your secure file vault awaits</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-lg text-sm"
                style={{ background: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid rgba(252,129,129,0.2)' }}>
                {error}
              </div>
            )}

            {[
              { name: 'name', label: 'Full name', type: 'text', placeholder: 'Jane Smith' },
              { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
            ].map(({ name, label, type, placeholder }) => (
              <div key={name}>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
                <input type={type} className="input" placeholder={placeholder}
                  value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                  required autoFocus={name === 'name'} />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input pr-10"
                  placeholder="Create a strong password"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password strength indicators */}
              {form.password && (
                <div className="mt-2 space-y-1">
                  {rules.map(({ label, test }) => (
                    <div key={label} className="flex items-center gap-2 text-xs">
                      <Check size={12} style={{ color: test(form.password) ? 'var(--success)' : 'var(--border)' }} />
                      <span style={{ color: test(form.password) ? 'var(--success)' : 'var(--text-muted)' }}>{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? <Spinner size={15} /> : <><span>Create account</span><ArrowRight size={15} /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)' }} className="font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
