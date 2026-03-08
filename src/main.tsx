import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Add error logging
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

createRoot(document.getElementById("root")!).render(<App />);
