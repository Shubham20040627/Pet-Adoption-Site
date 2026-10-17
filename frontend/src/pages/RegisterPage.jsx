import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PawPrint,
  UserPlus,
  AlertCircle,
  Heart,
  Sparkles,
  CheckCircle2,
  Eye,
  EyeOff,
  Building2,
  Lock,
  Mail,
  Phone,
  User,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/forms.css';

const registerSlides = [
  {
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1600&auto=format&fit=crop',
    title: 'Give Every Pet a Second Chance',
    subtitle: 'Thousands of rescues are waiting for a warm, loving home.',
  },
  {
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1600&auto=format&fit=crop',
    title: 'Find Your Purr-fect Companion',
    subtitle: 'From playful kittens to gentle senior cats ready to cuddle.',
  },
  {
    image: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=1600&auto=format&fit=crop',
    title: 'Support Verified Rescues & Shelters',
    subtitle: 'Direct ethical adoption with transparent background checks.',
  },
  {
    image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=1600&auto=format&fit=crop',
    title: 'Adventures Start with a Wagging Tail',
    subtitle: 'Adopt a friend who will stay loyal by your side for life.',
  },
  {
    image: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=1600&auto=format&fit=crop',
    title: 'Gentle Rabbits & Small Companions',
    subtitle: 'Loving spaces for pets of all shapes and sizes.',
  },
];

const autotypeRoles = [
  'Loving Adopter.',
  'Rescue Shelter Hero.',
  'Pet Parent.',
  'Forever Companion.',
  'Caring Family.',
];

const PRESET_BADGES = [
  {
    label: '🐾 Shield Sanctuary',
    url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=150&auto=format&fit=crop',
  },
  {
    label: '🌿 Green Haven',
    url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop',
  },
  {
    label: '🏥 Rescue Care',
    url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=150&auto=format&fit=crop',
  },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [role, setRole] = useState('adopter');
  const [animKey, setAnimKey] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    shelter_name: '',
    shelter_bio: '',
    registration_number: `AWBI-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    facility_type: 'Registered Non-Profit (NGO)',
    logo_url: '',
  });

  const handleRoleChange = (newRole) => {
    if (newRole !== role) {
      setRole(newRole);
      setAnimKey((prev) => prev + 1);
      setError(null);
      const rightPanel = document.querySelector('.split-auth-right');
      if (rightPanel) {
        rightPanel.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleDemoFill = () => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    if (role === 'shelter') {
      setFormData({
        name: 'Dr. Neha Verma',
        email: `shelter_${randomId}@pawconnect.org`,
        password: 'password123',
        phone: '+91 98765 43210',
        address: 'Chandigarh, Sector 26',
        shelter_name: 'Paws & Hope Sanctuary',
        shelter_bio:
          'Accredited non-profit rescue dedicated to medical care, rehabilitation, and finding forever homes for abandoned pets.',
        registration_number: `AWBI-2026-${randomId}`,
        facility_type: 'Registered Non-Profit (NGO)',
        logo_url:
          'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&auto=format&fit=crop',
      });
    } else {
      setFormData({
        name: 'Aarav Sharma',
        email: `adopter_${randomId}@pawconnect.org`,
        password: 'password123',
        phone: '+91 98765 12345',
        address: 'Bangalore, Indiranagar',
        shelter_name: '',
        shelter_bio: '',
        registration_number: '',
        facility_type: 'Registered Non-Profit (NGO)',
        logo_url: '',
      });
    }
  };

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

    const typeTimer = setTimeout(
      () => {
        setSubIdx((prev) => prev + (isDeleting ? -1 : 1));
      },
      isDeleting ? 45 : 110
    );

    return () => clearTimeout(typeTimer);
  }, [subIdx, isDeleting, wordIdx]);

  // 2. Sliding Images Carousel Effect (Right-to-Left)
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % registerSlides.length);
    }, 4500);
    return () => clearInterval(slideTimer);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        role,
        ...formData,
      };
      const res = await register(payload);
      if (res.user.role === 'shelter') {
        navigate('/shelter-dashboard?tab=overview', {
          state: {
            justRegistered: true,
            welcomeMessage: 'Account created successfully! Welcome to your Shelter Dashboard. Note: Your registration is currently awaiting administrative approval.'
          }
        });
      } else {
        navigate('/adopter-dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Registration failed. Please verify your details.'
      );
    } finally {
      setLoading(false);
    }
  };

  const typedRole = autotypeRoles[wordIdx].substring(0, subIdx);

  return (
    <div className="split-auth-layout">
      {/* LEFT SIDE: Sliding Pet Images & Autotype Overlay */}
      <div className="split-auth-left">
        <div
          className="split-slider-track"
          style={{
            width: `${registerSlides.length * 100}%`,
            transform: `translateX(-${currentSlide * (100 / registerSlides.length)}%)`,
          }}
        >
          {registerSlides.map((slide, idx) => (
            <div
              key={idx}
              className="split-slider-slide"
              style={{ width: `${100 / registerSlides.length}%` }}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="split-slider-img"
              />
            </div>
          ))}
        </div>

        <div className="split-slider-overlay" />

        <div className="split-left-content">
          <div className="hero-badge-glass" style={{ alignSelf: 'flex-start' }}>
            <Sparkles size={16} color="#FFD166" /> Welcome to PawConnect
          </div>

          <div className="split-autotype-wrap">
            <h2 className="split-autotype-title">
              Join PawConnect as a <br />
              <span className="split-autotype-dynamic">{typedRole}</span>
              <span className="cursor-blink-light">|</span>
            </h2>
            <p className="split-autotype-sub">
              {registerSlides[currentSlide].subtitle}
            </p>
          </div>

          {/* Quick Perks */}
          <div className="split-perks-list">
            <div className="split-perk-item">
              <CheckCircle2 size={18} color="#52B788" />
              <span>Smart PawMatch lifestyle algorithm for perfect compatibility</span>
            </div>
            <div className="split-perk-item">
              <CheckCircle2 size={18} color="#52B788" />
              <span>Direct application tracking with verified rescue shelters</span>
            </div>
            <div className="split-perk-item">
              <CheckCircle2 size={18} color="#52B788" />
              <span>100% ethical, verified, and community-driven adoptions</span>
            </div>
          </div>

          {/* Slider Dots */}
          <div className="split-slider-dots">
            {registerSlides.map((_, idx) => (
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

      {/* RIGHT SIDE: Compact Register Form */}
      <div className="split-auth-right">
        <div
          key={`card-${animKey}-${role}`}
          className={`split-form-card role-${role} card-diagonal-transition`}
        >
          {/* Header */}
          <div className="split-form-header">
            <div
              key={`badge-${animKey}-${role}`}
              className={`split-logo-badge role-${role} badge-pop-anim`}
            >
              {role === 'shelter' ? <Building2 size={22} /> : <PawPrint size={22} />}
            </div>
            <div style={{ flex: 1 }}>
              <h1 className="split-form-title">
                {role === 'shelter' ? 'Register Your Shelter' : 'Create Your Account'}
              </h1>
              <p className="split-form-sub">
                {role === 'shelter'
                  ? 'Onboard your rescue organization & list companion pets'
                  : 'Join our verified community to adopt & save pets'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDemoFill}
              className={`demo-autofill-btn role-${role}`}
              title="1-Click Demo Fill for instant testing"
            >
              <Sparkles size={13} />
              <span>Demo Fill</span>
            </button>
          </div>

          {/* Premium Segmented Role Selector */}
          <div className={`compact-role-toggle role-${role}`}>
            <button
              type="button"
              className={`compact-role-btn ${role === 'adopter' ? 'active adopter' : ''}`}
              onClick={() => handleRoleChange('adopter')}
            >
              <Heart size={16} />
              <div className="role-btn-text">
                <span className="role-btn-title">Adopter</span>
                <span className="role-btn-subtitle">Find & Adopt</span>
              </div>
            </button>
            <button
              type="button"
              className={`compact-role-btn ${role === 'shelter' ? 'active shelter' : ''}`}
              onClick={() => handleRoleChange('shelter')}
            >
              <Building2 size={16} />
              <div className="role-btn-text">
                <span className="role-btn-title">Shelter / Rescue</span>
                <span className="role-btn-subtitle">List & Manage</span>
              </div>
            </button>
          </div>

          {error && (
            <div className="compact-alert-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="compact-register-form">
            {role === 'shelter' ? (
              <>
                <div className="compact-form-row">
                  <div className="compact-form-group">
                    <label className="compact-label">
                      <span>Shelter / Org Name</span>
                    </label>
                    <div className="input-with-icon-wrap">
                      <Building2 size={16} className="input-field-icon" />
                      <input
                        type="text"
                        name="shelter_name"
                        className="compact-input with-icon"
                        placeholder="e.g. Green Valley Sanctuary"
                        value={formData.shelter_name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="compact-form-group">
                    <label className="compact-label">
                      <span>Contact Person</span>
                    </label>
                    <div className="input-with-icon-wrap">
                      <User size={16} className="input-field-icon" />
                      <input
                        type="text"
                        name="name"
                        className="compact-input with-icon"
                        placeholder="e.g. Dr. Alex Morgan"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="compact-form-row">
                  <div className="compact-form-group">
                    <label className="compact-label">
                      <span>Govt / NGO Reg. No.</span>
                      <span className="verified-reg-badge">
                        <ShieldCheck size={12} /> Verified ID
                      </span>
                    </label>
                    <div className="input-with-icon-wrap">
                      <ShieldCheck size={16} className="input-field-icon" />
                      <input
                        type="text"
                        name="registration_number"
                        className="compact-input with-icon"
                        placeholder="e.g. AWBI-2026-8941"
                        value={formData.registration_number}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="compact-form-group">
                    <label className="compact-label">
                      <span>Facility / Org Type</span>
                    </label>
                    <div className="select-wrap">
                      <select
                        name="facility_type"
                        className="compact-input compact-select"
                        value={formData.facility_type}
                        onChange={handleChange}
                      >
                        <option value="Registered Non-Profit (NGO)">Registered Non-Profit (NGO)</option>
                        <option value="Animal Sanctuary & Rescue">Animal Sanctuary & Rescue</option>
                        <option value="Foster Care & Rehab Network">Foster Care & Rehab Network</option>
                        <option value="Veterinary Community Shelter">Veterinary Community Shelter</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="compact-form-row">
                  <div className="compact-form-group">
                    <label className="compact-label">
                      <span>Email Address</span>
                    </label>
                    <div className="input-with-icon-wrap">
                      <Mail size={16} className="input-field-icon" />
                      <input
                        type="email"
                        name="email"
                        className="compact-input with-icon"
                        placeholder="shelter@pawconnect.org"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="compact-form-group">
                    <label className="compact-label">
                      <span>Phone Number</span>
                    </label>
                    <div className="input-with-icon-wrap">
                      <Phone size={16} className="input-field-icon" />
                      <input
                        type="text"
                        name="phone"
                        className="compact-input with-icon"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="compact-form-row">
                  <div className="compact-form-group">
                    <label className="compact-label">
                      <span>Password (Min 6 chars)</span>
                    </label>
                    <div className="input-with-icon-wrap">
                      <Lock size={16} className="input-field-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        className="compact-input with-icon with-trailing"
                        placeholder="Create strong password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                      <button
                        type="button"
                        className="input-trailing-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div className="compact-form-group">
                    <label className="compact-label">
                      <span>Location / City</span>
                    </label>
                    <div className="input-with-icon-wrap">
                      <MapPin size={16} className="input-field-icon" />
                      <input
                        type="text"
                        name="address"
                        className="compact-input with-icon"
                        placeholder="e.g. Portland, OR"
                        value={formData.address}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Shelter Logo & Emblem */}
                <div className="compact-form-group shelter-logo-section">
                  <div className="compact-label-row">
                    <label className="compact-label">
                      <span>Shelter Logo / Emblem</span>
                      <span className="compact-optional-tag">Optional</span>
                    </label>
                    <span className="compact-label-hint">Preset badge or image URL</span>
                  </div>

                  <div className="logo-input-preview-row">
                    {formData.logo_url ? (
                      <div className="logo-preview-badge" title="Active logo badge">
                        <img
                          src={formData.logo_url}
                          alt="Shelter Emblem"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="logo-preview-placeholder">
                        <Building2 size={18} />
                      </div>
                    )}
                    <input
                      type="text"
                      name="logo_url"
                      className="compact-input logo-input-box"
                      placeholder="Paste image URL (https://...)..."
                      value={formData.logo_url}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="preset-badges-container">
                    <span className="preset-badges-tag">Presets:</span>
                    {PRESET_BADGES.map((badge, bIdx) => {
                      const isSelected = formData.logo_url === badge.url;
                      return (
                        <button
                          key={bIdx}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, logo_url: badge.url }))
                          }
                          className={`preset-chip-btn ${isSelected ? 'selected' : ''}`}
                        >
                          <img
                            src={badge.url}
                            alt=""
                            className="preset-chip-thumb"
                          />
                          <span>{badge.label}</span>
                        </button>
                      );
                    })}
                    {formData.logo_url && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, logo_url: '' }))
                        }
                        className="preset-clear-link"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="compact-form-group bio-form-group">
                  <label className="compact-label">
                    <span>Mission & Short Bio</span>
                    <span className="compact-optional-tag">Optional</span>
                  </label>
                  <input
                    type="text"
                    name="shelter_bio"
                    className="compact-input"
                    placeholder="Briefly state your rescue mission, rescue history or specialty..."
                    value={formData.shelter_bio}
                    onChange={handleChange}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="compact-form-row">
                  <div className="compact-form-group">
                    <label className="compact-label">
                      <span>Full Name</span>
                    </label>
                    <div className="input-with-icon-wrap">
                      <User size={16} className="input-field-icon" />
                      <input
                        type="text"
                        name="name"
                        className="compact-input with-icon"
                        placeholder="e.g. Alex Morgan"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="compact-form-group">
                    <label className="compact-label">
                      <span>Phone Number</span>
                    </label>
                    <div className="input-with-icon-wrap">
                      <Phone size={16} className="input-field-icon" />
                      <input
                        type="text"
                        name="phone"
                        className="compact-input with-icon"
                        placeholder="+1 (555) 019-2834"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="compact-form-row">
                  <div className="compact-form-group">
                    <label className="compact-label">
                      <span>Email Address</span>
                    </label>
                    <div className="input-with-icon-wrap">
                      <Mail size={16} className="input-field-icon" />
                      <input
                        type="email"
                        name="email"
                        className="compact-input with-icon"
                        placeholder="alex@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="compact-form-group">
                    <label className="compact-label">
                      <span>Password (Min 6 chars)</span>
                    </label>
                    <div className="input-with-icon-wrap">
                      <Lock size={16} className="input-field-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        className="compact-input with-icon with-trailing"
                        placeholder="Create password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                      <button
                        type="button"
                        className="input-trailing-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="compact-form-group address-group">
                  <label className="compact-label">
                    <span>City, State / Delivery Address</span>
                  </label>
                  <div className="input-with-icon-wrap">
                    <MapPin size={16} className="input-field-icon" />
                    <input
                      type="text"
                      name="address"
                      className="compact-input with-icon"
                      placeholder="e.g. Portland, OR"
                      value={formData.address}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className={`compact-submit-btn role-${role}`}
              disabled={loading}
            >
              {loading ? (
                <span className="submit-loading-text">
                  <span className="submit-spinner" />
                  Creating Your Account...
                </span>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>
                    {role === 'shelter'
                      ? 'Register as Verified Shelter'
                      : 'Join PawConnect as Adopter'}
                  </span>
                  <ArrowRight size={16} className="submit-arrow-icon" />
                </>
              )}
            </button>
          </form>

          <div className="compact-form-footer">
            <span>Already have an account?</span>{' '}
            <Link to="/login" className="compact-link">
              Sign In Here &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
