import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ClipboardList, RotateCcw } from "lucide-react";
import { api } from "../lib/api";
import { useCart } from "../lib/cart";
import { STATUS_TONE, dateTime, money } from "../lib/format";
import { usePolling } from "../lib/usePolling";
import OrderStatus from "../components/OrderStatus";
import { Badge, Button, EmptyState, ErrorBanner, Spinner } from "../components/ui";
import { useToast } from "../components/toast";

export default function MyOrders() {
  const { data: orders, error, loading, reload } = usePolling(() => api.myOrders(), [], 15000);
  const [params] = useSearchParams();
  const fresh = Number(params.get("new"));
  const { add, setOpen } = useCart();
  const toast = useToast();
  const [busy, setBusy] = useState(null);

  const cancel = async (id) => {
    setBusy(id);
    try { await api.cancelOrder(id); toast("Order cancelled"); reload(); }
    catch (err) { toast(err.message, "error"); }
    finally { setBusy(null); }
  };

  const again = (order) => {
    order.items.forEach((i) => i.menu_item && add({ id: i.menu_item, name: i.name, price: i.unit_price }, i.quantity));
    setOpen(true);
  };

  return (
    <div className="container page narrow">
      <h1 className="page-title">My orders</h1>
      <ErrorBanner error={error} onRetry={reload} />
      {loading && !orders ? <Spinner /> : orders?.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No orders yet" action={<Link to="/menu" className="btn btn-primary">Order something</Link>}>
          Your orders and their live status show up here.
        </EmptyState>
      ) : (
        <div className="stack">
          {orders?.map((o) => (
            <article key={o.id} className={`card order ${o.id === fresh ? "highlight" : ""}`}>
              <div className="order-head">
                <div>
                  <h3>Order #{o.id}</h3>
                  <span className="muted small">{dateTime(o.created_at)} · {o.order_type_label}{o.table_number ? ` · Table ${o.table_number}` : ""}</span>
                </div>
                <Badge tone={STATUS_TONE[o.status]}>{o.status_label}</Badge>
              </div>
              {o.id === fresh && o.status === "pending" && <p className="banner banner-info">Thanks! The kitchen has your order. This page updates by itself.</p>}
              <OrderStatus status={o.status} />
              <ul className="order-items">
                {o.items.map((i) => <li key={i.id}><span>{i.quantity} × {i.name}</span><span>{money(i.line_total)}</span></li>)}
              </ul>
              {o.note && <p className="muted small">Note: {o.note}</p>}
              <div className="order-foot">
                <b>{money(o.total)}</b>
                <div className="btn-row">
                  {o.status === "pending" && <Button variant="ghost" size="sm" loading={busy === o.id} onClick={() => cancel(o.id)}>Cancel</Button>}
                  {["completed", "cancelled"].includes(o.status) && <Button variant="secondary" size="sm" icon={RotateCcw} onClick={() => again(o)}>Order again</Button>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
