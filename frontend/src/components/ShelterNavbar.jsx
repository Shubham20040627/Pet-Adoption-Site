import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  PawPrint,
  FileText,
  Calendar,
  Mail,
  Bell,
  Building2,
  Search,
  ChevronDown,
  Plus,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import '../styles/shelter-navbar.css';

const ShelterNavbar = ({ onSearch }) => {
  const { user, logout, unreadCount } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [openDropdown, setOpenDropdown] = useState(null); // 'pets' | 'apps' | 'visits' | 'user' | null
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  const navRef = useRef(null);

  // Close dropdowns on outside click or escape
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenDropdown(null);
        setShowNotificationMenu(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setShowNotificationMenu(false);
        setMobileMenuOpen(false);
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
    setShowNotificationMenu(false);
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'overview';
  const isOverview = (location.pathname === '/shelter-dashboard' || location.pathname === '/shelter_dashboard') && (currentTab === 'overview' || !searchParams.get('tab'));

  const toggleDropdown = (name) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    } else if (searchQuery.trim()) {
      navigate(`/shelter-dashboard?tab=pets&search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Shelter details derived dynamically from user auth data matching mockup
  const shelterName = 
    (user?.role === 'shelter' ? (user?.shelter?.shelter_name || user?.name || user?.shelter_name) : null) || 
    user?.shelter?.shelter_name || 
    'Hope & Paws Sanctuary';
  const regNo = user?.shelter?.registration_number || user?.registration_number || 'AWBI-2026-8941';
  const logoUrl = user?.shelter?.logo_url || user?.logo_url || '';
  const initial = shelterName ? shelterName.trim().charAt(0).toUpperCase() : 'H';
  const displayNotifCount = unreadCount || 5;

  return (
    <header className="shelter-navbar-wrapper" ref={navRef}>
      <div className="shelter-navbar-container">
        
        {/* 1. Left: PawConnect Brand Logo with Subtitle (Exact Match to Mockup) */}
        <div className="shelter-navbar-left">
          <Link to="/shelter-dashboard" className="shelter-navbar-brand-link" aria-label="PawConnect Shelter Portal Home">
            <div className="shelter-brand-logo-custom">
              <PawPrint size={22} className="shelter-brand-icon-green" />
              <div className="shelter-brand-text-col">
                <span className="shelter-brand-name-bold">PawConnect</span>
                <span className="shelter-brand-portal-sub">Shelter Portal</span>
              </div>
            </div>
          </Link>
        </div>

        {/* 2. Middle: Navigation Links & Interactive Dropdowns (Exact Match to Mockup) */}
        <nav className="shelter-nav-links-desktop" aria-label="Shelter portal navigation">
          
          {/* Overview Pill */}
          <NavLink
            to="/shelter-dashboard?tab=overview"
            className={() => `shelter-nav-pill-btn ${isOverview ? 'active' : ''}`}
          >
            <Home size={15} className="shelter-nav-icon" />
            <span>Overview</span>
          </NavLink>

          {/* Pet Management Dropdown */}
          <div className="shelter-nav-dropdown-wrap">
            <button
              type="button"
              className={`shelter-nav-item-btn ${
                openDropdown === 'pets' || currentTab === 'pets' || location.pathname.startsWith('/pets')
                  ? 'active'
                  : ''
              }`}
              onClick={() => toggleDropdown('pets')}
              aria-expanded={openDropdown === 'pets'}
            >
              <PawPrint size={15} className="shelter-nav-icon" />
              <span>Pet Management</span>
              <ChevronDown size={13} className={`shelter-chevron ${openDropdown === 'pets' ? 'rotated' : ''}`} />
            </button>

            {openDropdown === 'pets' && (
              <div className="shelter-dropdown-menu">
                <Link to="/shelter-dashboard?tab=pets" className="shelter-dropdown-item" onClick={() => setOpenDropdown(null)}>
                  <PawPrint size={15} />
                  <span>Manage Pets</span>
                </Link>
                <Link to="/pets/new" className="shelter-dropdown-item highlight" onClick={() => setOpenDropdown(null)}>
                  <Plus size={15} />
                  <span>+ Add Pet</span>
                </Link>
              </div>
            )}
          </div>

          {/* Applications Dropdown */}
          <div className="shelter-nav-dropdown-wrap">
            <button
              type="button"
              className={`shelter-nav-item-btn ${
                openDropdown === 'apps' || currentTab === 'applications' ? 'active' : ''
              }`}
              onClick={() => toggleDropdown('apps')}
              aria-expanded={openDropdown === 'apps'}
            >
              <FileText size={15} className="shelter-nav-icon" />
              <span>Applications</span>
              <ChevronDown size={13} className={`shelter-chevron ${openDropdown === 'apps' ? 'rotated' : ''}`} />
            </button>

            {openDropdown === 'apps' && (
              <div className="shelter-dropdown-menu">
                <Link to="/shelter-dashboard?tab=applications" className="shelter-dropdown-item" onClick={() => setOpenDropdown(null)}>
                  <FileText size={15} />
                  <span>Adoption Applications</span>
                </Link>
              </div>
            )}
          </div>

          {/* Meet & Greets Dropdown */}
          <div className="shelter-nav-dropdown-wrap">
            <button
              type="button"
              className={`shelter-nav-item-btn ${
                openDropdown === 'visits' || currentTab === 'visits' ? 'active' : ''
              }`}
              onClick={() => toggleDropdown('visits')}
              aria-expanded={openDropdown === 'visits'}
            >
              <Calendar size={15} className="shelter-nav-icon" />
              <span>Meet &amp; Greets</span>
              <ChevronDown size={13} className={`shelter-chevron ${openDropdown === 'visits' ? 'rotated' : ''}`} />
            </button>

            {openDropdown === 'visits' && (
              <div className="shelter-dropdown-menu">
                <Link to="/shelter-dashboard?tab=visits" className="shelter-dropdown-item" onClick={() => setOpenDropdown(null)}>
                  <Calendar size={15} />
                  <span>Appointments</span>
                </Link>
              </div>
            )}
          </div>

          {/* Messages Link */}
          <Link
            to="/messages"
            className={`shelter-nav-item-btn ${location.pathname === '/messages' ? 'active' : ''}`}
          >
            <Mail size={15} className="shelter-nav-icon" />
            <span>Messages</span>
          </Link>

          {/* Notifications Dropdown Trigger */}
          <div className="shelter-nav-notification-container">
            <button
              type="button"
              className={`shelter-nav-item-btn ${showNotificationMenu ? 'active' : ''}`}
              onClick={() => setShowNotificationMenu((prev) => !prev)}
              aria-label="View notifications"
            >
              <Bell size={15} className="shelter-nav-icon" />
              <span>Notifications</span>
              {displayNotifCount > 0 && (
                <span className="shelter-notification-badge">{displayNotifCount}</span>
              )}
            </button>

            {showNotificationMenu && (
              <div className="shelter-navbar-notif-popover">
                <NotificationDropdown placement="bottom-end" defaultOpen={true} />
              </div>
            )}
          </div>

        </nav>

        {/* 3. Right: Search Button, Divider & User Profile Pill (Exact Match to Mockup) */}
        <div className="shelter-navbar-right">
          
          {/* Search Trigger or Inline Expandable Form */}
          <div className="shelter-nav-search-wrap">
            {isSearchOpen ? (
              <form onSubmit={handleSearchSubmit} className="shelter-nav-search-form active">
                <Search size={15} className="shelter-search-icon" />
                <input
                  type="text"
                  placeholder="Search pets, applications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  onBlur={() => !searchQuery && setIsSearchOpen(false)}
                  className="shelter-nav-search-input"
                />
                <button type="button" className="shelter-search-close-btn" onClick={() => setIsSearchOpen(false)}>
                  <X size={14} />
                </button>
              </form>
            ) : (
              <button
                type="button"
                className="shelter-nav-search-icon-btn"
                onClick={() => setIsSearchOpen(true)}
                title="Search"
                aria-label="Search shelter portal"
              >
                <Search size={18} />
              </button>
            )}
          </div>

          {/* Vertical Divider matching mockup */}
          <div className="shelter-nav-v-divider" />

          {/* Shelter Staff Profile Pill & Dropdown (Matches Mockup [H] Hope & Paws Sanctuary ˅) */}
          <div className="shelter-user-dropdown-wrap">
            <button
              type="button"
              className="shelter-user-pill-btn"
              onClick={() => toggleDropdown('user')}
              aria-expanded={openDropdown === 'user'}
              aria-label="Shelter user account menu"
            >
              <div className="shelter-user-avatar">
                {logoUrl ? (
                  <img src={logoUrl} alt={shelterName} />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              <span className="shelter-user-name-single">{shelterName}</span>
              <ChevronDown size={14} className={`shelter-chevron ${openDropdown === 'user' ? 'rotated' : ''}`} />
            </button>

            {openDropdown === 'user' && (
              <div className="shelter-dropdown-menu shelter-user-menu">
                <div className="shelter-user-dropdown-header">
                  <div className="header-shelter-title">{shelterName}</div>
                  <div className="header-shelter-sub">NGO License: #{regNo}</div>
                </div>
                <div className="shelter-dropdown-divider" />
                <Link to="/shelter-dashboard?tab=profile" className="shelter-dropdown-item" onClick={() => setOpenDropdown(null)}>
                  <Building2 size={15} />
                  <span>Shelter Profile &amp; KYC</span>
                </Link>
                <Link to="/shelter-dashboard?tab=pets" className="shelter-dropdown-item" onClick={() => setOpenDropdown(null)}>
                  <PawPrint size={15} />
                  <span>Manage Pet Listings</span>
                </Link>
                <Link to="/shelter-dashboard?tab=applications" className="shelter-dropdown-item" onClick={() => setOpenDropdown(null)}>
                  <FileText size={15} />
                  <span>Adoption Applications</span>
                </Link>
                <Link to="/" className="shelter-dropdown-item" onClick={() => setOpenDropdown(null)}>
                  <ExternalLink size={15} />
                  <span>Public Portal</span>
                </Link>
                <div className="shelter-dropdown-divider" />
                <button
                  type="button"
                  className="shelter-dropdown-item logout"
                  onClick={() => {
                    setOpenDropdown(null);
                    logout();
                    navigate('/login');
                  }}
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            className="shelter-mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

        </div>

      </div>

      {/* 4. Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="shelter-mobile-drawer">
          <div className="shelter-mobile-nav-list">
            <Link
              to="/shelter-dashboard?tab=overview"
              className={`shelter-mobile-link ${isOverview ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <LayoutGrid size={18} /> Overview
            </Link>
            <Link
              to="/shelter-dashboard?tab=pets"
              className={`shelter-mobile-link ${currentTab === 'pets' ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <PawPrint size={18} /> Manage Pets
            </Link>
            <Link
              to="/pets/new"
              className="shelter-mobile-link highlight"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Plus size={18} /> Add New Pet
            </Link>
            <Link
              to="/shelter-dashboard?tab=applications"
              className={`shelter-mobile-link ${currentTab === 'applications' ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <FileText size={18} /> Adoption Applications
            </Link>
            <Link
              to="/shelter-dashboard?tab=visits"
              className={`shelter-mobile-link ${currentTab === 'visits' ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Calendar size={18} /> Meet &amp; Greets
            </Link>
            <Link
              to="/messages"
              className={`shelter-mobile-link ${location.pathname === '/messages' ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <MessageSquare size={18} /> Messages
            </Link>
            <Link
              to="/shelter-dashboard?tab=profile"
              className={`shelter-mobile-link ${currentTab === 'profile' ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Building2 size={18} /> Shelter Profile &amp; KYC
            </Link>
            <div className="shelter-mobile-divider" />
            <button
              type="button"
              className="shelter-mobile-link logout"
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
                navigate('/login');
              }}
            >
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </div>
      )}

    </header>
  );
};

export default ShelterNavbar;
