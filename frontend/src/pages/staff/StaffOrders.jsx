import { useState } from "react";
import { api } from "../../lib/api";
import { ago, money } from "../../lib/format";
import { useNow, usePolling } from "../../lib/usePolling";
import { Badge, Button, EmptyState, ErrorBanner, Spinner } from "../../components/ui";
import { useToast } from "../../components/toast";
import { ClipboardList } from "lucide-react";

const COLUMNS = [
  { id: "pending", title: "New", next: "preparing", nextLabel: "Start preparing" },
  { id: "preparing", title: "Preparing", next: "ready", nextLabel: "Mark ready" },
  { id: "ready", title: "Ready", next: "completed", nextLabel: "Served / picked up" },
];

export default function StaffOrders({ onChange }) {
  const q = usePolling(() => api.staffOrders("open"), [], 10000);
  const [busy, setBusy] = useState(null);
  const toast = useToast();
  useNow(30000);

  const move = async (order, status) => {
    setBusy(`${order.id}-${status}`);
    try {
      await api.setOrderStatus(order.id, status);
      toast(status === "cancelled" ? `Order #${order.id} cancelled` : `Order #${order.id} → ${status}`);
      q.reload(); onChange?.();
    } catch (err) { toast(err.message, "error"); }
    finally { setBusy(null); }
  };

  if (q.loading && !q.data) return <Spinner />;
  const orders = q.data || [];
  return (
    <>
      <ErrorBanner error={q.error} onRetry={q.reload} />
      {orders.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No open orders">New orders appear here automatically.</EmptyState>
      ) : (
        <div className="board">
          {COLUMNS.map((col) => {
            const list = orders.filter((o) => o.status === col.id);
            return (
              <section key={col.id} className={`board-col col-${col.id}`}>
                <h3>{col.title} <span className="count">{list.length}</span></h3>
                {list.map((o) => (
                  <article key={o.id} className="ticket">
                    <div className="ticket-head">
                      <b>#{o.id}</b>
                      <Badge tone={o.order_type === "dine_in" ? "blue" : "violet"}>{o.order_type === "dine_in" ? `Table ${o.table_number}` : "Takeaway"}</Badge>
                    </div>
                    <div className="muted small">{o.customer.name} · {ago(o.created_at)}</div>
                    <ul>{o.items.map((i) => <li key={i.id}><b>{i.quantity}×</b> {i.name}</li>)}</ul>
                    {o.note && <p className="ticket-note">“{o.note}”</p>}
                    <div className="ticket-foot">
                      <b>{money(o.total)}</b>
                      <div className="btn-row">
                        {col.id !== "ready" && (
                          <Button variant="ghost" size="sm" loading={busy === `${o.id}-cancelled`} onClick={() => move(o, "cancelled")}>Cancel</Button>
                        )}
                        <Button size="sm" loading={busy === `${o.id}-${col.next}`} onClick={() => move(o, col.next)}>{col.nextLabel}</Button>
                      </div>
                    </div>
                  </article>
                ))}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
