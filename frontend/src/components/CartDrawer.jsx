import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "../lib/cart";
import { money } from "../lib/format";
import ItemImage from "./ItemImage";
import QtyStepper from "./QtyStepper";
import { Button } from "./ui";

export default function CartDrawer() {
  const { lines, total, count, setQty, clear, open, setOpen } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.classList.add("no-scroll");
    return () => { document.removeEventListener("keydown", onKey); document.body.classList.remove("no-scroll"); };
  }, [open, setOpen]);

  if (!open) return null;
  return (
    <div className="drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Your cart">
        <div className="drawer-head">
          <h3>Your order {count > 0 && <span className="muted">· {count} item{count > 1 ? "s" : ""}</span>}</h3>
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close"><X size={20} /></button>
        </div>
        {lines.length === 0 ? (
          <div className="drawer-empty">
            <ShoppingBag size={36} />
            <p>Your cart is empty.</p>
            <Button variant="secondary" onClick={() => { setOpen(false); navigate("/menu"); }}>Browse the menu</Button>
          </div>
        ) : (
          <>
            <ul className="cart-lines">
              {lines.map((l) => (
                <li key={l.id}>
                  <ItemImage item={l} className="thumb" />
                  <div className="cart-line-info">
                    <b>{l.name}</b>
                    <span className="muted small">{money(l.price)}</span>
                  </div>
                  <div className="cart-line-right">
                    <QtyStepper value={l.quantity} onChange={(q) => setQty(l.id, q)} size="sm" />
                    <b>{money(l.price * l.quantity)}</b>
                  </div>
                </li>
              ))}
            </ul>
            <div className="drawer-foot">
              <div className="total-row"><span>Total</span><b>{money(total)}</b></div>
              <Button size="lg" className="w-full" onClick={() => { setOpen(false); navigate("/checkout"); }}>Checkout</Button>
              <button className="link-btn center-btn" onClick={clear}><Trash2 size={14} /> Clear cart</button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
