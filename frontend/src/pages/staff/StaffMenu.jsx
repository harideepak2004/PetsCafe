import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { money } from "../../lib/format";
import { usePolling } from "../../lib/usePolling";
import ItemImage from "../../components/ItemImage";
import VegMark from "../../components/VegMark";
import { Button, ErrorBanner, Field, Modal, Spinner } from "../../components/ui";
import { useToast } from "../../components/toast";

const CATS = [["coffee", "Coffee"], ["beverages", "Beverages"], ["snacks", "Snacks"], ["sandwiches", "Sandwiches"], ["pizza", "Pizza"], ["desserts", "Desserts"]];
const BLANK = { name: "", category: "coffee", description: "", price: "", is_veg: true, image: "", is_available: true, is_featured: false, sort_order: 0 };

function ItemForm({ item, onClose, onSaved }) {
  const [form, setForm] = useState({ ...BLANK, ...item });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setErrors({}); setError(null);
    try {
      const body = { ...form, sort_order: Number(form.sort_order) || 0 };
      const saved = item?.id ? await api.updateMenuItem(item.id, body) : await api.createMenuItem(body);
      toast(`${saved.name} saved`);
      onSaved();
    } catch (err) { setErrors(err.fields || {}); if (!Object.keys(err.fields || {}).length) setError(err); }
    finally { setBusy(false); }
  };

  return (
    <Modal open title={item?.id ? `Edit ${item.name}` : "New menu item"} onClose={onClose}>
      <form className="form" onSubmit={save} noValidate>
        <ErrorBanner error={error} />
        <Field label="Name" value={form.name} onChange={set("name")} error={errors.name} autoFocus />
        <div className="grid-2">
          <Field label="Category" as="select" value={form.category} onChange={set("category")}>
            {CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Field>
          <Field label="Price (₹)" type="number" min="0" step="1" value={form.price} onChange={set("price")} error={errors.price} />
        </div>
        <Field label="Description" value={form.description} onChange={set("description")} error={errors.description} maxLength={255} />
        <Field label="Image URL (optional)" value={form.image} onChange={set("image")} error={errors.image}
          hint="A link to a photo, or /images/donut.webp, /images/sandwich.webp, /images/pastries.webp" />
        <div className="checks">
          <label><input type="checkbox" checked={form.is_veg} onChange={set("is_veg")} /> Vegetarian</label>
          <label><input type="checkbox" checked={form.is_available} onChange={set("is_available")} /> Available</label>
          <label><input type="checkbox" checked={form.is_featured} onChange={set("is_featured")} /> Show on home page</label>
        </div>
        <div className="btn-row end">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function StaffMenu() {
  const q = usePolling(() => api.staffMenu(), []);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const toast = useToast();

  const toggle = async (item) => {
    q.setData(q.data.map((m) => (m.id === item.id ? { ...m, is_available: !m.is_available } : m)));
    try { await api.updateMenuItem(item.id, { is_available: !item.is_available }); }
    catch (err) { toast(err.message, "error"); q.reload(); }
  };

  const remove = async () => {
    try { await api.deleteMenuItem(deleting.id); toast(`${deleting.name} deleted`); setDeleting(null); q.reload(); }
    catch (err) { toast(err.message, "error"); }
  };

  return (
    <div className="card">
      <div className="card-head">
        <div><div className="card-title">Menu items</div><p className="muted small">Untick “Available” when something sells out — customers see it straight away.</p></div>
        <Button icon={Plus} onClick={() => setEditing({})}>Add item</Button>
      </div>
      <ErrorBanner error={q.error} onRetry={q.reload} />
      {q.loading && !q.data ? <Spinner /> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Item</th><th>Category</th><th className="num">Price</th><th>Available</th><th /></tr></thead>
            <tbody>
              {q.data?.map((m) => (
                <tr key={m.id} className={m.is_available ? "" : "dim"}>
                  <td><div className="item-cell"><ItemImage item={m} className="thumb" /><VegMark veg={m.is_veg} /><b>{m.name}</b>{m.is_featured && <span className="badge badge-amber">home</span>}</div></td>
                  <td>{m.category_label}</td>
                  <td className="num">{money(m.price)}</td>
                  <td><label className="switch"><input type="checkbox" checked={m.is_available} onChange={() => toggle(m)} aria-label={`${m.name} available`} /><span className="switch-track" /></label></td>
                  <td className="num">
                    <button className="icon-btn" onClick={() => setEditing(m)} aria-label={`Edit ${m.name}`}><Pencil size={16} /></button>
                    <button className="icon-btn" onClick={() => setDeleting(m)} aria-label={`Delete ${m.name}`}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && <ItemForm item={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); q.reload(); }} />}
      <Modal open={!!deleting} title="Delete menu item?" onClose={() => setDeleting(null)}
        footer={<><Button variant="ghost" onClick={() => setDeleting(null)}>Keep</Button><Button variant="danger" onClick={remove}>Delete</Button></>}>
        <p>Past orders keep their details. To hide it for a while, untick “Available” instead.</p>
      </Modal>
    </div>
  );
}
