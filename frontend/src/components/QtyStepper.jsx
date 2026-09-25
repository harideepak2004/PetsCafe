import { Minus, Plus } from "lucide-react";

export default function QtyStepper({ value, onChange, size }) {
  return (
    <div className={`qty ${size ? `qty-${size}` : ""}`}>
      <button type="button" onClick={() => onChange(value - 1)} aria-label="Remove one"><Minus size={14} /></button>
      <span aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= 20} aria-label="Add one"><Plus size={14} /></button>
    </div>
  );
}
