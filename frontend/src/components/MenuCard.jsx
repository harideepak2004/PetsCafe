import { Plus } from "lucide-react";
import { useCart } from "../lib/cart";
import { money } from "../lib/format";
import ItemImage from "./ItemImage";
import QtyStepper from "./QtyStepper";
import VegMark from "./VegMark";
import { useToast } from "./toast";

export default function MenuCard({ item }) {
  const { add, qtyOf, setQty } = useCart();
  const toast = useToast();
  const qty = qtyOf(item.id);
  return (
    <article className={`menu-card ${item.is_available ? "" : "sold-out"}`}>
      <ItemImage item={item} />
      <div className="menu-card-body">
        <div className="menu-card-title">
          <VegMark veg={item.is_veg} />
          <h3>{item.name}</h3>
        </div>
        {item.description && <p className="muted small">{item.description}</p>}
        <div className="menu-card-foot">
          <b className="price">{money(item.price)}</b>
          {!item.is_available ? (
            <span className="badge badge-gray">Sold out</span>
          ) : qty > 0 ? (
            <QtyStepper value={qty} onChange={(q) => setQty(item.id, q)} />
          ) : (
            <button className="add-btn" onClick={() => { add(item); toast(`${item.name} added`); }}>
              <Plus size={16} /> Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
