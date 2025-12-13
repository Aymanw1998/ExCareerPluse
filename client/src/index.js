import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { ConfirmProvider } from "./Components/Provides/ConfirmContext";
import { ToastProvider, SystemStatusWatcher, SystemEventSubscriber, StatusBadge, useToast, toast } from "./ALERT/SystemToasts";
import { initApiBase } from "./WebServer/services/api";

window.onerror = (m, s, l, c, e) => console.error("[window.onerror]", m, e);
window.onunhandledrejection = (e) => console.error("[unhandledrejection]", e.reason || e);

initApiBase().then(() => {}).catch((err) => {console.error("Error initializing API base URL:", err);});
function DevToastPing() {
  const { push } = useToast();
  useEffect(() => {
    window.toast = toast;
  }, [push]);
  return null;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ConfirmProvider>
    <ToastProvider rtl baseZIndex={999999}>
      <App />

      {/* ניטור ברקע */}
      <SystemStatusWatcher
        options={{
          healthUrl: `/health`,
          intervalMs: 5000,
          getToken: () => localStorage.getItem("accessToken"),
          warnBeforeExpirySec: 300,
        }}
      />

      {/* אירועים חיים מהשרת */}
      <SystemEventSubscriber url="/api/events" />

      {/* באדג׳ סטטוס (כבוי בקומפוננטה כברירת מחדל) */}
      <StatusBadge />

      <DevToastPing />
    </ToastProvider>
  </ConfirmProvider>
);

reportWebVitals();
