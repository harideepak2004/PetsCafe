import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { api } from "../lib/api";
import { useCart } from "../lib/cart";
import { CATEGORY_EMOJI, money } from "../lib/format";
import { usePolling } from "../lib/usePolling";
import MenuCard from "../components/MenuCard";
import { EmptyState, ErrorBanner, Spinner } from "../components/ui";

const CATEGORIES = [
  ["all", "All"], ["coffee", "Coffee"], ["beverages", "Beverages"], ["snacks", "Snacks"],
  ["sandwiches", "Sandwiches"], ["pizza", "Pizza"], ["desserts", "Desserts"],
];

export default function MenuPage() {
  const { data: menu, error, loading, reload } = usePolling(() => api.menu(), [], 60000);
  const { sync, count, total, setOpen } = useCart();
  const [cat, setCat] = useState("all");
  const [vegOnly, setVegOnly] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => { if (menu) sync(menu); }, [menu, sync]);

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    const items = (menu || []).filter((m) =>
      (cat === "all" || m.category === cat) && (!vegOnly || m.is_veg) &&
      (!term || m.name.toLowerCase().includes(term) || m.description.toLowerCase().includes(term)));
    return CATEGORIES.slice(1)
      .map(([id, label]) => ({ id, label, items: items.filter((m) => m.category === id) }))
      .filter((g) => g.items.length);
  }, [menu, cat, vegOnly, q]);

  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <h1>Menu</h1>
          <p className="muted">Freshly made, served to your table or packed to go.</p>
        </div>
      </div>

      <div className="menu-toolbar">
        <div className="chips" role="tablist" aria-label="Categories">
          {CATEGORIES.map(([id, label]) => (
            <button key={id} role="tab" aria-selected={cat === id} className={`chip ${cat === id ? "active" : ""}`} onClick={() => setCat(id)}>
              {id !== "all" && <span aria-hidden="true">{CATEGORY_EMOJI[id]}</span>} {label}
            </button>
          ))}
        </div>
        <div className="toolbar-right">
          <label className="switch">
            <input type="checkbox" checked={vegOnly} onChange={(e) => setVegOnly(e.target.checked)} />
            <span className="switch-track" /> Veg only
          </label>
          <div className="search">
            <Search size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the menu" aria-label="Search the menu" />
          </div>
        </div>
      </div>

      <ErrorBanner error={error} onRetry={reload} />
      {loading && !menu ? <Spinner /> : groups.length === 0 ? (
        <EmptyState title="Nothing matches">Try another category or search.</EmptyState>
      ) : (
        groups.map((g) => (
          <section key={g.id} className="menu-group">
            <h2>{CATEGORY_EMOJI[g.id]} {g.label}</h2>
            <div className="menu-grid">{g.items.map((m) => <MenuCard key={m.id} item={m} />)}</div>
          </section>
        ))
      )}

      {count > 0 && (
        <button className="cart-bar" onClick={() => setOpen(true)}>
          <span>{count} item{count > 1 ? "s" : ""}</span>
          <b>View cart · {money(total)}</b>
        </button>
      )}
    </div>
  );
}
