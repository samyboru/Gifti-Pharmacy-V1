// File Location: client/src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  
  // --- START: CRITICAL SECURITY FIX ---
  // This tells Axios to include credentials (like our httpOnly cookie) with every request it sends.
  // Without this, the browser will not send the cookie, and all requests will be Unauthorized.
  withCredentials: true,
  // --- END: CRITICAL SECURITY FIX ---
});

// --- REMOVED ---
// The old request interceptor that manually added a token from localStorage is now
// obsolete and has been completely removed. The browser handles the cookie automatically.

export default api;