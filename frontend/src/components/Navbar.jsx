import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { PawPrint, Heart, LogOut, Menu, X, User, PlusCircle, FileText, Sparkles, CheckSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import '../styles/navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, isAdopter, isShelter, isAdmin, logout, favoriteIds } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        {/* Brand */}
        <Link to="/" className="navbar-brand" onClick={closeMobile}>
          <div className="brand-icon-box">
            <PawPrint size={22} />
          </div>
          <div>Paw<span>Connect</span></div>
        </Link>

        {/* Main Navigation Links: Only Home, About, Contact as requested */}
        <ul className={`navbar-links ${mobileOpen ? 'mobile-open' : ''}`}>
          <li>
            <a
              href="/#home"
              className="nav-link"
              onClick={(e) => {
                if (window.location.pathname === '/') {
                  e.preventDefault();
                  document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
                }
                closeMobile();
              }}
            >
              Home
            </a>
          </li>
          <li>
            <a
              href="/#about"
              className="nav-link"
              onClick={(e) => {
                if (window.location.pathname === '/') {
                  e.preventDefault();
                  document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                }
                closeMobile();
              }}
            >
              About
            </a>
          </li>
          <li>
            <a
              href="/#contact"
              className="nav-link"
              onClick={(e) => {
                if (window.location.pathname === '/') {
                  e.preventDefault();
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                }
                closeMobile();
              }}
            >
              Contact
            </a>
          </li>

          {/* Role-specific quick links in mobile menu */}
          {isAuthenticated && isAdopter && (
            <>
              <li>
                <NavLink to="/my-applications" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
                  My Applications
                </NavLink>
              </li>
              <li>
                <NavLink to="/adopter-dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
                  Adopter Dashboard
                </NavLink>
              </li>
            </>
          )}

          {isAuthenticated && isShelter && (
            <>
              <li>
                <NavLink to="/shelter-dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
                  Shelter Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/pets/new" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
                  + Add New Pet
                </NavLink>
              </li>
            </>
          )}

          {isAuthenticated && isAdmin && (
            <li>
              <NavLink to="/admin-dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
                🛡️ Admin Dashboard
              </NavLink>
            </li>
          )}
        </ul>

        {/* Action Controls */}
        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              {isAdopter && (
                <Link
                  to="/adopter-dashboard"
                  className="icon-btn"
                  title="Favorite Pets"
                  style={{ color: favoriteIds.length > 0 ? '#EF4444' : 'inherit' }}
                >
                  <Heart size={20} fill={favoriteIds.length > 0 ? '#EF4444' : 'none'} />
                  {favoriteIds.length > 0 && <span className="icon-badge">{favoriteIds.length}</span>}
                </Link>
              )}

              {isShelter && (
                <Link to="/pets/new" className="btn btn-secondary btn-sm" style={{ display: 'none', md: 'inline-flex' }}>
                  <PlusCircle size={16} /> Add Pet
                </Link>
              )}

              {isAdmin && (
                <Link to="/admin-dashboard" className="btn btn-primary btn-sm" style={{ background: '#0F3223', borderColor: '#D4AF37', color: '#F7E9B8' }}>
                  🛡️ Admin Hub
                </Link>
              )}

              <NotificationDropdown />

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Link
                  to={isAdmin ? '/admin-dashboard' : isShelter ? '/shelter-dashboard' : '/adopter-dashboard'}
                  className="user-menu-btn"
                  title="Go to Dashboard"
                >
                  <div className="user-avatar-circle" style={isAdmin ? { background: '#0F3223', color: '#D4AF37', border: '1px solid #D4AF37' } : undefined}>
                    {isAdmin ? 'A' : user?.name ? user.name.charAt(0).toUpperCase() : <User size={14} />}
                  </div>
                  <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {isAdmin ? 'Admin' : user?.name?.split(' ')[0] || 'Account'}
                  </span>
                  <span className="user-role-tag">{user?.role}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="icon-btn"
                  title="Log out"
                  style={{ color: '#EF4444' }}
                >
                  <LogOut size={18} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Link to="/login" className="btn btn-outline btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}

          {/* Mobile hamburger button */}
          <button
            className="mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
