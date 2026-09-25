import { useState } from "react";
import { Link } from "react-router-dom";
import { HeartHandshake, Star } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Button, EmptyState, ErrorBanner, Field } from "../components/ui";

const PETS = [["", "—"], ["dog", "Dog"], ["cat", "Cat"], ["hamster", "Hamster"], ["love-birds", "Love Birds"]];

export default function Feedback() {
  const { user, ready } = useAuth();
  // Re-mount once we know who is logged in, so name/email are pre-filled.
  return <FeedbackForm key={ready ? user?.id || "anon" : "loading"} user={user} />;
}

function FeedbackForm({ user }) {
  const [form, setForm] = useState(() => ({
    name: user ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username : "",
    email: user?.email || "", phone: "", pet_type: "", pet_holder: "", rating: 5, message: "",
  }));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (sent) {
    return (
      <div className="container page">
        <EmptyState icon={HeartHandshake} title="Thank you!" action={<Link to="/" className="btn btn-primary">Back home</Link>}>
          We read every message. See you and your furry friends soon!
        </EmptyState>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErrors({}); setError(null);
    try { await api.feedback(form); setSent(true); }
    catch (err) { setErrors(err.fields || {}); if (!Object.keys(err.fields || {}).length) setError(err); }
    finally { setBusy(false); }
  };

  return (
    <div className="container page narrow">
      <h1 className="page-title">Share your feedback</h1>
      <p className="muted lead">Tell us how your visit went — the snacks, the service, the pets.</p>
      <form className="card form" onSubmit={submit} noValidate>
        <ErrorBanner error={error} />
        <div className="field">
          <label>Your rating</label>
          <div className="stars" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} role="radio" aria-checked={form.rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`}
                className={n <= form.rating ? "on" : ""} onClick={() => setForm((f) => ({ ...f, rating: n }))}>
                <Star size={28} />
              </button>
            ))}
          </div>
        </div>
        <div className="grid-2">
          <Field label="Name" value={form.name} onChange={set("name")} error={errors.name} required />
          <Field label="Email" type="email" value={form.email} onChange={set("email")} error={errors.email} required />
          <Field label="Phone (optional)" type="tel" value={form.phone} onChange={set("phone")} error={errors.phone} />
          <Field label="Favourite pet" as="select" value={form.pet_type} onChange={set("pet_type")}>
            {PETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Field>
        </div>
        <div className="field">
          <label>Do you have a pet at home?</label>
          <div className="chips">
            {[["yes", "Yes"], ["no", "No"]].map(([v, l]) => (
              <button type="button" key={v} className={`chip ${form.pet_holder === v ? "active" : ""}`}
                onClick={() => setForm((f) => ({ ...f, pet_holder: f.pet_holder === v ? "" : v }))}>{l}</button>
            ))}
          </div>
        </div>
        <Field label="Message" as="textarea" rows={4} value={form.message} onChange={set("message")} error={errors.message}
          placeholder="Share your thoughts…" required />
        <Button type="submit" size="lg" loading={busy}>Send feedback</Button>
      </form>
    </div>
  );
}
