import React from 'react';
import { Link } from 'react-router-dom';
import { PawPrint, Heart, ShieldCheck, Users, Sparkles, ArrowRight, Award } from 'lucide-react';
import '../styles/about-contact.css';

const AboutPage = () => {
  return (
    <div>
      {/* Hero */}
      <section className="about-hero">
        <div className="container" style={{ maxWidth: '780px' }}>
          <span className="section-subtitle">Our Purpose</span>
          <h1 style={{ color: 'var(--color-primary)', fontSize: '2.8rem', marginBottom: '1rem' }}>
            About PawConnect
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6 }}>
            PawConnect is a modern, student-engineered Pet Adoption Platform created for college evaluation in Django & full-stack web technologies. We connect compassionate adopters with verified rescue shelters.
          </p>
        </div>
      </section>

      {/* Mission & Story */}
      <section className="section">
        <div className="container" style={{ maxWidth: '960px' }}>
          <div className="grid-2" style={{ alignItems: 'center', gap: '3rem' }}>
            <div>
              <span className="section-subtitle">Our Philosophy</span>
              <h2 style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>
                Every Pet Deserves a Safe, Loving Forever Home
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>
                Millions of healthy, friendly animals end up in rescue shelters each year simply due to human life changes, economic circumstances, or lack of adoption awareness.
              </p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                PawConnect eliminates hurdles by offering transparent animal health histories, interactive readiness guidance, and our custom rule-based <strong>PawMatch</strong> algorithm to ensure humans and pets form lasting, harmonious bonds.
              </p>
              <Link to="/pets" className="btn btn-primary">
                Browse Pets Ready for Homes <ArrowRight size={16} />
              </Link>
            </div>

            <div>
              <img
                src="https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop"
                alt="Rescue animal companions"
                style={{ borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', width: '100%' }}
              />
            </div>
          </div>

          {/* Pillars */}
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon-box">
                <ShieldCheck size={26} />
              </div>
              <h3 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>
                Verified Shelters
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Every listed shelter and rescue organization is authorized, maintaining proper medical records and humane care standards.
              </p>
            </div>

            <div className="value-card">
              <div className="value-icon-box">
                <Sparkles size={26} color="var(--color-accent)" />
              </div>
              <h3 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>
                Thoughtful Matching
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Our rule-based PawMatch quiz analyzes lifestyle, housing, and activity preferences without external black-box AI dependencies.
              </p>
            </div>

            <div className="value-card">
              <div className="value-icon-box">
                <Heart size={26} color="#EF4444" fill="#EF4444" />
              </div>
              <h3 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>
                Transparent Workflow
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Adopters track real-time progression from submission to handover through visual status trackers with complete MongoDB persistence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Academic Attribution Banner */}
      <section className="section" style={{ backgroundColor: 'var(--color-primary-subtle)', borderTop: '1px solid var(--color-primary-border)' }}>
        <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#FFFFFF', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-primary-border)', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>
            <Award size={16} /> B.Tech Django CA2 Project Evaluation
          </div>
          <h2 style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>
            Architected for Simplicity, Power & Understanding
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Built using Python Django, Django REST Framework, MongoDB (via PyMongo), and React with Vite. Every feature is intentionally designed to be clean, modular, and easy to explain in viva questions.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/contact" className="btn btn-outline">
              Contact Us
            </Link>
            <Link to="/register" className="btn btn-primary">
              Join PawConnect
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
