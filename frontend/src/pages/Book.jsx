import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarCheck, Users } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { addDays, isoDate } from "../lib/format";
import { usePolling } from "../lib/usePolling";
import QtyStepper from "../components/QtyStepper";
import { Button, ErrorBanner, Field, Spinner } from "../components/ui";
import { useToast } from "../components/toast";

const PETS = [
  ["any", "Any pet", "🐾"], ["dog", "Dogs", "🐶"], ["cat", "Cats", "🐱"],
  ["hamster", "Hamsters", "🐹"], ["love-birds", "Love birds", "🦜"],
];

export default function Book() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const today = isoDate();
  const [date, setDate] = useState(today);
  const [slot, setSlot] = useState(null);
  const [guests, setGuests] = useState(2);
  const [pet, setPet] = useState("any");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const info = usePolling(() => api.info(), []);
  const avail = usePolling(() => api.availability(date), [date], 30000);
  const days = useMemo(
    () => Array.from({ length: Math.min(info.data?.booking_days_ahead ?? 14, 14) + 1 }, (_, i) => addDays(today, i)),
    [info.data, today]
  );

  const slots = avail.data?.date === date ? avail.data.slots : null;
  const chosen = slots?.find((s) => s.slot === slot);
  const chosenOk = chosen && !chosen.past && chosen.seats_left >= guests;

  const submit = async (e) => {
    e.preventDefault();
    if (!user) { navigate("/login", { state: { from: "/book" } }); return; }
    setBusy(true); setErrors({}); setError(null);
    try {
      await api.book({ date, slot, guests, pet_preference: pet, phone, note });
      toast("Your visit is booked!");
      navigate("/bookings", { replace: true });
    } catch (err) {
      setErrors(err.fields || {});
      setError(err);
      avail.reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <h1>Book a visit</h1>
          <p className="muted">Reserve a table and an hour with our pets. Free — you only pay for what you order.</p>
        </div>
      </div>

      <form className="book" onSubmit={submit} noValidate>
        <div className="stack">
          <div className="card">
            <div className="card-title">1. Pick a day</div>
            <div className="day-strip">
              {days.map((d) => {
                const dt = new Date(`${d}T00:00:00`);
                return (
                  <button type="button" key={d} className={`day ${d === date ? "active" : ""}`} onClick={() => { setDate(d); setSlot(null); }}>
                    <span>{d === today ? "Today" : dt.toLocaleDateString("en-IN", { weekday: "short" })}</span>
                    <b>{dt.getDate()}</b>
                    <span>{dt.toLocaleDateString("en-IN", { month: "short" })}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-title">2. Pick a time</div>
            <ErrorBanner error={avail.error} onRetry={avail.reload} />
            {!slots ? <Spinner /> : (
              <div className="slot-grid">
                {slots.map((s) => {
                  const full = s.seats_left < guests;
                  const disabled = s.past || s.seats_left === 0;
                  return (
                    <button type="button" key={s.slot} disabled={disabled}
                      className={`time ${slot === s.slot ? "active" : ""} ${full && !disabled ? "tight" : ""}`}
                      onClick={() => setSlot(s.slot)}>
                      <b>{s.label}</b>
                      <span>{s.past ? "Passed" : s.seats_left === 0 ? "Full" : `${s.seats_left} seats left`}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {errors.slot && <p className="error-text">{errors.slot}</p>}
          </div>
        </div>

        <div className="card form book-side">
          <div className="card-title">3. Your visit</div>
          <div className="field">
            <label>Guests</label>
            <div className="guests"><Users size={18} /><QtyStepper value={guests} onChange={(g) => setGuests(Math.max(1, Math.min(8, g)))} /><span className="muted small">max 8</span></div>
          </div>
          <div className="field">
            <label>Who do you want to hang out with?</label>
            <div className="chips wrap">
              {PETS.map(([id, label, emoji]) => (
                <button type="button" key={id} className={`chip ${pet === id ? "active" : ""}`} onClick={() => setPet(id)}>{emoji} {label}</button>
              ))}
            </div>
          </div>
          <Field label="Phone (optional)" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} placeholder="+91 98765 43210" />
          <Field label="Anything we should know? (optional)" as="textarea" rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Birthday, allergies, first visit…" />
          {error && !errors.phone && <ErrorBanner error={error} />}
          <div className="book-summary">
            <CalendarCheck size={18} />
            {chosen ? (
              <span><b>{new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</b> at <b>{chosen.label}</b> · {guests} guest{guests > 1 ? "s" : ""}</span>
            ) : <span className="muted">Choose a day and time</span>}
          </div>
          {chosen && !chosenOk && !chosen.past && <p className="error-text">Only {chosen.seats_left} seats left at this time — pick fewer guests or another time.</p>}
          <Button type="submit" size="lg" className="w-full" loading={busy} disabled={!chosenOk}>
            {user ? "Confirm booking" : "Log in to book"}
          </Button>
          {!user && <p className="muted small center">New here? <Link to="/register">Create an account</Link></p>}
        </div>
      </form>
    </div>
  );
}
