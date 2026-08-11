import { useState, useRef, useCallback, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const post = async (url, body) => { const r = await fetch(apiURL(url), { method: 'POST', headers: h(), body: JSON.stringify(body) }); const t = await r.text(); try { return JSON.parse(t); } catch { return {}; } };

// ── Node Types ────────────────────────────────────────────────
const NODE_TYPES = {
  // Triggers
  trigger_schedule:   { label: 'Schedule',        color: '#7C3AED', bg: '#F5F3FF', icon: '⏰', cat: 'trigger' },
  trigger_webhook:    { label: 'Webhook',          color: '#0284C7', bg: '#F0F9FF', icon: '🔗', cat: 'trigger' },
  trigger_invoice:    { label: 'New Invoice',      color: '#059669', bg: '#ECFDF5', icon: '📄', cat: 'trigger' },
  trigger_payment:    { label: 'Payment Received', color: '#059669', bg: '#ECFDF5', icon: '💳', cat: 'trigger' },
  trigger_approval:   { label: 'Approval Request', color: '#D97706', bg: '#FFFBEB', icon: '✅', cat: 'trigger' },
  trigger_employee:   { label: 'New Employee',     color: '#059669', bg: '#ECFDF5', icon: '👤', cat: 'trigger' },
  // Actions
  action_email:       { label: 'Send Email',       color: '#1B4FD8', bg: '#EEF3FD', icon: '✉️', cat: 'action' },
  action_whatsapp:    { label: 'WhatsApp Message', color: '#059669', bg: '#ECFDF5', icon: '📱', cat: 'action' },
  action_approve:     { label: 'Auto Approve',     color: '#059669', bg: '#ECFDF5', icon: '✅', cat: 'action' },
  action_create_po:   { label: 'Create PO',        color: '#1B4FD8', bg: '#EEF3FD', icon: '📋', cat: 'action' },
  action_journal:     { label: 'Journal Entry',    color: '#7C3AED', bg: '#F5F3FF', icon: '📒', cat: 'action' },
  action_payroll:     { label: 'Run Payroll',      color: '#D97706', bg: '#FFFBEB', icon: '💰', cat: 'action' },
  action_notify:      { label: 'Notification',     color: '#1B4FD8', bg: '#EEF3FD', icon: '🔔', cat: 'action' },
  action_update_crm:  { label: 'Update CRM',       color: '#059669', bg: '#ECFDF5', icon: '🎯', cat: 'action' },
  action_gst_file:    { label: 'File GST Return',  color: '#DC2626', bg: '#FEF2F2', icon: '🧾', cat: 'action' },
  // Logic
  logic_if:           { label: 'If / Condition',   color: '#D97706', bg: '#FFFBEB', icon: '❓', cat: 'logic' },
  logic_wait:         { label: 'Wait / Delay',     color: '#64748B', bg: '#F8FAFC', icon: '⏳', cat: 'logic' },
  logic_loop:         { label: 'For Each',         color: '#7C3AED', bg: '#F5F3FF', icon: '🔁', cat: 'logic' },
  logic_split:        { label: 'Split / Branch',   color: '#D97706', bg: '#FFFBEB', icon: '⑂',  cat: 'logic' },
  // AI
  ai_classify:        { label: 'AI Classify',      color: '#1B4FD8', bg: '#EEF3FD', icon: '🤖', cat: 'ai' },
  ai_extract:         { label: 'AI Extract Data',  color: '#1B4FD8', bg: '#EEF3FD', icon: '🔍', cat: 'ai' },
  ai_decision:        { label: 'AI Decision',      color: '#7C3AED', bg: '#F5F3FF', icon: '🧠', cat: 'ai' },
  ai_generate:        { label: 'AI Generate',      color: '#7C3AED', bg: '#F5F3FF', icon: '✨', cat: 'ai' },
  ai_summarize:       { label: 'AI Summarize',     color: '#1B4FD8', bg: '#EEF3FD', icon: '📝', cat: 'ai' },
  // Human
  human_approve:      { label: 'Human Approval',   color: '#DC2626', bg: '#FEF2F2', icon: '👤', cat: 'human' },
  human_review:       { label: 'Human Review',     color: '#D97706', bg: '#FFFBEB', icon: '👁', cat: 'human' },
  human_sign:         { label: 'E-Signature',      color: '#059669', bg: '#ECFDF5', icon: '✍️', cat: 'human' },
};

const CATEGORIES = {
  trigger: { label: 'Triggers',     color: '#059669' },
  action:  { label: 'Actions',      color: '#1B4FD8' },
  logic:   { label: 'Logic',        color: '#D97706' },
  ai:      { label: 'AI Nodes',     color: '#7C3AED' },
  human:   { label: 'Human Nodes',  color: '#DC2626' },
};

// ── Templates ─────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'invoice_approval',
    name: 'Invoice Approval Workflow',
    desc: 'Auto-approve invoices under Rs 10,000, escalate others',
    icon: '📄',
    nodes: [
      { id: 'n1', type: 'trigger_invoice',  x: 80,  y: 180, label: 'New Invoice', config: {} },
      { id: 'n2', type: 'logic_if',         x: 280, y: 180, label: 'Amount < 10K?', config: { condition: 'amount < 10000' } },
      { id: 'n3', type: 'action_approve',   x: 480, y: 80,  label: 'Auto Approve', config: {} },
      { id: 'n4', type: 'human_approve',    x: 480, y: 280, label: 'Manager Approval', config: {} },
      { id: 'n5', type: 'action_email',     x: 680, y: 180, label: 'Send Confirmation', config: {} },
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3', label: 'Yes' },
      { from: 'n2', to: 'n4', label: 'No' },
      { from: 'n3', to: 'n5' },
      { from: 'n4', to: 'n5' },
    ],
  },
  {
    id: 'gst_filing',
    name: 'Monthly GST Filing',
    desc: 'Auto-compile GST data and file returns on schedule',
    icon: '🧾',
    nodes: [
      { id: 'n1', type: 'trigger_schedule', x: 80,  y: 180, label: '20th of Month', config: { cron: '0 9 20 * *' } },
      { id: 'n2', type: 'ai_extract',       x: 280, y: 180, label: 'Extract GST Data', config: {} },
      { id: 'n3', type: 'human_review',     x: 480, y: 180, label: 'CA Review', config: {} },
      { id: 'n4', type: 'action_gst_file',  x: 680, y: 180, label: 'File GSTR-3B', config: {} },
      { id: 'n5', type: 'action_whatsapp',  x: 880, y: 180, label: 'Notify CFO', config: {} },
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
      { from: 'n3', to: 'n4' },
      { from: 'n4', to: 'n5' },
    ],
  },
  {
    id: 'payroll_run',
    name: 'Monthly Payroll Automation',
    desc: 'Run payroll, calculate TDS/PF and disburse salaries',
    icon: '💰',
    nodes: [
      { id: 'n1', type: 'trigger_schedule', x: 80,  y: 180, label: '25th of Month', config: {} },
      { id: 'n2', type: 'action_payroll',   x: 280, y: 180, label: 'Calculate Payroll', config: {} },
      { id: 'n3', type: 'ai_decision',      x: 480, y: 180, label: 'Validate Amounts', config: {} },
      { id: 'n4', type: 'human_approve',    x: 680, y: 180, label: 'CFO Approval', config: {} },
      { id: 'n5', type: 'action_journal',   x: 880, y: 180, label: 'Post to Ledger', config: {} },
      { id: 'n6', type: 'action_email',     x: 880, y: 320, label: 'Email Payslips', config: {} },
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
      { from: 'n3', to: 'n4' },
      { from: 'n4', to: 'n5' },
      { from: 'n4', to: 'n6' },
    ],
  },
  {
    id: 'vendor_onboarding',
    name: 'Vendor Onboarding',
    desc: 'Automate vendor verification and approval process',
    icon: '🏭',
    nodes: [
      { id: 'n1', type: 'trigger_webhook',  x: 80,  y: 180, label: 'Vendor Form Submit', config: {} },
      { id: 'n2', type: 'ai_classify',      x: 280, y: 180, label: 'Verify GSTIN', config: {} },
      { id: 'n3', type: 'logic_if',         x: 480, y: 180, label: 'Valid GSTIN?', config: {} },
      { id: 'n4', type: 'human_approve',    x: 680, y: 80,  label: 'Procurement Head', config: {} },
      { id: 'n5', type: 'action_email',     x: 680, y: 280, label: 'Reject Email', config: {} },
      { id: 'n6', type: 'action_update_crm',x: 880, y: 80,  label: 'Add to Vendor List', config: {} },
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
      { from: 'n3', to: 'n4', label: 'Valid' },
      { from: 'n3', to: 'n5', label: 'Invalid' },
      { from: 'n4', to: 'n6' },
    ],
  },
];

let nodeCounter = 100;

export default function WorkflowDesigner() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connecting, setConnecting] = useState(null);
  const [showPanel, setShowPanel] = useState('nodes'); // nodes | config | templates
  const [showSidebar, setShowSidebar] = useState(true);
  const [workflows, setWorkflows] = useState([]);
  const [currentName, setCurrentName] = useState('My Workflow');
  const [running, setRunning] = useState(false);
  const [runLog, setRunLog] = useState([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const svgRef = useRef(null);

  // ── Add node from palette ─────────────────────────────────
  const addNode = useCallback((type, x, y) => {
    const id = 'n' + (++nodeCounter);
    const def = NODE_TYPES[type];
    setNodes(prev => [...prev, {
      id, type,
      x: x || 200 + Math.random() * 300,
      y: y || 150 + Math.random() * 200,
      label: def.label,
      config: {},
    }]);
    setSelected(id);
    setShowPanel('config');
  }, []);

  // ── Delete selected ───────────────────────────────────────
  const deleteSelected = useCallback(() => {
    if (!selected) return;
    setNodes(prev => prev.filter(n => n.id !== selected));
    setEdges(prev => prev.filter(e => e.from !== selected && e.to !== selected));
    setSelected(null);
    setShowPanel('nodes');
  }, [selected]);

  // ── Key bindings ──────────────────────────────────────────
  useEffect(() => {
    const handler = e => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
          deleteSelected();
        }
      }
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [deleteSelected]);

  // ── Load template ─────────────────────────────────────────
  const loadTemplate = (tpl) => {
    setNodes(tpl.nodes.map(n => ({ ...n })));
    setEdges(tpl.edges.map((e, i) => ({ ...e, id: 'e' + i })));
    setCurrentName(tpl.name);
    setShowPanel('nodes');
    setSelected(null);
  };

  // ── Mouse handlers ────────────────────────────────────────
  const onNodeMouseDown = (e, id) => {
    e.stopPropagation();
    setSelected(id);
    setShowPanel('config');
    const node = nodes.find(n => n.id === id);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragging(id);
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const onCanvasMouseMove = (e) => {
    if (!dragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - dragOffset.x) / zoom - pan.x;
    const y = (e.clientY - rect.top - dragOffset.y) / zoom - pan.y;
    setNodes(prev => prev.map(n => n.id === dragging ? { ...n, x, y } : n));
  };

  const onCanvasMouseUp = () => { setDragging(null); };

  // ── Connect nodes ─────────────────────────────────────────
  const startConnect = (e, fromId) => {
    e.stopPropagation();
    setConnecting(fromId);
  };

  const finishConnect = (e, toId) => {
    e.stopPropagation();
    if (connecting && connecting !== toId) {
      const exists = edges.some(e => e.from === connecting && e.to === toId);
      if (!exists) {
        setEdges(prev => [...prev, { id: 'e' + Date.now(), from: connecting, to: toId }]);
      }
    }
    setConnecting(null);
  };

  // ── Update node config ────────────────────────────────────
  const updateNode = (id, updates) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  // ── AI Workflow Generator ─────────────────────────────────
  const generateWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await post('/api/cfo/brief', {
        prompt: `You are a workflow automation expert. Generate a JSON workflow for: "${aiPrompt}".
Return ONLY valid JSON in this exact format, no markdown:
{
  "name": "workflow name",
  "nodes": [
    {"id": "n1", "type": "trigger_schedule", "x": 80, "y": 180, "label": "node label", "config": {}},
    {"id": "n2", "type": "action_email", "x": 300, "y": 180, "label": "node label", "config": {}}
  ],
  "edges": [
    {"from": "n1", "to": "n2"}
  ]
}
Available node types: trigger_schedule, trigger_webhook, trigger_invoice, trigger_payment, trigger_approval,
action_email, action_whatsapp, action_approve, action_create_po, action_journal, action_notify, action_update_crm,
logic_if, logic_wait, logic_loop, ai_classify, ai_extract, ai_decision, ai_generate, ai_summarize,
human_approve, human_review.
Space nodes 220px apart horizontally, 180px vertically. Start x at 80, y at 180.`
      });
      const text = res.text || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const wf = JSON.parse(match[0]);
        setNodes(wf.nodes || []);
        setEdges((wf.edges || []).map((e, i) => ({ ...e, id: 'e' + i })));
        setCurrentName(wf.name || aiPrompt);
        setAiPrompt('');
      }
    } catch (err) {
      console.error('AI gen error', err);
    }
    setAiLoading(false);
  };

  // ── Run workflow (simulate) ───────────────────────────────
  const runWorkflow = async () => {
    setRunning(true);
    setRunLog([]);
    const log = [];
    for (const node of nodes) {
      const def = NODE_TYPES[node.type] || {};
      await new Promise(r => setTimeout(r, 600));
      log.push({ time: new Date().toLocaleTimeString('en-IN'), node: node.label, status: 'success', msg: `Executed: ${node.label}` });
      setRunLog([...log]);
    }
    setRunning(false);
  };

  // ── Canvas drop ───────────────────────────────────────────
  const onCanvasDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('nodeType');
    if (!type) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - pan.x;
    const y = (e.clientY - rect.top) / zoom - pan.y;
    addNode(type, x, y);
  };

  // ── Compute edge paths ────────────────────────────────────
  const getNodeCenter = (id) => {
    const n = nodes.find(n => n.id === id);
    if (!n) return { x: 0, y: 0 };
    return { x: n.x + 90, y: n.y + 28 };
  };

  const selectedNode = nodes.find(n => n.id === selected);
  const selectedDef = selectedNode ? NODE_TYPES[selectedNode.type] : null;

  const sidebarW = showSidebar ? 240 : 0;

  return (
    <div style={{ display: 'flex', height: '100%', background: '#F0F5FF', overflow: 'hidden' }}>
      {/* ── Left Sidebar ──────────────────────────────────── */}
      {showSidebar && (
        <div style={{ width: 240, flexShrink: 0, background: '#fff', borderRight: '1px solid #C7D9F8', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Sidebar tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0' }}>
            {[['nodes','Nodes'],['templates','Templates'],['runs','History']].map(([id,label]) => (
              <button key={id} onClick={() => setShowPanel(id)} style={{ flex: 1, padding: '10px 4px', fontSize: 11, fontWeight: 600, background: 'none', border: 'none', borderBottom: showPanel === id ? '2px solid #1B4FD8' : '2px solid transparent', color: showPanel === id ? '#1B4FD8' : '#64748B', cursor: 'pointer' }}>{label}</button>
            ))}
          </div>

          {/* Node palette */}
          {showPanel === 'nodes' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
              {/* AI Generator */}
              <div style={{ padding: 10, borderRadius: 8, background: '#EEF3FD', border: '1px solid #C7D9F8', marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#1B4FD8', marginBottom: 6 }}>🤖 AI Generator</div>
                <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Describe your workflow..." style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', borderRadius: 6, border: '1px solid #C7D9F8', fontSize: 11, resize: 'none', height: 60, outline: 'none', fontFamily: 'inherit' }} />
                <button onClick={generateWithAI} disabled={aiLoading || !aiPrompt.trim()} style={{ width: '100%', marginTop: 6, padding: '6px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: aiLoading ? '#F1F5F9' : '#1B4FD8', color: aiLoading ? '#94A3B8' : '#fff', border: 'none', cursor: aiLoading ? 'not-allowed' : 'pointer' }}>
                  {aiLoading ? 'Generating...' : '✨ Generate Workflow'}
                </button>
              </div>

              {Object.entries(CATEGORIES).map(([cat, catDef]) => (
                <div key={cat} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: catDef.color, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, padding: '0 2px' }}>{catDef.label}</div>
                  {Object.entries(NODE_TYPES).filter(([, def]) => def.cat === cat).map(([type, def]) => (
                    <div key={type}
                      draggable
                      onDragStart={e => e.dataTransfer.setData('nodeType', type)}
                      onClick={() => addNode(type)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, marginBottom: 3, background: def.bg, border: `1px solid ${def.color}30`, cursor: 'grab', transition: 'box-shadow 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                    >
                      <span style={{ fontSize: 14 }}>{def.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: def.color }}>{def.label}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Templates */}
          {showPanel === 'templates' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
              <div style={{ fontSize: 11, color: '#64748B', marginBottom: 10 }}>Click a template to load it on the canvas</div>
              {TEMPLATES.map(tpl => (
                <div key={tpl.id} onClick={() => loadTemplate(tpl)} style={{ padding: '12px', borderRadius: 8, border: '1px solid #C7D9F8', marginBottom: 8, cursor: 'pointer', background: '#FAFBFF', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#EEF3FD'; e.currentTarget.style.borderColor = '#1B4FD8'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FAFBFF'; e.currentTarget.style.borderColor = '#C7D9F8'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 20 }}>{tpl.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0A1628' }}>{tpl.name}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>{tpl.desc}</div>
                  <div style={{ marginTop: 6, fontSize: 10, color: '#94A3B8' }}>{tpl.nodes.length} nodes · {tpl.edges.length} connections</div>
                </div>
              ))}
            </div>
          )}

          {/* Run history */}
          {showPanel === 'runs' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
              {runLog.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: '#94A3B8', fontSize: 12 }}>No runs yet. Click Run to execute.</div>
              ) : runLog.map((log, i) => (
                <div key={i} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #E2E8F0', marginBottom: 6, background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#0A1628' }}>{log.node}</span>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: '#ECFDF5', color: '#059669', fontWeight: 700 }}>✓ {log.status}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#94A3B8' }}>{log.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Main Canvas Area ──────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ height: 50, background: '#fff', borderBottom: '1px solid #C7D9F8', display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', flexShrink: 0 }}>
          <button onClick={() => setShowSidebar(!showSidebar)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 12, cursor: 'pointer', color: '#334155' }}>
            {showSidebar ? '◀ Hide' : '▶ Show'} Palette
          </button>
          <input value={currentName} onChange={e => setCurrentName(e.target.value)} style={{ flex: 1, maxWidth: 280, padding: '5px 10px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 13, fontWeight: 600, outline: 'none', color: '#0A1628' }} />
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#94A3B8' }}>{nodes.length} nodes · {edges.length} edges</span>
            <button onClick={() => { setNodes([]); setEdges([]); setSelected(null); }} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#FEF2F2', fontSize: 12, color: '#DC2626', cursor: 'pointer', fontWeight: 600 }}>Clear</button>
            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', fontSize: 14 }}>-</button>
            <span style={{ fontSize: 11, color: '#64748B', width: 36, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', fontSize: 14 }}>+</button>
            <button onClick={runWorkflow} disabled={running || nodes.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 7, border: 'none', background: running ? '#F1F5F9' : '#059669', color: running ? '#94A3B8' : '#fff', fontSize: 12, fontWeight: 700, cursor: running ? 'not-allowed' : 'pointer' }}>
              {running ? '⏳ Running...' : '▶ Run Workflow'}
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 7, border: 'none', background: '#1B4FD8', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              💾 Save
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
          ref={canvasRef}
          onMouseMove={onCanvasMouseMove}
          onMouseUp={onCanvasMouseUp}
          onDragOver={e => e.preventDefault()}
          onDrop={onCanvasDrop}
          onClick={() => { setSelected(null); setShowPanel('nodes'); setConnecting(null); }}
          style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#F0F5FF', cursor: dragging ? 'grabbing' : 'default' }}
        >
          {/* Grid dots */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <defs>
              <pattern id="grid" width={20 * zoom} height={20 * zoom} patternUnits="userSpaceOnUse" x={(pan.x * zoom) % (20 * zoom)} y={(pan.y * zoom) % (20 * zoom)}>
                <circle cx={20 * zoom / 2} cy={20 * zoom / 2} r={1} fill="#C7D9F8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Transform container */}
          <div style={{ position: 'absolute', inset: 0, transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`, transformOrigin: '0 0' }}>
            {/* Edges SVG */}
            <svg style={{ position: 'absolute', inset: 0, width: 9999, height: 9999, pointerEvents: 'none', overflow: 'visible' }} ref={svgRef}>
              <defs>
                <marker id="arrow" markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#1B4FD8" />
                </marker>
              </defs>
              {edges.map(edge => {
                const from = getNodeCenter(edge.from);
                const to = getNodeCenter(edge.to);
                if (!from || !to) return null;
                const dx = to.x - from.x;
                const cp1x = from.x + dx * 0.5;
                const cp2x = to.x - dx * 0.5;
                const path = `M ${from.x} ${from.y} C ${cp1x} ${from.y} ${cp2x} ${to.y} ${to.x} ${to.y}`;
                const midX = (from.x + to.x) / 2;
                const midY = (from.y + to.y) / 2;
                return (
                  <g key={edge.id}>
                    <path d={path} fill="none" stroke="#1B4FD8" strokeWidth={2} strokeOpacity={0.6} markerEnd="url(#arrow)" />
                    {edge.label && (
                      <g>
                        <rect x={midX - 20} y={midY - 9} width={40} height={18} rx={4} fill="#fff" stroke="#C7D9F8" />
                        <text x={midX} y={midY + 4} textAnchor="middle" fontSize={9} fill="#1B4FD8" fontWeight={700}>{edge.label}</text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {nodes.map(node => {
              const def = NODE_TYPES[node.type] || { color: '#64748B', bg: '#F8FAFC', icon: '⬡', cat: 'action' };
              const isSelected = selected === node.id;
              const isConnecting = connecting === node.id;
              return (
                <div key={node.id}
                  style={{
                    position: 'absolute', left: node.x, top: node.y,
                    width: 180, cursor: dragging === node.id ? 'grabbing' : 'grab',
                    userSelect: 'none', zIndex: isSelected ? 10 : 5,
                  }}
                  onMouseDown={e => onNodeMouseDown(e, node.id)}
                >
                  <div style={{
                    borderRadius: 10,
                    border: isSelected ? `2px solid ${def.color}` : `1px solid ${def.color}40`,
                    background: def.bg,
                    boxShadow: isSelected ? `0 4px 16px ${def.color}30` : '0 1px 4px rgba(0,0,0,0.06)',
                    transition: 'box-shadow 0.15s',
                    overflow: 'visible',
                  }}>
                    {/* Node header */}
                    <div style={{ padding: '8px 10px', borderBottom: `1px solid ${def.color}20`, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{def.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: def.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{CATEGORIES[def.cat]?.label}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#0A1628', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.label}</div>
                      </div>
                    </div>
                    {/* Node body */}
                    <div style={{ padding: '6px 10px', fontSize: 11, color: '#64748B', minHeight: 20 }}>
                      {node.config.condition && <div>if: {node.config.condition}</div>}
                      {node.config.cron && <div>cron: {node.config.cron}</div>}
                      {!node.config.condition && !node.config.cron && <div style={{ color: '#CBD5E1' }}>Click to configure</div>}
                    </div>
                  </div>

                  {/* Output port */}
                  <div
                    onMouseDown={e => startConnect(e, node.id)}
                    onMouseUp={e => finishConnect(e, node.id)}
                    style={{
                      position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)',
                      width: 16, height: 16, borderRadius: '50%',
                      background: connecting === node.id ? def.color : '#fff',
                      border: `2px solid ${def.color}`,
                      cursor: 'crosshair', zIndex: 20,
                    }}
                  />
                  {/* Input port */}
                  <div
                    onMouseUp={e => finishConnect(e, node.id)}
                    style={{
                      position: 'absolute', left: -8, top: '50%', transform: 'translateY(-50%)',
                      width: 16, height: 16, borderRadius: '50%',
                      background: '#fff', border: '2px solid #93B4EF',
                      cursor: 'crosshair', zIndex: 20,
                    }}
                  />
                </div>
              );
            })}

            {/* Empty state */}
            {nodes.length === 0 && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>⚡</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Drag nodes to build your workflow</div>
                <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>Or load a template from the sidebar</div>
                <div style={{ fontSize: 12, color: '#94A3B8' }}>Tip: Use AI Generator to build from a description</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right Config Panel ────────────────────────────── */}
      {selected && selectedNode && selectedDef && (
        <div style={{ width: 260, flexShrink: 0, background: '#fff', borderLeft: '1px solid #C7D9F8', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>Configure Node</div>
              <div style={{ fontSize: 11, color: selectedDef.color }}>{selectedDef.icon} {selectedDef.label}</div>
            </div>
            <button onClick={deleteSelected} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
            {/* Label */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Node Label</label>
              <input value={selectedNode.label} onChange={e => updateNode(selected, { label: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: 7, border: '1px solid #C7D9F8', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
            </div>

            {/* Type-specific config */}
            {selectedNode.type.startsWith('trigger_schedule') && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Cron Expression</label>
                <input value={selectedNode.config.cron || ''} onChange={e => updateNode(selected, { config: { ...selectedNode.config, cron: e.target.value } })} placeholder="0 9 20 * *" style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: 7, border: '1px solid #C7D9F8', fontSize: 12, outline: 'none', fontFamily: 'monospace' }} />
                <div style={{ marginTop: 6 }}>
                  {[['Every day 9AM', '0 9 * * *'], ['1st of month', '0 9 1 * *'], ['20th (GST)', '0 9 20 * *'], ['25th (Payroll)', '0 9 25 * *']].map(([label, val]) => (
                    <button key={val} onClick={() => updateNode(selected, { config: { ...selectedNode.config, cron: val } })} style={{ margin: '0 4px 4px 0', padding: '3px 8px', borderRadius: 4, border: '1px solid #C7D9F8', background: '#F0F5FF', fontSize: 10, cursor: 'pointer', color: '#1B4FD8' }}>{label}</button>
                  ))}
                </div>
              </div>
            )}

            {selectedNode.type === 'logic_if' && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Condition</label>
                <input value={selectedNode.config.condition || ''} onChange={e => updateNode(selected, { config: { ...selectedNode.config, condition: e.target.value } })} placeholder="amount < 10000" style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: 7, border: '1px solid #C7D9F8', fontSize: 12, outline: 'none', fontFamily: 'monospace' }} />
              </div>
            )}

            {selectedNode.type === 'action_email' && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>To</label>
                  <input value={selectedNode.config.to || ''} onChange={e => updateNode(selected, { config: { ...selectedNode.config, to: e.target.value } })} placeholder="{{trigger.email}} or fixed@email.com" style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: 7, border: '1px solid #C7D9F8', fontSize: 12, outline: 'none' }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Subject</label>
                  <input value={selectedNode.config.subject || ''} onChange={e => updateNode(selected, { config: { ...selectedNode.config, subject: e.target.value } })} placeholder="Invoice {{id}} approved" style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: 7, border: '1px solid #C7D9F8', fontSize: 12, outline: 'none' }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Body</label>
                  <textarea value={selectedNode.config.body || ''} onChange={e => updateNode(selected, { config: { ...selectedNode.config, body: e.target.value } })} placeholder="Dear {{name}}, your request..." style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: 7, border: '1px solid #C7D9F8', fontSize: 12, outline: 'none', resize: 'vertical', height: 80, fontFamily: 'inherit' }} />
                </div>
              </>
            )}

            {selectedNode.type === 'action_whatsapp' && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Message</label>
                <textarea value={selectedNode.config.message || ''} onChange={e => updateNode(selected, { config: { ...selectedNode.config, message: e.target.value } })} placeholder="Invoice {{id}} requires your approval." style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: 7, border: '1px solid #C7D9F8', fontSize: 12, outline: 'none', resize: 'vertical', height: 80, fontFamily: 'inherit' }} />
              </div>
            )}

            {selectedNode.type.startsWith('ai_') && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>AI Instruction</label>
                <textarea value={selectedNode.config.instruction || ''} onChange={e => updateNode(selected, { config: { ...selectedNode.config, instruction: e.target.value } })} placeholder="Extract vendor name, amount, and GST from this invoice..." style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: 7, border: '1px solid #C7D9F8', fontSize: 12, outline: 'none', resize: 'vertical', height: 80, fontFamily: 'inherit' }} />
              </div>
            )}

            {selectedNode.type === 'human_approve' && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Assign To</label>
                <select value={selectedNode.config.assignee || ''} onChange={e => updateNode(selected, { config: { ...selectedNode.config, assignee: e.target.value } })} style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #C7D9F8', fontSize: 12, outline: 'none', background: '#fff' }}>
                  <option value="">Select approver...</option>
                  <option>CFO</option>
                  <option>Finance Manager</option>
                  <option>Procurement Head</option>
                  <option>HR Manager</option>
                  <option>MD / CEO</option>
                </select>
                <div style={{ marginTop: 8 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Timeout (hours)</label>
                  <input type="number" value={selectedNode.config.timeout || 24} onChange={e => updateNode(selected, { config: { ...selectedNode.config, timeout: e.target.value } })} style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: 7, border: '1px solid #C7D9F8', fontSize: 12, outline: 'none' }} />
                </div>
              </div>
            )}

            {selectedNode.type === 'logic_wait' && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Wait Duration</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" value={selectedNode.config.duration || 1} onChange={e => updateNode(selected, { config: { ...selectedNode.config, duration: e.target.value } })} style={{ flex: 1, padding: '7px 10px', borderRadius: 7, border: '1px solid #C7D9F8', fontSize: 12, outline: 'none' }} />
                  <select value={selectedNode.config.unit || 'hours'} onChange={e => updateNode(selected, { config: { ...selectedNode.config, unit: e.target.value } })} style={{ flex: 1, padding: '7px 10px', borderRadius: 7, border: '1px solid #C7D9F8', fontSize: 12, outline: 'none', background: '#fff' }}>
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              </div>
            )}

            {/* Connections info */}
            <div style={{ marginTop: 16, padding: '10px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Connections</div>
              {edges.filter(e => e.from === selected || e.to === selected).length === 0 ? (
                <div style={{ fontSize: 11, color: '#94A3B8' }}>Drag from the right port to connect</div>
              ) : edges.filter(e => e.from === selected || e.to === selected).map((edge, i) => {
                const otherNode = nodes.find(n => n.id === (edge.from === selected ? edge.to : edge.from));
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ color: '#475569' }}>{edge.from === selected ? '→ to' : '← from'} {otherNode?.label}</span>
                    <button onClick={() => setEdges(prev => prev.filter(e => e.id !== edge.id))} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: 11, padding: 0 }}>×</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
