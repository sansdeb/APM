// StatusHistoryModal.jsx
// Self-contained modal — pass requestId + onClose.
// Fetches GET /api/taxation/:id/status-history and renders a timeline.

import { useEffect, useState } from 'react';
import api from '../../api';


const STATUS_COLORS = {
  'Taxation Approved':        { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
  'Taxation Referred Back':   { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c' },
  'Taxation Validated Request':{ bg: '#eef2ff', border: '#c7d2fe', text: '#4338ca' },
  'InProgress Taxation':      { bg: '#e0f2fe', border: '#bae6fd', text: '#0369a1' },
  'InProgress FATeam':        { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
  'InProgress RM':            { bg: '#faf5ff', border: '#e9d5ff', text: '#7e22ce' },
  'InProgress Requestor':     { bg: '#fefce8', border: '#fef08a', text: '#854d0e' },
  'Requestor Saved':          { bg: '#f8fafc', border: '#e2e8f0', text: '#475569' },
  'FA Referred Back':         { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c' },
  'RM Referred Back':         { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c' },
  'FA Team Rejected':         { bg: '#fdf2f8', border: '#f5d0fe', text: '#86198f' },
  'RM Rejected':              { bg: '#fdf2f8', border: '#f5d0fe', text: '#86198f' },
  'Taxation Rejected':        { bg: '#fdf2f8', border: '#f5d0fe', text: '#86198f' },
  'Requestor Cancelled':      { bg: '#f9fafb', border: '#d1d5db', text: '#6b7280' },
};

const defaultColor = { bg: '#f8fafc', border: '#e2e8f0', text: '#334155' };

function StatusBadge({ label }) {
  const c = STATUS_COLORS[label] || defaultColor;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
      whiteSpace: 'nowrap',
    }}>
      {label || '—'}
    </span>
  );
}

export default function StatusHistoryModal({ requestId, requestNo, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

 useEffect(() => {
    api.get(`/taxation/${requestId}/status-history`)
      .then(res => {
        setHistory(res.data.history || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load history.');
        setLoading(false);
      });
  }, [requestId]);

  return (
    // ── Backdrop ─────────────────────────────────────────────
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      {/* ── Modal box ────────────────────────────────────────── */}
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 12, width: '100%', maxWidth: 680,
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid #e8ecf5',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(90deg,#1a3a8f,#1e4fc2)', borderRadius: '12px 12px 0 0',
        }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Status History</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>
              {requestNo}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 13,
          }}>✕ Close</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
          {loading && (
            <div style={{ textAlign: 'center', color: '#8a94a8', padding: 32, fontSize: 13 }}>
              Loading history...
            </div>
          )}
          {error && (
            <div style={{ color: '#c0392b', fontSize: 13, padding: 16 }}>{error}</div>
          )}
          {!loading && !error && history.length === 0 && (
            <div style={{ textAlign: 'center', color: '#8a94a8', padding: 32, fontSize: 13 }}>
              No history found.
            </div>
          )}

          {/* Timeline */}
          {!loading && history.map((entry, idx) => (
            <div key={entry.id} style={{ display: 'flex', gap: 16, marginBottom: 0 }}>
              {/* Left: line + dot */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%', marginTop: 4, flexShrink: 0,
                  background: '#1a3a8f', border: '2px solid #c7d2fe',
                }} />
                {idx < history.length - 1 && (
                  <div style={{ width: 2, flex: 1, background: '#e8ecf5', minHeight: 24, marginTop: 4 }} />
                )}
              </div>

              {/* Right: card */}
              <div style={{
                flex: 1, background: '#f8fafc', border: '1px solid #e8ecf5',
                borderRadius: 8, padding: '12px 16px', marginBottom: 16,
              }}>
                {/* Status transition row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  {entry.fromStatus
                    ? <StatusBadge label={entry.fromStatus} />
                    : <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>—</span>}
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>→</span>
                  <StatusBadge label={entry.toStatus} />
                </div>

                {/* Actor + timestamp */}
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4, marginBottom: entry.comment ? 8 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', background: '#1a3a8f',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 9, fontWeight: 700, flexShrink: 0,
                    }}>
                      {(entry.changedByName || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#0d1b3e' }}>
                      {entry.changedByName || 'Unknown'}
                    </span>
                    {entry.changedByEmployeeId && (
                      <span style={{ fontSize: 11, color: '#8a94a8' }}>({entry.changedByEmployeeId})</span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: '#8a94a8' }}>
                    {entry.changedAt
                      ? new Date(entry.changedAt).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit', hour12: true,
                        })
                      : '—'}
                  </span>
                </div>

                {/* Comment */}
                {entry.comment && (
                  <div style={{
                    fontSize: 12, color: '#334155', background: '#fff',
                    border: '1px solid #e8ecf5', borderRadius: 6,
                    padding: '8px 12px', lineHeight: 1.6, whiteSpace: 'pre-wrap',
                  }}>
                    "{entry.comment}"
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}