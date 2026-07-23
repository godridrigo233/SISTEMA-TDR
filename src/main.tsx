
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { API_BASE } from "./config/api";

  let isRedirectingToLogin = false;

  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = typeof input === 'string' ? input : (input as Request).url ?? String(input);
    if (url.startsWith(API_BASE)) {
      const token = localStorage.getItem('token');
      if (token) {
        init = {
          ...init,
          headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` },
        };
      }
    }
    return originalFetch(input, init).then(response => {
      if (response.status === 401 && url.startsWith(API_BASE) && url.includes('/api/login') === false) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!isRedirectingToLogin) {
          isRedirectingToLogin = true;
          window.location.href = '/login';
        }
      }
      return response;
    });
  };

  createRoot(document.getElementById("root")!).render(<App />);
