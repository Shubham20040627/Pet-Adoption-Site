import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  PawPrint, LayoutDashboard, FileText, Heart, Sparkles, CheckSquare, 
  PlusCircle, Building, Calendar, LogOut, Compass, Home, X, Menu, 
  User, ChevronRight, ShieldCheck, ExternalLink, Bell, Layers, BookOpen, Coins, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
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
          <Link to="/admin-dashboard" className="portal-mobile-brand">
            <div className="portal-brand-icon" style={{ background: '#14382A', border: '1px solid #D4AF37' }}>
              <ShieldCheck size={18} color="#D4AF37" />
            </div>
            <span className="portal-brand-text" style={{ color: '#FFFFFF' }}>PawConnect <span style={{ color: '#D4AF37' }}>Admin</span></span>
          </Link>
        ) : (
          <Link to="/" className="portal-mobile-brand">
            <div className="portal-brand-icon">
              <PawPrint size={18} />
            </div>
            <span className="portal-brand-text">Paw<span>Connect</span></span>
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
            <Link to="/admin-dashboard" className="portal-admin-brand-link" onClick={closeMobile}>
              <div className="portal-admin-paw-box">
                <PawPrint size={22} color="#FFFFFF" strokeWidth={2.4} />
              </div>
              <div className="portal-admin-brand-text">
                <div className="portal-admin-brand-title">PawConnect</div>
                <div className="portal-admin-brand-subtitle">PLATFORM ADMIN</div>
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
            <Link to="/" className="portal-adopter-brand-link" onClick={closeMobile}>
              <div className="portal-adopter-paw-icon">
                <PawPrint size={20} color="#FFFFFF" strokeWidth={2.2} />
              </div>
              <div className="portal-adopter-brand-text">
                <div className="portal-adopter-brand-title">PawConnect</div>
                <div className="portal-adopter-brand-subtitle">Pet Adoption Portal</div>
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
        ) : (
          <div className="portal-sidebar-shelter-header">
            <Link to="/shelter-dashboard?tab=overview" className="portal-shelter-brand-link" onClick={closeMobile}>
              <div className="portal-shelter-paw-icon">
                <PawPrint size={20} color="#FFFFFF" strokeWidth={2.2} />
              </div>
              <div className="portal-shelter-brand-text">
                <div className="portal-shelter-brand-title">PawConnect</div>
                <div className="portal-shelter-brand-subtitle">Shelter Portal</div>
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
                    <Clock size={18} strokeWidth={2} className="nav-icon" />
                    <span className="nav-label">Shelter Approvals</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin-dashboard?tab=all"
                    className={`portal-nav-item ${
                      location.pathname === '/admin-dashboard' && currentTab === 'all'
                        ? 'active all-shelters-active'
                        : ''
                    }`}
                    onClick={closeMobile}
                  >
                    <Building size={18} strokeWidth={2} className="nav-icon" />
                    <span className="nav-label">All Shelters</span>
                  </Link>
                </li>
              </ul>

              <div className="portal-nav-section-title" style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
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

              {/* Admin Footer Badge */}
              <div className="portal-admin-user-card">
                <div className="portal-admin-avatar">
                  <ShieldCheck size={18} color="#D4AF37" />
                </div>
                <div className="portal-admin-user-info">
                  <div className="portal-admin-user-name">Platform Admin</div>
                  <div className="portal-admin-user-email">{user?.email || 'admin@pawconnect.org'}</div>
                </div>
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
