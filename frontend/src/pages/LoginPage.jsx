import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  PawPrint,
  ArrowRight,
  AlertCircle,
  Heart,
  Calendar,
  Users,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GoogleAuthButton from '../components/GoogleAuthButton';
import PawConnectLogo from '../components/PawConnectLogo';
import TurnstileWidget from '../components/TurnstileWidget';
import '../styles/login-page.css';

// High-resolution pet photos matching the reference mockup
const LOGIN_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=1600&auto=format&fit=crop&q=85',
    alt: 'Puppy and kitten cuddling together in green grass',
  },
  {
    image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=1600&auto=format&fit=crop&q=85',
    alt: 'Golden retriever companion outdoors',
  },
  {
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1600&auto=format&fit=crop&q=85',
    alt: 'Cute tabby cat companion',
  },
  {
    image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=1600&auto=format&fit=crop&q=85',
    alt: 'Loyal companion rescue pet',
  },
  {
    image: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=1600&auto=format&fit=crop&q=85',
    alt: 'Cute rescue rabbit',
  },
];

const ROLE_CONFIG = {
  adopter: {
    title: 'Adopter Login',
    sub: 'Sign in to access your PawConnect account',
    btnText: 'Sign In as Adopter',
    defaultEmail: 'adopter@pawconnect.org',
    defaultPassword: 'password123',
    icon: PawPrint,
  },
  shelter: {
    title: 'Shelter Login',
    sub: 'Sign in to access your shelter management portal',
    btnText: 'Sign In as Shelter',
    defaultEmail: 'shelter@demo.com',
    defaultPassword: 'password123',
    icon: Building2,
  },
  admin: {
    title: 'Admin Login',
    sub: 'Sign in to access platform governance controls',
    btnText: 'Sign In as Admin',
    defaultEmail: 'admin@pawconnect.org',
    defaultPassword: 'admin123',
    icon: ShieldCheck,
  },
};

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const redirectUrl = searchParams.get('redirect');

  // Determine initial role
  const initialRole = redirectUrl?.includes('shelter')
    ? 'shelter'
    : redirectUrl?.includes('admin')
    ? 'admin'
    : 'adopter';

  const [email, setEmail] = useState(ROLE_CONFIG[initialRole].defaultEmail);
  const [password, setPassword] = useState(ROLE_CONFIG[initialRole].defaultPassword);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState('');

  // Slider state
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance image slider every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % LOGIN_SLIDES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // Role state: tracks current and previous role so background changes ONCE during transition and remains
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [prevRole, setPrevRole] = useState(null);
  const [transitionKey, setTransitionKey] = useState(0);

  // Handle Role Tab change with demo credentials pre-fill and diagonal transition
  const handleRoleSelect = (role) => {
    if (role === selectedRole) return;
    setPrevRole(selectedRole);
    setSelectedRole(role);
    setTransitionKey((prev) => prev + 1);
    setEmail(ROLE_CONFIG[role].defaultEmail);
    setPassword(ROLE_CONFIG[role].defaultPassword);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!turnstileToken) {
      setError('Please click the "Verify you are human" checkbox before signing in.');
      setLoading(false);
      return;
    }

    try {
      const res = await login({ email, password, turnstile_token: turnstileToken });
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

  const currentRoleConfig = ROLE_CONFIG[selectedRole] || ROLE_CONFIG.adopter;
  const RoleIcon = currentRoleConfig.icon;

  return (
    <div className="login-page-container">
      {/* High-Quality Scenic Background Image Backdrop */}
      <div className="login-bg-scene" aria-hidden="true">
        <img
          src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=2400&auto=format&fit=crop&q=85"
          alt="Joyful rescued dogs running freely in sunny meadow - PawConnect Pet Adoption"
          className="login-bg-img"
        />
        <div className="login-bg-gradient-overlay" />
      </div>

      {/* Floating Paw Print Watermarks */}
      <PawPrint size={72} className="login-watermark-paw paw-left-1" />
      <PawPrint size={90} className="login-watermark-paw paw-left-2" />
      <PawPrint size={84} className="login-watermark-paw paw-right-1" />
      <PawPrint size={64} className="login-watermark-paw paw-right-2" />

      {/* Site Brand Logo in Corner Outside the Login Card */}
      <Link to="/" className="login-corner-brand" aria-label="PawConnect Pet Adoption Portal Home">
        <PawConnectLogo
          size="md"
          variant="full"
          theme="dark"
          showSubtitle={true}
          subtitleText="PET ADOPTION PORTAL"
        />
      </Link>

      {/* Main Dual-Column Login Card */}
      <div className="login-card-wrapper">
        
        {/* 1. LEFT SIDE: Image Slider & Brand Hero */}
        <div className="login-left-slider-col">
          {/* Sliding Images Track */}
          <div
            className="login-slider-track"
            style={{
              width: `${LOGIN_SLIDES.length * 100}%`,
              transform: `translateX(-${currentSlide * (100 / LOGIN_SLIDES.length)}%)`,
            }}
          >
            {LOGIN_SLIDES.map((slide, idx) => (
              <div
                key={idx}
                className="login-slider-slide"
                style={{ width: `${100 / LOGIN_SLIDES.length}%` }}
              >
                <img
                  src={slide.image}
                  alt={slide.alt}
                  className="login-slider-img"
                />
              </div>
            ))}
          </div>

          {/* Gradient Overlay for Crisp Text Readability */}
          <div className="login-slider-gradient-overlay" />

          {/* Content Layer Overlay on top of Slider */}
          <div className="login-slider-content-overlay">
            {/* Top row: Handwritten script badge */}
            <div className="login-slider-top-row">
              {/* Handwritten Script Badge from Mockup */}
              <div className="login-slider-script-badge">
                <span className="script-text">Good Pets Brighter Tomorrows</span>
                <PawPrint size={14} className="script-paw" />
              </div>
            </div>

            {/* Bottom Section: Hero Typography, Features, & Pagination Dots */}
            <div className="login-slider-bottom-wrap">
              <h1 className="login-slider-title">
                Adopt.<br />
                Don't Shop.<br />
                <span className="login-highlight">Give Them a Brighter Tomorrow.</span>
              </h1>

              <p className="login-slider-desc">
                Join PawConnect and be part of a kinder tomorrow for pets in need.
              </p>

              {/* 4 Feature Points matching mockup */}
              <div className="login-slider-features">
                <div className="login-feature-item">
                  <div className="login-feature-icon-wrap">
                    <PawPrint size={14} />
                  </div>
                  <span>Discover adorable pets near you</span>
                </div>
                <div className="login-feature-item">
                  <div className="login-feature-icon-wrap">
                    <Heart size={14} />
                  </div>
                  <span>Track your applications and meet &amp; greets</span>
                </div>
                <div className="login-feature-item">
                  <div className="login-feature-icon-wrap">
                    <Calendar size={14} />
                  </div>
                  <span>Get personalized PawMatch recommendations</span>
                </div>
                <div className="login-feature-item">
                  <div className="login-feature-icon-wrap">
                    <Users size={14} />
                  </div>
                  <span>Support shelters and change lives</span>
                </div>
              </div>

              {/* Slider Pagination Dots */}
              <div className="login-slider-dots">
                {LOGIN_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`login-slider-dot ${idx === currentSlide ? 'active' : ''}`}
                    onClick={() => setCurrentSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2. RIGHT SIDE: Login Card with Dynamic Role Color & Bottom-Right to Top-Left Transition */}
        <div className={`login-right-form-col role-active-${selectedRole}`}>
          {/* Base Background: displays the previous role color underneath */}
          {prevRole && (
            <div className={`login-card-bg-base role-bg-${prevRole}`} />
          )}

          {/* Sweeping Background: wipes in the new role color from bottom-right to top-left and REMAINS permanently */}
          <div
            key={`sweep-${selectedRole}-${transitionKey}`}
            className={`login-card-bg-sweep role-bg-${selectedRole} ${transitionKey > 0 ? 'animate-sweep' : ''}`}
          />

          {/* Top Row: Segmented Role Tabs & Back Link */}
          <div className="login-top-actions-row">
            <div className="login-role-segmented-pill">
              <button
                type="button"
                className={`login-role-tab ${selectedRole === 'adopter' ? 'active' : ''}`}
                onClick={() => handleRoleSelect('adopter')}
              >
                Adopter
              </button>
              <button
                type="button"
                className={`login-role-tab ${selectedRole === 'shelter' ? 'active' : ''}`}
                onClick={() => handleRoleSelect('shelter')}
              >
                Shelter
              </button>
              <button
                type="button"
                className={`login-role-tab ${selectedRole === 'admin' ? 'active' : ''}`}
                onClick={() => handleRoleSelect('admin')}
              >
                Admin
              </button>
            </div>

            <Link to="/" className="login-back-link">
              <ArrowLeft size={14} /> Back
            </Link>
          </div>

          {/* Animated Content Body Gliding from Bottom-Right to Top-Left */}
          <div key={`content-${transitionKey}`} className="login-role-content-body">
            {/* Heading & Role Icon */}
            <div className="login-header-group">
              <div className="login-role-icon-box">
                <RoleIcon size={21} />
              </div>
              <h2 className="login-form-title">{currentRoleConfig.title}</h2>
              <p className="login-form-subtitle">{currentRoleConfig.sub}</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="login-error-alert" style={{ marginBottom: '1.25rem' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="login-form">
              {/* Email Address */}
              <div className="login-field-group">
                <label className="login-field-label">Email Address</label>
                <div className="login-input-container">
                  <Mail size={16} className="login-input-icon" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="login-text-input"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="login-field-group">
                <label className="login-field-label">Password</label>
                <div className="login-input-container">
                  <Lock size={16} className="login-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="login-text-input"
                  />
                  <button
                    type="button"
                    className="login-password-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="login-options-row">
                <label className="login-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="login-checkbox-input"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  className="login-forgot-btn"
                  onClick={() => alert('Demo account credentials are automatically pre-filled when you toggle the role tabs (Adopter, Shelter, Admin) above.')}
                >
                  Forgot Password?
                </button>
              </div>

              {/* Cloudflare Turnstile "Tick Thing" */}
              <TurnstileWidget
                onVerify={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken('')}
              />

              {/* Submit Button */}
              <button
                type="submit"
                className="login-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  'Signing in...'
                ) : (
                  <>
                    <ArrowRight size={17} />
                    <span>{currentRoleConfig.btnText}</span>
                  </>
                )}
              </button>
            </form>

            {/* OR Divider & Google Sign-in (Adopter Role Only - Excluded for Shelter & Admin) */}
            {selectedRole === 'adopter' && (
              <>
                <div className="login-or-divider">
                  <span>OR CONTINUE WITH</span>
                </div>

                <div className="login-google-wrap">
                  <GoogleAuthButton
                    role="adopter"
                    mode="signin"
                  />
                </div>
              </>
            )}

            {/* Footer Link */}
            <div className="login-bottom-footer">
              {selectedRole === 'admin' ? (
                <span>Platform Governance &amp; Security Protocol • PawConnect Admin</span>
              ) : (
                <>
                  {selectedRole === 'shelter' ? 'Need to register your shelter organization?' : "Don't have an account?"}
                  <Link to="/register" className="login-register-link">
                    Register here
                  </Link>
                </>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default LoginPage;
