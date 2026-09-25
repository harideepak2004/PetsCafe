import { useState } from "react";
import { CalendarHeart, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../../lib/api";
import { STATUS_TONE, addDays, isoDate, longDate } from "../../lib/format";
import { usePolling } from "../../lib/usePolling";
import { Badge, Button, EmptyState, ErrorBanner, Spinner } from "../../components/ui";
import { useToast } from "../../components/toast";

export default function StaffBookings({ onChange }) {
  const [date, setDate] = useState(isoDate());
  const q = usePolling(() => api.staffBookings(date), [date], 30000);
  const toast = useToast();
  const [busy, setBusy] = useState(null);

  const mark = async (b, status) => {
    setBusy(`${b.id}-${status}`);
    try { await api.setBookingStatus(b.id, status); q.reload(); onChange?.(); }
    catch (err) { toast(err.message, "error"); }
    finally { setBusy(null); }
  };

  const rows = q.data || [];
  const guests = rows.filter((b) => b.status !== "cancelled").reduce((n, b) => n + b.guests, 0);
  const bySlot = rows.reduce((acc, b) => ((acc[b.slot_label] ||= []).push(b), acc), {});

  return (
    <div className="card">
      <div className="card-head">
        <div className="date-nav">
          <button className="icon-btn" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day"><ChevronLeft size={18} /></button>
          <b>{date === isoDate() ? "Today" : longDate(date)}</b>
          <button className="icon-btn" onClick={() => setDate(addDays(date, 1))} aria-label="Next day"><ChevronRight size={18} /></button>
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Pick a date" />
        </div>
        <span className="muted small">{rows.length} bookings · {guests} guests</span>
      </div>
      <ErrorBanner error={q.error} onRetry={q.reload} />
      {q.loading ? <Spinner /> : rows.length === 0 ? (
        <EmptyState icon={CalendarHeart} title="No bookings for this day" />
      ) : (
        Object.entries(bySlot).map(([label, list]) => (
          <div key={label} className="slot-group">
            <h4>{label}</h4>
            <div className="table-wrap">
              <table className="table">
                <tbody>
                  {list.map((b) => (
                    <tr key={b.id} className={b.status === "cancelled" ? "dim" : ""}>
                      <td><b>{b.customer.name}</b><div className="muted small">{b.phone || b.customer.email}</div></td>
                      <td>{b.guests} guest{b.guests > 1 ? "s" : ""}</td>
                      <td>{b.pet_label}</td>
                      <td className="note-cell">{b.note}</td>
                      <td><Badge tone={STATUS_TONE[b.status]}>{b.status_label}</Badge></td>
                      <td className="num">
                        {b.status === "confirmed" && (
                          <div className="btn-row end">
                            <Button size="sm" variant="ghost" loading={busy === `${b.id}-no_show`} onClick={() => mark(b, "no_show")}>No-show</Button>
                            <Button size="sm" loading={busy === `${b.id}-completed`} onClick={() => mark(b, "completed")}>Arrived</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
