import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const KEY = "pc_cart";
const CartContext = createContext(null);

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((l) => l && l.id && l.quantity > 0) : [];
  } catch {
    return [];
  }
}

/** Cart lines: { id, name, price, image, category, is_veg, quantity } */
export function CartProvider({ children }) {
  const [lines, setLines] = useState(load);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* storage blocked */ }
  }, [lines]);

  const add = useCallback((item, qty = 1) => {
    setLines((ls) => {
      const found = ls.find((l) => l.id === item.id);
      if (found) return ls.map((l) => (l.id === item.id ? { ...l, quantity: Math.min(20, l.quantity + qty) } : l));
      const { id, name, price, image, category, is_veg } = item;
      return [...ls, { id, name, price, image, category, is_veg, quantity: qty }];
    });
  }, []);

  const setQty = useCallback((id, quantity) => {
    setLines((ls) => (quantity <= 0 ? ls.filter((l) => l.id !== id) : ls.map((l) => (l.id === id ? { ...l, quantity: Math.min(20, quantity) } : l))));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  /** Drop items that are no longer on the menu and refresh prices/names. */
  const sync = useCallback((menu) => {
    const byId = new Map(menu.map((m) => [m.id, m]));
    setLines((ls) => {
      const next = ls.filter((l) => byId.get(l.id)?.is_available).map((l) => ({ ...l, ...pick(byId.get(l.id)) }));
      return JSON.stringify(next) === JSON.stringify(ls) ? ls : next;
    });
  }, []);

  const value = useMemo(() => {
    const count = lines.reduce((n, l) => n + l.quantity, 0);
    const total = lines.reduce((n, l) => n + l.quantity * Number(l.price), 0);
    const qtyOf = (id) => lines.find((l) => l.id === id)?.quantity || 0;
    return { lines, count, total, add, setQty, clear, sync, qtyOf, open, setOpen };
  }, [lines, add, setQty, clear, sync, open]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function pick(m) {
  const { name, price, image, category, is_veg } = m;
  return { name, price, image, category, is_veg };
}

export function useCart() {
  return useContext(CartContext);
}
