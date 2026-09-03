// withAutoRefresh.jsx — HOC to auto-refresh dashboard on data changes
import { useState, useEffect, useCallback } from 'react';
import { useRealTime, LiveIndicator } from '../hooks/useRealTime';

export function withAutoRefresh(Component, refreshFn, tables = []) {
  return function AutoRefreshedComponent(props) {
    const [refreshKey, setRefreshKey] = useState(0);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const handleDataChange = useCallback((event) => {
      // Only refresh if the changed table is relevant to this component
      if (tables.length === 0 || tables.includes(event.table)) {
        setRefreshKey(k => k + 1);
        setLastRefresh(new Date());
        console.log('[AutoRefresh] Refreshing due to', event.table, event.action);
      }
    }, []);

    const { connected, lastEvent } = useRealTime(handleDataChange);

    // Also poll every 30 seconds as fallback
    useEffect(() => {
      const interval = setInterval(() => {
        setRefreshKey(k => k + 1);
        setLastRefresh(new Date());
      }, 30000);
      return () => clearInterval(interval);
    }, []);

    return (
      <div>
        <div style={{display:'flex',justifyContent:'flex-end',alignItems:'center',gap:10,marginBottom:8,padding:'0 4px'}}>
          <span style={{fontSize:10,color:'#94a3b8'}}>
            Last updated: {lastRefresh.toLocaleTimeString('en-IN')}
          </span>
          <LiveIndicator connected={connected} lastEvent={lastEvent}/>
        </div>
        <Component key={refreshKey} {...props}/>
      </div>
    );
  };
}
