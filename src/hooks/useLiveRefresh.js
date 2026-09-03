import { useEffect, useRef } from "react";
export function useLiveRefresh(tables, onRefresh) {
  const timer = useRef(null);
  useEffect(() => {
    if (onRefresh) onRefresh();
    const handler = (e) => {
      const table = e.detail && e.detail.table;
      if (!tables || tables.length === 0 || tables.includes(table)) {
        if (onRefresh) onRefresh();
      }
    };
    window.addEventListener("deemona_data_change", handler);
    timer.current = setInterval(function() { if (onRefresh) onRefresh(); }, 30000);
    return function() {
      window.removeEventListener("deemona_data_change", handler);
      clearInterval(timer.current);
    };
  }, []);
}
