import { useState, useEffect, useRef, useCallback } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get = async url => { try { const r = await fetch(apiURL(url), { headers: h() }); const t = await r.text(); return JSON.parse(t); } catch { return {}; } };
const post = async (url, body) => { try { const r = await fetch(apiURL(url), { method: 'POST', headers: h(), body: JSON.stringify(body) }); const t = await r.text(); return JSON.parse(t); } catch { return {}; } };

// ── Node type definitions ─────────────────────────────────────
const NODE_DEFS = {
  vendor:     { color: '#1B4FD8', bg: '#EEF3FD', icon: '🏭', label: 'Vendor' },
  customer:   { color: '#059669', bg: '#ECFDF5', icon: '🏢', label: 'Customer' },
  employee:   { color: '#7C3AED', bg: '#F5F3FF', icon: '👤', label: 'Employee' },
  project:    { color: '#D97706', bg: '#FFFBEB', icon: '📋', label: 'Project' },
  invoice:    { color: '#0284C7', bg: '#F0F9FF', icon: '📄', label: 'Invoice' },
  payment:    { color: '#059669', bg: '#ECFDF5', icon: '💳', label: 'Payment' },
  compliance: { color: '#DC2626', bg: '#FEF2F2', icon: '⚖️', label: 'Compliance' },
  lead:       { color: '#D97706', bg: '#FFFBEB', icon: '🎯', label: 'Lead' },
  document:   { color: '#64748B', bg: '#F8FAFC', icon: '📁', label: 'Document' },
  decision:   { color: '#7C3AED', bg: '#F5F3FF', icon: '🧠', label: 'Decision' },
};

// ── Build graph from real data ────────────────────────────────
function buildGraph(vendors, customers, employees, projects, arInvoices, crm) {
  const nodes = [];
  const edges = [];
  let nodeMap = {};

  const addNode = (id, type, label, meta = {}) => {
    const def = NODE_DEFS[type] || NODE_DEFS.document;
    nodes.push({ id, type, label, meta, color: def.color, bg: def.bg, icon: def.icon });
    nodeMap[id] = nodes.length - 1;
  };

  const addEdge = (from, to, label) => {
    if (nodeMap[from] !== undefined && nodeMap[to] !== undefined) {
      edges.push({ from, to, label });
    }
  };

  // Add vendors
  (vendors || []).slice(0, 8).forEach(v => {
    addNode('vendor_' + v.id, 'vendor', v.name, { city: v.city, gstin: v.gstin });
  });

  // Add customers
  (customers || []).slice(0, 6).forEach(c => {
    addNode('cust_' + c.id, 'customer', c.name, { city: c.city, credit_limit: c.credit_limit });
  });

  // Add employees (key ones)
  (employees || []).slice(0, 6).forEach(e => {
    addNode('emp_' + e.id, 'employee', `${e.first_name} ${e.last_name}`, { dept: e.department, designation: e.designation });
  });

  // Add projects and connect to customers
  (projects || []).slice(0, 5).forEach(p => {
    addNode('proj_' + p.id, 'project', p.name, { status: p.status, budget: p.budget });
    // Try to connect project to matching customer
    const cust = (customers || []).find(c => c.name.includes(p.client_name?.split(' ')[0] || 'X'));
    if (cust) addEdge('cust_' + cust.id, 'proj_' + p.id, 'has project');
  });

  // Add AR invoices and connect to customers
  (arInvoices || []).slice(0, 6).forEach(inv => {
    addNode('inv_' + inv.id, 'invoice', inv.invoice_number, { amount: inv.total_amount, status: inv.status });
    if (inv.customer_id) addEdge('cust_' + inv.customer_id, 'inv_' + inv.id, 'received invoice');
  });

  // Add CRM leads
  (crm || []).slice(0, 5).forEach(l => {
    addNode('lead_' + l.id, 'lead', l.company, { value: l.value, stage: l.stage, contact: l.name });
  });

  // Add some decisions/compliance
  addNode('comp_gst', 'compliance', 'GSTR-3B Aug', { due: '20 Sep', status: 'pending' });
  addNode('comp_tds', 'compliance', 'TDS Payment', { due: '7 Sep', status: 'urgent' });
  addNode('dec_payroll', 'decision', 'July Payroll Approved', { amount: '10.5L', by: 'CFO' });
  addNode('dec_po', 'decision', 'AWS PO Approved', { amount: '3.5L', by: 'Owner' });

  // Connect employees to projects
  (employees || []).slice(0, 3).forEach((e, i) => {
    const proj = projects?.[i % (projects?.length || 1)];
    if (proj) addEdge('emp_' + e.id, 'proj_' + proj.id, 'works on');
  });

  // Connect decisions to employees
  if (employees?.[0]) addEdge('emp_' + employees[0].id, 'dec_payroll', 'approved by');
  if (employees?.[3]) addEdge('emp_' + employees[3].id, 'comp_gst', 'responsible');

  // Spread nodes in a force-directed-ish layout
  const COLS = 6;
  nodes.forEach((n, i) => {
    const angle = (i / nodes.length) * 2 * Math.PI;
    const radius = 200 + (i % 3) * 80;
    n.x = 450 + Math.cos(angle) * radius;
    n.y = 350 + Math.sin(angle) * radius;
  });

  return { nodes, edges };
}

export default function KnowledgeGraph() {
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [aiQuery, setAiQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    Promise.all([
      get('/api/accounting/vendors'),
      get('/api/accounting/customers'),
      get('/api/payroll/employees'),
      get('/api/projects'),
      get('/api/accounting/ar'),
      get('/api/crm/leads'),
    ]).then(([vendors, customers, employees, projects, ar, crm]) => {
      const g = buildGraph(
        vendors?.vendors || vendors?.data || [],
        customers?.customers || [],
        employees?.employees || [],
        projects?.projects || [],
        ar?.invoices || [],
        crm?.leads || []
      );
      setGraph(g);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // ── AI Query ──────────────────────────────────────────────
  const askAI = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiAnswer('');
    const res = await post('/api/cfo/brief', {
      prompt: `You are analyzing an enterprise knowledge graph for an Indian tech company called Deemona Technologies.
The graph contains: 10 vendors (AWS, Microsoft, TCS etc.), 8 customers (Flipkart, Paytm, OYO etc.),
11 employees across Engineering/Finance/Sales/HR/Marketing, 8 projects worth Rs 1.85Cr,
9 CRM leads worth Rs 1.65Cr pipeline, 9 compliance items, 10 AR invoices Rs 55L, 10 AP invoices Rs 23L.

User question: "${aiQuery}"

Answer in 3-4 sentences. Be specific with numbers from the data above. Plain text only.`
    });
    setAiAnswer(res.text || 'Unable to find relevant connections in the knowledge graph.');
    setAiLoading(false);
  };

  // ── Filter nodes ──────────────────────────────────────────
  const visibleNodes = graph.nodes.filter(n => {
    if (filter !== 'all' && n.type !== filter) return false;
    if (search && !n.label.toLowerCase().includes(search.toLowerCase()) && !n.meta?.contact?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const visibleIds = new Set(visibleNodes.map(n => n.id));
  const visibleEdges = graph.edges.filter(e => visibleIds.has(e.from) && visibleIds.has(e.to));

  // ── Node interactions ─────────────────────────────────────
  const onNodeMouseDown = (e, node) => {
    e.stopPropagation();
    setSelected(node.id);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragging(node.id);
    setDragOffset({ x: e.clientX - rect.left - 60, y: e.clientY - rect.top - 20 });
  };

  const onMouseMove = (e) => {
    if (dragging) {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom - pan.x - dragOffset.x;
      const y = (e.clientY - rect.top) / zoom - pan.y - dragOffset.y;
      setGraph(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => n.id === dragging ? { ...n, x, y } : n),
      }));
    } else if (isPanning) {
      setPan(prev => ({
        x: prev.x + (e.clientX - panStart.x) / zoom,
        y: prev.y + (e.clientY - panStart.y) / zoom,
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const onCanvasMouseDown = (e) => {
    if (e.target === containerRef.current || e.target.tagName === 'svg' || e.target.tagName === 'rect') {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setSelected(null);
    }
  };

  const onMouseUp = () => { setDragging(null); setIsPanning(false); };

  const onWheel = (e) => {
    e.preventDefault();
    setZoom(z => Math.max(0.3, Math.min(2, z - e.deltaY * 0.001)));
  };

  const selectedNode = graph.nodes.find(n => n.id === selected);
  const connectedEdges = selected ? graph.edges.filter(e => e.from === selected || e.to === selected) : [];
  const connectedNodes = connectedEdges.map(e => e.from === selected ? e.to : e.from);

  const getNode = id => graph.nodes.find(n => n.id === id);
  const INR = n => {
    const v = parseFloat(n || 0);
    if (v >= 1e7) return 'Rs ' + (v / 1e7).toFixed(2) + ' Cr';
    if (v >= 1e5) return 'Rs ' + (v / 1e5).toFixed(2) + ' L';
    return 'Rs ' + v.toLocaleString('en-IN');
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748B', fontSize: 13 }}>Building knowledge graph...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#EEF3FD', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #C7D9F8', padding: '10px 20px', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0A1628', marginRight: 8 }}>🕸 Knowledge Graph</div>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#F0F5FF', border: '1px solid #C7D9F8', borderRadius: 7, width: 200 }}>
          <span style={{ fontSize: 12 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search entities..." style={{ border: 'none', outline: 'none', background: 'none', fontSize: 12, width: '100%', fontFamily: 'inherit', color: '#0A1628' }} />
        </div>
        {/* Filter */}
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid #C7D9F8', fontSize: 12, outline: 'none', background: '#fff', color: '#0A1628' }}>
          <option value="all">All Types</option>
          {Object.entries(NODE_DEFS).map(([type, def]) => (
            <option key={type} value={type}>{def.icon} {def.label}</option>
          ))}
        </select>
        {/* Zoom */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginLeft: 'auto' }}>
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} style={{ width: 26, height: 26, borderRadius: 5, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer' }}>-</button>
          <span style={{ fontSize: 11, color: '#64748B', width: 36, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} style={{ width: 26, height: 26, borderRadius: 5, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer' }}>+</button>
          <button onClick={() => { setZoom(0.85); setPan({ x: 0, y: 0 }); }} style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 11, cursor: 'pointer', color: '#64748B' }}>Reset</button>
        </div>
        {/* Stats */}
        <div style={{ fontSize: 11, color: '#94A3B8', marginLeft: 8 }}>{visibleNodes.length} nodes · {visibleEdges.length} edges</div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Graph canvas */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: isPanning ? 'grabbing' : dragging ? 'grabbing' : 'default' }}
          ref={containerRef}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseDown={onCanvasMouseDown}
          onWheel={onWheel}
        >
          {/* Legend */}
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, background: 'rgba(255,255,255,0.95)', borderRadius: 10, border: '1px solid #C7D9F8', padding: '10px 14px', display: 'flex', gap: 12, flexWrap: 'wrap', maxWidth: 440 }}>
            {Object.entries(NODE_DEFS).slice(0, 8).map(([type, def]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }} onClick={() => setFilter(filter === type ? 'all' : type)}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: def.color, opacity: filter === type || filter === 'all' ? 1 : 0.3 }} />
                <span style={{ fontSize: 10, color: filter === type ? def.color : '#64748B', fontWeight: filter === type ? 700 : 400 }}>{def.label}</span>
              </div>
            ))}
          </div>

          {/* SVG Graph */}
          <svg
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            onMouseDown={e => { if (e.target.tagName === 'svg' || e.target.tagName === 'rect') { setIsPanning(true); setPanStart({ x: e.clientX, y: e.clientY }); setSelected(null); } }}
          >
            <defs>
              <marker id="arrowhead" markerWidth={6} markerHeight={4} refX={6} refY={2} orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="#93B4EF" />
              </marker>
              <pattern id="bg-dots" width={30} height={30} patternUnits="userSpaceOnUse">
                <circle cx={15} cy={15} r={1.2} fill="#C7D9F8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#bg-dots)" />

            <g transform={`scale(${zoom}) translate(${pan.x} ${pan.y})`}>
              {/* Edges */}
              {visibleEdges.map((edge, i) => {
                const from = visibleNodes.find(n => n.id === edge.from);
                const to = visibleNodes.find(n => n.id === edge.to);
                if (!from || !to) return null;
                const isHighlighted = selected && (edge.from === selected || edge.to === selected);
                const midX = (from.x + to.x) / 2;
                const midY = (from.y + to.y) / 2;
                return (
                  <g key={i}>
                    <line
                      x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      stroke={isHighlighted ? '#1B4FD8' : '#C7D9F8'}
                      strokeWidth={isHighlighted ? 2 : 1}
                      strokeOpacity={isHighlighted ? 1 : 0.6}
                      markerEnd="url(#arrowhead)"
                    />
                    {edge.label && (
                      <text x={midX} y={midY - 4} textAnchor="middle" fontSize={9} fill={isHighlighted ? '#1B4FD8' : '#94A3B8'} fontWeight={isHighlighted ? 700 : 400}>{edge.label}</text>
                    )}
                  </g>
                );
              })}

              {/* Nodes */}
              {visibleNodes.map(node => {
                const isSelected = selected === node.id;
                const isConnected = connectedNodes.includes(node.id);
                const isDimmed = selected && !isSelected && !isConnected;
                return (
                  <g key={node.id} transform={`translate(${node.x - 60}, ${node.y - 22})`}
                    onMouseDown={e => onNodeMouseDown(e, node)}
                    style={{ cursor: 'grab', opacity: isDimmed ? 0.25 : 1, transition: 'opacity 0.2s' }}>
                    <rect width={120} height={44} rx={8}
                      fill={node.bg}
                      stroke={isSelected ? node.color : isConnected ? node.color + '80' : node.color + '40'}
                      strokeWidth={isSelected ? 2 : 1}
                      filter={isSelected ? 'drop-shadow(0 3px 8px rgba(0,0,0,0.12))' : 'none'}
                    />
                    <text x={14} y={17} fontSize={16}>{node.icon}</text>
                    <text x={34} y={15} fontSize={10} fill={node.color} fontWeight={700}>{NODE_DEFS[node.type]?.label?.toUpperCase()}</text>
                    <text x={34} y={29} fontSize={11} fill="#0A1628" fontWeight={600}>
                      {node.label.length > 14 ? node.label.substring(0, 14) + '…' : node.label}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Right panel */}
        <div style={{ width: 300, flexShrink: 0, background: '#fff', borderLeft: '1px solid #C7D9F8', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* AI Query */}
          <div style={{ padding: 14, borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0A1628', marginBottom: 8 }}>🧠 Ask the Knowledge Graph</div>
            <textarea value={aiQuery} onChange={e => setAiQuery(e.target.value)} placeholder="Who manages the Flipkart project? Which vendors have pending invoices? What's the GST liability this month?" style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 7, border: '1px solid #C7D9F8', fontSize: 12, resize: 'none', height: 70, outline: 'none', fontFamily: 'inherit', color: '#0A1628' }} />
            <button onClick={askAI} disabled={aiLoading || !aiQuery.trim()} style={{ width: '100%', marginTop: 6, padding: '7px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: aiLoading ? '#F1F5F9' : '#1B4FD8', color: aiLoading ? '#94A3B8' : '#fff', border: 'none', cursor: aiLoading ? 'not-allowed' : 'pointer' }}>
              {aiLoading ? 'Searching...' : '🔍 Search Graph'}
            </button>
            {aiAnswer && (
              <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, background: '#F0F5FF', border: '1px solid #C7D9F8', fontSize: 12, color: '#1E3A5F', lineHeight: 1.6 }}>
                {aiAnswer}
              </div>
            )}
          </div>

          {/* Selected node details */}
          {selectedNode ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: selectedNode.bg, border: `2px solid ${selectedNode.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{selectedNode.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0A1628' }}>{selectedNode.label}</div>
                  <div style={{ fontSize: 11, color: selectedNode.color, fontWeight: 600 }}>{NODE_DEFS[selectedNode.type]?.label}</div>
                </div>
              </div>

              {/* Metadata */}
              {Object.entries(selectedNode.meta || {}).map(([k, v]) => v && (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F1F5F9', fontSize: 12 }}>
                  <span style={{ color: '#64748B', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
                  <span style={{ color: '#0A1628', fontWeight: 600 }}>{typeof v === 'number' && v > 999 ? 'Rs ' + v.toLocaleString('en-IN') : String(v)}</span>
                </div>
              ))}

              {/* Connections */}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Connections ({connectedEdges.length})</div>
                {connectedEdges.map((edge, i) => {
                  const otherId = edge.from === selected ? edge.to : edge.from;
                  const other = getNode(otherId);
                  const dir = edge.from === selected ? '→' : '←';
                  if (!other) return null;
                  return (
                    <div key={i} onClick={() => setSelected(otherId)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 7, marginBottom: 4, background: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer', transition: 'all 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#EEF3FD'}
                      onMouseLeave={e => e.currentTarget.style.background = '#F8FAFC'}>
                      <span style={{ fontSize: 12 }}>{dir}</span>
                      <span style={{ fontSize: 14 }}>{other.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#0A1628', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{other.label}</div>
                        <div style={{ fontSize: 10, color: '#94A3B8' }}>{edge.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, color: '#94A3B8', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>🕸</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>Click any node to explore</div>
              <div style={{ fontSize: 12 }}>See connections, metadata, and relationships between entities</div>
              <div style={{ marginTop: 20, width: '100%' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 8, textAlign: 'left' }}>Graph Summary</div>
                {Object.entries(NODE_DEFS).map(([type, def]) => {
                  const count = graph.nodes.filter(n => n.type === type).length;
                  if (!count) return null;
                  return (
                    <div key={type} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                      <span style={{ color: '#334155' }}>{def.icon} {def.label}s</span>
                      <span style={{ fontWeight: 700, color: def.color }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
