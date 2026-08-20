const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/components/reports/ReportSettingsPage.jsx';
let c = fs.readFileSync(f, 'utf8');

// Fix toggleEnabled to auto-schedule with defaults when no schedule exists
const oldToggle = `  const toggleEnabled = async (reportId) => {
    const s = schedules[reportId];
    if (!s) return openEdit(REPORTS.find(r=>r.id===reportId));
    const r = await api('/api/events/schedule','POST',{ reportType:reportId, ...s, enabled:!s.enabled });
    if (!r.error) { await loadSchedules(); showToast(\`\${!s.enabled?'✅ Enabled':'⏸ Paused'}: \${REPORTS.find(r=>r.id===reportId)?.label}\`); }
  };`;

const newToggle = `  const toggleEnabled = async (reportId) => {
    const s = schedules[reportId];
    const report = REPORTS.find(r=>r.id===reportId);
    if (!s) {
      // Auto-schedule with smart defaults - just ask for email
      const email = prompt('Enter email address for ' + report.label + ' delivery:');
      if (!email) return;
      const defaultTimes = { ar_aging:'08:00', cash_position:'07:30', compliance_alerts:'08:30', weekly_pl:'09:00', collections:'09:00', ap_calendar:'08:00', monthly_financial:'08:00', budget_vs_actual:'08:00', gst_summary:'08:00', inventory:'08:00' };
      const defaultDays = { weekly_pl:1, collections:1, ap_calendar:1 };
      const freq = report.cat === 'event' ? 'event' : report.cat;
      const r = await api('/api/events/schedule','POST',{
        reportType: reportId, email, frequency: freq,
        time: defaultTimes[reportId] || '08:00',
        dayOfWeek: defaultDays[reportId] ?? 1,
        enabled: true
      });
      if (!r.error) { await loadSchedules(); showToast('✅ ' + report.label + ' scheduled — sends ' + freq + ' at ' + (defaultTimes[reportId]||'08:00')); }
      else showToast('❌ ' + r.error, false);
    } else {
      const r = await api('/api/events/schedule','POST',{ reportType:reportId, ...s, enabled:!s.enabled });
      if (!r.error) { await loadSchedules(); showToast((s.enabled?'⏸ Paused: ':'✅ Enabled: ') + report.label); }
    }
  };`;

c = c.replace(oldToggle, newToggle);
fs.writeFileSync(f, c, 'utf8');
console.log('Done. Has autoSchedule:', c.includes('Auto-schedule with smart defaults'));
