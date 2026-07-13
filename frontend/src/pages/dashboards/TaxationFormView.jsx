import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const api = axios.create({ baseURL: '' });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// ─── STYLES ───────────────────────────────────────────────────
const S = {
  form: { background: '#fff', borderRadius: 10, border: '0.5px solid #dde2f0', padding: '28px 32px' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 28px', marginBottom: 20 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5a6480' },
  input: { padding: '9px 12px', fontSize: 14, border: '1px solid #d0d6e8', borderRadius: 6, outline: 'none', background: '#f5f6fa', color: '#555', width: '100%', boxSizing: 'border-box' },
  inputEditable: { padding: '9px 12px', fontSize: 14, border: '1px solid #d0d6e8', borderRadius: 6, outline: 'none', background: '#fff', color: '#0d1b3e', width: '100%', boxSizing: 'border-box' },
  sectionHeading: { fontSize: 13, fontWeight: 600, color: '#1a3a8f', borderBottom: '2px solid #e8ecf5', paddingBottom: 8, marginBottom: 20, marginTop: 8, letterSpacing: '0.02em' },
  btnRow: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 28, paddingTop: 20, borderTop: '1px solid #eef0f8', flexWrap: 'wrap' },
  tableWrapper: { overflowX: 'auto', marginBottom: 8, borderRadius: 8, border: '1px solid #dde2f0' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { background: '#1a3a8f', color: '#fff', fontWeight: 600, fontSize: 11, padding: '10px 8px', textAlign: 'left', whiteSpace: 'nowrap' },
  td: { padding: '6px 8px', borderBottom: '1px solid #eef0f8', verticalAlign: 'middle', fontSize: 12, color: '#2d3748' },
  tdCenter: { padding: '6px 8px', borderBottom: '1px solid #eef0f8', textAlign: 'center', color: '#555', fontSize: 12 },
  cellInput: { padding: '5px 7px', fontSize: 12, border: '1px solid #d0d6e8', borderRadius: 4, outline: 'none', background: '#fff', color: '#0d1b3e', width: '100%', boxSizing: 'border-box' },
  cellReadonly: { padding: '5px 7px', fontSize: 12, color: '#555', whiteSpace: 'nowrap' },
  totalsBox: { background: '#f5f7fc', border: '1px solid #dde2f0', borderRadius: 8, padding: '16px 20px', marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, marginBottom: 24, fontSize: 13 },
  totalsFinalRow: { display: 'flex', justifyContent: 'flex-end', gap: 24, borderTop: '2px solid #1a3a8f', paddingTop: 6, marginTop: 2 },
  totalsFinalLabel: { minWidth: 140, textAlign: 'right', color: '#1a3a8f', fontWeight: 700, fontSize: 14 },
  totalsFinalValue: { minWidth: 120, textAlign: 'right', color: '#1a3a8f', fontWeight: 700, fontSize: 14 },
  textarea: { padding: '9px 12px', fontSize: 14, border: '1px solid #d0d6e8', borderRadius: 6, outline: 'none', background: '#fff', color: '#0d1b3e', width: '100%', boxSizing: 'border-box', resize: 'vertical', minHeight: 90, fontFamily: 'inherit' },
  uploadGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 28px', marginTop: 4 },
  uploadSlot: { display: 'flex', flexDirection: 'column', gap: 6 },
  uploadLabel: { fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5a6480' },
  uploadBox: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: '1.5px solid #c2cbe0', borderRadius: 6, background: '#f0f4ff', fontSize: 13, color: '#666', justifyContent: 'space-between' },
  uploadFileName: { fontSize: 12, color: '#1a3a8f', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 },
  banner: { borderRadius: 6, padding: '9px 13px', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 },
  smallBtn: { padding: '8px 16px', background: '#1a3a8f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  delBtn: { padding: '5px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 5, fontSize: 12, cursor: 'pointer' },
};



// ─── Read-only field ──────────────────────────────────────────
function ReadField({ label, value }) {
  return (
    <div style={S.field}>
      <label style={S.label}>{label}</label>
      <div style={S.input}>{value || '—'}</div>
    </div>
  );
}

// ─── Document card (list item with View button) ───────────────
// Hoisted to module scope — never define sub-components inside a
// parent's render (React remount rule).
function DocCard({ doc }) {
  return (
    <div style={S.uploadSlot}>
      <span style={S.uploadLabel}>{doc.docType}</span>
      <div style={S.uploadBox}>
        <span style={{ ...S.uploadFileName, flex: 1 }}>{doc.originalName}</span>
        <button type="button"
          style={{ fontSize: 11, color: '#1a3a8f', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', flexShrink: 0 }}
          onClick={async () => {
            try {
              const token = localStorage.getItem('token');
              const res   = await fetch(`/api/assets/documents/${doc.id}/view`, { headers: { Authorization: `Bearer ${token}` } });
              if (!res.ok) throw new Error('Failed to load file');
              const blob  = await res.blob();
              const url   = URL.createObjectURL(blob);
              window.open(url, '_blank');
              setTimeout(() => URL.revokeObjectURL(url), 30000);
            } catch (err) { alert('Could not open file: ' + err.message); }
          }}>
          View
        </button>
      </div>
    </div>
  );
}

// ─── Comments history (unified, shared shape) ─────────────────
function CommentsHistory({ history }) {
  if (!history || history.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#8a94a8', fontSize: 13 }}>No comments yet.</div>;
  }
  const ROLE_LABELS = { requester: 'Requestor', approver: 'Approver', fa_team: 'FA Team', taxation: 'Taxation' };
  return (
    <div style={{ maxHeight: 260, overflowY: 'auto' }}>
      {history.map((c, i) => (
        <div key={i} style={{ padding: '14px 16px', borderBottom: i < history.length - 1 ? '1px solid #eef0f8' : 'none', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a3a8f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {c.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0d1b3e' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#8a94a8' }}>{ROLE_LABELS[c.role] || c.role}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#8a94a8', textAlign: 'right' }}>
              {new Date(c.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#2d3748', lineHeight: 1.6, paddingLeft: 36, whiteSpace: 'pre-wrap' }}>{c.comment}</div>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function TaxationFormView() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [request,        setRequest]        = useState(null);
  const [commentsHistory, setCommentsHistory] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');

  // Editable taxation state
  const [taxInvoiceNo,   setTaxInvoiceNo]   = useState('');
  const [taxInvoiceDate, setTaxInvoiceDate] = useState('');
  const [items,          setItems]          = useState([]);   // line items with GST fields
  const [gstRows,        setGstRows]        = useState([]);   // GST breakdown rows
  const [comment,        setComment]        = useState('');
  const [gstMode, setGstMode] = useState(''); // 'IGST' or 'CGST/SGST'
  const [taxTypeId, setTaxTypeId] = useState('');
  const [taxTypes,  setTaxTypes]  = useState([]);   // options from backend

  const [taxDoc,     setTaxDoc]     = useState(null);
  const [uploading,  setUploading]  = useState(false);
  const [uploadMsg,  setUploadMsg]  = useState('');
  const [busy,       setBusy]       = useState(false);
  const [msg,        setMsg]        = useState({ text: '', type: '' });

  // ── Fetch request ───────────────────────────────────────────
  useEffect(() => {
    api.get(`/api/taxation/${id}`)
      .then(res => {
        const r = res.data.request;
        setRequest(r);
        setCommentsHistory(res.data.commentsHistory || []);
        setTaxInvoiceNo(r.taxInvoiceNo || '');
        setTaxInvoiceDate(r.taxInvoiceDate ? r.taxInvoiceDate.slice(0, 10) : '');
        setTaxTypeId(r.taxTypeId ?? r.taxType?.id ?? '');
        setTaxTypes(res.data.taxTypes || []);
        // Seed line items with existing GST fields (or blank)
        setItems((r.items || []).map(it => ({
          id:           it.id,
          description:  it.description,
          uqcCode:      it.uqcCode,
          quantity:     Number(it.quantity) || 0,
          rate:         Number(it.rate) || 0,
          hsnCode:      it.hsnCode,
          gstRate:      it.gstRate != null ? Number(it.gstRate) : '',
          itemRate:     it.itemRate     != null ? Number(it.itemRate) : null,
          taxableValue: it.taxableValue != null ? Number(it.taxableValue) : null,
          gstAmount:    it.gstAmount    != null ? Number(it.gstAmount) : null,
          totalAmount:  it.totalAmount  != null ? Number(it.totalAmount) : null,
        })));
       const loadedRows = (r.gstRows || []).map(g => ({
          gstType: g.gstType,
          gstRate: Number(g.gstRate),
          amount:  Number(g.amount),
        }));
        setGstRows(loadedRows);
        // Detect saved mode from existing rows
        if (loadedRows.some(row => row.gstType === 'IGST')) setGstMode('IGST');
        else if (loadedRows.some(row => row.gstType === 'CGST' || row.gstType === 'SGST')) setGstMode('CGST/SGST');
      })
      .catch(() => setError('Failed to load request.'))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Recalculate a line item when GST rate changes ───────────
  // amount = qty * rate (GST-inclusive total)
  // itemRate     = rate / (1 + g/100)
  // taxableValue = amount / (1 + g/100)
  // gstAmount    = amount - taxableValue
  // totalAmount  = amount
  const handleGstRateChange = (itemId, value) => {
    setItems(prev => prev.map(it => {
      if (it.id !== itemId) return it;
      const g      = parseFloat(value);
      const amount = (it.quantity || 0) * (it.rate || 0);
      if (isNaN(g) || g < 0) {
        return { ...it, gstRate: value, itemRate: null, taxableValue: null, gstAmount: null, totalAmount: null };
      }
      const divisor      = 1 + g / 100;
      const itemRate     = it.rate / divisor;
      const taxableValue = amount / divisor;
      const gstAmount    = amount - taxableValue;
      return {
        ...it,
        gstRate:      value,
        itemRate:     itemRate,
        taxableValue: taxableValue,
        gstAmount:    gstAmount,
        totalAmount:  amount,
      };
    }));
  };

  // ── GST breakdown row handlers ──────────────────────────────
// ── Auto-generate GST breakdown rows from line items ────────
  // Groups line items by their distinct GST rate, sums gstAmount per rate.
  // IGST     → one row per rate
  // CGST/SGST → two rows per rate (rate & amount each halved)
  const generateGstRows = (mode) => {
    setGstMode(mode);
    if (!mode) { setGstRows([]); return; }

    // Group gstAmount by gstRate across line items
    const byRate = {};
    items.forEach(it => {
      const rate = parseFloat(it.gstRate);
      const amt  = parseFloat(it.gstAmount);
      if (isNaN(rate) || isNaN(amt)) return;
      if (!byRate[rate]) byRate[rate] = 0;
      byRate[rate] += amt;
    });

    const distinctRates = Object.keys(byRate)
      .map(Number)
      .sort((a, b) => a - b);

    const rows = [];
    distinctRates.forEach(rate => {
      const amount = byRate[rate];
      if (mode === 'IGST') {
        rows.push({ gstType: 'IGST', gstRate: rate, amount });
      } else {
        rows.push({ gstType: 'CGST', gstRate: rate / 2, amount: amount / 2 });
        rows.push({ gstType: 'SGST', gstRate: rate / 2, amount: amount / 2 });
      }
    });

    setGstRows(rows);
  };

  // ── Derived totals ──────────────────────────────────────────
  const itemTotals = useMemo(() => {
    let amount = 0, taxable = 0, gst = 0;
    items.forEach(it => {
      const amt = (it.quantity || 0) * (it.rate || 0);
      amount  += amt;
      taxable += it.taxableValue || 0;
      gst     += it.gstAmount || 0;
    });
    return { amount, taxable, gst };
  }, [items]);

  const gstTotal = useMemo(
    () => gstRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0),
    [gstRows]
  );

  if (loading) return <p style={{ padding: 32, fontSize: 13, color: '#5a6480' }}>Loading...</p>;
  if (error)   return <p style={{ padding: 32, fontSize: 13, color: '#c0392b' }}>{error}</p>;
  if (!request) return null;
  // ── Build payload shared by save + validate ─────────────────
  const buildPayload = () => ({
    taxInvoiceNo,
    taxInvoiceDate: taxInvoiceDate || null,
    taxTypeId: taxTypeId === '' ? null : parseInt(taxTypeId, 10),
    items: items.map(it => ({
      id:           it.id,
      gstRate:      it.gstRate === '' ? null : parseFloat(it.gstRate),
      itemRate:     it.itemRate,
      taxableValue: it.taxableValue,
      gstAmount:    it.gstAmount,
      totalAmount:  it.totalAmount,
    })),
    gstRows: gstRows
      .filter(g => g.gstType && g.gstRate !== '' && g.amount !== '')
      .map(g => ({
        gstType: g.gstType,
        gstRate: parseFloat(g.gstRate),
        amount:  parseFloat(g.amount),
      })),
    comment: comment.trim() || null,
  });

  const showMsg = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  // ── Save draft ──────────────────────────────────────────────
  const handleSave = async () => {
    setBusy(true);
    try {
      await api.post(`/api/taxation/${id}/save`, buildPayload());
      showMsg('Draft saved successfully.', 'ok');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Save failed.', 'err');
    } finally {
      setBusy(false);
    }
  };

  // ── Validate ────────────────────────────────────────────────
  const handleValidate = async () => {
    setBusy(true);
    try {
      const res = await api.post(`/api/taxation/${id}/validate`, buildPayload());
      showMsg(res.data.message || 'Validated.', 'ok');
      // Refresh to reflect validated status
      const refreshed = await api.get(`/api/taxation/${id}`);
      setRequest(refreshed.data.request);
      setCommentsHistory(refreshed.data.commentsHistory || []);
    } catch (err) {
      const errs = err.response?.data?.errors;
      showMsg(errs ? errs.join(', ') : (err.response?.data?.message || 'Validation failed.'), 'err');
    } finally {
      setBusy(false);
    }
  };

  // ── Refer back / Close ──────────────────────────────────────
  const handleAction = async (action) => {
    if (!comment.trim()) {
      showMsg('Comments are required before this action.', 'err');
      return;
    }
    setBusy(true);
    try {
      await api.post(`/api/taxation/${id}/action`, { action, comment });
      navigate('/dashboard/taxation');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Action failed.', 'err');
    } finally {
      setBusy(false);
    }
  };

  // ── Upload taxation document ────────────────────────────────
  const handleUploadTaxDoc = async () => {
    if (!taxDoc) return;
    setUploading(true);
    setUploadMsg('');
    try {
      const formData = new FormData();
      formData.append('taxation_document', taxDoc);
      await api.post(`/api/taxation/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadMsg('Document uploaded successfully.');
      setTaxDoc(null);
      const refreshed = await api.get(`/api/taxation/${id}`);
      setRequest(refreshed.data.request);
    } catch (err) {
      setUploadMsg(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const r = request;
  const isValidated = !!r.isValidated;
  const isClosed    = r.status?.status_name === 'Taxation Approved';

  // Look up the label of the currently selected tax type so the GST
  // sections react immediately when the dropdown changes.
  const selectedTaxType = taxTypes.find(t => String(t.id) === String(taxTypeId));
  const isWithoutTax = /without\s*tax/i.test(selectedTaxType?.label ?? r.taxType?.label ?? '');

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f8', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Navbar */}
      <nav style={{ height: 52, background: 'linear-gradient(90deg,#1a3a8f,#1e4fc2)', display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 17 }}>HCLTech</span>
          <span style={{ color: 'rgba(255,255,255,0.35)' }}>|</span>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>Taxation Review — {r.requestNo}</span>
        </div>
        <button onClick={() => navigate('/dashboard/taxation')}
          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.35)', color: 'rgba(255,255,255,0.85)', fontSize: 11, padding: '4px 10px', borderRadius: 5, cursor: 'pointer' }}>
          ← Back to Dashboard
        </button>
      </nav>

      <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={S.form}>

          {/* Status banner — closed / validated / in progress */}
          <div style={{ ...S.banner, ...(isClosed
            ? { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }
            : isValidated
            ? { background: '#eef2ff', border: '1px solid #c7d2fe', color: '#4338ca' }
            : { background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1' }) }}>
            <span>{isClosed ? '✓' : isValidated ? '✓' : 'ℹ'}</span>
            <span>{isClosed
              ? 'This request has been closed and approved. It is now read-only.'
              : isValidated
              ? 'This request has been validated. You may now Close it to approve.'
              : 'Fill tax invoice details and GST, then Validate before closing.'}</span>
          </div>

          {/* ── Request Info ─────────────────────────────── */}
          <div style={S.sectionHeading}>Request Information</div>
          <div style={S.row}>
            <ReadField label="Request No"   value={r.requestNo} />
            <ReadField label="Requestor"    value={r.requester?.name} />
            <ReadField label="Employee ID"  value={r.requester?.employee_id} />
            <ReadField label="Submitted At" value={r.submittedAt ? new Date(r.submittedAt).toLocaleString('en-IN') : null} />
            <ReadField label="Status"       value={r.status?.status_name} />
          </div>

          {/* ── Asset Details ────────────────────────────── */}
          <div style={S.sectionHeading}>Asset Details</div>
          <div style={S.row}>
            <ReadField label="Sales Type"        value={r.salesType?.label} />
            <ReadField label="Company Code"      value={r.companyCodeLabel} />
          </div>
          <div style={S.row}>
            <ReadField label="Asset Category"    value={r.assetCategory?.label} />
            <ReadField label="Category of Units" value={r.categoryOfUnits || r.unitCategory?.label} />
          </div>
          <div style={S.row}>
            <ReadField label="Entity Name"    value={r.entityName} />
            <ReadField label="Asset Location" value={r.assetLocation} />
          </div>
          <div style={S.row}>
            <ReadField label="Gross Value (Rs)" value={r.grossValue} />
            <ReadField label="WDV (Rs)"         value={r.wdv} />
          </div>
          <div style={S.row}>
            <ReadField label="Cost Center"      value={r.costCenter} />
            <ReadField label="Sales Value (Rs)" value={r.salesValue} />
          </div>

          {/* ── Consigner Details ────────────────────────── */}
          <div style={S.sectionHeading}>Consigner Details</div>
          <div style={S.row}>
            <ReadField label="Consigner Name"    value={r.consignerName} />
            <ReadField label="Consigner Address" value={r.consignerAddress} />
          </div>
          <div style={S.row}>
            <ReadField label="Consigner Pincode" value={r.consignerPincode} />
            <ReadField label="Location"          value={r.consignerLocation} />
          </div>
          <div style={S.row}>
            <ReadField label="Plant Code"      value={r.plantCode} />
            <ReadField label="Consigner GSTIN" value={r.consignerGstin} />
          </div>

          {/* ── Consignee Details ────────────────────────── */}
          <div style={{ ...S.sectionHeading, marginTop: 28 }}>Consignee Details</div>
          <div style={S.row}>
            <ReadField label="Consignee Name"    value={r.consigneeName} />
            <ReadField label="Consignee Address" value={r.consigneeAddress} />
          </div>
          <div style={S.row}>
            <ReadField label="Consignee Pincode" value={r.consigneePincode} />
            <ReadField label="Location"          value={r.consigneeLocation} />
          </div>
          <div style={S.row}>
            <ReadField label="Consignee GSTIN"   value={r.consigneeGstin} />
            <ReadField label="Category of Units" value={r.consigneeCategoryOfUnits} />
          </div>
          <div style={S.row}>
            <ReadField label="Ship To Name"    value={r.shipToName} />
            <ReadField label="Ship To Address" value={r.shipToAddress} />
          </div>
          <div style={S.row}>
            <ReadField label="Ship To GSTIN" value={r.shipToGstin} />
            <ReadField label="Type"          value={r.type} />
          </div>
          <div style={S.row}>
            <ReadField label="Document Type" value={r.documentType?.label} />
            <div style={S.field}>
              <label style={S.label}>Tax Type</label>
              <select style={S.inputEditable} value={taxTypeId} disabled={isClosed}
                onChange={e => setTaxTypeId(e.target.value)}>
                <option value="">Select tax type</option>
                {taxTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={S.row}>
            <ReadField label="Consignee Plant Code" value={r.consigneePlantCode} />
            <ReadField label="Cost Centre"          value={r.consigneeCostCentre} />
          </div>

          {/* ── Tax Invoice Details (editable) ───────────── */}
          <div style={{ ...S.sectionHeading, marginTop: 28 }}>Tax Invoice Details</div>
          <div style={S.row}>
            <div style={S.field}>
              <label style={S.label}>Tax Invoice No <span style={{ color: '#c0392b' }}>*</span></label>
              <input style={S.inputEditable} value={taxInvoiceNo} readOnly={isClosed}
                onChange={e => setTaxInvoiceNo(e.target.value)}
                placeholder="Enter tax invoice number" />
            </div>
            <div style={S.field}>
              <label style={S.label}>Tax Invoice Date <span style={{ color: '#c0392b' }}>*</span></label>
              <input type="date" style={S.inputEditable} value={taxInvoiceDate} readOnly={isClosed}
                onChange={e => setTaxInvoiceDate(e.target.value)} />
            </div>
          </div>

          {/* ── Line Items with GST (editable GST Rate) ──── */}
          <div style={{ ...S.sectionHeading, marginTop: 28 }}>Line Items</div>
          <div style={S.tableWrapper}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>S.No</th>
                  <th style={S.th}>Description</th>
                  <th style={S.th}>UQC</th>
                  <th style={S.th}>Quantity</th>
                  <th style={S.th}>Rate (Rs)</th>
                  <th style={S.th}>Amount (Rs)</th>
                 <th style={S.th}>HSN Code</th>
                  {!isWithoutTax && <>
                    <th style={S.th}>GST Rate</th>
                    <th style={S.th}>Item Rate</th>
                    <th style={S.th}>Taxable Value</th>
                    <th style={S.th}>GST Amount</th>
                    <th style={S.th}>Total Amount</th>
                  </>}
                </tr>

              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={12} style={{ ...S.td, textAlign: 'center', color: '#aaa', padding: '20px 0' }}>No line items.</td></tr>
                ) : items.map((it, idx) => {
                  const amount = (it.quantity || 0) * (it.rate || 0);
                  const fmt = (n) => n != null ? Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
                  return (
                    <tr key={it.id}>
                      <td style={S.tdCenter}>{idx + 1}</td>
                      <td style={S.td}>{it.description || '—'}</td>
                      <td style={S.td}>{it.uqcCode || '—'}</td>
                      <td style={S.td}>{it.quantity}</td>
                      <td style={S.td}>{fmt(it.rate)}</td>
                      <td style={S.td}>{fmt(amount)}</td>
                     <td style={S.td}>{it.hsnCode || '—'}</td>
                      {!isWithoutTax && <>
                        <td style={{ ...S.td, width: 80 }}>
                          <input style={S.cellInput} type="number" min="0" step="0.01"
                            value={it.gstRate} readOnly={isClosed}
                            onChange={e => handleGstRateChange(it.id, e.target.value)}
                            placeholder="%" />
                        </td>
                        <td style={S.cellReadonly}>{fmt(it.itemRate)}</td>
                        <td style={S.cellReadonly}>{fmt(it.taxableValue)}</td>
                        <td style={S.cellReadonly}>{fmt(it.gstAmount)}</td>
                        <td style={S.cellReadonly}>{fmt(it.totalAmount)}</td>
                      </>}
                    </tr>
                  );
                })}
              </tbody>
              {items.length > 0 && (
                <tfoot>
                 <tr style={{ background: '#f5f7fc', fontWeight: 700 }}>
                    <td style={S.td} colSpan={5}>Totals</td>
                    <td style={S.td}>{itemTotals.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    {!isWithoutTax && <>
                      <td style={S.td} colSpan={3}></td>
                      <td style={S.td}>{itemTotals.taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td style={S.td}>{itemTotals.gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td style={S.td}>{itemTotals.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </>}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          {!isWithoutTax && (
            <>
              {/* ── GST Type Breakdown (auto-generated) ──────── */}
              <div style={{ ...S.sectionHeading, marginTop: 28 }}>GST Breakdown</div>

              <div style={{ marginBottom: 12, maxWidth: 320 }}>
                <label style={{ ...S.label, marginBottom: 6, display: 'block' }}>GST Type</label>
                <select style={S.inputEditable} value={gstMode} disabled={isClosed}
                  onChange={e => generateGstRows(e.target.value)}>
                  <option value="">Select GST Type</option>
                  <option value="IGST">IGST</option>
                  <option value="CGST/SGST">CGST / SGST</option>
                </select>
              </div>

              <div style={S.tableWrapper}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>GST Type</th>
                      <th style={S.th}>GST Rate</th>
                      <th style={S.th}>Amount (Rs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gstRows.length === 0 ? (
                      <tr><td colSpan={3} style={{ ...S.td, textAlign: 'center', color: '#aaa', padding: '16px 0' }}>
                        Select a GST type above to auto-generate the breakdown.
                      </td></tr>
                    ) : gstRows.map((row, idx) => (
                      <tr key={idx}>
                        <td style={S.td}>{row.gstType}</td>
                        <td style={S.td}>{Number(row.gstRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td style={S.td}>₹ {Number(row.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={S.totalsBox}>
                <div style={S.totalsFinalRow}>
                  <span style={S.totalsFinalLabel}>GST Total</span>
                  <span style={S.totalsFinalValue}>₹ {gstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </>
          )}



          {/* ── Documents (split by uploader role) ───────── */}
          {(() => {
            const allDocs       = request.documents || [];
            const requestorDocs = allDocs.filter(d => (d.uploadedByRole || 'requestor') === 'requestor');
            const taxationDocs  = allDocs.filter(d => d.uploadedByRole === 'taxation');
            const faDocs        = allDocs.filter(d => d.uploadedByRole === 'fa');

            return (
              <>
                <div style={{ ...S.sectionHeading, marginTop: 28 }}>Requestor Documents</div>
                <div style={S.uploadGrid}>
                  {requestorDocs.length === 0
                    ? <div style={{ color: '#8a94a8', fontSize: 13 }}>No documents uploaded by requestor.</div>
                    : requestorDocs.map(doc => <DocCard key={doc.id} doc={doc} />)}
                </div>

                {faDocs.length > 0 && (
                  <>
                    <div style={{ ...S.sectionHeading, marginTop: 28 }}>FA Team Documents</div>
                    <div style={S.uploadGrid}>
                      {faDocs.map(doc => <DocCard key={doc.id} doc={doc} />)}
                    </div>
                  </>
                )}

                {/* ── Taxation Documents — single section: list + upload ── */}
                <div style={{ ...S.sectionHeading, marginTop: 28 }}>Taxation Documents</div>
                <div style={S.uploadGrid}>
                  {taxationDocs.length === 0
                    ? <div style={{ color: '#8a94a8', fontSize: 13 }}>No taxation documents uploaded yet.</div>
                    : taxationDocs.map(doc => <DocCard key={doc.id} doc={doc} />)}
                </div>

                {!isClosed && (
                  <div style={{ ...S.uploadSlot, marginTop: 14 }}>
                    <span style={S.uploadLabel}>Upload Taxation Document</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <label style={{ ...S.uploadBox, cursor: 'pointer', flex: 1, background: '#f8f9fd', border: '1.5px dashed #c2cbe0' }}>
                        <span style={{ color: taxDoc ? '#1a3a8f' : '#8a94a8', fontSize: 13 }}>
                          {taxDoc ? taxDoc.name : 'Click to select document'}
                        </span>
                        <input type="file" style={{ display: 'none' }}
                          onChange={e => { const f = e.target.files[0]; if (f) setTaxDoc(f); e.target.value = ''; }} />
                      </label>
                      {taxDoc && (
                        <button onClick={handleUploadTaxDoc} disabled={uploading} style={S.smallBtn}>
                          {uploading ? 'Uploading...' : 'Upload'}
                        </button>
                      )}
                    </div>
                    {uploadMsg && (
                      <span style={{ fontSize: 12, color: uploadMsg.includes('success') ? '#15803d' : '#c0392b', marginTop: 4 }}>{uploadMsg}</span>
                    )}
                  </div>
                )}
              </>
            );
          })()}

          {/* ── Comments (history + new comment) ─────────── */}
          <div style={{ ...S.sectionHeading, marginTop: 28 }}>Comments</div>
          <div style={{ border: '1px solid #dde2f0', borderRadius: 8, marginBottom: 20, overflow: 'hidden' }}>
            {commentsHistory.length > 0 && (
              <div style={{ borderBottom: '2px solid #e8ecf5' }}>
                <CommentsHistory history={commentsHistory} />
              </div>
            )}
            {!isClosed && (
              <div style={{ padding: '16px' }}>
                <label style={{ ...S.label, marginBottom: 8, display: 'block' }}>
                  Comments <span style={{ color: '#c0392b', marginLeft: 3 }}>*</span>
                </label>
                <textarea rows={4} value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Enter your comments..."
                  style={S.textarea}
                  onFocus={e => e.target.style.borderColor = '#1e3fa0'}
                  onBlur={e => e.target.style.borderColor = '#d0d6e8'} />
              </div>
            )}
          </div>

          {/* ── Message banner ───────────────────────────── */}
          {msg.text && (
            <div style={{ ...S.banner, ...(msg.type === 'err'
              ? { background: '#fdf0ee', border: '1px solid #f5c6c2', color: '#c0392b' }
              : { background: '#edfaf3', border: '1px solid #b7e8cf', color: '#1a7a4a' }) }}>
              {msg.text}
            </div>
          )}

          {/* ── Action Buttons ───────────────────────────── */}
          <div style={S.btnRow}>
            <button onClick={() => navigate('/dashboard/taxation')} disabled={busy}
              style={{ padding: '10px 20px', fontSize: 13, border: '1px solid #d0d6e8', borderRadius: 7, background: '#fff', color: '#555', cursor: 'pointer' }}>
              Back
            </button>
            {!isClosed && <>
              <button onClick={handleSave} disabled={busy}
                style={{ padding: '10px 24px', fontSize: 13, fontWeight: 600, border: '1px solid #1a3a8f', borderRadius: 7, background: '#fff', color: '#1a3a8f', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1 }}>
                Save Draft
              </button>
              <button onClick={() => handleAction('referback')} disabled={busy}
                style={{ padding: '10px 24px', fontSize: 13, fontWeight: 600, border: 'none', borderRadius: 7, background: '#b45309', color: '#fff', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1 }}>
                Refer Back
              </button>
              <button onClick={handleValidate} disabled={busy}
                style={{ padding: '10px 24px', fontSize: 13, fontWeight: 600, border: 'none', borderRadius: 7, background: '#1a3a8f', color: '#fff', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1 }}>
                Validate
              </button>
              <button onClick={() => handleAction('close')} disabled={busy || !isValidated}
                title={isValidated ? 'Close and approve' : 'Validate first before closing'}
                style={{ padding: '10px 24px', fontSize: 13, fontWeight: 600, border: 'none', borderRadius: 7, background: isValidated ? 'linear-gradient(90deg,#16a34a,#15803d)' : '#9ca3af', color: '#fff', cursor: (busy || !isValidated) ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1 }}>
                Close
              </button>
            </>}
          </div>

        </div>
      </div>
    </div>
  );
}