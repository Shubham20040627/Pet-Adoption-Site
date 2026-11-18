import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronDown,
  Heart,
  User,
  LogOut,
  FileText,
  Sparkles,
  CheckSquare,
  Layers,
  BookOpen,
  Calendar,
  MessageSquare,
  Menu,
  X,
  ShieldCheck,
  Check,
  Calculator,
  Compass,
  ArrowRight,
  Building,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { petsApi } from '../api/petsApi';
import NotificationDropdown from './NotificationDropdown';
import PawConnectLogo from './PawConnectLogo';
import '../styles/adopter-navbar.css';

const FALLBACK_PET_IMG = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80';

const AdopterNavbar = () => {
  const { user, logout, favoriteIds, unreadCount } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState(null); // 'pets' | 'apps' | 'more' | 'user' | null
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navRef = useRef(null);

  // Close dropdowns on outside click or escape
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setMobileMenuOpen(false);
        setShowGuideModal(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  // Determine readiness verification status
  const userId = user?.id || user?._id || user?.email || 'guest';
  const isVerified = Boolean(
    user?.is_readiness_verified ||
    user?.verified ||
    localStorage.getItem(`pawconnect_readiness_verified_${userId}`) === 'true' ||
    localStorage.getItem('pawconnect_readiness_verified') === 'true'
  );

  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'overview';
  const isDashboardOverview = (location.pathname === '/adopter-dashboard' || location.pathname === '/adopter_dashboard') && (currentTab === 'overview' || !location.search);

  const toggleDropdown = (name) => {
    setOpenDropdown(prev => (prev === name ? null : name));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/pets?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const userName = user?.name || user?.email?.split('@')[0] || 'Adopter';
  const initial = userName.charAt(0).toUpperCase();

  return (
    <>
      <header className="adopter-navbar-wrapper" ref={navRef}>
        <div className="adopter-navbar-container">
          
          {/* 1. Left: Authentic Brand Wordmark & Emblem */}
          <div className="adopter-navbar-left">
            <Link 
              to="/adopter-dashboard" 
              className="adopter-navbar-brand-link" 
              title="PawConnect Adopter Dashboard"
            >
              <PawConnectLogo 
                size="md" 
                variant="full" 
                theme="light" 
                showSubtitle={true} 
                subtitleText="PET ADOPTION PORTAL" 
              />
            </Link>
          </div>

          {/* 2. Middle: Navigation Links & Interactive Dropdowns */}
          <nav className="adopter-nav-links-desktop" aria-label="Adopter portal navigation">
            
            {/* Home Pill */}
            <NavLink
              to="/adopter-dashboard"
              className={() => `adopter-nav-pill-btn ${isDashboardOverview ? 'active' : ''}`}
            >
              Home
            </NavLink>

            {/* Pets Dropdown */}
            <div className="adopter-nav-dropdown-wrap">
              <button
                type="button"
                className={`adopter-nav-item-btn ${openDropdown === 'pets' || location.pathname.startsWith('/pets') || currentTab === 'favorites' ? 'active' : ''}`}
                onClick={() => toggleDropdown('pets')}
                aria-expanded={openDropdown === 'pets'}
              >
                <span>Pets</span>
                <ChevronDown size={14} className={`adopter-chevron ${openDropdown === 'pets' ? 'rotated' : ''}`} />
              </button>

              {openDropdown === 'pets' && (
                <div className="adopter-dropdown-menu">
                  <Link to="/pets" className="adopter-dropdown-item" onClick={() => setOpenDropdown(null)}>
                    <Search size={16} className="dropdown-icon" />
                    <span>Browse Pets</span>
                  </Link>
                  <Link to="/adopter-dashboard?tab=favorites" className="adopter-dropdown-item" onClick={() => setOpenDropdown(null)}>
                    <Heart size={16} className="dropdown-icon" />
                    <span>Favorite Pets</span>
                    {favoriteIds?.length > 0 && (
                      <span className="dropdown-pill-counter">{favoriteIds.length}</span>
                    )}
                  </Link>
                  <Link to="/compare-pets" className="adopter-dropdown-item" onClick={() => setOpenDropdown(null)}>
                    <Layers size={16} className="dropdown-icon" />
                    <span>Compare Pets</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Applications Dropdown */}
            <div className="adopter-nav-dropdown-wrap">
              <button
                type="button"
                className={`adopter-nav-item-btn ${openDropdown === 'apps' || location.pathname === '/my-applications' ? 'active' : ''}`}
                onClick={() => toggleDropdown('apps')}
                aria-expanded={openDropdown === 'apps'}
              >
                <span>Applications</span>
                <ChevronDown size={14} className={`adopter-chevron ${openDropdown === 'apps' ? 'rotated' : ''}`} />
              </button>

              {openDropdown === 'apps' && (
                <div className="adopter-dropdown-menu">
                  <Link to="/my-applications" className="adopter-dropdown-item" onClick={() => setOpenDropdown(null)}>
                    <FileText size={16} className="dropdown-icon" />
                    <span>My Applications</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Meet & Greets direct link */}
            <Link
              to="/adopter-dashboard?tab=visits"
              className={`adopter-nav-item-btn ${location.pathname.startsWith('/adopter-dashboard') && currentTab === 'visits' ? 'active' : ''}`}
            >
              <span>Meet &amp; Greets</span>
            </Link>

            {/* Messages direct link */}
            <Link
              to="/messages"
              className={`adopter-nav-item-btn ${location.pathname === '/messages' ? 'active' : ''}`}
            >
              <span>Messages</span>
            </Link>

            {/* Compare direct link */}
            <Link
              to="/compare-pets"
              className={`adopter-nav-item-btn ${location.pathname === '/compare-pets' || location.pathname === '/compare' ? 'active' : ''}`}
            >
              <span>Compare</span>
            </Link>

            {/* More Dropdown (Adoption Tools & Guide) */}
            <div className="adopter-nav-dropdown-wrap">
              <button
                type="button"
                className={`adopter-nav-item-btn ${
                  openDropdown === 'more' ||
                  location.pathname === '/pawmatch' ||
                  location.pathname === '/cost-calculator' ||
                  location.pathname === '/readiness-checklist'
                    ? 'active'
                    : ''
                }`}
                onClick={() => toggleDropdown('more')}
                aria-expanded={openDropdown === 'more'}
              >
                <span>More</span>
                <ChevronDown size={14} className={`adopter-chevron ${openDropdown === 'more' ? 'rotated' : ''}`} />
              </button>

              {openDropdown === 'more' && (
                <div className="adopter-dropdown-menu dropdown-menu-wide">
                  <Link to="/pawmatch" className="adopter-dropdown-item" onClick={() => setOpenDropdown(null)}>
                    <Sparkles size={16} className="dropdown-icon" />
                    <span>PawMatch Quiz</span>
                  </Link>
                  <Link to="/cost-calculator" className="adopter-dropdown-item" onClick={() => setOpenDropdown(null)}>
                    <Calculator size={16} className="dropdown-icon" />
                    <span>Cost Calculator</span>
                  </Link>
                  <Link to="/readiness-checklist" className="adopter-dropdown-item" onClick={() => setOpenDropdown(null)}>
                    <CheckSquare size={16} className="dropdown-icon" />
                    <span style={{ flex: 1 }}>Readiness Check</span>
                    {isVerified && (
                      <span className="dropdown-verified-tag">✓ Verified</span>
                    )}
                  </Link>
                  <button
                    type="button"
                    className="adopter-dropdown-item"
                    onClick={() => {
                      setOpenDropdown(null);
                      setShowGuideModal(true);
                    }}
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <BookOpen size={16} className="dropdown-icon" />
                    <span>Adoption Guide</span>
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* 3. Right: Search bar, Notifications, User Menu & Mobile Toggle */}
          <div className="adopter-navbar-right">
            
            {/* Search Pill */}
            <form onSubmit={handleSearchSubmit} className="adopter-nav-search-form">
              <Search size={15} className="adopter-search-icon" />
              <input
                type="text"
                placeholder="Search pets, breeds..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search pets by name or breed"
                className="adopter-nav-search-input"
              />
            </form>

            {/* Notification Bell */}
            <div className="adopter-nav-notification-wrap">
              <NotificationDropdown placement="bottom-end" />
            </div>

            {/* User Profile Pill & Dropdown */}
            <div className="adopter-nav-dropdown-wrap adopter-user-dropdown-wrap">
              <button
                type="button"
                className="adopter-user-pill-btn"
                onClick={() => toggleDropdown('user')}
                aria-expanded={openDropdown === 'user'}
                title="Account options"
              >
                <div className="adopter-user-avatar-circle">
                  {initial}
                </div>
                <span className="adopter-user-name-text">
                  {userName}
                </span>
                <ChevronDown size={14} className={`adopter-chevron ${openDropdown === 'user' ? 'rotated' : ''}`} />
              </button>

              {openDropdown === 'user' && (
                <div className="adopter-dropdown-menu dropdown-menu-user">
                  {/* User Profile Brief Header */}
                  <div className="adopter-user-card-head">
                    <div className="adopter-user-avatar-circle large">
                      {initial}
                    </div>
                    <div className="adopter-user-head-info">
                      <div className="adopter-user-head-name">{userName}</div>
                      <div className="adopter-user-head-email">{user?.email || 'adopter@pawconnect.org'}</div>
                      <div className="adopter-user-badge-row">
                        {isVerified ? (
                          <span className="adopter-user-badge verified">
                            <ShieldCheck size={12} /> Verified Adopter
                          </span>
                        ) : (
                          <span className="adopter-user-badge standard">
                            Adopter Account
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="adopter-dropdown-divider" />

                  <Link to="/adopter-dashboard?tab=profile" className="adopter-dropdown-item" onClick={() => setOpenDropdown(null)}>
                    <User size={16} className="dropdown-icon" />
                    <span>My Profile</span>
                  </Link>

                  <Link to="/my-applications" className="adopter-dropdown-item" onClick={() => setOpenDropdown(null)}>
                    <FileText size={16} className="dropdown-icon" />
                    <span>My Applications</span>
                  </Link>

                  <Link to="/adopter-dashboard?tab=favorites" className="adopter-dropdown-item" onClick={() => setOpenDropdown(null)}>
                    <Heart size={16} className="dropdown-icon" />
                    <span>Favorite Pets</span>
                    {favoriteIds?.length > 0 && (
                      <span className="dropdown-pill-counter">{favoriteIds.length}</span>
                    )}
                  </Link>

                  <Link to="/readiness-checklist" className="adopter-dropdown-item" onClick={() => setOpenDropdown(null)}>
                    <CheckSquare size={16} className="dropdown-icon" />
                    <span>Readiness Assessment</span>
                    {isVerified && (
                      <span className="dropdown-verified-tag">✓ Verified</span>
                    )}
                  </Link>

                  <div className="adopter-dropdown-divider" />

                  <button
                    type="button"
                    className="adopter-dropdown-item logout-item"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} className="dropdown-icon danger" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className="adopter-mobile-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

        </div>

        {/* 4. Mobile Navigation Drawer / Panel */}
        {mobileMenuOpen && (
          <div className="adopter-mobile-nav-panel">
            <form onSubmit={handleSearchSubmit} className="adopter-mobile-search-form">
              <Search size={16} className="adopter-search-icon" />
              <input
                type="text"
                placeholder="Search pets, breeds..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="adopter-mobile-search-input"
              />
            </form>

            <div className="adopter-mobile-section-title">Navigation</div>
            <div className="adopter-mobile-links-list">
              <NavLink
                to="/adopter-dashboard"
                className={() => `adopter-mobile-link ${isDashboardOverview ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home / Overview
              </NavLink>
              <NavLink
                to="/pets"
                className={({ isActive }) => `adopter-mobile-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse Pets
              </NavLink>
              <NavLink
                to="/my-applications"
                className={({ isActive }) => `adopter-mobile-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                My Applications
              </NavLink>
              <NavLink
                to="/adopter-dashboard?tab=visits"
                className={`adopter-mobile-link ${currentTab === 'visits' ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Meet &amp; Greets
              </NavLink>
              <NavLink
                to="/messages"
                className={({ isActive }) => `adopter-mobile-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Messages
              </NavLink>
              <NavLink
                to="/adopter-dashboard?tab=favorites"
                className={`adopter-mobile-link ${currentTab === 'favorites' ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Favorite Pets {favoriteIds?.length > 0 ? `(${favoriteIds.length})` : ''}
              </NavLink>
              <NavLink
                to="/compare-pets"
                className={({ isActive }) => `adopter-mobile-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Compare Pets
              </NavLink>
            </div>

            <div className="adopter-mobile-section-title">Adoption Tools</div>
            <div className="adopter-mobile-links-list">
              <NavLink
                to="/pawmatch"
                className={({ isActive }) => `adopter-mobile-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                PawMatch Quiz
              </NavLink>
              <NavLink
                to="/cost-calculator"
                className={({ isActive }) => `adopter-mobile-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Cost Calculator
              </NavLink>
              <NavLink
                to="/readiness-checklist"
                className={({ isActive }) => `adopter-mobile-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Readiness Check {isVerified && <span className="dropdown-verified-tag">✓ Verified</span>}
              </NavLink>
              <button
                type="button"
                className="adopter-mobile-link text-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowGuideModal(true);
                }}
              >
                Adoption Guide
              </button>
            </div>

            <div className="adopter-mobile-section-title">Account</div>
            <div className="adopter-mobile-links-list">
              <NavLink
                to="/adopter-dashboard?tab=profile"
                className="adopter-mobile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Profile ({userName})
              </NavLink>
              <button
                type="button"
                className="adopter-mobile-link text-btn danger"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 5. Adoption Guide Modal */}
      {showGuideModal && (
        <div className="adopter-guide-backdrop" onClick={() => setShowGuideModal(false)}>
          <div className="adopter-guide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adopter-guide-modal-header">
              <div className="adopter-guide-title-wrap">
                <BookOpen size={24} className="guide-header-icon" />
                <div>
                  <h3 className="adopter-guide-title">PawConnect Adoption Guide</h3>
                  <p className="adopter-guide-subtitle">Your step-by-step path to bringing home a loving companion</p>
                </div>
              </div>
              <button
                type="button"
                className="adopter-guide-close-btn"
                onClick={() => setShowGuideModal(false)}
                aria-label="Close adoption guide"
              >
                <X size={20} />
              </button>
            </div>

            <div className="adopter-guide-body">
              <div className="adopter-guide-steps">
                
                <div className="adopter-guide-step-card">
                  <div className="adopter-step-number">1</div>
                  <div className="adopter-step-content">
                    <h4>Browse &amp; Match</h4>
                    <p>
                      Explore verified rescue pets or take the <strong>PawMatch Quiz</strong> to get matched based on your lifestyle, home size, and energy level.
                    </p>
                  </div>
                </div>

                <div className="adopter-guide-step-card">
                  <div className="adopter-step-number">2</div>
                  <div className="adopter-step-content">
                    <h4>Submit Your Digital Application</h4>
                    <p>
                      Complete your paperless application online. Completing the <strong>Adoption Readiness Assessment</strong> fast-tracks shelter review with an official badge.
                    </p>
                  </div>
                </div>

                <div className="adopter-guide-step-card">
                  <div className="adopter-step-number">3</div>
                  <div className="adopter-step-content">
                    <h4>Meet &amp; Greet</h4>
                    <p>
                      Schedule an in-person or virtual appointment with the shelter to get to know your prospective pet, ask questions, and ensure compatibility.
                    </p>
                  </div>
                </div>

                <div className="adopter-guide-step-card">
                  <div className="adopter-step-number">4</div>
                  <div className="adopter-step-content">
                    <h4>Digital Contract &amp; Lifetime Care</h4>
                    <p>
                      Finalize the digital adoption agreement, receive an official verifiable adoption certificate, and access your pet's complete digital care profile.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            <div className="adopter-guide-modal-footer">
              <button
                type="button"
                className="adopter-guide-btn-secondary"
                onClick={() => setShowGuideModal(false)}
              >
                Close
              </button>
              <Link
                to="/pets"
                className="adopter-guide-btn-primary"
                onClick={() => setShowGuideModal(false)}
              >
                <Search size={16} /> Browse Pets Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdopterNavbar;

