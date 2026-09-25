import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarHeart } from "lucide-react";
import { api } from "../lib/api";
import { STATUS_TONE, longDate } from "../lib/format";
import { usePolling } from "../lib/usePolling";
import { Badge, Button, EmptyState, ErrorBanner, Modal, Spinner } from "../components/ui";
import { useToast } from "../components/toast";

const PET_EMOJI = { any: "🐾", dog: "🐶", cat: "🐱", hamster: "🐹", "love-birds": "🦜" };

export default function MyBookings() {
  const { data, error, loading, reload } = usePolling(() => api.myBookings(), []);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const cancel = async () => {
    setBusy(true);
    try { await api.cancelBooking(confirm.id); toast("Booking cancelled"); setConfirm(null); reload(); }
    catch (err) { toast(err.message, "error"); }
    finally { setBusy(false); }
  };

  const upcoming = (data || []).filter((b) => b.can_cancel);
  const past = (data || []).filter((b) => !b.can_cancel);

  return (
    <div className="container page narrow">
      <div className="page-head">
        <h1>My bookings</h1>
        <Link to="/book" className="btn btn-primary">New booking</Link>
      </div>
      <ErrorBanner error={error} onRetry={reload} />
      {loading && !data ? <Spinner /> : data?.length === 0 ? (
        <EmptyState icon={CalendarHeart} title="No bookings yet" action={<Link to="/book" className="btn btn-primary">Book a visit</Link>}>
          Reserve an hour with our pets.
        </EmptyState>
      ) : (
        <>
          {upcoming.length > 0 && <h2 className="list-title">Upcoming</h2>}
          <div className="stack">
            {upcoming.map((b) => (
              <article key={b.id} className="card booking">
                <div className="booking-date"><b>{new Date(`${b.date}T00:00:00`).getDate()}</b><span>{new Date(`${b.date}T00:00:00`).toLocaleDateString("en-IN", { month: "short" })}</span></div>
                <div className="booking-info">
                  <h3>{longDate(b.date)} · {b.slot_label}</h3>
                  <span className="muted small">{b.guests} guest{b.guests > 1 ? "s" : ""} · {PET_EMOJI[b.pet_preference]} {b.pet_label}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setConfirm(b)}>Cancel</Button>
              </article>
            ))}
          </div>
          {past.length > 0 && <h2 className="list-title">Past &amp; cancelled</h2>}
          <div className="stack">
            {past.map((b) => (
              <article key={b.id} className="card booking past">
                <div className="booking-date"><b>{new Date(`${b.date}T00:00:00`).getDate()}</b><span>{new Date(`${b.date}T00:00:00`).toLocaleDateString("en-IN", { month: "short" })}</span></div>
                <div className="booking-info">
                  <h3>{longDate(b.date)} · {b.slot_label}</h3>
                  <span className="muted small">{b.guests} guest{b.guests > 1 ? "s" : ""} · {b.pet_label}</span>
                </div>
                <Badge tone={STATUS_TONE[b.status] || "gray"}>{b.status === "confirmed" ? "Visited" : b.status_label}</Badge>
              </article>
            ))}
          </div>
        </>
      )}
      <Modal open={!!confirm} title="Cancel this booking?" onClose={() => setConfirm(null)}
        footer={<><Button variant="ghost" onClick={() => setConfirm(null)}>Keep it</Button><Button variant="danger" loading={busy} onClick={cancel}>Cancel booking</Button></>}>
        {confirm && <p>{longDate(confirm.date)} at {confirm.slot_label} for {confirm.guests}. Your seats will go to someone else.</p>}
      </Modal>
    </div>
  );
}
