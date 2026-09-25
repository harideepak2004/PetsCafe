import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Store, UtensilsCrossed } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useCart } from "../lib/cart";
import { money } from "../lib/format";
import ItemImage from "../components/ItemImage";
import QtyStepper from "../components/QtyStepper";
import { Button, EmptyState, ErrorBanner, Field } from "../components/ui";
import { useToast } from "../components/toast";

export default function Checkout() {
  const { user } = useAuth();
  const { lines, total, setQty, clear } = useCart();
  const navigate = useNavigate();
  const toast = useToast();
  const [type, setType] = useState("dine_in");
  const [table, setTable] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (lines.length === 0) {
    return (
      <div className="container page">
        <EmptyState icon={ShoppingBag} title="Your cart is empty" action={<Link className="btn btn-primary" to="/menu">Browse the menu</Link>}>
          Add something tasty first.
        </EmptyState>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!user) { navigate("/login", { state: { from: "/checkout" } }); return; }
    setBusy(true); setErrors({}); setError(null);
    try {
      const order = await api.placeOrder({
        items: lines.map((l) => ({ id: l.id, quantity: l.quantity })),
        order_type: type, table_number: table, note,
      });
      clear();
      toast(`Order #${order.id} placed!`);
      navigate(`/orders?new=${order.id}`, { replace: true });
    } catch (err) {
      setErrors(err.fields || {});
      if (!err.fields?.table_number) setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container page">
      <h1 className="page-title">Checkout</h1>
      <div className="checkout">
        <form className="card form" onSubmit={submit} noValidate>
          <ErrorBanner error={error} />
          <div>
            <div className="card-title">How would you like it?</div>
            <div className="choice-row">
              <button type="button" className={`choice ${type === "dine_in" ? "active" : ""}`} onClick={() => setType("dine_in")}>
                <UtensilsCrossed size={20} /><b>Dine in</b><span>We'll bring it to your table</span>
              </button>
              <button type="button" className={`choice ${type === "takeaway" ? "active" : ""}`} onClick={() => setType("takeaway")}>
                <Store size={20} /><b>Takeaway</b><span>Pick it up at the counter</span>
              </button>
            </div>
          </div>
          {type === "dine_in" && (
            <Field label="Table number" value={table} onChange={(e) => setTable(e.target.value)} error={errors.table_number}
              placeholder="e.g. 4" inputMode="numeric" maxLength={10} hint="It's on the stand on your table." />
          )}
          <Field label="Notes for the kitchen (optional)" as="textarea" rows={2} value={note} maxLength={300}
            onChange={(e) => setNote(e.target.value)} placeholder="Less sugar, no onions…" />
          {!user && <p className="banner banner-info">You'll need to <Link to="/login" state={{ from: "/checkout" }}>log in</Link> or <Link to="/register">sign up</Link> to place the order. Your cart is saved.</p>}
          <Button type="submit" size="lg" loading={busy} className="w-full">
            {user ? `Place order · ${money(total)}` : "Log in to place order"}
          </Button>
          <p className="muted small center">Pay at the counter when your order is served.</p>
        </form>

        <aside className="card summary">
          <div className="card-title">Order summary</div>
          <ul className="cart-lines">
            {lines.map((l) => (
              <li key={l.id}>
                <ItemImage item={l} className="thumb" />
                <div className="cart-line-info"><b>{l.name}</b><span className="muted small">{money(l.price)}</span></div>
                <div className="cart-line-right">
                  <QtyStepper value={l.quantity} onChange={(q) => setQty(l.id, q)} size="sm" />
                  <b>{money(l.price * l.quantity)}</b>
                </div>
              </li>
            ))}
          </ul>
          <div className="total-row"><span>Total</span><b>{money(total)}</b></div>
        </aside>
      </div>
    </div>
  );
}
