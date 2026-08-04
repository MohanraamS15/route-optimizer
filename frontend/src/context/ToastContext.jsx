import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info", duration = 4000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

/* ── Icons ── */
const icons = {
  success: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  warning: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  ),
  info: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  ),
};

const styles = {
  success: {
    background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
    border: "1px solid #6ee7b7",
    color: "#065f46",
    iconColor: "#059669",
  },
  error: {
    background: "linear-gradient(135deg, #fff1f2, #ffe4e6)",
    border: "1px solid #fca5a5",
    color: "#7f1d1d",
    iconColor: "#dc2626",
  },
  warning: {
    background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
    border: "1px solid #fcd34d",
    color: "#78350f",
    iconColor: "#d97706",
  },
  info: {
    background: "linear-gradient(135deg, #f0fdfa, #ccfbf1)",
    border: "1px solid #5eead4",
    color: "#134e4a",
    iconColor: "#0d9488",
  },
};

function ToastContainer({ toasts, onDismiss }) {
  return (
    <div style={{
      position: "fixed",
      top: "80px",
      right: "1rem",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
      maxWidth: "360px",
      width: "calc(100vw - 2rem)",
    }}>
      {toasts.map(t => {
        const s = styles[t.type] || styles.info;
        return (
          <div
            key={t.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              padding: "1rem 1.25rem",
              borderRadius: "12px",
              background: s.background,
              border: s.border,
              color: s.color,
              boxShadow: "0 10px 25px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)",
              animation: "toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
              fontFamily: "Inter, sans-serif",
              fontSize: "0.9rem",
              lineHeight: "1.5",
              fontWeight: 500,
            }}
          >
            {/* Icon */}
            <span style={{ color: s.iconColor, flexShrink: 0, marginTop: "1px" }}>
              {icons[t.type] || icons.info}
            </span>

            {/* Message */}
            <span style={{ flex: 1 }}>{t.message}</span>

            {/* Close */}
            <button
              onClick={() => onDismiss(t.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: s.iconColor,
                padding: "0",
                flexShrink: 0,
                opacity: 0.7,
                lineHeight: 1,
              }}
              aria-label="Dismiss"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(60px) scale(0.9); }
          to   { opacity: 1; transform: translateX(0)   scale(1);   }
        }
      `}</style>
    </div>
  );
}
