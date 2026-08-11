import { apiURL } from '../../api.js';
import { useState, useCallback } from 'react';

const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });

function formatINR(n) {
  const num = parseFloat(n || 0);
  if (num >= 1e7) return 'Rs ' + (num / 1e7).toFixed(2) + ' Cr';
  if (num >= 1e5) return 'Rs ' + (num / 1e5).toFixed(2) + ' L';
  return 'Rs ' + num.toLocaleString('en-IN');
}

// -- Mini bar chart ---------------------------------------------
function BarChart({ data, color, height = 80 }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => Math.abs(d.value)));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height }}>
      {data.map((d, i) => {
        const h = max > 0 ? Math.abs(d.value) / max * height : 0;
        const isNeg = d.value < 0;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{
              width: '100%', height: h,
              background: isNeg ? '#FF5C5C' : color,
              borderRadius: '3px 3px 0 0',
              opacity: 0.85,
              transition: 'height 0.5s ease',
            }} />
            <div style={{ fontSize: 9, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// -- Scenario input field ---------------------------------------
function ScenarioField({ label, value, onChange, type = 'number', unit, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</label>
        {unit && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{unit}</span>}
      </div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '9px 12px', borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--surface-3)',
          color: 'var(--text-primary)', fontSize: 14, outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = '#1B4FD8'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
      {hint && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

// -- Result metric card -----------------------------------------
function MetricCard({ label, value, change, color, note }) {
  const isPositive = parseFloat(change) >= 0;
  return (
    <div style={{
      padding: '16px 18px', borderRadius: 12,
      background: 'var(--surface-2)', border: '1px solid var(--border)',
    }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: color || '#0A1628', lineHeight: 1, marginBottom: 4 }}>{value}</div>
      {change !== undefined && (
        <div style={{ fontSize: 12, fontWeight: 600, color: isPositive ? '#22C98A' : '#FF5C5C' }}>
          {isPositive ? '+' : ''}{change}% vs current
        </div>
      )}
      {note && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{note}</div>}
    </div>
  );
}

// -- Saved scenarios list ---------------------------------------
function SavedScenarios({ scenarios, onLoad, onDelete }) {
  if (!scenarios.length) return (
    <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
      No saved scenarios yet
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {scenarios.map(s => (
        <div key={s.id} style={{
          padding: '10px 12px', borderRadius: 8,
          background: 'var(--surface-3)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(s.savedAt).toLocaleDateString('en-IN')}</div>
          </div>
          <button onClick={() => onLoad(s)} style={{
            padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
            background: '#1B4FD820', border: '1px solid #1B4FD830', color: '#1B4FD8', cursor: 'pointer',
          }}>Load</button>
          <button onClick={() => onDelete(s.id)} style={{
            padding: '3px 8px', borderRadius: 6, fontSize: 11,
            background: '#FF5C5C10', border: '1px solid #FF5C5C20', color: '#FF5C5C', cursor: 'pointer',
          }}>x</button>
        </div>
      ))}
    </div>
  );
}

// -- Main Digital Twin ------------------------------------------
export default function DigitalTwinPage() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [savedScenarios, setSavedScenarios] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dt_scenarios') || '[]'); } catch { return []; }
  });
  const [scenarioName, setScenarioName] = useState('');
  const [activeTab, setActiveTab] = useState('inputs');

  // Scenario inputs
  const [inputs, setInputs] = useState({
    // Company baseline
    current_revenue: '1000000',
    current_employees: '50',
    current_monthly_expenses: '600000',
    industry: 'Technology',
    // Growth assumptions
    revenue_growth_pct: '15',
    projection_years: '3',
    // Hiring
    new_hires: '0',
    avg_salary: '600000',
    // Infrastructure
    new_office: false,
    office_rent_monthly: '0',
    // Expansion
    new_product: false,
    product_dev_cost: '0',
    // Market
    inflation_pct: '6',
    tax_rate_pct: '25',
    // Custom
    custom_assumption: '',
  });

  const set = (key, val) => setInputs(p => ({ ...p, [key]: val }));

  const runSimulation = useCallback(async () => {
    setRunning(true);
    setResult(null);
    setActiveTab('results');

    try {
      const prompt = [
        'You are the Digital Twin engine of Deemona AI Finance OS.',
        'Run a financial scenario simulation for an Indian ' + inputs.industry + ' company.',
        '',
        'CURRENT STATE:',
        '- Annual Revenue: INR ' + parseFloat(inputs.current_revenue).toLocaleString('en-IN'),
        '- Employees: ' + inputs.current_employees,
        '- Monthly Operating Expenses: INR ' + parseFloat(inputs.current_monthly_expenses).toLocaleString('en-IN'),
        '',
        'SCENARIO ASSUMPTIONS:',
        '- Revenue growth rate: ' + inputs.revenue_growth_pct + '% per year',
        '- Projection period: ' + inputs.projection_years + ' years',
        '- New hires planned: ' + inputs.new_hires + ' employees at avg INR ' + parseFloat(inputs.avg_salary).toLocaleString('en-IN') + '/year',
        inputs.new_office ? '- New office: Monthly rent INR ' + parseFloat(inputs.office_rent_monthly).toLocaleString('en-IN') : '',
        inputs.new_product ? '- New product development: One-time cost INR ' + parseFloat(inputs.product_dev_cost).toLocaleString('en-IN') : '',
        '- Inflation rate: ' + inputs.inflation_pct + '% per year',
        '- Effective tax rate: ' + inputs.tax_rate_pct + '%',
        inputs.custom_assumption ? '- Additional: ' + inputs.custom_assumption : '',
        '',
        'Generate a detailed financial projection. Return a JSON object with this exact structure:',
        '{',
        '  "summary": "2-3 sentence executive summary of the scenario outcome",',
        '  "verdict": "POSITIVE" | "CAUTION" | "NEGATIVE",',
        '  "years": [',
        '    {',
        '      "year": 1,',
        '      "revenue": number,',
        '      "gross_profit": number,',
        '      "operating_expenses": number,',
        '      "ebitda": number,',
        '      "tax": number,',
        '      "net_profit": number,',
        '      "cash_flow": number,',
        '      "headcount": number,',
        '      "monthly_burn": number',
        '    }',
        '  ],',
        '  "key_metrics": {',
        '    "revenue_cagr": number,',
        '    "ebitda_margin_y3": number,',
        '    "payback_months": number,',
        '    "break_even_month": number,',
        '    "total_investment": number,',
        '    "roi_3yr": number',
        '  },',
        '  "risks": ["risk1", "risk2", "risk3"],',
        '  "opportunities": ["opp1", "opp2", "opp3"],',
        '  "recommendations": ["rec1", "rec2", "rec3"],',
        '  "cash_flow_months": [',
        '    { "month": "Apr", "value": number },',
        '    ... 12 months for year 1',
        '  ]',
        '}',
        'Use realistic Indian SME numbers in INR. Return only valid JSON, no markdown.',
      ].filter(Boolean).join('\n');

      const res = await fetch(apiURL('/api/brief'), {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      const text = data.text || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
    } catch (err) {
      setResult({ error: 'Simulation failed: ' + err.message });
    } finally {
      setRunning(false);
    }
  }, [inputs]);

  const saveScenario = () => {
    if (!result || result.error) return;
    const name = scenarioName || 'Scenario ' + new Date().toLocaleDateString('en-IN');
    const scenario = {
      id: Date.now(),
      name,
      inputs: { ...inputs },
      result,
      savedAt: new Date().toISOString(),
    };
    const updated = [scenario, ...savedScenarios].slice(0, 10);
    setSavedScenarios(updated);
    localStorage.setItem('dt_scenarios', JSON.stringify(updated));
    setScenarioName('');
    alert('Scenario saved: ' + name);
  };

  const loadScenario = (s) => {
    setInputs(s.inputs);
    setResult(s.result);
    setActiveTab('results');
  };

  const deleteScenario = (id) => {
    const updated = savedScenarios.filter(s => s.id !== id);
    setSavedScenarios(updated);
    localStorage.setItem('dt_scenarios', JSON.stringify(updated));
  };

  const verdictConfig = {
    POSITIVE: { color: '#22C98A', bg: '#22C98A10', border: '#22C98A30', icon: 'up' },
    CAUTION:  { color: '#F5A623', bg: '#F5A62310', border: '#F5A62330', icon: '~' },
    NEGATIVE: { color: '#FF5C5C', bg: '#FF5C5C10', border: '#FF5C5C30', icon: 'â†“' },
  };

  const TABS = [
    { id: 'inputs',   label: 'Scenario Setup' },
    { id: 'results',  label: 'Simulation Results' },
    { id: 'saved',    label: 'Saved Scenarios' },
  ];

  return (
    <div style={{ padding: 24, background: '#EEF3FD', minHeight: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px', borderRadius: 14, marginBottom: 24,
        background: 'linear-gradient(135deg, #13131E 0%, #1A1A35 50%, #22223A 100%)',
        border: '1px solid #1B4FD830',
        display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 24, color: '#1B4FD8' }}>*</span>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Financial Digital Twin</h2>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: '#1B4FD8', color: '#fff', fontWeight: 700 }}>AI POWERED</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
            Simulate financial scenarios before making real decisions. Model hiring plans, new offices,
            product launches, and market changes  -  see projected P&L, cash flow, and ROI.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
          {[
            { label: 'Scenario Types', value: 'inf' },
            { label: 'Projection Years', value: inputs.projection_years },
            { label: 'Saved Scenarios', value: savedScenarios.length },
          ].map(m => (
            <div key={m.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#1B4FD8' }}>{m.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '10px 20px', fontSize: 14, fontWeight: 600,
            background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === t.id ? '2px solid #1B4FD8' : '2px solid transparent',
            color: activeTab === t.id ? '#1B4FD8' : 'var(--text-secondary)',
            marginBottom: -1,
          }}>{t.label}</button>
        ))}
      </div>

      {/* -- INPUTS TAB -- */}
      {activeTab === 'inputs' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>

          {/* Column 1: Company Baseline */}
          <div style={{ padding: 20, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#1B4FD8' }}>Company Baseline</div>
            <ScenarioField label="Current Annual Revenue" value={inputs.current_revenue} onChange={v => set('current_revenue', v)} unit="INR" hint="Your current year's total revenue" />
            <ScenarioField label="Current Employees" value={inputs.current_employees} onChange={v => set('current_employees', v)} hint="Full-time headcount today" />
            <ScenarioField label="Monthly Operating Expenses" value={inputs.current_monthly_expenses} onChange={v => set('current_monthly_expenses', v)} unit="INR" hint="Total monthly burn rate" />
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Industry</div>
              <select value={inputs.industry} onChange={e => set('industry', e.target.value)} style={{
                width: '100%', padding: '9px 12px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--surface-3)',
                color: 'var(--text-primary)', fontSize: 14, outline: 'none',
              }}>
                {['Technology', 'Manufacturing', 'Retail', 'Healthcare', 'Financial Services', 'Education', 'Real Estate', 'Logistics', 'Media', 'Other'].map(i => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <ScenarioField label="Tax Rate (%)" value={inputs.tax_rate_pct} onChange={v => set('tax_rate_pct', v)} unit="%" hint="Effective corporate tax rate" />
          </div>

          {/* Column 2: Growth Assumptions */}
          <div style={{ padding: 20, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#22C98A' }}>Growth Assumptions</div>
            <ScenarioField label="Revenue Growth Rate" value={inputs.revenue_growth_pct} onChange={v => set('revenue_growth_pct', v)} unit="% per year" hint="Annual revenue growth assumption" />
            <ScenarioField label="Projection Period" value={inputs.projection_years} onChange={v => set('projection_years', v)} unit="years" hint="1-5 years" />
            <ScenarioField label="Inflation Rate" value={inputs.inflation_pct} onChange={v => set('inflation_pct', v)} unit="% per year" hint="Cost inflation assumption" />

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: '#F5A623' }}>Hiring Plan</div>
              <ScenarioField label="New Hires" value={inputs.new_hires} onChange={v => set('new_hires', v)} hint="Total new employees to hire" />
              <ScenarioField label="Average Annual Salary" value={inputs.avg_salary} onChange={v => set('avg_salary', v)} unit="INR per employee" hint="CTC per new hire" />
            </div>
          </div>

          {/* Column 3: Investments & Run */}
          <div>
            <div style={{ padding: 20, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: '#4FC3F7' }}>Capital Investments</div>

              {/* New Office Toggle */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 10 }}>
                  <div style={{
                    width: 40, height: 22, borderRadius: 11,
                    background: inputs.new_office ? '#1B4FD8' : 'var(--surface-3)',
                    border: '1px solid var(--border)', position: 'relative',
                    transition: 'background 0.2s', flexShrink: 0, cursor: 'pointer',
                  }} onClick={() => set('new_office', !inputs.new_office)}>
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: 2,
                      left: inputs.new_office ? 20 : 2,
                      transition: 'left 0.2s',
                    }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>New Office</span>
                </label>
                {inputs.new_office && (
                  <ScenarioField label="Monthly Rent" value={inputs.office_rent_monthly} onChange={v => set('office_rent_monthly', v)} unit="INR/month" />
                )}
              </div>

              {/* New Product Toggle */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 10 }}>
                  <div style={{
                    width: 40, height: 22, borderRadius: 11,
                    background: inputs.new_product ? '#1B4FD8' : 'var(--surface-3)',
                    border: '1px solid var(--border)', position: 'relative',
                    transition: 'background 0.2s', flexShrink: 0, cursor: 'pointer',
                  }} onClick={() => set('new_product', !inputs.new_product)}>
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: 2,
                      left: inputs.new_product ? 20 : 2,
                      transition: 'left 0.2s',
                    }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>New Product/Service</span>
                </label>
                {inputs.new_product && (
                  <ScenarioField label="Development Cost" value={inputs.product_dev_cost} onChange={v => set('product_dev_cost', v)} unit="INR one-time" />
                )}
              </div>

              {/* Custom assumption */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Custom Assumption</div>
                <textarea
                  value={inputs.custom_assumption}
                  onChange={e => set('custom_assumption', e.target.value)}
                  placeholder="e.g. Expand to 3 new cities, launch international operations, acquire a competitor..."
                  rows={3}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '9px 12px',
                    borderRadius: 8, border: '1px solid var(--border)',
                    background: 'var(--surface-3)', color: 'var(--text-primary)',
                    fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* Run button */}
            <button onClick={runSimulation} disabled={running} style={{
              width: '100%', padding: '14px', borderRadius: 12,
              background: running ? 'var(--surface-3)' : 'linear-gradient(135deg, #1B4FD8, #3B82F6)',
              color: running ? 'var(--text-muted)' : '#fff',
              border: 'none', cursor: running ? 'not-allowed' : 'pointer',
              fontSize: 15, fontWeight: 700, letterSpacing: '0.02em',
              transition: 'opacity 0.2s',
            }}>
              {running ? 'AI is running simulation...' : '* Run Financial Simulation'}
            </button>
            {running && (
              <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                Projecting {inputs.projection_years} years of financials...
              </div>
            )}
          </div>
        </div>
      )}

      {/* -- RESULTS TAB -- */}
      {activeTab === 'results' && (
        <div>
          {running && (
            <div style={{ textAlign: 'center', padding: 80 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>*</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>AI is simulating your scenario...</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                Projecting {inputs.projection_years} years of financials for {inputs.industry} company
              </div>
            </div>
          )}

          {!running && !result && (
            <div style={{ textAlign: 'center', padding: 80 }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>*</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No simulation run yet</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Configure your scenario and run the simulation</div>
              <button onClick={() => setActiveTab('inputs')} style={{
                padding: '10px 24px', borderRadius: 10, background: 'var(--accent)',
                color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              }}>Configure Scenario</button>
            </div>
          )}

          {result?.error && (
            <div style={{ padding: 20, borderRadius: 12, background: '#FF5C5C10', border: '1px solid #FF5C5C30', color: '#FF5C5C' }}>
              {result.error}
            </div>
          )}

          {result && !result.error && (
            <div>
              {/* Verdict banner */}
              {result.verdict && (
                <div style={{
                  padding: '16px 20px', borderRadius: 12, marginBottom: 20,
                  background: (verdictConfig[result.verdict]?.bg) || '#1B4FD810',
                  border: '1px solid ' + (verdictConfig[result.verdict]?.border || '#1B4FD830'),
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: verdictConfig[result.verdict]?.color || '#1B4FD8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, color: '#fff', fontWeight: 800,
                  }}>{verdictConfig[result.verdict]?.icon || '~'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: verdictConfig[result.verdict]?.color, marginBottom: 4 }}>
                      SIMULATION VERDICT: {result.verdict}
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)' }}>{result.summary}</div>
                  </div>
                  {/* Save scenario */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <input value={scenarioName} onChange={e => setScenarioName(e.target.value)}
                      placeholder="Scenario name..."
                      style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-3)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', width: 140 }}
                    />
                    <button onClick={saveScenario} style={{
                      padding: '6px 14px', borderRadius: 7, background: 'var(--accent)',
                      color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    }}>Save</button>
                  </div>
                </div>
              )}

              {/* Key metrics */}
              {result.key_metrics && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
                  <MetricCard label="Revenue CAGR" value={result.key_metrics.revenue_cagr + '%'} color="#22C98A" />
                  <MetricCard label="EBITDA Margin Y3" value={result.key_metrics.ebitda_margin_y3 + '%'} color="#1B4FD8" />
                  <MetricCard label="Payback Period" value={result.key_metrics.payback_months + ' mo'} color="#4FC3F7" />
                  <MetricCard label="Break-even Month" value={'M' + result.key_metrics.break_even_month} color="#3B82F6" />
                  <MetricCard label="Total Investment" value={formatINR(result.key_metrics.total_investment)} color="#F5A623" />
                  <MetricCard label="3-Year ROI" value={result.key_metrics.roi_3yr + '%'} color={result.key_metrics.roi_3yr >= 0 ? '#22C98A' : '#FF5C5C'} />
                </div>
              )}

              {/* Year-by-year projections */}
              {result.years?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Year-by-Year Projections</div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${result.years.length}, 1fr)`, gap: 12 }}>
                    {result.years.map(yr => (
                      <div key={yr.year} style={{
                        padding: '16px 18px', borderRadius: 12,
                        background: 'var(--surface-2)', border: '1px solid var(--border)',
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#1B4FD8', marginBottom: 12 }}>Year {yr.year}</div>
                        {[
                          { label: 'Revenue', value: yr.revenue, color: '#22C98A' },
                          { label: 'Gross Profit', value: yr.gross_profit, color: '#4FC3F7' },
                          { label: 'EBITDA', value: yr.ebitda, color: '#3B82F6' },
                          { label: 'Net Profit', value: yr.net_profit, color: yr.net_profit >= 0 ? '#22C98A' : '#FF5C5C' },
                          { label: 'Cash Flow', value: yr.cash_flow, color: yr.cash_flow >= 0 ? '#22C98A' : '#FF5C5C' },
                          { label: 'Tax', value: yr.tax, color: '#F5A623' },
                          { label: 'Headcount', value: yr.headcount + ' people', color: '#3B5998', noFormat: true },
                          { label: 'Monthly Burn', value: yr.monthly_burn, color: '#FF5C5C' },
                        ].map(m => (
                          <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                            <span style={{ color: 'var(--text-muted)' }}>{m.label}</span>
                            <span style={{ fontWeight: 700, color: m.color }}>
                              {m.noFormat ? m.value : formatINR(m.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cash flow chart */}
              {result.cash_flow_months?.length > 0 && (
                <div style={{ padding: 20, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Monthly Cash Flow  -  Year 1</div>
                  <BarChart
                    data={result.cash_flow_months.map(m => ({ label: m.month, value: m.value }))}
                    color="#1B4FD8"
                    height={100}
                  />
                </div>
              )}

              {/* Risks, Opportunities, Recommendations */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                {[
                  { title: 'Key Risks', items: result.risks, color: '#FF5C5C', icon: '!' },
                  { title: 'Opportunities', items: result.opportunities, color: '#22C98A', icon: '+' },
                  { title: 'Recommendations', items: result.recommendations, color: '#1B4FD8', icon: 'down' },
                ].map(section => (
                  <div key={section.title} style={{ padding: 16, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: section.color, marginBottom: 12 }}>
                      {section.title}
                    </div>
                    {(section.items || []).map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                        <span style={{
                          width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                          background: section.color + '20', color: section.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700, marginTop: 1,
                        }}>{section.icon}</span>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* -- SAVED SCENARIOS TAB -- */}
      {activeTab === 'saved' && (
        <div style={{ maxWidth: 600 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
            Saved Scenarios ({savedScenarios.length}/10)
          </div>
          <SavedScenarios
            scenarios={savedScenarios}
            onLoad={loadScenario}
            onDelete={deleteScenario}
          />
          {savedScenarios.length === 0 && (
            <div style={{ marginTop: 20 }}>
              <button onClick={() => setActiveTab('inputs')} style={{
                padding: '10px 24px', borderRadius: 10, background: 'var(--accent)',
                color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              }}>Create Your First Scenario</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



