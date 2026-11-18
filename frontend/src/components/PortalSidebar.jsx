import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  PawPrint, LayoutDashboard, FileText, Heart, Sparkles, CheckSquare, 
  PlusCircle, Building, Calendar, LogOut, Compass, Home, X, Menu, 
  User, ChevronRight, ShieldCheck, ExternalLink, Bell, Layers, BookOpen, Coins, Clock, MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import PawConnectLogo from './PawConnectLogo';
import '../styles/portal-sidebar.css';

const PortalSidebar = () => {
  const { user, isAdopter, isShelter, logout, favoriteIds, unreadCount } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isAdminPortal = location.pathname.startsWith('/admin-dashboard') || user?.role === 'admin';

  // Determine which portal is active based on path and role
  const isShelterPortal = 
    !isAdminPortal && (
      location.pathname.startsWith('/shelter-dashboard') ||
      location.pathname === '/pets/new' ||
      /^\/pets\/[^/]+\/edit/.test(location.pathname) ||
      isShelter
    );

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeMobile = () => setMobileDrawerOpen(false);

  // Active tab helper when on dashboard
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || (isAdminPortal ? 'pending' : 'applications');

  return (
    <>
      {/* Mobile Portal Topbar (visible only on screens < 992px) */}
      <header className="portal-mobile-topbar">
        <button 
          className="portal-mobile-btn" 
          onClick={() => setMobileDrawerOpen(true)}
          aria-label="Open portal navigation"
        >
          <Menu size={22} />
        </button>

        {isAdminPortal ? (
          <Link to="/admin-dashboard" className="portal-mobile-brand" style={{ textDecoration: 'none' }}>
            <PawConnectLogo size="sm" variant="full" theme="admin" />
          </Link>
        ) : (
          <Link to="/" className="portal-mobile-brand" style={{ textDecoration: 'none' }}>
            <PawConnectLogo size="sm" variant="full" theme="light" />
          </Link>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {!isAdminPortal && <NotificationDropdown placement="bottom" />}
          <div className="portal-user-avatar-mini" title={user?.name || 'Admin'} style={isAdminPortal ? { background: '#D4AF37', color: '#091912' } : {}}>
            {isAdminPortal ? <ShieldCheck size={14} /> : (user?.name ? user.name.charAt(0).toUpperCase() : <User size={14} />)}
          </div>
        </div>
      </header>

      {/* Mobile Backdrop Overlay */}
      {mobileDrawerOpen && (
        <div 
          className="portal-backdrop" 
          onClick={closeMobile}
          aria-hidden="true" 
        />
      )}

      {/* Main Left Sidebar */}
      <aside className={`portal-sidebar ${isAdminPortal ? 'admin-theme' : isShelterPortal ? 'shelter-theme' : ''} ${mobileDrawerOpen ? 'mobile-open' : ''}`}>
        {/* Top: Brand & Portal Badge */}
        {isAdminPortal ? (
          <div className="portal-sidebar-admin-header">
            <Link to="/admin-dashboard" className="portal-admin-brand-link" onClick={closeMobile} style={{ textDecoration: 'none' }}>
              <div className="portal-admin-paw-box">
                <svg viewBox="0 0 32 32" width="28" height="28" fill="#0066FF">
                  <ellipse cx="8.5" cy="8.5" rx="3.2" ry="4.4" transform="rotate(-18 8.5 8.5)" />
                  <ellipse cx="23.5" cy="8.5" rx="3.2" ry="4.4" transform="rotate(18 23.5 8.5)" />
                  <ellipse cx="12.5" cy="5.2" rx="3" ry="4.2" transform="rotate(-6 12.5 5.2)" />
                  <ellipse cx="19.5" cy="5.2" rx="3" ry="4.2" transform="rotate(6 19.5 5.2)" />
                  <path d="M16 11 C10 11 6.5 16.5 8 21.5 C9.5 26.5 13.5 27.5 16 27.5 C18.5 27.5 22.5 26.5 24 21.5 C25.5 16.5 22 11 16 11 Z" />
                </svg>
              </div>
              <div className="portal-admin-brand-text">
                <span className="portal-admin-brand-title">PawConnect</span>
                <span className="portal-admin-brand-subtitle">Animal Adoption Platform</span>
              </div>
            </Link>
            <button 
              className="portal-sidebar-close" 
              onClick={closeMobile}
              aria-label="Close portal navigation"
              style={{ color: '#FFFFFF' }}
            >
              <X size={20} />
            </button>
          </div>
        ) : !isShelterPortal ? (
          <div className="portal-sidebar-adopter-header">
            <Link to="/" className="portal-adopter-brand-link" onClick={closeMobile} style={{ textDecoration: 'none' }}>
              <PawConnectLogo size="md" variant="full" theme="dark" showSubtitle subtitleText="Pet Adoption Portal" />
            </Link>
            <button 
              className="portal-sidebar-close" 
              onClick={closeMobile}
              aria-label="Close portal navigation"
              style={{ color: '#FFFFFF' }}
            >
              <X size={20} />
            </button>
          </div>
        ) : (
          <div className="portal-sidebar-shelter-header">
            <Link to="/shelter-dashboard?tab=overview" className="portal-shelter-brand-link" onClick={closeMobile} style={{ textDecoration: 'none' }}>
              <PawConnectLogo size="md" variant="full" theme="dark" showSubtitle subtitleText="Shelter Portal" />
            </Link>
            <button 
              className="portal-sidebar-close" 
              onClick={closeMobile}
              aria-label="Close portal navigation"
              style={{ color: '#FFFFFF' }}
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Navigation Content (Scrollable) */}
        <div className="portal-sidebar-nav-container">
          {isAdminPortal ? (
            /* ADMIN PORTAL NAVIGATION - MATCHING REFERENCE IMAGE */
            <>
              <div className="portal-nav-section-title">
                SHELTER GOVERNANCE
              </div>
              <ul className="portal-nav-list">
                <li>
                  <Link
                    to="/admin-dashboard?tab=pending"
                    className={`portal-nav-item ${
                      location.pathname === '/admin-dashboard' && (!currentTab || currentTab === 'pending')
                        ? 'active'
                        : ''
                    }`}
                    onClick={closeMobile}
                  >
                    <ShieldCheck size={18} strokeWidth={2} className="nav-icon" />
                    <span className="nav-label">Shelter Approvals</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin-dashboard?tab=all"
                    className={`portal-nav-item ${
                      location.pathname === '/admin-dashboard' && currentTab === 'all'
                        ? 'active'
                        : ''
                    }`}
                    onClick={closeMobile}
                  >
                    <Building size={18} strokeWidth={2} className="nav-icon" />
                    <span className="nav-label">All Shelters</span>
                  </Link>
                </li>
              </ul>

              <div className="portal-nav-section-title" style={{ marginTop: '2.5rem' }}>
                ADMIN CONTROLS
              </div>
              <ul className="portal-nav-list">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobile();
                      handleLogout();
                    }}
                    className="portal-nav-item portal-logout-btn"
                  >
                    <LogOut size={18} strokeWidth={2} className="nav-icon" />
                    <span className="nav-label">Sign Out</span>
                  </button>
                </li>
              </ul>

              {/* Bottom Pet Silhouette Graphic matching reference image */}
              <div className="portal-admin-bottom-illustration" aria-hidden="true">
                <svg viewBox="0 0 250 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="portal-admin-silhouette-svg">
                  <path d="M0,90 Q125,55 250,85 L250,120 L0,120 Z" fill="#0C2044" />
                  <path d="M0,96 Q110,72 250,94 L250,120 L0,120 Z" fill="#0E2856" />
                  {/* Cat silhouette */}
                  <g fill="#17346A">
                    <path d="M48,90 C46,90 42,84 42,73 C42,64 46,58 51,55 L49,46 L56,51 C58,50 62,50 64,51 L71,46 L69,55 C74,58 78,64 78,73 C78,84 74,90 72,90 Z" />
                    <path d="M42,80 C36,78 34,84 37,88 C40,92 44,90 44,90" stroke="#17346A" strokeWidth="4" strokeLinecap="round" fill="none" />
                  </g>
                  {/* Dog silhouette */}
                  <g fill="#1E4285">
                    <path d="M92,92 C88,92 83,83 83,66 C83,50 89,40 98,34 L95,23 L104,29 C108,27 115,27 119,29 L128,23 L125,34 C134,40 140,50 140,66 C140,83 135,92 131,92 Z" />
                    <path d="M134,73 C142,76 146,68 144,62" stroke="#1E4285" strokeWidth="5" strokeLinecap="round" fill="none" />
                  </g>
                </svg>
              </div>
            </>
          ) : isShelterPortal ? (
            /* SHELTER PORTAL NAVIGATION - MATCHING REFERENCE IMAGE */
            <>
              <ul className="portal-nav-list">
              <li>
                <Link
                  to="/shelter-dashboard?tab=overview"
                  className={`portal-nav-item ${
                    (location.pathname === '/shelter-dashboard' || location.pathname === '/shelter_dashboard') &&
                    (!currentTab || currentTab === 'overview')
                      ? 'active'
                      : ''
                  }`}
                  onClick={closeMobile}
                >
                  <LayoutDashboard size={18} strokeWidth={1.8} className="nav-icon" />
                  <span className="nav-label">Overview</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/shelter-dashboard?tab=pets"
                  className={`portal-nav-item ${
                    (location.pathname === '/shelter-dashboard' || location.pathname === '/shelter_dashboard') &&
                    currentTab === 'pets'
                      ? 'active'
                      : ''
                  }`}
                  onClick={closeMobile}
                >
                  <PawPrint size={18} strokeWidth={1.8} className="nav-icon" />
                  <span className="nav-label">Pet Management</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/pets/new"
                  className={`portal-nav-item ${location.pathname === '/pets/new' ? 'active' : ''}`}
                  onClick={closeMobile}
                >
                  <PlusCircle size={18} strokeWidth={1.8} className="nav-icon" />
                  <span className="nav-label">Add New Pet</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/shelter-dashboard?tab=applications"
                  className={`portal-nav-item ${
                    (location.pathname === '/shelter-dashboard' || location.pathname === '/shelter_dashboard') &&
                    currentTab === 'applications'
                      ? 'active'
                      : ''
                  }`}
                  onClick={closeMobile}
                >
                  <FileText size={18} strokeWidth={1.8} className="nav-icon" />
                  <span className="nav-label">Applications</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/shelter-dashboard?tab=visits"
                  className={`portal-nav-item ${
                    (location.pathname === '/shelter-dashboard' || location.pathname === '/shelter_dashboard') &&
                    currentTab === 'visits'
                      ? 'active'
                      : ''
                  }`}
                  onClick={closeMobile}
                >
                  <Calendar size={18} strokeWidth={1.8} className="nav-icon" />
                  <span className="nav-label">Meet &amp; Greets</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/messages"
                  className={`portal-nav-item ${location.pathname === '/messages' ? 'active' : ''}`}
                  onClick={closeMobile}
                >
                  <MessageSquare size={18} strokeWidth={1.8} className="nav-icon" />
                  <span className="nav-label">Messages</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/shelter-dashboard?tab=notifications"
                  className={`portal-nav-item ${
                    (location.pathname === '/shelter-dashboard' || location.pathname === '/shelter_dashboard') &&
                    currentTab === 'notifications'
                      ? 'active'
                      : ''
                  }`}
                  onClick={closeMobile}
                >
                  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                    <Bell size={18} strokeWidth={1.8} className="nav-icon" />
                    {unreadCount > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: -2,
                          right: -2,
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          backgroundColor: '#E11D48',
                        }}
                      />
                    )}
                  </div>
                  <span className="nav-label">Notifications</span>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: '#DC2626',
                        color: '#FFFFFF',
                        padding: '0.1rem 0.45rem',
                        borderRadius: 9999,
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  to="/shelter-dashboard?tab=profile"
                  className={`portal-nav-item ${
                    (location.pathname === '/shelter-dashboard' || location.pathname === '/shelter_dashboard') &&
                    currentTab === 'profile'
                      ? 'active'
                      : ''
                  }`}
                  onClick={closeMobile}
                >
                  <Building size={18} strokeWidth={1.8} className="nav-icon" />
                  <span className="nav-label">Shelter Profile</span>
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    closeMobile();
                    handleLogout();
                  }}
                  className="portal-nav-item portal-logout-btn"
                >
                  <LogOut size={18} strokeWidth={1.8} className="nav-icon" />
                  <span className="nav-label">Logout</span>
                </button>
              </li>
            </ul>

            {/* Shelter Status Card in Sidebar */}
            <div className="portal-shelter-status-card">
              <div className="portal-shelter-status-header">
                <span className="portal-shelter-status-title">Status</span>
                <span className={`portal-shelter-pill ${(user?.status === 'approved' || user?.shelter?.status === 'approved' || user?.verified || user?.shelter?.verified) ? 'approved' : 'pending'}`}>
                  {(user?.status === 'approved' || user?.shelter?.status === 'approved' || user?.verified || user?.shelter?.verified) ? (
                    <>
                      <ShieldCheck size={12} /> Approved
                    </>
                  ) : (
                    <>
                      <Clock size={12} /> Pending Review
                    </>
                  )}
                </span>
              </div>
              <div className="portal-shelter-status-text">
                {(user?.status === 'approved' || user?.shelter?.status === 'approved' || user?.verified || user?.shelter?.verified)
                  ? 'All public listings, adoptions & features are active.'
                  : 'Dashboard access granted. Waiting for admin approval.'}
              </div>
            </div>
          </>
          ) : (
            /* ADOPTER PORTAL NAVIGATION - MATCHING REFERENCE IMAGE */
            <>
              <ul className="portal-nav-list">
                <li>
                  <Link
                    to="/adopter-dashboard?tab=overview"
                    className={`portal-nav-item ${
                      (location.pathname === '/adopter-dashboard' || location.pathname === '/adopter_dashboard') &&
                      (!currentTab || currentTab === 'overview')
                        ? 'active'
                        : ''
                    }`}
                    onClick={closeMobile}
                  >
                    <LayoutDashboard size={18} strokeWidth={1.8} className="nav-icon" />
                    <span className="nav-label">Overview</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/pets"
                    className={`portal-nav-item ${
                      location.pathname.startsWith('/pets') &&
                      !location.pathname.includes('/new') &&
                      !location.pathname.includes('/edit')
                        ? 'active'
                        : ''
                    }`}
                    onClick={closeMobile}
                  >
                    <Compass size={18} strokeWidth={1.8} className="nav-icon" />
                    <span className="nav-label">Browse Pets</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/my-applications"
                    className={`portal-nav-item ${
                      location.pathname === '/my-applications' ||
                      ((location.pathname === '/adopter-dashboard' || location.pathname === '/adopter_dashboard') && currentTab === 'applications')
                        ? 'active'
                        : ''
                    }`}
                    onClick={closeMobile}
                  >
                    <FileText size={18} strokeWidth={1.8} className="nav-icon" />
                    <span className="nav-label">My Applications</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/adopter-dashboard?tab=visits"
                    className={`portal-nav-item ${
                      (location.pathname === '/adopter-dashboard' || location.pathname === '/adopter_dashboard') && currentTab === 'visits'
                        ? 'active'
                        : ''
                    }`}
                    onClick={closeMobile}
                  >
                    <Calendar size={18} strokeWidth={1.8} className="nav-icon" />
                    <span className="nav-label">Meet & Greets</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/messages"
                    className={`portal-nav-item ${location.pathname === '/messages' ? 'active' : ''}`}
                    onClick={closeMobile}
                  >
                    <MessageSquare size={18} strokeWidth={1.8} className="nav-icon" />
                    <span className="nav-label">Messages</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/adopter-dashboard?tab=favorites"
                    className={`portal-nav-item ${
                      (location.pathname === '/adopter-dashboard' || location.pathname === '/adopter_dashboard') && currentTab === 'favorites'
                        ? 'active'
                        : ''
                    }`}
                    onClick={closeMobile}
                  >
                    <Heart size={18} strokeWidth={1.8} className="nav-icon" />
                    <span className="nav-label">Favorites</span>
                    {favoriteIds?.length > 0 && (
                      <span className="portal-badge-count">{favoriteIds.length}</span>
                    )}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/compare-pets"
                    className={`portal-nav-item ${
                      location.pathname === '/compare-pets' || location.pathname === '/compare'
                        ? 'active'
                        : ''
                    }`}
                    onClick={closeMobile}
                  >
                    <Layers size={18} strokeWidth={1.8} className="nav-icon" />
                    <span className="nav-label">Compare Pets</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/adopter-dashboard?tab=profile"
                    className={`portal-nav-item ${
                      (location.pathname === '/adopter-dashboard' || location.pathname === '/adopter_dashboard') && currentTab === 'profile'
                        ? 'active'
                        : ''
                    }`}
                    onClick={closeMobile}
                  >
                    <User size={18} strokeWidth={1.8} className="nav-icon" />
                    <span className="nav-label">My Profile</span>
                  </Link>
                </li>
              </ul>

              <div className="portal-nav-section-title">Adoption Tools</div>
              <ul className="portal-nav-list">
                <li>
                  <Link
                    to="/pawmatch"
                    className={`portal-nav-item ${location.pathname === '/pawmatch' ? 'active' : ''}`}
                    onClick={closeMobile}
                  >
                    <Sparkles size={18} strokeWidth={1.8} className="nav-icon" />
                    <span className="nav-label">PawMatch Quiz</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cost-calculator"
                    className={`portal-nav-item ${location.pathname === '/cost-calculator' ? 'active' : ''}`}
                    onClick={closeMobile}
                  >
                    <Coins size={18} strokeWidth={1.8} className="nav-icon" />
                    <span className="nav-label">Cost Calculator</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/readiness-checklist"
                    className={`portal-nav-item ${location.pathname === '/readiness-checklist' ? 'active' : ''}`}
                    onClick={closeMobile}
                  >
                    <CheckSquare size={18} strokeWidth={1.8} className="nav-icon" />
                    <span className="nav-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span>Readiness Check</span>
                      {localStorage.getItem('pawconnect_readiness_verified') === 'true' && (
                        <span style={{ fontSize: '0.68rem', background: '#DCFCE7', color: '#166534', padding: '1px 6px', borderRadius: 999, fontWeight: 700 }}>
                          ✓ Verified
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    className={`portal-nav-item ${location.pathname === '/about' ? 'active' : ''}`}
                    onClick={closeMobile}
                  >
                    <BookOpen size={18} strokeWidth={1.8} className="nav-icon" />
                    <span className="nav-label">Adoption Guide</span>
                  </Link>
                </li>
              </ul>

              <div className="portal-nav-section-title" style={{ marginTop: 'auto', paddingTop: '1rem' }}></div>
              <ul className="portal-nav-list">
                <li>
                  <Link
                    to="/adopter-dashboard?tab=notifications"
                    className={`portal-nav-item ${
                      (location.pathname === '/adopter-dashboard' || location.pathname === '/adopter_dashboard') && currentTab === 'notifications'
                        ? 'active'
                        : ''
                    }`}
                    onClick={closeMobile}
                  >
                    <Bell size={18} strokeWidth={1.8} className="nav-icon" />
                    <span className="nav-label">Notifications</span>
                    {unreadCount > 0 && (
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: '#DC2626',
                          color: '#FFFFFF',
                          padding: '0.1rem 0.45rem',
                          borderRadius: 9999,
                        }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobile();
                      handleLogout();
                    }}
                    className="portal-nav-item"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--portal-text-muted)',
                    }}
                  >
                    <LogOut size={18} strokeWidth={1.8} className="nav-icon" />
                    <span className="nav-label">Logout</span>
                  </button>
                </li>
              </ul>

              {/* Bottom Adopter Promo Pill */}
              <Link to="/pets" className="portal-sidebar-promo-card" onClick={closeMobile}>
                <span className="promo-dog-avatar">🐶</span>
                <span className="promo-dog-text">Give a pet<br />a better tomorrow</span>
                <ChevronRight size={16} className="promo-dog-arrow" />
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  );
};

export default PortalSidebar;
