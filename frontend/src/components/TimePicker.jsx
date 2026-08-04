/**
 * TimePicker — wraps <input type="time"> with a clean AM/PM-aware label.
 *
 * Props:
 *   label       — field label text
 *   value       — current "HH:MM" string (24h, for input value)
 *   onChange    — called with new "HH:MM" string
 *   placeholder — shown as a subtle hint below the field
 */
export default function TimePicker({ label, value, onChange, placeholder, hasError }) {
  return (
    <div className="form-group mb-0">
      {label && <label className="form-label">{label}</label>}

      <div style={{ position: "relative" }}>
        <input
          type="time"
          className="form-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            colorScheme: "light",
            cursor: "pointer",
            borderColor: hasError ? "#ef4444" : undefined,
            boxShadow: hasError ? "0 0 0 3px rgba(239,68,68,0.15)" : undefined,
          }}
        />

        {/* Small clock icon on the left */}
        <span style={{
          position: "absolute",
          left: "0.75rem",
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: "var(--color-text-light)",
          display: "flex",
          alignItems: "center",
        }}>
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>

        {/* Override to push text right of the icon */}
        <style>{`
          input[type="time"].form-input {
            padding-left: 2.25rem;
          }
        `}</style>
      </div>

      {placeholder && !value && (
        <p style={{
          fontSize: "0.75rem",
          color: "var(--color-text-light)",
          marginTop: "0.25rem",
          marginBottom: 0,
        }}>
          {placeholder}
        </p>
      )}
    </div>
  );
}
