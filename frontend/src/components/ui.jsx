import { useEffect } from "react";
import { FiAlertTriangle } from "react-icons/fi";

export function Spinner({ label }) {
  return (
    <div className="center" role="status" aria-live="polite" style={{ padding: "2rem", gap: ".8rem" }}>
      <div className="spinner" />
      {label && <span className="muted">{label}</span>}
    </div>
  );
}

export function FullScreenLoader() {
  return (
    <div className="fullscreen-loader">
      <Spinner label="Loading InventoryEasePro…" />
    </div>
  );
}

export function EmptyState({ icon, title, children, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <h3 style={{ color: "var(--text)" }}>{title}</h3>
      {children && <p style={{ maxWidth: 420, margin: "0 auto" }}>{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function StatCard({ icon, label, value, accent = "indigo", delay = 0 }) {
  return (
    <div className={`stat accent-${accent} rise`} style={{ animationDelay: `${delay}s` }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

export function Field({ label, hint, children, className = "" }) {
  return (
    <div className={`field ${className}`}>
      {label && <label>{label}</label>}
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", danger, busy, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="overlay" onClick={onCancel} role="presentation">
      <div className="glass modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ marginBottom: ".8rem" }}>
          <span className="stat-icon" style={{ margin: 0, width: 42, height: 42, background: danger ? "linear-gradient(135deg,#f43f5e,#fb7185)" : undefined }}>
            <FiAlertTriangle size={20} />
          </span>
          <h3 id="confirm-title" style={{ margin: 0 }}>{title}</h3>
        </div>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm} disabled={busy}>
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="spread dash-head">
      <div>
        <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.1rem)", margin: 0 }}>{title}</h1>
        {subtitle && <p className="muted" style={{ margin: ".3rem 0 0", fontSize: ".95rem" }}>{subtitle}</p>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}
