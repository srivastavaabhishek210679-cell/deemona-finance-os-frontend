const fs = require("fs");
const c = [
  "Ly8gdXNlTGl2ZVJlZnJlc2guanMgLSBhdXRvLXJlZnJlc2ggaG9vayBmb3IgZGFzaGJvYXJkcwovLyBVc2FnZTogY29uc3QgeyBsYXN0Q2hhbmdlIH0gPSB1c2VMaXZlUmVmcmVzaChbJ2FyX2ludm9pY2VzJywnZXhwZW5zZXMnXSwgbG9hZERhdGEpOwppbXBvcnQgeyB1c2VFZmZlY3QsIHVzZVJlZiB9IGZyb20gJ3JlYWN0JzsKCmV4cG9ydCBmdW5jdGlvbiB1c2VMaXZlUmVmcmVzaCh0YWJsZXMgPSBbXSwgb25SZWZyZXNoID0gbnVsbCkgewogIGNvbnN0IHRpbWVyUmVmID0gdXNlUmVmKG51bGwpOwogIGNvbnN0IGxhc3RDaGFuZ2VSZWYgPSB1c2VSZWYobnVsbCk7CgogIHVzZUVmZmVjdCgoKSA9PiB7CiAgICAvLyBIYW5kbGVyIGZvciBTU0UgZGF0YSBjaGFuZ2UgZXZlbnRzCiAgICBjb25zdCBoYW5kbGVyID0gKGUpID0+IHsKICAgICAgY29uc3QgeyB0YWJsZSwgYWN0aW9uLCB0aW1lc3RhbXAgfSA9IGUuZGV0YWlsIHx8IHt9OwogICAgICAvLyBJZiBubyB0YWJsZSBmaWx0ZXIgb3IgdGFibGUgbWF0Y2hlcywgdHJpZ2dlciByZWZyZXNoCiAgICAgIGlmICh0YWJsZXMubGVuZ3RoID09PSAwIHx8IHRhYmxlcy5pbmNsdWRlcyh0YWJsZSkpIHsKICAgICAg",
  "ICBsYXN0Q2hhbmdlUmVmLmN1cnJlbnQgPSB7IHRhYmxlLCBhY3Rpb24sIHRpbWVzdGFtcCB9OwogICAgICAgIGlmIChvblJlZnJlc2gpIG9uUmVmcmVzaCgpOwogICAgICB9CiAgICB9OwoKICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdkZWVtb25hX2RhdGFfY2hhbmdlJywgaGFuZGxlcik7CgogICAgLy8gQWxzbyBwb2xsIGV2ZXJ5IDMwIHNlY29uZHMgYXMgZmFsbGJhY2sKICAgIHRpbWVyUmVmLmN1cnJlbnQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7CiAgICAgIGlmIChvblJlZnJlc2gpIG9uUmVmcmVzaCgpOwogICAgfSwgMzAwMDApOwoKICAgIHJldHVybiAoKSA9PiB7CiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdkZWVtb25hX2RhdGFfY2hhbmdlJywgaGFuZGxlcik7CiAgICAgIGNsZWFySW50ZXJ2YWwodGltZXJSZWYuY3VycmVudCk7CiAgICB9OwogIH0sIFt0YWJsZXMuam9pbignLCcpLCBvblJlZnJlc2hdKTsKCiAgcmV0dXJuIHsgbGFzdENoYW5nZTogbGFzdENoYW5nZVJlZi5jdXJyZW50IH07Cn0KCi8vIEhpZ2hlci1vcmRlciBmdW5jdGlvbiB0byB3cmFwIGFueSBkYXRhIGxvYWRlciB3aXRoIGF1dG8tcmVmcmVzaApleHBv",
  "cnQgZnVuY3Rpb24gd2l0aExpdmVSZWZyZXNoKGxvYWRGbiwgdGFibGVzID0gW10pIHsKICByZXR1cm4gZnVuY3Rpb24gdXNlTGl2ZURhdGEoKSB7CiAgICB1c2VFZmZlY3QoKCkgPT4gewogICAgICBsb2FkRm4oKTsKICAgICAgY29uc3QgaGFuZGxlciA9IChlKSA9PiB7CiAgICAgICAgY29uc3QgeyB0YWJsZSB9ID0gZS5kZXRhaWwgfHwge307CiAgICAgICAgaWYgKHRhYmxlcy5sZW5ndGggPT09IDAgfHwgdGFibGVzLmluY2x1ZGVzKHRhYmxlKSkgbG9hZEZuKCk7CiAgICAgIH07CiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdkZWVtb25hX2RhdGFfY2hhbmdlJywgaGFuZGxlcik7CiAgICAgIGNvbnN0IHQgPSBzZXRJbnRlcnZhbChsb2FkRm4sIDMwMDAwKTsKICAgICAgcmV0dXJuICgpID0+IHsKICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignZGVlbW9uYV9kYXRhX2NoYW5nZScsIGhhbmRsZXIpOwogICAgICAgIGNsZWFySW50ZXJ2YWwodCk7CiAgICAgIH07CiAgICB9LCBbXSk7CiAgfTsKfQo=",
];
const content = Buffer.from(c.join(""), "base64").toString("utf8");
fs.mkdirSync("C:/deemona-finance-os/frontend/src/hooks", {recursive:true});
fs.writeFileSync("C:/deemona-finance-os/frontend/src/hooks/useLiveRefresh.js", content, "utf8");
console.log("Written useLiveRefresh.js");

// Patch FinanceDashboardHub to auto-refresh on SSE events
const hubPath = "C:/deemona-finance-os/frontend/src/components/dashboards/FinanceDashboardHub.jsx";
let hub = fs.readFileSync(hubPath, "utf8");
if (!hub.includes("useLiveRefresh")) {
  // Add import
  hub = hub.replace(
    "import { useState",
    "import { useLiveRefresh } from '../../hooks/useLiveRefresh';
import { useState"
  );
  // Add hook call inside main component - find first useState
  hub = hub.replace(
    "const [activeTab, setActiveTab] = useState(",
    "useLiveRefresh([], () => loadKPIs());
  const [activeTab, setActiveTab] = useState("
  );
  fs.writeFileSync(hubPath, hub, "utf8");
  console.log("FinanceDashboardHub patched with auto-refresh");
} else {
  console.log("Already patched");
}

// Also patch the main KPI dashboard if exists
const kpiFiles = [
  "C:/deemona-finance-os/frontend/src/components/dashboards/ExecutiveDashboard.jsx",
  "C:/deemona-finance-os/frontend/src/components/EnterpriseFinance.jsx",
];
kpiFiles.forEach(p => {
  if (!fs.existsSync(p)) return;
  let f2 = fs.readFileSync(p, "utf8");
  if (f2.includes("useLiveRefresh")) return;
  if (!f2.includes("loadKPIs") && !f2.includes("loadData") && !f2.includes("fetchData")) return;
  const loadFn = f2.includes("loadKPIs") ? "loadKPIs" : f2.includes("loadData") ? "loadData" : "fetchData";
  f2 = f2.replace(
    "import { useState",
    "import { useLiveRefresh } from '../../hooks/useLiveRefresh';
import { useState"
  );
  f2 = f2.replace(
    `const [data, setData]`,
    `useLiveRefresh([], () => ${loadFn}());
  const [data, setData]`
  );
  fs.writeFileSync(p, f2, "utf8");
  console.log("Patched:", p);
});