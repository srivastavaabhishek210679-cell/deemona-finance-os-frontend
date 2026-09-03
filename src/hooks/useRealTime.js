// useRealTime.js — SSE hook for live dashboard updates
import { useEffect, useRef, useCallback, useState } from 'react';
import { apiURL } from '../api.js';

export function useRealTime(onDataChange) {
  const esRef = useRef(null);
  const reconnectRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const url = apiURL('/api/stream/live') + '?token=' + token;
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      setConnected(true);
      console.log('[SSE] Connected to live stream');
    };

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        if (event.type === 'heartbeat') return;
        if (event.type === 'connected') return;
        if (event.type === 'data_change') {
          setLastEvent(event);
          if (onDataChange) onDataChange(event);
        }
      } catch {}
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      // Reconnect after 5 seconds
      reconnectRef.current = setTimeout(connect, 5000);
    };
  }, [onDataChange]);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      clearTimeout(reconnectRef.current);
    };
  }, [connect]);

  return { connected, lastEvent };
}

// LiveIndicator component — shows real-time connection status
export function LiveIndicator({ connected, lastEvent }) {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (lastEvent) {
      setFlash(true);
      setTimeout(() => setFlash(false), 1000);
    }
  }, [lastEvent]);

  return (
    <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px',borderRadius:6,background:connected?'#f0fdf4':'#fef2f2',border:`1px solid ${connected?'#bbf7d0':'#fecaca'}`,fontSize:10,fontWeight:700}}>
      <span style={{
        width:7,height:7,borderRadius:'50%',display:'inline-block',
        background:connected?'#16a34a':'#dc2626',
        boxShadow:flash?`0 0 8px ${connected?'#16a34a':'#dc2626'}`:'none',
        transition:'box-shadow 0.3s',
      }}/>
      <span style={{color:connected?'#16a34a':'#dc2626'}}>
        {connected ? 'LIVE' : 'Reconnecting...'}
      </span>
      {lastEvent && connected && (
        <span style={{color:'#64748b',fontWeight:400}}>
          {lastEvent.table} updated
        </span>
      )}
    </div>
  );
}
