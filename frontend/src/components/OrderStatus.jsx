import { Check } from "lucide-react";

const STEPS = [
  ["pending", "Received"],
  ["preparing", "Preparing"],
  ["ready", "Ready"],
  ["completed", "Served"],
];


export default function OrderStatus({ status }) {
  if (status === "cancelled") return <div className="steps-cancelled">This order was cancelled.</div>;
  const at = STEPS.findIndex(([s]) => s === status);
  return (
    <ol className="steps">
      {STEPS.map(([s, label], i) => (
        <li key={s} className={i < at ? "done" : i === at ? "current" : ""}>
          <span className="step-dot">{i < at ? <Check size={12} /> : null}</span>
          <span>{label}</span>
        </li>
      ))}
    </ol>
  );
}
