const BASE = import.meta.env.VITE_API_URL || '';
export const apiURL = (path) => BASE + path;
