
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { API_BASE } from "./config/api";

  // Adjunta automáticamente el token JWT a toda petición hacia el backend,
  // así no hay que tocar cada fetch() individual en cada componente.
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
    return originalFetch(input, init);
  };

  createRoot(document.getElementById("root")!).render(<App />);
