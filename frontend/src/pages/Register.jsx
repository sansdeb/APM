// src/pages/Register.jsx
// Matches the "Join the Network" reference UI
// Roles: requester | approver | fa_team | taxation
// Each role redirects to its own dashboard after registration

import { useState } from 'react';
import api from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';

// ─── Role definitions ────────────────────────────────────────────────────────
// Add or remove roles here — the UI pill buttons are generated from this array
const ROLES = [
  { value: 'requester',  label: 'Requester' },
  { value: 'approver',   label: 'Approver'  },
  { value: 'fa_team',    label: 'FA Team'   },
  { value: 'taxation',   label: 'Taxation'  },
];

// ─── After registration, each role goes to its own page ──────────────────────
const ROLE_REDIRECT = {
  requester: '/dashboard/requester',
  approver:  '/dashboard/approver',
  fa_team:   '/dashboard/fa-team',
  taxation:  '/dashboard/taxation',
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    background: '#f0f2f8',
    backgroundImage: `
      repeating-radial-gradient(ellipse at 15% 55%, rgba(100,149,237,0.07) 0px, transparent 70px),
      repeating-radial-gradient(ellipse at 85% 25%, rgba(255,200,100,0.05) 0px, transparent 90px)
    `,
  },
  navbar: {
    background: 'linear-gradient(90deg, #1a3a8f 0%, #1e4fc2 100%)',
    padding: '0 32px',
    height: 52,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
    flexShrink: 0,
  },
  navBrand:   { color: '#fff', fontWeight: 700, fontSize: 20 },
  navDivider: { color: 'rgba(255,255,255,0.4)', fontSize: 18, margin: '0 4px' },
  navPath:    { color: 'rgba(255,255,255,0.9)', fontSize: 14 },

  body: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '36px 20px',
  },
  card: {
    display: 'flex',
    width: '100%',
    maxWidth: 900,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 12px 48px rgba(0,0,0,0.16)',
  },

  // ── Left panel ──────────────────────────────────────────────────────────────
  left: {
    width: 300,
    flexShrink: 0,
    background: 'linear-gradient(170deg, #1e3fa0 0%, #152e80 100%)',
    display: 'flex',
    flexDirection: 'column',
    padding: '36px 28px',
    position: 'relative',
  },
  backLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    textDecoration: 'none',
    marginBottom: 48,
  },
  backArrow: {
    width: 26, height: 26,
    borderRadius: '50%',
    border: '1.5px solid rgba(255,255,255,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, color: '#fff',
  },
  leftHeading: {
    color: '#fff',
    fontSize: 34,
    fontWeight: 800,
    lineHeight: 1.15,
    margin: '0 0 20px',
    letterSpacing: '-0.5px',
  },
  leftDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 1.6,
    margin: 0,
  },
  badgeList: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  badgeIcon: {
    width: 28, height: 28,
    borderRadius: '50%',
    border: '1.5px solid rgba(255,255,255,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, color: '#fff', flexShrink: 0,
  },

  // ── Right panel ─────────────────────────────────────────────────────────────
  right: {
    flex: 1,
    background: '#fff',
    padding: '40px 44px 44px',
    overflowY: 'auto',
  },
  rightHeading: {
    fontSize: 26,
    fontWeight: 800,
    color: '#0d1b3e',
    margin: '0 0 4px',
    letterSpacing: '-0.3px',
  },
  rightSub: {
    fontSize: 11,
    fontWeight: 600,
    color: '#8a94a8',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    margin: '0 0 28px',
  },

  // ── Field label ─────────────────────────────────────────────────────────────
  fieldLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    fontSize: 11,
    fontWeight: 700,
    color: '#5a6480',
    letterSpacing: '0.09em',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  fieldIcon: { fontSize: 13, color: '#8a94a8' },

  // ── Input ───────────────────────────────────────────────────────────────────
  input: {
    width: '100%',
    padding: '0 0 10px',
    fontSize: 15,
    border: 'none',
    borderBottom: '1.5px solid #d0d6e8',
    outline: 'none',
    background: 'transparent',
    color: '#0d1b3e',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },

  // ── Two column row ──────────────────────────────────────────────────────────
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 28,
    marginBottom: 24,
  },
  col: { display: 'flex', flexDirection: 'column' },

  fieldGroup: { marginBottom: 24 },

  // ── Role pills ──────────────────────────────────────────────────────────────
  roleRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 24,
  },

  // ── Submit button ───────────────────────────────────────────────────────────
  submitBtn: {
    width: '100%',
    padding: '15px 0',
    background: 'linear-gradient(90deg, #1a3a8f, #1e4fc2)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    marginTop: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'opacity 0.15s',
  },

  errorMsg: {
    color: '#c0392b', fontSize: 13, marginBottom: 16,
    padding: '9px 13px', background: '#fdf0ee',
    borderRadius: 6, border: '1px solid #f5c6c2',
  },
  successMsg: {
    color: '#1a7a4a', fontSize: 13, marginBottom: 16,
    padding: '9px 13px', background: '#edfaf3',
    borderRadius: 6, border: '1px solid #b7e8cf',
  },

  footer: {
    background: 'linear-gradient(90deg, #1a3a8f 0%, #1e4fc2 100%)',
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    fontSize: 12,
    padding: '10px 20px',
    flexShrink: 0,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Register() {
  const [form, setForm] = useState({
    name: '',
    employeeId: '',
    email: '',
    role: 'requester',   // default selected role
    password: '',
  });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Generic field updater — works for all inputs
  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Role pill click
  const selectRole = value =>
    setForm({ ...form, role: value });

  // Focus / blur styling for underline inputs
  const onFocus = e => e.target.style.borderBottomColor = '#1e3fa0';
  const onBlur  = e => e.target.style.borderBottomColor = '#d0d6e8';

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.post('/api/auth/register', {
        name:       form.name,
        employeeId: form.employeeId,
        email:      form.email,
        role:       form.role,
        password:   form.password,
      });

      localStorage.setItem('token',      res.data.token);
      localStorage.setItem('role',       res.data.user.role);
      localStorage.setItem('name',       res.data.user.name);       // ← fixes navbar name
      localStorage.setItem('employeeId', res.data.user.employeeId); // ← fixes navbar ID

      setSuccess('Account created! Redirecting...');

      // Redirect to that role's dashboard
      setTimeout(() => navigate(ROLE_REDIRECT[form.role] || '/dashboard'), 1200);

    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      {/* Navbar */}
      <nav style={S.navbar}>
        <span style={S.navBrand}>HCLTech</span>
        <span style={S.navDivider}>|</span>
        <span style={S.navPath}>FOS &gt; Asset Page Management</span>
      </nav>

      <div style={S.body}>
        <div style={S.card}>

          {/* ── Left panel ─────────────────────────────────────────────── */}
          <div style={S.left}>
            <Link to="/login" style={S.backLink}>
              <div style={S.backArrow}>←</div>
              Back to Login
            </Link>

            <h1 style={S.leftHeading}>Join the<br />Network.</h1>
            <p style={S.leftDesc}>
              Create your account to start managing enterprise assets with precision and ease.
            </p>

            <div style={S.badgeList}>
              <div style={S.badge}>
                <div style={S.badgeIcon}>✓</div>
                Role-Based Access
              </div>
              <div style={S.badge}>
                <div style={S.badgeIcon}>✓</div>
                Secure Audit Trails
              </div>
            </div>
          </div>

          {/* ── Right panel ────────────────────────────────────────────── */}
          <div style={S.right}>
            <h2 style={S.rightHeading}>Registration Details</h2>
            <p style={S.rightSub}>Complete all fields to create your profile</p>

            {error   && <div style={S.errorMsg}>{error}</div>}
            {success && <div style={S.successMsg}>{success}</div>}

            <form onSubmit={handleSubmit}>

              {/* Row 1: Name + Employee ID */}
              <div style={S.row}>
                <div style={S.col}>
                  <label style={S.fieldLabel}>
                    <span style={S.fieldIcon}></span> Employee Name
                  </label>
                  <input
                    style={S.input}
                    name="name"
                    placeholder="Enter your name"
                    value={form.name}
                    onChange={handleChange}
                    onFocus={onFocus} onBlur={onBlur}
                    required
                  />
                </div>
                <div style={S.col}>
                  <label style={S.fieldLabel}>
                    <span style={S.fieldIcon}></span> Employee ID
                  </label>
                  <input
                    style={S.input}
                    name="employeeId"
                    placeholder="ID Number"
                    value={form.employeeId}
                    onChange={handleChange}
                    onFocus={onFocus} onBlur={onBlur}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div style={S.fieldGroup}>
                <label style={S.fieldLabel}>
                  <span style={S.fieldIcon}></span> Email Address
                </label>
                <input
                  style={S.input}
                  name="email"
                  type="email"
                  placeholder="Enter valid email"
                  value={form.email}
                  onChange={handleChange}
                  onFocus={onFocus} onBlur={onBlur}
                  required
                />
              </div>

              {/* Role selector */}
              <div style={S.fieldGroup}>
                <label style={{ ...S.fieldLabel, marginBottom: 12 }}>
                  Select Your Role
                </label>
                <div style={S.roleRow}>
                  {ROLES.map(r => {
                    const active = form.role === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => selectRole(r.value)}
                        style={{
                          padding: '10px 20px',
                          borderRadius: 8,
                          border: active ? '2px solid #1a3a8f' : '1.5px solid #d0d6e8',
                          background: active ? '#fff' : '#fff',
                          color: active ? '#1a3a8f' : '#8a94a8',
                          fontWeight: 700,
                          fontSize: 12,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 5,
                          transition: 'all 0.15s',
                          minWidth: 90,
                        }}
                      >
                        {/* Dot indicator — visible only on selected */}
                        <div style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: active ? '#1a3a8f' : 'transparent',
                          transition: 'background 0.15s',
                        }} />
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Password */}
              <div style={S.fieldGroup}>
                <label style={S.fieldLabel}>
                  <span style={S.fieldIcon}></span> Password
                </label>
                <input
                  style={S.input}
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  onFocus={onFocus} onBlur={onBlur}
                  required
                  minLength={6}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                style={{ ...S.submitBtn, opacity: loading ? 0.75 : 1 }}
                disabled={loading}
              >
                 {loading ? 'Creating Account...' : 'Create Account'}
              </button>

            </form>
          </div>

        </div>
      </div>

      <footer style={S.footer}>
        Best viewed on the latest versions of Edge, Chrome or Safari.
      </footer>
    </div>
  );
}