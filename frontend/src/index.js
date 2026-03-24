import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Suppress cross-origin iframe errors (PostHog vs PayPal iframe conflict)
window.addEventListener('error', (e) => {
  if (e.message?.includes('cross-origin') || e.message?.includes('removeEventListener') || e.message?.includes('SecurityError')) {
    e.stopImmediatePropagation();
    e.preventDefault();
    return false;
  }
});
window.addEventListener('unhandledrejection', (e) => {
  if (e.reason?.message?.includes('cross-origin') || e.reason?.message?.includes('removeEventListener')) {
    e.stopImmediatePropagation();
    e.preventDefault();
    return false;
  }
});

// Disable react-error-overlay for cross-origin errors
const origConsoleError = console.error;
console.error = (...args) => {
  const msg = args[0]?.toString?.() || '';
  if (msg.includes('cross-origin') || msg.includes('removeEventListener') || msg.includes('SecurityError')) return;
  origConsoleError.apply(console, args);
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
