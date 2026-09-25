import { useSearchParams } from "react-router-dom";
import { CalendarHeart, ClipboardList, IndianRupee, MessageSquareHeart, Star, UtensilsCrossed } from "lucide-react";
import { api } from "../../lib/api";
import { money } from "../../lib/format";
import { usePolling } from "../../lib/usePolling";
import RevenueChart from "../../components/RevenueChart";
import { StatCard } from "../../components/ui";
import StaffOrders from "./StaffOrders";
import StaffBookings from "./StaffBookings";
import StaffMenu from "./StaffMenu";
import StaffFeedback from "./StaffFeedback";

const TABS = [
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "bookings", label: "Bookings", icon: CalendarHeart },
  { id: "menu", label: "Menu", icon: UtensilsCrossed },
  { id: "feedback", label: "Feedback", icon: MessageSquareHeart },
  { id: "sales", label: "Sales", icon: IndianRupee },
];

export default function Staff() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : "orders";
  const stats = usePolling(() => api.staffStats(), [], 30000);
  const s = stats.data;

  return (
    <div className="container page">
      <div className="page-head"><div><h1>Staff dashboard</h1><p className="muted">Orders refresh every 10 seconds.</p></div></div>

      <div className="stats">
        <StatCard icon={ClipboardList} tone="amber" label="Open orders" value={s?.open_orders ?? "—"} sub={s ? `${s.today_orders} today` : ""} />
        <StatCard icon={IndianRupee} tone="green" label="Today's sales" value={s ? money(s.today_revenue) : "—"} />
        <StatCard icon={CalendarHeart} tone="blue" label="Bookings today" value={s?.today_bookings ?? "—"} sub={s ? `${s.today_guests} guests` : ""} />
        <StatCard icon={Star} tone="violet" label="Avg rating" value={s ? (s.avg_rating || "—") : "—"} sub={s ? `${s.feedback_count} reviews` : ""} />
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={`tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setParams(t.id === "orders" ? {} : { tab: t.id }, { replace: true })}>
            <t.icon size={16} /> <span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "orders" && <StaffOrders onChange={stats.reload} />}
      {tab === "bookings" && <StaffBookings onChange={stats.reload} />}
      {tab === "menu" && <StaffMenu />}
      {tab === "feedback" && <StaffFeedback />}
      {tab === "sales" && s && (
        <div className="sales">
          <div className="card"><RevenueChart data={s.revenue_7d} /></div>
          <div className="card">
            <div className="card-title">Top items · last 7 days</div>
            {s.top_items.length === 0 ? <p className="muted">No orders yet.</p> : (
              <ol className="top-items">{s.top_items.map((t) => <li key={t.name}><span>{t.name}</span><b>{t.quantity}</b></li>)}</ol>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
