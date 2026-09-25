import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { CalendarHeart, ChevronDown, ClipboardList, LayoutDashboard, LogOut, Menu as MenuIcon, ShoppingBag, X } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useCart } from "../lib/cart";
import CartDrawer from "./CartDrawer";

export function Logo() {
  return (
    <Link to="/" className="logo">
      <img src="/logo.png" alt="" width="40" height="40" />
      <span>Pets <b>Cafe</b></span>
    </Link>
  );
}

function AccountMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (!user) {
    return (
      <div className="auth-links">
        <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
        <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
      </div>
    );
  }
  const initial = (user.first_name?.[0] || user.username[0]).toUpperCase();
  return (
    <div className="account" ref={ref}>
      <button className="account-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="avatar">{initial}</span>
        <span className="account-name">{user.first_name || user.username}</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className="dropdown" onClick={() => setOpen(false)}>
          <Link to="/orders"><ClipboardList size={16} /> My orders</Link>
          <Link to="/bookings"><CalendarHeart size={16} /> My bookings</Link>
          {user.is_staff && <Link to="/staff"><LayoutDashboard size={16} /> Staff dashboard</Link>}
          <button onClick={async () => { await logout(); navigate("/"); }}><LogOut size={16} /> Log out</button>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { count, setOpen } = useCart();
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  return (
    <div className="site">
      <header className="topbar">
        <div className="container topbar-inner">
          <button className="icon-btn nav-toggle" onClick={() => setNavOpen((o) => !o)} aria-label="Menu">
            {navOpen ? <X size={22} /> : <MenuIcon size={22} />}
          </button>
          <Logo />
          <nav className={`mainnav ${navOpen ? "open" : ""}`} onClick={() => setNavOpen(false)}>
            <NavLink to="/menu">Menu</NavLink>
            <NavLink to="/book">Book a visit</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/feedback">Feedback</NavLink>
          </nav>
          <div className="topbar-right">
            <button className="cart-btn" onClick={() => setOpen(true)} aria-label={`Cart, ${count} items`}>
              <ShoppingBag size={20} />
              {count > 0 && <span className="cart-count">{count}</span>}
            </button>
            <AccountMenu />
          </div>
        </div>
      </header>

      <main><Outlet /></main>

      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <Logo />
            <p className="muted small">Snacks, coffee and cuddles with our furry friends. KTC Nagar, Tuticorin.</p>
          </div>
          <div className="footer-links">
            <Link to="/menu">Menu</Link>
            <Link to="/book">Book a visit</Link>
            <Link to="/about">About</Link>
            <Link to="/feedback">Feedback</Link>
          </div>
          <div className="footer-links">
            <a href="tel:+918056867639">+91 80568 67639</a>
            <a href="mailto:harideepak.s10@gmail.com">harideepak.s10@gmail.com</a>
          </div>
        </div>
        <div className="container copyright">© {new Date().getFullYear()} Pets Cafe. All rights reserved.</div>
      </footer>

      <CartDrawer />
    </div>
  );
}
