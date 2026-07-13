// src/pages/Login.jsx
// Drop this into your frontend/src/pages/ folder



import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    background: '#e8edf5',
    backgroundImage: `
      repeating-radial-gradient(ellipse at 20% 50%, rgba(100,149,237,0.08) 0px, transparent 60px),
      repeating-radial-gradient(ellipse at 80% 20%, rgba(255,200,100,0.06) 0px, transparent 80px),
      repeating-radial-gradient(ellipse at 60% 80%, rgba(100,200,180,0.06) 0px, transparent 70px)
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
  },
  navBrand: {
    color: '#fff',
    fontWeight: 700,
    fontSize: 20,
    letterSpacing: '-0.3px',
  },
  navDivider: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 18,
    margin: '0 4px',
  },
  navPath: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: 400,
  },
  body: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
  },
  card: {
    display: 'flex',
    width: '100%',
    maxWidth: 860,
    minHeight: 460,
    borderRadius: 4,
    overflow: 'hidden',
    boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
  },
  leftPanel: {
    background: 'linear-gradient(160deg, #1e3fa0 0%, #1a3080 100%)',
    width: 340,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 32px',
    gap: 12,
  },
  leftTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 700,
    textAlign: 'center',
    lineHeight: 1.25,
    margin: 0,
  },
  leftSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    textAlign: 'center',
    margin: 0,
  },
  illustration: {
    marginTop: 20,
    width: 220,
    height: 170,
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 72,
    border: '1px solid rgba(255,255,255,0.12)',
  },
  rightPanel: {
    flex: 1,
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '48px 48px',
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 600,
    color: '#1a1a2e',
    margin: '0 0 28px',
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    fontSize: 14,
    border: '1px solid #c8d0e0',
    borderRadius: 3,
    outline: 'none',
    background: '#fff',
    color: '#1a1a2e',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  buttonRow: {
    display: 'flex',
    gap: 12,
    marginTop: 8,
  },
  loginBtn: {
    flex: 1,
    padding: '11px 0',
    background: 'linear-gradient(90deg, #1e3fa0, #2450c8)',
    color: '#fff',
    border: 'none',
    borderRadius: 3,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: '0.3px',
    transition: 'opacity 0.15s',
  },
  clearBtn: {
    flex: 1,
    padding: '11px 0',
    background: '#fff',
    color: '#1e3fa0',
    border: '1.5px solid #1e3fa0',
    borderRadius: 3,
    fontSize: 15,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  errorMsg: {
    color: '#c0392b',
    fontSize: 13,
    marginBottom: 12,
    padding: '8px 12px',
    background: '#fdf0ee',
    borderRadius: 3,
    border: '1px solid #f5c6c2',
  },
  registerLink: {
    marginTop: 20,
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    background: 'linear-gradient(90deg, #1a3a8f 0%, #1e4fc2 100%)',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontSize: 12,
    padding: '10px 20px',
  },
};

export default function Login() {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleClear = () => {
    setForm({ email: '', password: '' });
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/login', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role',  res.data.user.role);
      localStorage.setItem('name',       res.data.user.name);     
      localStorage.setItem('employeeId', res.data.user.employeeId); 
      const roleRedirect = {
      requester: '/dashboard/requester',
      approver:  '/dashboard/approver',
      fa_team:   '/dashboard/fa-team',
      taxation:  '/dashboard/taxation',
    };

    const destination = roleRedirect[res.data.user.role] || '/dashboard/requester';
    navigate(destination); // ← role-aware redirect

  } catch (err) {
    setError(err.response?.data?.message || 'Login failed. Please try again.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={styles.page}>
      {/* Navbar */}
      <nav style={styles.navbar}>
        <span style={styles.navBrand}>HCLTech</span>
        <span style={styles.navDivider}>|</span>
        <span style={styles.navPath}>FOS &gt; Asset Page Management</span>
      </nav>

      {/* Main body */}
      <div style={styles.body}>
        <div style={styles.card}>

          {/* Left panel */}
          <div style={styles.leftPanel}>
            <h1 style={styles.leftTitle}>Asset Page<br />Management</h1>
            <p style={styles.leftSubtitle}>Secure access to asset operations</p>
            <div style={styles.illustration}>
              🖥️
            </div>
          </div>

          {/* Right panel — form */}
          <div style={styles.rightPanel}>
            <h2 style={styles.formTitle}>Sign in to your account</h2>

            {error && <div style={styles.errorMsg}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div style={styles.inputGroup}>
                <input
                  style={styles.input}
                  name="email"
                  type="email"
                  placeholder="Username / Email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  onFocus={e => e.target.style.borderColor = '#1e3fa0'}
                  onBlur={e => e.target.style.borderColor = '#c8d0e0'}
                />
              </div>

              <div style={styles.inputGroup}>
                <input
                  style={styles.input}
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  onFocus={e => e.target.style.borderColor = '#1e3fa0'}
                  onBlur={e => e.target.style.borderColor = '#c8d0e0'}
                />
              </div>

              <div style={styles.buttonRow}>
                <button
                  type="submit"
                  style={{ ...styles.loginBtn, opacity: loading ? 0.75 : 1 }}
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Login'}
                </button>
                <button
                  type="button"
                  style={styles.clearBtn}
                  onClick={handleClear}
                  onMouseEnter={e => e.target.style.background = '#f0f4ff'}
                  onMouseLeave={e => e.target.style.background = '#fff'}
                >
                  Clear
                </button>
              </div>
            </form>

            <p style={styles.registerLink}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#1e3fa0', fontWeight: 500 }}>
                Register here
              </Link>
            </p>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        Best viewed on the latest versions of Edge, Chrome or Safari.
      </footer>
    </div>
  );
}