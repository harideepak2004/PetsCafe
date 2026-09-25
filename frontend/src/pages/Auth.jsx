import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { CalendarHeart, ClipboardList, ShoppingBag } from "lucide-react";
import { Logo } from "../components/Layout";
import { Button, ErrorBanner, Field } from "../components/ui";
import { useAuth } from "../lib/auth";

function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <div className="auth-panel">
        <Logo />
        <div className="auth-card">
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
        </div>
        <p className="auth-foot">{footer}</p>
      </div>
      <aside className="auth-aside" aria-hidden="true">
        <div>
          <img src="/images/hero-dog.webp" alt="" className="auth-img" />
          <h2>Snacks, coffee and cuddles.</h2>
          <ul>
            <li><ShoppingBag size={18} /> Order from your table or for takeaway</li>
            <li><ClipboardList size={18} /> Follow your order live</li>
            <li><CalendarHeart size={18} /> Book an hour with our pets</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

export function Login() {
  const { login, user } = useAuth();
  const [alreadyIn] = useState(() => !!user);
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (alreadyIn) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(form);
      navigate(location.state?.from || "/menu", { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to order and book your visits."
      footer={<>New here? <Link to="/register" state={location.state}>Create an account</Link></>}
    >
      <form className="form" onSubmit={submit}>
        <ErrorBanner error={error} />
        <Field label="Username or email" autoComplete="username" value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })} required autoFocus />
        <Field label="Password" type="password" autoComplete="current-password" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <Button type="submit" size="lg" loading={busy} className="w-full">Log in</Button>
      </form>
    </AuthLayout>
  );
}

export function Register() {
  const { register, user } = useAuth();
  const [alreadyIn] = useState(() => !!user);
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ first_name: "", last_name: "", username: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (alreadyIn) return <Navigate to="/" replace />;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setErrors({ confirm: "Passwords don't match." });
      return;
    }
    setBusy(true);
    setErrors({});
    setError(null);
    try {
      const { confirm: _confirm, ...details } = form;
      await register(details);
      navigate(location.state?.from || "/menu", { replace: true });
    } catch (err) {
      const fields = err.fields || {};
      if (fields.password === undefined && err.data?.non_field_errors) fields.password = err.data.non_field_errors.join(" ");
      setErrors(fields);
      if (!Object.keys(fields).length) setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It takes less than a minute."
      footer={<>Already have an account? <Link to="/login" state={location.state}>Log in</Link></>}
    >
      <form className="form" onSubmit={submit} noValidate>
        <ErrorBanner error={error} />
        <div className="grid-2">
          <Field label="First name" value={form.first_name} onChange={set("first_name")} error={errors.first_name} autoComplete="given-name" required />
          <Field label="Last name" value={form.last_name} onChange={set("last_name")} error={errors.last_name} autoComplete="family-name" />
        </div>
        <Field label="Username" value={form.username} onChange={set("username")} error={errors.username} autoComplete="username" required />
        <Field label="Email" type="email" value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" required />
        <Field label="Password" type="password" value={form.password} onChange={set("password")} error={errors.password}
          hint="At least 8 characters, not too common." autoComplete="new-password" required />
        <Field label="Confirm password" type="password" value={form.confirm} onChange={set("confirm")} error={errors.confirm} autoComplete="new-password" required />
        <Button type="submit" size="lg" loading={busy} className="w-full">Create account</Button>
      </form>
    </AuthLayout>
  );
}
