import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PawPrint, LogIn, AlertCircle, Sparkles, CheckCircle2, Building2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/forms.css';

const loginSlides = [
  {
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1600&auto=format&fit=crop',
    title: 'Welcome Back to PawConnect',
    subtitle: 'Your journey of love and rescue companionship continues.',
  },
  {
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1600&auto=format&fit=crop',
    title: 'Adventures Await Every Paw',
    subtitle: 'Check notifications and messages from verified shelters.',
  },
  {
    image: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=1600&auto=format&fit=crop',
    title: 'Ethical & Transparent Adoptions',
    subtitle: 'Connecting passionate families with companions in need.',
  },
  {
    image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=1600&auto=format&fit=crop',
    title: 'Loyal Companions for Life',
    subtitle: 'Track your application status and schedule shelter visits.',
  },
  {
    image: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=1600&auto=format&fit=crop',
    title: 'Small Pets, Endless Affection',
    subtitle: 'Explore rescued rabbits, birds, and small sweet pets.',
  },
];

const autotypeRoles = [
  'Loving Adopter.',
  'Rescue Shelter Hero.',
  'Pet Parent.',
  'Forever Companion.',
  'Caring Family.',
];

const ROLE_DETAILS = {
  adopter: {
    title: 'Welcome Back',
    sub: 'Sign in to your Adopter account',
    badgeText: '✨ Adopter Portal • Browse pets & track applications',
    btnText: 'Sign In as Adopter',
    icon: PawPrint,
  },
  shelter: {
    title: 'Shelter Portal',
    sub: 'Manage listings, visits & adoption reviews',
    badgeText: '🏠 Shelter Staff • Pet listings, visits & approvals',
    btnText: 'Sign In to Shelter Management',
    icon: Building2,
  },
  admin: {
    title: 'Admin Console',
    sub: 'Central network governance & registry oversight',
    badgeText: '🛡️ Network Admin • Central ledger & platform oversight',
    btnText: 'Sign In to Admin Console',
    icon: ShieldCheck,
  },
};

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const redirectUrl = searchParams.get('redirect');

  // Determine initial role from redirect param if present
  const initialRole = redirectUrl?.includes('shelter')
    ? 'shelter'
    : redirectUrl?.includes('admin')
    ? 'admin'
    : 'adopter';

  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [animKey, setAnimKey] = useState(0);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Autotype state
  const [wordIdx, setWordIdx] = useState(0);
  const [subIdx, setSubIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Slider state
  const [currentSlide, setCurrentSlide] = useState(0);

  // 1. Autotype Effect
  useEffect(() => {
    const currentWord = autotypeRoles[wordIdx];

    if (!isDeleting && subIdx === currentWord.length) {
      const pauseTimer = setTimeout(() => setIsDeleting(true), 2000);
      return () => clearTimeout(pauseTimer);
    }

    if (isDeleting && subIdx === 0) {
      setIsDeleting(false);
      setWordIdx((prev) => (prev + 1) % autotypeRoles.length);
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
      setCurrentSlide((prev) => (prev + 1) % loginSlides.length);
    }, 4500);
    return () => clearInterval(slideTimer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await login({ email, password });
      if (redirectUrl) {
        navigate(redirectUrl);
      } else if (res.user.role === 'admin') {
        navigate('/admin-dashboard');
      } else if (res.user.role === 'shelter') {
        navigate('/shelter-dashboard');
      } else {
        navigate('/adopter-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials or login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role, demoEmail, demoPassword) => {
    setSelectedRole(role);
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
    setAnimKey((prev) => prev + 1);
  };

  const typedRole = autotypeRoles[wordIdx].substring(0, subIdx);

  return (
    <div className="split-auth-layout">
      {/* LEFT SIDE: Sliding Pet Images (Right-to-Left) & Autotype Overlay */}
      <div className="split-auth-left">
        {/* Continuous sliding track */}
        <div
          className="split-slider-track"
          style={{
            width: `${loginSlides.length * 100}%`,
            transform: `translateX(-${currentSlide * (100 / loginSlides.length)}%)`,
          }}
        >
          {loginSlides.map((slide, idx) => (
            <div
              key={idx}
              className="split-slider-slide"
              style={{ width: `${100 / loginSlides.length}%` }}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="split-slider-img"
              />
            </div>
          ))}
        </div>

        {/* Emerald Forest Gradient Overlay */}
        <div className="split-slider-overlay" />

        {/* Content on top of the left sliding images */}
        <div className="split-left-content">
          <div className="hero-badge-glass" style={{ alignSelf: 'flex-start' }}>
            <Sparkles size={16} color="#FFD166" /> Welcome to PawConnect
          </div>

          <div className="split-autotype-wrap">
            <h2 className="split-autotype-title">
              Sign In to PawConnect as a <br />
              <span className="split-autotype-dynamic">{typedRole}</span>
              <span className="cursor-blink-light">|</span>
            </h2>
            <p className="split-autotype-sub">
              {loginSlides[currentSlide].subtitle}
            </p>
          </div>

          {/* Quick Perks */}
          <div className="split-perks-list">
            <div className="split-perk-item">
              <CheckCircle2 size={18} color="#52B788" />
              <span>Access saved favorites and tailored PawMatch recommendations</span>
            </div>
            <div className="split-perk-item">
              <CheckCircle2 size={18} color="#52B788" />
              <span>Real-time tracking of adoption review stages and milestones</span>
            </div>
            <div className="split-perk-item">
              <CheckCircle2 size={18} color="#52B788" />
              <span>Manage shelter listings, reviews, and direct applicant chats</span>
            </div>
          </div>

          {/* Slider Dots */}
          <div className="split-slider-dots">
            {loginSlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`split-slider-dot ${idx === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Compact Login Form with Dynamic Role Morphing Animation */}
      <div className="split-auth-right">
        <div key={`card-${animKey}-${selectedRole}`} className={`split-form-card role-${selectedRole} card-diagonal-transition`}>
          {/* Header */}
          <div className="split-form-header">
            <div
              key={`badge-${animKey}-${selectedRole}`}
              className={`split-logo-badge role-${selectedRole} badge-pop-anim`}
            >
              {selectedRole === 'shelter' ? (
                <Building2 size={22} />
              ) : selectedRole === 'admin' ? (
                <ShieldCheck size={22} />
              ) : (
                <PawPrint size={22} />
              )}
            </div>
            <div>
              <h1 className="split-form-title" key={`title-${animKey}`}>
                {ROLE_DETAILS[selectedRole].title}
              </h1>
              <p className="split-form-sub" key={`sub-${animKey}`}>
                {ROLE_DETAILS[selectedRole].sub}
              </p>
            </div>
          </div>

          {/* 1-Click College CA2 Demo Accounts with Active Morphing */}
          <div className="compact-demo-box">
            <div className="compact-demo-title">
              <Sparkles size={13} color="var(--color-primary)" /> Select Role (1-Click Demo Switch)
            </div>
            <div className="compact-demo-btns">
              <button
                type="button"
                className={`compact-demo-btn ${selectedRole === 'adopter' ? 'active adopter' : ''}`}
                onClick={() => handleRoleSelect('adopter', 'adopter@pawconnect.org', 'password123')}
              >
                <span>👤 Adopter</span>
              </button>
              <button
                type="button"
                className={`compact-demo-btn ${selectedRole === 'shelter' ? 'active shelter' : ''}`}
                onClick={() => handleRoleSelect('shelter', 'shelter@demo.com', 'password123')}
              >
                <span>🏠 Shelter</span>
              </button>
              <button
                type="button"
                className={`compact-demo-btn ${selectedRole === 'admin' ? 'active admin' : ''}`}
                onClick={() => handleRoleSelect('admin', 'admin@pawconnect.org', 'admin123')}
                title="Admin Superuser Demo"
              >
                <span>🛡️ Admin</span>
              </button>
            </div>

            {/* Dynamic Role Feature Pill */}
            <div
              key={`banner-${animKey}-${selectedRole}`}
              className={`role-preview-banner ${selectedRole}`}
            >
              {ROLE_DETAILS[selectedRole].badgeText}
            </div>
          </div>

          {error && (
            <div className="compact-alert-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form key={`form-${animKey}`} onSubmit={handleSubmit} className="compact-register-form role-switch-anim">
            <div className="compact-form-group" style={{ marginBottom: '0.75rem' }}>
              <label className="compact-label">Email Address</label>
              <input
                key={`email-${animKey}`}
                type="email"
                className="compact-input flash-pulse"
                placeholder="e.g. adopter@pawconnect.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="compact-form-group" style={{ marginBottom: '0.85rem' }}>
              <label className="compact-label">Password</label>
              <input
                key={`pass-${animKey}`}
                type="password"
                className="compact-input flash-pulse"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className={`compact-submit-btn role-${selectedRole}`}
              disabled={loading}
            >
              {loading ? (
                'Authenticating...'
              ) : (
                <>
                  {selectedRole === 'shelter' ? (
                    <Building2 size={16} />
                  ) : selectedRole === 'admin' ? (
                    <ShieldCheck size={16} />
                  ) : (
                    <LogIn size={16} />
                  )}
                  <span>{ROLE_DETAILS[selectedRole].btnText}</span>
                </>
              )}
            </button>
          </form>

          <div className="compact-form-footer">
            Don't have an account?{' '}
            <Link to="/register" className="compact-link">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
