import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Service Worker für Offline-Betrieb (nur im Production-Build registrieren,
// damit der Vite-Dev-Server / HMR nicht gecacht wird).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* Registrierung fehlgeschlagen – App funktioniert weiterhin online. */
    });
  });
}
