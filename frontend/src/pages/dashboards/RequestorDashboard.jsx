// src/pages/dashboards/RequesterDashboard.jsx
//
// Matches the reference dashboard image:
//   - HCLTech navbar with employee ID + role top right
//   - Filter bar: Invoice From Date, ToDate, RequestNo, Search
//   - "Create Asset Details" green button
//   - "Requestor Details:" table with columns:
//       Request | Date | Entity Name | Business Area | Pending With | View Details
//   - Edit (yellow) + Delete (red) action buttons per row
//   - Pagination at bottom
//
// API calls:
//   GET  /api/assets          → load requests list
//   GET  /api/assets?filters  → filtered list
//   POST /api/assets/save     → save draft from form
//   POST /api/assets/submit   → submit form
//   DELETE /api/assets/:id    → soft delete

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import AssetForm from '../components/AssetForm';

// ─── Read logged-in user from localStorage ────────────────────
function getUser() {
  return {
    name:       localStorage.getItem('name')       || 'Employee',
    employeeId: localStorage.getItem('employeeId') || '—',
    role:       localStorage.getItem('role')       || 'requester',
  };
}

// Shared axios instance (baseURL + JWT interceptor) — see src/api/axios.js

// ─── Status badge colours ─────────────────────────────────────
const STATUS_STYLES = {
  'Requestor Saved':       { background: '#fff8e1', color: '#b45309', border: '1px solid #fde68a' },
  'InProgress RM':         { background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' },
  'Taxation Referred Back':{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' },
  'default':               { background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' },
};
// ─── Styles ───────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    background: '#f0f2f8',
  },

  // ── Navbar ──────────────────────────────────────────────────
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
  navRight: {
    display: 'flex', alignItems: 'center', gap: 10,
  },
  navEmpId: {
    color: '#fff', fontSize: 13, fontWeight: 500,
  },
  navRole: {
    color: 'rgba(255,255,255,0.75)', fontSize: 11,
  },
  avatar: {
    width: 30, height: 30, borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    border: '1.5px solid rgba(255,255,255,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: 12, fontWeight: 600,
  },
  logoutBtn: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.35)',
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11, padding: '4px 10px', borderRadius: 5, cursor: 'pointer',
  },

  // ── Main area ────────────────────────────────────────────────
  main: { flex: 1, padding: '20px 28px', overflowY: 'auto' },

  // ── Filter bar ───────────────────────────────────────────────
  filterBar: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: '#fff', borderRadius: 8,
    border: '0.5px solid #dde2f0',
    padding: '12px 16px', marginBottom: 16, flexWrap: 'wrap',
  },
  filterLabel: { fontSize: 12, color: '#5a6480', whiteSpace: 'nowrap' },
  filterInput: {
    padding: '6px 10px', fontSize: 13,
    border: '1px solid #d0d6e8', borderRadius: 5,
    outline: 'none', color: '#0d1b3e',
    minWidth: 130,
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

  // ── Table card ───────────────────────────────────────────────
  card: {
    background: '#fff', borderRadius: 8,
    border: '0.5px solid #dde2f0',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '0.5px solid #dde2f0',
  },
  createAssetBtn: {
    padding: '8px 18px', background: '#16a34a',
    color: '#fff', border: 'none', borderRadius: 6,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  sectionLabel: {
    fontSize: 13, fontWeight: 600, color: '#0d1b3e',
  },

  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    background: '#f5f7fc', color: '#5a6480',
    fontWeight: 600, fontSize: 11,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    padding: '10px 14px', textAlign: 'left',
    borderBottom: '1px solid #dde2f0', whiteSpace: 'nowrap',
  },
  td: {
    padding: '11px 14px', borderBottom: '0.5px solid #eef0f8',
    color: '#2d3748', verticalAlign: 'middle',
  },
  trHover: { background: '#f9fafb' },

  // Status badge
  statusBadge: {
    display: 'inline-block', fontSize: 11, fontWeight: 600,
    padding: '3px 10px', borderRadius: 99,
  },

  // Action buttons
  editBtn: {
    width: 30, height: 30, borderRadius: 5,
    background: '#f59e0b', color: '#fff',
    border: 'none', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 13, marginRight: 6,
  },
  deleteBtn: {
    width: 30, height: 30, borderRadius: 5,
    background: '#ef4444', color: '#fff',
    border: 'none', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 13,
  },

  // ── Pagination ───────────────────────────────────────────────
  pagination: {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '12px 16px', justifyContent: 'flex-start',
  },
  pageBtn: {
    minWidth: 32, height: 32, borderRadius: 5,
    border: '1px solid #d0d6e8', background: '#fff',
    color: '#5a6480', fontSize: 13, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  pageBtnActive: {
    background: '#1a3a8f', color: '#fff',
    border: '1px solid #1a3a8f', fontWeight: 600,
  },

  // ── Toast ────────────────────────────────────────────────────
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

  emptyRow: {
    textAlign: 'center', padding: '40px 0',
    color: '#8a94a8', fontSize: 13,
  },

  loadingRow: {
    textAlign: 'center', padding: '40px 0',
    color: '#8a94a8', fontSize: 13,
  },
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
        {/* Employee ID + role stacked */}
        <div style={{ textAlign: 'right' }}>
          <div style={S.navEmpId}>{user.employeeId}</div>
          <div style={S.navRole}>{user.role}</div>
        </div>
        {/* Avatar circle */}
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

// ─── PAGINATION BUTTON ───────────────────────────────────────
// Defined OUTSIDE RequesterDashboard so React sees it as a stable
// component type across renders. Receives page + setPage as props
// instead of closing over them (they'd be stale otherwise).
function PaginationBtn({ label, pg, currentPage, disabled, onPageChange }) {
  return (
    <button
      style={{
        ...S.pageBtn,
        ...(pg === currentPage ? S.pageBtnActive : {}),
        opacity: disabled ? 0.4 : 1,
        cursor:  disabled ? 'not-allowed' : 'pointer',
      }}
      onClick={() => !disabled && pg !== currentPage && onPageChange(pg)}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────
export default function RequesterDashboard() {
  const navigate = useNavigate();
  const user     = getUser();

  // ── UI state ──────────────────────────────────────────────
  const [isFormOpen,  setIsFormOpen]  = useState(false);
  const [editRequest, setEditRequest] = useState(null); // request being edited
  const [toast,       setToast]       = useState({ msg: '', type: 'ok' });

  // ── Table state ───────────────────────────────────────────
  const [requests,   setRequests]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // Incrementing this triggers a re-fetch without changing page or filters
  // Used by Save, Submit, Delete handlers to refresh the list after an action
  const [refresh,    setRefresh]    = useState(0);
  const triggerRefresh = () => setRefresh(r => r + 1);

  // ── Filter state ──────────────────────────────────────────
  const [filters, setFilters] = useState({ from: '', to: '', requestNo: '' });
  const [applied, setApplied] = useState({ from: '', to: '', requestNo: '' });
  // "filters" = what's typed in the inputs
  // "applied" = what's actually sent to the API (only updates on Search click)

  // ── Toast helper ──────────────────────────────────────────
  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'ok' }), 3500);
  };

  // ── Fetch requests from API ───────────────────────────────
  // Plain useEffect — fetch logic lives directly inside.
  // Runs on mount and whenever page or applied filters change.
  // showToast is intentionally excluded from deps: it's a stable
  // helper that only calls setState, and including it would cause
  // the cascading render warning React flagged.
  useEffect(() => {
    let cancelled = false; // prevents setState after unmount

    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page, limit: 3 });
        if (applied.from)      params.append('from',      applied.from);
        if (applied.to)        params.append('to',        applied.to);
        if (applied.requestNo) params.append('requestNo', applied.requestNo);

        const res = await api.get(`/api/assets?${params.toString()}`);
        if (!cancelled) {
          setRequests(res.data.requests    || []);
          setTotalPages(res.data.totalPages || 1);
        }
      } catch (err) {
        if (!cancelled) {
          setToast({
            msg:  err.response?.data?.message || 'Failed to load requests',
            type: 'err',
          });
          setTimeout(() => setToast({ msg: '', type: 'ok' }), 3500);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; }; // cleanup on unmount
  }, [page, applied, refresh]); // ← only re-run when page, filters, or refresh change

  // ── Handlers ──────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  const handleSearch = () => {
    setApplied({ ...filters }); // copy filter inputs to applied
    setPage(1);                  // reset to page 1 on new search
  };

  const handleClearFilters = () => {
    setFilters({ from: '', to: '', requestNo: '' });
    setApplied({ from: '', to: '', requestNo: '' });
    setPage(1);
  };

  // ── Upload documents ──────────────────────────────────────
  // Called after save or submit with the requestId and docs object.
  // docs = { farDocument: File|null, otherDocuments: File|null, ... }
  // Uses FormData (multipart) — cannot send files as JSON.
  // Silently skips if no files are selected.
  const uploadDocs = async (requestId, docs) => {
    if (!docs) return;
    const hasFiles = Object.values(docs).some(f => f instanceof File);
    if (!hasFiles) return;

    const formData = new FormData();
    // Map slot names to the field names multer expects
    const SLOT_MAP = {
      farDocument:         'far',
      otherDocuments:      'other',
      sourcingApproval:    'sourcing',
      dc:                  'dc',
      paymentConfirmation: 'payment',
    };
    Object.entries(docs).forEach(([slot, file]) => {
      if (file instanceof File) {
        formData.append(SLOT_MAP[slot] || slot, file);
      }
    });

    try {
      await api.post(`/api/assets/${requestId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch (err) {
      // Don't block the user — show a warning but don't fail the whole save
      showToast(`Files could not be uploaded: ${err.response?.data?.message || err.message}`, 'err');
    }
  };

  // ── Save handler ──────────────────────────────────────────
  const handleFormSave = async (formData) => {
    try {
      const payload = buildPayload(formData);
      if (editRequest?.id) payload.requestId = editRequest.id;

      const res       = await api.post('/api/assets/save', payload);
      const requestId = res.data.requestId;
      const requestNo = res.data.requestNo;

      // Upload documents
      await uploadDocs(requestId, formData.docs);

      // Re-fetch the full request so initialData includes the
      // newly uploaded documents. Without this, the upload section
      // clears because editRequest.initialData.uploadedDocs is stale.
      const detailRes = await api.get(`/api/assets/${requestId}`);
      const data      = detailRes.data;
      const cc        = data.companyCode;

      const freshInitialData = {
        readOnly:         false,
        salesType:        data.salesType?.label         || '',
        assetCategory:    data.assetCategory?.label     || '',
        companyCode:      data.companyCodeLabel         || (cc ? `${cc.code}   ${cc.entityName}` : ''),
        categoryOfUnits:  data.categoryOfUnits          || data.unitCategory?.label || '',
        documentType:     data.documentType?.label      || '',
        taxType:          data.taxType?.label           || '',
        entityName:       data.entityName               || '',
        assetLocation:    data.assetLocation            || '',
        grossValue:       data.grossValue               || '',
        wdv:              data.wdv                      || '',
        costCenter:       data.costCenter               || '',
        salesValue:       data.salesValue               || '',
        comments:         data.comments                 || '',
        consignerName:     data.consignerName     || '',
        consignerAddress:  data.consignerAddress  || '',
        consignerPincode:  data.consignerPincode  || '',
        consignerLocation: data.consignerLocation || '',
        plantCode:         data.plantCode         || '',
        consignerGstin:    data.consignerGstin    || '',
        consigneeName:            data.consigneeName            || '',
        consigneeAddress:         data.consigneeAddress         || '',
        consigneePincode:         data.consigneePincode         || '',
        consigneeLocation:        data.consigneeLocation        || '',
        consigneeGstin:           data.consigneeGstin           || '',
        consigneeCategoryOfUnits: data.consigneeCategoryOfUnits || '',
        consigneePlantCode:       data.consigneePlantCode       || '',
        consigneeCostCentre:      data.consigneeCostCentre      || '',
        shipToName:    data.shipToName    || '',
        shipToAddress: data.shipToAddress || '',
        shipToGstin:   data.shipToGstin   || '',
        type:          data.type          || '',
        lineItems: Array.isArray(data.items)
          ? data.items.map(item => ({
              id:          item.id || Date.now() + Math.random(),
              description: item.description || '',
              uqc:         item.uqcCode     || '',
              quantity:    item.quantity     || '',
              rate:        item.rate         || '',
              hsnCode:     item.hsnCode      || '',
            }))
          : [],
        // Fresh document list from DB — this is the key fix
        uploadedDocs: Array.isArray(data.documents) ? data.documents : [],
      };

      setEditRequest({ id: requestId, requestNo, initialData: freshInitialData });
      showToast(`Draft saved — ${requestNo}`);
      triggerRefresh();
    } catch (err) {
      showToast(err.response?.data?.message || 'Save failed', 'err');
    }
  };

  // ── Submit handler ────────────────────────────────────────
  const handleFormSubmit = async (formData) => {
    try {
      const payload = buildPayload(formData);

      // Validate line items
      const validItems = (formData.lineItems || []).filter(item =>
        item.description?.trim() &&
        parseFloat(item.quantity) > 0 &&
        parseFloat(item.rate)     > 0
      );
      if (validItems.length === 0) {
        showToast('Please add at least one line item with description, quantity and rate before submitting', 'err');
        return;
      }

      // Step 1: Save to get/create requestId
      if (editRequest?.id) payload.requestId = editRequest.id;
      const saveRes  = await api.post('/api/assets/save', payload);
      const requestId = saveRes.data.requestId;

      // Step 2: Upload documents
      await uploadDocs(requestId, formData.docs);

      // Step 3: Submit — transitions status to InProgress RM
      const submitPayload = { ...payload, requestId };
      const submitRes = await api.post('/api/assets/submit', submitPayload);

      showToast(`Request ${submitRes.data.requestNo} submitted — In Progress RM`);
      localStorage.removeItem('assetFormDraft');
      setIsFormOpen(false);
      setEditRequest(null);
      triggerRefresh();
    } catch (err) {
      const msg     = err.response?.data?.message || 'Submit failed';
      const missing = err.response?.data?.missingFields;
      showToast(missing ? `${msg}: ${missing.join(', ')}` : msg, 'err');
    }
  };

  // ── Delete handler — calls DELETE /api/assets/:id ─────────
  const handleDelete = async (request) => {
    // Only show confirm if Requestor Saved
    const statusLabel = request.status?.statusDescription || '';
    if (statusLabel !== 'Requestor Saved') {
      showToast('Only draft requests can be deleted', 'err');
      return;
    }
    if (!window.confirm(`Delete request ${request.requestNo}?`)) return;
    try {
      await api.delete(`/api/assets/${request.id}`);
      showToast(`Request ${request.requestNo} deleted`);
      triggerRefresh();
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'err');
    }
  };

  // ── Open form for viewing/editing a request ───────────────
  const handleEdit = async (request) => {
    try {
      const res  = await api.get(`/api/assets/${request.id}`);
      const data = res.data;

      const statusLabel    = data.status?.statusDescription || '';
      const statusName     = data.status?.statusName || '';
      const isReferredBack = statusName === 'Taxation Referred Back';
      const isEditable     = statusLabel === 'Requestor Saved' || isReferredBack;

      // Reconstruct company code label to match dropdown option format
      // e.g. "1000   HCL Technologies Ltd"
      const cc = data.companyCode;
      // eslint-disable-next-line no-unused-vars
      const companyCodeLabel = cc ? `${cc.code}   ${cc.entityName}` : '';

      const initialData = {
        readOnly: !isEditable,
        isReferredBack,

        // Dropdown fields — prefer plain text columns which always save correctly
        // Fall back to joined object label if plain text column is empty
        salesType:       data.salesType?.label            || '',
        assetCategory:   data.assetCategory?.label        || '',
        companyCode:     data.companyCodeLabel            || (cc ? `${cc.code}   ${cc.entityName}` : ''),
        categoryOfUnits: data.categoryOfUnits             || data.unitCategory?.label || '',
        documentType:    data.documentType?.label         || '',
        taxType:         data.taxType?.label              || '',

        // Asset detail text/number fields
        entityName:    data.entityName    || '',
        assetLocation: data.assetLocation || '',
        grossValue:    data.grossValue    || '',
        wdv:           data.wdv           || '',
        costCenter:    data.costCenter    || '',
        salesValue:    data.salesValue    || '',
        comments:      data.comments      || '',

        // Consigner — now direct columns on asset_requests
        consignerName:     data.consignerName     || '',
        consignerAddress:  data.consignerAddress  || '',
        consignerPincode:  data.consignerPincode  || '',
        consignerLocation: data.consignerLocation || '',
        plantCode:         data.plantCode         || '',
        consignerGstin:    data.consignerGstin    || '',

        // Consignee — now direct columns on asset_requests
        consigneeName:            data.consigneeName            || '',
        consigneeAddress:         data.consigneeAddress         || '',
        consigneePincode:         data.consigneePincode         || '',
        consigneeLocation:        data.consigneeLocation        || '',
        consigneeGstin:           data.consigneeGstin           || '',
        consigneeCategoryOfUnits: data.consigneeCategoryOfUnits || '',
        consigneePlantCode:       data.consigneePlantCode       || '',
        consigneeCostCentre:      data.consigneeCostCentre      || '',

        // Ship To — now direct columns on asset_requests
        shipToName:    data.shipToName    || '',
        shipToAddress: data.shipToAddress || '',
        shipToGstin:   data.shipToGstin   || '',
        type:          data.type          || '',

        // Line items — map DB columns back to form field names
        // DB: { sno, description, uqcCode, quantity, rate, hsnCode }
        // Form: { id, description, uqc, quantity, rate, hsnCode }
        lineItems: Array.isArray(data.items)
          ? data.items.map(item => ({
              id:          item.id || Date.now() + Math.random(),
              description: item.description || '',
              uqc:         item.uqcCode     || '',
              quantity:    item.quantity     || '',
              rate:        item.rate         || '',
              hsnCode:     item.hsnCode      || '',
            }))
          : [],

        // Uploaded documents — passed as read-only display data
        // Each: { id, docType, originalName, storedPath, uploadedAt }
       // Uploaded documents — passed as read-only display data
        // Each: { id, docType, originalName, storedPath, uploadedAt }
        uploadedDocs: Array.isArray(data.documents) ? data.documents : [],

        // Unified comments history — all roles (requester, approver, fa_team, taxation)
        commentsHistory: Array.isArray(data.commentsHistory) ? data.commentsHistory : [],
      };

      setEditRequest({ id: data.id, requestNo: data.requestNo, initialData });
      setIsFormOpen(true);
    } catch (err) {
      showToast(
        err.response?.data?.message || `Failed to load: ${err.message}`,
        'err'
      );
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditRequest(null);
  };

  // ── Lookup maps (label → id) ──────────────────────────────
  // Fetched once on mount from GET /api/lookups/all.
  // Used by buildPayload to convert label strings → integer FK ids.
  const [lookups, setLookups] = useState({
    salesTypes: [], assetCategories: [], unitCategories: [],
    documentTypes: [], taxTypes: [], companyCodes: [],
  });

  useEffect(() => {
    // Fetch all lookups in parallel — one call for dropdowns, one for all company codes
    Promise.all([
      api.get('/api/lookups/all'),
      api.get('/api/lookups/company-codes'),  // all codes, not filtered by category
    ])
      .then(([allRes, codesRes]) => {
        setLookups({ ...allRes.data, companyCodes: codesRes.data });
      })
      .catch(err => console.warn('Failed to load lookups:', err.message));
  }, []);

  // Helper: find id by label in a lookup array
  // e.g. findId(lookups.salesTypes, 'Sale') → 1
  const findId = (arr = [], label) => {
    if (!label) return null;
    const match = arr.find(
      item => (item.label || item.code || '').trim() === String(label).trim()
    );
    return match?.id || null;
  };
  // ── Build API payload ─────────────────────────────────────
  // Converts label strings → integer FK ids + includes ALL form fields.
  // Previously consigner/consignee fields were missing — this caused
  // them to never reach the DB and never restore on View Details.
  const buildPayload = (formData) => ({
    // ── FK lookups (label → id) ───────────────────────────
    salesTypeId:     findId(lookups.salesTypes,      formData.salesType),
    assetCategoryId: findId(lookups.assetCategories, formData.assetCategory),
    companyCodeId: (() => {
      if (!formData.companyCode) return null;
      const allCodes = lookups.companyCodes || [];
      if (allCodes.length === 0) return null;
      const label = formData.companyCode.trim();
      const codeFromLabel = label.split(/\s+/)[0].trim();
      const match = allCodes.find(c => c.code.trim() === codeFromLabel);
      return match?.id || null;
    })(),
    // ── Also save as plain text — guaranteed to persist ───
    // FK id conversion can fail if lookup is empty or label format mismatches.
    // Plain text always saves correctly and is used for display.
    companyCodeLabel: formData.companyCode    || null,  // "5320  Axon"
    unitCategoryId:  findId(lookups.unitCategories, formData.categoryOfUnits),
    categoryOfUnits: formData.categoryOfUnits || null,  // "SEZ" or "NON-SEZ"
    documentTypeId:  findId(lookups.documentTypes,  formData.documentType),
    taxTypeId:       findId(lookups.taxTypes,        formData.taxType),

    // ── Asset detail text fields ──────────────────────────
    entityName:    formData.entityName    || null,
    assetLocation: formData.assetLocation || null,
    grossValue:    formData.grossValue    || null,
    wdv:           formData.wdv           || null,
    costCenter:    formData.costCenter    || null,
    salesValue:    formData.salesValue    || null,
    comments:      formData.comments      || null,

    // ── Consigner fields ──────────────────────────────────
    consignerName:     formData.consignerName     || null,
    consignerAddress:  formData.consignerAddress  || null,
    consignerPincode:  formData.consignerPincode  || null,
    consignerLocation: formData.consignerLocation || null,
    plantCode:         formData.plantCode         || null,
    consignerGstin:    formData.consignerGstin    || null,

    // ── Consignee fields ──────────────────────────────────
    consigneeName:             formData.consigneeName             || null,
    consigneeAddress:          formData.consigneeAddress          || null,
    consigneePincode:          formData.consigneePincode          || null,
    consigneeLocation:         formData.consigneeLocation         || null,
    consigneeGstin:            formData.consigneeGstin            || null,
    consigneeCategoryOfUnits:  formData.consigneeCategoryOfUnits  || null,
    consigneePlantCode:        formData.consigneePlantCode        || null,
    consigneeCostCentre:       formData.consigneeCostCentre       || null,

    // ── Ship To fields ────────────────────────────────────
    shipToName:    formData.shipToName    || null,
    shipToAddress: formData.shipToAddress || null,
    shipToGstin:   formData.shipToGstin   || null,
    type:          formData.type          || null,

    // ── Line items ────────────────────────────────────────
    lineItems: formData.lineItems || [],
  });

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

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

        {/* If form is open, show form full-width */}
        {isFormOpen ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <button style={S.clearBtn} onClick={handleFormCancel}>Back</button>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#0d1b3e' }}>
                {editRequest?.requestNo
                  ? `Edit Request — ${editRequest.requestNo}`
                  : 'New Asset Request'}
              </span>
            </div>
            <AssetForm
              onSubmit={handleFormSubmit}
              onSave={handleFormSave}
              onCancel={handleFormCancel}
              initialData={editRequest?.initialData || null}
              onDocDeleted={(docId) => {
                // Remove the deleted doc from initialData so it disappears from the UI
                // without needing a full re-fetch
                setEditRequest(prev => ({
                  ...prev,
                  initialData: {
                    ...prev.initialData,
                    uploadedDocs: (prev.initialData?.uploadedDocs || [])
                      .filter(d => d.id !== parseInt(docId)),
                  },
                }));
              }}
            />
          </>
        ) : (
          <>
            {/* Filter bar */}
            <div style={S.filterBar}>
              <span style={S.filterLabel}>Invoice From Date:</span>
              <input
                type="date"
                style={S.filterInput}
                value={filters.from}
                onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
              />
              <span style={S.filterLabel}>ToDate:</span>
              <input
                type="date"
                style={S.filterInput}
                value={filters.to}
                onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
              />
              <span style={S.filterLabel}>RequestNo:</span>
              <input
                type="text"
                style={{ ...S.filterInput, minWidth: 160 }}
                placeholder="e.g. ASSID000001"
                value={filters.requestNo}
                onChange={e => setFilters(f => ({ ...f, requestNo: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button style={S.searchBtn} onClick={handleSearch}>Search</button>
              <button style={S.clearBtn}  onClick={handleClearFilters}>Clear</button>
            </div>

            {/* Table card */}
            <div style={S.card}>

              {/* Card header: label + Create button */}
              <div style={S.cardHeader}>
                <div>
                  <div style={S.sectionLabel}>Requestor Details:</div>
                </div>
                <button
                  style={S.createAssetBtn}
                  onClick={() => { setEditRequest(null); setIsFormOpen(true); }}
                >
                  Create Asset Details
                </button>
              </div>

              {/* Table */}
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Request</th>
                    <th style={S.th}>Date</th>
                    <th style={S.th}>Entity Name</th>
                    <th style={S.th}>Business Area</th>
                    <th style={S.th}>Pending With</th>
                    <th style={S.th}>View Details</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} style={S.loadingRow}>Loading...</td>
                    </tr>
                  ) : requests.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={S.emptyRow}>
                        No requests found. Click <strong>Create Asset Details</strong> to begin.
                      </td>
                    </tr>
                  ) : (
                    requests.map(req => {
                      const statusLabel = req.status?.statusDescription || '—';
                      const canDelete   = statusLabel === 'Requestor Saved';
                      return (
                        <tr
                          key={req.id}
                          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}
                        >
                          {/* Request No — clickable */}
                          <td style={{ ...S.td, color: '#1a3a8f', fontWeight: 500, cursor: 'pointer' }}
                            onClick={() => handleEdit(req)}>
                            {req.requestNo}
                          </td>
                          {/* Date — show submittedAt if submitted, else createdAt */}
                          <td style={S.td}>
                            {new Date(req.submittedAt || req.createdAt)
                              .toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric'
                              })}
                          </td>
                          <td style={S.td}>{req.entityName || '—'}</td>
                          {/* Business Area = assetLocation field */}
                          <td style={S.td}>{req.assetLocation || '—'}</td>
                          <td style={S.td}>
                            <StatusBadge label={statusLabel} />
                          </td>
                          <td style={S.td}>
                            {/* Edit button — yellow pencil */}
                            <button
                              style={S.editBtn}
                              title="Edit request"
                              onClick={() => handleEdit(req)}
                            >
                              ✎
                            </button>
                            {/* Delete button — red, only for drafts */}
                            <button
                              style={{
                                ...S.deleteBtn,
                                opacity:       canDelete ? 1 : 0.35,
                                cursor:        canDelete ? 'pointer' : 'not-allowed',
                              }}
                              title={canDelete ? 'Delete request' : 'Cannot delete submitted request'}
                              onClick={() => canDelete && handleDelete(req)}
                            >
                              ⊘
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <div style={S.pagination}>
                  <PaginationBtn label="<<" pg={1}            currentPage={page} onPageChange={setPage} disabled={page === 1} />
                  <PaginationBtn label="<"  pg={page - 1}     currentPage={page} onPageChange={setPage} disabled={page === 1} />
                  {pageNumbers.map(n => (
                    <PaginationBtn key={n} label={n} pg={n}   currentPage={page} onPageChange={setPage} disabled={false} />
                  ))}
                  <PaginationBtn label=">"  pg={page + 1}     currentPage={page} onPageChange={setPage} disabled={page === totalPages} />
                  <PaginationBtn label=">>" pg={totalPages}   currentPage={page} onPageChange={setPage} disabled={page === totalPages} />
                </div>
              )}

            </div>
          </>
        )}

      </main>
    </div>
  );
}