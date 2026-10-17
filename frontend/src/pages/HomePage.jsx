import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Sparkles, ArrowRight, ChevronLeft, ChevronRight, 
  ShieldCheck, Heart, Mail, Phone, MapPin, Send, CheckCircle2, 
  AlertCircle, Award, Users 
} from 'lucide-react';
import { commonApi } from '../api/commonApi';
import '../styles/home.css';
import '../styles/about-contact.css';

const heroSlides = [
  {
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1600&auto=format&fit=crop&q=85',
    tag: 'Dogs & Puppies',
    caption: 'Bella & Friends • Playful & Loving Companions',
  },
  {
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1600&auto=format&fit=crop&q=85',
    tag: 'Cats & Kittens',
    caption: 'Milo • Sweet Purrs & Warm Sunlit Cuddles',
  },
  {
    image: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=1600&auto=format&fit=crop&q=85',
    tag: 'Forever Families',
    caption: 'Every Rescue Adoption Saves Two Lives',
  },
  {
    image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=1600&auto=format&fit=crop&q=85',
    tag: 'Active Companions',
    caption: 'Luna • Agile, Smart & Ready For Adventures',
  },
  {
    image: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=1600&auto=format&fit=crop&q=85',
    tag: 'Small Rescue Pets',
    caption: 'Thumper • Gentle & Indoor Litter Trained',
  },
];

const autotypeWords = [
  'Best Friend.',
  'Loving Companion.',
  'Soulmate.',
  'Forever Playmate.',
  'Family Member.',
];

const HomePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Autotype state
  const [wordIdx, setWordIdx] = useState(0);
  const [subIdx, setSubIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Slider state
  const [currentSlide, setCurrentSlide] = useState(0);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: 'General Adoption Inquiry',
    message: '',
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(null);
  const [contactError, setContactError] = useState(null);

  // 1. Autotype Effect
  useEffect(() => {
    const currentWord = autotypeWords[wordIdx];

    if (!isDeleting && subIdx === currentWord.length) {
      const pauseTimer = setTimeout(() => setIsDeleting(true), 2000);
      return () => clearTimeout(pauseTimer);
    }

    if (isDeleting && subIdx === 0) {
      setIsDeleting(false);
      setWordIdx((prev) => (prev + 1) % autotypeWords.length);
      return;
    }

    const typeTimer = setTimeout(() => {
      setSubIdx((prev) => prev + (isDeleting ? -1 : 1));
    }, isDeleting ? 45 : 110);

    return () => clearTimeout(typeTimer);
  }, [subIdx, isDeleting, wordIdx]);

  // 2. Sliding Images Carousel Effect (Right-to-Left)
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 2800);
    return () => clearInterval(slideTimer);
  }, []);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/pets?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/pets');
    }
  };

  const handleContactChange = (e) => {
    setContactForm({ ...contactForm, [e.target.name]: e.target.value });
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactLoading(true);
    setContactError(null);
    setContactSuccess(null);

    try {
      const res = await commonApi.sendContactMessage(contactForm);
      setContactSuccess(res.message || 'Thank you! Your message was received and saved in MongoDB.');
      setContactForm({
        name: '',
        email: '',
        subject: 'General Adoption Inquiry',
        message: '',
      });
    } catch (err) {
      setContactError(err.response?.data?.error || 'Failed to submit message.');
    } finally {
      setContactLoading(false);
    }
  };

  const typedText = autotypeWords[wordIdx].substring(0, subIdx);

  return (
    <div>
      {/* ================= 1. HOME SECTION (HERO SLIDER) ================= */}
      <section id="home" className="hero-section">
        {/* Full-bleed Background Slider Images sliding from right to left */}
        <div className="hero-bg-slider">
          <div
            className="hero-bg-track"
            style={{
              width: `${heroSlides.length * 100}%`,
              transform: `translateX(-${currentSlide * (100 / heroSlides.length)}%)`,
            }}
          >
            {heroSlides.map((slide, idx) => (
              <div
                key={idx}
                className="hero-bg-slide"
                style={{ width: `${100 / heroSlides.length}%` }}
              >
                <img
                  src={slide.image}
                  alt={slide.caption}
                  className="hero-bg-image"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Semi-transparent Forest Green Overlay for text readability */}
        <div className="hero-bg-overlay" />

        {/* Foreground Content positioned cleanly over the full sliding background */}
        <div className="container hero-foreground">
          <div className="hero-content-box">
            <div className="hero-badge-glass">
              <Sparkles size={16} color="#FFD166" /> 100% Ethical & Verified Pet Adoption
            </div>
            
            <h1 className="hero-title-light">
              Find Your <br />
              <span className="autotype-highlight">{typedText}</span>
              <span className="cursor-blink-light">|</span>
              <br />
              <span style={{ fontSize: '0.85em', color: '#FFFFFF', fontWeight: 600 }}>
                Give Them a Forever Home.
              </span>
            </h1>

            <p className="hero-subtitle-light">
              PawConnect connects loving families with rescue pets in verified shelters. Explore available dogs, cats, rabbits, and birds ready to bring joy and warmth into your home.
            </p>

            {/* Quick Search Bar */}
            <form onSubmit={handleSearchSubmit} className="hero-search-glass">
              <Search size={22} color="var(--color-primary)" style={{ marginLeft: '0.5rem' }} />
              <input
                type="text"
                placeholder="Search by name, breed (e.g. Golden, Beagle, Tabby)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Search Pets
              </button>
            </form>

            {/* Call to Action Buttons */}
            <div className="hero-actions-light">
              <Link to="/pets" className="btn btn-primary btn-lg" style={{ backgroundColor: 'var(--color-primary-light)', borderColor: '#40916C' }}>
                Browse Available Pets <ArrowRight size={18} />
              </Link>
              <Link to="/pawmatch" className="btn btn-outline btn-lg" style={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <Sparkles size={18} color="#FFD166" /> Take PawMatch Quiz
              </Link>
            </div>

            {/* Bottom Slider Navigator Bar */}
            <div className="hero-slider-nav-bar">
              <div className="slide-caption-pill">
                <span style={{ color: '#FFD166', fontWeight: 700 }}>{heroSlides[currentSlide].tag}</span>
                <span>•</span>
                <span>{heroSlides[currentSlide].caption}</span>
              </div>

              <div className="slider-controls-group">
                <button
                  type="button"
                  className="slider-arrow-btn-light"
                  onClick={handlePrevSlide}
                  aria-label="Previous Background Slide"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="slider-dots-light">
                  {heroSlides.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      className={`slider-dot-light ${dotIdx === currentSlide ? 'active' : ''}`}
                      onClick={() => setCurrentSlide(dotIdx)}
                      aria-label={`Go to background slide ${dotIdx + 1}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  className="slider-arrow-btn-light"
                  onClick={handleNextSlide}
                  aria-label="Next Background Slide"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 2. ABOUT SECTION ================= */}
      <section id="about" className="section" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <div className="section-header">
            <span className="section-subtitle">Our Purpose</span>
            <h2 className="section-title">About PawConnect</h2>
            <p className="section-desc">
              Every rescue animal deserves a safe, caring, and loving forever home. We connect ethical adopters with authorized local animal shelters.
            </p>
          </div>

          <div className="grid-2" style={{ alignItems: 'center', gap: '3rem', marginBottom: '3.5rem' }}>
            <div>
              <h3 style={{ color: 'var(--color-primary)', marginBottom: '1rem', fontSize: '1.75rem' }}>
                Connecting Compassion with Rescue Animals
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>
                Millions of healthy, affectionate pets end up in shelters every year due to lifestyle changes, relocations, or lack of pet care awareness.
              </p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                PawConnect eliminates obstacles through transparent medical histories, educational readiness checks, and our custom rule-based <strong>PawMatch</strong> algorithm.
              </p>
              <Link to="/pets" className="btn btn-primary">
                Explore Available Pets <ArrowRight size={16} />
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

          {/* Three Core Pillars */}
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon-box">
                <ShieldCheck size={26} />
              </div>
              <h4 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem', fontSize: '1.15rem' }}>
                100% Verified Shelters
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Every listed rescue partner is authorized, guaranteeing proper medical checks and humane care standards.
              </p>
            </div>

            <div className="value-card">
              <div className="value-icon-box">
                <Sparkles size={26} color="var(--color-accent)" />
              </div>
              <h4 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem', fontSize: '1.15rem' }}>
                Smart PawMatch Engine
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Our rule-based quiz analyzes lifestyle, housing, and activity preferences with transparent explanations.
              </p>
            </div>

            <div className="value-card">
              <div className="value-icon-box">
                <Heart size={26} color="#EF4444" fill="#EF4444" />
              </div>
              <h4 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem', fontSize: '1.15rem' }}>
                Real-Time Tracking
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Follow adoption progression with visual multi-stage status trackers and MongoDB-backed records.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 3. CONTACT SECTION ================= */}
      <section id="contact" className="section" style={{ backgroundColor: 'var(--bg-alt)' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <div className="section-header">
            <span className="section-subtitle">Get in Touch</span>
            <h2 className="section-title">Contact PawConnect</h2>
            <p className="section-desc">
              Have questions regarding pet adoption or shelter partner registration? Send us a message below.
            </p>
          </div>

          <div className="contact-grid">
            {/* Left: Contact Info */}
            <div className="contact-info-card">
              <h3 style={{ color: 'var(--color-primary)', marginBottom: '1.25rem' }}>
                Contact Information
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                Our adoption support team and shelter coordinators are here to assist you throughout the journey.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', boxShadow: 'var(--shadow-xs)' }}>
                    <Mail size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Email Inquiries</div>
                    <strong style={{ color: 'var(--color-primary)', fontSize: '0.95rem' }}>support@pawconnect.org</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', boxShadow: 'var(--shadow-xs)' }}>
                    <Phone size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Helpline Phone</div>
                    <strong style={{ color: 'var(--color-primary)', fontSize: '0.95rem' }}>+1 (800) 555-PAWS (7297)</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', boxShadow: 'var(--shadow-xs)' }}>
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Campus Project Office</div>
                    <strong style={{ color: 'var(--color-primary)', fontSize: '0.95rem' }}>Department of CSE, B.Tech Campus</strong>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '2.5rem', padding: '1rem', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary-border)', fontSize: '0.85rem', color: 'var(--color-primary)' }}>
                <strong>MongoDB Live Storage:</strong> Inquiries submitted through this form are stored in the MongoDB <code>contact_messages</code> collection.
              </div>
            </div>

            {/* Right: Contact Form */}
            <div className="card" style={{ padding: '2.5rem', backgroundColor: '#FFFFFF' }}>
              <h3 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                Send us a Message
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Fill in the details below and our team will get in touch.
              </p>

              {contactSuccess && (
                <div className="alert alert-success">
                  <CheckCircle2 size={18} />
                  <div>{contactSuccess}</div>
                </div>
              )}

              {contactError && (
                <div className="alert alert-error">
                  <AlertCircle size={18} />
                  <div>{contactError}</div>
                </div>
              )}

              <form onSubmit={handleContactSubmit}>
                <div className="form-group">
                  <label className="form-label">Your Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    placeholder="e.g. Alex Morgan"
                    value={contactForm.name}
                    onChange={handleContactChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    placeholder="e.g. alex@example.com"
                    value={contactForm.email}
                    onChange={handleContactChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select
                    name="subject"
                    className="form-select"
                    value={contactForm.subject}
                    onChange={handleContactChange}
                  >
                    <option value="General Adoption Inquiry">General Adoption Inquiry</option>
                    <option value="Shelter Partnership Request">Shelter Partnership Request</option>
                    <option value="Application Follow-up">Application Follow-up</option>
                    <option value="Technical or Website Feedback">Technical or Website Feedback</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Your Message *</label>
                  <textarea
                    name="message"
                    className="form-textarea"
                    placeholder="Write your questions or message here..."
                    value={contactForm.message}
                    onChange={handleContactChange}
                    rows={4}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: '0.5rem' }}
                  disabled={contactLoading}
                >
                  {contactLoading ? 'Saving to MongoDB...' : (
                    <>
                      <Send size={18} /> Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
