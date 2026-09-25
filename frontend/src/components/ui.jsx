import { useEffect, useId, useState } from "react";
import { AlertTriangle, Eye, EyeOff, Loader2, X } from "lucide-react";

export function Button({ variant = "primary", size, loading, icon: Icon, children, className = "", ...props }) {
  return (
    <button
      className={`btn btn-${variant}${size ? ` btn-${size}` : ""} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 className="spin" size={16} /> : Icon ? <Icon size={16} /> : null}
      {children && <span>{children}</span>}
    </button>
  );
}

export function Field({ label, error, hint, as = "input", className = "", ...props }) {
  const id = useId();
  const Tag = as === "input" && props.type === "password" ? PasswordInput : as;
  return (
    <div className={`field ${error ? "has-error" : ""} ${className}`}>
      {label && <label htmlFor={id}>{label}</label>}
      <Tag id={id} aria-invalid={!!error} aria-describedby={error || hint ? `${id}-msg` : undefined} {...props} />
      {(error || hint) && <small id={`${id}-msg`} className={error ? "error-text" : "hint"}>{error || hint}</small>}
    </div>
  );
}

/** Password box with a show/hide toggle. */
function PasswordInput(props) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="pw-wrap">
      <input {...props} type={visible ? "text" : "password"} />
      <button
        type="button"
        className="pw-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        title={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export function Spinner({ label = "Loading…" }) {
  return (
    <div className="page-loader" role="status">
      <Loader2 className="spin" size={28} />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBanner({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="banner banner-error" role="alert">
      <AlertTriangle size={18} />
      <span>{error.message || String(error)}</span>
      {onRetry && <button className="link-btn" onClick={() => onRetry()}>Try again</button>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="empty">
      {Icon && <div className="empty-icon"><Icon size={28} /></div>}
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, sub, tone = "blue" }) {
  return (
    <div className={`stat tone-${tone}`}>
      <div className="stat-icon">{Icon && <Icon size={20} />}</div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

export function Badge({ tone = "gray", children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Modal({ open, title, onClose, children, footer, size }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.classList.add("no-scroll");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("no-scroll");
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal ${size ? `modal-${size}` : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}
