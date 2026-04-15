import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import { AuthProvider } from "@/contexts/AuthContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </HelmetProvider>
);

if ("serviceWorker" in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.warn("Service worker registration failed:", error);
      });
    });
  } else {
    // In dev, service workers can cache Vite assets and break HMR / React runtime.
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
    if ("caches" in window) {
      caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
    }
  }
}
