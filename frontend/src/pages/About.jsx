import { Link } from "react-router-dom";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

export default function About() {
  return (
    <div className="container page">
      <div className="about">
        <div className="about-copy">
          <span className="eyebrow">About us</span>
          <h1>Where passion for pets meets great food.</h1>
          <p>
            Hello, I'm <b>Harideepak</b>, the founder of <b>Pets Cafe</b> in the heart of Tuticorin. Pets Cafe is the
            perfect spot to relax, unwind and enjoy delicious snacks while spending time with our adorable furry friends.
          </p>
          <p>
            Whether you're a pet owner or simply an animal lover, come in, grab a coffee and make some new four-legged
            friends. We believe in a warm, welcoming space for humans and pets alike — a place where you can feel the joy
            of having a pet, even if just for a while.
          </p>
          <p>
            From crispy puffs to cheesy pizzas, there's something for everyone — and our pets are always around to keep you
            company.
          </p>
          <div className="btn-row">
            <Link to="/book" className="btn btn-primary">Book a visit</Link>
            <Link to="/menu" className="btn btn-secondary">See the menu</Link>
          </div>
        </div>
        <div className="about-side">
          <img src="/images/pastries.webp" alt="Fresh pastries at Pets Cafe" />
          <div className="card info-card">
            <p><MapPin size={18} /> KTC Nagar, Tuticorin</p>
            <p><Clock size={18} /> Open daily, 10 AM – 9 PM</p>
            <p><Phone size={18} /> <a href="tel:+918056867639">+91 80568 67639</a></p>
            <p><Mail size={18} /> <a href="mailto:harideepak.s10@gmail.com">harideepak.s10@gmail.com</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
