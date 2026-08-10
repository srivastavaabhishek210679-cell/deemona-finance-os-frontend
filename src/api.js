// Central API URL helper  -  all components import from here
const BACKEND = import.meta.env.VITE_API_URL || 'https://deemona-finance-os-api.onrender.com';

export function apiURL(path) {
  if (path.startsWith('http')) return path;
  return BACKEND + path;
}

export const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: 'Bearer ' + (localStorage.getItem('token') || ''),
});

export async function apiFetch(path, options = {}) {
  const res = await fetch(apiURL(path), {
    ...options,
    headers: { ...getHeaders(), ...(options.headers || {}) },
  });
  const text = await res.text();
  if (!text || text.trim() === '') return {};
  try { return JSON.parse(text); }
  catch { throw new Error('Server error: ' + text.substring(0, 100)); }
}

export const apiGet  = path => apiFetch(path);
export const apiPost = (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
export const apiPut  = (path, body) => apiFetch(path, { method: 'PUT',  body: JSON.stringify(body) });
export const apiDel  = path => apiFetch(path, { method: 'DELETE' });
