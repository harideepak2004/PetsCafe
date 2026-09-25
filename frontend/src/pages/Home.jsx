import { Link } from "react-router-dom";
import { ArrowRight, CalendarHeart, Coffee, HeartHandshake, PawPrint, ShoppingBag } from "lucide-react";
import { api } from "../lib/api";
import { usePolling } from "../lib/usePolling";
import MenuCard from "../components/MenuCard";

const PETS = [
  { emoji: "🐶", name: "Dogs", text: "Gentle, well-trained pups who love belly rubs." },
  { emoji: "🐱", name: "Cats", text: "Lazy loungers — let them come to you." },
  { emoji: "🐹", name: "Hamsters", text: "Tiny, curious and endlessly busy." },
  { emoji: "🦜", name: "Love birds", text: "A cheerful chirpy soundtrack for your coffee." },
];

export default function Home() {
  const { data: menu } = usePolling(() => api.menu(), []);
  const featured = (menu || []).filter((m) => m.is_featured && m.is_available).slice(0, 6);

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow"><PawPrint size={14} /> Tuticorin's cafe for pet lovers</span>
            <h1>Coffee, snacks &amp; <span className="accent">furry friends.</span></h1>
            <p>Order from your table or for takeaway, and book an hour with our dogs, cats, hamsters and love birds.</p>
            <div className="btn-row">
              <Link className="btn btn-primary btn-lg" to="/menu"><ShoppingBag size={18} /> <span>Order now</span></Link>
              <Link className="btn btn-secondary btn-lg" to="/book"><CalendarHeart size={18} /> <span>Book a visit</span></Link>
            </div>
          </div>
          <div className="hero-art">
            <img src="/images/hero-dog.webp" alt="A dog waiting for a cupcake at the cafe counter" />
            <div className="hero-sticker"><Coffee size={18} /> Fresh brew · 10 AM – 9 PM</div>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="container section">
          <div className="section-head">
            <h2>Customer favourites</h2>
            <Link to="/menu" className="link-arrow">Full menu <ArrowRight size={16} /></Link>
          </div>
          <div className="menu-grid">{featured.map((m) => <MenuCard key={m.id} item={m} />)}</div>
        </section>
      )}

      <section className="container section">
        <div className="section-head"><h2>Meet the gang</h2></div>
        <div className="pets">
          {PETS.map((p) => (
            <div className="pet" key={p.name}>
              <span className="pet-emoji" aria-hidden="true">{p.emoji}</span>
              <h3>{p.name}</h3>
              <p className="muted small">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="promo">
          <div className="promo-img"><img src="/images/donut.webp" alt="" /></div>
          <div className="promo-copy">
            <HeartHandshake size={28} />
            <h2>An hour of pet time, on us.</h2>
            <p>Book a table and pick who you'd like to hang out with. Seats are limited each hour so the pets get their naps.</p>
            <Link to="/book" className="btn btn-primary">Pick a time <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
