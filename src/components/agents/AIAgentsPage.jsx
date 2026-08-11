import { useState, useRef, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const post = async (url, body) => { try { const r = await fetch(apiURL(url), { method: 'POST', headers: h(), body: JSON.stringify(body) }); const t = await r.text(); return JSON.parse(t); } catch { return {}; } };

// ── Agent definitions ─────────────────────────────────────────
const AGENTS = {
  hr: {
    id: 'hr',
    name: 'Arya',
    role: 'HR AI Agent',
    avatar: '👩',
    color: '#7C3AED',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    tagline: 'Your intelligent HR business partner',
    capabilities: [
      'Employee lifecycle management',
      'Payroll queries and calculations',
      'Leave and attendance management',
      'Hiring and recruitment support',
      'PF, ESI, TDS compliance',
      'Performance review assistance',
      'Policy document generation',
      'HR analytics and insights',
    ],
    quickActions: [
      { label: 'Run Payroll Summary', prompt: 'Give me a payroll summary for August 2026 including total gross, PF, TDS, and net for all 11 employees.' },
      { label: 'Check Compliance', prompt: 'What HR compliance filings are due this month? Include PF, ESI, TDS and Professional Tax.' },
      { label: 'Headcount Report', prompt: 'Give me a headcount report by department with average salary for Deemona Technologies.' },
      { label: 'Hire Plan', prompt: 'We need to hire 3 engineers in Q3. Create a hiring plan with JD, timeline, and budget estimate.' },
      { label: 'Leave Policy', prompt: 'Draft a leave policy for Deemona Technologies including casual, sick, earned, and maternity leaves per Indian labor law.' },
      { label: 'Attrition Risk', prompt: 'Analyze attrition risk based on our team of 11 employees and suggest retention strategies.' },
    ],
    systemPrompt: `You are Arya, an expert HR AI Agent for Deemona Technologies, an Indian tech company.

Company context:
- 11 employees across Engineering (4), Finance (2), Sales (2), HR (1), Marketing (2)
- Monthly payroll: Rs 10.5L gross
- Average salary: Rs 85,000/month
- Key roles: Engineers, Product Manager, Finance Manager, HR Business Partner
- Compliance: PF, ESI, TDS, Professional Tax, Gratuity applicable
- Indian labor laws apply: Shops & Establishments Act, Factories Act, Maternity Benefit Act

Your responsibilities:
- Answer HR queries accurately with Indian context
- Calculate PF (12% employer + 12% employee on basic), ESI (3.25% employer + 0.75% employee on gross up to Rs 21,000)
- TDS under Section 192 based on income tax slabs
- Provide actionable HR advice
- Generate HR documents, policies, JDs
- Always be professional, concise, and India-compliant

Respond in a friendly but professional tone. Use Indian formats (Rs, lakhs, crores).`
  },

  sales: {
    id: 'sales',
    name: 'Raj',
    role: 'Sales AI Agent',
    avatar: '🤵',
    color: '#059669',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    tagline: 'Your AI-powered sales accelerator',
    capabilities: [
      'Pipeline analysis and forecasting',
      'Lead scoring and prioritization',
      'Proposal and email drafting',
      'Competitive analysis',
      'Deal coaching and strategy',
      'Sales script generation',
      'CRM data insights',
      'Revenue forecasting',
    ],
    quickActions: [
      { label: 'Pipeline Analysis', prompt: 'Analyze our sales pipeline. We have 9 leads worth Rs 1.65Cr including Zomato (Rs 25L, 65%), PhonePe (Rs 32L, 70%), Cars24 (Rs 15L, 80% in negotiation). What should we prioritize?' },
      { label: 'Draft Proposal', prompt: 'Draft a professional proposal for PhonePe for our AI Finance OS platform. Contract value Rs 32L, 18-month implementation.' },
      { label: 'Cold Email', prompt: 'Write a cold outreach email to the CFO of a mid-size Indian manufacturing company about our AI Finance OS that can automate their GST, payroll and procurement.' },
      { label: 'Deal Strategy', prompt: 'Cars24 deal (Rs 15L) is in negotiation stage with 80% probability. What negotiation tactics should we use to close this week?' },
      { label: 'Win/Loss Analysis', prompt: 'Analyze why deals in the qualified stage with 45% probability like Meesho and Lenskart are stuck. What actions can accelerate them?' },
      { label: 'Forecast Q3', prompt: 'Based on our pipeline of Rs 1.65Cr with weighted value Rs 98.65L, forecast our Q3 FY27 revenue. Include best case, expected, and conservative scenarios.' },
    ],
    systemPrompt: `You are Raj, an expert Sales AI Agent for Deemona Technologies, an Indian B2B SaaS company.

Product context:
- Deemona AI Finance OS: AI-native ERP for Indian enterprises
- Key features: GST/TDS automation, AI CFO, Digital Twin, 20 AI agents, WhatsApp integration
- Target market: Indian SMEs and enterprises (10-500 employees)
- Pricing: Starter (Rs 2,999/mo), Pro (Rs 7,999/mo), Business (Rs 14,999/mo), Enterprise (custom)
- Competitors: Zoho Books, Tally, SAP Business One, Oracle NetSuite
- USP: AI-native, India-first, GST-compliant, WhatsApp-native, Claude-powered

Current pipeline:
- Zomato Analytics Platform: Rs 25L, 65%, proposal stage
- PhonePe Infrastructure: Rs 32L, 70%, proposal stage  
- Cars24 ML Model: Rs 15L, 80%, negotiation stage
- Groww Analytics: Rs 45L, 55%, qualified stage
- Dunzo Optimization: Rs 12L, 75%, negotiation stage
- Meesho Commerce: Rs 18L, 45%, qualified stage
- Mamaearth D2C: Rs 6.8L, 50%, proposal stage
- Lenskart Inventory: Rs 9L, 25%, lead stage

Your responsibilities:
- Analyze pipeline health and velocity
- Create sales strategies and talking points
- Draft proposals, emails, and presentations
- Provide competitive positioning advice
- Forecast revenue based on probability and stage
- Coach on deal negotiation tactics
- Generate India-specific sales content

Be direct, data-driven, and focused on revenue outcomes.`
  },

  procurement: {
    id: 'procurement',
    name: 'Priya',
    role: 'Procurement AI Agent',
    avatar: '👩‍💼',
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
    tagline: 'Smart procurement and vendor management',
    capabilities: [
      'Vendor evaluation and scoring',
      'Purchase order automation',
      'Spend analysis and optimization',
      'Contract management support',
      'Budget vs actual tracking',
      'Vendor negotiation strategy',
      'Compliance and GST verification',
      'Approval workflow management',
    ],
    quickActions: [
      { label: 'Vendor Analysis', prompt: 'Analyze our vendor portfolio. We have 10 vendors including AWS (Rs 3.5L/month), WeWork (Rs 3.4L/month), TCS (Rs 5.3L pending). Who are our highest spend vendors?' },
      { label: 'Cost Optimization', prompt: 'Our monthly vendor spend is Rs 16L. Identify top 3 opportunities to reduce costs without impacting operations.' },
      { label: 'PO Approval Criteria', prompt: 'Create approval criteria for purchase orders. Auto-approve under Rs 10K, Manager approval Rs 10K-50K, CFO approval above Rs 50K.' },
      { label: 'Vendor Negotiation', prompt: 'Draft negotiation points for renewing the AWS contract. Current spend Rs 3.5L/month. Target 15% reduction.' },
      { label: 'Spend Report', prompt: 'Generate a spend report for August 2026 by category: cloud (AWS Rs 2.98L), office (WeWork Rs 3.36L), IT services (TCS Rs 5.31L), others.' },
      { label: 'New Vendor Eval', prompt: 'Create a vendor evaluation scorecard for a new cloud provider to compare against AWS. Include pricing, SLA, support, and compliance criteria.' },
    ],
    systemPrompt: `You are Priya, a Procurement AI Agent for Deemona Technologies.

Vendor portfolio context:
- AWS India: Rs 2.98L/month (cloud infrastructure) - due August
- Microsoft India: Rs 2.12L/month (M365 licenses) - paid
- Tata Consultancy: Rs 5.31L/month (IT services) - pending
- Infosys BPM: Rs 3.78L/month (BPO services) - draft
- WeWork: Rs 3.36L/month (office rent) - both months pending
- Jio: Rs 0.53L/month (broadband) - paid
- Razorpay: Rs 0.15L/month (payment gateway) - pending
- Zoho: Rs 0.45L/month (software) - paid
- Total monthly vendor spend: ~Rs 18.7L

Focus areas:
- Cost optimization and spend analytics
- Vendor performance management
- Purchase order workflow
- GST compliance in procurement
- Contract terms and payment scheduling
- Budget adherence

Be analytical, cost-conscious, and compliance-aware.`
  },

  legal: {
    id: 'legal',
    name: 'Adv. Kumar',
    role: 'Legal AI Agent',
    avatar: '⚖️',
    color: '#DC2626',
    bg: '#FEF2F2',
    border: '#FECACA',
    tagline: 'Contract review and legal compliance',
    capabilities: [
      'Contract review and red-lining',
      'Legal document drafting',
      'Compliance risk assessment',
      'NDA and MOU templates',
      'Employment law guidance',
      'IP and data protection',
      'Regulatory compliance (DPDP, SEBI)',
      'Dispute resolution support',
    ],
    quickActions: [
      { label: 'Review Contract', prompt: 'What are the key legal risks in a software services contract with a large Indian e-commerce company? Focus on IP ownership, liability caps, and termination clauses.' },
      { label: 'NDA Template', prompt: 'Draft a mutual NDA for Deemona Technologies covering financial data, product roadmap, and customer information. Indian jurisdiction, 3 years validity.' },
      { label: 'DPDP Compliance', prompt: 'What do we need to do to comply with India\'s Digital Personal Data Protection Act (DPDP) 2023 as a B2B SaaS company handling financial data?' },
      { label: 'Employment Contract', prompt: 'Draft key clauses for a senior software engineer employment contract including IP assignment, non-compete (1 year), and notice period.' },
      { label: 'SaaS Terms', prompt: 'Draft terms of service for Deemona AI Finance OS covering data privacy, service levels, liability, and refund policy for Indian enterprise customers.' },
      { label: 'Compliance Calendar', prompt: 'What are the key legal and regulatory compliance requirements for a B2B SaaS company in India? Include ROC filings, GST, labor laws.' },
    ],
    systemPrompt: `You are Adv. Kumar, a Legal AI Agent specializing in Indian corporate and technology law.

Context:
- Company: Deemona Technologies (Private Limited, Indian company)
- Business: B2B SaaS - AI Finance OS platform
- Data handling: Financial data, employee data, business transactions
- Applicable laws: Companies Act 2013, IT Act 2000, DPDP 2023, GST Act, Indian Contract Act, labor laws

Your responsibilities:
- Review contracts and flag key risks
- Draft legal documents with Indian law perspective
- Advise on regulatory compliance
- Explain complex legal concepts simply
- Identify IP risks and protections

IMPORTANT DISCLAIMER: Always include: "This is general legal information, not legal advice. Consult a qualified lawyer for specific situations."

Be thorough, cite relevant Indian laws/sections, and be practical.`
  },
};

// ── Chat Message ──────────────────────────────────────────────
function ChatMessage({ msg, agentColor, agentAvatar }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexDirection: isUser ? 'row-reverse' : 'row' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: isUser ? '#1B4FD8' : agentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isUser ? 13 : 18, color: '#fff', fontWeight: 700, flexShrink: 0, alignSelf: 'flex-start', marginTop: 2 }}>
        {isUser ? 'You' : agentAvatar}
      </div>
      <div style={{ maxWidth: '80%' }}>
        <div style={{ padding: '12px 14px', borderRadius: isUser ? '12px 2px 12px 12px' : '2px 12px 12px 12px', background: isUser ? '#1B4FD8' : '#FFFFFF', color: isUser ? '#fff' : '#0A1628', fontSize: 13, lineHeight: 1.6, border: isUser ? 'none' : '1px solid #C7D9F8', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
        </div>
        <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4, textAlign: isUser ? 'right' : 'left' }}>
          {msg.time}
        </div>
      </div>
    </div>
  );
}

// ── Agent Chat ────────────────────────────────────────────────
function AgentChat({ agent }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hi! I'm ${agent.name}, your ${agent.role}. I'm here to help with ${agent.capabilities[0].toLowerCase()}, ${agent.capabilities[1].toLowerCase()}, and much more.\n\nWhat would you like to work on today?`, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: msg, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const conversation = [...messages, userMsg]
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    const res = await post('/api/cfo/brief', {
      prompt: agent.systemPrompt + '\n\nConversation history:\n' +
        conversation.slice(-6).map(m => `${m.role === 'user' ? 'User' : agent.name}: ${m.content}`).join('\n') +
        `\n\nUser: ${msg}\n${agent.name}:`
    });

    const reply = res.text || 'I apologize, I encountered an error. Please try again.';
    setMessages(prev => [...prev, { role: 'assistant', content: reply, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }]);
    setLoading(false);
  };

  const onKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Agent header */}
      <div style={{ padding: '16px 20px', background: `linear-gradient(135deg, ${agent.color}, ${agent.color}CC)`, color: '#fff', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{agent.avatar}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{agent.name}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>{agent.role} · {agent.tagline}</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 700 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80' }} />
            Online
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ padding: '10px 16px', background: agent.bg, borderBottom: `1px solid ${agent.border}`, display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
        {agent.quickActions.map((qa, i) => (
          <button key={i} onClick={() => send(qa.prompt)} disabled={loading} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#fff', border: `1px solid ${agent.border}`, color: agent.color, cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', transition: 'all 0.1s' }}
            onMouseEnter={e => { e.currentTarget.style.background = agent.bg; e.currentTarget.style.borderColor = agent.color; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = agent.border; }}>
            {qa.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px', background: '#F8FAFC' }}>
        {messages.map((msg, i) => (
          <ChatMessage key={i} msg={msg} agentColor={agent.color} agentAvatar={agent.avatar} />
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: agent.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{agent.avatar}</div>
            <div style={{ padding: '12px 14px', borderRadius: '2px 12px 12px 12px', background: '#fff', border: `1px solid ${agent.border}`, display: 'flex', gap: 4, alignItems: 'center' }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: agent.color, animation: `bounce 1s ${i * 0.15}s infinite`, opacity: 0.7 }} />)}
              <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }`}</style>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', background: '#fff', borderTop: `1px solid ${agent.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKeyDown} placeholder={`Ask ${agent.name} anything...`} disabled={loading} style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: `1px solid ${agent.border}`, fontSize: 13, resize: 'none', outline: 'none', height: 44, fontFamily: 'inherit', color: '#0A1628', maxHeight: 120 }} />
          <button onClick={() => send()} disabled={loading || !input.trim()} style={{ width: 44, height: 44, borderRadius: 10, background: loading || !input.trim() ? '#F1F5F9' : agent.color, border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', color: loading || !input.trim() ? '#94A3B8' : '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.12s', flexShrink: 0 }}>
            ↑
          </button>
        </div>
        <div style={{ marginTop: 6, fontSize: 10, color: '#94A3B8', textAlign: 'center' }}>Powered by Claude AI · Press Enter to send · Shift+Enter for new line</div>
      </div>
    </div>
  );
}

// ── Main Agent Marketplace Page ───────────────────────────────
export default function AIAgentsPage() {
  const [activeAgent, setActiveAgent] = useState('hr');

  return (
    <div style={{ display: 'flex', height: '100%', background: '#EEF3FD', overflow: 'hidden' }}>
      {/* Agent sidebar */}
      <div style={{ width: 220, flexShrink: 0, background: '#fff', borderRight: '1px solid #C7D9F8', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>AI Agents</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Your AI workforce</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
          {Object.values(AGENTS).map(agent => (
            <div key={agent.id} onClick={() => setActiveAgent(agent.id)}
              style={{ padding: '12px', borderRadius: 10, marginBottom: 6, cursor: 'pointer', background: activeAgent === agent.id ? agent.bg : '#F8FAFC', border: `1px solid ${activeAgent === agent.id ? agent.border : '#E2E8F0'}`, transition: 'all 0.12s' }}
              onMouseEnter={e => { if (activeAgent !== agent.id) e.currentTarget.style.background = '#F0F5FF'; }}
              onMouseLeave={e => { if (activeAgent !== agent.id) e.currentTarget.style.background = '#F8FAFC'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: activeAgent === agent.id ? agent.color : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, transition: 'background 0.12s' }}>{agent.avatar}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: activeAgent === agent.id ? agent.color : '#0A1628' }}>{agent.name}</div>
                  <div style={{ fontSize: 10, color: '#64748B' }}>{agent.role.replace(' AI Agent', '')}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.4 }}>{agent.tagline}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ADE80' }} />
                <span style={{ fontSize: 10, color: '#059669', fontWeight: 600 }}>Available</span>
              </div>
            </div>
          ))}

          {/* Coming soon agents */}
          <div style={{ padding: '12px', borderRadius: 10, marginBottom: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', opacity: 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>More Agents</div>
                <div style={{ fontSize: 10, color: '#94A3B8' }}>Marketing, Finance...</div>
              </div>
            </div>
            <div style={{ marginTop: 6, fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#DBEAFE', color: '#1B4FD8', fontWeight: 700, display: 'inline-block' }}>Coming Soon</div>
          </div>
        </div>

        {/* Capabilities */}
        {activeAgent && AGENTS[activeAgent] && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Capabilities</div>
            {AGENTS[activeAgent].capabilities.slice(0, 4).map((cap, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: AGENTS[activeAgent].color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: '#475569' }}>{cap}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeAgent && AGENTS[activeAgent] && (
          <AgentChat key={activeAgent} agent={AGENTS[activeAgent]} />
        )}
      </div>
    </div>
  );
}
