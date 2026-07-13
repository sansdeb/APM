/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
// src/components/AssetForm.jsx
// Changes from previous version:
//   + initialData prop — pre-populates form when viewing a saved/submitted request
//   + salesTypeId, assetCategoryId etc stored alongside label strings
//     so the API payload has the integer IDs it needs

import { useState, useMemo } from 'react';

const SALES_TYPE_OPTIONS = ['Sale', 'Scrap', 'Transfer'];
const CATEGORY_OF_UNITS_OPTIONS = ['SEZ', 'NON-SEZ'];
const ASSET_CATEGORY_OPTIONS = ['GEO Assets', 'HCL Technologies Ltd India Assets', 'Infra/BPO India Assets', 'New Vista'];

const COMPANY_CODE_BY_CATEGORY = {
  'GEO Assets': [
    '5320  Axon',
    '5340  Bywater Ltd',
    '5360  HCL Technologies UK Ltd',
    '5380  HCL Technologies America Inc',
    '5400  HCL Technologies Singapore Pte Ltd',
    '5420  HCL Technologies Germany GmbH',
    '5440  HCL Australia Services Pty Ltd',
    '5460  HCL Canada Inc',
  ],
  'HCL Technologies Ltd India Assets': [
    '1000   HCL Technologies Ltd',
    '1010   HCL Comnet Ltd',
    '1020   HCL Learning Ltd',
  ],
  'Infra/BPO India Assets': [
    '2000   HCL BPO Services Ltd',
    '2010   HCL Infrastructure Services Division',
    '2020   HCL Contact Centre Operations',
  ],
  'New Vista': [
    '5320   Axon',
    '5400   HCL Technologies Singapore Pte Ltd',
    '5500   Direct2Solutions Ltd',
    '5600   Urban Fulfilment Services',
  ],
};

const TYPE_OPTIONS          = ['Scrap sale of Old Items', 'E-waste sale of Old Items', 'Assets transfer'];
const DOCUMENT_TYPE_OPTIONS = ['CR', 'INV'];
const TAX_TYPE_OPTIONS      = ['With Tax', 'Without Tax'];
const UQC_OPTIONS           = ['NOS', 'KGS', 'MTR', 'LTR', 'SQM', 'CBM', 'TON', 'PAC', 'SET', 'OTH'];
const GST_RATE              = 0.18;

const REQUIRED_FIELDS = [
  'entityName', 'assetLocation', 'grossValue', 'wdv', 'costCenter', 'salesValue',
  'consignerAddress', 'consignerPincode', 'consignerLocation', 'plantCode', 'consignerGstin',
  'consigneeName', 'consigneeAddress', 'consigneePincode', 'consigneeLocation',
  'consigneeGstin', 'consigneePlantCode', 'taxType'
];

// ─── STYLES ───────────────────────────────────────────────────
// (unchanged from your version)
const S = {
  form: { background: '#fff', borderRadius: 10, border: '0.5px solid #dde2f0', padding: '28px 32px' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 28px', marginBottom: 20 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5a6480' },
  req: { color: '#c0392b', marginLeft: 3 },
  input: { padding: '9px 12px', fontSize: 14, border: '1px solid #d0d6e8', borderRadius: 6, outline: 'none', background: '#fff', color: '#0d1b3e', transition: 'border-color 0.15s', width: '100%', boxSizing: 'border-box' },
  inputDisabled: { background: '#f5f6fa', color: '#aaa', cursor: 'not-allowed' },
  sectionHeading: { fontSize: 13, fontWeight: 600, color: '#1a3a8f', borderBottom: '2px solid #e8ecf5', paddingBottom: 8, marginBottom: 20, marginTop: 8, letterSpacing: '0.02em' },
  btnRow: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 28, paddingTop: 20, borderTop: '1px solid #eef0f8' },
  cancelBtn: { padding: '10px 20px', fontSize: 13, border: '1px solid #d0d6e8', borderRadius: 7, background: '#fff', color: '#555', cursor: 'pointer' },
  saveBtn: { padding: '10px 20px', fontSize: 13, fontWeight: 500, border: '1px solid #1a3a8f', borderRadius: 7, background: '#fff', color: '#1a3a8f', cursor: 'pointer' },
  submitBtn: { padding: '10px 24px', fontSize: 13, fontWeight: 600, border: 'none', borderRadius: 7, background: 'linear-gradient(90deg, #1a3a8f, #1e4fc2)', color: '#fff', cursor: 'pointer', transition: 'opacity 0.15s' },
  submitBtnDisabled: { opacity: 0.4, cursor: 'not-allowed' },
  validationMsg: { background: '#fdf0ee', border: '1px solid #f5c6c2', color: '#c0392b', borderRadius: 6, padding: '9px 13px', fontSize: 13, marginBottom: 20 },
  tableWrapper: { overflowX: 'auto', marginBottom: 8, borderRadius: 8, border: '1px solid #dde2f0' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { background: '#f0f3fb', color: '#1a3a8f', fontWeight: 700, fontSize: 11, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #dde2f0', whiteSpace: 'nowrap' },
  td: { padding: '7px 8px', borderBottom: '1px solid #eef0f8', verticalAlign: 'middle' },
  tdCenter: { padding: '7px 8px', borderBottom: '1px solid #eef0f8', verticalAlign: 'middle', textAlign: 'center', color: '#555', fontSize: 12 },
  tableInput: { padding: '6px 9px', fontSize: 13, border: '1px solid #d0d6e8', borderRadius: 5, outline: 'none', background: '#fff', color: '#0d1b3e', width: '100%', boxSizing: 'border-box' },
  amountCell: { padding: '7px 12px', borderBottom: '1px solid #eef0f8', verticalAlign: 'middle', color: '#0d1b3e', fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap' },
  addItemBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#fff', border: '1px solid #1a3a8f', color: '#1a3a8f', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: 10 },
  deleteBtn: { padding: '4px 10px', fontSize: 12, border: '1px solid #f5c6c2', borderRadius: 5, background: '#fdf0ee', color: '#c0392b', cursor: 'pointer' },
  totalsBox: { background: '#f5f7fc', border: '1px solid #dde2f0', borderRadius: 8, padding: '16px 20px', marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, marginBottom: 24, fontSize: 13 },
  totalsRow: { display: 'flex', justifyContent: 'flex-end', gap: 24, color: '#444' },
  totalsLabel: { minWidth: 140, textAlign: 'right', color: '#5a6480', fontWeight: 500 },
  totalsValue: { minWidth: 100, textAlign: 'right', color: '#0d1b3e', fontWeight: 600 },
  totalsFinalRow: { display: 'flex', justifyContent: 'flex-end', gap: 24, borderTop: '2px solid #1a3a8f', paddingTop: 6, marginTop: 2 },
  totalsFinalLabel: { minWidth: 140, textAlign: 'right', color: '#1a3a8f', fontWeight: 700, fontSize: 14 },
  totalsFinalValue: { minWidth: 100, textAlign: 'right', color: '#1a3a8f', fontWeight: 700, fontSize: 14 },
  textarea: { padding: '9px 12px', fontSize: 14, border: '1px solid #d0d6e8', borderRadius: 6, outline: 'none', background: '#fff', color: '#0d1b3e', width: '100%', boxSizing: 'border-box', resize: 'vertical', minHeight: 90, fontFamily: 'inherit' },
  charCount: { fontSize: 11, color: '#888', textAlign: 'right', marginTop: 3 },
  charCountError: { fontSize: 11, color: '#c0392b', textAlign: 'right', marginTop: 3 },
  uploadGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 28px', marginTop: 4 },
  uploadSlot: { display: 'flex', flexDirection: 'column', gap: 6 },
  uploadLabel: { fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5a6480' },
  uploadBox: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: '1.5px dashed #c2cbe0', borderRadius: 6, background: '#f8f9fd', cursor: 'pointer', fontSize: 13, color: '#666', transition: 'border-color 0.15s' },
  uploadFileName: { fontSize: 12, color: '#1a3a8f', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 },

  // Read-only mode banner — shown when viewing a submitted request
  readOnlyBanner: { background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1', borderRadius: 6, padding: '9px 13px', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 },
};

// ─── SUB-COMPONENTS (outside AssetForm — stable references) ──
function TextInput({ name, value, onChange, onFocus, onBlur, placeholder, type = 'text', readOnly }) {
  return (
    <input
      style={{ ...S.input, ...(readOnly ? { background: '#f5f6fa', color: '#555' } : {}) }}
      name={name}
      type={type}
      placeholder={placeholder}
      value={value ?? ''}
      onChange={readOnly ? undefined : onChange}
      onFocus={readOnly ? undefined : onFocus}
      onBlur={readOnly ? undefined : onBlur}
      readOnly={readOnly}
    />
  );
}

function FormSelect({ name, value, onChange, onFocus, onBlur, options, placeholder, disabled }) {
  return (
    <select
      style={{ ...S.input, ...(disabled ? S.inputDisabled : {}) }}
      name={name}
      value={value ?? ''}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      disabled={disabled}
    >
      <option value="">{placeholder || 'Select...'}</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  );
}

function Field({ label, required, children }) {
  return (
    <div style={S.field}>
      <label style={S.label}>
        {label}{required && <span style={S.req}>*</span>}
      </label>
      {children}
    </div>
  );
}
function CommentsHistory({ history }) {
  if (!history || history.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#8a94a8', fontSize: 13 }}>
        No comments yet.
      </div>
    );
  }
  const ROLE_LABELS = { requester: 'Requestor', approver: 'Approver', fa_team: 'FA Team', taxation: 'Taxation' };
  return (
    <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #dde2f0', borderRadius: 8, marginBottom: 20 }}>
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
              {new Date(c.timestamp).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: true,
              })}
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#2d3748', lineHeight: 1.6, paddingLeft: 36, whiteSpace: 'pre-wrap' }}>
            {c.comment}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── DEFAULTS ─────────────────────────────────────────────────
// Single source of truth for all field keys.
// Spread initialData on top to pre-populate from DB.
const FORM_DEFAULTS = {
  salesType: '', companyCode: '', assetCategory: '',
  categoryOfUnits: '', entityName: '', assetLocation: '',
  grossValue: '', wdv: '', costCenter: '', salesValue: '',
  consignerName: '', consignerAddress: '', consignerPincode: '',
  consignerLocation: '', plantCode: '', consignerGstin: '',
  consigneeName: '', consigneeAddress: '', consigneePincode: '',
  consigneeLocation: '', consigneeGstin: '', consigneeCategoryOfUnits: '',
  shipToName: '', shipToAddress: '', shipToGstin: '', type: '',
  documentType: '', taxType: '', consigneePlantCode: '', consigneeCostCentre: '',
};

// ─── COMPONENT ────────────────────────────────────────────────
export default function AssetForm({ onSubmit, onSave, onCancel, initialData, onDocDeleted }) {
  // ── CHANGE 1: initialData priority ───────────────────────────
  // Priority: initialData (View Details from DB) > localStorage draft > empty defaults
  // This fixes the blank form bug when clicking View Details.
  const [form, setForm] = useState(() => {
    // If initialData is passed (from View Details), use it directly.
    // Don't load the localStorage draft — that belongs to a different request.
    if (initialData) {
      return { ...FORM_DEFAULTS, ...initialData };
    }

    // Otherwise restore the user's own in-progress draft
    const draft = localStorage.getItem('assetFormDraft');
    if (draft) {
      try {
        const { lineItems: _li, comments: _c, ...formFields } = JSON.parse(draft);
        return { ...FORM_DEFAULTS, ...formFields };
      } catch {}
    }
    return { ...FORM_DEFAULTS };
  });

  const [showValidation, setShowValidation] = useState(false);

  // ── CHANGE 2: read-only mode ──────────────────────────────────
  // When initialData is present the user is VIEWING a submitted request.
  // The form fields become read-only — they can't accidentally edit
  // a submitted request. Only Requestor Saved requests should be editable.
  // initialData.readOnly = true is set by the dashboard for submitted requests.
  const isReadOnly = !!(initialData?.readOnly);

  // ── Line items ────────────────────────────────────────────────
  const [lineItems, setLineItems] = useState(() => {
    if (initialData?.lineItems) return initialData.lineItems;
    try {
      const draft = localStorage.getItem('assetFormDraft');
      if (draft) {
        const parsed = JSON.parse(draft);
        return Array.isArray(parsed.lineItems) ? parsed.lineItems : [];
      }
    } catch {}
    return [];
  });

  const addItem = () => {
    if (isReadOnly) return;
    setLineItems(prev => [...prev, { id: Date.now(), description: '', uqc: '', quantity: '', rate: '', hsnCode: '' }]);
  };

  const deleteItem = (id) => {
    if (isReadOnly) return;
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    if (isReadOnly) return;
    setLineItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
    }, 0);
    if (form.taxType === 'GST') {
      const taxAmount = subtotal * GST_RATE;
      return { subtotal, cgst: taxAmount / 2, sgst: taxAmount / 2, taxAmount, grand: subtotal + taxAmount };
    }
    return { subtotal, cgst: null, sgst: null, taxAmount: 0, grand: subtotal };
  }, [lineItems, form.taxType]);

  // ── Comments ──────────────────────────────────────────────────
  const [comments, setComments] = useState(() => {
    if (initialData?.comments) return initialData.comments;
    try {
      const draft = localStorage.getItem('assetFormDraft');
      if (draft) {
        const parsed = JSON.parse(draft);
        return typeof parsed.comments === 'string' ? parsed.comments : '';
      }
    } catch {}
    return '';
  });

  // ── Documents ─────────────────────────────────────────────────
  const [docs, setDocs] = useState({
    farDocument: null, otherDocuments: null, sourcingApproval: null,
    dc: null, paymentConfirmation: null,
  });

  // Pass null to remove a pending (unsaved) file
  const handleDocChange = (slot, fileOrNull) => {
    if (isReadOnly) return;
    setDocs(prev => ({ ...prev, [slot]: fileOrNull }));
  };

  // ── Handlers ──────────────────────────────────────────────────
  const handleChange = e => {
    if (isReadOnly) return;
    const { name, value } = e.target;
    if (name === 'assetCategory') {
      setForm(prev => ({ ...prev, assetCategory: value, companyCode: '' }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const onFocus = e => { if (!isReadOnly) e.target.style.borderColor = '#1e3fa0'; };
  const onBlur  = e => { e.target.style.borderColor = '#d0d6e8'; };

  const isValid = () => REQUIRED_FIELDS.every(f => form[f] && String(form[f]).trim() !== '');

  const companyCodeOptions = form.assetCategory
    ? (COMPANY_CODE_BY_CATEGORY[form.assetCategory] || [])
    : [];

  const handleSubmit = () => {
    if (isReadOnly) return;
    if (!isValid()) { setShowValidation(true); return; }
    setShowValidation(false);
    // Pass docs alongside form data so dashboard can upload them
    onSubmit({ ...form, lineItems, comments, docs });
  };

  const handleSave = () => {
    if (isReadOnly) return;
    // Pass docs so dashboard can upload them on save too
    onSave({ ...form, lineItems, comments, docs });
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div style={S.form}>

      {/* Refer-back banner — shown when taxation has referred the request back */}
      {!isReadOnly && initialData?.isReferredBack && (
        <div style={{ ...S.readOnlyBanner, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
          <span>⚠</span>
          <span>This request was referred back by the Taxation team. Please review the comments below, make corrections, and resubmit.</span>
        </div>
      )}

      {/* Read-only banner — shown when viewing a submitted request */}
      {isReadOnly && (
        <div style={S.readOnlyBanner}>
          <span>ℹ</span>
          <span>This request has been submitted and cannot be edited. You are viewing a read-only copy.</span>
        </div>
      )}

      {/* Validation message */}
      {showValidation && !isReadOnly && (
        <div style={S.validationMsg}>
          Please fill in all required fields before submitting.
        </div>
      )}

      {/* ── Asset Details ─────────────────────────────────── */}
      <div style={S.sectionHeading}>Asset Details</div>

      <div style={S.row}>
        <Field label="Sales Type">
          <FormSelect name="salesType" value={form.salesType} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} options={SALES_TYPE_OPTIONS} placeholder="Select sales type" disabled={isReadOnly} />
        </Field>
        <Field label="Company Code / Entity Name">
          <FormSelect name="companyCode" value={form.companyCode} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} options={companyCodeOptions} placeholder={form.assetCategory ? 'Select company code' : 'Select category first'} disabled={!form.assetCategory || isReadOnly} />
        </Field>
      </div>

      <div style={S.row}>
        <Field label="Asset Category">
          <FormSelect name="assetCategory" value={form.assetCategory} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} options={ASSET_CATEGORY_OPTIONS} placeholder="Select category" disabled={isReadOnly} />
        </Field>
        <Field label="Category of Units" required>
          <FormSelect name="categoryOfUnits" value={form.categoryOfUnits} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} options={CATEGORY_OF_UNITS_OPTIONS} placeholder="Select unit" disabled={isReadOnly} />
        </Field>
      </div>

      <div style={S.row}>
        <Field label="Entity Name" required>
          <TextInput name="entityName" value={form.entityName} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} placeholder="Enter entity name" readOnly={isReadOnly} />
        </Field>
        <Field label="Asset Location" required>
          <TextInput name="assetLocation" value={form.assetLocation} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} placeholder="Enter asset location" readOnly={isReadOnly} />
        </Field>
      </div>

      <div style={S.row}>
        <Field label="Gross Value (Rs)" required>
          <TextInput name="grossValue" value={form.grossValue} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} placeholder="0.00" type="number" readOnly={isReadOnly} />
        </Field>
        <Field label="WDV (Rs)" required>
          <TextInput name="wdv" value={form.wdv} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} placeholder="0.00" type="number" readOnly={isReadOnly} />
        </Field>
      </div>

      <div style={S.row}>
        <Field label="Cost Center" required>
          <TextInput name="costCenter" value={form.costCenter} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} placeholder="Enter cost center" readOnly={isReadOnly} />
        </Field>
        <Field label="Sales Value (Rs)" required>
          <TextInput name="salesValue" value={form.salesValue} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} placeholder="0.00" type="number" readOnly={isReadOnly} />
        </Field>
      </div>

      {/* ── Consigner Details ─────────────────────────────── */}
      <div style={S.sectionHeading}>Consigner Details</div>

      <div style={S.row}>
        <Field label="Consigner Name">
          <TextInput name="consignerName" value={form.consignerName} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} placeholder="Enter consigner name" readOnly={isReadOnly} />
        </Field>
        <Field label="Consigner Address" required>
          <TextInput name="consignerAddress" value={form.consignerAddress} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} placeholder="Enter address" readOnly={isReadOnly} />
        </Field>
      </div>

      <div style={S.row}>
        <Field label="Consigner Pincode" required>
          <TextInput name="consignerPincode" value={form.consignerPincode} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} placeholder="6-digit pincode" type="number" readOnly={isReadOnly} />
        </Field>
        <Field label="Location" required>
          <TextInput name="consignerLocation" value={form.consignerLocation} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} placeholder="City / Location" readOnly={isReadOnly} />
        </Field>
      </div>

      <div style={S.row}>
        <Field label="Plant Code" required>
          <TextInput name="plantCode" value={form.plantCode} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} placeholder="Enter plant code" readOnly={isReadOnly} />
        </Field>
        <Field label="Consigner GSTIN No." required>
          <TextInput name="consignerGstin" value={form.consignerGstin} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} placeholder="15-character GSTIN" readOnly={isReadOnly} />
        </Field>
      </div>

      {/* ── Consignee Details ─────────────────────────────── */}
      <div style={{ ...S.sectionHeading, marginTop: 28 }}>Consignee Details</div>

      <div style={S.row}>
        <Field label="Consignee Name" required>
          <TextInput name="consigneeName" value={form.consigneeName} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} placeholder="Enter consignee name" readOnly={isReadOnly} />
        </Field>
        <Field label="Consignee Address" required>
          <TextInput name="consigneeAddress" value={form.consigneeAddress} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} placeholder="Enter address" readOnly={isReadOnly} />
        </Field>
      </div>

      <div style={S.row}>
        <Field label="Consignee Pincode" required>
          <TextInput name="consigneePincode" value={form.consigneePincode} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} placeholder="6-digit pincode" type="number" readOnly={isReadOnly} />
        </Field>
        <Field label="Location" required>
          <TextInput name="consigneeLocation" value={form.consigneeLocation} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} placeholder="City / Location" readOnly={isReadOnly} />
        </Field>
      </div>

      <div style={S.row}>
        <Field label="Consignee GSTIN No." required>
          <TextInput name="consigneeGstin" value={form.consigneeGstin} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} placeholder="15-character GSTIN" readOnly={isReadOnly} />
        </Field>
        <Field label="Category of Units">
          <FormSelect name="consigneeCategoryOfUnits" value={form.consigneeCategoryOfUnits} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} options={CATEGORY_OF_UNITS_OPTIONS} placeholder="Select unit" disabled={isReadOnly} />
        </Field>
      </div>

      <div style={S.row}>
        <Field label="Ship To Name">
          <TextInput name="shipToName" value={form.shipToName} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} placeholder="Enter ship to name" readOnly={isReadOnly} />
        </Field>
        <Field label="Ship To Address">
          <TextInput name="shipToAddress" value={form.shipToAddress} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} placeholder="Enter address" readOnly={isReadOnly} />
        </Field>
      </div>

      <div style={S.row}>
        <Field label="Ship To GSTIN No.">
          <TextInput name="shipToGstin" value={form.shipToGstin} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} placeholder="15-character GSTIN" readOnly={isReadOnly} />
        </Field>
        <Field label="Type">
          <FormSelect name="type" value={form.type} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} options={TYPE_OPTIONS} placeholder="Select type" disabled={isReadOnly} />
        </Field>
      </div>

      <div style={S.row}>
        <Field label="Document Type">
          <FormSelect name="documentType" value={form.documentType} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} options={DOCUMENT_TYPE_OPTIONS} placeholder="Select document type" disabled={isReadOnly} />
        </Field>
        <Field label="Tax Type" required>
          <FormSelect name="taxType" value={form.taxType} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} options={TAX_TYPE_OPTIONS} placeholder="Select tax type" disabled={isReadOnly} />
        </Field>
      </div>

      <div style={S.row}>
        <Field label="Consignee Plant Code" required>
          <TextInput name="consigneePlantCode" value={form.consigneePlantCode} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} placeholder="Enter plant code" readOnly={isReadOnly} />
        </Field>
        <Field label="Cost Centre">
          <TextInput name="consigneeCostCentre" value={form.consigneeCostCentre} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} placeholder="Enter cost centre" readOnly={isReadOnly} />
        </Field>
      </div>

      {/* ── Line Items ────────────────────────────────────── */}
      <div style={{ ...S.sectionHeading, marginTop: 28 }}>Line Items</div>

      {!isReadOnly && (
        <button type="button" style={S.addItemBtn} onClick={addItem}>+ Add Item</button>
      )}

      <div style={S.tableWrapper}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={{ ...S.th, width: 40 }}>SNO</th>
              <th style={S.th}>Description</th>
              <th style={{ ...S.th, width: 110 }}>UQC</th>
              <th style={{ ...S.th, width: 90 }}>Quantity</th>
              <th style={{ ...S.th, width: 110 }}>Rate (Rs)</th>
              <th style={{ ...S.th, width: 110 }}>Amount (Rs)</th>
              <th style={{ ...S.th, width: 110 }}>HSN Code</th>
              {!isReadOnly && <th style={{ ...S.th, width: 70 }}>Delete</th>}
            </tr>
          </thead>
          <tbody>
            {lineItems.length === 0 && (
              <tr>
                <td colSpan={isReadOnly ? 7 : 8} style={{ ...S.td, textAlign: 'center', color: '#aaa', padding: '20px 0', fontSize: 13 }}>
                  {isReadOnly ? 'No line items on this request.' : 'No items yet — click "+ Add Item" above'}
                </td>
              </tr>
            )}
            {lineItems.map((item, idx) => {
              const qty = parseFloat(item.quantity) || 0;
              const rate = parseFloat(item.rate) || 0;
              const amount = qty * rate;
              return (
                <tr key={item.id}>
                  <td style={S.tdCenter}>{idx + 1}</td>
                  <td style={S.td}>
                    <input style={S.tableInput} placeholder="Item description" value={item.description} readOnly={isReadOnly}
                      onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                      onFocus={e => { if (!isReadOnly) e.target.style.borderColor = '#1e3fa0'; }}
                      onBlur={e => e.target.style.borderColor = '#d0d6e8'} />
                  </td>
                  <td style={S.td}>
                    <select style={S.tableInput} value={item.uqc} disabled={isReadOnly}
                      onChange={e => handleItemChange(item.id, 'uqc', e.target.value)}>
                      <option value="">Select</option>
                      {UQC_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                  <td style={S.td}>
                    <input style={S.tableInput} type="number" placeholder="0" min="0" value={item.quantity} readOnly={isReadOnly}
                      onChange={e => handleItemChange(item.id, 'quantity', e.target.value)}
                      onFocus={e => { if (!isReadOnly) e.target.style.borderColor = '#1e3fa0'; }}
                      onBlur={e => e.target.style.borderColor = '#d0d6e8'} />
                  </td>
                  <td style={S.td}>
                    <input style={S.tableInput} type="number" placeholder="0.00" min="0" value={item.rate} readOnly={isReadOnly}
                      onChange={e => handleItemChange(item.id, 'rate', e.target.value)}
                      onFocus={e => { if (!isReadOnly) e.target.style.borderColor = '#1e3fa0'; }}
                      onBlur={e => e.target.style.borderColor = '#d0d6e8'} />
                  </td>
                  <td style={S.amountCell}>
                    {amount > 0 ? `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                  </td>
                  <td style={S.td}>
                    <input style={S.tableInput} placeholder="HSN code" value={item.hsnCode} readOnly={isReadOnly}
                      onChange={e => handleItemChange(item.id, 'hsnCode', e.target.value)}
                      onFocus={e => { if (!isReadOnly) e.target.style.borderColor = '#1e3fa0'; }}
                      onBlur={e => e.target.style.borderColor = '#d0d6e8'} />
                  </td>
                  {!isReadOnly && (
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <button type="button" style={S.deleteBtn} onClick={() => deleteItem(item.id)}>Remove</button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totals.subtotal > 0 && (
        <div style={S.totalsBox}>
          <div style={S.totalsRow}>
            <span style={S.totalsLabel}>Subtotal</span>
            <span style={S.totalsValue}>₹ {totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          {form.taxType === 'GST' && <>
            <div style={S.totalsRow}>
              <span style={S.totalsLabel}>CGST @ 9%</span>
              <span style={S.totalsValue}>₹ {totals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={S.totalsRow}>
              <span style={S.totalsLabel}>SGST @ 9%</span>
              <span style={S.totalsValue}>₹ {totals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </>}
          <div style={S.totalsFinalRow}>
            <span style={S.totalsFinalLabel}>Grand Total</span>
            <span style={S.totalsFinalValue}>₹ {totals.grand.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      )}

      {/* ── Comments ──────────────────────────────────────── */}
      <div style={{ ...S.sectionHeading, marginTop: 8 }}>Comments</div>

      {isReadOnly ? (
        <CommentsHistory history={initialData?.commentsHistory || []}  />
      ) : (
        <div style={S.field}>
          <label style={S.label}>
            Comments <span style={S.req}>*</span>
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 6 }}>(min. 10 characters)</span>
          </label>
          <textarea style={S.textarea}
            placeholder="Enter any relevant comments…"
            value={comments}
            onChange={e => setComments(e.target.value)}
            onFocus={e => { e.target.style.borderColor = '#1e3fa0'; }}
            onBlur={e => e.target.style.borderColor = '#d0d6e8'}
          />
          <span style={comments.length >= 10 ? S.charCount : S.charCountError}>
            {comments.length} / 10 characters minimum
          </span>
        </div>
      )}


      <div style={{ ...S.sectionHeading, marginTop: 28 }}>Document Upload</div>

      {/* Inline file viewer — shown below the upload grid when a file is being previewed */}
      {/* viewingDoc state holds { url, name, type } or null */}

      {(() => {
        // All 5 document slots defined once — used by both editable and read-only views
        const SLOTS = [
          { slot: 'farDocument',         label: 'FAR Document',       docType: 'far'      },
          { slot: 'otherDocuments',      label: 'Other Documents',    docType: 'other'    },
          { slot: 'sourcingApproval',    label: 'Sourcing Approval',  docType: 'sourcing' },
          { slot: 'dc',                  label: 'DC',                 docType: 'dc'       },
          { slot: 'paymentConfirmation', label: 'Payment Confirmation', docType: 'payment'},
        ];

        // Build a map of docType → uploaded doc for easy lookup
        const uploadedMap = {};
        (initialData?.uploadedDocs || []).forEach(d => { uploadedMap[d.docType] = d; });

        return (
          <div>
            <div style={S.uploadGrid}>
              {SLOTS.map(({ slot, label, docType }) => {
                const uploadedDoc  = uploadedMap[docType];   // already in DB
                const pendingFile  = docs[slot];             // selected but not yet saved

                return (
                  <div key={slot} style={S.uploadSlot}>
                    <span style={S.uploadLabel}>{label}</span>

                    {/* ── Case 1: File already uploaded to DB ── */}
                    {uploadedDoc ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ ...S.uploadBox, background: '#f0f4ff', border: '1.5px solid #c2cbe0', cursor: 'default', justifyContent: 'space-between' }}>
                          <span style={{ ...S.uploadFileName, flex: 1 }}>{uploadedDoc.originalName}</span>
                          <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 8 }}>
                            {/* View button — opens in new tab */}
                            <button
                              type="button"
                              style={{ fontSize: 11, color: '#1a3a8f', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                              onClick={async () => {
                                try {
                                  const token = localStorage.getItem('token');
                                  const res   = await fetch(`/api/assets/documents/${uploadedDoc.id}/view`, {
                                    headers: { Authorization: `Bearer ${token}` },
                                  });
                                  if (!res.ok) throw new Error('Failed to load file');
                                  const blob = await res.blob();
                                  const url  = URL.createObjectURL(blob);
                                  window.open(url, '_blank');
                                  setTimeout(() => URL.revokeObjectURL(url), 30000);
                                } catch (err) {
                                  alert('Could not open file: ' + err.message);
                                }
                              }}
                            >
                              View
                            </button>
                            {/* Delete button — only for editable (draft) requests */}
                            {!isReadOnly && (
                              <button
                                type="button"
                                style={{ fontSize: 11, color: '#c0392b', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                                onClick={async () => {
                                  if (!window.confirm(`Delete ${uploadedDoc.originalName}?`)) return;
                                  try {
                                    const token = localStorage.getItem('token');
                                    const res   = await fetch(`/api/assets/documents/${uploadedDoc.id}`, {
                                      method: 'DELETE',
                                      headers: { Authorization: `Bearer ${token}` },
                                    });
                                    if (!res.ok) throw new Error('Delete failed');
                                    // Remove from initialData so it disappears from UI
                                    // Parent will re-fetch on next open
                                    onDocDeleted && onDocDeleted(uploadedDoc.id);
                                  } catch (err) {
                                    alert('Could not delete file: ' + err.message);
                                  }
                                }}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : pendingFile ? (
                      /* ── Case 2: File selected but not yet saved ── */
                      <div style={{ ...S.uploadBox, background: '#f0f4ff', border: '1.5px solid #c2cbe0', justifyContent: 'space-between', cursor: 'default' }}>
                        <span style={{ ...S.uploadFileName, flex: 1 }}>{pendingFile.name}</span>
                        {!isReadOnly && (
                          <button
                            type="button"
                            style={{ fontSize: 11, color: '#c0392b', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', marginLeft: 8, flexShrink: 0 }}
                            onClick={() => handleDocChange(slot, null)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ) : (
                      /* ── Case 3: No file — show upload slot (editable only) ── */
                      !isReadOnly ? (
                        <label style={{ ...S.uploadBox, cursor: 'pointer' }}>
                          <span style={{ color: '#8a94a8', fontSize: 13 }}>Click to upload</span>
                          <input
                            type="file"
                            style={{ display: 'none' }}
                            onChange={e => {
                              const f = e.target.files[0];
                              if (f) handleDocChange(slot, f);
                              // Reset input so same file can be re-selected if removed
                              e.target.value = '';
                            }}
                          />
                        </label>
                      ) : (
                        <div style={{ ...S.uploadBox, background: '#f9fafb', border: '1px dashed #d0d6e8', cursor: 'default', color: '#aaa', fontSize: 13 }}>
                          No file uploaded
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        );
      })()}

      {/* ── Button Row ────────────────────────────────────── */}
      <div style={S.btnRow}>
        <button style={S.cancelBtn} onClick={onCancel}>
          {isReadOnly ? 'Back' : 'Cancel'}
        </button>
        {!isReadOnly && <>
          <button style={S.saveBtn} onClick={handleSave}>Save Draft</button>
          <button
  style={{ ...S.submitBtn, ...(isValid() ? {} : S.submitBtnDisabled) }}
  onClick={handleSubmit}
  disabled={!isValid()}
  title={isValid() ? 'Submit form' : 'Fill all required fields first'}
>
  {initialData?.isReferredBack ? 'Resubmit' : 'Submit'}
</button>
        </>}
      </div>

    </div>
  );
}