// TaxInvoicePrint.jsx
// Opened via window.open() as a standalone print page.
// Route: /taxation/invoice/:id
// Fetches GET /api/taxation/:id/invoice and renders a printable tax invoice.

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

// ── Amount in words ────────────────────────────────────────────
const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
  'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen',
  'Seventeen','Eighteen','Nineteen'];
const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

function numToWords(n) {
  if (n === 0) return 'Zero';
  if (n < 0)   return 'Minus ' + numToWords(-n);
  if (n < 20)  return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + numToWords(n % 100) : '');
  if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numToWords(n % 1000) : '');
  if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numToWords(n % 100000) : '');
  return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + numToWords(n % 10000000) : '');
}

function amountInWords(amount) {
  const n    = Math.round(amount);
  const paise = Math.round((amount - n) * 100);
  let result = 'Rupees ' + numToWords(n);
  if (paise > 0) result += ' and ' + numToWords(paise) + ' Paise';
  return result + ' Only';
}

// ── Styles (inline — print-safe) ───────────────────────────────
const P = {
  page: { fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#000', padding: '20px 32px', maxWidth: 900, margin: '0 auto' },
  title: { textAlign: 'center', fontSize: 18, fontWeight: 'bold', marginBottom: 4, letterSpacing: 1 },
  subtitle: { textAlign: 'center', fontSize: 13, marginBottom: 16, color: '#333' },
  divider: { borderTop: '2px solid #000', marginBottom: 12 },
  thinDivider: { borderTop: '1px solid #888', margin: '10px 0' },
  section2col: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px', marginBottom: 12 },
  section3col: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 24px', marginBottom: 12 },
  boxLabel: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', color: '#555', marginBottom: 2 },
  boxHeading: { fontSize: 12, fontWeight: 'bold', marginBottom: 4, borderBottom: '1px solid #ccc', paddingBottom: 3 },
  boxValue: { fontSize: 12, lineHeight: 1.6 },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: 8, fontSize: 11 },
  th: { border: '1px solid #000', padding: '6px 8px', background: '#f0f0f0', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap' },
  td: { border: '1px solid #000', padding: '5px 8px', verticalAlign: 'top' },
  tdRight: { border: '1px solid #000', padding: '5px 8px', textAlign: 'right', whiteSpace: 'nowrap' },
  tdCenter: { border: '1px solid #000', padding: '5px 8px', textAlign: 'center' },
  totalRow: { fontWeight: 'bold', background: '#f9f9f9' },
  gstBox: { border: '1px solid #000', padding: '10px 14px', marginTop: 10, marginBottom: 10, background: '#fafafa' },
  amountWords: { border: '1px solid #000', padding: '8px 12px', marginTop: 8, fontStyle: 'italic', fontSize: 12 },
  declaration: { marginTop: 14, fontSize: 11, color: '#333', lineHeight: 1.7 },
  signatureRow: { display: 'flex', justifyContent: 'space-between', marginTop: 40, paddingTop: 10 },
  signatureBox: { textAlign: 'center', minWidth: 160 },
  signatureLine: { borderTop: '1px solid #000', paddingTop: 4, fontSize: 11 },
  printBtn: { position: 'fixed', top: 12, right: 16, padding: '8px 20px', background: '#1a3a8f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
};

export default function TaxInvoicePrint() {
  const { id } = useParams();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`/api/taxation/${id}/invoice`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(res => {
        if (res.message && !res.request) { setError(res.message); }
        else { setData(res.request); }
        setLoading(false);
      })
      .catch(() => { setError('Failed to load invoice.'); setLoading(false); });
  }, [id]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading invoice...</div>;
  if (error)   return <div style={{ padding: 40, color: 'red' }}>{error}</div>;
  if (!data)   return null;

  const r = data;

  // ── Line item calculations ─────────────────────────────────
  const items = (r.items || []).map(it => ({
    ...it,
    amount:       Number(it.quantity || 0) * Number(it.rate || 0),
    taxableValue: Number(it.taxableValue || 0),
    gstAmount:    Number(it.gstAmount    || 0),
    totalAmount:  Number(it.totalAmount  || it.quantity * it.rate || 0),
  }));

  const totals = items.reduce((acc, it) => ({
    amount:       acc.amount       + it.amount,
    taxableValue: acc.taxableValue + it.taxableValue,
    gstAmount:    acc.gstAmount    + it.gstAmount,
    totalAmount:  acc.totalAmount  + it.totalAmount,
  }), { amount: 0, taxableValue: 0, gstAmount: 0, totalAmount: 0 });

  // ── GST rows ───────────────────────────────────────────────
  const gstRows  = r.gstRows || [];
  const gstTotal = gstRows.reduce((s, g) => s + Number(g.amount || 0), 0);
  const isWithoutTax = /without\s*tax/i.test(r.taxType?.label || '');

  // ── Formatting helpers ─────────────────────────────────────
  const fmt  = n => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div style={P.page}>

      {/* Print button — hidden when printing */}
      <button style={P.printBtn} onClick={() => window.print()}
        className="no-print">
         Print / Save PDF
      </button>

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={P.title}>HCL Technologies Ltd</div>
      <div style={P.subtitle}>TAX INVOICE</div>
      <div style={P.divider} />

      {/* ── Invoice meta ─────────────────────────────────────── */}
      <div style={P.section2col}>
        <div>
          <div style={P.boxLabel}>Invoice No</div>
          <div style={{ ...P.boxValue, fontWeight: 'bold', fontSize: 13 }}>{r.taxInvoiceNo || '—'}</div>
        </div>
        <div>
          <div style={P.boxLabel}>Invoice Date</div>
          <div style={{ ...P.boxValue, fontWeight: 'bold', fontSize: 13 }}>{fmtD(r.taxInvoiceDate)}</div>
        </div>
      </div>

      <div style={P.thinDivider} />

      {/* ── Three party boxes ─────────────────────────────────── */}
      <div style={P.section3col}>

        {/* Consignor */}
        <div>
          <div style={P.boxHeading}>Consignor (Bill From)</div>
          <div style={P.boxValue}>
            <div style={{ fontWeight: 'bold' }}>{r.consignerName || '—'}</div>
            <div>{r.consignerAddress || '—'}</div>
            {r.consignerPincode && <div>PIN: {r.consignerPincode}</div>}
            {r.consignerLocation && <div>{r.consignerLocation}</div>}
            {r.plantCode         && <div>Plant: {r.plantCode}</div>}
            {r.consignerGstin    && <div>GSTIN: {r.consignerGstin}</div>}
          </div>
        </div>

        {/* Consignee */}
        <div>
          <div style={P.boxHeading}>Consignee (Bill To)</div>
          <div style={P.boxValue}>
            <div style={{ fontWeight: 'bold' }}>{r.consigneeName || '—'}</div>
            <div>{r.consigneeAddress || '—'}</div>
            {r.consigneePincode  && <div>PIN: {r.consigneePincode}</div>}
            {r.consigneeLocation && <div>{r.consigneeLocation}</div>}
            {r.consigneeGstin    && <div>GSTIN: {r.consigneeGstin}</div>}
          </div>
        </div>

        {/* Ship To */}
        <div>
          <div style={P.boxHeading}>Ship To</div>
          <div style={P.boxValue}>
            <div style={{ fontWeight: 'bold' }}>{r.shipToName || '—'}</div>
            <div>{r.shipToAddress || '—'}</div>
            {r.shipToGstin && <div>GSTIN: {r.shipToGstin}</div>}
          </div>
        </div>

      </div>

      <div style={P.thinDivider} />

      {/* ── Additional details row ────────────────────────────── */}
      <div style={{ ...P.section2col, marginBottom: 8 }}>
        <div><span style={P.boxLabel}>Request No: </span>{r.requestNo}</div>
        <div><span style={P.boxLabel}>Tax Type: </span>{r.taxType?.label || '—'}</div>
      </div>

      <div style={P.thinDivider} />

      {/* ── Line items table ──────────────────────────────────── */}
      <table style={P.table}>
        <thead>
          <tr>
            <th style={P.th}>S.No</th>
            <th style={P.th}>Description</th>
            <th style={P.th}>HSN Code</th>
            <th style={P.th}>UQC</th>
            <th style={P.th}>Qty</th>
            <th style={P.th}>Rate (₹)</th>
            <th style={P.th}>Amount (₹)</th>
            {!isWithoutTax && <>
              <th style={P.th}>GST Rate</th>
              <th style={P.th}>Taxable Value (₹)</th>
              <th style={P.th}>GST Amount (₹)</th>
              <th style={P.th}>Total Amount (₹)</th>
            </>}
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={it.id}>
              <td style={P.tdCenter}>{idx + 1}</td>
              <td style={P.td}>{it.description || '—'}</td>
              <td style={P.tdCenter}>{it.hsnCode || '—'}</td>
              <td style={P.tdCenter}>{it.uqcCode || '—'}</td>
              <td style={P.tdCenter}>{it.quantity}</td>
              <td style={P.tdRight}>{fmt(it.rate)}</td>
              <td style={P.tdRight}>{fmt(it.amount)}</td>
              {!isWithoutTax && <>
                <td style={P.tdCenter}>{it.gstRate != null ? `${it.gstRate}%` : '—'}</td>
                <td style={P.tdRight}>{fmt(it.taxableValue)}</td>
                <td style={P.tdRight}>{fmt(it.gstAmount)}</td>
                <td style={P.tdRight}>{fmt(it.totalAmount)}</td>
              </>}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={P.totalRow}>
            <td style={{ ...P.td, fontWeight: 'bold', textAlign: 'right' }}
              colSpan={isWithoutTax ? 6 : 8}>
              TOTAL
            </td>
            <td style={{ ...P.tdRight, fontWeight: 'bold' }}>{fmt(totals.amount)}</td>
            {!isWithoutTax && <>
              <td style={{ ...P.tdRight, fontWeight: 'bold' }}>{fmt(totals.taxableValue)}</td>
              <td style={{ ...P.tdRight, fontWeight: 'bold' }}>{fmt(totals.gstAmount)}</td>
              <td style={{ ...P.tdRight, fontWeight: 'bold' }}>{fmt(totals.totalAmount)}</td>
            </>}
          </tr>
        </tfoot>
      </table>

      {/* ── GST summary ───────────────────────────────────────── */}
      {!isWithoutTax && gstRows.length > 0 && (
        <div style={P.gstBox}>
          <div style={{ fontWeight: 'bold', marginBottom: 6 }}>GST Summary</div>
          <table style={{ ...P.table, marginTop: 0 }}>
            <thead>
              <tr>
                <th style={P.th}>GST Type</th>
                <th style={P.th}>GST Rate</th>
                <th style={P.th}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {gstRows.map((g, i) => (
                <tr key={i}>
                  <td style={P.tdCenter}>{g.gstType}</td>
                  <td style={P.tdCenter}>{Number(g.gstRate).toFixed(2)}%</td>
                  <td style={P.tdRight}>{fmt(g.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={P.totalRow}>
                <td style={{ ...P.td, textAlign: 'right', fontWeight: 'bold' }} colSpan={2}>Total Tax</td>
                <td style={{ ...P.tdRight, fontWeight: 'bold' }}>₹ {fmt(gstTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ── Amount in words ───────────────────────────────────── */}
      <div style={P.amountWords}>
        <strong>Amount in Words: </strong>
        {amountInWords(isWithoutTax ? totals.amount : totals.totalAmount)}
      </div>

      {/* ── Declaration ───────────────────────────────────────── */}
      <div style={P.declaration}>
        <strong>Declaration:</strong> We declare that this invoice shows the actual price of the
        goods described and that all particulars are true and correct.
      </div>

      {/* ── Signature row ─────────────────────────────────────── */}
      <div style={P.signatureRow}>
        <div style={P.signatureBox}>
          <div style={P.signatureLine}>Authorised Signatory</div>
          <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>For HCL Technologies Ltd</div>
        </div>
        <div style={P.signatureBox}>
          <div style={P.signatureLine}>Receiver's Signature</div>
          <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>Date: ___________</div>
        </div>
      </div>

      {/* Print-specific CSS — hides the button when printing */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
        @page { size: A4; margin: 15mm; }
      `}</style>

    </div>
  );
}