import { useState } from 'react';
import { apiURL } from '../../api.js';

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const jsonHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });

function INR(n) {
  const v = parseFloat(n || 0);
  if (v >= 1e7) return 'Rs ' + (v/1e7).toFixed(2) + ' Cr';
  if (v >= 1e5) return 'Rs ' + (v/1e5).toFixed(2) + ' L';
  return 'Rs ' + v.toLocaleString('en-IN');
}

function Badge({ text, color }) {
  const colors = { high:'#22C98A', medium:'#F5A623', low:'#FF5C5C' };
  return <span style={{ padding:'2px 10px', borderRadius:100, fontSize:11, fontWeight:700, background:(colors[color]||colors[text]||'#1B4FD8')+'20', color:colors[color]||colors[text]||'#1B4FD8' }}>{text}</span>;
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.05em', marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:14, color:'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

export default function DocumentAIPage() {
  const [tab, setTab] = useState('upload');
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [matchedVendor, setMatchedVendor] = useState(null);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null);
  const [error, setError] = useState('');

  // Text analysis
  const [text, setText] = useState('');
  const [textResult, setTextResult] = useState(null);
  const [textLoading, setTextLoading] = useState(false);

  const handleFile = f => {
    if (!f) return;
    setFile(f); setExtracted(null); setMatchedVendor(null); setCreated(null); setError('');
  };

  const readInvoice = async () => {
    if (!file) return;
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch(apiURL('/api/document-ai/read-invoice'), { method:'POST', headers: headers(), body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setExtracted(data.extracted);
      setMatchedVendor(data.matched_vendor);
    } catch(e) { setError(e.message); } finally { setLoading(false); }
  };

  const createInvoice = async () => {
    if (!extracted) return;
    setCreating(true); setError('');
    try {
      const r = await fetch(apiURL('/api/document-ai/create-invoice'), {
        method:'POST', headers: jsonHeaders(),
        body: JSON.stringify({ extracted, vendor_id: matchedVendor?.id, create_vendor_if_missing: !matchedVendor }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setCreated(data.invoice);
    } catch(e) { setError(e.message); } finally { setCreating(false); }
  };

  const analyzeText = async () => {
    if (!text.trim()) return;
    setTextLoading(true);
    try {
      const r = await fetch(apiURL('/api/document-ai/analyze-text'), {
        method:'POST', headers: jsonHeaders(), body: JSON.stringify({ text }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setTextResult(data);
    } catch(e) { setError(e.message); } finally { setTextLoading(false); }
  };

  return (
    <div style={{ padding:24 }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22, fontWeight:800, margin:0, marginBottom:6 }}>Document AI</h2>
        <p style={{ fontSize:14, color:'var(--text-muted)', margin:0 }}>Upload invoices, receipts, or any financial document — AI reads and creates entries automatically</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:24 }}>
        {[['upload','📄 Invoice OCR'],['text','✍️ Text Analysis']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding:'10px 20px', fontSize:14, fontWeight:600,
            background:'none', border:'none', cursor:'pointer',
            borderBottom: tab===id ? '2px solid #1B4FD8' : '2px solid transparent',
            color: tab===id ? '#1B4FD8' : 'var(--text-secondary)', marginBottom:-1,
          }}>{label}</button>
        ))}
      </div>

      {tab === 'upload' && (
        <div style={{ display:'grid', gridTemplateColumns: extracted ? '1fr 1fr' : '1fr', gap:24 }}>
          {/* Upload panel */}
          <div>
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => document.getElementById('fileInput').click()}
              style={{
                border:`2px dashed ${dragging ? '#1B4FD8' : 'var(--border)'}`,
                borderRadius:16, padding:'40px 24px', textAlign:'center', cursor:'pointer',
                background: dragging ? '#1B4FD808' : 'var(--surface-2)',
                transition:'all 0.2s', marginBottom:16,
              }}
            >
              <input id="fileInput" type="file" accept="image/*,application/pdf" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])} />
              <div style={{ fontSize:40, marginBottom:12 }}>📄</div>
              <div style={{ fontSize:16, fontWeight:700, marginBottom:6 }}>
                {file ? file.name : 'Drop invoice here or click to upload'}
              </div>
              <div style={{ fontSize:13, color:'var(--text-muted)' }}>
                {file ? `${(file.size/1024).toFixed(1)} KB · ${file.type}` : 'Supports PDF, JPEG, PNG, WebP'}
              </div>
            </div>

            {/* Capabilities */}
            <div style={{ borderRadius:12, border:'1px solid var(--border)', padding:16, marginBottom:16, background:'var(--surface-2)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', marginBottom:10, letterSpacing:'0.05em' }}>WHAT AI EXTRACTS</div>
              {['Invoice number & dates','Vendor name & GSTIN','Line items with HSN codes','CGST / SGST / IGST breakdown','Total amount & payment terms','Auto-matches to existing vendors'].map(f => (
                <div key={f} style={{ fontSize:13, color:'var(--text-secondary)', padding:'4px 0', display:'flex', gap:8 }}>
                  <span style={{ color:'#22C98A' }}>✓</span>{f}
                </div>
              ))}
            </div>

            {error && <div style={{ padding:'10px 14px', borderRadius:8, background:'#FF5C5C15', border:'1px solid #FF5C5C30', color:'#FF5C5C', fontSize:13, marginBottom:12 }}>{error}</div>}

            <button onClick={readInvoice} disabled={!file||loading} style={{
              width:'100%', padding:'13px', borderRadius:10, fontSize:15, fontWeight:700,
              background: (!file||loading) ? 'var(--surface-3)' : 'linear-gradient(135deg,#1B4FD8,#3B82F6)',
              color: (!file||loading) ? 'var(--text-muted)' : '#fff',
              border:'none', cursor: (!file||loading) ? 'not-allowed' : 'pointer',
            }}>
              {loading ? '🔍 Reading invoice...' : '🔍 Read Invoice with AI'}
            </button>
          </div>

          {/* Extracted data panel */}
          {extracted && (
            <div>
              <div style={{ borderRadius:12, border:'1px solid var(--border)', overflow:'hidden' }}>
                <div style={{ padding:'14px 16px', background:'var(--surface-3)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:14, fontWeight:700 }}>Extracted Data</span>
                  <Badge text={extracted.confidence} color={extracted.confidence} />
                </div>
                <div style={{ padding:16 }}>
                  <Field label="INVOICE NUMBER" value={extracted.invoice_number} />
                  <Field label="VENDOR" value={extracted.vendor_name} />
                  <Field label="VENDOR GSTIN" value={extracted.vendor_gstin} />
                  <Field label="INVOICE DATE" value={extracted.invoice_date} />
                  <Field label="DUE DATE" value={extracted.due_date} />

                  {/* Amounts */}
                  <div style={{ marginTop:12, padding:12, borderRadius:8, background:'var(--surface-2)', marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <span style={{ fontSize:13, color:'var(--text-secondary)' }}>Subtotal</span>
                      <span style={{ fontSize:13 }}>{INR(extracted.subtotal)}</span>
                    </div>
                    {extracted.cgst > 0 && <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}><span style={{ fontSize:13, color:'var(--text-secondary)' }}>CGST</span><span style={{ fontSize:13 }}>{INR(extracted.cgst)}</span></div>}
                    {extracted.sgst > 0 && <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}><span style={{ fontSize:13, color:'var(--text-secondary)' }}>SGST</span><span style={{ fontSize:13 }}>{INR(extracted.sgst)}</span></div>}
                    {extracted.igst > 0 && <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}><span style={{ fontSize:13, color:'var(--text-secondary)' }}>IGST</span><span style={{ fontSize:13 }}>{INR(extracted.igst)}</span></div>}
                    <div style={{ display:'flex', justifyContent:'space-between', paddingTop:8, borderTop:'1px solid var(--border)' }}>
                      <span style={{ fontSize:14, fontWeight:700 }}>Total Amount</span>
                      <span style={{ fontSize:16, fontWeight:800, color:'#1B4FD8' }}>{INR(extracted.total_amount)}</span>
                    </div>
                  </div>

                  {/* Line items */}
                  {extracted.line_items?.length > 0 && (
                    <div style={{ marginBottom:12 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:6, letterSpacing:'0.05em' }}>LINE ITEMS ({extracted.line_items.length})</div>
                      {extracted.line_items.map((item, i) => (
                        <div key={i} style={{ padding:'6px 10px', borderRadius:6, background:'var(--surface-2)', marginBottom:4, display:'flex', justifyContent:'space-between', fontSize:12 }}>
                          <span style={{ color:'var(--text-secondary)' }}>{item.description}</span>
                          <span style={{ fontWeight:600 }}>{INR(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Vendor match */}
                  <div style={{ padding:10, borderRadius:8, background: matchedVendor ? '#22C98A12' : '#F5A62312', border:`1px solid ${matchedVendor ? '#22C98A30' : '#F5A62330'}`, marginBottom:16 }}>
                    {matchedVendor ? (
                      <div style={{ fontSize:12, color:'#22C98A' }}>✓ Matched to vendor: <strong>{matchedVendor.name}</strong></div>
                    ) : (
                      <div style={{ fontSize:12, color:'#F5A623' }}>⚠ No matching vendor found — will create new vendor</div>
                    )}
                  </div>

                  {created ? (
                    <div style={{ padding:'12px 16px', borderRadius:10, background:'#22C98A15', border:'1px solid #22C98A30', textAlign:'center' }}>
                      <div style={{ fontSize:16, marginBottom:4 }}>✅</div>
                      <div style={{ fontSize:14, fontWeight:700, color:'#22C98A' }}>AP Invoice Created!</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>Invoice #{created.invoice_number} added to Accounts Payable</div>
                    </div>
                  ) : (
                    <button onClick={createInvoice} disabled={creating} style={{
                      width:'100%', padding:'11px', borderRadius:10, fontSize:14, fontWeight:700,
                      background: creating ? 'var(--surface-3)' : 'linear-gradient(135deg,#22C98A,#1AAF74)',
                      color: creating ? 'var(--text-muted)' : '#fff',
                      border:'none', cursor: creating ? 'not-allowed' : 'pointer',
                    }}>
                      {creating ? 'Creating...' : '+ Create AP Invoice'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'text' && (
        <div style={{ maxWidth:700 }}>
          <div style={{ marginBottom:12 }}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste any financial email, invoice text, payment confirmation, contract snippet..."
              rows={8}
              style={{
                width:'100%', boxSizing:'border-box', padding:'12px 16px',
                borderRadius:10, border:'1px solid var(--border)',
                background:'var(--surface-2)', color:'var(--text-primary)',
                fontSize:14, resize:'vertical', outline:'none',
                fontFamily:'inherit',
              }}
            />
          </div>
          <button onClick={analyzeText} disabled={!text.trim()||textLoading} style={{
            padding:'11px 24px', borderRadius:10, fontSize:14, fontWeight:700, marginBottom:20,
            background: (!text.trim()||textLoading) ? 'var(--surface-3)' : 'linear-gradient(135deg,#1B4FD8,#3B82F6)',
            color: (!text.trim()||textLoading) ? 'var(--text-muted)' : '#fff',
            border:'none', cursor: (!text.trim()||textLoading) ? 'not-allowed' : 'pointer',
          }}>
            {textLoading ? 'Analyzing...' : '🧠 Analyze with AI'}
          </button>

          {textResult && (
            <div style={{ borderRadius:12, border:'1px solid var(--border)', overflow:'hidden' }}>
              <div style={{ padding:'14px 16px', background:'var(--surface-3)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:14, fontWeight:700 }}>Analysis Result</span>
                <div style={{ display:'flex', gap:8 }}>
                  <Badge text={textResult.document_type} color="high" />
                  <Badge text={textResult.confidence} color={textResult.confidence} />
                </div>
              </div>
              <div style={{ padding:20 }}>
                <div style={{ padding:'10px 14px', borderRadius:8, background:'#1B4FD812', border:'1px solid #1B4FD825', marginBottom:16, fontSize:14, color:'var(--text-primary)' }}>
                  {textResult.summary}
                </div>
                {textResult.action_required !== 'none' && (
                  <div style={{ padding:'8px 14px', borderRadius:8, background:'#F5A62312', border:'1px solid #F5A62330', marginBottom:16, fontSize:13, color:'#F5A623' }}>
                    ⚡ Suggested action: <strong>{textResult.action_required?.replace(/_/g,' ')}</strong>
                  </div>
                )}
                {textResult.key_entities && (
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:8, letterSpacing:'0.05em' }}>KEY ENTITIES</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      {Object.entries(textResult.key_entities).filter(([,v]) => v).map(([k,v]) => (
                        <div key={k} style={{ padding:'8px 12px', borderRadius:8, background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                          <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', marginBottom:2 }}>{k.toUpperCase()}</div>
                          <div style={{ fontSize:13 }}>{String(v)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

