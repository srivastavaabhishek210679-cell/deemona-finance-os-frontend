const fs = require('fs');

// Add currency rates widget to PersonalDashboard CFO view
const f = 'C:/deemona-finance-os/frontend/src/components/dashboard/PersonalDashboard.jsx';
let c = fs.readFileSync(f, 'utf8');

// Add currency widget to CFO dashboard - insert before closing div of CFODashboard
if (!c.includes('CurrencyRates')) {
  const currencyWidget = `
  // Currency Rates Widget
  function CurrencyRates() {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
      get('/api/currency/list').then(d => {
        setRates(d.currencies || []);
        setLoading(false);
      }).catch(() => setLoading(false));
    }, []);
    if (loading) return null;
    const foreign = rates.filter(r => r.code !== 'INR').slice(0, 6);
    return (
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: '16px 18px', marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>Live Exchange Rates</div>
          <div style={{ fontSize: 10, color: '#94A3B8' }}>Base: INR · Live rates</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {foreign.map(c => (
            <div key={c.code} style={{ padding: '10px 12px', borderRadius: 8, background: '#F0F5FF', border: '1px solid #DBEAFE' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>{c.flag}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1B4FD8' }}>{c.code}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0A1628' }}>Rs {parseFloat(c.rate_to_inr).toFixed(2)}</div>
              <div style={{ fontSize: 10, color: '#64748B' }}>1 {c.code} = Rs {parseFloat(c.rate_to_inr).toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
`;

  // Insert currency widget function before CFODashboard function
  c = c.replace(
    'function CFODashboard({ data })',
    currencyWidget + '\nfunction CFODashboard({ data })'
  );

  // Add CurrencyRates widget to CFO dashboard
  c = c.replace(
    '      </div>\n    </div>\n  );\n}\n\n// ── ROLE: Sales Manager',
    '      </div>\n      <CurrencyRates />\n    </div>\n  );\n}\n\n// ── ROLE: Sales Manager'
  );

  fs.writeFileSync(f, c, 'utf8');
  console.log('✓ Currency rates widget added to CFO dashboard');
} else {
  console.log('- Already added');
}
