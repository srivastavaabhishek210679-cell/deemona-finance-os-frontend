import { useState, useEffect } from "react";
import { apiURL } from "./api.js";

let globalListeners = new Set();
let globalConnected = false;
let globalES = null;

function connectSSE() {
  const token = localStorage.getItem("token");
  if (!token || globalES) return;
  const url = apiURL("/api/stream/live") + "?token=" + encodeURIComponent(token);
  globalES = new EventSource(url);
  globalES.onopen = () => {
    globalConnected = true;
    globalListeners.forEach(fn => fn({ type: "connected" }));
  };
  globalES.onmessage = (e) => {
    try { const ev = JSON.parse(e.data); globalListeners.forEach(fn => fn(ev)); } catch {}
  };
  globalES.onerror = () => {
    globalConnected = false;
    globalES?.close(); globalES = null;
    globalListeners.forEach(fn => fn({ type: "disconnected" }));
    setTimeout(connectSSE, 5000);
  };
}

export default function LiveStreamStatus() {
  const [connected, setConnected] = useState(false);
  const [lastTable, setLastTable] = useState(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    connectSSE();
    const handler = (ev) => {
      if (ev.type === "connected") setConnected(true);
      if (ev.type === "disconnected") setConnected(false);
      if (ev.type === "data_change") {
        setLastTable(ev.table);
        setFlash(true);
        setTimeout(() => setFlash(false), 1500);
        window.dispatchEvent(new CustomEvent("deemona_data_change", { detail: ev }));
      }
    };
    globalListeners.add(handler);
    setConnected(globalConnected);
    return () => globalListeners.delete(handler);
  }, []);

  return (
    <div style={{display:"flex",alignItems:"center",gap:5,padding:"3px 8px",borderRadius:6,background:connected?"#f0fdf4":"#f8faff",border:"1px solid "+(connected?"#bbf7d0":"#e2e8f0"),flexShrink:0}}>
      <span style={{width:6,height:6,borderRadius:"50%",display:"inline-block",background:connected?"#16a34a":"#94a3b8",boxShadow:flash?"0 0 6px #16a34a":"none",transition:"box-shadow 0.3s"}}/>
      <span style={{fontSize:9,fontWeight:700,color:connected?"#16a34a":"#94a3b8",whiteSpace:"nowrap"}}>{connected?"LIVE":"--"}</span>
      {lastTable&&connected&&<span style={{fontSize:9,color:"#64748b",maxWidth:70,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lastTable}</span>}
    </div>
  );
}
