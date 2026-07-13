/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

// ─── Read logged-in user from localStorage ────────────────────
function getUser() {
  return {
    name:       localStorage.getItem('name')       || 'Employee',
    employeeId: localStorage.getItem('employeeId') || '—',
    role:       localStorage.getItem('role')       || 'approver',
  };
}

// Shared axios instance (baseURL + JWT interceptor) — see src/api/axios.js

// ─── Status badge colours ─────────────────────────────────────
const STATUS_STYLES = {
  'InProgress RM'    : { background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' },
  'RM Referred Back' : { background: '#fff8e1', color: '#b45309', border: '1px solid #fde68a' },
  'RM Rejected'      : { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' },
  'InProgress FATeam': { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' },
  'default'          : { background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' },
};

// ─── Styles — mirrors RequestorDashboard ─────────────────────
const S = {
  page: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    background: '#f0f2f8',
  },
  navbar: {
    height: 52,
    background: 'linear-gradient(90deg, #1a3a8f 0%, #1e4fc2 100%)',
    display: 'flex', alignItems: 'center',
    padding: '0 20px', gap: 10, flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  navBrand:   { color: '#fff', fontWeight: 700, fontSize: 17 },
  navDivider: { color: 'rgba(255,255,255,0.35)', fontSize: 15 },
  navTitle:   { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  navSpacer:  { flex: 1 },
  navRight:   { display: 'flex', alignItems: 'center', gap: 10 },
  navEmpId:   { color: '#fff', fontSize: 13, fontWeight: 500 },
  navRole:    { color: 'rgba(255,255,255,0.75)', fontSize: 11 },
  avatar: {
    width: 30, height: 30, borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    border: '1.5px solid rgba(255,255,255,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: 12, fontWeight: 600,
  },
  logoutBtn: {
    background: 'transparent', border: '1px solid rgba(255,255,255,0.35)',
    color: 'rgba(255,255,255,0.85)', fontSize: 11,
    padding: '4px 10px', borderRadius: 5, cursor: 'pointer',
  },
  main: { flex: 1, padding: '20px 28px', overflowY: 'auto' },
  filterBar: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: '#fff', borderRadius: 8, border: '0.5px solid #dde2f0',
    padding: '12px 16px', marginBottom: 16, flexWrap: 'wrap',
  },
  filterLabel: { fontSize: 12, color: '#5a6480', whiteSpace: 'nowrap' },
  filterInput: {
    padding: '6px 10px', fontSize: 13,
    border: '1px solid #d0d6e8', borderRadius: 5,
    outline: 'none', color: '#0d1b3e', minWidth: 130,
  },
  searchBtn: {
    padding: '7px 20px', background: '#1a3a8f',
    color: '#fff', border: 'none', borderRadius: 5,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  clearBtn: {
    padding: '7px 14px', background: 'transparent',
    color: '#5a6480', border: '1px solid #d0d6e8',
    borderRadius: 5, fontSize: 12, cursor: 'pointer',
  },
  card: {
    background: '#fff', borderRadius: 8,
    border: '0.5px solid #dde2f0', overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px', borderBottom: '0.5px solid #dde2f0',
  },
  sectionLabel: { fontSize: 13, fontWeight: 600, color: '#0d1b3e' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    background: '#f5f7fc', color: '#5a6480', fontWeight: 600, fontSize: 11,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    padding: '10px 14px', textAlign: 'left',
    borderBottom: '1px solid #dde2f0', whiteSpace: 'nowrap',
  },
  td: {
    padding: '11px 14px', borderBottom: '0.5px solid #eef0f8',
    color: '#2d3748', verticalAlign: 'middle',
  },
  statusBadge: {
    display: 'inline-block', fontSize: 11, fontWeight: 600,
    padding: '3px 10px', borderRadius: 99,
  },
  viewBtn: {
    width: 30, height: 30, borderRadius: 5,
    background: '#1a3a8f', color: '#fff',
    border: 'none', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 13,
  },
  toast: {
    background: '#edfaf3', border: '1px solid #b7e8cf',
    color: '#1a7a4a', borderRadius: 7,
    padding: '10px 16px', fontSize: 13, marginBottom: 14,
  },
  toastErr: {
    background: '#fdf0ee', border: '1px solid #f5c6c2',
    color: '#c0392b', borderRadius: 7,
    padding: '10px 16px', fontSize: 13, marginBottom: 14,
  },
  emptyRow:   { textAlign: 'center', padding: '40px 0', color: '#8a94a8', fontSize: 13 },
  loadingRow: { textAlign: 'center', padding: '40px 0', color: '#8a94a8', fontSize: 13 },
};

// ─── NAVBAR ──────────────────────────────────────────────────
function Navbar({ user, onLogout }) {
  const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <nav style={S.navbar}>
      <span style={S.navBrand}>HCLTech</span>
      <span style={S.navDivider}>|</span>
      <span style={S.navTitle}>FOS &gt; Asset Page Management</span>
      <div style={S.navSpacer} />
      <div style={S.navRight}>
        <div style={{ textAlign: 'right' }}>
          <div style={S.navEmpId}>{user.employeeId}</div>
          <div style={S.navRole}>{user.role}</div>
        </div>
        <div style={S.avatar}>{initials}</div>
        <button style={S.logoutBtn} onClick={onLogout}>Log out</button>
      </div>
    </nav>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────
function StatusBadge({ label }) {
  const style = STATUS_STYLES[label] || STATUS_STYLES['default'];
  return <span style={{ ...S.statusBadge, ...style }}>{label}</span>;
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────
export default function ApproverDashboard() {
  const navigate = useNavigate();
  const user     = getUser();

  const [requests,  setRequests]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [toast,     setToast]     = useState({ msg: '', type: 'ok' });
  const [refresh,   setRefresh]   = useState(0);

  // ── Filter state ──────────────────────────────────────────
  const [filters, setFilters] = useState({ from: '', to: '', requestNo: '' });
  const [applied, setApplied] = useState({ from: '', to: '', requestNo: '' });

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'ok' }), 3500);
  };

  // ── Fetch assigned requests ───────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/approver/');
        let data = res.data.requests || [];

        // Client-side filtering
        if (applied.requestNo) {
          data = data.filter(r =>
            r.requestNo.toLowerCase().includes(applied.requestNo.toLowerCase())
          );
        }
        if (applied.from) {
          data = data.filter(r =>
            r.submittedAt && new Date(r.submittedAt) >= new Date(applied.from)
          );
        }
        if (applied.to) {
  const toEnd = new Date(applied.to);
  toEnd.setHours(23, 59, 59, 999); // include the entire "to" day
  data = data.filter(r =>
    r.submittedAt && new Date(r.submittedAt) <= toEnd
  );
}

        if (!cancelled) setRequests(data);
      } catch (err) {
        if (!cancelled) showToast(err.response?.data?.message || 'Failed to load requests', 'err');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [applied, refresh]);

  // ── Handlers ──────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  const handleSearch = () => {
    setApplied({ ...filters });
  };

  const handleClearFilters = () => {
    setFilters({ from: '', to: '', requestNo: '' });
    setApplied({ from: '', to: '', requestNo: '' });
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <Navbar user={user} onLogout={handleLogout} />

      <main style={S.main}>

        {/* Toast */}
        {toast.msg && (
          <div style={toast.type === 'err' ? S.toastErr : S.toast}>
            {toast.msg}
          </div>
        )}

        {/* Filter bar */}
        <div style={S.filterBar}>
          <span style={S.filterLabel}>Submitted From:</span>
          <input type="date" style={S.filterInput}
            value={filters.from}
            onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
          <span style={S.filterLabel}>To:</span>
          <input type="date" style={S.filterInput}
            value={filters.to}
            onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
          <span style={S.filterLabel}>Request No:</span>
          <input type="text" style={{ ...S.filterInput, minWidth: 160 }}
            placeholder="e.g. ASSID000001"
            value={filters.requestNo}
            onChange={e => setFilters(f => ({ ...f, requestNo: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleSearch()} />
          <button style={S.searchBtn} onClick={handleSearch}>Search</button>
          <button style={S.clearBtn}  onClick={handleClearFilters}>Clear</button>
        </div>

        {/* Table card */}
        <div style={S.card}>
          <div style={S.cardHeader}>
            <div style={S.sectionLabel}>Pending Approvals</div>
            <div style={{ fontSize: 12, color: '#5a6480' }}>
              {requests.length} request{requests.length !== 1 ? 's' : ''} awaiting your action
            </div>
          </div>

          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Request No</th>
                <th style={S.th}>Date</th>
                <th style={S.th}>Requestor</th>
                <th style={S.th}>Entity Name</th>
                <th style={S.th}>Business Area</th>
                <th style={S.th}>Pending With</th>
                <th style={S.th}>View Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={S.loadingRow}>Loading...</td></tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} style={S.emptyRow}>
                    No pending requests assigned to you.
                  </td>
                </tr>
              ) : (
                requests.map(req => {
                  const statusLabel = req.status?.status_name || '—';
                  return (
                    <tr key={req.id}
                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ ...S.td, color: '#1a3a8f', fontWeight: 500, cursor: 'pointer' }}
                          onClick={() => navigate(`/approver/request/${req.id}`)}>
                        {req.requestNo}
                      </td>
                      <td style={S.td}>
                        {req.submittedAt
                          ? new Date(req.submittedAt).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            })
                          : '—'}
                      </td>
                      <td style={S.td}>{req.requester?.name || '—'}</td>
                      <td style={S.td}>{req.entityName || '—'}</td>
                      <td style={S.td}>{req.assetLocation || '—'}</td>
                      <td style={S.td}>
                        <StatusBadge label={statusLabel} />
                      </td>
                      <td style={S.td}>
                        <button
                          style={S.viewBtn}
                          title="Review request"
                          onClick={() => navigate(`/approver/request/${req.id}`)}>
                          ✎
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}