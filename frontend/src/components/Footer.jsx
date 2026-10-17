import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PawPrint, Heart, Sparkles, ShieldCheck, Mail, MapPin } from 'lucide-react';
import '../styles/footer.css';

const Footer = () => {
  const location = useLocation();

  if (location.pathname === '/register' || location.pathname === '/login') {
    return null;
  }

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          {/* Brand info */}
          <div>
            <div className="footer-brand-title">
              <PawPrint size={24} color="#52B788" />
              Paw<span>Connect</span>
            </div>
            <p className="footer-desc">
              "Find Your Best Friend. Give Them a Forever Home." Connecting caring adopters with verified rescue shelters.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#D8F3DC', fontSize: '0.85rem' }}>
              <ShieldCheck size={16} /> 100% Ethical & Verified Pet Adoption
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <div className="footer-col-title">Navigation</div>
            <ul className="footer-links">
              <li><Link to="/" className="footer-link">Home</Link></li>
              <li><Link to="/pets" className="footer-link">Browse Pets</Link></li>
              <li><Link to="/pawmatch" className="footer-link">PawMatch Quiz</Link></li>
              <li><Link to="/readiness-checklist" className="footer-link">Readiness Checklist</Link></li>
              <li><Link to="/about" className="footer-link">About PawConnect</Link></li>
              <li><Link to="/contact" className="footer-link">Contact Us</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <div className="footer-col-title">Pet Types</div>
            <ul className="footer-links">
              <li><Link to="/pets?species=Dog" className="footer-link">Dogs for Adoption</Link></li>
              <li><Link to="/pets?species=Cat" className="footer-link">Cats for Adoption</Link></li>
              <li><Link to="/pets?species=Rabbit" className="footer-link">Rabbits for Adoption</Link></li>
              <li><Link to="/pets?species=Bird" className="footer-link">Birds for Adoption</Link></li>
              <li><Link to="/login" className="footer-link">Shelter Portal</Link></li>
            </ul>
          </div>

          {/* Academic Info & Stack */}
          <div>
            <div className="footer-col-title">B.Tech CA2 Project</div>
            <p style={{ color: 'var(--text-inverse-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              Designed as a full-stack engineering demonstration combining React, Django REST, and MongoDB.
            </p>
            <div className="tech-badge-container">
              <span className="tech-badge">React + Vite</span>
              <span className="tech-badge">Django REST Framework</span>
              <span className="tech-badge">MongoDB + PyMongo</span>
              <span className="tech-badge">JWT Authentication</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <div>
            &copy; {new Date().getFullYear()} PawConnect. Built for college evaluation. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            Built with <Heart size={14} color="#EF4444" fill="#EF4444" /> for shelter pets everywhere
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
