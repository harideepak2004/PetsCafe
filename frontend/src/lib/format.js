const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2, minimumFractionDigits: 0 });

export const money = (v) => inr.format(Number(v || 0));

export const dateTime = (v) =>
  v ? new Date(v).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—";

export const time = (v) => (v ? new Date(v).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "—");

export const longDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

/** YYYY-MM-DD in the browser's local time zone. */
export function isoDate(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

export function ago(v) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(v)) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.floor(mins / 60);
  return h < 24 ? `${h}h ago` : dateTime(v);
}

export const CATEGORY_EMOJI = {
  coffee: "☕", beverages: "🥤", snacks: "🥐", sandwiches: "🥪", pizza: "🍕", desserts: "🍩",
};

export const STATUS_TONE = {
  pending: "amber", preparing: "blue", ready: "green", completed: "gray", cancelled: "red",
  confirmed: "green", no_show: "red",
};
